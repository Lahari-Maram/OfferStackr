import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Bell,
  Calendar,
  Clock,
  CheckCircle2,
  Plus,
  Trash2
} from "lucide-react";
import api from "../api/axios";
import Layout from "../components/Layout";
import ConfirmModal from "../components/ConfirmModal";
import "../styles/interviews.css";

export default function RemindersPage() {
  const [reminders, setReminders] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState("upcoming"); // "upcoming", "completed", "all"

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    job_id: "",
    title: "Send follow-up email after application",
    reminder_type: "followup", // "interview", "assessment", "followup", "custom"
    reminder_date: new Date().toISOString().split("T")[0],
    reminder_time: "10:00",
    offsets: "24h,1h",
    notes: ""
  });

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rRes, jRes] = await Promise.all([
        api.get("/reminders"),
        api.get("/jobs?limit=500")
      ]);
      setReminders(rRes.data || []);
      setJobs(jRes.data || []);
    } catch {
      toast.error("Failed to load reminders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getCountdown = (targetDate) => {
    if (!targetDate) return "—";
    const target = new Date(targetDate);
    const today = new Date(new Date().toDateString());
    const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Passed";
    if (diffDays === 0) return "Today 🔔";
    if (diffDays === 1) return "Tomorrow";
    return `In ${diffDays} days`;
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      job_id: jobs.length ? String(jobs[0].id) : "",
      title: "Follow up with recruiter regarding next steps",
      reminder_type: "followup",
      reminder_date: new Date().toISOString().split("T")[0],
      reminder_time: "10:00",
      offsets: "24h,1h",
      notes: ""
    });
    setShowModal(true);
  };

  const handleSaveReminder = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...form,
        job_id: form.job_id ? Number(form.job_id) : null,
      };

      if (editingId) {
        await api.put(`/reminders/${editingId}`, payload);
        toast.success("Reminder updated successfully!");
      } else {
        await api.post("/reminders", payload);
        toast.success("Custom reminder created!");
      }
      setShowModal(false);
      loadData();
    } catch {
      toast.error("Failed to save reminder");
    } finally {
      setSaving(false);
    }
  };

  const handleSetStatus = async (reminder, newStatus) => {
    if (!reminder.is_custom) {
      toast.info("Automatic pipeline reminder status updates automatically with the job/interview status.");
      return;
    }
    try {
      await api.patch(`/reminders/${reminder.id}/status`, { status: newStatus });
      toast.success(`Reminder marked as ${newStatus}`);
      loadData();
    } catch {
      toast.error("Failed to update reminder status");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await api.delete(`/reminders/${deleteTarget.id}`);
      toast.success("Reminder deleted");
      setDeleteTarget(null);
      loadData();
    } catch {
      toast.error("Failed to delete reminder");
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredReminders = reminders.filter((r) => {
    if (filterTab === "upcoming") return r.status === "Pending";
    if (filterTab === "completed") return r.status === "Completed" || r.status === "Dismissed";
    return true;
  });

  return (
    <Layout>
      <div className="interviews-page">
        {/* HEADER */}
        <div className="page-header-row">
          <div>
            <h1>Smart Reminders</h1>
            <p>Automated reminders for upcoming interviews, assessment deadlines, follow-ups, and custom alerts.</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} />
            <span>Create Custom Reminder</span>
          </button>
        </div>

        {/* TABS */}
        <div className="page-filter-tabs">
          <button
            type="button"
            className={`filter-tab ${filterTab === "upcoming" ? "active" : ""}`}
            onClick={() => setFilterTab("upcoming")}
          >
            Upcoming Alerts ({reminders.filter((r) => r.status === "Pending").length})
          </button>
          <button
            type="button"
            className={`filter-tab ${filterTab === "completed" ? "active" : ""}`}
            onClick={() => setFilterTab("completed")}
          >
            Completed & Dismissed ({reminders.filter((r) => r.status !== "Pending").length})
          </button>
          <button
            type="button"
            className={`filter-tab ${filterTab === "all" ? "active" : ""}`}
            onClick={() => setFilterTab("all")}
          >
            All Reminders ({reminders.length})
          </button>
        </div>

        {/* LIST */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading reminders...</p>
          </div>
        ) : filteredReminders.length === 0 ? (
          <div className="empty-state-box">
            <Bell size={48} className="empty-icon-muted" />
            <h3>No reminders right now</h3>
            <p>You have no scheduled reminders in this view.</p>
            <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
              Create a Reminder
            </button>
          </div>
        ) : (
          <div className="interview-cards-grid">
            {filteredReminders.map((r, i) => (
              <div
                key={r.id || i}
                className={`interview-card ${r.status !== "Pending" ? "card-completed" : ""}`}
              >
                <div className="interview-card-top">
                  <div>
                    <span className="interview-company">{r.company || "General"}</span>
                    <h3 className="interview-round-title">{r.title || r.message}</h3>
                  </div>
                  <span className={`countdown-badge ${r.status === "Pending" ? "badge-upcoming" : "badge-done"}`}>
                    {r.status === "Pending" ? getCountdown(r.date) : `✓ ${r.status}`}
                  </span>
                </div>

                <div className="interview-meta-grid">
                  <div className="meta-item">
                    <Calendar size={15} />
                    <span>{r.date}</span>
                  </div>
                  <div className="meta-item">
                    <Clock size={15} />
                    <span>{r.time || "09:00"}</span>
                  </div>
                  <div className="meta-item">
                    <Bell size={15} />
                    <span>Offsets: {r.offsets || "24h,1h"}</span>
                  </div>
                </div>

                {r.notes && (
                  <div className="notes-box">
                    <p>{r.notes}</p>
                  </div>
                )}

                <div className="interview-card-footer">
                  {r.is_custom ? (
                    <button
                      type="button"
                      className={`btn-toggle-done ${r.status === "Completed" ? "active" : ""}`}
                      onClick={() => handleSetStatus(r, r.status === "Completed" ? "Pending" : "Completed")}
                    >
                      <CheckCircle2 size={16} />
                      <span>{r.status === "Completed" ? "Mark Pending" : "Mark Done"}</span>
                    </button>
                  ) : (
                    <span className="auto-pill">⚡ Auto-Generated</span>
                  )}

                  {r.is_custom && (
                    <div className="footer-action-icons">
                      <button
                        type="button"
                        className="icon-action-btn delete"
                        onClick={() => setDeleteTarget(r)}
                        title="Delete reminder"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL */}
        {showModal && (
          <div className="modal-backdrop" onClick={() => setShowModal(false)}>
            <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3>Create Custom Reminder</h3>
                  <p>Configure reminder date, timing offsets, and associated job.</p>
                </div>
                <button type="button" className="drawer-close-btn" onClick={() => setShowModal(false)}>
                  ×
                </button>
              </div>

              <form onSubmit={handleSaveReminder} className="modal-form-body">
                <div className="form-group">
                  <label>Reminder Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Follow up on second round feedback"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Associated Application (Optional)</label>
                  <select
                    value={form.job_id}
                    onChange={(e) => setForm({ ...form, job_id: e.target.value })}
                  >
                    <option value="">None / General Reminder</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.company} — {j.role || "Role"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-grid-two">
                  <div className="form-group">
                    <label>Reminder Date *</label>
                    <input
                      type="date"
                      value={form.reminder_date}
                      onChange={(e) => setForm({ ...form, reminder_date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Reminder Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 10:00 AM"
                      value={form.reminder_time}
                      onChange={(e) => setForm({ ...form, reminder_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-two">
                  <div className="form-group">
                    <label>Reminder Type</label>
                    <select
                      value={form.reminder_type}
                      onChange={(e) => setForm({ ...form, reminder_type: e.target.value })}
                    >
                      <option value="followup">Follow-up</option>
                      <option value="interview">Interview</option>
                      <option value="assessment">Assessment</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Reminder Offsets</label>
                    <input
                      type="text"
                      placeholder="e.g. 24h,1h"
                      value={form.offsets}
                      onChange={(e) => setForm({ ...form, offsets: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Specific items to check or include..."
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
                    {saving ? "Saving..." : "Create Reminder"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE CONFIRM */}
        <ConfirmModal
          isOpen={!!deleteTarget}
          title="Delete Reminder"
          message={`Are you sure you want to delete this reminder: '${deleteTarget?.title || deleteTarget?.message}'?`}
          confirmText="Delete Reminder"
          type="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      </div>
    </Layout>
  );
}
