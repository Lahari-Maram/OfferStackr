import { useEffect, useState, useMemo, useRef } from "react";
import { toast } from "react-toastify";
import {
  Target,
  Flame,
  Award,
  Calendar,
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Edit,
  Sparkles,
  Clock,
  X,
  Layers,
  Info
} from "lucide-react";
import api from "../api/axios";
import Layout from "../components/Layout";
import "../styles/goals.css";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function GoalsPage() {
  const currentActualYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentActualYear);
  const [selectedMonth, setSelectedMonth] = useState(null); // null = all months, 1-12 = specific month
  const [selectedDayData, setSelectedDayData] = useState(null);
  
  const [calendarData, setCalendarData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [goal, setGoal] = useState(10);
  const [editingGoal, setEditingGoal] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);

  const [tooltip, setTooltip] = useState({
    visible: false,
    content: null,
    x: 0,
    y: 0
  });

  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const yearPickerRef = useRef(null);

  // Close year popover on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (yearPickerRef.current && !yearPickerRef.current.contains(e.target)) {
        setYearPickerOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setYearPickerOpen(false);
      }
    };
    if (yearPickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [yearPickerOpen]);

  const heatmapScrollRef = useRef(null);

  const scrollHeatmap = (direction) => {
    if (heatmapScrollRef.current) {
      const scrollDistance = direction === "left" ? -320 : 320;
      heatmapScrollRef.current.scrollBy({ left: scrollDistance, behavior: "smooth" });
    }
  };

  const loadData = async (yearToLoad = selectedYear) => {
    try {
      setLoading(true);
      const [calRes, aRes, pRes] = await Promise.all([
        api.get("/activity/calendar", { params: { year: yearToLoad } }),
        api.get("/dashboard/analytics"),
        api.get("/profile")
      ]);
      setCalendarData(calRes.data);
      setAnalytics(aRes.data);
      setGoal(pRes.data.weekly_goal || 10);
    } catch {
      toast.error("Failed to load activity contribution data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedYear);
  }, [selectedYear]);

  const handleYearChange = (newYear) => {
    setSelectedYear(newYear);
    setSelectedMonth(null);
    setSelectedDayData(null);
  };

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    if (goal < 1) {
      toast.error("Target must be at least 1 application per week");
      return;
    }
    try {
      setSavingGoal(true);
      await api.put("/goal", { weekly_goal: Number(goal) });
      toast.success("Weekly application target updated!");
      setEditingGoal(false);
      loadData(selectedYear);
    } catch {
      toast.error("Failed to update goal");
    } finally {
      setSavingGoal(false);
    }
  };

  // Build the 52/53-week contribution matrix for selectedYear
  const { weeksMatrix, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const jan1 = new Date(selectedYear, 0, 1);
    const dec31 = new Date(selectedYear, 11, 31);
    
    // Start on Sunday on or before Jan 1
    const startSunday = new Date(selectedYear, 0, 1 - jan1.getDay());
    startSunday.setHours(0, 0, 0, 0);

    // End on Saturday on or after Dec 31
    const endSaturday = new Date(selectedYear, 11, 31 + (6 - dec31.getDay()));
    endSaturday.setHours(0, 0, 0, 0);

    const totalDays = Math.round((endSaturday - startSunday) / (1000 * 60 * 60 * 24)) + 1;
    const numWeeks = Math.ceil(totalDays / 7);

    const weeks = [];
    const months = [];
    let lastMonth = -1;

    for (let w = 0; w < numWeeks; w++) {
      const days = [];
      let weekIncludesNewMonth = false;
      let newMonthIdx = -1;

      for (let r = 0; r < 7; r++) {
        const d = new Date(startSunday);
        d.setDate(startSunday.getDate() + (w * 7 + r));
        
        const yr = d.getFullYear();
        const mo = d.getMonth();
        const dt = d.getDate();
        const isoStr = `${yr}-${String(mo + 1).padStart(2, "0")}-${String(dt).padStart(2, "0")}`;

        const isCurrentYear = yr === selectedYear;
        const isToday = d.getTime() === today.getTime();
        const isFuture = d > today;

        const summary = calendarData?.daily_activity?.[isoStr] || null;
        const count = summary ? summary.total : 0;

        let level = 0;
        if (count === 1) level = 1;
        else if (count >= 2 && count <= 3) level = 2;
        else if (count >= 4 && count <= 6) level = 3;
        else if (count >= 7) level = 4;

        if (isCurrentYear && dt <= 7 && mo !== lastMonth) {
          weekIncludesNewMonth = true;
          newMonthIdx = mo;
          lastMonth = mo;
        }

        days.push({
          date: d,
          dateStr: isoStr,
          dayNum: dt,
          month: mo + 1,
          dayOfWeek: r,
          isCurrentYear,
          isToday,
          isFuture,
          count,
          level,
          summary
        });
      }

      if (weekIncludesNewMonth && newMonthIdx >= 0) {
        months.push({
          name: MONTH_SHORT[newMonthIdx],
          monthIdx: newMonthIdx + 1,
          colIndex: w
        });
      }

      weeks.push(days);
    }

    return { weeksMatrix: weeks, monthLabels: months };
  }, [selectedYear, calendarData]);

  const handleCellMouseEnter = (e, day) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      day,
      x: rect.left + rect.width / 2,
      y: rect.top - 8
    });
  };

  const handleCellMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  const handleCellClick = (day) => {
    if (day.isCurrentYear && day.count > 0) {
      setSelectedDayData(day);
    } else {
      setSelectedDayData(null);
    }
  };

  const availableYearsList = useMemo(() => {
    // Dynamic historical years: current actual year back 8+ years (e.g. 2026 down to 2018)
    const defaultHistoricalYears = Array.from({ length: 9 }, (_, i) => currentActualYear - i);
    const serverYears = Array.isArray(calendarData?.available_years) ? calendarData.available_years : [];
    const combined = Array.from(new Set([...defaultHistoricalYears, ...serverYears, selectedYear]));
    return combined.sort((a, b) => b - a);
  }, [currentActualYear, calendarData?.available_years, selectedYear]);

  const thisWeek = analytics?.this_week || 0;
  const target = analytics?.week_goal || goal;
  const progressPct = Math.min(Math.round((thisWeek / target) * 100), 100);
  const remaining = Math.max(0, target - thisWeek);

  // Month-filtered items
  const filteredMonthActivities = useMemo(() => {
    if (!selectedMonth || !calendarData?.daily_activity) return [];
    return Object.values(calendarData.daily_activity)
      .filter((day) => {
        const d = new Date(day.date);
        return d.getMonth() + 1 === selectedMonth && day.total > 0;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [selectedMonth, calendarData]);

  return (
    <Layout>
      <div className="goals-page-container">
        {/* HEADER */}
        <div className="page-header-row">
          <div>
            <h1>Activity & Consistency Momentum</h1>
            <p>Track your job-search journey across years, months, and days with full historical activity timelines.</p>
          </div>
        </div>

        {/* TOP METRIC CARDS */}
        <div className="goals-top-grid">
          {/* STREAK CARD */}
          <div className="goal-hero-card streak-hero">
            <div className="hero-card-icon flame-bg">
              <Flame size={26} />
            </div>
            <div className="hero-card-content">
              <span className="hero-eyebrow">CURRENT MOMENTUM</span>
              <div className="streak-big-stat">
                <strong>{calendarData?.current_streak || 0}</strong>
                <span>Days in a row</span>
              </div>
              <p>Longest streak achieved: <strong>{calendarData?.longest_streak || 0} consecutive days</strong></p>
            </div>
          </div>

          {/* ACTIVE DAYS CARD */}
          <div className="goal-hero-card days-hero">
            <div className="hero-card-icon target-bg">
              <Target size={26} />
            </div>
            <div className="hero-card-content">
              <span className="hero-eyebrow">YEAR CONSISTENCY</span>
              <div className="streak-big-stat">
                <strong>{calendarData?.total_active_days_year || 0}</strong>
                <span>Active Days in {selectedYear}</span>
              </div>
              <p>Total all-time active days: <strong>{calendarData?.total_active_days_all_time || 0} days</strong></p>
            </div>
          </div>

          {/* TOTAL YEAR ACTIVITIES */}
          <div className="goal-hero-card activity-hero">
            <div className="hero-card-icon activity-bg">
              <Layers size={26} />
            </div>
            <div className="hero-card-content">
              <span className="hero-eyebrow">{selectedYear} OUTPUT</span>
              <div className="streak-big-stat">
                <strong>{calendarData?.total_activities_year || 0}</strong>
                <span>Activities in {selectedYear}</span>
              </div>
              <p>Total applications submitted: <strong>{calendarData?.total_applications_year || 0}</strong></p>
            </div>
          </div>
        </div>

        {/* WEEKLY APPLICATION TARGET */}
        <div className="goal-detail-card">
          <div className="goal-detail-header">
            <div>
              <h3>Weekly Application Target</h3>
              <p>Target for the current week.</p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setEditingGoal(!editingGoal)}
            >
              <Edit size={14} />
              <span>{editingGoal ? "Cancel" : "Change Target"}</span>
            </button>
          </div>

          {editingGoal ? (
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
                <button type="submit" className="btn btn-primary" disabled={savingGoal}>
                  {savingGoal ? "Saving..." : "Save Goal"}
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

        {/* ================= GITHUB/LEETCODE-STYLE CONTRIBUTION HEATMAP ================= */}
        <div className="goal-detail-card contribution-calendar-card">
          <div className="contribution-header-bar">
            <div className="calendar-title-group">
              <h3>
                <Sparkles size={18} className="sparkle-accent" />
                <span>{calendarData?.total_activities_year || 0} activities in {selectedYear}</span>
              </h3>
              <p>Contribution heatmap across every application, interview, and assessment.</p>
            </div>

            {/* COMPACT RECTANGULAR YEAR PICKER & SCROLL CONTROLS */}
            <div className="year-switcher-group">
              {/* COMPACT YEAR SELECTOR */}
              <div className="compact-year-picker-wrap" ref={yearPickerRef}>
                <button
                  type="button"
                  className={`compact-year-trigger ${yearPickerOpen ? "open" : ""}`}
                  onClick={() => setYearPickerOpen((prev) => !prev)}
                  aria-expanded={yearPickerOpen}
                  aria-haspopup="listbox"
                  aria-label={`Select activity year, currently selected: ${selectedYear}`}
                  id="year-dropdown-trigger"
                >
                  <span className="year-trigger-label">{selectedYear}</span>
                  <ChevronDown size={14} className={`year-caret ${yearPickerOpen ? "rotated" : ""}`} />
                </button>

                {yearPickerOpen && (
                  <div
                    className="compact-year-popover"
                    role="listbox"
                    aria-labelledby="year-dropdown-trigger"
                  >
                    <div className="popover-years-list" tabIndex={0}>
                      {availableYearsList.map((yr) => {
                        const isSelected = yr === selectedYear;
                        const isCurrent = yr === currentActualYear;
                        return (
                          <button
                            key={yr}
                            type="button"
                            className={`year-popover-item ${isSelected ? "selected" : ""}`}
                            onClick={() => {
                              handleYearChange(yr);
                              setYearPickerOpen(false);
                            }}
                            role="option"
                            aria-selected={isSelected}
                          >
                            <span className="year-item-label">
                              {yr}
                              {isCurrent && !isSelected && (
                                <span className="current-year-badge">Current</span>
                              )}
                            </span>
                            {isSelected && <Check size={14} className="popover-check-icon" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* HORIZONTAL HEATMAP SCROLL CONTROLS */}
              <div className="calendar-scroll-btns">
                <button
                  type="button"
                  className="year-nav-btn"
                  onClick={() => scrollHeatmap("left")}
                  title="Scroll calendar left"
                  aria-label="Scroll calendar left"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  className="year-nav-btn"
                  onClick={() => scrollHeatmap("right")}
                  title="Scroll calendar right"
                  aria-label="Scroll calendar right"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {selectedYear !== currentActualYear && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm jump-current-btn"
                  onClick={() => handleYearChange(currentActualYear)}
                >
                  Current ({currentActualYear})
                </button>
              )}
            </div>
          </div>

          {/* EMPTY YEAR BANNER */}
          {calendarData?.total_activities_year === 0 && (
            <div className="empty-year-notice">
              <Info size={16} />
              <span>No activity recorded for {selectedYear}. Keep submitting applications to populate your timeline!</span>
            </div>
          )}

          {/* HEATMAP GRID SCROLLABLE CONTAINER */}
          <div className="heatmap-outer-scroll" ref={heatmapScrollRef}>
            <div className="heatmap-grid-container">
              {/* Month Header Row */}
              <div className="heatmap-months-row">
                <div className="weekday-spacer" />
                <div className="months-track">
                  {monthLabels.map((m, idx) => (
                    <span
                      key={idx}
                      className="month-header-label"
                      style={{ gridColumnStart: m.colIndex + 1 }}
                    >
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Grid Body: Weekday Labels + Matrix */}
              <div className="heatmap-body-row">
                {/* Weekday Column Labels */}
                <div className="weekday-labels-col">
                  <span className="w-label">Sun</span>
                  <span className="w-label">Mon</span>
                  <span className="w-label">Tue</span>
                  <span className="w-label">Wed</span>
                  <span className="w-label">Thu</span>
                  <span className="w-label">Fri</span>
                  <span className="w-label">Sat</span>
                </div>

                {/* 52/53 Week Columns */}
                <div className="heatmap-weeks-columns">
                  {weeksMatrix.map((week, wIdx) => (
                    <div key={wIdx} className="heatmap-week-col">
                      {week.map((day, rIdx) => {
                        const isSelected = selectedDayData?.dateStr === day.dateStr;
                        const isMonthFiltered = selectedMonth ? day.month === selectedMonth : true;

                        return (
                          <div
                            key={rIdx}
                            className={`heatmap-cell level-${day.isCurrentYear ? day.level : "out"} ${
                              day.isToday ? "is-today" : ""
                            } ${day.isFuture ? "is-future" : ""} ${isSelected ? "is-selected" : ""} ${
                              !isMonthFiltered && day.isCurrentYear ? "is-dimmed" : ""
                            }`}
                            onMouseEnter={(e) => handleCellMouseEnter(e, day)}
                            onMouseLeave={handleCellMouseLeave}
                            onClick={() => handleCellClick(day)}
                            role="button"
                            tabIndex={0}
                            aria-label={`${day.dateStr}: ${day.count} activities`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* HEATMAP FOOTER & INTENSITY LEGEND */}
          <div className="heatmap-footer-bar">
            <span className="learn-more-text">
              Selecting a day inspects its applications & interview milestones.
            </span>

            <div className="heatmap-intensity-legend">
              <span className="legend-text">Less</span>
              <div className="heatmap-cell level-0 mini" />
              <div className="heatmap-cell level-1 mini" />
              <div className="heatmap-cell level-2 mini" />
              <div className="heatmap-cell level-3 mini" />
              <div className="heatmap-cell level-4 mini" />
              <span className="legend-text">More</span>
            </div>
          </div>

          {/* ================= SELECTED DAY DETAIL CARD ================= */}
          {selectedDayData && (
            <div className="selected-day-panel">
              <div className="selected-day-header">
                <div className="day-title-meta">
                  <Calendar size={18} className="meta-icon" />
                  <strong>
                    {new Date(selectedDayData.dateStr + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </strong>
                  <span className="total-badge">
                    {selectedDayData.count} {selectedDayData.count === 1 ? "activity" : "activities"}
                  </span>
                </div>
                <button
                  type="button"
                  className="close-panel-btn"
                  onClick={() => setSelectedDayData(null)}
                  aria-label="Close day view"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="day-items-list">
                {selectedDayData.summary?.items?.map((item, idx) => (
                  <div key={idx} className="day-item-card">
                    <div className="item-icon-col">
                      {item.type === "application" && <Briefcase size={16} className="item-ic blue" />}
                      {item.type === "interview" && <Calendar size={16} className="item-ic cyan" />}
                      {item.type === "assessment" && <CheckCircle2 size={16} className="item-ic purple" />}
                    </div>
                    <div className="item-info-col">
                      <strong className="item-title">{item.title}</strong>
                      <span className="item-subtitle">{item.subtitle}</span>
                    </div>
                    {item.status && (
                      <span className={`status-pill status-${item.status.toLowerCase()}`}>
                        {item.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ================= MONTHLY BREAKDOWN ================= */}
        <div className="goal-detail-card monthly-breakdown-card">
          <div className="goal-detail-header">
            <div>
              <h3>Monthly Activity Breakdown</h3>
              <p>Inspect your total submissions and interview progress month-by-month in {selectedYear}.</p>
            </div>
            {selectedMonth && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedMonth(null)}
              >
                Clear Filter (View All)
              </button>
            )}
          </div>

          {/* Month Pills */}
          <div className="monthly-pills-grid">
            {MONTH_NAMES.map((name, idx) => {
              const monthNum = idx + 1;
              const count = calendarData?.monthly_counts?.[String(monthNum)] || 0;
              const isSelected = selectedMonth === monthNum;

              return (
                <button
                  key={monthNum}
                  type="button"
                  className={`month-summary-pill ${isSelected ? "active" : ""} ${count > 0 ? "has-activity" : ""}`}
                  onClick={() => setSelectedMonth(isSelected ? null : monthNum)}
                >
                  <div className="month-pill-name">{name}</div>
                  <div className="month-pill-count">
                    <strong>{count}</strong>
                    <span>{count === 1 ? "activity" : "activities"}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Month Focused Timeline */}
          {selectedMonth && (
            <div className="focused-month-container">
              <div className="focused-month-head">
                <h4>
                  {MONTH_NAMES[selectedMonth - 1]} {selectedYear} Detailed Timeline
                </h4>
                <span>{calendarData?.monthly_counts?.[String(selectedMonth)] || 0} total events</span>
              </div>

              {filteredMonthActivities.length === 0 ? (
                <div className="month-empty-text">No activities logged during {MONTH_NAMES[selectedMonth - 1]} {selectedYear}.</div>
              ) : (
                <div className="focused-month-list">
                  {filteredMonthActivities.map((day) => (
                    <div key={day.date} className="month-day-group">
                      <div className="day-date-heading">
                        <Clock size={14} />
                        <span>
                          {new Date(day.date + "T00:00:00").toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric"
                          })}
                        </span>
                      </div>
                      <div className="day-events-grid">
                        {day.items.map((it, iIdx) => (
                          <div key={iIdx} className="mini-event-pill">
                            <span className={`type-dot ${it.type}`} />
                            <span className="event-title">{it.title}</span>
                            <span className="event-sub">{it.subtitle}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FLOATING HOVER TOOLTIP */}
      {tooltip.visible && tooltip.day && (
        <div
          className="heatmap-floating-tooltip"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`
          }}
        >
          <div className="tooltip-date">
            {new Date(tooltip.day.dateStr + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric"
            })}
          </div>
          {tooltip.day.count === 0 ? (
            <div className="tooltip-empty">No activity recorded</div>
          ) : (
            <div className="tooltip-body">
              <strong>{tooltip.day.count} total {tooltip.day.count === 1 ? "activity" : "activities"}</strong>
              <div className="tooltip-breakdown">
                {tooltip.day.summary?.applications > 0 && (
                  <span>• {tooltip.day.summary.applications} application(s)</span>
                )}
                {tooltip.day.summary?.interviews > 0 && (
                  <span>• {tooltip.day.summary.interviews} interview(s)</span>
                )}
                {tooltip.day.summary?.assessments > 0 && (
                  <span>• {tooltip.day.summary.assessments} assessment(s)</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
