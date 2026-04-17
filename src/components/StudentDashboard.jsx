import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopNavbar } from "./TopNavbar";
import { StatCard } from "./StatCard";
import { LineChartCard } from "./LineChartCard";
import { PieChartCard } from "./PieChartCard";
import { AttendanceTable } from "./AttendanceTable";
import { StatePanel } from "./StatePanel";
import { EmptyStateCard } from "./EmptyStateCard";
import { fetchStudentDashboardData } from "../lib/dataApi";

const studentNav = ["My Dashboard", "History"];

export function StudentDashboard({ user, onLogout }) {
  const [activeSection, setActiveSection] = useState("My Dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joinHelpVisible, setJoinHelpVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackKind, setFeedbackKind] = useState("success");
  const dashboardContentRef = useRef(null);
  const joinModalRef = useRef(null);
  const joinModalCloseRef = useRef(null);
  const feedbackTimerRef = useRef(null);
  const [data, setData] = useState({
    stats: [],
    trendData: [],
    splitData: [],
    historyRows: [],
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const next = await fetchStudentDashboardData(user.id);
      setData(next);
      setJoinHelpVisible(false);
    } catch (loadError) {
      setError(loadError.message || "Unable to load your attendance.");
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const hasHistory = data.historyRows.length > 0;
  const attendancePercent = useMemo(() => {
    if (!hasHistory) return 0;
    const presentCount = data.historyRows.filter((row) => row.status?.toLowerCase() === "present").length;
    return Math.round((presentCount / data.historyRows.length) * 100);
  }, [data.historyRows, hasHistory]);

  const totalClasses = useMemo(() => {
    if (!hasHistory) return 0;
    return new Set(data.historyRows.map((row) => row.class_name)).size;
  }, [data.historyRows, hasHistory]);

  const lastAttendance = hasHistory ? data.historyRows[0]?.status || "--" : "--";

  useEffect(() => {
    if (!dashboardContentRef.current) return;
    if (joinHelpVisible) {
      dashboardContentRef.current.setAttribute("inert", "");
      dashboardContentRef.current.setAttribute("aria-hidden", "true");
    } else {
      dashboardContentRef.current.removeAttribute("inert");
      dashboardContentRef.current.removeAttribute("aria-hidden");
    }
  }, [joinHelpVisible]);

  useEffect(() => {
    if (!joinHelpVisible) return;

    const previousFocused = document.activeElement;
    joinModalCloseRef.current?.focus();

    function handleModalKeys(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        setJoinHelpVisible(false);
        return;
      }

      if (event.key !== "Tab") return;
      const modalEl = joinModalRef.current;
      if (!modalEl) return;

      const focusable = modalEl.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleModalKeys);
    return () => {
      document.removeEventListener("keydown", handleModalKeys);
      if (previousFocused && typeof previousFocused.focus === "function") {
        previousFocused.focus();
      }
    };
  }, [joinHelpVisible]);

  async function handleRefresh() {
    setFeedbackKind("info");
    setFeedbackMessage("Refreshing your dashboard...");
    setRefreshing(true);
    try {
      await loadData();
      setFeedbackKind("success");
      setFeedbackMessage("Dashboard updated.");
    } finally {
      setRefreshing(false);
    }
  }

  function openJoinModal() {
    setJoinHelpVisible(true);
  }

  function closeJoinModal(showFeedback = false) {
    setJoinHelpVisible(false);
    if (showFeedback) {
      setFeedbackKind("success");
      setFeedbackMessage("Join class request guidance opened.");
    }
  }

  useEffect(() => {
    if (!feedbackMessage) return undefined;
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = setTimeout(() => {
      setFeedbackMessage("");
    }, 1800);
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, [feedbackMessage]);

  return (
    <div className="dashboard-shell">
      <div className="sidebar-frame">
        <Sidebar items={studentNav} activeItem={activeSection} onSelect={setActiveSection} />
      </div>

      <main className="dashboard-main">
        <TopNavbar
          title={activeSection}
          userEmail={user.email}
          roleLabel="Student"
          onLogout={onLogout}
        />

        <div ref={dashboardContentRef}>
          <section className="glass-panel student-action-bar">
            <button
              type="button"
              className={`logout-btn student-tab-btn ${activeSection === "My Dashboard" ? "active" : ""}`}
              onClick={() => setActiveSection("My Dashboard")}
            >
              View Attendance
            </button>
            <button
              type="button"
              className={`logout-btn student-tab-btn ${activeSection === "History" ? "active" : ""}`}
              onClick={() => setActiveSection("History")}
            >
              View History
            </button>
            <button type="button" className="logout-btn student-refresh-btn" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? (
                <>
                  <span className="button-spinner" aria-hidden="true" />
                  Refreshing...
                </>
              ) : (
                "Refresh"
              )}
            </button>
          </section>

          {feedbackMessage && (
            <p className={`student-inline-feedback ${feedbackKind === "info" ? "info" : "success"}`}>
              {feedbackMessage}
            </p>
          )}

          <section className="glass-panel student-summary-card">
            <div className="student-summary-row">
              <div>
                <p className="card-label">Attendance</p>
                <p className="card-value">{attendancePercent}%</p>
              </div>
              <div>
                <p className="card-label">Total Classes</p>
                <p className="card-value">{totalClasses}</p>
              </div>
              <div>
                <p className="card-label">Last Attendance</p>
                <p className="card-value student-summary-status">{lastAttendance}</p>
              </div>
            </div>
            <div className="student-progress">
              <div className="student-progress-track" aria-hidden="true">
                <div className="student-progress-fill" style={{ width: `${attendancePercent}%` }} />
              </div>
              <p className="card-meta">Progress: {attendancePercent}%</p>
            </div>
          </section>

          {loading ? (
            <StatePanel title="Loading attendance..." description="Fetching your records." />
          ) : error ? (
            <StatePanel kind="error" title="Unable to load" description={error} />
          ) : activeSection === "History" ? (
            <>
              {hasHistory ? (
                <AttendanceTable title="Attendance History" rows={data.historyRows} />
              ) : (
                <section className="glass-panel table-card">
                  <div className="card-head">
                    <h3>Attendance History</h3>
                    <p className="card-meta">No entries yet</p>
                  </div>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Class</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>--</td>
                          <td>--</td>
                          <td>--</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          ) : (
            <>
              {!hasHistory ? (
                <EmptyStateCard
                  title="Your dashboard is ready"
                  message="Join a class to start tracking attendance and unlock your attendance history."
                  ctaLabel="Join Class"
                  ctaHint="Ask your teacher/admin to add your account email to a class roster. Tip: attendance syncs after each class session."
                  onCtaClick={openJoinModal}
                />
              ) : (
                <>
                  <section className="stats-grid">
                    {data.stats.map((card) => (
                      <StatCard key={card.title} {...card} />
                    ))}
                  </section>

                  <section className="charts-grid">
                    <LineChartCard
                      title="My Attendance Trend"
                      subtitle="Recent learning sessions"
                      data={data.trendData}
                    />
                    <PieChartCard
                      title="Status Distribution"
                      subtitle="Present / late / absent"
                      segments={data.splitData}
                    />
                  </section>
                </>
              )}
            </>
          )}
        </div>

        {joinHelpVisible && (
          <section
            className="join-class-modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="join-class-title"
            onClick={() => closeJoinModal(true)}
          >
            <div className="glass-panel join-class-modal" ref={joinModalRef} onClick={(event) => event.stopPropagation()}>
              <h3 id="join-class-title" className="join-class-title">Join Class</h3>
              <p className="join-class-copy">
                Share your account email with your teacher/admin so they can enroll you in a class roster.
              </p>
              <div className="join-class-actions">
                <button
                  type="button"
                  className="logout-btn"
                  onClick={() => closeJoinModal(true)}
                  ref={joinModalCloseRef}
                >
                  Close
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
