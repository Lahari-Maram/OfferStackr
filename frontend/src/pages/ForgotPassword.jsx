import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Mail, KeyRound, Lock, ArrowLeft, RefreshCw } from "lucide-react";
import api from "../api/axios";
import PublicNavbar from "../components/PublicNavbar";
import "../styles/auth.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your registered email address");
      return;
    }
    try {
      setLoading(true);
      const res = await api.post("/forgot-password", { email: email.trim().toLowerCase() });
      toast.success(res.data.message || "Verification code sent to your email!");
      setStep(2);
      setCountdown(60);
      setCanResend(false);
    } catch (error) {
      const errDetail = error.response?.data?.detail;
      toast.error(typeof errDetail === "string" ? errDetail : "Failed to request password reset code");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;
    try {
      setResending(true);
      await api.post("/forgot-password", { email: email.trim().toLowerCase() });
      toast.success("A new verification code has been sent!");
      setCountdown(60);
      setCanResend(false);
    } catch (error) {
      const errDetail = error.response?.data?.detail;
      toast.error(typeof errDetail === "string" ? errDetail : "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      toast.error("Please enter the complete 6-digit verification code");
      return;
    }
    try {
      setLoading(true);
      await api.post("/verify-otp", {
        email: email.trim().toLowerCase(),
        otp: otp.trim()
      });
      toast.success("Code verified! Now choose a new password.");
      setStep(3);
    } catch (error) {
      const errDetail = error.response?.data?.detail;
      toast.error(typeof errDetail === "string" ? errDetail : "Invalid or expired verification code");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    try {
      setLoading(true);
      const res = await api.post("/reset-password-otp", {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        new_password: newPassword
      });
      toast.success(res.data.message || "Password reset successfully!");
      navigate("/login");
    } catch (error) {
      const errDetail = error.response?.data?.detail;
      toast.error(typeof errDetail === "string" ? errDetail : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <PublicNavbar />

      <main className="auth-main">
        <div className="auth-decoration auth-decoration-one" />
        <div className="auth-decoration auth-decoration-two" />

        <section className="auth-card modern-auth-card" aria-labelledby="forgot-title">
          <div className="auth-brand-badge">
            <KeyRound size={26} />
          </div>

          <div className="auth-heading">
            <span className="auth-eyebrow">ACCOUNT RECOVERY</span>
            <h1 id="forgot-title">
              {step === 1 && "Reset your password"}
              {step === 2 && "Enter verification code"}
              {step === 3 && "Create new password"}
            </h1>
            <p>
              {step === 1 && "Enter your email address and we'll send a 6-digit OTP code to reset your password."}
              {step === 2 && `Enter the 6-digit code sent to ${email}. Check your inbox or dev logs.`}
              {step === 3 && "Choose a strong password with at least 6 characters."}
            </p>
          </div>

          {/* STEP 1: EMAIL */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="modern-auth-form">
              <div className="auth-field">
                <label htmlFor="forgot-email">Email address</label>
                <div className="auth-input-icon-wrap">
                  <Mail size={18} className="input-icon" />
                  <input
                    id="forgot-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <button className="auth-primary-btn" type="submit" disabled={loading}>
                {loading ? "Sending code..." : "Send Verification Code"}
              </button>
            </form>
          )}

          {/* STEP 2: OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="modern-auth-form">
              <div className="auth-field">
                <label htmlFor="otp-code">6-Digit Verification Code</label>
                <input
                  id="otp-code"
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  className="otp-input-box"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  autoComplete="one-time-code"
                  required
                />
              </div>

              <div className="otp-resend-row">
                {canResend ? (
                  <button
                    type="button"
                    className="resend-link-btn"
                    onClick={handleResendOtp}
                    disabled={resending}
                  >
                    <RefreshCw size={14} className={resending ? "spin" : ""} />
                    {resending ? "Resending..." : "Resend Code"}
                  </button>
                ) : (
                  <span className="countdown-text">Resend code in {countdown}s</span>
                )}
              </div>

              <button className="auth-primary-btn" type="submit" disabled={loading || otp.length !== 6}>
                {loading ? "Verifying..." : "Verify Code"}
              </button>

              <button
                type="button"
                className="auth-secondary-btn"
                onClick={() => setStep(1)}
              >
                Change Email Address
              </button>
            </form>
          )}

          {/* STEP 3: NEW PASSWORD */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="modern-auth-form">
              <div className="auth-field">
                <label htmlFor="new-password">New Password</label>
                <div className="auth-input-icon-wrap">
                  <Lock size={18} className="input-icon" />
                  <input
                    id="new-password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="confirm-new-password">Confirm New Password</label>
                <div className="auth-input-icon-wrap">
                  <Lock size={18} className="input-icon" />
                  <input
                    id="confirm-new-password"
                    type="password"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <button className="auth-primary-btn" type="submit" disabled={loading}>
                {loading ? "Updating password..." : "Set New Password"}
              </button>
            </form>
          )}

          <div className="auth-footer-link">
            <Link to="/login" className="back-to-login">
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
