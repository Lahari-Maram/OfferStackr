import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Target,
  Flame,
  Edit
} from "lucide-react";
import api from "../api/axios";
import Layout from "../components/Layout";
import "../styles/goals.css";

export default function GoalsPage() {
  const [streakData, setStreakData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [goal, setGoal] = useState(10);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pRes, sRes, aRes] = await Promise.all([
        api.get("/profile"),
        api.get("/streak"),
        api.get("/dashboard/analytics")
      ]);
      setStreakData(sRes.data);
      setAnalytics(aRes.data);
      setGoal(pRes.data.weekly_goal || 10);
    } catch {
      toast.error("Failed to load goals and streak data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    if (goal < 1) {
      toast.error("Target must be at least 1 application per week");
      return;
    }
    try {
      setSaving(true);
      await api.put("/goal", { weekly_goal: Number(goal) });
      toast.success("Weekly application goal updated!");
      setEditing(false);
      loadData();
    } catch {
      toast.error("Failed to update goal");
    } finally {
      setSaving(false);
    }
  };

  // Generate last 28 days for mini contribution grid
  const renderActivityGrid = () => {
    const datesSet = new Set(streakData?.activity_dates || []);
    const days = [];
    const today = new Date();
    
    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const isoStr = d.toISOString().split("T")[0];
      const hasApplied = datesSet.has(isoStr);
      days.push({
        date: isoStr,
        dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum: d.getDate(),
        active: hasApplied
      });
    }

    return (
      <div className="activity-heatmap-grid">
        {days.map((day) => (
          <div
            key={day.date}
            className={`activity-cell ${day.active ? "cell-active" : ""}`}
            title={`${day.date}: ${day.active ? "Applied" : "No applications"}`}
          >
            <span className="cell-num">{day.dayNum}</span>
            <span className="cell-day">{day.dayName.slice(0, 1)}</span>
          </div>
        ))}
      </div>
    );
  };

  if (loading && !analytics) {
    return (
      <Layout>
        <div className="goals-loading">
          <div className="spinner" />
          <p>Loading your goals and streaks...</p>
        </div>
      </Layout>
    );
  }

  const thisWeek = analytics?.this_week || 0;
  const target = analytics?.week_goal || goal;
  const progressPct = Math.min(roundTo1((thisWeek / target) * 100), 100);
  const remaining = Math.max(0, target - thisWeek);

  function roundTo1(val) {
    return Math.round(val * 10) / 10;
  }

  return (
    <Layout>
      <div className="goals-page-container">
        {/* HEADER */}
        <div className="page-header-row">
          <div>
            <h1>Goals & Application Streaks</h1>
            <p>Maintain consistent momentum in your job search with clear weekly targets and daily activity streaks.</p>
          </div>
        </div>

        {/* TOP METRIC CARDS */}
        <div className="goals-top-grid">
          {/* STREAK CARD */}
          <div className="goal-hero-card streak-hero">
            <div className="hero-card-icon flame-bg">
              <Flame size={28} />
            </div>
            <div className="hero-card-content">
              <span className="hero-eyebrow">CURRENT MOMENTUM</span>
              <div className="streak-big-stat">
                <strong>{streakData?.current_streak || 0}</strong>
                <span>Days in a row</span>
              </div>
              <p>Longest streak achieved: <strong>{streakData?.longest_streak || 0} consecutive days</strong></p>
            </div>
          </div>

          {/* ACTIVE DAYS CARD */}
          <div className="goal-hero-card days-hero">
            <div className="hero-card-icon target-bg">
              <Target size={28} />
            </div>
            <div className="hero-card-content">
              <span className="hero-eyebrow">TOTAL CONSISTENCY</span>
              <div className="streak-big-stat">
                <strong>{streakData?.total_active_days || 0}</strong>
                <span>Active Days</span>
              </div>
              <p>Total unique days with application submissions.</p>
            </div>
          </div>
        </div>

        {/* WEEKLY GOAL SECTION */}
        <div className="goal-detail-card">
          <div className="goal-detail-header">
            <div>
              <h3>Weekly Application Target</h3>
              <p>Target for Monday through Sunday of the current week.</p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setEditing(!editing)}
            >
              <Edit size={14} />
              <span>{editing ? "Cancel" : "Change Target"}</span>
            </button>
          </div>

          {editing ? (
            <form onSubmit={handleSaveGoal} className="goal-edit-box">
              <label htmlFor="goal-input">Set target applications per week:</label>
              <div className="goal-form-inline">
                <input
                  id="goal-input"
                  type="number"
                  min="1"
                  max="500"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving..." : "Save Goal"}
                </button>
              </div>
            </form>
          ) : (
            <div className="goal-progress-display">
              <div className="goal-numbers-large">
                <span className="current">{thisWeek}</span>
                <span className="divider">/</span>
                <span className="target">{target}</span>
                <span className="unit">applications this week</span>
              </div>

              <div className="progress-track-wrapper">
                <div className="progress-track-fill" style={{ width: `${progressPct}%` }} />
              </div>

              <div className="progress-status-footer">
                <span className="pct-text">{progressPct}% of goal achieved</span>
                <span className="remaining-text">
                  {remaining === 0 ? "🎉 Target reached this week!" : `${remaining} application(s) remaining`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 28-DAY ACTIVITY HEATMAP */}
        <div className="goal-detail-card">
          <div className="goal-detail-header">
            <div>
              <h3>28-Day Activity Calendar</h3>
              <p>Daily visual check of your application consistency over the past 4 weeks.</p>
            </div>
          </div>

          {renderActivityGrid()}

          <div className="heatmap-legend">
            <div className="legend-item">
              <span className="legend-box active" />
              <span>Applied</span>
            </div>
            <div className="legend-item">
              <span className="legend-box" />
              <span>No activity</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
