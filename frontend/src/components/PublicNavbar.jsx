import { Link } from "react-router-dom";
import { Sparkles, Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import "../styles/public-navbar.css";

export default function PublicNavbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="public-nav-wrapper">
      <div className="public-nav-container">
        <Link to="/" className="public-logo">
          <div className="public-logo-icon">
            <Sparkles size={20} />
          </div>
          <span className="public-logo-text">OfferStackr</span>
        </Link>

        <nav className="public-nav-links">
          <a href="/#features" className="public-nav-link">Features</a>
          <a href="/#workflow" className="public-nav-link">Workflow</a>
          <a href="/#about" className="public-nav-link">About</a>
        </nav>

        <div className="public-nav-actions">
          <button
            type="button"
            className="theme-toggle-btn public-theme-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link to="/login" className="public-btn-ghost">Sign In</Link>
          <Link to="/signup" className="public-btn-primary">Get Started</Link>
        </div>
      </div>
    </header>
  );
}
