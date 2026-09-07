import { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import {
  StickyNote,
  Plus,
  Search,
  Edit,
  Trash2
} from "lucide-react";
import api from "../api/axios";
import Layout from "../components/Layout";
import ConfirmModal from "../components/ConfirmModal";
import "../styles/careerhub.css";

const CATEGORIES = ["General", "Interview Prep", "Company Research", "Questions", "Technical", "HR"];

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "General",
    job_id: ""
  });

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [nRes, jRes] = await Promise.all([
        api.get("/notes"),
        api.get("/jobs?limit=500")
      ]);
      setNotes(nRes.data || []);
      setJobs(jRes.data || []);
    } catch {
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        (n.company && n.company.toLowerCase().includes(q));

      const matchesCategory =
        selectedCategory === "All" || n.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [notes, search, selectedCategory]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      title: "",
      content: "",
      category: "General",
      job_id: ""
    });
    setShowModal(true);
  };

  const handleOpenEdit = (n) => {
    setEditingId(n.id);
    setForm({
      title: n.title,
      content: n.content,
      category: n.category || "General",
      job_id: n.job_id ? String(n.job_id) : ""
    });
    setShowModal(true);
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Please provide both title and content");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category || "General",
        job_id: form.job_id ? Number(form.job_id) : null
      };

      if (editingId) {
        await api.put(`/notes/${editingId}`, payload);
        toast.success("Note updated successfully!");
      } else {
        await api.post("/notes", payload);
        toast.success("Note created successfully!");
      }
      setShowModal(false);
      loadData();
    } catch {
      toast.error("Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await api.delete(`/notes/${deleteTarget.id}`);
      toast.success("Note deleted");
      setDeleteTarget(null);
      loadData();
    } catch {
      toast.error("Failed to delete note");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Layout>
      <div className="career-prep-page">
        {/* HEADER */}
        <div className="page-header-row">
          <div>
            <h1>Career & Application Notes</h1>
            <p>Maintain your job-search scratchpad, company research, and conversation logs.</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} />
            <span>Create Note</span>
          </button>
        </div>

        {/* TOOLBAR */}
        <div className="notes-toolbar-bar">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search notes by title, keywords, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="category-pill-group">
            <button
              type="button"
              className={`cat-pill ${selectedCategory === "All" ? "active" : ""}`}
              onClick={() => setSelectedCategory("All")}
            >
              All Notes ({notes.length})
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                className={`cat-pill ${selectedCategory === c ? "active" : ""}`}
                onClick={() => setSelectedCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* LIST */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading notes...</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="empty-state-box">
            <StickyNote size={48} className="empty-icon-muted" />
            <h3>No notes found</h3>
            <p>Write your thoughts, research, or questions for your job search.</p>
            <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
              Create a Note
            </button>
          </div>
        ) : (
          <div className="user-prep-notes-grid">
            {filteredNotes.map((n) => (
              <div key={n.id} className="user-note-card full-note">
                <div className="note-card-head">
                  <div className="note-title-wrap">
                    <span className="note-category-tag">{n.category || "General"}</span>
                    {n.company && <span className="note-company-tag">💼 {n.company}</span>}
                    <strong>{n.title}</strong>
                  </div>
                  <div className="note-card-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => handleOpenEdit(n)}
                      title="Edit note"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn delete"
                      onClick={() => setDeleteTarget(n)}
                      title="Delete note"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <p className="note-card-body">{n.content}</p>

                <div className="note-footer-meta">
                  <small>Updated {new Date(n.updated_at).toLocaleDateString()}</small>
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
                  <h3>{editingId ? "Edit Note" : "Create New Note"}</h3>
                  <p>Organize your interview strategy, research, or company notes.</p>
                </div>
                <button type="button" className="drawer-close-btn" onClick={() => setShowModal(false)}>
                  ×
                </button>
              </div>

              <form onSubmit={handleSaveNote} className="modal-form-body">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Netflix Architecture & Culture Notes"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-grid-two">
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Associated Application (Optional)</label>
                    <select
                      value={form.job_id}
                      onChange={(e) => setForm({ ...form, job_id: e.target.value })}
                    >
                      <option value="">None / General Note</option>
                      {jobs.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.company} — {j.role || "Role"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Content *</label>
                  <textarea
                    rows={6}
                    placeholder="Write detailed notes..."
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    required
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
                    {saving ? "Saving..." : editingId ? "Update Note" : "Save Note"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE CONFIRM */}
        <ConfirmModal
          isOpen={!!deleteTarget}
          title="Delete Note"
          message={`Are you sure you want to delete note '${deleteTarget?.title}'?`}
          confirmText="Delete Note"
          type="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      </div>
    </Layout>
  );
}
