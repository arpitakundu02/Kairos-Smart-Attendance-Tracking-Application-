import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopNavbar } from "./TopNavbar";
import { StatCard } from "./StatCard";
import { LineChartCard } from "./LineChartCard";
import { PieChartCard } from "./PieChartCard";
import { AttendanceTable } from "./AttendanceTable";
import { StatePanel } from "./StatePanel";
import { fetchStudentDashboardData } from "../lib/dataApi";

const studentNav = ["My Dashboard", "History"];

export function StudentDashboard({ dark, onToggleTheme, user, onLogout }) {
  const [activeSection, setActiveSection] = useState("My Dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    stats: [],
    trendData: [],
    splitData: [],
    historyRows: [],
  });

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const next = await fetchStudentDashboardData(user.id);
        if (!mounted) return;
        setData(next);
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError.message || "Unable to load your attendance.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [user.id]);

  return (
    <div className="dashboard-shell">
      <div className="sidebar-frame">
        <Sidebar items={studentNav} activeItem={activeSection} onSelect={setActiveSection} />
      </div>

      <main className="dashboard-main">
        <TopNavbar
          dark={dark}
          onToggleTheme={onToggleTheme}
          title={activeSection}
          userEmail={user.email}
          roleLabel="Student"
          onLogout={onLogout}
        />

        {loading ? (
          <StatePanel title="Loading attendance..." description="Fetching your records." />
        ) : error ? (
          <StatePanel kind="error" title="Unable to load" description={error} />
        ) : !data.historyRows.length ? (
          <StatePanel
            title="No attendance records yet"
            description="Your attendance history will appear here once teachers mark attendance."
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

            <AttendanceTable title="Attendance History" rows={data.historyRows} />
          </>
        )}
      </main>
    </div>
  );
}
