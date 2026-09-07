from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    weekly_goal = Column(Integer, nullable=False, default=10)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    jobs = relationship("Job", back_populates="owner", cascade="all, delete-orphan")
    events = relationship("ApplicationEvent", back_populates="user", cascade="all, delete-orphan")
    resume = relationship("Resume", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("UserGoal", back_populates="user", cascade="all, delete-orphan")
    achievements = relationship("Achievement", back_populates="user", cascade="all, delete-orphan")
    interviews = relationship("Interview", back_populates="user", cascade="all, delete-orphan")
    assessments = relationship("Assessment", back_populates="user", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="user", cascade="all, delete-orphan")
    user_notes = relationship("UserNote", back_populates="user", cascade="all, delete-orphan")

class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    company = Column(String, nullable=False)
    role = Column(String, nullable=True)
    portal = Column(String, nullable=True)
    status = Column(String, nullable=True, default="Applied")  # Saved, Applied, Assessment, Interview, Offer, Rejected, Withdrawn
    applied_date = Column(Date, nullable=True)
    interview_date = Column(Date, nullable=True)
    follow_up_date = Column(Date, nullable=True)
    follow_up_status = Column(String, nullable=True, default="Pending")  # Pending, Completed, Not Required
    job_url = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    tags = Column(String, nullable=True)
    priority = Column(String, nullable=False, default="Medium")  # High, Medium, Low
    work_mode = Column(String, nullable=True)  # Remote, Hybrid, On-site
    employment_type = Column(String, nullable=True)  # Full-time, Internship, Contract, Part-time
    location = Column(String, nullable=True)
    salary = Column(String, nullable=True)
    
    # Recruiter fields
    recruiter_name = Column(String, nullable=True)
    recruiter_email = Column(String, nullable=True)
    recruiter_linkedin = Column(String, nullable=True)
    recruiter_phone = Column(String, nullable=True)
    recruiter_notes = Column(Text, nullable=True)
    
    # Legacy assessment fields (kept for backward compatibility)
    assessment_name = Column(String, nullable=True)
    assessment_date = Column(Date, nullable=True)
    assessment_time = Column(String, nullable=True)
    assessment_type = Column(String, nullable=True)
    assessment_platform = Column(String, nullable=True)
    assessment_url = Column(String, nullable=True)
    assessment_notes = Column(Text, nullable=True)
    assessment_completed = Column(Integer, default=0, nullable=False)
    
    # Legacy interview fields (kept for backward compatibility)
    interview_time = Column(String, nullable=True)
    interview_round = Column(String, nullable=True)
    interview_type = Column(String, nullable=True)
    interview_interviewer = Column(String, nullable=True)
    interview_url = Column(String, nullable=True)
    interview_location = Column(String, nullable=True)
    interview_prep_notes = Column(Text, nullable=True)
    
    # Reminders
    reminder_offsets = Column(String, nullable=True)  # e.g., "24h,1h"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    owner = relationship("User", back_populates="jobs")
    events = relationship("ApplicationEvent", back_populates="job", cascade="all, delete-orphan")
    application_resume = relationship("ApplicationResume", back_populates="job", uselist=False, cascade="all, delete-orphan")
    interviews = relationship("Interview", back_populates="job", cascade="all, delete-orphan", order_by="Interview.interview_date")
    assessments = relationship("Assessment", back_populates="job", cascade="all, delete-orphan", order_by="Assessment.assessment_date")
    reminders = relationship("Reminder", back_populates="job", cascade="all, delete-orphan")
    user_notes = relationship("UserNote", back_populates="job", cascade="all, delete-orphan")

class Interview(Base):
    __tablename__ = "interviews"
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    round_name = Column(String, nullable=False)  # e.g., "Round 1 – HR", "Round 2 – Technical"
    interview_date = Column(Date, nullable=True)
    interview_time = Column(String, nullable=True)  # e.g. "14:00" or "2:30 PM"
    interview_type = Column(String, nullable=True)  # Video, Phone, In-person, Technical, HR, System Design, Behavioral
    interviewer = Column(String, nullable=True)
    interview_url = Column(String, nullable=True)
    location = Column(String, nullable=True)
    status = Column(String, nullable=False, default="Scheduled")  # Scheduled, Completed, Cancelled
    prep_notes = Column(Text, nullable=True)
    result_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    job = relationship("Job", back_populates="interviews")
    user = relationship("User", back_populates="interviews")

class Assessment(Base):
    __tablename__ = "assessments"
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    assessment_date = Column(Date, nullable=True)
    assessment_time = Column(String, nullable=True)
    assessment_type = Column(String, nullable=True)  # Coding test, Online assessment, Aptitude test, Technical test, Take-home assignment
    platform = Column(String, nullable=True)  # HackerRank, LeetCode, CodeSignal, TestGorilla, Custom
    assessment_url = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    completed = Column(Integer, default=0, nullable=False)  # 0: Pending, 1: Completed
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    job = relationship("Job", back_populates="assessments")
    user = relationship("User", back_populates="assessments")

class Reminder(Base):
    __tablename__ = "reminders"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String, nullable=False)
    reminder_type = Column(String, nullable=False, default="custom")  # interview, assessment, followup, custom
    reminder_date = Column(Date, nullable=False)
    reminder_time = Column(String, nullable=True)
    offsets = Column(String, nullable=True)  # "24h,1h"
    status = Column(String, nullable=False, default="Pending")  # Pending, Completed, Dismissed
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="reminders")
    job = relationship("Job", back_populates="reminders")

class UserNote(Base):
    __tablename__ = "user_notes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String, nullable=False, default="General")  # General, Interview Prep, Company Research, Questions, Technical, HR
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="user_notes")
    job = relationship("Job", back_populates="user_notes")

class ApplicationEvent(Base):
    __tablename__ = "application_events"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True, index=True)
    event_type = Column(String, nullable=False)
    description = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    user = relationship("User", back_populates="events")
    job = relationship("Job", back_populates="events")

class Resume(Base):
    __tablename__ = "resumes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    original_filename = Column(String, nullable=False)
    stored_filename = Column(String, nullable=False)
    content_type = Column(String, nullable=False)
    size_bytes = Column(Integer, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    user = relationship("User", back_populates="resume")

class ApplicationResume(Base):
    __tablename__ = "application_resumes"
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    original_filename = Column(String, nullable=False)
    stored_filename = Column(String, nullable=False)
    content_type = Column(String, nullable=False)
    size_bytes = Column(Integer, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    job = relationship("Job", back_populates="application_resume")

class PasswordResetOTP(Base):
    __tablename__ = "password_reset_otps"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, nullable=False)
    otp_hash = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    attempts = Column(Integer, default=0, nullable=False)
    used = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, nullable=False, default="system")  # assessment, interview, followup, system, streak, goal
    read = Column(Integer, default=0, nullable=False)  # 0: unread, 1: read
    action_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    user = relationship("User", back_populates="notifications")

class UserGoal(Base):
    __tablename__ = "user_goals"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    goal_type = Column(String, nullable=False)  # weekly_applications, monthly_applications, assessments, interviews, followups
    target = Column(Integer, nullable=False)
    period = Column(String, nullable=False, default="weekly")  # weekly, monthly
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    user = relationship("User", back_populates="goals")

class Achievement(Base):
    __tablename__ = "achievements"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    badge_key = Column(String, nullable=False)
    unlocked_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    user = relationship("User", back_populates="achievements")
