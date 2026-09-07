import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Code,
  Users,
  HelpCircle,
  Plus,
  StickyNote,
  ChevronDown,
  ChevronRight,
  Trash2,
  Edit
} from "lucide-react";
import api from "../api/axios";
import Layout from "../components/Layout";
import ConfirmModal from "../components/ConfirmModal";
import "../styles/careerhub.css";

export default function CareerPrepPage() {
  const [prepData, setPrepData] = useState(null);
  const [userNotes, setUserNotes] = useState([]);
  const [openSections, setOpenSections] = useState({ 0: true, 1: true, 2: true });

  // Custom Prep Note Modal
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteForm, setNoteForm] = useState({
    title: "",
    content: "",
    category: "Interview Prep"
  });
  const [noteSaving, setNoteSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadData = async () => {
    try {
      const [pRes, nRes] = await Promise.all([
        api.get("/interview-prep"),
        api.get("/notes?category=Interview%20Prep").catch(() => ({ data: [] }))
      ]);
      setPrepData(pRes.data);
      setUserNotes(nRes.data || []);
    } catch {
      toast.error("Failed to load interview prep materials");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleSection = (idx) => {
    setOpenSections((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleOpenAddNote = () => {
    setEditingNoteId(null);
    setNoteForm({
      title: "",
      content: "",
      category: "Interview Prep"
    });
    setShowNoteModal(true);
  };

  const handleOpenEditNote = (note) => {
    setEditingNoteId(note.id);
    setNoteForm({
      title: note.title,
      content: note.content,
      category: note.category || "Interview Prep"
    });
    setShowNoteModal(true);
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!noteForm.title.trim() || !noteForm.content.trim()) return;
    try {
      setNoteSaving(true);
      if (editingNoteId) {
        await api.put(`/notes/${editingNoteId}`, noteForm);
        toast.success("Preparation note updated!");
      } else {
        await api.post("/notes", noteForm);
        toast.success("Preparation note saved!");
      }
      setShowNoteModal(false);
      loadData();
    } catch {
      toast.error("Failed to save note");
    } finally {
      setNoteSaving(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/notes/${deleteTarget.id}`);
      toast.success("Note deleted");
      setDeleteTarget(null);
      loadData();
    } catch {
      toast.error("Failed to delete note");
    }
  };

  const getCategoryIcon = (idx) => {
    if (idx === 0) return <Code size={20} className="cat-icon blue" />;
    if (idx === 1) return <Users size={20} className="cat-icon purple" />;
    return <HelpCircle size={20} className="cat-icon green" />;
  };

  return (
    <Layout>
      <div className="career-prep-page">
        {/* HEADER */}
        <div className="page-header-row">
          <div>
            <h1>Interview Preparation & Playbooks</h1>
            <p>Master technical topics, leadership stories (STAR framework), and insightful questions to ask interviewers.</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={handleOpenAddNote}>
            <Plus size={16} />
            <span>Add Personal Prep Note</span>
          </button>
        </div>

        {/* CURATED GUIDE ACCORDIONS */}
        <div className="prep-categories-list">
          {prepData?.categories?.map((cat, catIdx) => (
            <div key={cat.title} className="prep-category-card">
              <div className="prep-cat-header" onClick={() => toggleSection(catIdx)}>
                <div className="cat-title-wrap">
                  {getCategoryIcon(catIdx)}
                  <h3>{cat.title}</h3>
                </div>
                <button type="button" className="collapse-toggle-icon" aria-label="Toggle section">
                  {openSections[catIdx] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>
              </div>

              {openSections[catIdx] && (
                <div className="prep-topics-grid">
                  {cat.topics.map((top) => (
                    <div key={top.name} className="prep-topic-box">
                      <h4>{top.name}</h4>
                      <ul>
                        {top.questions.map((q, qIdx) => (
                          <li key={qIdx}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CUSTOM USER PREP NOTES SECTION */}
        <div className="custom-prep-section">
          <div className="section-title-row">
            <div>
              <h3>My Personal Preparation Notes ({userNotes.length})</h3>
              <p>Your custom behavioral STAR stories, technical cheatsheets, and company research.</p>
            </div>
          </div>

          {userNotes.length === 0 ? (
            <div className="notes-empty-prompt">
              <StickyNote size={32} className="empty-icon-muted" />
              <p>No custom prep notes added yet.</p>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleOpenAddNote}>
                + Create Prep Note
              </button>
            </div>
          ) : (
            <div className="user-prep-notes-grid">
              {userNotes.map((n) => (
                <div key={n.id} className="user-note-card">
                  <div className="note-card-head">
                    <strong>{n.title}</strong>
                    <div className="note-card-actions">
                      <button type="button" className="icon-btn" onClick={() => handleOpenEditNote(n)}>
                        <Edit size={14} />
                      </button>
                      <button type="button" className="icon-btn delete" onClick={() => setDeleteTarget(n)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="note-card-body">{n.content}</p>
                  <small className="note-timestamp">
                    Updated {new Date(n.updated_at).toLocaleDateString()}
                  </small>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NOTE MODAL */}
        {showNoteModal && (
          <div className="modal-backdrop" onClick={() => setShowNoteModal(false)}>
            <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3>{editingNoteId ? "Edit Prep Note" : "New Interview Prep Note"}</h3>
                  <p>Document technical solutions, talking points, or company research.</p>
                </div>
                <button type="button" className="drawer-close-btn" onClick={() => setShowNoteModal(false)}>
                  ×
                </button>
              </div>

              <form onSubmit={handleSaveNote} className="modal-form-body">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Distributed Caching Trade-offs (Redis vs Memcached)"
                    value={noteForm.title}
                    onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Content *</label>
                  <textarea
                    rows={6}
                    placeholder="Write detailed notes, code snippets, STAR talking points..."
                    value={noteForm.content}
                    onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                    required
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowNoteModal(false)}
                    disabled={noteSaving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={noteSaving}>
                    {noteSaving ? "Saving..." : "Save Note"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE MODAL */}
        <ConfirmModal
          isOpen={!!deleteTarget}
          title="Delete Prep Note"
          message={`Are you sure you want to delete '${deleteTarget?.title}'?`}
          confirmText="Delete Note"
          type="danger"
          onConfirm={handleDeleteNote}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </Layout>
  );
}
