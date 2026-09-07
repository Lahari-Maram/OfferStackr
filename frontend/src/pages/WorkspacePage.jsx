import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";
import Layout from "../components/Layout";
import { useTheme } from "../context/ThemeContext";
import "../styles/workspace.css";

const meta = {
  interviews: ["Interviews", "Keep every upcoming interview in one place."],
  timeline: ["Timeline", "A chronological history of your job-search activity."],
  analytics: ["Analytics", "Measure application volume, response rate and progress."],
  reminders: ["Reminders", "Upcoming interviews and follow-ups that need attention."],
  goals: ["Goals", "Set a weekly application target and track your streak."],
  "resume-vault": ["Resume Vault", "Store your profile resume and the exact resume used for each application."],
  notes: ["Notes", "Capture useful notes while applying and interviewing."],
  reports: ["Reports", "Export and review your application data."],
  settings: ["Profile & Settings", "Manage your profile, preferences, resume and account."],
};

function WorkspacePage({ type }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [data, setData] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [profile, setProfile] = useState(null);
  const [goal, setGoal] = useState(10);
  const [note, setNote] = useState("");
  const [settingsProfile, setSettingsProfile] = useState({ name: "", email: "" });
  const [settingsResume, setSettingsResume] = useState(null);
  const [settingsGoal, setSettingsGoal] = useState(10);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsPassword, setSettingsPassword] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [settingsPasswordSaving, setSettingsPasswordSaving] = useState(false);
  const [settingsResumeUploading, setSettingsResumeUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem("jobtrack_notes") || "[]"); }
    catch { return []; }
  });

  const [title, subtitle] = meta[type] || ["Workspace", "OfferStackr workspace"];

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setData([]);
      setAnalytics(null);
      setProfile(null);
      try {
        if (type === "interviews") {
          const r = await api.get("/jobs/upcoming-interviews");
          if (!cancelled) setData(r.data);
        } else if (type === "timeline") {
          const r = await api.get("/timeline");
          if (!cancelled) setData(r.data);
        } else if (type === "reminders") {
          const r = await api.get("/reminders");
          if (!cancelled) setData(r.data);
        } else if (type === "analytics") {
          const r = await api.get("/dashboard/analytics");
          if (!cancelled) setAnalytics(r.data);
        } else if (type === "goals") {
          const r = await api.get("/dashboard/analytics");
          if (!cancelled) {
            setAnalytics(r.data);
            setGoal(r.data.week_goal ?? 10);
          }
        } else if (type === "resume-vault") {
          const [profileResponse, jobsResponse] = await Promise.all([
            api.get("/profile"),
            api.get("/jobs?limit=500"),
          ]);
          if (!cancelled) {
            setProfile(profileResponse.data);
            setData((jobsResponse.data || []).filter((j) => j.application_resume));
          }
        } else if (type === "settings") {
          const [profileResponse, analyticsResponse] = await Promise.all([
            api.get("/profile"),
            api.get("/dashboard/analytics"),
          ]);
          if (!cancelled) {
            setSettingsProfile({ name: profileResponse.data.name || "", email: profileResponse.data.email || "" });
            setSettingsGoal(analyticsResponse.data.week_goal ?? profileResponse.data.weekly_goal ?? 10);
            try {
              const resumeResponse = await api.get("/resume");
              if (!cancelled) setSettingsResume(resumeResponse.data);
            } catch (resumeError) {
              if (!cancelled && resumeError.response?.status !== 404) toast.error("Could not load your resume");
              if (!cancelled) setSettingsResume(null);
            }
          }
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error.response?.data?.detail || "Could not load this section");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [type, location.pathname]);

  const download = async (path, name) => {
    try {
      const r = await api.get(path, { responseType: "blob" });
      const u = URL.createObjectURL(r.data);
      const a = document.createElement("a");
      a.href = u;
      a.download = name || "download";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(u), 1000);
    } catch {
      toast.error("Download failed");
    }
  };

  const saveGoal = async () => {
    try {
      await api.put("/goal", { weekly_goal: Number(goal) });
      toast.success("Weekly goal updated");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Could not update goal");
    }
  };

  const saveNote = () => {
    if (!note.trim()) return;
    const next = [{ id: Date.now(), text: note.trim(), created: new Date().toLocaleString() }, ...notes];
    setNotes(next);
    localStorage.setItem("jobtrack_notes", JSON.stringify(next));
    setNote("");
    toast.success("Note saved");
  };

  const deleteNote = (id) => {
    const next = notes.filter((n) => n.id !== id);
    setNotes(next);
    localStorage.setItem("jobtrack_notes", JSON.stringify(next));
  };

  const saveSettingsProfile = async (e) => {
    e.preventDefault();
    try {
      setSettingsSaving(true);
      const r = await api.put("/profile", settingsProfile);
      setSettingsProfile({ name: r.data.name || "", email: r.data.email || "" });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Could not update profile");
    } finally {
      setSettingsSaving(false);
    }
  };

  const saveSettingsPassword = async (e) => {
    e.preventDefault();
    if (settingsPassword.new_password !== settingsPassword.confirm_password) {
      toast.error("New passwords do not match");
      return;
    }
    if (settingsPassword.new_password.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    try {
      setSettingsPasswordSaving(true);
      await api.put("/change-password", { current_password: settingsPassword.current_password, new_password: settingsPassword.new_password });
      setSettingsPassword({ current_password: "", new_password: "", confirm_password: "" });
      toast.success("Password changed successfully");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Could not change password");
    } finally {
      setSettingsPasswordSaving(false);
    }
  };

  const saveSettingsGoal = async () => {
    try {
      await api.put("/goal", { weekly_goal: Number(settingsGoal) });
      toast.success("Weekly application goal updated");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Could not update goal");
    }
  };

  const uploadSettingsResume = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setSettingsResumeUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      const r = await api.post("/resume", formData);
      setSettingsResume(r.data);
      toast.success("Resume uploaded successfully");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Could not upload resume");
    } finally {
      setSettingsResumeUploading(false);
      e.target.value = "";
    }
  };

  const downloadSettingsResume = async () => {
    await download("/resume/download", settingsResume?.original_filename || "resume");
  };

  const deleteSettingsResume = async () => {
    if (!window.confirm("Delete your profile resume?")) return;
    try {
      await api.delete("/resume");
      setSettingsResume(null);
      toast.success("Profile resume deleted");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Could not delete resume");
    }
  };

  const logoutFromSettings = () => {
    localStorage.removeItem("token");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const content = () => {
    if (loading) return <section className="workspace-card workspace-loading"><div className="loading-dot" />Loading {title}...</section>;

    if (type === "interviews") return <List title="Upcoming interviews" items={data} render={(j) => <><div><strong>{j.company}</strong><span>{j.role || "Interview"}</span></div><b>{j.interview_date || "—"}</b></>} />;
    if (type === "timeline") return <Timeline items={data} />;
    if (type === "reminders") return <List title="Next 7 days" items={data} render={(r) => <><div><strong>{r.company}</strong><span>{r.message}</span></div><b>{r.date}</b></>} />;
    if (type === "analytics") return <div className="workspace-grid">{[["Total applications", analytics?.total], ["This week", analytics?.this_week], ["Last week", analytics?.last_week], ["Response rate", `${analytics?.response_rate || 0}%`], ["Selection rate", `${analytics?.selection_rate || 0}%`], ["Avg. days to interview", analytics?.avg_days_to_interview ?? "—"]].map(([l, v]) => <div className="metric" key={l}><span>{l}</span><strong>{v ?? 0}</strong></div>)}</div>;
    if (type === "goals") return <div className="goal-box"><div className="metric"><span>Weekly target</span><strong>{analytics?.week_goal || goal}</strong></div><label>Change target<input type="number" min="1" max="1000" value={goal} onChange={(e) => setGoal(e.target.value)} /></label><button onClick={saveGoal}>Save goal</button><div className="goal-track"><i style={{ width: `${analytics?.goal_progress || 0}%` }} /></div><p>{analytics?.this_week || 0} applications this week · {analytics?.streak || 0} day streak</p></div>;
    if (type === "resume-vault") return <div><section className="workspace-card"><div className="workspace-card-head"><div><h2>Profile resume</h2><p className="muted">Your default resume used across your profile.</p></div><button onClick={() => navigate("/profile")}>Manage profile</button></div>{profile?.has_resume ? <div className="file-row"><div><strong>Your default resume</strong><span>Download the current profile resume.</span></div><button onClick={() => download("/resume/download", "profile-resume")}>Download</button></div> : <div className="resume-empty"><div className="resume-empty-icon">▱</div><div><strong>No profile resume yet</strong><p>Upload your default resume from Profile so it is always ready when you apply.</p></div><button onClick={() => navigate("/profile")}>Upload resume</button></div>}</section><section className="workspace-card"><h2>Application-specific resumes</h2><p className="muted">The exact resume attached to each job application.</p>{data.length ? data.map((j) => <div className="file-row" key={j.id}><div><strong>{j.company}</strong><span>{j.role || "Application"} · {j.application_resume.original_filename}</span></div><button onClick={() => download(`/jobs/${j.id}/resume/download`, j.application_resume.original_filename)}>Download</button></div>) : <div className="resume-empty compact"><div className="resume-empty-icon">📄</div><div><strong>No application-specific resumes yet</strong><p>Attach the exact resume you submitted when adding or editing an application.</p></div></div>}<button className="secondary-action" onClick={() => navigate("/jobs")}>Manage applications</button></section></div>;
    if (type === "notes") return <div><div className="note-compose"><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Write an application, interview or recruiter note..." /><button onClick={saveNote}>Save note</button></div><div className="note-list">{notes.map((n) => <div className="workspace-card" key={n.id}><div className="note-head"><span>{n.created}</span><button onClick={() => deleteNote(n.id)}>Delete</button></div><p>{n.text}</p></div>)}</div></div>;
    if (type === "reports") return <div className="workspace-card"><h2>Application report</h2><p className="muted">Export your complete application dataset for backup or analysis.</p><button onClick={async () => { try { const r = await api.get("/jobs/export/csv", { responseType: "blob" }); const u = URL.createObjectURL(r.data); const a = document.createElement("a"); a.href = u; a.download = "offerstackr_report.csv"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); toast.success("Report exported"); } catch { toast.error("Export failed"); } }}>Export CSV report</button></div>;
    if (type === "settings") return <div className="settings-layout">
      <section className="workspace-card settings-card">
        <div className="settings-section-heading"><div className="settings-icon">👤</div><div><h2>Profile Information</h2><p className="muted">Keep your name and email address up to date.</p></div></div>
        <form className="settings-form" onSubmit={saveSettingsProfile}>
          <label>Name<input value={settingsProfile.name} onChange={(e) => setSettingsProfile({ ...settingsProfile, name: e.target.value })} required /></label>
          <label>Email<input type="email" value={settingsProfile.email} onChange={(e) => setSettingsProfile({ ...settingsProfile, email: e.target.value })} required /></label>
          <button className="settings-primary" disabled={settingsSaving}>{settingsSaving ? "Saving..." : "Save profile"}</button>
        </form>
      </section>

      <section className="workspace-card settings-card">
        <div className="settings-section-heading"><div className="settings-icon">🔒</div><div><h2>Security</h2><p className="muted">Change your password without leaving OfferStackr.</p></div></div>
        <form className="settings-form" onSubmit={saveSettingsPassword}>
          <label>Current password<input type="password" value={settingsPassword.current_password} onChange={(e) => setSettingsPassword({ ...settingsPassword, current_password: e.target.value })} required /></label>
          <label>New password<input type="password" value={settingsPassword.new_password} onChange={(e) => setSettingsPassword({ ...settingsPassword, new_password: e.target.value })} minLength={6} required /></label>
          <label>Confirm new password<input type="password" value={settingsPassword.confirm_password} onChange={(e) => setSettingsPassword({ ...settingsPassword, confirm_password: e.target.value })} minLength={6} required /></label>
          <button className="settings-primary" disabled={settingsPasswordSaving}>{settingsPasswordSaving ? "Updating..." : "Change password"}</button>
        </form>
      </section>

      <section className="workspace-card settings-card">
        <div className="settings-section-heading"><div className="settings-icon">🎨</div><div><h2>Appearance</h2><p className="muted">Choose the interface theme. OfferStackr keeps text and controls readable in both modes.</p></div></div>
        <div className="settings-inline"><div><strong>Current theme</strong><span>{theme === "dark" ? "Dark mode" : "Light mode"}</span></div><button className="settings-secondary" onClick={toggleTheme}>Switch to {theme === "dark" ? "light" : "dark"} mode</button></div>
      </section>

      <section className="workspace-card settings-card">
        <div className="settings-section-heading"><div className="settings-icon">🎯</div><div><h2>Job Search Preferences</h2><p className="muted">Set the weekly application target you want to maintain.</p></div></div>
        <div className="settings-inline settings-goal"><div><strong>Weekly application goal</strong><span>Used by your Goals and Analytics pages.</span></div><div className="settings-goal-controls"><input type="number" min="1" max="1000" value={settingsGoal} onChange={(e) => setSettingsGoal(e.target.value)} /><button className="settings-secondary" onClick={saveSettingsGoal}>Save goal</button></div></div>
      </section>

      <section className="workspace-card settings-card">
        <div className="settings-section-heading"><div className="settings-icon">📄</div><div><h2>Profile Resume</h2><p className="muted">Manage the default resume available from your Resume Vault.</p></div></div>
        {settingsResume ? <div className="settings-resume-row"><div><strong>{settingsResume.original_filename}</strong><span>{Math.max(1, Math.round((settingsResume.size_bytes || 0) / 1024))} KB · uploaded {new Date(settingsResume.uploaded_at).toLocaleDateString()}</span></div><div className="settings-actions"><button className="settings-secondary" onClick={downloadSettingsResume}>Download</button><label className="settings-secondary file-button">{settingsResumeUploading ? "Uploading..." : "Replace"}<input hidden type="file" accept=".pdf,.doc,.docx" onChange={uploadSettingsResume} disabled={settingsResumeUploading} /></label><button className="settings-danger" onClick={deleteSettingsResume}>Delete</button></div></div> : <div className="settings-empty"><div><strong>No profile resume uploaded</strong><span>Upload a PDF or DOCX so your default resume is always ready.</span></div><label className="settings-primary file-button">Upload resume<input hidden type="file" accept=".pdf,.doc,.docx" onChange={uploadSettingsResume} disabled={settingsResumeUploading} /></label></div>}
      </section>

      <section className="workspace-card settings-card settings-account">
        <div className="settings-section-heading"><div className="settings-icon">⚙️</div><div><h2>Account</h2><p className="muted">Manage your current OfferStackr session.</p></div></div>
        <div className="settings-account-row"><div><strong>Signed in as</strong><span>{settingsProfile.email || "Your account"}</span></div><button className="settings-danger" onClick={logoutFromSettings}>Log out</button></div>
      </section>
    </div>;
    return <div className="workspace-card"><h2>{title}</h2><p>{subtitle}</p></div>;
  };

  return <Layout key={location.pathname}><div className="workspace-page"><div className="workspace-header"><div><h1>{title}</h1><p>{subtitle}</p></div></div>{content()}</div></Layout>;
}

function List({ title, items, render }) {
  return <section className="workspace-card"><h2>{title}</h2>{items.length ? items.map((x, i) => <div className="list-row" key={x.id || i}>{render(x)}</div>) : <div className="workspace-empty"><div className="empty-state-icon">✓</div><strong>Nothing to show right now</strong><p>New activity will appear here automatically.</p></div>}</section>;
}

function Timeline({ items }) {
  return <section className="workspace-card timeline-card"><div className="timeline-heading"><div><h2>Recent activity</h2><p className="muted">Your job-search history, newest first.</p></div><span className="timeline-count">{items.length} events</span></div>{items.length ? <div className="timeline-feed">{items.map((e) => <div className="timeline-feed-item" key={e.id}><div className="timeline-marker"><span /></div><div className="timeline-feed-content"><div className="timeline-feed-top"><strong>{e.event_type.replaceAll("_", " ")}</strong><time>{new Date(e.created_at).toLocaleString()}</time></div><p>{e.description}</p></div></div>)}</div> : <div className="workspace-empty"><div className="empty-state-icon">◷</div><strong>Your timeline is ready</strong><p>Application, interview, resume and status activity will appear here.</p></div>}</section>;
}

export default WorkspacePage;
