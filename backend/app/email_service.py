import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from dotenv import load_dotenv, find_dotenv

logger = logging.getLogger("offerstackr.email")
logger.setLevel(logging.INFO)

def get_smtp_config() -> dict:
    """
    Dynamically loads and returns SMTP configuration from .env or environment variables.
    Searches both current working directory and backend directory.
    """
    env_path = find_dotenv(usecwd=True)
    if not env_path:
        # Check backend/.env
        backend_env = Path(__file__).resolve().parent.parent / ".env"
        if backend_env.exists():
            env_path = str(backend_env)

    if env_path:
        load_dotenv(env_path, override=True)

    smtp_host = os.getenv("SMTP_HOST", "").strip()
    smtp_port_raw = os.getenv("SMTP_PORT", "587").strip()
    try:
        smtp_port = int(smtp_port_raw)
    except ValueError:
        smtp_port = 587

    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_password = os.getenv("SMTP_PASSWORD", "").strip()
    smtp_tls = os.getenv("SMTP_TLS", "true").strip().lower() in ("true", "1", "yes")

    # Smart default for From address:
    # If SMTP_USER is configured (e.g. Gmail), default to "OfferStackr <user@gmail.com>"
    # to avoid SMTP providers rejecting mismatched From domains.
    custom_from = os.getenv("EMAILS_FROM", "").strip()
    if custom_from:
        emails_from = custom_from
    elif smtp_user:
        emails_from = f"OfferStackr <{smtp_user}>"
    else:
        emails_from = "OfferStackr <no-reply@offerstackr.com>"

    is_configured = bool(smtp_host and smtp_user and smtp_password)

    return {
        "host": smtp_host,
        "port": smtp_port,
        "user": smtp_user,
        "password": smtp_password,
        "tls": smtp_tls,
        "from_address": emails_from,
        "is_configured": is_configured,
    }

def send_email(to_email: str, subject: str, html_content: str, text_content: str | None = None) -> bool:
    """
    Sends an email using SMTP if configured.
    Falls back safely to console output in development environments without crashing on Windows cp1252.
    """
    config = get_smtp_config()

    if not config["is_configured"]:
        # Safe ASCII development fallback logging (Windows cp1252 safe)
        print("\n" + "=" * 60)
        print("[OFFERSTACKR EMAIL SERVICE - DEVELOPMENT FALLBACK]")
        print(f"To: {to_email}")
        print(f"From: {config['from_address']}")
        print(f"Subject: {subject}")
        print("-" * 60)
        print(text_content or html_content)
        print("=" * 60 + "\n")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = config["from_address"]
        msg["To"] = to_email

        if text_content:
            msg.attach(MIMEText(text_content, "plain", "utf-8"))
        if html_content:
            msg.attach(MIMEText(html_content, "html", "utf-8"))

        if config["port"] == 465:
            server = smtplib.SMTP_SSL(config["host"], config["port"], timeout=12)
        else:
            server = smtplib.SMTP(config["host"], config["port"], timeout=12)
            if config["tls"]:
                server.starttls()

        if config["user"] and config["password"]:
            server.login(config["user"], config["password"])

        server.send_message(msg)
        server.quit()
        logger.info(f"Email sent successfully to {to_email}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        # Safe ASCII fallback output on failure so development/testing is not blocked
        print(f"\n[WARNING] Failed to send SMTP email: {type(e).__name__}: {e}")
        print(f"[OFFERSTACKR FALLBACK] To: {to_email} | Subject: {subject}")
        print(text_content or html_content)
        print("-" * 60 + "\n")
        return False

def send_password_reset_otp_email(to_email: str, otp_code: str, name: str = "there") -> bool:
    subject = f"Your OfferStackr Password Reset Code: {otp_code}"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 24px;">OfferStackr</h1>
            <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Job Search Management Platform</p>
        </div>
        <h2 style="color: #0f172a; font-size: 18px; margin-bottom: 12px;">Password Reset Request</h2>
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">
            Hello {name},<br>
            We received a request to reset your password for your OfferStackr account. Use the verification code below to complete the reset:
        </p>
        <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1e293b; font-family: monospace;">{otp_code}</span>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
            This OTP code is valid for <strong>10 minutes</strong>. If you did not request this password reset, please ignore this email or secure your account.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
            &copy; 2026 OfferStackr. All rights reserved. Designed & built by Lahari.
        </p>
    </div>
    """
    text = f"Hello {name},\n\nYour OfferStackr password reset OTP is: {otp_code}\nThis code expires in 10 minutes.\n\n(c) 2026 OfferStackr"
    return send_email(to_email, subject, html, text)

def send_reminder_email(to_email: str, title: str, details: str, reminder_type: str = "Interview") -> bool:
    subject = f"OfferStackr Reminder: {title}"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 22px;">OfferStackr Reminder</h1>
        </div>
        <div style="padding: 16px; background: #eff6ff; border-left: 4px solid #2563eb; border-radius: 6px; margin-bottom: 20px;">
            <h3 style="color: #1e3a8a; margin: 0 0 8px 0;">{title} ({reminder_type})</h3>
            <p style="color: #1e40af; margin: 0; font-size: 14px;">{details}</p>
        </div>
        <p style="color: #64748b; font-size: 13px;">
            Stay organized and keep moving your career forward!
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
            &copy; 2026 OfferStackr. All rights reserved. Designed & built by Lahari.
        </p>
    </div>
    """
    text = f"OfferStackr Reminder: {title}\nType: {reminder_type}\nDetails: {details}\n\n(c) 2026 OfferStackr"
    return send_email(to_email, subject, html, text)
