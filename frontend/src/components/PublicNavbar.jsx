import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Sun, Moon, Menu, X } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import "../styles/public-navbar.css";

export default function PublicNavbar() {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      className="public-nav-wrapper"
      style={{
        width: "100%",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxSizing: "border-box"
      }}
    >
      <div
        className="public-nav-container"
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          maxWidth: "1280px",
          height: "72px",
          margin: "0 auto",
          padding: "0 2rem",
          boxSizing: "border-box",
          gap: "1.5rem"
        }}
      >
        {/* Brand Logo */}
        <Link
          to="/"
          className="public-logo"
          onClick={() => setMobileMenuOpen(false)}
          style={{
            display: "inline-flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "0.85rem",
            textDecoration: "none",
            flexShrink: 0,
            width: "auto",
            minWidth: "max-content",
            cursor: "pointer"
          }}
        >
          <div
            className="public-logo-icon"
            style={{
              width: "38px",
              height: "38px",
              minWidth: "38px",
              minHeight: "38px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
          >
            <Sparkles size={18} />
          </div>
          <span
            className="public-logo-text"
            style={{
              fontSize: "1.3rem",
              fontWeight: 800,
              whiteSpace: "nowrap",
              lineHeight: 1
            }}
          >
            OfferStackr
          </span>
        </Link>

        {/* Center Nav Links */}
        <nav
          className="public-nav-links"
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "0.5rem"
          }}
        >
          <a href="/#features" className="public-nav-link">Features</a>
          <a href="/#workflow" className="public-nav-link">Workflow</a>
          <a href="/#about" className="public-nav-link">About</a>
        </nav>

        {/* Right Actions */}
        <div
          className="public-nav-actions"
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "0.85rem",
            flexShrink: 0
          }}
        >
          <button
            type="button"
            className="theme-toggle-btn public-theme-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <Link to="/login" className="public-btn-ghost">Sign In</Link>
          <Link to="/signup" className="public-btn-primary">Get Started</Link>
          <button
            type="button"
            className="public-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="public-mobile-menu">
          <nav className="public-mobile-links">
            <a
              href="/#features"
              className="public-mobile-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="/#workflow"
              className="public-mobile-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Workflow
            </a>
            <a
              href="/#about"
              className="public-mobile-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </a>
          </nav>
          <div className="public-mobile-actions">
            <Link
              to="/login"
              className="public-btn-ghost mobile-btn"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="public-btn-primary mobile-btn"
              onClick={() => setMobileMenuOpen(false)}
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
