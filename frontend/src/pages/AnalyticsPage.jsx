import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  TrendingUp,
  Percent,
  Clock,
  Award
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area
} from "recharts";
import api from "../api/axios";
import Layout from "../components/Layout";
import { useTheme } from "../context/ThemeContext";
import "../styles/analytics.css";

const STATUS_COLORS = ["#64748b", "#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#ef4444", "#94a3b8"];

export default function AnalyticsPage() {
  const { theme } = useTheme();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get("/dashboard/analytics");
      setAnalytics(res.data);
    } catch {
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading && !analytics) {
    return (
      <Layout>
        <div className="analytics-loading">
          <div className="spinner" />
          <p>Calculating your job-search analytics...</p>
        </div>
      </Layout>
    );
  }

  // Format status data for pie chart
  const statusData = analytics?.status_distribution
    ? Object.entries(analytics.status_distribution)
        .filter(([, count]) => count > 0)
        .map(([name, value]) => ({ name, value }))
    : [];

  // Format work mode data
  const workModeData = analytics?.work_mode_distribution
    ? Object.entries(analytics.work_mode_distribution).map(([name, value]) => ({ name, value }))
    : [];

  // Format employment type data
  const empTypeData = analytics?.employment_type_distribution
    ? Object.entries(analytics.employment_type_distribution).map(([name, value]) => ({ name, value }))
    : [];

  const monthlyTrend = analytics?.monthly_trend || [];

  const tooltipStyle = {
    backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
    borderColor: theme === "dark" ? "#334155" : "#e2e8f0",
    color: theme === "dark" ? "#f8fafc" : "#0f172a",
    borderRadius: "8px",
    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
  };

  return (
    <Layout>
      <div className="analytics-page-container">
        {/* HEADER */}
        <div className="page-header-row">
          <div>
            <h1>Search Analytics & Conversion</h1>
            <p>Real performance metrics and pipeline conversion rates calculated from your applications.</p>
          </div>
        </div>

        {/* CONVERSION FUNNEL STATS */}
        <div className="analytics-funnel-grid">
          <div className="funnel-card">
            <div className="funnel-top">
              <span className="funnel-label">Response Rate</span>
              <Percent size={18} className="funnel-icon blue" />
            </div>
            <strong className="funnel-value">{analytics?.response_rate || 0}%</strong>
            <small>Applications receiving any response</small>
          </div>

          <div className="funnel-card">
            <div className="funnel-top">
              <span className="funnel-label">Interview Rate</span>
              <TrendingUp size={18} className="funnel-icon purple" />
            </div>
            <strong className="funnel-value">{analytics?.interview_rate || 0}%</strong>
            <small>Applications reaching interview rounds</small>
          </div>

          <div className="funnel-card">
            <div className="funnel-top">
              <span className="funnel-label">Offer Conversion</span>
              <Award size={18} className="funnel-icon green" />
            </div>
            <strong className="funnel-value">{analytics?.offer_rate || 0}%</strong>
            <small>Applications converted to offers</small>
          </div>

          <div className="funnel-card">
            <div className="funnel-top">
              <span className="funnel-label">Avg. Response Time</span>
              <Clock size={18} className="funnel-icon orange" />
            </div>
            <strong className="funnel-value">
              {analytics?.avg_days_to_interview !== null ? `${analytics.avg_days_to_interview} days` : "—"}
            </strong>
            <small>Days from applied to interview</small>
          </div>
        </div>

        {/* CHARTS GRID 1: MONTHLY TREND & STATUS BREAKDOWN */}
        <div className="analytics-charts-grid">
          {/* MONTHLY APPLICATION VOLUME */}
          <div className="chart-card-full">
            <div className="chart-header">
              <h3>Monthly Application Volume</h3>
              <p>Applications submitted month-over-month (past 6 months).</p>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={monthlyTrend} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#1e293b" : "#f1f5f9"} />
                  <XAxis dataKey="month" stroke={theme === "dark" ? "#64748b" : "#94a3b8"} fontSize={12} />
                  <YAxis allowDecimals={false} stroke={theme === "dark" ? "#64748b" : "#94a3b8"} fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="applications"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorApps)"
                    name="Applications"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* STATUS BREAKDOWN */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Pipeline Distribution</h3>
              <p>Breakdown by current opportunity stage.</p>
            </div>
            <div className="chart-wrapper">
              {statusData.length === 0 ? (
                <div className="empty-chart-msg">No status data available</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {statusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* CHARTS GRID 2: WORK MODE & EMPLOYMENT TYPE */}
        <div className="analytics-charts-grid-two">
          {/* WORK MODE BAR CHART */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Work Mode Distribution</h3>
              <p>Remote vs. Hybrid vs. On-site applications.</p>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={workModeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#1e293b" : "#f1f5f9"} />
                  <XAxis dataKey="name" stroke={theme === "dark" ? "#64748b" : "#94a3b8"} fontSize={12} />
                  <YAxis allowDecimals={false} stroke={theme === "dark" ? "#64748b" : "#94a3b8"} fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Applications" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* EMPLOYMENT TYPE */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Employment Type</h3>
              <p>Full-time, Internship, Contract, Part-time.</p>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={empTypeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#1e293b" : "#f1f5f9"} />
                  <XAxis dataKey="name" stroke={theme === "dark" ? "#64748b" : "#94a3b8"} fontSize={12} />
                  <YAxis allowDecimals={false} stroke={theme === "dark" ? "#64748b" : "#94a3b8"} fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} name="Applications" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
