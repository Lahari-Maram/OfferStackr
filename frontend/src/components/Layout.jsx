import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useTheme } from "../context/ThemeContext";
import "../styles/layout.css";

export default function Layout({ children }) {
  const { theme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={`app-layout ${theme}`}>
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="layout-body">
        <Navbar onToggleMobileSidebar={() => setMobileOpen((v) => !v)} />
        <main className="layout-content">{children}</main>
        <footer className="app-footer">
          <p>© 2026 OfferStackr. All rights reserved. Designed & built by Lahari.</p>
        </footer>
      </div>
    </div>
  );
}
