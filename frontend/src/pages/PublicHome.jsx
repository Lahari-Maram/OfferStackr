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
  Award
} from "lucide-react";
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
            <div className="hero-badge">
              <Sparkles size={16} />
              <span>THE ALL-IN-ONE JOB SEARCH SAAS</span>
            </div>

            <h1 className="hero-headline">
              Transform Your Job Search into a{" "}
              <span className="gradient-text">Streamlined Pipeline.</span>
            </h1>

            <p className="hero-subtext">
              OfferStackr gives job seekers complete control over applications,
              multi-round interviews, assessments, resumes, and progress analytics
              in one beautifully focused workspace.
            </p>

            <div className="hero-cta-group">
              <Link to="/signup" className="btn-hero-primary">
                Get Started Free <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn-hero-secondary">
                Sign In to Dashboard
              </Link>
            </div>

            {/* HERO PREVIEW CARD */}
            <div className="hero-preview-frame">
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

      <footer className="public-footer">
        <div className="public-footer-container">
          <div className="footer-brand">
            <div className="public-logo">
              <div className="public-logo-icon small">
                <Sparkles size={16} />
              </div>
              <span>OfferStackr</span>
            </div>
            <p>Empowering candidates to land dream roles with organization and clarity.</p>
          </div>
          <div className="footer-links-group">
            <Link to="/login">Sign In</Link>
            <Link to="/signup">Get Started</Link>
            <a href="/#features">Features</a>
            <a href="/#workflow">Workflow</a>
          </div>
        </div>
        <div className="footer-copyright-bar">
          <p>© 2026 OfferStackr. All rights reserved. Designed & built by Lahari.</p>
        </div>
      </footer>
    </div>
  );
}
