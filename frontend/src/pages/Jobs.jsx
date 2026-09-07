import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Briefcase,
  Kanban,
  List,
  Search,
  Plus,
  Download,
  Upload,
  Copy,
  Trash2,
  Edit,
  ExternalLink,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Phone,
  Globe,
  MapPin
} from "lucide-react";
import api from "../api/axios";
import Layout from "../components/Layout";
import ConfirmModal from "../components/ConfirmModal";
import "../styles/jobs.css";

const STATUSES = ["Saved", "Applied", "Assessment", "Interview", "Offer", "Rejected", "Withdrawn"];
const PRIORITIES = ["High", "Medium", "Low"];
const WORK_MODES = ["Remote", "Hybrid", "On-site"];
const EMPLOYMENT_TYPES = ["Full-time", "Internship", "Contract", "Part-time"];

const normalizeStatus = (s) => {
  if (!s) return "Applied";
  const lower = s.trim().toLowerCase();
  if (lower.includes("saved") || lower.includes("wishlist")) return "Saved";
  if (lower.includes("assessment") || lower.includes("online test") || lower.includes("oa")) return "Assessment";
  if (lower.includes("interview")) return "Interview";
  if (lower.includes("offer") || lower.includes("selected")) return "Offer";
  if (lower.includes("reject")) return "Rejected";
  if (lower.includes("withdraw")) return "Withdrawn";
  return "Applied";
};

const getSafeUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  try {
    const parsed = new URL(url.trim());
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
};

export default function Jobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("offerstackr_jobs_view") || "board"); // "board" or "table"
  
  // Search & Filter State
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [selectedWorkMode, setSelectedWorkMode] = useState("All");
  const [selectedEmpType, setSelectedEmpType] = useState("All");
  const [sortBy, setSortBy] = useState("applied_date");
  const [sortOrder, setSortOrder] = useState("desc");
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Modal & Drawer State
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobTimeline, setJobTimeline] = useState([]);
  const [jobInterviews, setJobInterviews] = useState([]);
  const [jobAssessments, setJobAssessments] = useState([]);
  const [drawerTab, setDrawerTab] = useState("overview"); // "overview", "interviews", "assessments", "timeline"
  
  // Quick Add / Edit state
  const [editingJob, setEditingJob] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  
  // Resume upload state
  const [uploadingResumeJobId, setUploadingResumeJobId] = useState(null);
  const fileInputRef = useRef(null);
  const csvInputRef = useRef(null);
  
  // Confirm Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // New Interview Round Inline in Drawer
  const [showAddInterview, setShowAddInterview] = useState(false);
  const [newInterview, setNewInterview] = useState({
    round_name: "Round 1 – Recruiter Screen",
    interview_date: "",
    interview_time: "10:00 AM",
    interview_type: "Video",
    interviewer: "",
    interview_url: "",
    prep_notes: ""
  });

  // New Assessment Inline in Drawer
  const [showAddAssessment, setShowAddAssessment] = useState(false);
  const [newAssessment, setNewAssessment] = useState({
    name: "Coding Assessment",
    assessment_date: "",
    assessment_type: "Coding test",
    platform: "HackerRank",
    assessment_url: "",
    notes: ""
  });

  const loadJobs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/jobs?limit=1000");
      setJobs(res.data || []);
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const switchViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem("offerstackr_jobs_view", mode);
  };

  // Filter & Search Logic
  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const q = search.toLowerCase().trim();
      const normStatus = normalizeStatus(j.status);
      
      const matchesSearch =
        !q ||
        [j.company, j.role, j.portal, j.tags, j.location, j.recruiter_name, j.notes]
          .some((val) => (val || "").toLowerCase().includes(q));

      const matchesStatus =
        selectedStatus === "All" || normStatus === selectedStatus;

      const matchesPriority =
        selectedPriority === "All" || (j.priority || "Medium") === selectedPriority;

      const matchesWorkMode =
        selectedWorkMode === "All" || j.work_mode === selectedWorkMode;

      const matchesEmpType =
        selectedEmpType === "All" || j.employment_type === selectedEmpType;

      return matchesSearch && matchesStatus && matchesPriority && matchesWorkMode && matchesEmpType;
    }).sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      
      if (sortBy === "applied_date") {
        valA = a.applied_date ? new Date(a.applied_date).getTime() : 0;
        valB = b.applied_date ? new Date(b.applied_date).getTime() : 0;
      } else if (sortBy === "company") {
        valA = (a.company || "").toLowerCase();
        valB = (b.company || "").toLowerCase();
      } else if (sortBy === "priority") {
        const pMap = { High: 3, Medium: 2, Low: 1 };
        valA = pMap[a.priority] || 2;
        valB = pMap[b.priority] || 2;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [jobs, search, selectedStatus, selectedPriority, selectedWorkMode, selectedEmpType, sortBy, sortOrder]);

  // Pagination calculations for Table View
  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedJobs = filteredJobs.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Quick Status Transition (Kanban or Table)
  const handleQuickStatusChange = async (jobId, newStatus) => {
    try {
      await api.patch(`/jobs/${jobId}/status`, { status: newStatus });
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
      );
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob((prev) => ({ ...prev, status: newStatus }));
      }
      toast.success(`Moved to ${newStatus}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  // Duplicate Job
  const handleDuplicateJob = async (jobId) => {
    try {
      await api.post(`/jobs/${jobId}/duplicate`);
      toast.success("Application duplicated!");
      loadJobs();
    } catch {
      toast.error("Failed to duplicate application");
    }
  };

  // Open Drawer & load sub-resources
  const handleOpenDrawer = async (job) => {
    setSelectedJob(job);
    setDrawerTab("overview");
    setShowAddInterview(false);
    setShowAddAssessment(false);
    
    try {
      const [tRes, iRes, aRes] = await Promise.all([
        api.get(`/jobs/${job.id}/timeline`),
        api.get(`/jobs/${job.id}/interviews`),
        api.get(`/jobs/${job.id}/assessments`),
      ]);
      setJobTimeline(tRes.data || []);
      setJobInterviews(iRes.data || []);
      setJobAssessments(aRes.data || []);
    } catch {
      // ignore
    }
  };

  // Edit Job Form
  const handleOpenEdit = (job) => {
    setEditingJob(job);
    setEditForm({
      company: job.company || "",
      role: job.role || "",
      portal: job.portal || "",
      status: normalizeStatus(job.status),
      priority: job.priority || "Medium",
      work_mode: job.work_mode || "Remote",
      employment_type: job.employment_type || "Full-time",
      location: job.location || "",
      salary: job.salary || "",
      applied_date: job.applied_date || "",
      follow_up_date: job.follow_up_date || "",
      follow_up_status: job.follow_up_status || "Pending",
      recruiter_name: job.recruiter_name || "",
      recruiter_email: job.recruiter_email || "",
      recruiter_phone: job.recruiter_phone || "",
      recruiter_linkedin: job.recruiter_linkedin || "",
      recruiter_notes: job.recruiter_notes || "",
      job_url: job.job_url || "",
      tags: job.tags || "",
      notes: job.notes || ""
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      setEditSaving(true);
      await api.put(`/jobs/${editingJob.id}`, {
        ...editForm,
        applied_date: editForm.applied_date || null,
        follow_up_date: editForm.follow_up_date || null
      });
      toast.success("Application updated successfully!");
      setEditingJob(null);
      loadJobs();
      if (selectedJob && selectedJob.id === editingJob.id) {
        handleOpenDrawer({ ...selectedJob, ...editForm });
      }
    } catch {
      toast.error("Failed to update application");
    } finally {
      setEditSaving(false);
    }
  };

  // Delete Job
  const handleDeleteJob = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await api.delete(`/jobs/${deleteTarget.id}`);
      toast.success(`Application for ${deleteTarget.company} deleted`);
      setDeleteTarget(null);
      if (selectedJob?.id === deleteTarget.id) setSelectedJob(null);
      loadJobs();
    } catch {
      toast.error("Failed to delete application");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Resume Actions
  const handleUploadResume = async (jobId, file) => {
    if (!file) return;
    try {
      setUploadingResumeJobId(jobId);
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post(`/jobs/${jobId}/resume`, fd);
      toast.success("Resume attached to application!");
      loadJobs();
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob((prev) => ({ ...prev, application_resume: res.data }));
      }
    } catch (error) {
      const errDetail = error.response?.data?.detail;
      toast.error(typeof errDetail === "string" ? errDetail : "Failed to upload resume");
    } finally {
      setUploadingResumeJobId(null);
    }
  };

  const handleDownloadResume = async (job) => {
    try {
      const res = await api.get(`/jobs/${job.id}/resume/download`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = job.application_resume?.original_filename || `${job.company}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download resume file");
    }
  };

  const handleDeleteResume = async (jobId) => {
    try {
      await api.delete(`/jobs/${jobId}/resume`);
      toast.success("Application resume removed");
      loadJobs();
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob((prev) => ({ ...prev, application_resume: null }));
      }
    } catch {
      toast.error("Failed to delete application resume");
    }
  };

  // Multiple Interview Rounds from Drawer
  const handleAddInterview = async (e) => {
    e.preventDefault();
    if (!newInterview.round_name.trim()) return;
    try {
      const res = await api.post(`/jobs/${selectedJob.id}/interviews`, {
        ...newInterview,
        interview_date: newInterview.interview_date || null
      });
      setJobInterviews((prev) => [...prev, res.data]);
      setShowAddInterview(false);
      setNewInterview({
        round_name: "Round 2 – Technical DSA",
        interview_date: "",
        interview_time: "10:00 AM",
        interview_type: "Video",
        interviewer: "",
        interview_url: "",
        prep_notes: ""
      });
      toast.success("Interview round added!");
      loadJobs();
    } catch {
      toast.error("Failed to add interview round");
    }
  };

  const handleToggleInterviewStatus = async (interviewId) => {
    try {
      await api.patch(`/interviews/${interviewId}/complete`);
      setJobInterviews((prev) =>
        prev.map((i) =>
          i.id === interviewId
            ? { ...i, status: i.status === "Completed" ? "Scheduled" : "Completed" }
            : i
        )
      );
      toast.success("Interview status updated");
    } catch {
      toast.error("Failed to update interview");
    }
  };

  // Add Assessment from Drawer
  const handleAddAssessment = async (e) => {
    e.preventDefault();
    if (!newAssessment.name.trim()) return;
    try {
      const res = await api.post(`/jobs/${selectedJob.id}/assessments`, {
        ...newAssessment,
        assessment_date: newAssessment.assessment_date || null
      });
      setJobAssessments((prev) => [...prev, res.data]);
      setShowAddAssessment(false);
      setNewAssessment({
        name: "Take-home Assignment",
        assessment_date: "",
        assessment_type: "Take-home assignment",
        platform: "Custom",
        assessment_url: "",
        notes: ""
      });
      toast.success("Assessment added!");
      loadJobs();
    } catch {
      toast.error("Failed to add assessment");
    }
  };

  const handleToggleAssessment = async (assessmentId) => {
    try {
      await api.patch(`/assessments/${assessmentId}/toggle`);
      setJobAssessments((prev) =>
        prev.map((a) =>
          a.id === assessmentId ? { ...a, completed: a.completed === 1 ? 0 : 1 } : a
        )
      );
      toast.success("Assessment status updated");
    } catch {
      toast.error("Failed to update assessment");
    }
  };

  // CSV Import & Export
  const handleExportCSV = async () => {
    try {
      const res = await api.get("/jobs/export/csv", { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "offerstackr_applications.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("CSV export downloaded!");
    } catch {
      toast.error("Failed to export CSV");
    }
  };

  const handleImportCSVFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/jobs/import/csv", fd);
      toast.success(res.data.message || `Imported ${res.data.imported_count} applications!`);
      loadJobs();
    } catch (error) {
      const errDetail = error.response?.data?.detail;
      toast.error(typeof errDetail === "string" ? errDetail : "CSV Import failed. Please check format.");
    } finally {
      e.target.value = "";
    }
  };

  // Group jobs for Kanban Board
  const kanbanColumns = useMemo(() => {
    const map = {
      Saved: [],
      Applied: [],
      Assessment: [],
      Interview: [],
      Offer: [],
      Rejected: [],
      Withdrawn: []
    };
    filteredJobs.forEach((job) => {
      const norm = normalizeStatus(job.status);
      if (map[norm]) map[norm].push(job);
      else map.Applied.push(job);
    });
    return map;
  }, [filteredJobs]);

  return (
    <Layout>
      <div className="jobs-page-container">
        {/* HEADER BAR */}
        <div className="jobs-page-header">
          <div className="header-title-block">
            <h1>Application Pipeline</h1>
            <p>Manage and track all opportunities across your job search lifecycle.</p>
          </div>

          <div className="header-action-buttons">
            <div className="view-mode-toggle">
              <button
                type="button"
                className={`toggle-btn ${viewMode === "board" ? "active" : ""}`}
                onClick={() => switchViewMode("board")}
                title="Kanban Board View"
              >
                <Kanban size={17} />
                <span>Board</span>
              </button>
              <button
                type="button"
                className={`toggle-btn ${viewMode === "table" ? "active" : ""}`}
                onClick={() => switchViewMode("table")}
                title="List / Table View"
              >
                <List size={17} />
                <span>List</span>
              </button>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleExportCSV}
              title="Export all applications to CSV"
            >
              <Download size={15} />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => csvInputRef.current?.click()}
              title="Import applications from CSV"
            >
              <Upload size={15} />
              <span>Import CSV</span>
            </button>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              onChange={handleImportCSVFile}
            />

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => navigate("/add-job")}
            >
              <Plus size={16} />
              <span>Add Job</span>
            </button>
          </div>
        </div>

        {/* SEARCH & FILTER TOOLBAR */}
        <div className="jobs-toolbar-card">
          <div className="search-input-wrapper">
            <Search size={17} className="search-icon" />
            <input
              type="text"
              placeholder="Search by company, role, recruiter, tags, notes..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            {search && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearch("")}
              >
                ×
              </button>
            )}
          </div>

          <div className="toolbar-filters-group">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="toolbar-select"
            >
              <option value="All">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => {
                setSelectedPriority(e.target.value);
                setPage(1);
              }}
              className="toolbar-select"
            >
              <option value="All">All Priorities</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p} Priority</option>
              ))}
            </select>

            <select
              value={selectedWorkMode}
              onChange={(e) => {
                setSelectedWorkMode(e.target.value);
                setPage(1);
              }}
              className="toolbar-select"
            >
              <option value="All">All Work Modes</option>
              {WORK_MODES.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>

            <select
              value={selectedEmpType}
              onChange={(e) => {
                setSelectedEmpType(e.target.value);
                setPage(1);
              }}
              className="toolbar-select"
            >
              <option value="All">All Types</option>
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            {(search || selectedStatus !== "All" || selectedPriority !== "All" || selectedWorkMode !== "All" || selectedEmpType !== "All") && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSearch("");
                  setSelectedStatus("All");
                  setSelectedPriority("All");
                  setSelectedWorkMode("All");
                  setSelectedEmpType("All");
                  setPage(1);
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* HIDDEN RESUME FILE INPUT */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f && uploadingResumeJobId) {
              handleUploadResume(uploadingResumeJobId, f);
            }
            e.target.value = "";
          }}
        />

        {/* PIPELINE VIEW */}
        {loading ? (
          <div className="jobs-loading-state">
            <div className="spinner" />
            <p>Loading applications...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="jobs-empty-state">
            <Briefcase size={48} className="empty-icon-muted" />
            <h3>No applications found</h3>
            <p>
              {jobs.length === 0
                ? "You haven't tracked any job applications yet. Click 'Add Job' to begin."
                : "No applications match your current search or filter criteria."}
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (jobs.length === 0) navigate("/add-job");
                else {
                  setSearch("");
                  setSelectedStatus("All");
                  setSelectedPriority("All");
                  setSelectedWorkMode("All");
                  setSelectedEmpType("All");
                }
              }}
            >
              {jobs.length === 0 ? "Add First Job" : "Clear All Filters"}
            </button>
          </div>
        ) : viewMode === "board" ? (
          /* ================= KANBAN BOARD VIEW ================= */
          <div className="kanban-board-container">
            {STATUSES.map((statusName) => {
              const columnJobs = kanbanColumns[statusName] || [];
              return (
                <div key={statusName} className={`kanban-column col-${statusName.toLowerCase()}`}>
                  <div className="kanban-column-header">
                    <div className="col-title-wrap">
                      <span className={`status-dot dot-${statusName.toLowerCase()}`} />
                      <span className="col-name">{statusName}</span>
                    </div>
                    <span className="col-count-badge">{columnJobs.length}</span>
                  </div>

                  <div className="kanban-cards-list">
                    {columnJobs.length === 0 ? (
                      <div className="kanban-empty-col">
                        <small>No applications</small>
                      </div>
                    ) : (
                      columnJobs.map((job) => (
                        <div
                          key={job.id}
                          className="kanban-card"
                          onClick={() => handleOpenDrawer(job)}
                        >
                          <div className="card-top-row">
                            <span className="card-company">{job.company}</span>
                            <span className={`priority-pill priority-${(job.priority || "medium").toLowerCase()}`}>
                              {job.priority || "Medium"}
                            </span>
                          </div>

                          <span className="card-role">{job.role || "Role not specified"}</span>

                          <div className="card-tags-row">
                            {job.work_mode && (
                              <span className="meta-tag workmode">{job.work_mode}</span>
                            )}
                            {job.employment_type && (
                              <span className="meta-tag emptype">{job.employment_type}</span>
                            )}
                            {job.application_resume && (
                              <span className="meta-tag resume-tag" title={job.application_resume.original_filename}>
                                📄 Resume
                              </span>
                            )}
                          </div>

                          <div className="card-footer-row" onClick={(e) => e.stopPropagation()}>
                            <span className="card-date">{job.applied_date || "—"}</span>
                            
                            <select
                              value={normalizeStatus(job.status)}
                              onChange={(e) => handleQuickStatusChange(job.id, e.target.value)}
                              className="quick-status-select"
                              title="Move to another status"
                            >
                              {STATUSES.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ================= TABLE LIST VIEW ================= */
          <div className="table-view-container">
            <div className="table-responsive">
              <table className="modern-jobs-table">
                <thead>
                  <tr>
                    <th onClick={() => { setSortBy("company"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }} className="sortable">
                      Company {sortBy === "company" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th>Role</th>
                    <th>Status</th>
                    <th onClick={() => { setSortBy("priority"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }} className="sortable">
                      Priority {sortBy === "priority" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th>Work Mode</th>
                    <th onClick={() => { setSortBy("applied_date"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }} className="sortable">
                      Applied Date {sortBy === "applied_date" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th>Resume</th>
                    <th>Application Link</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedJobs.map((job) => {
                    const normStatus = normalizeStatus(job.status);
                    const safeUrl = getSafeUrl(job.job_url);
                    return (
                      <tr key={job.id} onClick={() => handleOpenDrawer(job)} className="clickable-row">
                        <td className="company-col">
                          <strong>{job.company}</strong>
                          {job.location && <small className="location-sub"><MapPin size={11} /> {job.location}</small>}
                        </td>
                        <td>{job.role || "—"}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <select
                            value={normStatus}
                            onChange={(e) => handleQuickStatusChange(job.id, e.target.value)}
                            className={`status-select-badge status-${normStatus.toLowerCase()}`}
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <span className={`priority-pill priority-${(job.priority || "medium").toLowerCase()}`}>
                            {job.priority || "Medium"}
                          </span>
                        </td>
                        <td>
                          <span className="meta-tag">{job.work_mode || "—"}</span>
                        </td>
                        <td>{job.applied_date || "—"}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {job.application_resume ? (
                            <button
                              type="button"
                              className="resume-pill-btn"
                              onClick={() => handleDownloadResume(job)}
                              title="Download attached resume"
                            >
                              <FileText size={13} />
                              <span>{job.application_resume.original_filename.slice(0, 15)}...</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn-attach-resume"
                              onClick={() => {
                                setUploadingResumeJobId(job.id);
                                fileInputRef.current?.click();
                              }}
                              disabled={uploadingResumeJobId === job.id}
                            >
                              {uploadingResumeJobId === job.id ? "Uploading..." : "+ Attach"}
                            </button>
                          )}
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {safeUrl ? (
                            <a
                              href={safeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="job-external-link"
                              title="Open job posting"
                            >
                              <span>Open</span> <ExternalLink size={12} />
                            </a>
                          ) : (
                            <span className="muted-dash">—</span>
                          )}
                        </td>
                        <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                          <div className="table-actions-group">
                            <button
                              type="button"
                              className="action-icon-btn"
                              onClick={() => handleDuplicateJob(job.id)}
                              title="Duplicate application"
                            >
                              <Copy size={15} />
                            </button>
                            <button
                              type="button"
                              className="action-icon-btn"
                              onClick={() => handleOpenEdit(job)}
                              title="Edit application"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              type="button"
                              className="action-icon-btn delete"
                              onClick={() => setDeleteTarget(job)}
                              title="Delete application"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PAGINATION CONTROLS */}
            <div className="pagination-bar">
              <span className="pagination-info">
                Showing {filteredJobs.length ? (safePage - 1) * pageSize + 1 : 0}–
                {Math.min(safePage * pageSize, filteredJobs.length)} of {filteredJobs.length} applications
              </span>

              <div className="pagination-controls">
                <label className="page-size-selector">
                  <span>Per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </label>

                <div className="pagination-buttons">
                  <button
                    type="button"
                    className="btn-page"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="page-indicator">
                    Page {safePage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    className="btn-page"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage >= totalPages}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= DETAIL DRAWER ================= */}
        {selectedJob && (
          <div className="drawer-overlay" onClick={() => setSelectedJob(null)}>
            <aside className="application-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-header">
                <div className="drawer-title-group">
                  <span className="drawer-eyebrow">APPLICATION DETAILS</span>
                  <h2>{selectedJob.company}</h2>
                  <p className="drawer-sub">{selectedJob.role || "Role not specified"}</p>
                </div>
                <button
                  type="button"
                  className="drawer-close-btn"
                  onClick={() => setSelectedJob(null)}
                  aria-label="Close drawer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* TABS */}
              <div className="drawer-tabs">
                <button
                  type="button"
                  className={`d-tab ${drawerTab === "overview" ? "active" : ""}`}
                  onClick={() => setDrawerTab("overview")}
                >
                  Overview
                </button>
                <button
                  type="button"
                  className={`d-tab ${drawerTab === "interviews" ? "active" : ""}`}
                  onClick={() => setDrawerTab("interviews")}
                >
                  Interviews ({jobInterviews.length})
                </button>
                <button
                  type="button"
                  className={`d-tab ${drawerTab === "assessments" ? "active" : ""}`}
                  onClick={() => setDrawerTab("assessments")}
                >
                  Assessments ({jobAssessments.length})
                </button>
                <button
                  type="button"
                  className={`d-tab ${drawerTab === "timeline" ? "active" : ""}`}
                  onClick={() => setDrawerTab("timeline")}
                >
                  History ({jobTimeline.length})
                </button>
              </div>

              <div className="drawer-body">
                {/* TAB 1: OVERVIEW */}
                {drawerTab === "overview" && (
                  <div className="drawer-tab-content">
                    <div className="drawer-status-bar">
                      <div className="status-item">
                        <span>Current Status:</span>
                        <select
                          value={normalizeStatus(selectedJob.status)}
                          onChange={(e) => handleQuickStatusChange(selectedJob.id, e.target.value)}
                          className={`status-select-badge status-${normalizeStatus(selectedJob.status).toLowerCase()}`}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div className="status-item">
                        <span>Priority:</span>
                        <span className={`priority-pill priority-${(selectedJob.priority || "medium").toLowerCase()}`}>
                          {selectedJob.priority || "Medium"}
                        </span>
                      </div>
                    </div>

                    <div className="drawer-section">
                      <h4>Job Details</h4>
                      <div className="drawer-key-value-grid">
                        <div className="kv-item">
                          <span className="kv-label">Applied Date</span>
                          <strong className="kv-value">{selectedJob.applied_date || "—"}</strong>
                        </div>
                        <div className="kv-item">
                          <span className="kv-label">Work Mode</span>
                          <strong className="kv-value">{selectedJob.work_mode || "—"}</strong>
                        </div>
                        <div className="kv-item">
                          <span className="kv-label">Employment Type</span>
                          <strong className="kv-value">{selectedJob.employment_type || "—"}</strong>
                        </div>
                        <div className="kv-item">
                          <span className="kv-label">Location</span>
                          <strong className="kv-value">{selectedJob.location || "—"}</strong>
                        </div>
                        <div className="kv-item">
                          <span className="kv-label">Salary / Comp</span>
                          <strong className="kv-value">{selectedJob.salary || "—"}</strong>
                        </div>
                        <div className="kv-item">
                          <span className="kv-label">Portal / Source</span>
                          <strong className="kv-value">{selectedJob.portal || "—"}</strong>
                        </div>
                      </div>
                    </div>

                    {getSafeUrl(selectedJob.job_url) && (
                      <div className="drawer-section">
                        <h4>Job Posting URL</h4>
                        <a
                          href={getSafeUrl(selectedJob.job_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="job-external-button"
                        >
                          <span>Open original job posting</span>
                          <ExternalLink size={15} />
                        </a>
                      </div>
                    )}

                    {/* RECRUITER INFO */}
                    <div className="drawer-section">
                      <h4>Recruiter & Contact Info</h4>
                      {selectedJob.recruiter_name || selectedJob.recruiter_email || selectedJob.recruiter_phone ? (
                        <div className="recruiter-card-box">
                          {selectedJob.recruiter_name && (
                            <div className="rec-row">
                              <User size={15} />
                              <strong>{selectedJob.recruiter_name}</strong>
                            </div>
                          )}
                          {selectedJob.recruiter_email && (
                            <div className="rec-row">
                              <Mail size={15} />
                              <a href={`mailto:${selectedJob.recruiter_email}`}>{selectedJob.recruiter_email}</a>
                            </div>
                          )}
                          {selectedJob.recruiter_phone && (
                            <div className="rec-row">
                              <Phone size={15} />
                              <span>{selectedJob.recruiter_phone}</span>
                            </div>
                          )}
                          {selectedJob.recruiter_linkedin && (
                            <div className="rec-row">
                              <Globe size={15} />
                              <a href={selectedJob.recruiter_linkedin} target="_blank" rel="noopener noreferrer">
                                LinkedIn Profile
                              </a>
                            </div>
                          )}
                          {selectedJob.recruiter_notes && (
                            <p className="rec-notes">{selectedJob.recruiter_notes}</p>
                          )}
                        </div>
                      ) : (
                        <p className="empty-sub-text">No recruiter information added.</p>
                      )}
                    </div>

                    {/* RESUME USED */}
                    <div className="drawer-section">
                      <h4>Attached Resume</h4>
                      {selectedJob.application_resume ? (
                        <div className="resume-attached-box">
                          <div className="resume-file-info">
                            <FileText size={20} className="file-icon" />
                            <div>
                              <strong>{selectedJob.application_resume.original_filename}</strong>
                              <small>{(selectedJob.application_resume.size_bytes / 1024).toFixed(0)} KB</small>
                            </div>
                          </div>
                          <div className="resume-box-actions">
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleDownloadResume(selectedJob)}
                            >
                              Download
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setUploadingResumeJobId(selectedJob.id);
                                fileInputRef.current?.click();
                              }}
                            >
                              Replace
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger-subtle btn-sm"
                              onClick={() => handleDeleteResume(selectedJob.id)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="resume-upload-prompt">
                          <p>Attach the exact customized resume submitted for this company.</p>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setUploadingResumeJobId(selectedJob.id);
                              fileInputRef.current?.click();
                            }}
                          >
                            + Upload Resume
                          </button>
                        </div>
                      )}
                    </div>

                    {/* NOTES & TAGS */}
                    <div className="drawer-section">
                      <h4>Notes & Strategy</h4>
                      <p className="drawer-notes-text">
                        {selectedJob.notes || "No notes recorded for this application."}
                      </p>
                      {selectedJob.tags && (
                        <div className="drawer-tags-list">
                          {selectedJob.tags.split(",").map((t) => (
                            <span key={t} className="d-tag">{t.trim()}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: INTERVIEWS */}
                {drawerTab === "interviews" && (
                  <div className="drawer-tab-content">
                    <div className="sub-header-row">
                      <h4>Interview Rounds</h4>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => setShowAddInterview(!showAddInterview)}
                      >
                        {showAddInterview ? "Cancel" : "+ Add Round"}
                      </button>
                    </div>

                    {showAddInterview && (
                      <form onSubmit={handleAddInterview} className="inline-add-form">
                        <div className="form-group">
                          <label>Round Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Round 1 – Technical DSA"
                            value={newInterview.round_name}
                            onChange={(e) => setNewInterview({ ...newInterview, round_name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Date</label>
                            <input
                              type="date"
                              value={newInterview.interview_date}
                              onChange={(e) => setNewInterview({ ...newInterview, interview_date: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label>Time</label>
                            <input
                              type="text"
                              placeholder="e.g. 2:00 PM"
                              value={newInterview.interview_time}
                              onChange={(e) => setNewInterview({ ...newInterview, interview_time: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Type</label>
                            <select
                              value={newInterview.interview_type}
                              onChange={(e) => setNewInterview({ ...newInterview, interview_type: e.target.value })}
                            >
                              <option value="Video">Video Call</option>
                              <option value="Phone">Phone</option>
                              <option value="In-person">In-person</option>
                              <option value="Technical">Technical</option>
                              <option value="Behavioral">Behavioral</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Interviewer</label>
                            <input
                              type="text"
                              placeholder="Interviewer name"
                              value={newInterview.interviewer}
                              onChange={(e) => setNewInterview({ ...newInterview, interviewer: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Meeting URL / Link</label>
                          <input
                            type="url"
                            placeholder="https://meet.google.com/..."
                            value={newInterview.interview_url}
                            onChange={(e) => setNewInterview({ ...newInterview, interview_url: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Preparation Notes</label>
                          <textarea
                            placeholder="Key topics, STAR stories to mention, questions to ask..."
                            rows={2}
                            value={newInterview.prep_notes}
                            onChange={(e) => setNewInterview({ ...newInterview, prep_notes: e.target.value })}
                          />
                        </div>
                        <button type="submit" className="btn btn-primary btn-sm">Save Interview Round</button>
                      </form>
                    )}

                    {jobInterviews.length === 0 ? (
                      <p className="empty-sub-text">No interview rounds scheduled yet.</p>
                    ) : (
                      <div className="rounds-list">
                        {jobInterviews.map((round) => (
                          <div key={round.id} className={`round-card ${round.status === "Completed" ? "completed" : ""}`}>
                            <div className="round-card-head">
                              <div>
                                <strong>{round.round_name}</strong>
                                <div className="round-meta">
                                  <span>{round.interview_date || "Date TBA"}</span>
                                  {round.interview_time && <span> · {round.interview_time}</span>}
                                  <span> · {round.interview_type || "Video"}</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                className={`btn-status-toggle ${round.status === "Completed" ? "done" : ""}`}
                                onClick={() => handleToggleInterviewStatus(round.id)}
                              >
                                {round.status === "Completed" ? "✓ Completed" : "Mark Done"}
                              </button>
                            </div>
                            {round.interview_url && (
                              <a
                                href={round.interview_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="round-link"
                              >
                                Join Meeting ↗
                              </a>
                            )}
                            {round.prep_notes && (
                              <p className="round-prep">{round.prep_notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: ASSESSMENTS */}
                {drawerTab === "assessments" && (
                  <div className="drawer-tab-content">
                    <div className="sub-header-row">
                      <h4>Assessments & Coding Tests</h4>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => setShowAddAssessment(!showAddAssessment)}
                      >
                        {showAddAssessment ? "Cancel" : "+ Add Test"}
                      </button>
                    </div>

                    {showAddAssessment && (
                      <form onSubmit={handleAddAssessment} className="inline-add-form">
                        <div className="form-group">
                          <label>Assessment Name</label>
                          <input
                            type="text"
                            placeholder="e.g. HackerRank Coding Challenge"
                            value={newAssessment.name}
                            onChange={(e) => setNewAssessment({ ...newAssessment, name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Due Date</label>
                            <input
                              type="date"
                              value={newAssessment.assessment_date}
                              onChange={(e) => setNewAssessment({ ...newAssessment, assessment_date: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label>Platform</label>
                            <input
                              type="text"
                              placeholder="HackerRank, LeetCode, etc."
                              value={newAssessment.platform}
                              onChange={(e) => setNewAssessment({ ...newAssessment, platform: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Test URL</label>
                          <input
                            type="url"
                            placeholder="https://..."
                            value={newAssessment.assessment_url}
                            onChange={(e) => setNewAssessment({ ...newAssessment, assessment_url: e.target.value })}
                          />
                        </div>
                        <button type="submit" className="btn btn-primary btn-sm">Save Assessment</button>
                      </form>
                    )}

                    {jobAssessments.length === 0 ? (
                      <p className="empty-sub-text">No assessments added for this application.</p>
                    ) : (
                      <div className="rounds-list">
                        {jobAssessments.map((a) => (
                          <div key={a.id} className={`round-card ${a.completed === 1 ? "completed" : ""}`}>
                            <div className="round-card-head">
                              <div>
                                <strong>{a.name}</strong>
                                <div className="round-meta">
                                  <span>{a.platform || "Online"}</span>
                                  {a.assessment_date && <span> · Due {a.assessment_date}</span>}
                                </div>
                              </div>
                              <button
                                type="button"
                                className={`btn-status-toggle ${a.completed === 1 ? "done" : ""}`}
                                onClick={() => handleToggleAssessment(a.id)}
                              >
                                {a.completed === 1 ? "✓ Completed" : "Mark Done"}
                              </button>
                            </div>
                            {a.assessment_url && (
                              <a
                                href={a.assessment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="round-link"
                              >
                                Open Assessment ↗
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: TIMELINE */}
                {drawerTab === "timeline" && (
                  <div className="drawer-tab-content">
                    <h4>Activity History</h4>
                    {jobTimeline.length === 0 ? (
                      <p className="empty-sub-text">No history recorded yet.</p>
                    ) : (
                      <div className="drawer-timeline-feed">
                        {jobTimeline.map((ev) => (
                          <div key={ev.id} className="timeline-item">
                            <span className="timeline-dot" />
                            <div className="timeline-item-body">
                              <strong>{ev.event_type.replace(/_/g, " ")}</strong>
                              <p>{ev.description}</p>
                              <small>{new Date(ev.created_at).toLocaleString()}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* DRAWER FOOTER */}
              <div className="drawer-footer">
                <button
                  type="button"
                  className="btn btn-danger-subtle btn-sm"
                  onClick={() => setDeleteTarget(selectedJob)}
                >
                  <Trash2 size={15} /> Delete
                </button>
                <div className="drawer-footer-right">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      handleOpenEdit(selectedJob);
                    }}
                  >
                    <Edit size={15} /> Edit Details
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setSelectedJob(null)}
                  >
                    Done
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* ================= EDIT APPLICATION MODAL ================= */}
        {editingJob && (
          <div className="modal-backdrop" onClick={() => setEditingJob(null)}>
            <div className="modal-dialog large-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3>Edit Application</h3>
                  <p>Update application details, recruiter contact, and notes.</p>
                </div>
                <button type="button" className="drawer-close-btn" onClick={() => setEditingJob(null)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="modal-form-body">
                <div className="form-grid-two">
                  <div className="form-group">
                    <label>Company *</label>
                    <input
                      type="text"
                      value={editForm.company}
                      onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <input
                      type="text"
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-three">
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Priority</label>
                    <select
                      value={editForm.priority}
                      onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Work Mode</label>
                    <select
                      value={editForm.work_mode}
                      onChange={(e) => setEditForm({ ...editForm, work_mode: e.target.value })}
                    >
                      {WORK_MODES.map((w) => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-grid-three">
                  <div className="form-group">
                    <label>Employment Type</label>
                    <select
                      value={editForm.employment_type}
                      onChange={(e) => setEditForm({ ...editForm, employment_type: e.target.value })}
                    >
                      {EMPLOYMENT_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Salary / Comp</label>
                    <input
                      type="text"
                      value={editForm.salary}
                      onChange={(e) => setEditForm({ ...editForm, salary: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-two">
                  <div className="form-group">
                    <label>Applied Date</label>
                    <input
                      type="date"
                      value={editForm.applied_date}
                      onChange={(e) => setEditForm({ ...editForm, applied_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Follow-up Date</label>
                    <input
                      type="date"
                      value={editForm.follow_up_date}
                      onChange={(e) => setEditForm({ ...editForm, follow_up_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-two">
                  <div className="form-group">
                    <label>Job URL</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={editForm.job_url}
                      onChange={(e) => setEditForm({ ...editForm, job_url: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Portal / Source</label>
                    <input
                      type="text"
                      placeholder="LinkedIn, Indeed, Company Site"
                      value={editForm.portal}
                      onChange={(e) => setEditForm({ ...editForm, portal: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-two">
                  <div className="form-group">
                    <label>Recruiter Name</label>
                    <input
                      type="text"
                      value={editForm.recruiter_name}
                      onChange={(e) => setEditForm({ ...editForm, recruiter_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Recruiter Email</label>
                    <input
                      type="email"
                      value={editForm.recruiter_email}
                      onChange={(e) => setEditForm({ ...editForm, recruiter_email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Tags (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. react, python, high-growth"
                    value={editForm.tags}
                    onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    rows={3}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setEditingJob(null)}
                    disabled={editSaving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={editSaving}>
                    {editSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        <ConfirmModal
          isOpen={!!deleteTarget}
          title={`Delete ${deleteTarget?.company || "Application"}`}
          message={`Are you sure you want to delete this application for ${deleteTarget?.company}? This will permanently remove all associated interview rounds, assessments, and resumes.`}
          confirmText="Delete Application"
          type="danger"
          onConfirm={handleDeleteJob}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      </div>
    </Layout>
  );
}
