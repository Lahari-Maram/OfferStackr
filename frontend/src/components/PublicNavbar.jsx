import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Sun, Moon, Menu, X } from "lucide-react";
import OfferStackrLogo from "./OfferStackrLogo";
import { useTheme } from "../context/ThemeContext";
import "../styles/public-navbar.css";

export default function PublicNavbar() {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`public-nav-wrapper ${scrolled ? "scrolled" : ""}`}>
      <div className="public-nav-container">
        {/* Brand Logo */}
        <Link
          to="/"
          className="public-logo"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="public-logo-icon">
            <OfferStackrLogo size={24} />
          </div>
          <span className="public-logo-text">OfferStackr</span>
        </Link>

        {/* Center Nav Links */}
        <nav className="public-nav-links" aria-label="Main Navigation">
          <a href="#features" className="public-nav-link">Features</a>
          <a href="#workflow" className="public-nav-link">Pipeline Workflow</a>
          <a href="#about" className="public-nav-link">Why OfferStackr</a>
        </nav>

        {/* Right Actions */}
        <div className="public-nav-actions">
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
          <Link to="/signup" className="public-btn-primary">Create Account</Link>
          <button
            type="button"
            className="public-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="public-mobile-menu">
          <nav className="public-mobile-links" aria-label="Mobile Navigation">
            <a
              href="#features"
              className="public-mobile-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#workflow"
              className="public-mobile-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pipeline Workflow
            </a>
            <a
              href="#about"
              className="public-mobile-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Why OfferStackr
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
              Create Account
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
