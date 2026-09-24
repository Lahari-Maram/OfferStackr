import { Link } from "react-router-dom";
import {
  Kanban,
  Calendar,
  CheckSquare,
  BarChart3,
  FileText,
  Bell,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  Award,
  CheckCircle2,
  Lock,
  Flame,
  Code
} from "lucide-react";
import OfferStackrLogo from "../components/OfferStackrLogo";
import PublicNavbar from "../components/PublicNavbar";
import "../styles/public-home.css";

const features = [
  {
    icon: Kanban,
    title: "Visual Kanban & Table Pipeline",
    desc: "Track every opportunity from Saved and Applied to Assessment, Interview, and Offer with intuitive drag-and-drop or structured list views."
  },
  {
    icon: Calendar,
    title: "Multi-Round Interview Manager",
    desc: "Organize unlimited interview stages (Recruiter screen, Technical DSA, System Design, Behavioral, Final) with prep notes and meeting links."
  },
  {
    icon: CheckSquare,
    title: "Online Assessment Hub",
    desc: "Stay ahead of coding tests and take-home challenges with platform links, due date countdowns, and completion tracking."
  },
  {
    icon: FileText,
    title: "Resume Vault & Tailored Resumes",
    desc: "Store your master resume and track the exact customized resume version submitted for every individual application."
  },
  {
    icon: Bell,
    title: "Automated Follow-up & Reminders",
    desc: "Never let an application slip through the cracks. Set configurable 24-hour and 1-hour reminders for interviews and follow-ups."
  },
  {
    icon: BarChart3,
    title: "Real Analytics & Consistency Streaks",
    desc: "Measure true conversion rates, weekly application targets, and consecutive daily application streaks calculated directly from your real data."
  }
];

const workflowSteps = [
  { step: "01", stage: "Saved", desc: "Bookmark job openings, target companies, and roles you want to tailor for." },
  { step: "02", stage: "Applied", desc: "Record submission date, portal used, and the exact resume attached." },
  { step: "03", stage: "Assessment", desc: "Track HackerRank, LeetCode, or take-home tests with due dates and prep." },
  { step: "04", stage: "Interview", desc: "Manage multiple rounds, interviewer details, and behavioral notes." },
  { step: "05", stage: "Offer", desc: "Track compensation, deadline details, and celebrate securing the role!" }
];

export default function PublicHome() {
  return (
    <div className="public-home-page">
      <PublicNavbar />

      <main>
        {/* HERO SECTION */}
        <section className="landing-hero">
          <div className="hero-container">
            <div className="hero-badge animate-fade-in">
              <Sparkles size={16} />
              <span>THE ALL-IN-ONE JOB SEARCH SAAS</span>
            </div>

            <h1 className="hero-headline animate-fade-in delay-1">
              Transform Your Job Search into a{" "}
              <span className="gradient-text">Streamlined Pipeline.</span>
            </h1>

            <p className="hero-subtext animate-fade-in delay-2">
              OfferStackr gives job seekers complete control over applications,
              multi-round interviews, assessments, resumes, and progress analytics
              in one beautifully focused workspace.
            </p>

            <div className="hero-cta-group animate-fade-in delay-3">
              <Link to="/signup" className="btn-hero-primary">
                Get Started Free <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn-hero-secondary">
                Sign In to Dashboard
              </Link>
            </div>

            {/* TRUST & METRIC HIGHLIGHTS */}
            <div className="hero-metrics-strip animate-fade-in delay-4">
              <div className="metric-item">
                <CheckCircle2 size={16} className="metric-icon" />
                <span>Zero Spreadsheet Chaos</span>
              </div>
              <div className="metric-divider" />
              <div className="metric-item">
                <Lock size={16} className="metric-icon" />
                <span>100% Private & Secure</span>
              </div>
              <div className="metric-divider" />
              <div className="metric-item">
                <Flame size={16} className="metric-icon" />
                <span>Streak Tracking & Goals</span>
              </div>
              <div className="metric-divider" />
              <div className="metric-item">
                <Zap size={16} className="metric-icon" />
                <span>Instant CSV Import & Export</span>
              </div>
            </div>

            {/* HERO PREVIEW CARD */}
            <div className="hero-preview-frame animate-float">
              <div className="preview-window">
                <div className="window-header">
                  <div className="window-dots">
                    <span className="dot dot-red" />
                    <span className="dot dot-yellow" />
                    <span className="dot dot-green" />
                  </div>
                  <div className="window-title">OfferStackr Workspace Pipeline</div>
                  <div className="window-actions">
                    <span className="status-indicator">● Active Session</span>
                  </div>
                </div>

                <div className="preview-body">
                  <div className="preview-columns">
                    <div className="preview-col">
                      <div className="col-header">
                        <span className="col-badge saved">Saved (3)</span>
                      </div>
                      <div className="preview-card">
                        <strong>Linear</strong>
                        <span>Frontend Engineer</span>
                        <div className="card-tags">
                          <span className="tag">Remote</span>
                          <span className="tag high">High</span>
                        </div>
                      </div>
                    </div>

                    <div className="preview-col">
                      <div className="col-header">
                        <span className="col-badge applied">Applied (8)</span>
                      </div>
                      <div className="preview-card">
                        <strong>Stripe</strong>
                        <span>Full Stack Developer</span>
                        <div className="card-tags">
                          <span className="tag">Hybrid</span>
                          <span className="tag resume">📄 Resume v2</span>
                        </div>
                      </div>
                      <div className="preview-card">
                        <strong>Figma</strong>
                        <span>Design Systems Eng</span>
                        <div className="card-tags">
                          <span className="tag">Full-time</span>
                        </div>
                      </div>
                    </div>

                    <div className="preview-col">
                      <div className="col-header">
                        <span className="col-badge assessment">Assessment (2)</span>
                      </div>
                      <div className="preview-card highlight">
                        <strong>Atlassian</strong>
                        <span>HackerRank Challenge</span>
                        <div className="card-tags">
                          <span className="tag alert">Due in 2 days</span>
                        </div>
                      </div>
                    </div>

                    <div className="preview-col">
                      <div className="col-header">
                        <span className="col-badge interview">Interview (3)</span>
                      </div>
                      <div className="preview-card highlight-green">
                        <strong>Google</strong>
                        <span>Round 2 – Technical DSA</span>
                        <div className="card-tags">
                          <span className="tag meet">Meet Link ↗</span>
                        </div>
                      </div>
                    </div>

                    <div className="preview-col">
                      <div className="col-header">
                        <span className="col-badge offer">Offer (1)</span>
                      </div>
                      <div className="preview-card offer-card">
                        <strong>Vercel</strong>
                        <span>Senior Platform Eng</span>
                        <div className="card-tags">
                          <span className="tag offer-tag">🎉 Offer Received</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section id="features" className="features-section">
          <div className="section-container">
            <div className="section-header">
              <span className="section-eyebrow">FEATURES</span>
              <h2>Built specifically for serious job seekers.</h2>
              <p>Everything you need to stay organized, disciplined, and prepared for every round.</p>
            </div>

            <div className="features-grid">
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={i} className="feature-box">
                    <div className="feature-icon-circle">
                      <Icon size={24} />
                    </div>
                    <h3>{f.title}</h3>
                    <p>{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* WORKFLOW PIPELINE */}
        <section id="workflow" className="workflow-section">
          <div className="section-container">
            <div className="section-header">
              <span className="section-eyebrow">HOW IT WORKS</span>
              <h2>A continuous progression from opportunity to offer.</h2>
              <p>Manage the full lifecycle of your job applications with structured milestones.</p>
            </div>

            <div className="workflow-steps">
              {workflowSteps.map((w, idx) => (
                <div key={idx} className="workflow-step-card">
                  <div className="step-number">{w.step}</div>
                  <h3 className="step-stage">{w.stage}</h3>
                  <p className="step-desc">{w.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ABOUT & VALUE */}
        <section id="about" className="about-section">
          <div className="section-container">
            <div className="about-card">
              <div className="about-content">
                <span className="section-eyebrow">WHY OFFERSTACKR</span>
                <h2>Job hunting is stressful. Your tracking shouldn't be.</h2>
                <p>
                  Spreadsheets get messy, recruiter emails get lost in your inbox, and interview rounds
                  require careful preparation. OfferStackr brings everything into a clean, purpose-built SaaS application designed to help you land your next role with confidence.
                </p>
                <div className="about-points">
                  <div className="point"><ShieldCheck size={18} /><span>100% Private & Secure storage</span></div>
                  <div className="point"><Zap size={18} /><span>Zero fluff, real metrics calculated from your data</span></div>
                  <div className="point"><Award size={18} /><span>Gamified streaks & milestone achievements</span></div>
                </div>
              </div>
              <div className="about-action">
                <h3>Ready to elevate your job search?</h3>
                <p>Join organized candidates managing their journey on OfferStackr.</p>
                <Link to="/signup" className="btn-hero-primary full-width">
                  Create Your Account
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="public-footer">
        <div className="public-footer-container">
          <div className="footer-brand">
            <div className="public-logo">
              <div className="public-logo-icon small">
                <OfferStackrLogo size={20} />
              </div>
              <span className="public-logo-text">OfferStackr</span>
            </div>
            <p>Empowering candidates to land dream roles with organization and clarity.</p>
            <div className="footer-developer-badge">
              <Code size={14} className="badge-dev-icon" />
              <span>Developed by <strong>@Laharimaram</strong></span>
            </div>
          </div>
          <div className="footer-nav-columns">
            <div className="footer-nav-col">
              <h4>Product</h4>
              <ul className="footer-nav-list">
                <li>
                  <a href="#features" className="footer-nav-link">
                    <span className="footer-bullet">•</span>
                    <span>Features</span>
                  </a>
                </li>
                <li>
                  <a href="#workflow" className="footer-nav-link">
                    <span className="footer-bullet">•</span>
                    <span>Pipeline Workflow</span>
                  </a>
                </li>
                <li>
                  <a href="#about" className="footer-nav-link">
                    <span className="footer-bullet">•</span>
                    <span>Why OfferStackr</span>
                  </a>
                </li>
              </ul>
            </div>
            <div className="footer-nav-col">
              <h4>Account</h4>
              <ul className="footer-nav-list">
                <li>
                  <Link to="/login" className="footer-nav-link">
                    <span className="footer-bullet">•</span>
                    <span>Sign In</span>
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="footer-nav-link">
                    <span className="footer-bullet">•</span>
                    <span>Create Account</span>
                  </Link>
                </li>
                <li>
                  <Link to="/forgot-password" className="footer-nav-link">
                    <span className="footer-bullet">•</span>
                    <span>Reset Password</span>
                  </Link>
                </li>
              </ul>
            </div>
            <div className="footer-nav-col">
              <h4>Connect</h4>
              <ul className="footer-nav-list">
                <li>
                  <a
                    href="https://www.linkedin.com/in/lahari-maram-17bba4265/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-nav-link"
                  >
                    <span className="footer-bullet">•</span>
                    <span>LinkedIn</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/Lahari-Maram"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-nav-link"
                  >
                    <span className="footer-bullet">•</span>
                    <span>GitHub</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/Lahari-Maram/OfferStackr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-nav-link"
                  >
                    <span className="footer-bullet">•</span>
                    <span>Source Code</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-copyright-bar">
          <div className="footer-copyright-content">
            <p>© 2026 OfferStackr. All rights reserved.</p>
            <p className="footer-built-by">Crafted with precision by <strong>@Laharimaram</strong>.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
