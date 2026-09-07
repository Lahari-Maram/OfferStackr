import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { User, Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight } from "lucide-react";
import api from "../api/axios";
import PublicNavbar from "../components/PublicNavbar";
import "../styles/auth.css";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    try {
      setLoading(true);
      await api.post("/signup", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password,
      });
      
      // Auto-login after successful registration
      const formData = new URLSearchParams();
      formData.append("username", email.trim().toLowerCase());
      formData.append("password", password);
      
      const loginRes = await api.post("/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      
      localStorage.setItem("token", loginRes.data.access_token);
      toast.success("Account created successfully! Welcome to OfferStackr.");
      navigate("/dashboard");
    } catch (error) {
      const errDetail = error.response?.data?.detail;
      toast.error(typeof errDetail === "string" ? errDetail : "Registration failed. Please try again.");
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
        
        <section className="auth-card modern-auth-card" aria-labelledby="signup-title">
          <div className="auth-brand-badge">
            <Sparkles size={24} />
          </div>
          
          <div className="auth-heading">
            <span className="auth-eyebrow">GET STARTED FREE</span>
            <h1 id="signup-title">Create your account</h1>
            <p>Start organizing applications, mastering interviews, and landing job offers.</p>
          </div>

          <form onSubmit={handleSignup} className="modern-auth-form">
            <div className="auth-field">
              <label htmlFor="signup-name">Full name</label>
              <div className="auth-input-icon-wrap">
                <User size={18} className="input-icon" />
                <input
                  id="signup-name"
                  type="text"
                  placeholder="e.g. Alex Johnson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="signup-email">Email address</label>
              <div className="auth-input-icon-wrap">
                <Mail size={18} className="input-icon" />
                <input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="signup-password">Password</label>
              <div className="auth-input-icon-wrap auth-password-wrap">
                <Lock size={18} className="input-icon" />
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button className="auth-primary-btn" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"} <ArrowRight size={18} />
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
