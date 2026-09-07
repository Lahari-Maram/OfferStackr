import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  User,
  Lock,
  Target,
  Sun,
  Moon,
  FileText,
  LogOut,
  Upload,
  Download,
  Trash2,
  RefreshCw
} from "lucide-react";
import api from "../api/axios";
import Layout from "../components/Layout";
import ConfirmModal from "../components/ConfirmModal";
import { useTheme } from "../context/ThemeContext";
import "../styles/profile.css";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  
  // Profile Info
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  
  // Password Change
  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  
  // Goal
  const [goal, setGoal] = useState(10);
  const [goalSaving, setGoalSaving] = useState(false);
  
  // Master Resume
  const [resume, setResume] = useState(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  // Modals
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteResumeModal, setShowDeleteResumeModal] = useState(false);

  const loadSettingsData = async () => {
    try {
      const [pRes, rRes] = await Promise.all([
        api.get("/profile"),
        api.get("/resume").catch(() => ({ data: null }))
      ]);
      setProfile({ name: pRes.data.name || "", email: pRes.data.email || "" });
      setGoal(pRes.data.weekly_goal || 10);
      setResume(rRes.data);
    } catch {
      toast.error("Failed to load account settings");
    }
  };

  useEffect(() => {
    loadSettingsData();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profile.name.trim() || !profile.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    try {
      setProfileSaving(true);
      const res = await api.put("/profile", {
        name: profile.name.trim(),
        email: profile.email.trim().toLowerCase()
      });
      setProfile({ name: res.data.name, email: res.data.email });
      toast.success("Profile information updated!");
    } catch (error) {
      const errDetail = error.response?.data?.detail;
      toast.error(typeof errDetail === "string" ? errDetail : "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm_password) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwords.new_password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    try {
      setPasswordSaving(true);
      await api.put("/change-password", {
        current_password: passwords.current_password,
        new_password: passwords.new_password
      });
      toast.success("Password changed successfully!");
      setPasswords({ current_password: "", new_password: "", confirm_password: "" });
    } catch (error) {
      const errDetail = error.response?.data?.detail;
      toast.error(typeof errDetail === "string" ? errDetail : "Failed to change password");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    try {
      setGoalSaving(true);
      await api.put("/goal", { weekly_goal: Number(goal) });
      toast.success("Weekly application goal saved!");
    } catch {
      toast.error("Failed to update goal");
    } finally {
      setGoalSaving(false);
    }
  };

  const handleUploadResume = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setResumeUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/resume", fd);
      setResume(res.data);
      toast.success("Master resume uploaded successfully!");
    } catch (error) {
      const errDetail = error.response?.data?.detail;
      toast.error(typeof errDetail === "string" ? errDetail : "Failed to upload resume");
    } finally {
      setResumeUploading(false);
      e.target.value = "";
    }
  };

  const handleDownloadResume = async () => {
    try {
      const res = await api.get("/resume/download", { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = resume?.original_filename || "Master_Resume.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download resume");
    }
  };

  const handleDeleteResume = async () => {
    try {
      await api.delete("/resume");
      setResume(null);
      setShowDeleteResumeModal(false);
      toast.success("Master resume removed");
    } catch {
      toast.error("Failed to delete resume");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <Layout>
      <div className="settings-page-container">
        {/* HEADER */}
        <div className="page-header-row">
          <div>
            <h1>Profile & Account Settings</h1>
            <p>Manage your personal profile, security preferences, weekly target, and master resume.</p>
          </div>
        </div>

        {/* SECTION 1: PROFILE INFO */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon-title">
              <User size={20} className="icon-blue" />
              <div>
                <h3>Personal Information</h3>
                <p>Update your public display name and account email.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="settings-form">
            <div className="form-grid-two">
              <div className="form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={profileSaving}>
              {profileSaving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>

        {/* SECTION 2: PASSWORD SECURITY */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon-title">
              <Lock size={20} className="icon-purple" />
              <div>
                <h3>Security & Password</h3>
                <p>Change your password to keep your job-search account protected.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="settings-form">
            <div className="form-group">
              <label>Current Password</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter current password"
                value={passwords.current_password}
                onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}
                required
              />
            </div>

            <div className="form-grid-two">
              <div className="form-group">
                <label>New Password (min. 6 characters)</label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={passwords.new_password}
                  onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                  minLength={6}
                  required
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat new password"
                  value={passwords.confirm_password}
                  onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })}
                  minLength={6}
                  required
                />
              </div>
            </div>

            <div className="password-options-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                />
                <span>Show passwords</span>
              </label>

              <button type="submit" className="btn btn-primary" disabled={passwordSaving}>
                {passwordSaving ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>

        {/* SECTION 3: WEEKLY GOALS & PREFERENCES */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon-title">
              <Target size={20} className="icon-green" />
              <div>
                <h3>Job Search Target</h3>
                <p>Configure your weekly application target for goals and streak calculations.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveGoal} className="settings-form inline-goal-form">
            <div className="form-group">
              <label>Weekly Target (Applications)</label>
              <input
                type="number"
                min="1"
                max="500"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={goalSaving}>
              {goalSaving ? "Saving..." : "Save Target"}
            </button>
          </form>
        </div>

        {/* SECTION 4: APPEARANCE */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon-title">
              {theme === "dark" ? <Sun size={20} className="icon-orange" /> : <Moon size={20} className="icon-purple" />}
              <div>
                <h3>Theme & Appearance</h3>
                <p>Toggle between Dark mode and Light mode according to your workspace preference.</p>
              </div>
            </div>
          </div>

          <div className="theme-setting-row">
            <div>
              <strong>Current Theme: {theme === "dark" ? "Dark Mode" : "Light Mode"}</strong>
              <p>OfferStackr ensures maximum readability and smooth visual contrast in both themes.</p>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={toggleTheme}
            >
              Switch to {theme === "dark" ? "Light" : "Dark"} Mode
            </button>
          </div>
        </div>

        {/* SECTION 5: MASTER RESUME */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon-title">
              <FileText size={20} className="icon-blue" />
              <div>
                <h3>Master Profile Resume</h3>
                <p>Your default resume used when submitting general applications.</p>
              </div>
            </div>
          </div>

          {resume ? (
            <div className="profile-resume-box">
              <div className="resume-item-main">
                <FileText size={28} className="doc-icon" />
                <div className="doc-meta">
                  <strong>{resume.original_filename}</strong>
                  <span>{(resume.size_bytes / 1024).toFixed(0)} KB · Uploaded {new Date(resume.uploaded_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="resume-item-actions">
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleDownloadResume}>
                  <Download size={14} /> Download
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={resumeUploading}
                >
                  <RefreshCw size={14} /> Replace
                </button>
                <button
                  type="button"
                  className="btn btn-danger-subtle btn-sm"
                  onClick={() => setShowDeleteResumeModal(true)}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="resume-empty-dropzone" onClick={() => fileInputRef.current?.click()}>
              <Upload size={32} className="upload-icon" />
              <h4>No master resume uploaded</h4>
              <p>Upload a PDF or DOCX file (max 5 MB) for your account profile.</p>
              <button type="button" className="btn btn-primary btn-sm">
                Choose Resume
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            style={{ display: "none" }}
            onChange={handleUploadResume}
          />
        </div>

        {/* SECTION 6: ACCOUNT SESSION */}
        <div className="settings-card danger-boundary">
          <div className="settings-card-header">
            <div className="settings-icon-title">
              <LogOut size={20} className="icon-danger" />
              <div>
                <h3>Account Session</h3>
                <p>Sign out of OfferStackr on this device.</p>
              </div>
            </div>
          </div>

          <div className="session-logout-row">
            <div>
              <strong>Active Account: {profile.email}</strong>
              <p>Signing out clears your local authentication token securely.</p>
            </div>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => setShowLogoutModal(true)}
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* LOGOUT CONFIRM */}
        <ConfirmModal
          isOpen={showLogoutModal}
          title="Sign Out"
          message="Are you sure you want to log out of your OfferStackr account?"
          confirmText="Sign Out"
          type="danger"
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutModal(false)}
        />

        {/* DELETE RESUME CONFIRM */}
        <ConfirmModal
          isOpen={showDeleteResumeModal}
          title="Delete Master Resume"
          message="Are you sure you want to delete your profile resume?"
          confirmText="Delete Resume"
          type="danger"
          onConfirm={handleDeleteResume}
          onCancel={() => setShowDeleteResumeModal(false)}
        />
      </div>
    </Layout>
  );
}
