import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Clock,
  Briefcase,
  Calendar,
  CheckSquare,
  FileText,
  Sparkles
} from "lucide-react";
import api from "../api/axios";
import Layout from "../components/Layout";
import "../styles/timeline.css";

export default function TimelinePage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      const res = await api.get("/timeline");
      setEvents(res.data || []);
    } catch {
      toast.error("Failed to load application history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, []);

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case "created":
      case "imported":
        return <Briefcase size={16} className="ev-icon blue" />;
      case "status_change":
        return <Clock size={16} className="ev-icon purple" />;
      case "interview_scheduled":
      case "interview_completed":
        return <Calendar size={16} className="ev-icon cyan" />;
      case "assessment_added":
      case "assessment_status":
        return <CheckSquare size={16} className="ev-icon orange" />;
      case "resume_attached":
      case "resume_uploaded":
      case "resume_detached":
        return <FileText size={16} className="ev-icon green" />;
      default:
        return <Sparkles size={16} className="ev-icon" />;
    }
  };

  return (
    <Layout>
      <div className="timeline-page-container">
        {/* HEADER */}
        <div className="page-header-row">
          <div>
            <h1>Application Activity Timeline</h1>
            <p>A complete chronological record of your job-search journey and status milestones.</p>
          </div>
          <span className="event-count-pill">{events.length} Total Events</span>
        </div>

        {/* FEED */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading application timeline...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="empty-state-box">
            <Clock size={48} className="empty-icon-muted" />
            <h3>Your timeline is ready</h3>
            <p>As you add applications, schedule interviews, and attach resumes, your journey will unfold here.</p>
          </div>
        ) : (
          <div className="full-timeline-wrapper">
            {events.map((ev, i) => (
              <div key={ev.id || i} className="timeline-entry-row">
                <div className="timeline-icon-column">
                  <div className="timeline-icon-circle">
                    {getEventIcon(ev.event_type)}
                  </div>
                  {i < events.length - 1 && <div className="timeline-connector-line" />}
                </div>

                <div className="timeline-entry-card">
                  <div className="entry-card-header">
                    <strong className="entry-title">
                      {ev.event_type.replace(/_/g, " ").toUpperCase()}
                    </strong>
                    <time className="entry-time">
                      {new Date(ev.created_at).toLocaleString()}
                    </time>
                  </div>
                  <p className="entry-desc">{ev.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
