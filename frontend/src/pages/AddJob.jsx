import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Briefcase,
  User,
  Calendar,
  FileText,
  ArrowLeft
} from "lucide-react";
import api from "../api/axios";
import Layout from "../components/Layout";
import "../styles/addjob.css";

const STATUSES = ["Applied", "Saved", "Assessment", "Interview", "Offer", "Rejected", "Withdrawn"];
const PRIORITIES = ["Medium", "High", "Low"];
const WORK_MODES = ["Remote", "Hybrid", "On-site"];
const EMPLOYMENT_TYPES = ["Full-time", "Internship", "Contract", "Part-time"];

export default function AddJob() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("basic"); // "basic", "recruiter", "dates", "resume", "notes"
  const [loading, setLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);

  const [form, setForm] = useState({
    company: "",
    role: "",
    portal: "",
    status: "Applied",
    priority: "Medium",
    work_mode: "Remote",
    employment_type: "Full-time",
    location: "",
    salary: "",
    job_url: "",
    applied_date: new Date().toISOString().split("T")[0],
    follow_up_date: "",
    follow_up_status: "Pending",
    recruiter_name: "",
    recruiter_email: "",
    recruiter_phone: "",
    recruiter_linkedin: "",
    recruiter_notes: "",
    interview_date: "",
    interview_time: "10:00 AM",
    interview_round: "Round 1 – Recruiter Screen",
    interview_type: "Video",
    interview_prep_notes: "",
    assessment_name: "",
    assessment_date: "",
    assessment_type: "Coding test",
    assessment_platform: "HackerRank",
    tags: "",
    notes: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company.trim()) {
      toast.error("Please enter a company name");
      setActiveTab("basic");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...form,
        applied_date: form.applied_date || null,
        interview_date: form.interview_date || null,
        follow_up_date: form.follow_up_date || null,
        assessment_date: form.assessment_date || null,
      };

      const res = await api.post("/jobs", payload);
      const jobId = res.data.job_id;

      // If resume attached, upload it
      if (resumeFile && jobId) {
        const fd = new FormData();
        fd.append("file", resumeFile);
        await api.post(`/jobs/${jobId}/resume`, fd);
      }

      toast.success("Job application created successfully!");
      navigate("/jobs");
    } catch (error) {
      const errDetail = error.response?.data?.detail;
      toast.error(typeof errDetail === "string" ? errDetail : "Failed to add application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="add-job-container">
        {/* HEADER */}
        <div className="add-job-top-bar">
          <button
            type="button"
            className="btn-back"
            onClick={() => navigate("/jobs")}
          >
            <ArrowLeft size={16} />
            <span>Back to Applications</span>
          </button>
          <div className="add-job-header-title">
            <h1>New Job Application</h1>
            <p>Track a new role with all company details, recruiter contact, dates, and customized resume.</p>
          </div>
        </div>

        {/* FORM WRAPPER */}
        <form onSubmit={handleSubmit} className="add-job-form-card">
          {/* TAB NAVIGATION */}
          <div className="form-tabs-bar">
            <button
              type="button"
              className={`form-tab ${activeTab === "basic" ? "active" : ""}`}
              onClick={() => setActiveTab("basic")}
            >
              <Briefcase size={16} />
              <span>Job Details</span>
            </button>

            <button
              type="button"
              className={`form-tab ${activeTab === "recruiter" ? "active" : ""}`}
              onClick={() => setActiveTab("recruiter")}
            >
              <User size={16} />
              <span>Recruiter & Contact</span>
            </button>

            <button
              type="button"
              className={`form-tab ${activeTab === "dates" ? "active" : ""}`}
              onClick={() => setActiveTab("dates")}
            >
              <Calendar size={16} />
              <span>Dates & Pipeline</span>
            </button>

            <button
              type="button"
              className={`form-tab ${activeTab === "resume" ? "active" : ""}`}
              onClick={() => setActiveTab("resume")}
            >
              <FileText size={16} />
              <span>Resume & Notes</span>
            </button>
          </div>

          {/* TAB 1: BASIC DETAILS */}
          {activeTab === "basic" && (
            <div className="form-section-body">
              <div className="form-grid-two">
                <div className="form-group">
                  <label htmlFor="company">Company Name *</label>
                  <input
                    id="company"
                    name="company"
                    type="text"
                    placeholder="e.g. Stripe, Google, Linear"
                    value={form.company}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="role">Job Title / Role</label>
                  <input
                    id="role"
                    name="role"
                    type="text"
                    placeholder="e.g. Senior Frontend Engineer"
                    value={form.role}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-grid-three">
                <div className="form-group">
                  <label htmlFor="status">Pipeline Stage</label>
                  <select
                    id="status"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="priority">Priority</label>
                  <select
                    id="priority"
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="work_mode">Work Mode</label>
                  <select
                    id="work_mode"
                    name="work_mode"
                    value={form.work_mode}
                    onChange={handleChange}
                  >
                    {WORK_MODES.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid-three">
                <div className="form-group">
                  <label htmlFor="employment_type">Employment Type</label>
                  <select
                    id="employment_type"
                    name="employment_type"
                    value={form.employment_type}
                    onChange={handleChange}
                  >
                    {EMPLOYMENT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="location">Location</label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    placeholder="e.g. San Francisco, CA or Remote"
                    value={form.location}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="salary">Salary / Compensation</label>
                  <input
                    id="salary"
                    name="salary"
                    type="text"
                    placeholder="e.g. $140k - $170k / yr"
                    value={form.salary}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-grid-two">
                <div className="form-group">
                  <label htmlFor="job_url">Job Posting URL</label>
                  <input
                    id="job_url"
                    name="job_url"
                    type="url"
                    placeholder="https://..."
                    value={form.job_url}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="portal">Source / Portal</label>
                  <input
                    id="portal"
                    name="portal"
                    type="text"
                    placeholder="e.g. LinkedIn, Referral, Company Website"
                    value={form.portal}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-actions-step">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setActiveTab("recruiter")}
                >
                  Continue to Recruiter Info →
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: RECRUITER & CONTACT */}
          {activeTab === "recruiter" && (
            <div className="form-section-body">
              <div className="form-grid-two">
                <div className="form-group">
                  <label htmlFor="recruiter_name">Recruiter / Contact Name</label>
                  <input
                    id="recruiter_name"
                    name="recruiter_name"
                    type="text"
                    placeholder="e.g. Sarah Connor"
                    value={form.recruiter_name}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="recruiter_email">Recruiter Email</label>
                  <input
                    id="recruiter_email"
                    name="recruiter_email"
                    type="email"
                    placeholder="e.g. sarah@company.com"
                    value={form.recruiter_email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-grid-two">
                <div className="form-group">
                  <label htmlFor="recruiter_phone">Recruiter Phone</label>
                  <input
                    id="recruiter_phone"
                    name="recruiter_phone"
                    type="text"
                    placeholder="e.g. +1 (555) 019-2834"
                    value={form.recruiter_phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="recruiter_linkedin">Recruiter LinkedIn URL</label>
                  <input
                    id="recruiter_linkedin"
                    name="recruiter_linkedin"
                    type="url"
                    placeholder="https://linkedin.com/in/..."
                    value={form.recruiter_linkedin}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="recruiter_notes">Recruiter Conversation Notes</label>
                <textarea
                  id="recruiter_notes"
                  name="recruiter_notes"
                  rows={3}
                  placeholder="Notes from recruiter outreach, screen conversation, or hiring manager alignment..."
                  value={form.recruiter_notes}
                  onChange={handleChange}
                />
              </div>

              <div className="form-actions-step">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveTab("basic")}
                >
                  ← Back to Details
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setActiveTab("dates")}
                >
                  Continue to Dates & Pipeline →
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: DATES & PIPELINE */}
          {activeTab === "dates" && (
            <div className="form-section-body">
              <div className="form-grid-two">
                <div className="form-group">
                  <label htmlFor="applied_date">Application Date</label>
                  <input
                    id="applied_date"
                    name="applied_date"
                    type="date"
                    value={form.applied_date}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="follow_up_date">Follow-up Date</label>
                  <input
                    id="follow_up_date"
                    name="follow_up_date"
                    type="date"
                    value={form.follow_up_date}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="follow_up_status">Follow-up Status</label>
                <select
                  id="follow_up_status"
                  name="follow_up_status"
                  value={form.follow_up_status}
                  onChange={handleChange}
                >
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Not Required">Not Required</option>
                </select>
              </div>

              <hr className="form-divider" />

              <h4>Optional: Schedule Initial Interview Round</h4>
              <div className="form-grid-three">
                <div className="form-group">
                  <label htmlFor="interview_round">Round Name</label>
                  <input
                    id="interview_round"
                    name="interview_round"
                    type="text"
                    placeholder="e.g. Round 1 – Technical DSA"
                    value={form.interview_round}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="interview_date">Interview Date</label>
                  <input
                    id="interview_date"
                    name="interview_date"
                    type="date"
                    value={form.interview_date}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="interview_type">Interview Type</label>
                  <select
                    id="interview_type"
                    name="interview_type"
                    value={form.interview_type}
                    onChange={handleChange}
                  >
                    <option value="Video">Video</option>
                    <option value="Phone">Phone</option>
                    <option value="In-person">In-person</option>
                    <option value="Technical">Technical</option>
                  </select>
                </div>
              </div>

              <div className="form-actions-step">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveTab("recruiter")}
                >
                  ← Back to Recruiter
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setActiveTab("resume")}
                >
                  Continue to Resume & Notes →
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: RESUME & NOTES */}
          {activeTab === "resume" && (
            <div className="form-section-body">
              <div className="form-group">
                <label htmlFor="app_resume_file">Attach Resume Used For This Application</label>
                <div className="file-drop-zone">
                  <FileText size={32} className="file-drop-icon" />
                  <div>
                    <strong>{resumeFile ? resumeFile.name : "Choose a PDF or DOCX file"}</strong>
                    <small>Maximum file size: 5 MB</small>
                  </div>
                  <input
                    id="app_resume_file"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="tags">Tags (comma separated)</label>
                <input
                  id="tags"
                  name="tags"
                  type="text"
                  placeholder="e.g. react, nodejs, fintech, startup"
                  value={form.tags}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="notes">Application Notes & Strategy</label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  placeholder="Write down any notes about salary expectations, interview prep focus, referrals, or key talking points..."
                  value={form.notes}
                  onChange={handleChange}
                />
              </div>

              <div className="form-actions-step final-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveTab("dates")}
                  disabled={loading}
                >
                  ← Back to Dates
                </button>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={loading}
                >
                  {loading ? "Saving Application..." : "Save Application"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </Layout>
  );
}