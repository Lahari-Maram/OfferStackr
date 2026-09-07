from datetime import date, datetime
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Any

# ================= USER & AUTH SCHEMAS =================

class UserCreate(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: EmailStr
    weekly_goal: int = 10
    has_resume: bool = False
    created_at: datetime | None = None

class UpdateProfile(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr

class ChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)

class ResetPasswordWithOTP(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=6)

class Token(BaseModel):
    access_token: str
    token_type: str

class MessageResponse(BaseModel):
    message: str

# ================= RESUME SCHEMAS =================

class ApplicationResumeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    original_filename: str
    content_type: str
    size_bytes: int
    uploaded_at: datetime

class ResumeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    original_filename: str
    content_type: str
    size_bytes: int
    uploaded_at: datetime

# ================= INTERVIEW SCHEMAS =================

class InterviewBase(BaseModel):
    round_name: str = Field(..., min_length=1)
    interview_date: date | None = None
    interview_time: str | None = None
    interview_type: str | None = "Video"
    interviewer: str | None = None
    interview_url: str | None = None
    location: str | None = None
    status: str = "Scheduled"
    prep_notes: str | None = None
    result_notes: str | None = None

class InterviewCreate(InterviewBase):
    job_id: int | None = None

class InterviewUpdate(InterviewBase):
    pass

class InterviewResponse(InterviewBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    job_id: int
    user_id: int
    company: str | None = None
    role: str | None = None
    created_at: datetime

# ================= ASSESSMENT SCHEMAS =================

class AssessmentBase(BaseModel):
    name: str = Field(..., min_length=1)
    assessment_date: date | None = None
    assessment_time: str | None = None
    assessment_type: str | None = "Coding test"
    platform: str | None = "HackerRank"
    assessment_url: str | None = None
    notes: str | None = None
    completed: int = 0

class AssessmentCreate(AssessmentBase):
    job_id: int | None = None

class AssessmentUpdate(AssessmentBase):
    pass

class AssessmentResponse(AssessmentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    job_id: int | None = None
    user_id: int
    company: str | None = None
    role: str | None = None
    created_at: datetime

# ================= REMINDER SCHEMAS =================

class ReminderBase(BaseModel):
    title: str = Field(..., min_length=1)
    reminder_type: str = "custom"  # interview, assessment, followup, custom
    reminder_date: date
    reminder_time: str | None = None
    offsets: str | None = "24h,1h"
    status: str = "Pending"  # Pending, Completed, Dismissed
    notes: str | None = None

class ReminderCreate(ReminderBase):
    job_id: int | None = None

class ReminderUpdate(ReminderBase):
    pass

class ReminderResponse(ReminderBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    job_id: int | None = None
    company: str | None = None
    role: str | None = None
    created_at: datetime

# ================= USER NOTE SCHEMAS =================

class UserNoteBase(BaseModel):
    title: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1)
    category: str = "General"  # General, Interview Prep, Company Research, Questions, Technical, HR
    job_id: int | None = None

class UserNoteCreate(UserNoteBase):
    pass

class UserNoteUpdate(UserNoteBase):
    pass

class UserNoteResponse(UserNoteBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    company: str | None = None
    created_at: datetime
    updated_at: datetime

# ================= JOB SCHEMAS =================

class JobCreate(BaseModel):
    company: str = Field(..., min_length=1)
    role: str | None = None
    portal: str | None = None
    status: str | None = "Applied"
    applied_date: date | None = None
    interview_date: date | None = None
    follow_up_date: date | None = None
    follow_up_status: str | None = "Pending"
    job_url: str | None = None
    notes: str | None = None
    tags: str | None = None
    priority: str = "Medium"
    work_mode: str | None = None
    employment_type: str | None = None
    location: str | None = None
    salary: str | None = None
    recruiter_name: str | None = None
    recruiter_email: str | None = None
    recruiter_linkedin: str | None = None
    recruiter_phone: str | None = None
    recruiter_notes: str | None = None
    assessment_name: str | None = None
    assessment_date: date | None = None
    assessment_time: str | None = None
    assessment_type: str | None = None
    assessment_platform: str | None = None
    assessment_url: str | None = None
    assessment_notes: str | None = None
    assessment_completed: int = 0
    interview_time: str | None = None
    interview_round: str | None = None
    interview_type: str | None = None
    interview_interviewer: str | None = None
    interview_url: str | None = None
    interview_location: str | None = None
    interview_prep_notes: str | None = None
    reminder_offsets: str | None = None

class JobUpdate(JobCreate):
    pass

class JobStatusUpdate(BaseModel):
    status: str = Field(..., min_length=1)

class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    company: str
    role: str | None = None
    portal: str | None = None
    status: str | None = "Applied"
    applied_date: date | None = None
    interview_date: date | None = None
    follow_up_date: date | None = None
    follow_up_status: str | None = "Pending"
    job_url: str | None = None
    notes: str | None = None
    tags: str | None = None
    priority: str = "Medium"
    work_mode: str | None = None
    employment_type: str | None = None
    location: str | None = None
    salary: str | None = None
    recruiter_name: str | None = None
    recruiter_email: str | None = None
    recruiter_linkedin: str | None = None
    recruiter_phone: str | None = None
    recruiter_notes: str | None = None
    assessment_name: str | None = None
    assessment_date: date | None = None
    assessment_time: str | None = None
    assessment_type: str | None = None
    assessment_platform: str | None = None
    assessment_url: str | None = None
    assessment_notes: str | None = None
    assessment_completed: int = 0
    interview_time: str | None = None
    interview_round: str | None = None
    interview_type: str | None = None
    interview_interviewer: str | None = None
    interview_url: str | None = None
    interview_location: str | None = None
    interview_prep_notes: str | None = None
    reminder_offsets: str | None = None
    application_resume: ApplicationResumeResponse | None = None
    interviews: list[InterviewResponse] = []
    assessments: list[AssessmentResponse] = []

class JobMutationResponse(MessageResponse):
    job_id: int | None = None

class CSVImportResponse(MessageResponse):
    imported_count: int
    skipped_count: int
    errors: list[str] = []

# ================= DASHBOARD & ANALYTICS SCHEMAS =================

class DashboardResponse(BaseModel):
    total_jobs: int
    saved: int
    applied: int
    assessment: int
    interview: int
    offer: int
    rejected: int
    withdrawn: int
    pending_followups: int
    upcoming_interviews_count: int
    upcoming_assessments_count: int
    current_streak: int
    weekly_goal: int
    this_week_applications: int
    goal_progress: float

class JobStatistics(BaseModel):
    saved: int
    applied: int
    assessment: int
    interview: int
    offer: int
    rejected: int
    withdrawn: int

class GoalUpdate(BaseModel):
    weekly_goal: int = Field(..., ge=1, le=1000)

class AnalyticsResponse(BaseModel):
    total: int
    this_week: int
    last_week: int
    this_month: int
    week_goal: int
    goal_progress: float
    streak: int
    longest_streak: int
    response_rate: float
    interview_rate: float
    assessment_rate: float
    offer_rate: float
    rejection_rate: float
    avg_days_to_interview: float | None
    status_distribution: dict[str, int]
    work_mode_distribution: dict[str, int]
    employment_type_distribution: dict[str, int]
    monthly_trend: list[dict[str, Any]]
    weekly_activity: list[dict[str, Any]]

class StreakResponse(BaseModel):
    current_streak: int
    longest_streak: int
    total_active_days: int
    activity_dates: list[str]

class AchievementResponse(BaseModel):
    badge_key: str
    title: str
    description: str
    icon: str
    category: str
    unlocked: bool
    unlocked_at: datetime | None = None
    progress: float  # 0 to 100
    target: int
    current: int

class EventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    job_id: int | None
    event_type: str
    description: str
    created_at: datetime

class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    job_id: int | None = None
    title: str
    message: str
    type: str
    read: int
    action_url: str | None = None
    created_at: datetime
