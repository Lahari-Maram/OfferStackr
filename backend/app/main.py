import csv
import hashlib
import io
import os
import random
import re
import uuid
from datetime import date, datetime, timedelta
from pathlib import Path
from statistics import mean
from typing import Any

from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File, status
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import asc, desc, or_, text, inspect
from sqlalchemy.orm import Session

from app.database import engine, Base, get_db
from app import models, schemas
from app.security import hash_password, verify_password, create_access_token, verify_access_token, oauth2_scheme
from app.email_service import send_password_reset_otp_email, send_reminder_email

app = FastAPI(
    title="OfferStackr API",
    description="Full-stack job-search management and career acceleration platform",
    version="2.0.0"
)

ENVIRONMENT = os.getenv("ENVIRONMENT", os.getenv("ENV", "development")).lower()
raw_origins = os.getenv("ALLOWED_ORIGINS", os.getenv("CORS_ORIGINS", "")).strip()

if raw_origins:
    allowed_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
    allow_credentials = True
elif ENVIRONMENT == "production":
    allowed_origins = []
    allow_credentials = True
else:
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:80",
        "http://localhost",
        "*"
    ]
    allow_credentials = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"]
)

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads" / "resumes"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
APPLICATION_RESUME_DIR = Path(__file__).resolve().parent.parent / "uploads" / "application_resumes"
APPLICATION_RESUME_DIR.mkdir(parents=True, exist_ok=True)

# ================= SAFE INCREMENTAL DB MIGRATION =================

def migrate_existing_db():
    """
    Safely inspects existing SQLite tables, adds missing columns, creates missing tables,
    and backfills interview/assessment data without deleting or replacing any rows.
    """
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    # 1. Check and migrate 'users' table
    if "users" in tables:
        cols = {c["name"] for c in inspector.get_columns("users")}
        with engine.begin() as conn:
            if "weekly_goal" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN weekly_goal INTEGER NOT NULL DEFAULT 10"))
            if "created_at" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN created_at DATETIME"))
                
    # 2. Check and migrate 'jobs' table
    if "jobs" in tables:
        cols = {c["name"] for c in inspector.get_columns("jobs")}
        new_cols = {
            "tags": "VARCHAR",
            "priority": "VARCHAR NOT NULL DEFAULT 'Medium'",
            "work_mode": "VARCHAR",
            "employment_type": "VARCHAR",
            "location": "VARCHAR",
            "salary": "VARCHAR",
            "recruiter_name": "VARCHAR",
            "recruiter_email": "VARCHAR",
            "recruiter_linkedin": "VARCHAR",
            "recruiter_phone": "VARCHAR",
            "recruiter_notes": "TEXT",
            "assessment_name": "VARCHAR",
            "assessment_date": "DATE",
            "assessment_time": "VARCHAR",
            "assessment_type": "VARCHAR",
            "assessment_platform": "VARCHAR",
            "assessment_url": "VARCHAR",
            "assessment_notes": "TEXT",
            "assessment_completed": "INTEGER NOT NULL DEFAULT 0",
            "interview_time": "VARCHAR",
            "interview_round": "VARCHAR",
            "interview_type": "VARCHAR",
            "interview_interviewer": "VARCHAR",
            "interview_url": "VARCHAR",
            "interview_location": "VARCHAR",
            "interview_prep_notes": "TEXT",
            "reminder_offsets": "VARCHAR",
        }
        with engine.begin() as conn:
            for col_name, col_type in new_cols.items():
                if col_name not in cols:
                    try:
                        conn.execute(text(f"ALTER TABLE jobs ADD COLUMN {col_name} {col_type}"))
                    except Exception as e:
                        print(f"Column migration notice for {col_name}: {e}")

    # 3. Create any new tables (interviews, assessments, reminders, user_notes, etc.)
    Base.metadata.create_all(bind=engine)

    # 4. Safe backfill for existing jobs' interview and assessment records
    try:
        db = next(get_db())
        jobs = db.query(models.Job).all()
        for j in jobs:
            # Backfill interview if job has interview_date and no interview records yet
            if j.interview_date:
                existing_interview = db.query(models.Interview).filter(models.Interview.job_id == j.id).first()
                if not existing_interview:
                    db.add(models.Interview(
                        job_id=j.id,
                        user_id=j.user_id,
                        round_name=j.interview_round or "Interview Round 1",
                        interview_date=j.interview_date,
                        interview_time=j.interview_time,
                        interview_type=j.interview_type or "Video",
                        interviewer=j.interview_interviewer,
                        interview_url=j.job_url,
                        location=j.location,
                        prep_notes=j.interview_prep_notes,
                        status="Completed" if j.interview_date < date.today() else "Scheduled"
                    ))
            # Backfill assessment if job has assessment_date and no assessment records yet
            if j.assessment_date or j.assessment_name:
                existing_assessment = db.query(models.Assessment).filter(models.Assessment.job_id == j.id).first()
                if not existing_assessment:
                    db.add(models.Assessment(
                        job_id=j.id,
                        user_id=j.user_id,
                        name=j.assessment_name or f"{j.company} Assessment",
                        assessment_date=j.assessment_date or j.applied_date,
                        assessment_time=j.assessment_time,
                        assessment_type=j.assessment_type or "Online assessment",
                        platform=j.assessment_platform or "Platform",
                        assessment_url=j.assessment_url,
                        notes=j.assessment_notes,
                        completed=j.assessment_completed or 0
                    ))
        db.commit()
    except Exception as e:
        print(f"Backfill notice: {e}")

migrate_existing_db()

# ================= HELPERS & DEPENDENCIES =================

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    email = verify_access_token(token)
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def add_event(db: Session, user_id: int, job_id: int | None, event_type: str, description: str):
    event = models.ApplicationEvent(
        user_id=user_id,
        job_id=job_id,
        event_type=event_type,
        description=description,
        created_at=datetime.utcnow()
    )
    db.add(event)

def serialize_user(user: models.User):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "weekly_goal": user.weekly_goal or 10,
        "has_resume": user.resume is not None,
        "created_at": user.created_at
    }

def normalize_status(status_str: str | None) -> str:
    if not status_str:
        return "Applied"
    s = status_str.strip().lower()
    if "saved" in s or "wishlist" in s:
        return "Saved"
    if "assessment" in s or "online test" in s or "oa" in s:
        return "Assessment"
    if "interview" in s:
        return "Interview"
    if "offer" in s or "selected" in s:
        return "Offer"
    if "reject" in s:
        return "Rejected"
    if "withdraw" in s:
        return "Withdrawn"
    return "Applied"

def _validate_resume_upload(file: UploadFile):
    allowed = {
        "application/pdf": ".pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
        "application/msword": ".doc"
    }
    ext = Path(file.filename or "").suffix.lower()
    if file.content_type not in allowed and ext not in {".pdf", ".docx", ".doc"}:
        raise HTTPException(status_code=400, detail="Only PDF, DOCX or DOC resume files are allowed")
    return ext

# ================= ROOT & INFO =================

@app.get("/")
def home():
    return {
        "message": "Welcome to OfferStackr API!",
        "version": "2.0.0",
        "status": "online"
    }

@app.get("/about")
def about():
    return {
        "project": "OfferStackr",
        "version": "2.0.0",
        "author": "Lahari",
        "features": [
            "full job application pipeline",
            "kanban board & list views",
            "multiple interview rounds",
            "assessment tracking",
            "smart reminder system",
            "resume vault & application resumes",
            "real metrics & analytics",
            "goals & streaks",
            "gamified achievements",
            "OTP password reset",
            "CSV import & export"
        ]
    }

# ================= AUTHENTICATION =================

@app.post("/signup", response_model=schemas.UserResponse, tags=["Authentication"])
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    
    new_user = models.User(
        name=user.name.strip(),
        email=user.email.strip().lower(),
        hashed_password=hash_password(user.password),
        weekly_goal=10,
        created_at=datetime.utcnow()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return serialize_user(new_user)

@app.post("/login", response_model=schemas.Token, tags=["Authentication"])
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    email = form_data.username.strip().lower()
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/profile", response_model=schemas.UserResponse, tags=["Profile"])
def get_profile(current_user: models.User = Depends(get_current_user)):
    return serialize_user(current_user)

@app.put("/profile", response_model=schemas.UserResponse, tags=["Profile"])
def update_profile(profile_data: schemas.UpdateProfile, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_email = profile_data.email.strip().lower()
    existing = db.query(models.User).filter(models.User.email == new_email, models.User.id != current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="This email is already associated with another account")
    
    current_user.name = profile_data.name.strip()
    current_user.email = new_email
    db.commit()
    db.refresh(current_user)
    return serialize_user(current_user)

@app.put("/change-password", response_model=schemas.MessageResponse, tags=["Profile"])
def change_password(data: schemas.ChangePassword, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    current_user.hashed_password = hash_password(data.new_password)
    db.commit()
    add_event(db, current_user.id, None, "password_changed", "Account password was updated")
    return {"message": "Password changed successfully"}

@app.post("/forgot-password", response_model=schemas.MessageResponse, tags=["Authentication"])
def forgot_password(data: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = data.email.strip().lower()
    user = db.query(models.User).filter(models.User.email == email).first()
    
    # Always return success message to prevent user enumeration attacks
    if not user:
        return {"message": "If this email is registered, a 6-digit verification code has been sent."}
    
    # Rate limiting: Invalidate older unused OTPs for this email
    db.query(models.PasswordResetOTP).filter(
        models.PasswordResetOTP.email == email,
        models.PasswordResetOTP.used == 0
    ).update({"used": 1})
    
    # Generate 6-digit OTP
    otp_code = f"{random.randint(100000, 999999)}"
    otp_hash = hashlib.sha256(otp_code.encode()).hexdigest()
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    otp_record = models.PasswordResetOTP(
        email=email,
        otp_hash=otp_hash,
        expires_at=expires_at,
        attempts=0,
        used=0,
        created_at=datetime.utcnow()
    )
    db.add(otp_record)
    db.commit()
    
    # Send email (or log in dev mode)
    try:
        send_password_reset_otp_email(to_email=email, otp_code=otp_code, name=user.name)
    except Exception as email_err:
        print(f"[ERROR] Could not dispatch OTP email to {email}: {email_err}")
    
    return {"message": "If this email is registered, a 6-digit verification code has been sent."}

@app.post("/verify-otp", response_model=schemas.MessageResponse, tags=["Authentication"])
def verify_otp(data: schemas.VerifyOTPRequest, db: Session = Depends(get_db)):
    email = data.email.strip().lower()
    otp_hash = hashlib.sha256(data.otp.strip().encode()).hexdigest()
    
    record = db.query(models.PasswordResetOTP).filter(
        models.PasswordResetOTP.email == email,
        models.PasswordResetOTP.used == 0
    ).order_by(desc(models.PasswordResetOTP.id)).first()
    
    if not record:
        raise HTTPException(status_code=400, detail="No active OTP found. Please request a new code.")
    
    if record.attempts >= 5:
        record.used = 1
        db.commit()
        raise HTTPException(status_code=400, detail="Too many invalid attempts. Please request a new OTP.")
    
    if datetime.utcnow() > record.expires_at:
        record.used = 1
        db.commit()
        raise HTTPException(status_code=400, detail="This verification code has expired. Please request a new one.")
    
    if record.otp_hash != otp_hash:
        record.attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    return {"message": "OTP verified successfully"}

@app.post("/reset-password-otp", response_model=schemas.MessageResponse, tags=["Authentication"])
def reset_password_with_otp(data: schemas.ResetPasswordWithOTP, db: Session = Depends(get_db)):
    email = data.email.strip().lower()
    otp_hash = hashlib.sha256(data.otp.strip().encode()).hexdigest()
    
    record = db.query(models.PasswordResetOTP).filter(
        models.PasswordResetOTP.email == email,
        models.PasswordResetOTP.used == 0
    ).order_by(desc(models.PasswordResetOTP.id)).first()
    
    if not record or record.otp_hash != otp_hash or datetime.utcnow() > record.expires_at:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.hashed_password = hash_password(data.new_password)
    record.used = 1
    db.commit()
    
    add_event(db, user.id, None, "password_reset", "Password was reset using OTP verification")
    return {"message": "Password reset successfully. You can now log in with your new password."}

# ================= JOBS PIPELINE =================

# Static routes declared before /jobs/{job_id} to prevent path conflicts
@app.get("/jobs/search", response_model=list[schemas.JobResponse], tags=["Jobs"])
def search_jobs(keyword: str = Query(...), current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    kw = f"%{keyword.strip()}%"
    return db.query(models.Job).filter(
        models.Job.user_id == current_user.id,
        or_(
            models.Job.company.ilike(kw),
            models.Job.role.ilike(kw),
            models.Job.tags.ilike(kw),
            models.Job.recruiter_name.ilike(kw),
            models.Job.location.ilike(kw),
            models.Job.notes.ilike(kw)
        )
    ).all()

@app.get("/jobs/filter", response_model=list[schemas.JobResponse], tags=["Jobs"])
def filter_jobs(
    status: str | None = None,
    priority: str | None = None,
    work_mode: str | None = None,
    employment_type: str | None = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(models.Job).filter(models.Job.user_id == current_user.id)
    if status and status.lower() != "all":
        q = q.filter(models.Job.status.ilike(f"%{status}%"))
    if priority and priority.lower() != "all":
        q = q.filter(models.Job.priority == priority)
    if work_mode and work_mode.lower() != "all":
        q = q.filter(models.Job.work_mode == work_mode)
    if employment_type and employment_type.lower() != "all":
        q = q.filter(models.Job.employment_type == employment_type)
    return q.all()

@app.get("/jobs/sort", response_model=list[schemas.JobResponse], tags=["Jobs"])
def sort_jobs(by: str = "date", order: str = "desc", current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(models.Job).filter(models.Job.user_id == current_user.id)
    is_asc = order.lower() == "asc"
    
    if by == "company":
        q = q.order_by(asc(models.Job.company) if is_asc else desc(models.Job.company))
    elif by == "role":
        q = q.order_by(asc(models.Job.role) if is_asc else desc(models.Job.role))
    elif by == "status":
        q = q.order_by(asc(models.Job.status) if is_asc else desc(models.Job.status))
    elif by == "priority":
        q = q.order_by(asc(models.Job.priority) if is_asc else desc(models.Job.priority))
    elif by == "follow_up":
        q = q.order_by(asc(models.Job.follow_up_date) if is_asc else desc(models.Job.follow_up_date))
    else:  # date
        q = q.order_by(asc(models.Job.applied_date) if is_asc else desc(models.Job.applied_date))
        
    return q.all()

@app.get("/jobs/stats", response_model=schemas.JobStatistics, tags=["Jobs"])
def job_statistics(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    jobs = db.query(models.Job).filter(models.Job.user_id == current_user.id).all()
    counts = {"saved": 0, "applied": 0, "assessment": 0, "interview": 0, "offer": 0, "rejected": 0, "withdrawn": 0}
    for j in jobs:
        norm = normalize_status(j.status).lower()
        if norm in counts:
            counts[norm] += 1
        else:
            counts["applied"] += 1
    return counts

@app.get("/jobs/upcoming-interviews", response_model=list[schemas.JobResponse], tags=["Dashboard"])
def upcoming_interviews(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    return db.query(models.Job).filter(
        models.Job.user_id == current_user.id,
        models.Job.interview_date >= today
    ).order_by(asc(models.Job.interview_date)).all()

@app.get("/jobs/upcoming-followups", response_model=list[schemas.JobResponse], tags=["Dashboard"])
def upcoming_followups(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    return db.query(models.Job).filter(
        models.Job.user_id == current_user.id,
        models.Job.follow_up_date >= today,
        models.Job.follow_up_status != "Completed"
    ).order_by(asc(models.Job.follow_up_date)).all()

@app.get("/jobs/export/csv", tags=["Jobs"])
def export_jobs_csv(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    jobs = db.query(models.Job).filter(models.Job.user_id == current_user.id).order_by(desc(models.Job.id)).all()
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        "Company", "Role", "Portal", "Status", "Priority", "Work Mode", "Employment Type",
        "Location", "Salary", "Applied Date", "Interview Date", "Follow-up Date", "Follow-up Status",
        "Recruiter Name", "Recruiter Email", "Recruiter Phone", "Recruiter LinkedIn",
        "Tags", "Job URL", "Notes"
    ])
    
    for j in jobs:
        writer.writerow([
            j.company or "",
            j.role or "",
            j.portal or "",
            j.status or "Applied",
            j.priority or "Medium",
            j.work_mode or "",
            j.employment_type or "",
            j.location or "",
            j.salary or "",
            j.applied_date or "",
            j.interview_date or "",
            j.follow_up_date or "",
            j.follow_up_status or "Pending",
            j.recruiter_name or "",
            j.recruiter_email or "",
            j.recruiter_phone or "",
            j.recruiter_linkedin or "",
            j.tags or "",
            j.job_url or "",
            j.notes or ""
        ])
        
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=offerstackr_applications.csv"}
    )

@app.post("/jobs/import/csv", response_model=schemas.CSVImportResponse, tags=["Jobs"])
async def import_csv(file: UploadFile = File(...), current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "Please upload a valid .csv file")
    
    raw = await file.read()
    try:
        text_data = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        try:
            text_data = raw.decode("latin-1")
        except Exception:
            raise HTTPException(400, "Could not decode CSV file. Please make sure it is UTF-8 encoded.")
            
    reader = csv.DictReader(io.StringIO(text_data))
    imported_count = 0
    skipped_count = 0
    errors = []

    def get_val(row, *possible_keys):
        for k in possible_keys:
            for row_k, row_v in row.items():
                if row_k and row_k.strip().lower() == k.strip().lower():
                    if row_v and row_v.strip():
                        return row_v.strip()
        return None

    def parse_date(v):
        if not v:
            return None
        clean = v.strip()[:10]
        try:
            return date.fromisoformat(clean)
        except Exception:
            for fmt in ("%m/%d/%Y", "%d/%m/%Y", "%Y/%m/%d", "%d-%m-%Y"):
                try:
                    return datetime.strptime(clean, fmt).date()
                except Exception:
                    pass
            return None

    row_index = 1
    for row in reader:
        row_index += 1
        company = get_val(row, "company", "company name", "organization")
        if not company:
            skipped_count += 1
            errors.append(f"Row {row_index}: Missing required Company name")
            continue
            
        role = get_val(row, "role", "job title", "title", "position")
        portal = get_val(row, "portal", "source", "platform")
        status = get_val(row, "status", "stage") or "Applied"
        priority = get_val(row, "priority") or "Medium"
        work_mode = get_val(row, "work mode", "work_mode", "mode")
        employment_type = get_val(row, "employment type", "employment_type", "type")
        location = get_val(row, "location", "city")
        salary = get_val(row, "salary", "compensation")
        applied_date = parse_date(get_val(row, "applied date", "applied_date", "date applied", "application date"))
        interview_date = parse_date(get_val(row, "interview date", "interview_date"))
        follow_up_date = parse_date(get_val(row, "follow-up date", "follow_up_date", "follow up date"))
        follow_up_status = get_val(row, "follow-up status", "follow_up_status", "follow up status") or "Pending"
        recruiter_name = get_val(row, "recruiter name", "recruiter_name", "recruiter")
        recruiter_email = get_val(row, "recruiter email", "recruiter_email")
        recruiter_phone = get_val(row, "recruiter phone", "recruiter_phone")
        recruiter_linkedin = get_val(row, "recruiter linkedin", "recruiter_linkedin")
        tags = get_val(row, "tags", "tag")
        job_url = get_val(row, "job url", "job_url", "url", "link")
        notes = get_val(row, "notes", "note", "comments")

        job = models.Job(
            company=company,
            role=role,
            portal=portal,
            status=status,
            priority=priority,
            work_mode=work_mode,
            employment_type=employment_type,
            location=location,
            salary=salary,
            applied_date=applied_date or date.today(),
            interview_date=interview_date,
            follow_up_date=follow_up_date,
            follow_up_status=follow_up_status,
            recruiter_name=recruiter_name,
            recruiter_email=recruiter_email,
            recruiter_phone=recruiter_phone,
            recruiter_linkedin=recruiter_linkedin,
            tags=tags,
            job_url=job_url,
            notes=notes,
            user_id=current_user.id
        )
        db.add(job)
        db.flush()
        
        add_event(db, current_user.id, job.id, "imported", f"Imported {company} application from CSV")
        imported_count += 1

    db.commit()
    return {
        "message": f"Successfully imported {imported_count} application(s).",
        "imported_count": imported_count,
        "skipped_count": skipped_count,
        "errors": errors[:10]  # First 10 errors if any
    }

# ================= CRUD JOBS =================

@app.post("/jobs", response_model=schemas.JobMutationResponse, tags=["Jobs"])
def create_job(job: schemas.JobCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    data = job.model_dump()
    new_job = models.Job(**data, user_id=current_user.id)
    db.add(new_job)
    db.flush()
    
    add_event(db, current_user.id, new_job.id, "created", f"Created application for {new_job.company}")
    
    # If interview details provided during creation, create initial Interview round
    if new_job.interview_date:
        interview = models.Interview(
            job_id=new_job.id,
            user_id=current_user.id,
            round_name=new_job.interview_round or "Interview Round 1",
            interview_date=new_job.interview_date,
            interview_time=new_job.interview_time,
            interview_type=new_job.interview_type or "Video",
            interviewer=new_job.interview_interviewer,
            interview_url=new_job.interview_url or new_job.job_url,
            location=new_job.interview_location or new_job.location,
            prep_notes=new_job.interview_prep_notes,
            status="Scheduled"
        )
        db.add(interview)
        
    # If assessment details provided during creation, create initial Assessment
    if new_job.assessment_name or new_job.assessment_date:
        assessment = models.Assessment(
            job_id=new_job.id,
            user_id=current_user.id,
            name=new_job.assessment_name or f"{new_job.company} Assessment",
            assessment_date=new_job.assessment_date or new_job.applied_date,
            assessment_time=new_job.assessment_time,
            assessment_type=new_job.assessment_type or "Online assessment",
            platform=new_job.assessment_platform or "Platform",
            assessment_url=new_job.assessment_url,
            notes=new_job.assessment_notes,
            completed=new_job.assessment_completed or 0
        )
        db.add(assessment)

    db.commit()
    return {"message": "Job application added successfully!", "job_id": new_job.id}

@app.get("/jobs", response_model=list[schemas.JobResponse], tags=["Jobs"])
def get_jobs(
    page: int = Query(1, ge=1),
    limit: int = Query(500, ge=1, le=1000),
    sort: str = Query("desc"),
    search: str | None = None,
    status: str | None = None,
    priority: str | None = None,
    work_mode: str | None = None,
    employment_type: str | None = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(models.Job).filter(models.Job.user_id == current_user.id)
    
    if search:
        kw = f"%{search.strip()}%"
        q = q.filter(or_(
            models.Job.company.ilike(kw),
            models.Job.role.ilike(kw),
            models.Job.portal.ilike(kw),
            models.Job.tags.ilike(kw),
            models.Job.recruiter_name.ilike(kw),
            models.Job.location.ilike(kw)
        ))
        
    if status and status.lower() != "all":
        q = q.filter(models.Job.status.ilike(f"%{status}%"))
    if priority and priority.lower() != "all":
        q = q.filter(models.Job.priority == priority)
    if work_mode and work_mode.lower() != "all":
        q = q.filter(models.Job.work_mode == work_mode)
    if employment_type and employment_type.lower() != "all":
        q = q.filter(models.Job.employment_type == employment_type)
        
    q = q.order_by(asc(models.Job.id) if sort.lower() == "asc" else desc(models.Job.id))
    return q.offset((page - 1) * limit).limit(limit).all()

@app.get("/jobs/{job_id}", response_model=schemas.JobResponse, tags=["Jobs"])
def get_job(job_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id, models.Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@app.put("/jobs/{job_id}", response_model=schemas.MessageResponse, tags=["Jobs"])
def update_job(job_id: int, job_update: schemas.JobUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(models.Job).filter(models.Job.id == job_id, models.Job.user_id == current_user.id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Job not found")
    
    old_status = existing.status
    for k, v in job_update.model_dump().items():
        setattr(existing, k, v)
        
    if old_status != existing.status:
        add_event(db, current_user.id, existing.id, "status_change", f"Status changed from {old_status or 'Unknown'} to {existing.status or 'Unknown'}")
        
    add_event(db, current_user.id, existing.id, "updated", f"Updated details for {existing.company}")
    db.commit()
    return {"message": "Job application updated successfully!"}

@app.patch("/jobs/{job_id}/status", response_model=schemas.MessageResponse, tags=["Jobs"])
def update_job_status(job_id: int, data: schemas.JobStatusUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id, models.Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    old_status = job.status
    job.status = data.status
    add_event(db, current_user.id, job.id, "status_change", f"Moved status from '{old_status or 'None'}' to '{data.status}'")
    db.commit()
    return {"message": f"Updated status to {data.status}"}

@app.post("/jobs/{job_id}/duplicate", response_model=schemas.JobMutationResponse, tags=["Jobs"])
def duplicate_job(job_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    orig = db.query(models.Job).filter(models.Job.id == job_id, models.Job.user_id == current_user.id).first()
    if not orig:
        raise HTTPException(status_code=404, detail="Job not found")
    
    clone = models.Job(
        company=f"{orig.company} (Copy)",
        role=orig.role,
        portal=orig.portal,
        status="Applied",
        applied_date=date.today(),
        job_url=orig.job_url,
        notes=orig.notes,
        tags=orig.tags,
        priority=orig.priority,
        work_mode=orig.work_mode,
        employment_type=orig.employment_type,
        location=orig.location,
        salary=orig.salary,
        recruiter_name=orig.recruiter_name,
        recruiter_email=orig.recruiter_email,
        recruiter_phone=orig.recruiter_phone,
        recruiter_linkedin=orig.recruiter_linkedin,
        user_id=current_user.id
    )
    db.add(clone)
    db.flush()
    add_event(db, current_user.id, clone.id, "created", f"Duplicated application from {orig.company}")
    db.commit()
    return {"message": "Application duplicated successfully!", "job_id": clone.id}

@app.delete("/jobs/{job_id}", response_model=schemas.MessageResponse, tags=["Jobs"])
def delete_job(job_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id, models.Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    company_name = job.company
    add_event(db, current_user.id, None, "deleted", f"Deleted application for {company_name}")
    db.delete(job)
    db.commit()
    return {"message": f"Application for {company_name} deleted successfully"}

# ================= MULTIPLE INTERVIEW ROUNDS =================

@app.get("/interviews", response_model=list[schemas.InterviewResponse], tags=["Interviews"])
def get_all_interviews(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    interviews = db.query(models.Interview).filter(models.Interview.user_id == current_user.id).order_by(asc(models.Interview.interview_date)).all()
    results = []
    for it in interviews:
        job = db.query(models.Job).filter(models.Job.id == it.job_id).first()
        res = schemas.InterviewResponse.model_validate(it)
        if job:
            res.company = job.company
            res.role = job.role
        results.append(res)
    return results

@app.get("/jobs/{job_id}/interviews", response_model=list[schemas.InterviewResponse], tags=["Interviews"])
def get_job_interviews(job_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id, models.Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    
    interviews = db.query(models.Interview).filter(models.Interview.job_id == job_id).order_by(asc(models.Interview.interview_date)).all()
    results = []
    for it in interviews:
        res = schemas.InterviewResponse.model_validate(it)
        res.company = job.company
        res.role = job.role
        results.append(res)
    return results

@app.post("/jobs/{job_id}/interviews", response_model=schemas.InterviewResponse, tags=["Interviews"])
def add_interview_round(job_id: int, data: schemas.InterviewCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id, models.Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    
    interview = models.Interview(
        job_id=job.id,
        user_id=current_user.id,
        round_name=data.round_name,
        interview_date=data.interview_date,
        interview_time=data.interview_time,
        interview_type=data.interview_type,
        interviewer=data.interviewer,
        interview_url=data.interview_url,
        location=data.location,
        status=data.status or "Scheduled",
        prep_notes=data.prep_notes,
        result_notes=data.result_notes,
        created_at=datetime.utcnow()
    )
    db.add(interview)
    
    # Auto-update job status and interview date
    if data.interview_date and (not job.interview_date or data.interview_date >= date.today()):
        job.interview_date = data.interview_date
        job.interview_time = data.interview_time
        job.interview_round = data.round_name
    if job.status in ("Applied", "Saved"):
        job.status = "Interview"
        
    add_event(db, current_user.id, job.id, "interview_scheduled", f"Scheduled {data.round_name} for {job.company}")
    db.commit()
    db.refresh(interview)
    
    res = schemas.InterviewResponse.model_validate(interview)
    res.company = job.company
    res.role = job.role
    return res

@app.put("/interviews/{interview_id}", response_model=schemas.InterviewResponse, tags=["Interviews"])
def update_interview(interview_id: int, data: schemas.InterviewUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    it = db.query(models.Interview).filter(models.Interview.id == interview_id, models.Interview.user_id == current_user.id).first()
    if not it:
        raise HTTPException(404, "Interview not found")
    
    for k, v in data.model_dump().items():
        if k != "job_id":
            setattr(it, k, v)
            
    db.commit()
    db.refresh(it)
    
    job = db.query(models.Job).filter(models.Job.id == it.job_id).first()
    res = schemas.InterviewResponse.model_validate(it)
    if job:
        res.company = job.company
        res.role = job.role
    return res

@app.patch("/interviews/{interview_id}/complete", response_model=schemas.MessageResponse, tags=["Interviews"])
def complete_interview(interview_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    it = db.query(models.Interview).filter(models.Interview.id == interview_id, models.Interview.user_id == current_user.id).first()
    if not it:
        raise HTTPException(404, "Interview not found")
    
    it.status = "Completed" if it.status != "Completed" else "Scheduled"
    job = db.query(models.Job).filter(models.Job.id == it.job_id).first()
    if job:
        add_event(db, current_user.id, job.id, "interview_completed", f"Marked {it.round_name} at {job.company} as {it.status}")
    db.commit()
    return {"message": f"Interview status updated to {it.status}"}

@app.delete("/interviews/{interview_id}", response_model=schemas.MessageResponse, tags=["Interviews"])
def delete_interview(interview_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    it = db.query(models.Interview).filter(models.Interview.id == interview_id, models.Interview.user_id == current_user.id).first()
    if not it:
        raise HTTPException(404, "Interview not found")
    
    db.delete(it)
    db.commit()
    return {"message": "Interview round deleted successfully"}

# ================= ASSESSMENTS TRACKING =================

@app.get("/assessments", response_model=list[schemas.AssessmentResponse], tags=["Assessments"])
def get_all_assessments(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    assessments = db.query(models.Assessment).filter(models.Assessment.user_id == current_user.id).order_by(asc(models.Assessment.assessment_date)).all()
    results = []
    for a in assessments:
        job = db.query(models.Job).filter(models.Job.id == a.job_id).first() if a.job_id else None
        res = schemas.AssessmentResponse.model_validate(a)
        if job:
            res.company = job.company
            res.role = job.role
        results.append(res)
    return results

@app.get("/jobs/{job_id}/assessments", response_model=list[schemas.AssessmentResponse], tags=["Assessments"])
def get_job_assessments(job_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id, models.Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    
    assessments = db.query(models.Assessment).filter(models.Assessment.job_id == job_id).order_by(asc(models.Assessment.assessment_date)).all()
    results = []
    for a in assessments:
        res = schemas.AssessmentResponse.model_validate(a)
        res.company = job.company
        res.role = job.role
        results.append(res)
    return results

@app.post("/assessments", response_model=schemas.AssessmentResponse, tags=["Assessments"])
@app.post("/jobs/{job_id}/assessments", response_model=schemas.AssessmentResponse, tags=["Assessments"])
def create_assessment(data: schemas.AssessmentCreate, job_id: int | None = None, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    target_job_id = job_id or data.job_id
    company_name = "Application"
    
    if target_job_id:
        job = db.query(models.Job).filter(models.Job.id == target_job_id, models.Job.user_id == current_user.id).first()
        if not job:
            raise HTTPException(404, "Associated job not found")
        company_name = job.company
        if job.status in ("Applied", "Saved"):
            job.status = "Assessment"
            
    assessment = models.Assessment(
        job_id=target_job_id,
        user_id=current_user.id,
        name=data.name,
        assessment_date=data.assessment_date,
        assessment_time=data.assessment_time,
        assessment_type=data.assessment_type or "Coding test",
        platform=data.platform or "HackerRank",
        assessment_url=data.assessment_url,
        notes=data.notes,
        completed=data.completed or 0,
        created_at=datetime.utcnow()
    )
    db.add(assessment)
    add_event(db, current_user.id, target_job_id, "assessment_added", f"Added assessment '{data.name}' for {company_name}")
    db.commit()
    db.refresh(assessment)
    
    res = schemas.AssessmentResponse.model_validate(assessment)
    res.company = company_name
    return res

@app.put("/assessments/{assessment_id}", response_model=schemas.AssessmentResponse, tags=["Assessments"])
def update_assessment(assessment_id: int, data: schemas.AssessmentUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    a = db.query(models.Assessment).filter(models.Assessment.id == assessment_id, models.Assessment.user_id == current_user.id).first()
    if not a:
        raise HTTPException(404, "Assessment not found")
    
    for k, v in data.model_dump().items():
        if k != "job_id":
            setattr(a, k, v)
            
    db.commit()
    db.refresh(a)
    
    job = db.query(models.Job).filter(models.Job.id == a.job_id).first() if a.job_id else None
    res = schemas.AssessmentResponse.model_validate(a)
    if job:
        res.company = job.company
        res.role = job.role
    return res

@app.patch("/assessments/{assessment_id}/toggle", response_model=schemas.MessageResponse, tags=["Assessments"])
def toggle_assessment_completed(assessment_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    a = db.query(models.Assessment).filter(models.Assessment.id == assessment_id, models.Assessment.user_id == current_user.id).first()
    if not a:
        raise HTTPException(404, "Assessment not found")
    
    a.completed = 0 if a.completed == 1 else 1
    state = "Completed" if a.completed == 1 else "Pending"
    job = db.query(models.Job).filter(models.Job.id == a.job_id).first() if a.job_id else None
    
    if job:
        add_event(db, current_user.id, job.id, "assessment_status", f"Assessment '{a.name}' marked as {state}")
        
    db.commit()
    return {"message": f"Assessment marked as {state}"}

@app.delete("/assessments/{assessment_id}", response_model=schemas.MessageResponse, tags=["Assessments"])
def delete_assessment(assessment_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    a = db.query(models.Assessment).filter(models.Assessment.id == assessment_id, models.Assessment.user_id == current_user.id).first()
    if not a:
        raise HTTPException(404, "Assessment not found")
    
    db.delete(a)
    db.commit()
    return {"message": "Assessment deleted successfully"}

# ================= REMINDERS =================

@app.get("/reminders", tags=["Reminders"])
def get_reminders(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    horizon = today + timedelta(days=14)
    out = []
    
    # 1. Custom reminders from 'reminders' table
    custom_reminders = db.query(models.Reminder).filter(
        models.Reminder.user_id == current_user.id
    ).order_by(asc(models.Reminder.reminder_date)).all()
    
    for r in custom_reminders:
        job = db.query(models.Job).filter(models.Job.id == r.job_id).first() if r.job_id else None
        out.append({
            "id": r.id,
            "is_custom": True,
            "type": r.reminder_type,
            "title": r.title,
            "message": r.title,
            "date": str(r.reminder_date),
            "time": r.reminder_time or "09:00",
            "offsets": r.offsets or "24h,1h",
            "status": r.status,
            "company": job.company if job else "General",
            "role": job.role if job else None,
            "job_id": r.job_id,
            "notes": r.notes
        })
        
    # 2. Upcoming interviews
    interviews = db.query(models.Interview).filter(
        models.Interview.user_id == current_user.id,
        models.Interview.interview_date >= today,
        models.Interview.interview_date <= horizon,
        models.Interview.status == "Scheduled"
    ).all()
    
    for it in interviews:
        job = db.query(models.Job).filter(models.Job.id == it.job_id).first()
        comp = job.company if job else "Company"
        out.append({
            "id": f"it-{it.id}",
            "is_custom": False,
            "type": "interview",
            "title": f"{it.round_name} with {comp}",
            "message": f"{it.round_name} scheduled with {comp}",
            "date": str(it.interview_date),
            "time": it.interview_time or "10:00",
            "offsets": "24h,1h",
            "status": "Pending",
            "company": comp,
            "role": job.role if job else None,
            "job_id": it.job_id,
            "notes": it.prep_notes
        })
        
    # 3. Upcoming assessments
    assessments = db.query(models.Assessment).filter(
        models.Assessment.user_id == current_user.id,
        models.Assessment.assessment_date >= today,
        models.Assessment.assessment_date <= horizon,
        models.Assessment.completed == 0
    ).all()
    
    for a in assessments:
        job = db.query(models.Job).filter(models.Job.id == a.job_id).first() if a.job_id else None
        comp = job.company if job else "Online Test"
        out.append({
            "id": f"ass-{a.id}",
            "is_custom": False,
            "type": "assessment",
            "title": f"Assessment: {a.name} ({comp})",
            "message": f"Assessment '{a.name}' due for {comp}",
            "date": str(a.assessment_date),
            "time": a.assessment_time or "23:59",
            "offsets": "24h,2h",
            "status": "Pending",
            "company": comp,
            "role": job.role if job else None,
            "job_id": a.job_id,
            "notes": a.notes
        })
        
    # 4. Upcoming follow-ups from jobs table
    jobs = db.query(models.Job).filter(
        models.Job.user_id == current_user.id,
        models.Job.follow_up_date >= today,
        models.Job.follow_up_date <= horizon,
        models.Job.follow_up_status != "Completed"
    ).all()
    
    for j in jobs:
        out.append({
            "id": f"fup-{j.id}",
            "is_custom": False,
            "type": "follow-up",
            "title": f"Follow up with {j.company}",
            "message": f"Follow up on application for {j.company}",
            "date": str(j.follow_up_date),
            "time": "11:00",
            "offsets": "24h",
            "status": "Pending",
            "company": j.company,
            "role": j.role,
            "job_id": j.id,
            "notes": j.notes
        })
        
    return sorted(out, key=lambda x: x["date"])

@app.post("/reminders", response_model=schemas.ReminderResponse, tags=["Reminders"])
def create_reminder(data: schemas.ReminderCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    company_name = None
    role_name = None
    if data.job_id:
        job = db.query(models.Job).filter(models.Job.id == data.job_id, models.Job.user_id == current_user.id).first()
        if job:
            company_name = job.company
            role_name = job.role
            
    reminder = models.Reminder(
        user_id=current_user.id,
        job_id=data.job_id,
        title=data.title,
        reminder_type=data.reminder_type or "custom",
        reminder_date=data.reminder_date,
        reminder_time=data.reminder_time,
        offsets=data.offsets or "24h,1h",
        status=data.status or "Pending",
        notes=data.notes,
        created_at=datetime.utcnow()
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    
    res = schemas.ReminderResponse.model_validate(reminder)
    res.company = company_name
    res.role = role_name
    return res

@app.put("/reminders/{reminder_id}", response_model=schemas.ReminderResponse, tags=["Reminders"])
def update_reminder(reminder_id: int, data: schemas.ReminderUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    r = db.query(models.Reminder).filter(models.Reminder.id == reminder_id, models.Reminder.user_id == current_user.id).first()
    if not r:
        raise HTTPException(404, "Reminder not found")
    
    for k, v in data.model_dump().items():
        setattr(r, k, v)
        
    db.commit()
    db.refresh(r)
    return schemas.ReminderResponse.model_validate(r)

@app.patch("/reminders/{reminder_id}/status", response_model=schemas.MessageResponse, tags=["Reminders"])
def set_reminder_status(reminder_id: int, status_update: schemas.JobStatusUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    r = db.query(models.Reminder).filter(models.Reminder.id == reminder_id, models.Reminder.user_id == current_user.id).first()
    if not r:
        raise HTTPException(404, "Reminder not found")
    
    r.status = status_update.status
    db.commit()
    return {"message": f"Reminder status updated to {status_update.status}"}

@app.delete("/reminders/{reminder_id}", response_model=schemas.MessageResponse, tags=["Reminders"])
def delete_reminder(reminder_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    r = db.query(models.Reminder).filter(models.Reminder.id == reminder_id, models.Reminder.user_id == current_user.id).first()
    if not r:
        raise HTTPException(404, "Reminder not found")
    
    db.delete(r)
    db.commit()
    return {"message": "Reminder deleted successfully"}

# ================= USER NOTES =================

@app.get("/notes", response_model=list[schemas.UserNoteResponse], tags=["Notes"])
def get_user_notes(category: str | None = None, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(models.UserNote).filter(models.UserNote.user_id == current_user.id)
    if category and category.lower() != "all":
        q = q.filter(models.UserNote.category == category)
        
    notes = q.order_by(desc(models.UserNote.updated_at)).all()
    results = []
    for n in notes:
        job = db.query(models.Job).filter(models.Job.id == n.job_id).first() if n.job_id else None
        res = schemas.UserNoteResponse.model_validate(n)
        if job:
            res.company = job.company
        results.append(res)
    return results

@app.post("/notes", response_model=schemas.UserNoteResponse, tags=["Notes"])
def create_note(data: schemas.UserNoteCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    company_name = None
    if data.job_id:
        job = db.query(models.Job).filter(models.Job.id == data.job_id, models.Job.user_id == current_user.id).first()
        if job:
            company_name = job.company
            
    note = models.UserNote(
        user_id=current_user.id,
        job_id=data.job_id,
        title=data.title.strip(),
        content=data.content.strip(),
        category=data.category or "General",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    
    res = schemas.UserNoteResponse.model_validate(note)
    res.company = company_name
    return res

@app.put("/notes/{note_id}", response_model=schemas.UserNoteResponse, tags=["Notes"])
def update_note(note_id: int, data: schemas.UserNoteUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    note = db.query(models.UserNote).filter(models.UserNote.id == note_id, models.UserNote.user_id == current_user.id).first()
    if not note:
        raise HTTPException(404, "Note not found")
    
    note.title = data.title.strip()
    note.content = data.content.strip()
    note.category = data.category or "General"
    note.job_id = data.job_id
    note.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(note)
    
    job = db.query(models.Job).filter(models.Job.id == note.job_id).first() if note.job_id else None
    res = schemas.UserNoteResponse.model_validate(note)
    if job:
        res.company = job.company
    return res

@app.delete("/notes/{note_id}", response_model=schemas.MessageResponse, tags=["Notes"])
def delete_note(note_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    note = db.query(models.UserNote).filter(models.UserNote.id == note_id, models.UserNote.user_id == current_user.id).first()
    if not note:
        raise HTTPException(404, "Note not found")
    
    db.delete(note)
    db.commit()
    return {"message": "Note deleted successfully"}

# ================= RESUMES =================

@app.post("/jobs/{job_id}/resume", response_model=schemas.ApplicationResumeResponse, tags=["Resume"])
async def upload_application_resume(job_id: int, file: UploadFile = File(...), current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id, models.Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(404, "Job not found")
        
    ext = _validate_resume_upload(file)
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(400, "Resume file size must be 5 MB or smaller")
        
    old = job.application_resume
    if old:
        old_path = APPLICATION_RESUME_DIR / old.stored_filename
        if old_path.exists():
            old_path.unlink()
        db.delete(old)
        db.flush()
        
    stored = f"{current_user.id}_{job.id}_{uuid.uuid4().hex}{ext}"
    (APPLICATION_RESUME_DIR / stored).write_bytes(data)
    
    resume = models.ApplicationResume(
        job_id=job.id,
        user_id=current_user.id,
        original_filename=file.filename or "resume",
        stored_filename=stored,
        content_type=file.content_type or "application/octet-stream",
        size_bytes=len(data)
    )
    db.add(resume)
    add_event(db, current_user.id, job.id, "resume_attached", f"Attached resume {file.filename} to {job.company}")
    db.commit()
    db.refresh(resume)
    return resume

@app.get("/jobs/{job_id}/resume", response_model=schemas.ApplicationResumeResponse, tags=["Resume"])
def get_application_resume(job_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id, models.Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    if not job.application_resume:
        raise HTTPException(404, "No resume attached to this application")
    return job.application_resume

@app.get("/jobs/{job_id}/resume/download", tags=["Resume"])
def download_application_resume(job_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id, models.Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    resume = job.application_resume
    if not resume:
        raise HTTPException(404, "No resume attached to this application")
    path = APPLICATION_RESUME_DIR / resume.stored_filename
    if not path.exists():
        raise HTTPException(404, "Resume file not found on disk")
    return FileResponse(path, media_type=resume.content_type, filename=resume.original_filename)

@app.delete("/jobs/{job_id}/resume", response_model=schemas.MessageResponse, tags=["Resume"])
def delete_application_resume(job_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id, models.Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    resume = job.application_resume
    if not resume:
        raise HTTPException(404, "No resume attached to this application")
    path = APPLICATION_RESUME_DIR / resume.stored_filename
    if path.exists():
        path.unlink()
    db.delete(resume)
    add_event(db, current_user.id, job.id, "resume_detached", f"Removed resume {resume.original_filename} from {job.company}")
    db.commit()
    return {"message": "Application resume deleted successfully"}

@app.post("/resume", response_model=schemas.ResumeResponse, tags=["Resume"])
async def upload_resume(file: UploadFile = File(...), current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ext = _validate_resume_upload(file)
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(400, "Resume file size must be 5 MB or smaller")
        
    old = current_user.resume
    if old:
        old_path = UPLOAD_DIR / old.stored_filename
        if old_path.exists():
            old_path.unlink()
        db.delete(old)
        db.flush()
        
    stored = f"{current_user.id}_{uuid.uuid4().hex}{ext}"
    (UPLOAD_DIR / stored).write_bytes(data)
    
    resume = models.Resume(
        user_id=current_user.id,
        original_filename=file.filename or "resume",
        stored_filename=stored,
        content_type=file.content_type or "application/octet-stream",
        size_bytes=len(data)
    )
    db.add(resume)
    add_event(db, current_user.id, None, "resume_uploaded", f"Uploaded master resume {file.filename}")
    db.commit()
    db.refresh(resume)
    return resume

@app.get("/resume", response_model=schemas.ResumeResponse, tags=["Resume"])
def get_resume(current_user: models.User = Depends(get_current_user)):
    if not current_user.resume:
        raise HTTPException(404, "No master resume uploaded")
    return current_user.resume

@app.get("/resume/download", tags=["Resume"])
def download_resume(current_user: models.User = Depends(get_current_user)):
    if not current_user.resume:
        raise HTTPException(404, "No master resume uploaded")
    path = UPLOAD_DIR / current_user.resume.stored_filename
    if not path.exists():
        raise HTTPException(404, "Resume file not found on disk")
    return FileResponse(path, media_type=current_user.resume.content_type, filename=current_user.resume.original_filename)

@app.delete("/resume", response_model=schemas.MessageResponse, tags=["Resume"])
def delete_resume(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    resume = current_user.resume
    if not resume:
        raise HTTPException(404, "No master resume uploaded")
    path = UPLOAD_DIR / resume.stored_filename
    if path.exists():
        path.unlink()
    db.delete(resume)
    add_event(db, current_user.id, None, "resume_deleted", f"Deleted master resume {resume.original_filename}")
    db.commit()
    return {"message": "Master resume deleted successfully"}

# ================= DASHBOARD & ANALYTICS =================

@app.get("/dashboard", response_model=schemas.DashboardResponse, tags=["Dashboard"])
def get_dashboard(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    start_of_week = today - timedelta(days=today.weekday())
    jobs = db.query(models.Job).filter(models.Job.user_id == current_user.id).all()
    
    counts = {"saved": 0, "applied": 0, "assessment": 0, "interview": 0, "offer": 0, "rejected": 0, "withdrawn": 0}
    for j in jobs:
        norm = normalize_status(j.status).lower()
        if norm in counts:
            counts[norm] += 1
        else:
            counts["applied"] += 1
            
    this_week_apps = sum(1 for j in jobs if j.applied_date and j.applied_date >= start_of_week)
    goal = current_user.weekly_goal or 10
    goal_progress = round(min((this_week_apps / goal) * 100, 100.0), 1)
    
    # Calculate streak
    dates = sorted({j.applied_date for j in jobs if j.applied_date})
    streak = 0
    cursor = today
    while cursor in dates:
        streak += 1
        cursor -= timedelta(days=1)
    if today not in dates:
        cursor = today - timedelta(days=1)
        streak = 0
        while cursor in dates:
            streak += 1
            cursor -= timedelta(days=1)
            
    upcoming_interviews_cnt = db.query(models.Interview).filter(
        models.Interview.user_id == current_user.id,
        models.Interview.interview_date >= today,
        models.Interview.status == "Scheduled"
    ).count() or db.query(models.Job).filter(
        models.Job.user_id == current_user.id,
        models.Job.interview_date >= today
    ).count()
    
    upcoming_assessments_cnt = db.query(models.Assessment).filter(
        models.Assessment.user_id == current_user.id,
        models.Assessment.assessment_date >= today,
        models.Assessment.completed == 0
    ).count()
    
    pending_followups_cnt = db.query(models.Job).filter(
        models.Job.user_id == current_user.id,
        models.Job.follow_up_date >= today,
        models.Job.follow_up_status != "Completed"
    ).count()

    return {
        "total_jobs": len(jobs),
        "saved": counts["saved"],
        "applied": counts["applied"],
        "assessment": counts["assessment"],
        "interview": counts["interview"],
        "offer": counts["offer"],
        "rejected": counts["rejected"],
        "withdrawn": counts["withdrawn"],
        "pending_followups": pending_followups_cnt,
        "upcoming_interviews_count": upcoming_interviews_cnt,
        "upcoming_assessments_count": upcoming_assessments_cnt,
        "current_streak": streak,
        "weekly_goal": goal,
        "this_week_applications": this_week_apps,
        "goal_progress": goal_progress
    }

@app.get("/dashboard/analytics", response_model=schemas.AnalyticsResponse, tags=["Dashboard"])
def get_analytics(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    start_of_week = today - timedelta(days=today.weekday())
    prev_week_start = start_of_week - timedelta(days=7)
    start_of_month = date(today.year, today.month, 1)
    
    jobs = db.query(models.Job).filter(models.Job.user_id == current_user.id).all()
    total = len(jobs)
    
    this_week = sum(1 for j in jobs if j.applied_date and j.applied_date >= start_of_week)
    last_week = sum(1 for j in jobs if j.applied_date and prev_week_start <= j.applied_date < start_of_week)
    this_month = sum(1 for j in jobs if j.applied_date and j.applied_date >= start_of_month)
    
    goal = current_user.weekly_goal or 10
    goal_progress = round(min((this_week / goal) * 100, 100.0), 1)
    
    # Calculate streak and longest streak
    dates = sorted({j.applied_date for j in jobs if j.applied_date})
    streak = 0
    cursor = today
    while cursor in dates:
        streak += 1
        cursor -= timedelta(days=1)
    if today not in dates:
        cursor = today - timedelta(days=1)
        streak = 0
        while cursor in dates:
            streak += 1
            cursor -= timedelta(days=1)
            
    longest_streak = 0
    cur_run = 0
    if dates:
        for i in range(len(dates)):
            if i == 0 or dates[i] == dates[i - 1] + timedelta(days=1):
                cur_run += 1
            else:
                cur_run = 1
            longest_streak = max(longest_streak, cur_run)
            
    # Conversions & rates
    status_counts = {"Saved": 0, "Applied": 0, "Assessment": 0, "Interview": 0, "Offer": 0, "Rejected": 0, "Withdrawn": 0}
    work_modes = {"Remote": 0, "Hybrid": 0, "On-site": 0}
    employment_types = {"Full-time": 0, "Internship": 0, "Contract": 0, "Part-time": 0}
    
    interviews_with_dates = []
    responded_count = 0
    
    for j in jobs:
        norm = normalize_status(j.status)
        status_counts[norm] = status_counts.get(norm, 0) + 1
        
        if j.work_mode and j.work_mode in work_modes:
            work_modes[j.work_mode] += 1
        if j.employment_type and j.employment_type in employment_types:
            employment_types[j.employment_type] += 1
            
        if j.interview_date and j.applied_date:
            interviews_with_dates.append((j.interview_date - j.applied_date).days)
            
        if norm in ("Assessment", "Interview", "Offer", "Rejected") or j.interview_date:
            responded_count += 1

    response_rate = round((responded_count / total * 100), 1) if total > 0 else 0.0
    interview_rate = round(((status_counts["Interview"] + status_counts["Offer"]) / total * 100), 1) if total > 0 else 0.0
    assessment_rate = round(((status_counts["Assessment"] + status_counts["Interview"] + status_counts["Offer"]) / total * 100), 1) if total > 0 else 0.0
    offer_rate = round((status_counts["Offer"] / total * 100), 1) if total > 0 else 0.0
    rejection_rate = round((status_counts["Rejected"] / total * 100), 1) if total > 0 else 0.0
    avg_days_to_interview = round(mean(interviews_with_dates), 1) if interviews_with_dates else None

    # Monthly Trend (last 6 months)
    monthly_trend = []
    for m_offset in range(5, -1, -1):
        # calculate month
        m_year = today.year
        m_month = today.month - m_offset
        while m_month <= 0:
            m_month += 12
            m_year -= 1
        m_name = date(m_year, m_month, 1).strftime("%b %Y")
        m_count = sum(1 for j in jobs if j.applied_date and j.applied_date.year == m_year and j.applied_date.month == m_month)
        monthly_trend.append({"month": m_name, "applications": m_count})

    # Weekly Activity (last 7 days)
    weekly_activity = []
    for d_offset in range(6, -1, -1):
        d = today - timedelta(days=d_offset)
        d_count = sum(1 for j in jobs if j.applied_date == d)
        weekly_activity.append({"day": d.strftime("%a"), "date": str(d), "applications": d_count})

    return {
        "total": total,
        "this_week": this_week,
        "last_week": last_week,
        "this_month": this_month,
        "week_goal": goal,
        "goal_progress": goal_progress,
        "streak": streak,
        "longest_streak": max(longest_streak, streak),
        "response_rate": response_rate,
        "interview_rate": interview_rate,
        "assessment_rate": assessment_rate,
        "offer_rate": offer_rate,
        "rejection_rate": rejection_rate,
        "avg_days_to_interview": avg_days_to_interview,
        "status_distribution": status_counts,
        "work_mode_distribution": work_modes,
        "employment_type_distribution": employment_types,
        "monthly_trend": monthly_trend,
        "weekly_activity": weekly_activity
    }

@app.get("/streak", response_model=schemas.StreakResponse, tags=["Dashboard"])
def get_streak(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    jobs = db.query(models.Job).filter(models.Job.user_id == current_user.id).all()
    dates = sorted({j.applied_date for j in jobs if j.applied_date})
    
    streak = 0
    cursor = today
    while cursor in dates:
        streak += 1
        cursor -= timedelta(days=1)
    if today not in dates:
        cursor = today - timedelta(days=1)
        streak = 0
        while cursor in dates:
            streak += 1
            cursor -= timedelta(days=1)
            
    longest_streak = 0
    cur_run = 0
    if dates:
        for i in range(len(dates)):
            if i == 0 or dates[i] == dates[i - 1] + timedelta(days=1):
                cur_run += 1
            else:
                cur_run = 1
            longest_streak = max(longest_streak, cur_run)

    return {
        "current_streak": streak,
        "longest_streak": max(longest_streak, streak),
        "total_active_days": len(dates),
        "activity_dates": [str(d) for d in dates]
    }

@app.get("/achievements", response_model=list[schemas.AchievementResponse], tags=["Dashboard"])
def get_achievements(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    jobs = db.query(models.Job).filter(models.Job.user_id == current_user.id).all()
    total_apps = len(jobs)
    
    interviews_count = db.query(models.Interview).filter(models.Interview.user_id == current_user.id).count() or sum(1 for j in jobs if j.interview_date)
    assessments_count = db.query(models.Assessment).filter(models.Assessment.user_id == current_user.id).count() or sum(1 for j in jobs if j.assessment_date)
    offers_count = sum(1 for j in jobs if normalize_status(j.status) == "Offer")
    recruiters_count = sum(1 for j in jobs if j.recruiter_name or j.recruiter_email)
    
    # Streak
    today = date.today()
    dates = sorted({j.applied_date for j in jobs if j.applied_date})
    streak = 0
    cursor = today
    while cursor in dates:
        streak += 1
        cursor -= timedelta(days=1)
    if today not in dates:
        cursor = today - timedelta(days=1)
        streak = 0
        while cursor in dates:
            streak += 1
            cursor -= timedelta(days=1)
            
    start_of_week = today - timedelta(days=today.weekday())
    this_week_apps = sum(1 for j in jobs if j.applied_date and j.applied_date >= start_of_week)
    weekly_goal = current_user.weekly_goal or 10

    definitions = [
        {"key": "first_app", "title": "First Step", "desc": "Submit your 1st job application", "icon": "🚀", "cat": "Volume", "target": 1, "cur": total_apps},
        {"key": "app_5", "title": "Gaining Momentum", "desc": "Reach 5 submitted applications", "icon": "⚡", "cat": "Volume", "target": 5, "cur": total_apps},
        {"key": "app_10", "title": "Double Digits", "desc": "Reach 10 submitted applications", "icon": "🎯", "cat": "Volume", "target": 10, "cur": total_apps},
        {"key": "app_25", "title": "Quarter Century", "desc": "Reach 25 submitted applications", "icon": "🏆", "cat": "Volume", "target": 25, "cur": total_apps},
        {"key": "app_50", "title": "Half Century", "desc": "Reach 50 submitted applications", "icon": "⭐", "cat": "Volume", "target": 50, "cur": total_apps},
        {"key": "app_100", "title": "Century Club", "desc": "Reach 100 submitted applications", "icon": "👑", "cat": "Volume", "target": 100, "cur": total_apps},
        {"key": "first_interview", "title": "Spotlight Ready", "desc": "Schedule your 1st interview round", "icon": "🎙️", "cat": "Milestone", "target": 1, "cur": interviews_count},
        {"key": "first_assessment", "title": "Test Ace", "desc": "Add or complete your 1st assessment", "icon": "💻", "cat": "Milestone", "target": 1, "cur": assessments_count},
        {"key": "first_offer", "title": "Offer Secured", "desc": "Receive your 1st official job offer", "icon": "🎉", "cat": "Milestone", "target": 1, "cur": offers_count},
        {"key": "streak_7", "title": "Streak Master", "desc": "Maintain a 7-day daily application streak", "icon": "🔥", "cat": "Consistency", "target": 7, "cur": streak},
        {"key": "weekly_goal", "title": "Goal Crusher", "desc": "Complete your weekly application goal", "icon": "✅", "cat": "Consistency", "target": weekly_goal, "cur": this_week_apps},
        {"key": "networker", "title": "Network Builder", "desc": "Add contact info for 3 recruiters", "icon": "🤝", "cat": "Networking", "target": 3, "cur": recruiters_count},
    ]

    results = []
    for d in definitions:
        unlocked = d["cur"] >= d["target"]
        prog = min(round((d["cur"] / d["target"]) * 100.0, 1), 100.0) if d["target"] > 0 else 0.0
        results.append({
            "badge_key": d["key"],
            "title": d["title"],
            "description": d["desc"],
            "icon": d["icon"],
            "category": d["cat"],
            "unlocked": unlocked,
            "unlocked_at": datetime.utcnow() if unlocked else None,
            "progress": prog,
            "target": d["target"],
            "current": d["cur"]
        })
    return results

@app.put("/goal", response_model=schemas.MessageResponse, tags=["Dashboard"])
def update_goal(data: schemas.GoalUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.weekly_goal = data.weekly_goal
    db.commit()
    add_event(db, current_user.id, None, "goal_updated", f"Updated weekly application goal to {data.weekly_goal}")
    return {"message": "Weekly goal updated successfully"}

# ================= TIMELINE & NOTIFICATIONS =================

@app.get("/timeline", response_model=list[schemas.EventResponse], tags=["Timeline"])
def timeline(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.ApplicationEvent).filter(
        models.ApplicationEvent.user_id == current_user.id
    ).order_by(desc(models.ApplicationEvent.created_at)).limit(100).all()

@app.get("/jobs/{job_id}/timeline", response_model=list[schemas.EventResponse], tags=["Timeline"])
def job_timeline(job_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.ApplicationEvent).filter(
        models.ApplicationEvent.user_id == current_user.id,
        models.ApplicationEvent.job_id == job_id
    ).order_by(desc(models.ApplicationEvent.created_at)).all()

@app.get("/notifications", response_model=list[schemas.NotificationResponse], tags=["Notifications"])
def get_notifications(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).order_by(desc(models.Notification.created_at)).limit(20).all()

@app.patch("/notifications/{notification_id}/read", response_model=schemas.MessageResponse, tags=["Notifications"])
def mark_notification_read(notification_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    n = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id
    ).first()
    if n:
        n.read = 1
        db.commit()
    return {"message": "Marked as read"}

# ================= INTERVIEW PREPARATION =================

@app.get("/interview-prep", tags=["Interview Prep"])
def get_interview_prep():
    return {
        "categories": [
            {
                "title": "Technical Fundamentals",
                "topics": [
                    {"name": "Data Structures & Algorithms", "questions": ["Arrays, Strings & Two-pointer techniques", "Hash Maps & Hash Sets for O(1) lookups", "Trees & Graphs: BFS/DFS traversals", "Dynamic Programming & Memoization patterns"]},
                    {"name": "Object-Oriented Design & System Architecture", "questions": ["Encapsulation, Inheritance, Polymorphism & Abstraction", "SOLID principles with real examples", "RESTful API design and idempotency", "Database indexing, ACID transactions and normalization"]},
                    {"name": "Web & Backend Concepts", "questions": ["Authentication: JWT vs Session cookies vs OAuth2", "HTTP methods, status codes, CORS & Headers", "Concurrency, Async/Await and Event Loop", "Caching strategies with Redis / CDN"]}
                ]
            },
            {
                "title": "Behavioral & Leadership (STAR Method)",
                "topics": [
                    {"name": "Core Behavioral Stories", "questions": ["Tell me about yourself and your journey in tech.", "Describe a challenging bug you diagnosed and solved.", "A time you had a technical disagreement with a teammate.", "A project you delivered under tight deadlines."]},
                    {"name": "Culture & Communication", "questions": ["Why are you interested in this specific company and role?", "How do you prioritize competing tasks and tech debt?", "Describe a time you mentored a colleague or received tough feedback."]}
                ]
            },
            {
                "title": "Questions to Ask the Interviewer",
                "topics": [
                    {"name": "Team & Culture", "questions": ["What does a typical day/sprint look like for this team?", "What is the team's approach to testing and continuous deployment?", "How does the team handle production incidents and retrospectives?"]},
                    {"name": "Engineering & Growth", "questions": ["What are the biggest technical challenges facing the team in the next 6-12 months?", "What opportunities exist for mentorship, learning, and career growth?"]}
                ]
            }
        ]
    }
