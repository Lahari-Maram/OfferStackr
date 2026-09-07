import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Calendar,
  Clock,
  Video,
  User,
  ExternalLink,
  Plus,
  CheckCircle2,
  Trash2,
  Edit,
  MapPin
} from "lucide-react";
import api from "../api/axios";
import Layout from "../components/Layout";
import ConfirmModal from "../components/ConfirmModal";
import "../styles/interviews.css";

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState("upcoming"); // "upcoming", "completed", "all"
  
  // Add/Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    job_id: "",
    round_name: "Round 1 – Technical DSA",
    interview_date: "",
    interview_time: "10:00 AM",
    interview_type: "Video",
    interviewer: "",
    interview_url: "",
    location: "",
    prep_notes: "",
    result_notes: "",
    status: "Scheduled"
  });

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [iRes, jRes] = await Promise.all([
        api.get("/interviews"),
        api.get("/jobs?limit=500")
      ]);
      setInterviews(iRes.data || []);
      setJobs(jRes.data || []);
    } catch {
      toast.error("Failed to load interview rounds");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getCountdown = (targetDate) => {
    if (!targetDate) return "Date TBA";
    const target = new Date(targetDate);
    const today = new Date(new Date().toDateString());
    const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Completed / Past";
    if (diffDays === 0) return "Today 🔥";
    if (diffDays === 1) return "Tomorrow ⚡";
    return `In ${diffDays} days`;
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      job_id: jobs.length ? String(jobs[0].id) : "",
      round_name: "Round 1 – Recruiter Screen",
      interview_date: new Date().toISOString().split("T")[0],
      interview_time: "10:00 AM",
      interview_type: "Video",
      interviewer: "",
      interview_url: "",
      location: "",
      prep_notes: "",
      result_notes: "",
      status: "Scheduled"
    });
    setShowModal(true);
  };

  const handleOpenEdit = (it) => {
    setEditingId(it.id);
    setForm({
      job_id: String(it.job_id),
      round_name: it.round_name,
      interview_date: it.interview_date || "",
      interview_time: it.interview_time || "10:00 AM",
      interview_type: it.interview_type || "Video",
      interviewer: it.interviewer || "",
      interview_url: it.interview_url || "",
      location: it.location || "",
      prep_notes: it.prep_notes || "",
      result_notes: it.result_notes || "",
      status: it.status || "Scheduled"
    });
    setShowModal(true);
  };

  const handleSaveInterview = async (e) => {
    e.preventDefault();
    if (!form.job_id) {
      toast.error("Please select an associated application");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        ...form,
        job_id: Number(form.job_id),
        interview_date: form.interview_date || null
      };

      if (editingId) {
        await api.put(`/interviews/${editingId}`, payload);
        toast.success("Interview round updated!");
      } else {
        await api.post(`/jobs/${form.job_id}/interviews`, payload);
        toast.success("Interview round scheduled!");
      }
      setShowModal(false);
      loadData();
    } catch {
      toast.error("Failed to save interview round");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleComplete = async (interviewId) => {
    try {
      await api.patch(`/interviews/${interviewId}/complete`);
      toast.success("Interview status updated!");
      loadData();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await api.delete(`/interviews/${deleteTarget.id}`);
      toast.success("Interview round deleted");
      setDeleteTarget(null);
      loadData();
    } catch {
      toast.error("Failed to delete interview");
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredInterviews = interviews.filter((it) => {
    if (filterTab === "upcoming") {
      return it.status === "Scheduled";
    }
    if (filterTab === "completed") {
      return it.status === "Completed";
    }
    return true;
  });

  return (
    <Layout>
      <div className="interviews-page">
        {/* HEADER */}
        <div className="page-header-row">
          <div>
            <h1>Interview Manager</h1>
            <p>Track multiple interview stages, meeting URLs, preparation notes, and outcomes.</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} />
            <span>Schedule Interview</span>
          </button>
        </div>

        {/* TABS */}
        <div className="page-filter-tabs">
          <button
            type="button"
            className={`filter-tab ${filterTab === "upcoming" ? "active" : ""}`}
            onClick={() => setFilterTab("upcoming")}
          >
            Upcoming Rounds ({interviews.filter((i) => i.status === "Scheduled").length})
          </button>
          <button
            type="button"
            className={`filter-tab ${filterTab === "completed" ? "active" : ""}`}
            onClick={() => setFilterTab("completed")}
          >
            Completed Rounds ({interviews.filter((i) => i.status === "Completed").length})
          </button>
          <button
            type="button"
            className={`filter-tab ${filterTab === "all" ? "active" : ""}`}
            onClick={() => setFilterTab("all")}
          >
            All Interviews ({interviews.length})
          </button>
        </div>

        {/* LIST */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading interview rounds...</p>
          </div>
        ) : filteredInterviews.length === 0 ? (
          <div className="empty-state-box">
            <Calendar size={48} className="empty-icon-muted" />
            <h3>No interview rounds found</h3>
            <p>
              {filterTab === "upcoming"
                ? "No upcoming interviews scheduled right now."
                : "No interview records match this filter."}
            </p>
            <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
              Schedule an Interview
            </button>
          </div>
        ) : (
          <div className="interview-cards-grid">
            {filteredInterviews.map((it) => (
              <div
                key={it.id}
                className={`interview-card ${it.status === "Completed" ? "card-completed" : ""}`}
              >
                <div className="interview-card-top">
                  <div>
                    <span className="interview-company">{it.company || "Company"}</span>
                    <h3 className="interview-round-title">{it.round_name}</h3>
                  </div>
                  <span className={`countdown-badge ${it.status === "Completed" ? "badge-done" : "badge-upcoming"}`}>
                    {it.status === "Completed" ? "✓ Completed" : getCountdown(it.interview_date)}
                  </span>
                </div>

                <div className="interview-meta-grid">
                  <div className="meta-item">
                    <Calendar size={15} />
                    <span>{it.interview_date || "Date TBA"}</span>
                  </div>
                  <div className="meta-item">
                    <Clock size={15} />
                    <span>{it.interview_time || "Time TBA"}</span>
                  </div>
                  <div className="meta-item">
                    <Video size={15} />
                    <span>{it.interview_type || "Video"}</span>
                  </div>
                  {it.interviewer && (
                    <div className="meta-item">
                      <User size={15} />
                      <span>{it.interviewer}</span>
                    </div>
                  )}
                  {it.location && (
                    <div className="meta-item">
                      <MapPin size={15} />
                      <span>{it.location}</span>
                    </div>
                  )}
                </div>

                {it.interview_url && (
                  <a
                    href={it.interview_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="meeting-url-btn"
                  >
                    <span>Join Meeting Link</span>
                    <ExternalLink size={14} />
                  </a>
                )}

                {it.prep_notes && (
                  <div className="notes-box">
                    <strong>Prep Focus:</strong>
                    <p>{it.prep_notes}</p>
                  </div>
                )}

                <div className="interview-card-footer">
                  <button
                    type="button"
                    className={`btn-toggle-done ${it.status === "Completed" ? "active" : ""}`}
                    onClick={() => handleToggleComplete(it.id)}
                  >
                    <CheckCircle2 size={16} />
                    <span>{it.status === "Completed" ? "Mark Scheduled" : "Mark Completed"}</span>
                  </button>

                  <div className="footer-action-icons">
                    <button
                      type="button"
                      className="icon-action-btn"
                      onClick={() => handleOpenEdit(it)}
                      title="Edit interview details"
                    >
                      <Edit size={15} />
                    </button>
                    <button
                      type="button"
                      className="icon-action-btn delete"
                      onClick={() => setDeleteTarget(it)}
                      title="Delete interview"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL */}
        {showModal && (
          <div className="modal-backdrop" onClick={() => setShowModal(false)}>
            <div className="modal-dialog large-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3>{editingId ? "Edit Interview Round" : "Schedule Interview Round"}</h3>
                  <p>Keep your round details, interviewer info, and prep strategy organized.</p>
                </div>
                <button type="button" className="drawer-close-btn" onClick={() => setShowModal(false)}>
                  ×
                </button>
              </div>

              <form onSubmit={handleSaveInterview} className="modal-form-body">
                <div className="form-group">
                  <label>Associated Application *</label>
                  <select
                    value={form.job_id}
                    onChange={(e) => setForm({ ...form, job_id: e.target.value })}
                    required
                    disabled={!!editingId}
                  >
                    <option value="">Select a job application...</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.company} — {j.role || "Role"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-grid-two">
                  <div className="form-group">
                    <label>Round Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Round 2 – Technical System Design"
                      value={form.round_name}
                      onChange={(e) => setForm({ ...form, round_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Interview Type</label>
                    <select
                      value={form.interview_type}
                      onChange={(e) => setForm({ ...form, interview_type: e.target.value })}
                    >
                      <option value="Video">Video Call</option>
                      <option value="Phone">Phone</option>
                      <option value="In-person">In-person</option>
                      <option value="Technical">Technical DSA</option>
                      <option value="Behavioral">Behavioral / HR</option>
                      <option value="System Design">System Design</option>
                      <option value="Managerial">Managerial / Final</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid-two">
                  <div className="form-group">
                    <label>Interview Date</label>
                    <input
                      type="date"
                      value={form.interview_date}
                      onChange={(e) => setForm({ ...form, interview_date: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Interview Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 2:00 PM EST"
                      value={form.interview_time}
                      onChange={(e) => setForm({ ...form, interview_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-two">
                  <div className="form-group">
                    <label>Interviewer Name / Title</label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe (Staff Eng)"
                      value={form.interviewer}
                      onChange={(e) => setForm({ ...form, interviewer: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Meeting Link / URL</label>
                    <input
                      type="url"
                      placeholder="https://meet.google.com/..."
                      value={form.interview_url}
                      onChange={(e) => setForm({ ...form, interview_url: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Preparation Notes & Focus Topics</label>
                  <textarea
                    rows={3}
                    placeholder="Questions to prepare, STAR stories, architecture notes, questions to ask interviewer..."
                    value={form.prep_notes}
                    onChange={(e) => setForm({ ...form, prep_notes: e.target.value })}
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Saving..." : editingId ? "Update Round" : "Schedule Round"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE CONFIRM */}
        <ConfirmModal
          isOpen={!!deleteTarget}
          title="Delete Interview Round"
          message={`Are you sure you want to delete '${deleteTarget?.round_name}' for ${deleteTarget?.company}?`}
          confirmText="Delete Round"
          type="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      </div>
    </Layout>
  );
}
