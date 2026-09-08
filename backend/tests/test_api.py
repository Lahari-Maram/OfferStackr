import io
import uuid
import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db, SessionLocal
from app import models

client = TestClient(app)

@pytest.fixture
def test_user():
    """Generates a unique test user with token"""
    unique_id = uuid.uuid4().hex[:8]
    email = f"tester_{unique_id}@example.com"
    password = "TestPassword123!"
    
    # 1. Sign up
    signup_res = client.post("/signup", json={
        "name": f"Tester {unique_id}",
        "email": email,
        "password": password
    })
    assert signup_res.status_code == 200
    
    # 2. Login to get token
    login_res = client.post("/login", data={
        "username": email,
        "password": password
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    return {
        "email": email,
        "password": password,
        "headers": headers,
        "user_id": signup_res.json()["id"]
    }

# ================= AUTH & SECURITY TESTS =================

def test_signup_login_profile(test_user):
    headers = test_user["headers"]
    
    # Profile check
    res = client.get("/profile", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == test_user["email"]
    assert data["weekly_goal"] == 10
    
    # Update profile
    new_name = "Updated Tester Name"
    res_up = client.put("/profile", json={"name": new_name, "email": test_user["email"]}, headers=headers)
    assert res_up.status_code == 200
    assert res_up.json()["name"] == new_name
    
    # Change password
    res_pwd = client.put("/change-password", json={
        "current_password": test_user["password"],
        "new_password": "NewSecretPassword456!"
    }, headers=headers)
    assert res_pwd.status_code == 200
    
    # Login with new password
    login_res = client.post("/login", data={
        "username": test_user["email"],
        "password": "NewSecretPassword456!"
    })
    assert login_res.status_code == 200

def test_otp_password_reset():
    unique_id = uuid.uuid4().hex[:8]
    email = f"otp_user_{unique_id}@example.com"
    
    client.post("/signup", json={
        "name": "OTP User",
        "email": email,
        "password": "InitialPassword123!"
    })
    
    # Request OTP
    res_req = client.post("/forgot-password", json={"email": email})
    assert res_req.status_code == 200
    
    # Fetch OTP from db directly for testing
    db = SessionLocal()
    try:
        otp_rec = db.query(models.PasswordResetOTP).filter(
            models.PasswordResetOTP.email == email,
            models.PasswordResetOTP.used == 0
        ).first()
        assert otp_rec is not None
        
        # Test invalid OTP
        res_inv = client.post("/verify-otp", json={"email": email, "otp": "000000"})
        assert res_inv.status_code == 400
        
        # We know OTP is a 6-digit number. Let's find matching code for test verification:
        import hashlib
        found_code = None
        for i in range(100000, 1000000):
            if hashlib.sha256(str(i).encode()).hexdigest() == otp_rec.otp_hash:
                found_code = str(i)
                break
        assert found_code is not None
        
        # Verify correct OTP
        res_ver = client.post("/verify-otp", json={"email": email, "otp": found_code})
        assert res_ver.status_code == 200
        
        # Reset password
        res_reset = client.post("/reset-password-otp", json={
            "email": email,
            "otp": found_code,
            "new_password": "ResetPassword789!"
        })
        assert res_reset.status_code == 200
        
        # Verify login with reset password
        login_res = client.post("/login", data={
            "username": email,
            "password": "ResetPassword789!"
        })
        assert login_res.status_code == 200
    finally:
        db.close()

# ================= JOB MANAGEMENT TESTS =================

def test_job_crud_and_status(test_user):
    headers = test_user["headers"]
    
    # 1. Create Job
    job_payload = {
        "company": "Stripe",
        "role": "Full Stack Engineer",
        "portal": "LinkedIn",
        "status": "Applied",
        "priority": "High",
        "work_mode": "Remote",
        "employment_type": "Full-time",
        "location": "San Francisco, CA",
        "salary": "$160,000",
        "applied_date": str(date.today()),
        "follow_up_date": str(date.today() + timedelta(days=5)),
        "follow_up_status": "Pending",
        "recruiter_name": "Sarah Connor",
        "recruiter_email": "sarah@stripe.com",
        "tags": "react, python, fast-growth",
        "notes": "Applied with custom cover letter."
    }
    create_res = client.post("/jobs", json=job_payload, headers=headers)
    assert create_res.status_code == 200
    job_id = create_res.json()["job_id"]
    assert job_id is not None
    
    # 2. Get Job
    get_res = client.get(f"/jobs/{job_id}", headers=headers)
    assert get_res.status_code == 200
    job_data = get_res.json()
    assert job_data["company"] == "Stripe"
    assert job_data["work_mode"] == "Remote"
    assert job_data["priority"] == "High"
    
    # 3. Update Job
    job_payload["priority"] = "Medium"
    job_payload["salary"] = "$170,000"
    update_res = client.put(f"/jobs/{job_id}", json=job_payload, headers=headers)
    assert update_res.status_code == 200
    
    # 4. Quick Status Update
    status_res = client.patch(f"/jobs/{job_id}/status", json={"status": "Interview"}, headers=headers)
    assert status_res.status_code == 200
    
    # 5. Duplicate Job
    dup_res = client.post(f"/jobs/{job_id}/duplicate", headers=headers)
    assert dup_res.status_code == 200
    dup_id = dup_res.json()["job_id"]
    assert dup_id != job_id
    
    # 6. Search & Filter
    search_res = client.get("/jobs/search?keyword=Stripe", headers=headers)
    assert search_res.status_code == 200
    assert len(search_res.json()) >= 1
    
    filter_res = client.get("/jobs/filter?status=Interview", headers=headers)
    assert filter_res.status_code == 200
    assert any(j["id"] == job_id for j in filter_res.json())
    
    # 7. Delete duplicated job
    del_res = client.delete(f"/jobs/{dup_id}", headers=headers)
    assert del_res.status_code == 200

# ================= MULTIPLE INTERVIEWS TESTS =================

def test_multiple_interview_rounds(test_user):
    headers = test_user["headers"]
    
    # Create Job
    job_res = client.post("/jobs", json={"company": "Google", "role": "L4 Software Engineer", "status": "Applied"}, headers=headers)
    job_id = job_res.json()["job_id"]
    
    # Add Round 1 - HR
    r1_res = client.post(f"/jobs/{job_id}/interviews", json={
        "round_name": "Round 1 – Recruiter Screen",
        "interview_date": str(date.today() + timedelta(days=2)),
        "interview_time": "11:00 AM",
        "interview_type": "Phone",
        "interviewer": "Dave Recruiter",
        "prep_notes": "Review resume highlights and recent projects."
    }, headers=headers)
    assert r1_res.status_code == 200
    r1_id = r1_res.json()["id"]
    
    # Add Round 2 - Technical DSA
    r2_res = client.post(f"/jobs/{job_id}/interviews", json={
        "round_name": "Round 2 – Technical DSA & System Design",
        "interview_date": str(date.today() + timedelta(days=5)),
        "interview_time": "2:00 PM",
        "interview_type": "Video",
        "interviewer": "Alice Senior Eng",
        "interview_url": "https://meet.google.com/abc-def-ghi"
    }, headers=headers)
    assert r2_res.status_code == 200
    r2_id = r2_res.json()["id"]
    
    # List Job Interviews
    list_res = client.get(f"/jobs/{job_id}/interviews", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 2
    
    # Mark Round 1 complete
    comp_res = client.patch(f"/interviews/{r1_id}/complete", headers=headers)
    assert comp_res.status_code == 200
    
    # Delete Round 2
    del_res = client.delete(f"/interviews/{r2_id}", headers=headers)
    assert del_res.status_code == 200

# ================= ASSESSMENTS TESTS =================

def test_assessments_management(test_user):
    headers = test_user["headers"]
    
    job_res = client.post("/jobs", json={"company": "Atlassian", "role": "Backend Dev"}, headers=headers)
    job_id = job_res.json()["job_id"]
    
    # Add Assessment
    ass_res = client.post(f"/jobs/{job_id}/assessments", json={
        "name": "HackerRank Coding Challenge",
        "assessment_date": str(date.today() + timedelta(days=3)),
        "assessment_type": "Coding test",
        "platform": "HackerRank",
        "assessment_url": "https://hackerrank.com/test-123",
        "notes": "90 minutes, 2 coding problems + 5 MCQs."
    }, headers=headers)
    assert ass_res.status_code == 200
    ass_id = ass_res.json()["id"]
    
    # Toggle complete
    toggle_res = client.patch(f"/assessments/{ass_id}/toggle", headers=headers)
    assert toggle_res.status_code == 200
    
    # List all assessments
    all_ass = client.get("/assessments", headers=headers)
    assert all_ass.status_code == 200
    assert any(a["id"] == ass_id for a in all_ass.json())

# ================= REMINDERS & NOTES TESTS =================

def test_reminders_and_notes(test_user):
    headers = test_user["headers"]
    
    # Create Reminder
    rem_res = client.post("/reminders", json={
        "title": "Send thank you note after interview",
        "reminder_type": "custom",
        "reminder_date": str(date.today() + timedelta(days=1)),
        "reminder_time": "16:00",
        "offsets": "24h,1h"
    }, headers=headers)
    assert rem_res.status_code == 200
    rem_id = rem_res.json()["id"]
    
    # Get Reminders
    rem_list = client.get("/reminders", headers=headers)
    assert rem_list.status_code == 200
    assert any(r["id"] == rem_id for r in rem_list.json())
    
    # Create Note
    note_res = client.post("/notes", json={
        "title": "STAR Behavioral Stories",
        "content": "Situation: System migration with tight deadline. Task: Lead database sync. Action: Created idempotent pipeline. Result: Zero downtime.",
        "category": "Interview Prep"
    }, headers=headers)
    assert note_res.status_code == 200
    note_id = note_res.json()["id"]
    
    # Get Notes
    notes_list = client.get("/notes?category=Interview%20Prep", headers=headers)
    assert notes_list.status_code == 200
    assert any(n["id"] == note_id for n in notes_list.json())

# ================= DASHBOARD, ANALYTICS & ACHIEVEMENTS TESTS =================

def test_dashboard_analytics_achievements(test_user):
    headers = test_user["headers"]
    
    # Add a job
    client.post("/jobs", json={"company": "Netflix", "role": "Staff Engineer", "status": "Applied", "applied_date": str(date.today())}, headers=headers)
    
    # Dashboard
    dash_res = client.get("/dashboard", headers=headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["total_jobs"] >= 1
    assert dash_data["current_streak"] >= 1
    
    # Analytics
    analytics_res = client.get("/dashboard/analytics", headers=headers)
    assert analytics_res.status_code == 200
    an_data = analytics_res.json()
    assert "status_distribution" in an_data
    assert "monthly_trend" in an_data
    
    # Streak
    streak_res = client.get("/streak", headers=headers)
    assert streak_res.status_code == 200
    assert streak_res.json()["current_streak"] >= 1
    
    # Achievements
    ach_res = client.get("/achievements", headers=headers)
    assert ach_res.status_code == 200
    badges = ach_res.json()
    assert len(badges) >= 10
    first_app_badge = next((b for b in badges if b["badge_key"] == "first_app"), None)
    assert first_app_badge is not None
    assert first_app_badge["unlocked"] is True

# ================= CSV IMPORT & EXPORT TESTS =================

def test_csv_export_and_import(test_user):
    headers = test_user["headers"]
    
    # Export CSV
    exp_res = client.get("/jobs/export/csv", headers=headers)
    assert exp_res.status_code == 200
    assert "text/csv" in exp_res.headers["content-type"]
    assert "Company" in exp_res.text
    
    # Import CSV with valid and invalid rows
    csv_content = """Company,Role,Portal,Status,Priority,Work Mode,Employment Type,Location,Salary,Applied Date
Spotify,iOS Developer,LinkedIn,Applied,High,Remote,Full-time,Stockholm,$140000,2026-08-20
Uber,Backend Engineer,Careers,Interview,Medium,Hybrid,Full-time,Seattle,$160000,2026-08-21
,Missing Company Name,LinkedIn,Applied,Low,Remote,Part-time,Remote,$50000,2026-08-22
"""
    file_obj = io.BytesIO(csv_content.encode("utf-8"))
    imp_res = client.post("/jobs/import/csv", files={"file": ("test.csv", file_obj, "text/csv")}, headers=headers)
    assert imp_res.status_code == 200
    imp_data = imp_res.json()
    assert imp_data["imported_count"] == 2
    assert imp_data["skipped_count"] == 1

# ================= USER DATA ISOLATION TEST =================

def test_user_data_isolation(test_user):
    user_a_headers = test_user["headers"]
    
    # Create another user
    user_b_id = uuid.uuid4().hex[:8]
    b_signup = client.post("/signup", json={
        "name": "User B",
        "email": f"user_b_{user_b_id}@example.com",
        "password": "Password123!"
    })
    b_token = client.post("/login", data={
        "username": f"user_b_{user_b_id}@example.com",
        "password": "Password123!"
    }).json()["access_token"]
    user_b_headers = {"Authorization": f"Bearer {b_token}"}
    
    # User A creates a job
    job_a = client.post("/jobs", json={"company": "Secret Company A", "status": "Applied"}, headers=user_a_headers).json()
    job_a_id = job_a["job_id"]
    
    # User B tries to view User A's job -> should return 404
    view_attempt = client.get(f"/jobs/{job_a_id}", headers=user_b_headers)
    assert view_attempt.status_code == 404
    
    # User B tries to update User A's job -> should return 404
    update_attempt = client.put(f"/jobs/{job_a_id}", json={"company": "Hacked", "status": "Offer"}, headers=user_b_headers)
    assert update_attempt.status_code == 404
    
    # User B tries to delete User A's job -> should return 404
    delete_attempt = client.delete(f"/jobs/{job_a_id}", headers=user_b_headers)
    assert delete_attempt.status_code == 404

# ================= CORS & PREFLIGHT TESTS =================

def test_cors_preflight_signup():
    origin = "https://offerstackr-frontend.onrender.com"
    res = client.options("/signup", headers={
        "Origin": origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type"
    })
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == origin
    assert res.headers.get("access-control-allow-credentials") == "true"

def test_cors_signup_post():
    origin = "https://offerstackr-frontend.onrender.com"
    unique_id = uuid.uuid4().hex[:8]
    res = client.post("/signup", json={
        "name": f"CORS User {unique_id}",
        "email": f"cors_{unique_id}@example.com",
        "password": "Password123!"
    }, headers={"Origin": origin})
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == origin

def test_cors_localhost_preflight():
    origin = "http://localhost:5173"
    res = client.options("/login", headers={
        "Origin": origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type"
    })
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == origin

def test_cors_custom_allowed_origins():
    from fastapi import FastAPI
    from starlette.middleware.cors import CORSMiddleware
    
    test_app = FastAPI()
    test_origins = [
        "http://localhost:5173",
        "https://offerstackr-frontend.onrender.com",
    ]
    raw = "https://custom-app.com/, https://preview.domain.org/"
    for origin in raw.split(","):
        cleaned = origin.strip().rstrip("/")
        if cleaned and cleaned not in test_origins:
            test_origins.append(cleaned)
            
    test_app.add_middleware(
        CORSMiddleware,
        allow_origins=test_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )
    custom_client = TestClient(test_app)
    res = custom_client.options("/", headers={
        "Origin": "https://custom-app.com",
        "Access-Control-Request-Method": "GET"
    })
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "https://custom-app.com"
    assert res.headers.get("access-control-allow-credentials") == "true"
