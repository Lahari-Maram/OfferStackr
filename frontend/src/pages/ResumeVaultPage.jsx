import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  Briefcase
} from "lucide-react";
import api from "../api/axios";
import Layout from "../components/Layout";
import ConfirmModal from "../components/ConfirmModal";
import "../styles/resumes.css";

export default function ResumeVaultPage() {
  const navigate = useNavigate();
  const [profileResume, setProfileResume] = useState(null);
  const [applicationResumes, setApplicationResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingJobId, setUploadingJobId] = useState(null);
  
  const profileFileInputRef = useRef(null);
  const jobFileInputRef = useRef(null);
  
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'profile' | 'job', id: ... }
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadResumes = async () => {
    try {
      setLoading(true);
      const [pRes, jRes] = await Promise.all([
        api.get("/resume").catch(() => ({ data: null })),
        api.get("/jobs?limit=500")
      ]);
      setProfileResume(pRes.data);
      const withResumes = (jRes.data || []).filter((j) => j.application_resume);
      setApplicationResumes(withResumes);
    } catch {
      toast.error("Failed to load resumes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResumes();
  }, []);

  const handleUploadProfileResume = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingProfile(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/resume", fd);
      setProfileResume(res.data);
      toast.success("Master profile resume updated successfully!");
    } catch (error) {
      const errDetail = error.response?.data?.detail;
      toast.error(typeof errDetail === "string" ? errDetail : "Failed to upload resume");
    } finally {
      setUploadingProfile(false);
      e.target.value = "";
    }
  };

  const handleDownloadProfileResume = async () => {
    try {
      const res = await api.get("/resume/download", { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = profileResume?.original_filename || "Master_Resume.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download master resume");
    }
  };

  const handleDownloadJobResume = async (job) => {
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
      toast.error("Failed to download resume");
    }
  };

  const handleUploadJobResume = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingJobId) return;
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api.post(`/jobs/${uploadingJobId}/resume`, fd);
      toast.success("Application resume updated!");
      loadResumes();
    } catch (error) {
      const errDetail = error.response?.data?.detail;
      toast.error(typeof errDetail === "string" ? errDetail : "Failed to upload resume");
    } finally {
      setUploadingJobId(null);
      e.target.value = "";
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      if (deleteTarget.type === "profile") {
        await api.delete("/resume");
        setProfileResume(null);
        toast.success("Master resume deleted");
      } else {
        await api.delete(`/jobs/${deleteTarget.id}/resume`);
        toast.success("Application resume removed");
        loadResumes();
      }
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete resume");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Layout>
      <div className="resumes-page-container">
        {/* HEADER */}
        <div className="page-header-row">
          <div>
            <h1>Resume Vault & Versioning</h1>
            <p>Store your master profile resume and organize tailored resumes attached to specific job applications.</p>
          </div>
        </div>

        {/* SECTION 1: MASTER PROFILE RESUME */}
        <div className="resume-section-card">
          <div className="section-card-header">
            <div>
              <h3>Master Profile Resume</h3>
              <p>Your primary, general-purpose resume ready for fast submissions.</p>
            </div>
          </div>

          {profileResume ? (
            <div className="profile-resume-box">
              <div className="resume-item-main">
                <FileText size={28} className="doc-icon" />
                <div className="doc-meta">
                  <strong>{profileResume.original_filename}</strong>
                  <span>
                    {(profileResume.size_bytes / 1024).toFixed(0)} KB · Uploaded {new Date(profileResume.uploaded_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="resume-item-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleDownloadProfileResume}
                >
                  <Download size={14} /> Download
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => profileFileInputRef.current?.click()}
                  disabled={uploadingProfile}
                >
                  <RefreshCw size={14} /> Replace
                </button>
                <button
                  type="button"
                  className="btn btn-danger-subtle btn-sm"
                  onClick={() => setDeleteTarget({ type: "profile" })}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="resume-empty-dropzone" onClick={() => profileFileInputRef.current?.click()}>
              <Upload size={32} className="upload-icon" />
              <h4>No master resume uploaded</h4>
              <p>Upload a PDF or DOCX file (max 5 MB) to keep your primary resume always ready.</p>
              <button type="button" className="btn btn-primary btn-sm">
                Choose Resume File
              </button>
            </div>
          )}

          <input
            ref={profileFileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            style={{ display: "none" }}
            onChange={handleUploadProfileResume}
          />
        </div>

        {/* SECTION 2: APPLICATION-SPECIFIC RESUMES */}
        <div className="resume-section-card">
          <div className="section-card-header">
            <div>
              <h3>Application-Specific Resumes ({applicationResumes.length})</h3>
              <p>Customized resumes tailored to individual job postings and companies.</p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => navigate("/jobs")}
            >
              <Briefcase size={14} /> View All Applications
            </button>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading application resumes...</p>
            </div>
          ) : applicationResumes.length === 0 ? (
            <div className="app-resumes-empty">
              <FileText size={36} className="empty-icon-muted" />
              <h4>No application-specific resumes attached yet</h4>
              <p>When adding or editing a job application in OfferStackr, attach the exact resume version you submitted.</p>
            </div>
          ) : (
            <div className="app-resumes-list">
              {applicationResumes.map((job) => (
                <div key={job.id} className="app-resume-item">
                  <div className="app-resume-info">
                    <span className="app-company-badge">{job.company}</span>
                    <strong className="app-file-name">
                      {job.application_resume.original_filename}
                    </strong>
                    <small className="app-meta">
                      {job.role || "Role"} · {(job.application_resume.size_bytes / 1024).toFixed(0)} KB · Attached {new Date(job.application_resume.uploaded_at).toLocaleDateString()}
                    </small>
                  </div>

                  <div className="app-resume-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleDownloadJobResume(job)}
                    >
                      <Download size={14} /> Download
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setUploadingJobId(job.id);
                        jobFileInputRef.current?.click();
                      }}
                    >
                      <RefreshCw size={14} /> Replace
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger-subtle btn-sm"
                      onClick={() => setDeleteTarget({ type: "job", id: job.id, company: job.company })}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <input
            ref={jobFileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            style={{ display: "none" }}
            onChange={handleUploadJobResume}
          />
        </div>

        {/* DELETE CONFIRM */}
        <ConfirmModal
          isOpen={!!deleteTarget}
          title={deleteTarget?.type === "profile" ? "Delete Master Resume" : `Remove Resume for ${deleteTarget?.company || "Job"}`}
          message="Are you sure you want to delete this resume file from the vault?"
          confirmText="Delete File"
          type="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      </div>
    </Layout>
  );
}
