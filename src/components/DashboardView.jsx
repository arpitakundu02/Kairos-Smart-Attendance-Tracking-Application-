import { useCallback, useEffect, useMemo, useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopNavbar } from "./TopNavbar";
import { StatCard } from "./StatCard";
import { LineChartCard } from "./LineChartCard";
import { PieChartCard } from "./PieChartCard";
import { AttendanceTable } from "./AttendanceTable";
import { ClassManagement } from "./ClassManagement";
import { TeacherAttendanceManager } from "./TeacherAttendanceManager";
import { StatePanel } from "./StatePanel";
import { EmptyStateCard } from "./EmptyStateCard";
import {
  fetchClassAttendanceForDate,
  fetchClassRoster,
  fetchTeacherDashboardData,
  saveClassAttendance,
} from "../lib/dataApi";

const teacherNav = ["Dashboard", "Classes", "Attendance", "Reports"];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function DashboardView({ user, onLogout }) {
  const [activeSection, setActiveSection] = useState("Dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [dashboardData, setDashboardData] = useState({
    classes: [],
    stats: [],
    trendData: [],
    splitData: [],
    recentRows: [],
  });

  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [students, setStudents] = useState([]);
  const [statusDraft, setStatusDraft] = useState({});
  const [rosterLoading, setRosterLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchTeacherDashboardData(user.id);
      setDashboardData(data);

      setSelectedClassId((currentClassId) => currentClassId || data.classes[0]?.id || "");
    } catch (loadError) {
      setError(loadError.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!selectedClassId) {
      setStudents([]);
      setStatusDraft({});
      return;
    }

    let mounted = true;

    async function loadRosterAndAttendance() {
      setRosterLoading(true);

      try {
        const [roster, attendanceMap] = await Promise.all([
          fetchClassRoster(selectedClassId),
          fetchClassAttendanceForDate(selectedClassId, selectedDate),
        ]);

        if (!mounted) return;

        setStudents(roster);

        const nextDraft = {};
        for (const student of roster) {
          nextDraft[student.id] = attendanceMap[student.id] || "present";
        }

        setStatusDraft(nextDraft);
      } catch (rosterError) {
        if (!mounted) return;
        setError(rosterError.message || "Failed to load class roster.");
      } finally {
        if (mounted) setRosterLoading(false);
      }
    }

    loadRosterAndAttendance();

    return () => {
      mounted = false;
    };
  }, [selectedClassId, selectedDate]);

  const selectedClassName = useMemo(() => {
    return dashboardData.classes.find((klass) => klass.id === selectedClassId)?.name || "Selected Class";
  }, [dashboardData.classes, selectedClassId]);

  async function handleSaveAttendance() {
    setSaveLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const saved = await saveClassAttendance({
        classId: selectedClassId,
        date: selectedDate,
        statusByStudent: statusDraft,
        teacherId: user.id,
      });

      setSuccessMessage(`Saved ${saved} attendance records for ${selectedClassName}.`);
      await loadDashboard();
    } catch (saveError) {
      setError(saveError.message || "Unable to save attendance.");
    } finally {
      setSaveLoading(false);
    }
  }

  function handlePickStatus(studentId, status) {
    setStatusDraft((current) => ({ ...current, [studentId]: status }));
  }

  const content = (() => {
    if (loading) {
      return <StatePanel title="Loading dashboard..." description="Fetching classes and attendance." />;
    }

    if (error && !dashboardData.classes.length && !dashboardData.recentRows.length) {
      return <StatePanel kind="error" title="Unable to load dashboard" description={error} />;
    }

    if (!dashboardData.classes.length) {
      return (
          <EmptyStateCard
            title="No classes connected yet"
            message="You haven’t joined any class yet."
            ctaLabel="Create Class"
            ctaHint="Create a class and enroll students to start marking attendance."
          />
        );
    }

    if (activeSection === "Classes") {
      return (
        <ClassManagement
          classes={dashboardData.classes}
          activeClassId={selectedClassId}
          onSelectClass={setSelectedClassId}
          students={students}
          loading={rosterLoading}
        />
      );
    }

    if (activeSection === "Attendance") {
      return (
        <TeacherAttendanceManager
          classes={dashboardData.classes}
          selectedClassId={selectedClassId}
          onSelectClass={setSelectedClassId}
          selectedDate={selectedDate}
          onChangeDate={setSelectedDate}
          students={students}
          statusDraft={statusDraft}
          onPickStatus={handlePickStatus}
          onSave={handleSaveAttendance}
          isSaving={saveLoading}
          isLoading={rosterLoading}
        />
      );
    }

    return (
      <>
        <section className="stats-grid">
          {dashboardData.stats.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </section>

        <section className="charts-grid">
          <LineChartCard
            title="Attendance Trend"
            subtitle="Recent sessions"
            data={dashboardData.trendData}
          />
          <PieChartCard
            title="Status Split"
            subtitle="Latest attendance mix"
            segments={dashboardData.splitData}
          />
        </section>

        {dashboardData.recentRows.length ? (
          <AttendanceTable
            title={activeSection === "Reports" ? "Attendance Report" : "Recent Attendance"}
            rows={dashboardData.recentRows}
          />
        ) : (
          <EmptyStateCard
            title="No attendance records yet"
            message="Wait for teacher to mark attendance."
            ctaLabel="Open Attendance"
            ctaHint="Choose a class and date in Attendance tab to start marking records."
          />
        )}
      </>
    );
  })();

  return (
    <div className="dashboard-shell">
      <div className="sidebar-frame">
        <Sidebar items={teacherNav} activeItem={activeSection} onSelect={setActiveSection} />
      </div>

      <main className="dashboard-main">
        <TopNavbar
          title={activeSection}
          userEmail={user.email}
          roleLabel="Teacher"
          onLogout={onLogout}
        />

        {error && <StatePanel kind="error" title="Action error" description={error} />}
        {successMessage && <StatePanel kind="success" title="Saved" description={successMessage} />}

        {content}
      </main>
    </div>
  );
}
