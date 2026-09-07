import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Briefcase,
  Calendar,
  CheckSquare,
  Award,
  Plus,
  Flame,
  ArrowUpRight,
  FileText,
  ChevronRight,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import api from "../api/axios";
import Layout from "../components/Layout";
import { useTheme } from "../context/ThemeContext";
import "../styles/dashboard.css";

const STATUS_COLORS = {
  Saved: "#64748b",
  Applied: "#3b82f6",
  Assessment: "#8b5cf6",
  Interview: "#06b6d4",
  Offer: "#10b981",
  Rejected: "#ef4444",
  Withdrawn: "#94a3b8"
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(10);
  const [goalSaving, setGoalSaving] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [pRes, dRes, aRes, jRes, iRes, fRes, assRes] = await Promise.all([
        api.get("/profile"),
        api.get("/dashboard"),
        api.get("/dashboard/analytics"),
        api.get("/jobs?limit=50"),
        api.get("/jobs/upcoming-interviews"),
        api.get("/jobs/upcoming-followups"),
        api.get("/assessments").catch(() => ({ data: [] }))
      ]);

      setProfile(pRes.data);
      setStats(dRes.data);
      setAnalytics(aRes.data);
      setGoalInput(dRes.data.weekly_goal || 10);
      
      // Sort recent jobs by applied_date desc or id desc
      const sortedJobs = [...(jRes.data || [])].sort((a, b) => {
        if (b.applied_date && a.applied_date) {
          return new Date(b.applied_date) - new Date(a.applied_date);
        }
        return b.id - a.id;
      });
      setRecentJobs(sortedJobs.slice(0, 5));
      setInterviews((iRes.data || []).slice(0, 5));
      setFollowups((fRes.data || []).slice(0, 5));
      
      const upcomingAss = (assRes.data || []).filter(a => a.completed === 0).slice(0, 5);
      setAssessments(upcomingAss);
    } catch (error) {
      console.error("Dashboard error:", error);
      toast.error("Could not load dashboard information");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    try {
      setGoalSaving(true);
      await api.put("/goal", { weekly_goal: Number(goalInput) });
      toast.success("Weekly application goal updated!");
      setEditingGoal(false);
      loadDashboardData();
    } catch {
      toast.error("Failed to update goal");
    } finally {
      setGoalSaving(false);
    }
  };

  const getCountdown = (targetDate) => {
    if (!targetDate) return "—";
    const target = new Date(targetDate);
    const today = new Date(new Date().toDateString());
    const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return `In ${diffDays} days`;
  };

  // Prepare chart data
  const pieData = stats
    ? [
        { name: "Saved", value: stats.saved, color: STATUS_COLORS.Saved },
        { name: "Applied", value: stats.applied, color: STATUS_COLORS.Applied },
        { name: "Assessment", value: stats.assessment, color: STATUS_COLORS.Assessment },
        { name: "Interview", value: stats.interview, color: STATUS_COLORS.Interview },
        { name: "Offer", value: stats.offer, color: STATUS_COLORS.Offer },
        { name: "Rejected", value: stats.rejected, color: STATUS_COLORS.Rejected },
      ].filter((item) => item.value > 0)
    : [];

  const activityData = analytics?.weekly_activity || [];

  if (loading && !stats) {
    return (
      <Layout>
        <div className="dashboard-loading-state">
          <div className="spinner" />
          <p>Loading your career command center...</p>
        </div>
      </Layout>
    );
  }

  const name = profile?.name || "there";

  return (
    <Layout>
      <div className="dashboard-page">
        {/* HERO BANNER */}
        <div className="dashboard-header-hero">
          <div className="hero-greeting">
            <div className="greeting-badge">
              <Sparkles size={16} />
              <span>CAREER OVERVIEW</span>
            </div>
            <h1>Welcome back, {name}! 👋</h1>
            <p>Here is the real-time status of your job-search pipeline and upcoming milestones.</p>
          </div>

          <div className="hero-actions-bar">
            <button
              type="button"
              className="btn-dash-primary"
              onClick={() => navigate("/add-job")}
            >
              <Plus size={18} />
              <span>Add Application</span>
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="dashboard-stats-grid">
          <div className="stat-card total-card" onClick={() => navigate("/jobs")}>
            <div className="stat-icon-wrap">
              <Briefcase size={22} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Applications</span>
              <strong className="stat-value">{stats?.total_jobs || 0}</strong>
              <small className="stat-hint">{stats?.this_week_applications || 0} added this week</small>
            </div>
          </div>

          <div className="stat-card streak-card" onClick={() => navigate("/goals")}>
            <div className="stat-icon-wrap streak-icon">
              <Flame size={22} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Application Streak</span>
              <strong className="stat-value">{stats?.current_streak || 0} Days</strong>
              <small className="stat-hint">Consistent momentum 🔥</small>
            </div>
          </div>

          <div className="stat-card interview-card" onClick={() => navigate("/interviews")}>
            <div className="stat-icon-wrap interview-icon">
              <Calendar size={22} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Interviews</span>
              <strong className="stat-value">{stats?.interview || 0}</strong>
              <small className="stat-hint">{stats?.upcoming_interviews_count || 0} upcoming round(s)</small>
            </div>
          </div>

          <div className="stat-card assessment-card" onClick={() => navigate("/assessments")}>
            <div className="stat-icon-wrap assessment-icon">
              <CheckSquare size={22} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Assessments</span>
              <strong className="stat-value">{stats?.assessment || 0}</strong>
              <small className="stat-hint">{stats?.upcoming_assessments_count || 0} pending test(s)</small>
            </div>
          </div>

          <div className="stat-card offer-card" onClick={() => navigate("/jobs")}>
            <div className="stat-icon-wrap offer-icon">
              <Award size={22} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Job Offers</span>
              <strong className="stat-value">{stats?.offer || 0}</strong>
              <small className="stat-hint">Celebration ready 🎉</small>
            </div>
          </div>
        </div>

        {/* GOAL PROGRESS & PIPELINE OVERVIEW */}
        <div className="dashboard-two-col-grid">
          {/* WEEKLY GOAL CARD */}
          <div className="dash-card goal-overview-card">
            <div className="dash-card-header">
              <div>
                <h3>Weekly Application Target</h3>
                <p>Stay on track to hit your job-search goal.</p>
              </div>
              <button
                type="button"
                className="btn-dash-subtle"
                onClick={() => setEditingGoal(!editingGoal)}
              >
                {editingGoal ? "Cancel" : "Edit Target"}
              </button>
            </div>

            {editingGoal ? (
              <form onSubmit={handleSaveGoal} className="goal-edit-form">
                <label htmlFor="dash-goal-input">Weekly Target (Applications)</label>
                <div className="goal-input-group">
                  <input
                    id="dash-goal-input"
                    type="number"
                    min="1"
                    max="500"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn-dash-primary small" disabled={goalSaving}>
                    {goalSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="goal-display">
                <div className="goal-numbers">
                  <span className="current-count">{stats?.this_week_applications || 0}</span>
                  <span className="divider">/</span>
                  <span className="target-count">{stats?.weekly_goal || 10}</span>
                  <span className="goal-unit">applications this week</span>
                </div>

                <div className="goal-progress-bar-wrap">
                  <div
                    className="goal-progress-bar"
                    style={{ width: `${stats?.goal_progress || 0}%` }}
                  />
                </div>

                <div className="goal-progress-footer">
                  <span>{stats?.goal_progress || 0}% Completed</span>
                  <span>
                    {Math.max(0, (stats?.weekly_goal || 10) - (stats?.this_week_applications || 0))} remaining
                  </span>
                </div>
              </div>
            )}

            <div className="quick-actions-grid">
              <button
                type="button"
                className="quick-action-item"
                onClick={() => navigate("/add-job")}
              >
                <Plus size={18} className="qa-icon" />
                <div>
                  <strong>Add Application</strong>
                  <small>Log new role</small>
                </div>
              </button>

              <button
                type="button"
                className="quick-action-item"
                onClick={() => navigate("/interviews")}
              >
                <Calendar size={18} className="qa-icon" />
                <div>
                  <strong>Interviews</strong>
                  <small>Manage rounds</small>
                </div>
              </button>

              <button
                type="button"
                className="quick-action-item"
                onClick={() => navigate("/resume-vault")}
              >
                <FileText size={18} className="qa-icon" />
                <div>
                  <strong>Resume Vault</strong>
                  <small>View resumes</small>
                </div>
              </button>

              <button
                type="button"
                className="quick-action-item"
                onClick={() => navigate("/career-prep")}
              >
                <Sparkles size={18} className="qa-icon" />
                <div>
                  <strong>Career Prep</strong>
                  <small>Interview Q&A</small>
                </div>
              </button>
            </div>
          </div>

          {/* STATUS BREAKDOWN CHART */}
          <div className="dash-card status-chart-card">
            <div className="dash-card-header">
              <div>
                <h3>Pipeline Distribution</h3>
                <p>Breakdown by current application status.</p>
              </div>
              <span className="rate-badge">
                Interview Rate: {analytics?.interview_rate || 0}%
              </span>
            </div>

            {pieData.length === 0 ? (
              <div className="dash-empty-state">
                <Briefcase size={36} className="empty-icon-muted" />
                <p>No application data yet</p>
                <small>Add applications to visualize your pipeline stages.</small>
              </div>
            ) : (
              <div className="chart-container-wrap">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={4}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                        borderColor: theme === "dark" ? "#334155" : "#e2e8f0",
                        color: theme === "dark" ? "#f8fafc" : "#0f172a",
                        borderRadius: "8px",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* 7-DAY ACTIVITY CHART */}
        <div className="dash-card activity-trend-card">
          <div className="dash-card-header">
            <div>
              <h3>7-Day Application Activity</h3>
              <p>Daily applications submitted over the past week.</p>
            </div>
            <button
              type="button"
              className="btn-dash-subtle"
              onClick={() => navigate("/analytics")}
            >
              Full Analytics <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="activity-chart-wrap">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#1e293b" : "#f1f5f9"} />
                <XAxis dataKey="day" stroke={theme === "dark" ? "#64748b" : "#94a3b8"} fontSize={12} />
                <YAxis allowDecimals={false} stroke={theme === "dark" ? "#64748b" : "#94a3b8"} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                    borderColor: theme === "dark" ? "#334155" : "#e2e8f0",
                    color: theme === "dark" ? "#f8fafc" : "#0f172a",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="applications" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Applications" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* THREE COLUMNS: RECENT APPS, UPCOMING INTERVIEWS, ASSESSMENTS & FOLLOW-UPS */}
        <div className="dashboard-three-col-grid">
          {/* RECENT APPLICATIONS */}
          <div className="dash-card mini-list-card">
            <div className="dash-card-header">
              <div>
                <h3>Recent Applications</h3>
                <p>Latest submissions.</p>
              </div>
              <button
                type="button"
                className="btn-dash-subtle"
                onClick={() => navigate("/jobs")}
              >
                View all <ChevronRight size={14} />
              </button>
            </div>

            {recentJobs.length === 0 ? (
              <div className="mini-empty">
                <Briefcase size={24} className="empty-icon-muted" />
                <p>No applications yet</p>
                <button
                  type="button"
                  className="btn-dash-primary small"
                  onClick={() => navigate("/add-job")}
                >
                  Add your first job
                </button>
              </div>
            ) : (
              <div className="mini-item-list">
                {recentJobs.map((j) => (
                  <div
                    key={j.id}
                    className="mini-list-item"
                    onClick={() => navigate("/jobs")}
                  >
                    <div className="mini-info">
                      <strong className="mini-company">{j.company}</strong>
                      <span className="mini-role">{j.role || "Role not specified"}</span>
                    </div>
                    <div className="mini-status-side">
                      <span className={`status-pill status-${(j.status || "applied").toLowerCase()}`}>
                        {j.status || "Applied"}
                      </span>
                      <small className="mini-date">{j.applied_date || "—"}</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* UPCOMING INTERVIEWS */}
          <div className="dash-card mini-list-card">
            <div className="dash-card-header">
              <div>
                <h3>Upcoming Interviews</h3>
                <p>Scheduled rounds.</p>
              </div>
              <button
                type="button"
                className="btn-dash-subtle"
                onClick={() => navigate("/interviews")}
              >
                View all <ChevronRight size={14} />
              </button>
            </div>

            {interviews.length === 0 ? (
              <div className="mini-empty">
                <Calendar size={24} className="empty-icon-muted" />
                <p>No upcoming interviews</p>
                <small>Keep applying and practicing!</small>
              </div>
            ) : (
              <div className="mini-item-list">
                {interviews.map((j) => (
                  <div
                    key={j.id}
                    className="mini-list-item"
                    onClick={() => navigate("/interviews")}
                  >
                    <div className="mini-info">
                      <strong className="mini-company">{j.company}</strong>
                      <span className="mini-role">{j.interview_round || j.role || "Interview"}</span>
                    </div>
                    <div className="mini-status-side">
                      <span className="countdown-tag highlight">
                        {getCountdown(j.interview_date)}
                      </span>
                      <small className="mini-date">{j.interview_date || "—"}</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ASSESSMENTS & FOLLOW-UPS */}
          <div className="dash-card mini-list-card">
            <div className="dash-card-header">
              <div>
                <h3>Action Items</h3>
                <p>Assessments & Follow-ups due.</p>
              </div>
              <button
                type="button"
                className="btn-dash-subtle"
                onClick={() => navigate("/reminders")}
              >
                Reminders <ChevronRight size={14} />
              </button>
            </div>

            {assessments.length === 0 && followups.length === 0 ? (
              <div className="mini-empty">
                <CheckCircle2 size={24} className="empty-icon-muted" />
                <p>All caught up!</p>
                <small>No pending follow-ups or tests.</small>
              </div>
            ) : (
              <div className="mini-item-list">
                {assessments.map((a) => (
                  <div
                    key={`ass-${a.id}`}
                    className="mini-list-item"
                    onClick={() => navigate("/assessments")}
                  >
                    <div className="mini-info">
                      <strong className="mini-company">{a.name}</strong>
                      <span className="mini-role">{a.platform || "Assessment"} · {a.company || "Job"}</span>
                    </div>
                    <div className="mini-status-side">
                      <span className="countdown-tag alert">
                        {getCountdown(a.assessment_date)}
                      </span>
                      <small className="mini-date">{a.assessment_date || "—"}</small>
                    </div>
                  </div>
                ))}
                {followups.map((f) => (
                  <div
                    key={`fup-${f.id}`}
                    className="mini-list-item"
                    onClick={() => navigate("/jobs")}
                  >
                    <div className="mini-info">
                      <strong className="mini-company">Follow up with {f.company}</strong>
                      <span className="mini-role">{f.role || "Application"}</span>
                    </div>
                    <div className="mini-status-side">
                      <span className="countdown-tag">
                        {getCountdown(f.follow_up_date)}
                      </span>
                      <small className="mini-date">{f.follow_up_date || "—"}</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
