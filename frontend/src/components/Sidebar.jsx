import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  LayoutDashboard,
  Briefcase,
  Calendar,
  CheckSquare,
  Clock,
  BarChart3,
  Bell,
  Target,
  Award,
  FileText,
  StickyNote,
  Settings,
  Plus,
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import OfferStackrLogo from "./OfferStackrLogo";
import UserAvatar from "./UserAvatar";
import { useUser } from "../context/UserContext";
import ConfirmModal from "./ConfirmModal";
import "../styles/sidebar.css";

const primaryNav = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
  { icon: Briefcase, label: "Applications", to: "/jobs" },
  { icon: Plus, label: "Add Application", to: "/add-job" },
  { icon: Calendar, label: "Interviews", to: "/interviews" },
  { icon: CheckSquare, label: "Assessments", to: "/assessments" },
];

const insightsNav = [
  { icon: BarChart3, label: "Analytics", to: "/analytics" },
  { icon: Clock, label: "Timeline", to: "/timeline" },
  { icon: Target, label: "Goals & Streaks", to: "/goals" },
  { icon: Award, label: "Achievements", to: "/achievements" },
  { icon: Bell, label: "Reminders", to: "/reminders" },
];

const workspaceNav = [
  { icon: FileText, label: "Resume Vault", to: "/resume-vault" },
  { icon: StickyNote, label: "Notes", to: "/notes" },
  { icon: Settings, label: "Settings", to: "/settings" },
];

export default function Sidebar({ mobileOpen = false, onCloseMobile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useUser();
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("offerstackr_sidebar_collapsed") === "true";
  });
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    localStorage.setItem("offerstackr_sidebar_collapsed", String(collapsed));
  }, [collapsed]);

  // Close mobile drawer on route change
  useEffect(() => {
    if (onCloseMobile) onCloseMobile();
  }, [location.pathname]);

  const toggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const renderItem = ({ icon: Icon, label, to }) => (
    <NavLink
      key={to}
      to={to}
      className={({ isActive }) =>
        `nav-item ${isActive ? "active" : ""}`
      }
      title={collapsed ? label : undefined}
    >
      <span className="nav-icon">
        <Icon size={19} />
      </span>
      {!collapsed && <span className="nav-label">{label}</span>}
    </NavLink>
  );

  const userName = user?.name || "User";

  return (
    <>
      {mobileOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar ${collapsed ? "collapsed" : ""} ${
          mobileOpen ? "mobile-open" : ""
        }`}
      >
        <div className="sidebar-brand">
          <div className="brand-logo-icon">
            <OfferStackrLogo size={22} />
          </div>
          {!collapsed && (
            <div className="brand-text">
              <span className="brand-title">OfferStackr</span>
            </div>
          )}
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={toggleSidebar}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group">
            {!collapsed && <div className="nav-group-title">Pipeline</div>}
            {primaryNav.map(renderItem)}
          </div>

          <div className="nav-group">
            {!collapsed && <div className="nav-group-title">Insights</div>}
            {insightsNav.map(renderItem)}
          </div>

          <div className="nav-group">
            {!collapsed && <div className="nav-group-title">Workspace</div>}
            {workspaceNav.map(renderItem)}
          </div>
        </nav>

        <div className="sidebar-footer">
          <NavLink
            to="/profile"
            className={({ isActive }) => `sidebar-user-pill ${isActive ? "active" : ""}`}
            title={collapsed ? `${userName} (Profile)` : undefined}
          >
            <UserAvatar src={user?.avatar_url} name={userName} size="sm" showRing={false} />
            {!collapsed && (
              <div className="sidebar-user-details">
                <span className="sidebar-user-name">{userName}</span>
                <span className="sidebar-user-role">Account & Profile</span>
              </div>
            )}
          </NavLink>

          <button
            type="button"
            className="nav-item logout-button"
            onClick={() => setShowLogoutModal(true)}
            title={collapsed ? "Log out" : undefined}
          >
            <span className="nav-icon">
              <LogOut size={19} />
            </span>
            {!collapsed && <span className="nav-label">Log out</span>}
          </button>
        </div>
      </aside>

      <ConfirmModal
        isOpen={showLogoutModal}
        title="Sign Out"
        message="Are you sure you want to sign out of your OfferStackr account?"
        confirmText="Sign Out"
        type="danger"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </>
  );
}
