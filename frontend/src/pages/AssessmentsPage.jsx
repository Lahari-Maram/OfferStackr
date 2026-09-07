import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  CheckSquare,
  Calendar,
  ExternalLink,
  Plus,
  CheckCircle2,
  Trash2,
  Edit,
  Code,
  FileCheck
} from "lucide-react";
import api from "../api/axios";
import Layout from "../components/Layout";
import ConfirmModal from "../components/ConfirmModal";
import "../styles/interviews.css";

const PLATFORMS = ["HackerRank", "LeetCode", "CodeSignal", "TestGorilla", "Karat", "Take-home", "Custom"];
const ASSESSMENT_TYPES = ["Coding test", "Online assessment", "Aptitude test", "Technical test", "Take-home assignment", "System design assignment"];

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState("pending"); // "pending", "completed", "all"

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    job_id: "",
    name: "Online Coding Assessment",
    assessment_date: "",
    assessment_time: "23:59",
    assessment_type: "Coding test",
    platform: "HackerRank",
    assessment_url: "",
    notes: "",
    completed: 0
  });

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [aRes, jRes] = await Promise.all([
        api.get("/assessments"),
        api.get("/jobs?limit=500")
      ]);
      setAssessments(aRes.data || []);
      setJobs(jRes.data || []);
    } catch {
      toast.error("Failed to load assessments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getCountdown = (targetDate) => {
    if (!targetDate) return "No due date";
    const target = new Date(targetDate);
    const today = new Date(new Date().toDateString());
    const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Overdue / Passed";
    if (diffDays === 0) return "Due Today ⚡";
    if (diffDays === 1) return "Due Tomorrow 🔥";
    return `Due in ${diffDays} days`;
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      job_id: jobs.length ? String(jobs[0].id) : "",
      name: "HackerRank Coding Challenge",
      assessment_date: new Date().toISOString().split("T")[0],
      assessment_time: "23:59",
      assessment_type: "Coding test",
      platform: "HackerRank",
      assessment_url: "",
      notes: "",
      completed: 0
    });
    setShowModal(true);
  };

  const handleOpenEdit = (a) => {
    setEditingId(a.id);
    setForm({
      job_id: a.job_id ? String(a.job_id) : "",
      name: a.name,
      assessment_date: a.assessment_date || "",
      assessment_time: a.assessment_time || "",
      assessment_type: a.assessment_type || "Coding test",
      platform: a.platform || "HackerRank",
      assessment_url: a.assessment_url || "",
      notes: a.notes || "",
      completed: a.completed || 0
    });
    setShowModal(true);
  };

  const handleSaveAssessment = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...form,
        job_id: form.job_id ? Number(form.job_id) : null,
        assessment_date: form.assessment_date || null
      };

      if (editingId) {
        await api.put(`/assessments/${editingId}`, payload);
        toast.success("Assessment updated successfully!");
      } else {
        await api.post("/assessments", payload);
        toast.success("Assessment created successfully!");
      }
      setShowModal(false);
      loadData();
    } catch {
      toast.error("Failed to save assessment");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleComplete = async (assessmentId) => {
    try {
      await api.patch(`/assessments/${assessmentId}/toggle`);
      toast.success("Assessment status updated!");
      loadData();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await api.delete(`/assessments/${deleteTarget.id}`);
      toast.success("Assessment deleted");
      setDeleteTarget(null);
      loadData();
    } catch {
      toast.error("Failed to delete assessment");
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredAssessments = assessments.filter((a) => {
    if (filterTab === "pending") return a.completed === 0;
    if (filterTab === "completed") return a.completed === 1;
    return true;
  });

  return (
    <Layout>
      <div className="interviews-page">
        {/* HEADER */}
        <div className="page-header-row">
          <div>
            <h1>Assessment Tracking</h1>
            <p>Track coding assessments, take-home projects, test links, deadlines, and completion status.</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} />
            <span>Add Assessment</span>
          </button>
        </div>

        {/* TABS */}
        <div className="page-filter-tabs">
          <button
            type="button"
            className={`filter-tab ${filterTab === "pending" ? "active" : ""}`}
            onClick={() => setFilterTab("pending")}
          >
            Pending Tests ({assessments.filter((a) => a.completed === 0).length})
          </button>
          <button
            type="button"
            className={`filter-tab ${filterTab === "completed" ? "active" : ""}`}
            onClick={() => setFilterTab("completed")}
          >
            Completed Tests ({assessments.filter((a) => a.completed === 1).length})
          </button>
          <button
            type="button"
            className={`filter-tab ${filterTab === "all" ? "active" : ""}`}
            onClick={() => setFilterTab("all")}
          >
            All Assessments ({assessments.length})
          </button>
        </div>

        {/* LIST */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading assessments...</p>
          </div>
        ) : filteredAssessments.length === 0 ? (
          <div className="empty-state-box">
            <CheckSquare size={48} className="empty-icon-muted" />
            <h3>No assessments found</h3>
            <p>
              {filterTab === "pending"
                ? "No pending coding tests or take-home assignments."
                : "No assessments match this filter."}
            </p>
            <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
              Add an Assessment
            </button>
          </div>
        ) : (
          <div className="interview-cards-grid">
            {filteredAssessments.map((a) => (
              <div
                key={a.id}
                className={`interview-card ${a.completed === 1 ? "card-completed" : ""}`}
              >
                <div className="interview-card-top">
                  <div>
                    <span className="interview-company">{a.company || "General"}</span>
                    <h3 className="interview-round-title">{a.name}</h3>
                  </div>
                  <span className={`countdown-badge ${a.completed === 1 ? "badge-done" : "badge-upcoming"}`}>
                    {a.completed === 1 ? "✓ Completed" : getCountdown(a.assessment_date)}
                  </span>
                </div>

                <div className="interview-meta-grid">
                  <div className="meta-item">
                    <Code size={15} />
                    <span>{a.platform || "Platform"}</span>
                  </div>
                  <div className="meta-item">
                    <FileCheck size={15} />
                    <span>{a.assessment_type || "Coding test"}</span>
                  </div>
                  <div className="meta-item">
                    <Calendar size={15} />
                    <span>{a.assessment_date || "Date TBA"}</span>
                  </div>
                </div>

                {a.assessment_url && (
                  <a
                    href={a.assessment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="meeting-url-btn"
                  >
                    <span>Open Test Link</span>
                    <ExternalLink size={14} />
                  </a>
                )}

                {a.notes && (
                  <div className="notes-box">
                    <strong>Notes & Details:</strong>
                    <p>{a.notes}</p>
                  </div>
                )}

                <div className="interview-card-footer">
                  <button
                    type="button"
                    className={`btn-toggle-done ${a.completed === 1 ? "active" : ""}`}
                    onClick={() => handleToggleComplete(a.id)}
                  >
                    <CheckCircle2 size={16} />
                    <span>{a.completed === 1 ? "Mark Pending" : "Mark Completed"}</span>
                  </button>

                  <div className="footer-action-icons">
                    <button
                      type="button"
                      className="icon-action-btn"
                      onClick={() => handleOpenEdit(a)}
                      title="Edit assessment"
                    >
                      <Edit size={15} />
                    </button>
                    <button
                      type="button"
                      className="icon-action-btn delete"
                      onClick={() => setDeleteTarget(a)}
                      title="Delete assessment"
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
                  <h3>{editingId ? "Edit Assessment" : "Add Assessment"}</h3>
                  <p>Log coding challenges, online tests, and take-home assignments.</p>
                </div>
                <button type="button" className="drawer-close-btn" onClick={() => setShowModal(false)}>
                  ×
                </button>
              </div>

              <form onSubmit={handleSaveAssessment} className="modal-form-body">
                <div className="form-group">
                  <label>Associated Application (Optional)</label>
                  <select
                    value={form.job_id}
                    onChange={(e) => setForm({ ...form, job_id: e.target.value })}
                  >
                    <option value="">None / General Assessment</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.company} — {j.role || "Role"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-grid-two">
                  <div className="form-group">
                    <label>Assessment Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. HackerRank 90-min Coding Challenge"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Platform</label>
                    <select
                      value={form.platform}
                      onChange={(e) => setForm({ ...form, platform: e.target.value })}
                    >
                      {PLATFORMS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-grid-two">
                  <div className="form-group">
                    <label>Due Date</label>
                    <input
                      type="date"
                      value={form.assessment_date}
                      onChange={(e) => setForm({ ...form, assessment_date: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Assessment Type</label>
                    <select
                      value={form.assessment_type}
                      onChange={(e) => setForm({ ...form, assessment_type: e.target.value })}
                    >
                      {ASSESSMENT_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Assessment URL / Portal Link</label>
                  <input
                    type="url"
                    placeholder="https://hackerrank.com/test/..."
                    value={form.assessment_url}
                    onChange={(e) => setForm({ ...form, assessment_url: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Notes & Requirements</label>
                  <textarea
                    rows={3}
                    placeholder="Duration, allowed languages, problem types, test environment notes..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
                    {saving ? "Saving..." : editingId ? "Update Assessment" : "Save Assessment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE CONFIRM */}
        <ConfirmModal
          isOpen={!!deleteTarget}
          title="Delete Assessment"
          message={`Are you sure you want to delete '${deleteTarget?.name}'?`}
          confirmText="Delete Assessment"
          type="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      </div>
    </Layout>
  );
}
