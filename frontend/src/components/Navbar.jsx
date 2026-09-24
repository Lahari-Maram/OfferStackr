import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Menu,
  Sun,
  Moon,
  Bell,
  Settings,
  LogOut,
  CheckCircle,
  PlusCircle,
  Briefcase,
  LayoutDashboard,
  BarChart3,
  Target,
  Trophy,
  Calendar,
  CheckSquare,
  FileText,
  StickyNote,
  Clock,
  User,
  FileSpreadsheet
} from "lucide-react";
import api from "../api/axios";
import OfferStackrLogo from "./OfferStackrLogo";
import UserAvatar from "./UserAvatar";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";
import ConfirmModal from "./ConfirmModal";
import "../styles/navbar.css";

const getPageMeta = (pathname) => {
  if (!pathname) return { title: "Dashboard", icon: LayoutDashboard };
  const p = pathname.toLowerCase();
  if (p.startsWith("/dashboard")) return { title: "Dashboard", icon: LayoutDashboard };
  if (p.startsWith("/jobs") || p.startsWith("/applications")) return { title: "Applications", icon: Briefcase };
  if (p.startsWith("/add-job") || p.startsWith("/add-application")) return { title: "Add Application", icon: PlusCircle };
  if (p.startsWith("/analytics")) return { title: "Analytics", icon: BarChart3 };
  if (p.startsWith("/goals") || p.startsWith("/streaks") || p.startsWith("/activity")) return { title: "Streaks & Activity", icon: Target };
  if (p.startsWith("/achievements")) return { title: "Achievements", icon: Trophy };
  if (p.startsWith("/interviews")) return { title: "Interviews", icon: Calendar };
  if (p.startsWith("/assessments")) return { title: "Assessments", icon: CheckSquare };
  if (p.startsWith("/resume-vault") || p.startsWith("/resumes")) return { title: "Resume Vault", icon: FileText };
  if (p.startsWith("/career-hub") || p.startsWith("/career-prep") || p.startsWith("/notes")) return { title: "Career Hub", icon: StickyNote };
  if (p.startsWith("/timeline")) return { title: "Timeline", icon: Clock };
  if (p.startsWith("/profile")) return { title: "Profile", icon: User };
  if (p.startsWith("/settings")) return { title: "Settings", icon: Settings };
  if (p.startsWith("/reminders")) return { title: "Reminders", icon: Bell };
  if (p.startsWith("/reports")) return { title: "Reports", icon: FileSpreadsheet };
  return { title: "Dashboard", icon: LayoutDashboard };
};

export default function Navbar({ onToggleMobileSidebar }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const nRes = await api.get("/notifications").catch(() => ({ data: [] }));
      setNotifications(nRes?.data || []);
    } catch {
      // Ignored if auth expired or loading
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const markNotificationRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: 1 } : n))
      );
    } catch {
      // ignore
    }
  };

  const name = user?.name || "User";
  const email = user?.email || "";
  const unreadCount = notifications.filter((n) => n.read === 0).length;

  const location = useLocation();
  const { title: pageTitle, icon: PageIcon } = getPageMeta(location.pathname);

  return (
    <>
      <header className="top-navbar">
        <div className="navbar-left">
          <button
            type="button"
            className="navbar-mobile-toggle"
            onClick={onToggleMobileSidebar}
            aria-label="Toggle navigation menu"
          >
            <Menu size={22} />
          </button>
          
          <Link to="/dashboard" className="navbar-brand-header" title="OfferStackr Home">
            <OfferStackrLogo size={22} />
            <span className="navbar-app-name">OfferStackr</span>
          </Link>

          <div className="navbar-page-identity" aria-current="page">
            <span className="navbar-page-divider" aria-hidden="true">/</span>
            <div className="navbar-page-title-badge">
              {PageIcon && <PageIcon size={16} className="navbar-page-icon" />}
              <span className="navbar-active-title">{pageTitle}</span>
            </div>
          </div>
        </div>

        <div className="navbar-right">
          <button
            type="button"
            className="navbar-action-btn add-btn-quick"
            onClick={() => navigate("/add-job")}
            title="Add Application"
          >
            <PlusCircle size={17} />
            <span className="quick-btn-text">Add Job</span>
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            className="navbar-icon-btn theme-toggle-btn"
            onClick={toggleTheme}
            aria-label="Toggle dark/light theme"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Notifications Dropdown */}
          <div className="navbar-dropdown-wrapper" ref={notifRef}>
            <button
              type="button"
              className={`navbar-icon-btn ${notifOpen ? "active" : ""}`}
              onClick={() => {
                setNotifOpen((v) => !v);
                setMenuOpen(false);
              }}
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="notif-badge">{unreadCount}</span>
              )}
            </button>

            {notifOpen && (
              <div className="dropdown-panel notif-panel">
                <div className="dropdown-header">
                  <strong>Notifications</strong>
                  {unreadCount > 0 && (
                    <span className="notif-count-pill">{unreadCount} new</span>
                  )}
                </div>
                <div className="notif-list">
                  {notifications.length === 0 ? (
                    <div className="notif-empty">
                      <CheckCircle size={24} className="notif-empty-icon" />
                      <p>You're all caught up!</p>
                      <small>Reminders and updates will appear here.</small>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`notif-item ${n.read === 0 ? "unread" : ""}`}
                        onClick={() => markNotificationRead(n.id)}
                      >
                        <div className="notif-content">
                          <strong className="notif-title">{n.title}</strong>
                          <p className="notif-msg">{n.message}</p>
                          <span className="notif-time">
                            {new Date(n.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="navbar-dropdown-wrapper" ref={menuRef}>
            <button
              type="button"
              className={`profile-pill ${menuOpen ? "open" : ""}`}
              onClick={() => {
                setMenuOpen((v) => !v);
                setNotifOpen(false);
              }}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <UserAvatar src={user?.avatar_url} name={name} size="sm" showRing={false} />
              <div className="profile-details-text">
                <span className="profile-name">{name}</span>
              </div>
              <span className="profile-chevron">⌄</span>
            </button>

            {menuOpen && (
              <div className="dropdown-panel profile-panel">
                <div className="profile-card-head">
                  <UserAvatar src={user?.avatar_url} name={name} size="lg" />
                  <div className="profile-info-block">
                    <strong className="user-name">{name}</strong>
                    <span className="user-email">{email}</span>
                  </div>
                </div>

                <div className="dropdown-divider" />

                <Link
                  to="/settings"
                  className="dropdown-link"
                  onClick={() => setMenuOpen(false)}
                >
                  <Settings size={16} />
                  <span>Profile & Settings</span>
                </Link>

                <Link
                  to="/jobs"
                  className="dropdown-link"
                  onClick={() => setMenuOpen(false)}
                >
                  <Briefcase size={16} />
                  <span>My Applications</span>
                </Link>

                <div className="dropdown-divider" />

                <button
                  type="button"
                  className="dropdown-link logout-item"
                  onClick={() => {
                    setMenuOpen(false);
                    setShowLogoutModal(true);
                  }}
                >
                  <LogOut size={16} />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <ConfirmModal
        isOpen={showLogoutModal}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmText="Sign Out"
        type="danger"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </>
  );
}
