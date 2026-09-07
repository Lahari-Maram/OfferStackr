import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Trophy } from "lucide-react";
import api from "../api/axios";
import Layout from "../components/Layout";
import "../styles/achievements.css";

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState("all"); // "all", "unlocked", "in_progress"

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const res = await api.get("/achievements");
      setAchievements(res.data || []);
    } catch {
      toast.error("Failed to load achievements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAchievements();
  }, []);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const completionPct = totalCount ? Math.round((unlockedCount / totalCount) * 100) : 0;

  const filtered = achievements.filter((a) => {
    if (filterTab === "unlocked") return a.unlocked;
    if (filterTab === "in_progress") return !a.unlocked;
    return true;
  });

  return (
    <Layout>
      <div className="achievements-page-container">
        {/* HEADER */}
        <div className="page-header-row">
          <div>
            <h1>Milestones & Achievements</h1>
            <p>Celebrate your job-search progress with badges unlocked by your actual applications, interviews, and consistency.</p>
          </div>
        </div>

        {/* PROGRESS BANNER */}
        <div className="achievements-banner-card">
          <div className="banner-icon-wrap">
            <Trophy size={36} className="trophy-icon" />
          </div>
          <div className="banner-text-content">
            <h2>{unlockedCount} of {totalCount} Badges Unlocked ({completionPct}%)</h2>
            <div className="banner-progress-track">
              <div className="banner-progress-fill" style={{ width: `${completionPct}%` }} />
            </div>
            <p>Every badge is awarded automatically based on your verified application journey.</p>
          </div>
        </div>

        {/* TABS */}
        <div className="page-filter-tabs">
          <button
            type="button"
            className={`filter-tab ${filterTab === "all" ? "active" : ""}`}
            onClick={() => setFilterTab("all")}
          >
            All Badges ({totalCount})
          </button>
          <button
            type="button"
            className={`filter-tab ${filterTab === "unlocked" ? "active" : ""}`}
            onClick={() => setFilterTab("unlocked")}
          >
            Unlocked ({unlockedCount})
          </button>
          <button
            type="button"
            className={`filter-tab ${filterTab === "in_progress" ? "active" : ""}`}
            onClick={() => setFilterTab("in_progress")}
          >
            In Progress ({totalCount - unlockedCount})
          </button>
        </div>

        {/* BADGES GRID */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Evaluating achievements...</p>
          </div>
        ) : (
          <div className="badges-grid">
            {filtered.map((b) => (
              <div
                key={b.badge_key}
                className={`badge-card ${b.unlocked ? "badge-unlocked" : "badge-locked"}`}
              >
                <div className="badge-card-top">
                  <div className="badge-emoji-box">
                    <span>{b.icon}</span>
                  </div>
                  <span className={`badge-status-pill ${b.unlocked ? "unlocked" : "locked"}`}>
                    {b.unlocked ? "✓ Unlocked" : "In Progress"}
                  </span>
                </div>

                <h3 className="badge-title">{b.title}</h3>
                <p className="badge-desc">{b.description}</p>

                <div className="badge-progress-box">
                  <div className="badge-numbers-row">
                    <span>Progress: {b.current} / {b.target}</span>
                    <span>{b.progress}%</span>
                  </div>
                  <div className="badge-track">
                    <div className="badge-fill" style={{ width: `${b.progress}%` }} />
                  </div>
                </div>

                {b.unlocked && b.unlocked_at && (
                  <small className="unlocked-timestamp">
                    Unlocked on {new Date(b.unlocked_at).toLocaleDateString()}
                  </small>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
