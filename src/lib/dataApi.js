import { supabase } from "./supabase";

function assertClient() {
  if (!supabase) {
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }
}

function fallbackNameFromEmail(email) {
  const prefix = (email || "student").split("@")[0] || "student";
  return prefix
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function toPercent(value) {
  return Number.isFinite(value) ? Number(value.toFixed(1)) : 0;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function parseAttendanceStatus(status) {
  if (status === "late") return "Late";
  if (status === "absent") return "Absent";
  return "Present";
}

function formatDisplayDate(dateValue) {
  if (!dateValue) return "-";
  const date = new Date(`${dateValue}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function buildLineTrend(records, maxPoints = 12) {
  const grouped = new Map();

  for (const row of records) {
    if (!grouped.has(row.date)) grouped.set(row.date, []);
    grouped.get(row.date).push(row.status);
  }

  const points = [...grouped.entries()]
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .slice(-maxPoints)
    .map(([, statuses]) => {
      const presentCount = statuses.filter((status) => status === "present").length;
      return toPercent((presentCount / statuses.length) * 100);
    });

  if (points.length === 0) return [0, 0, 0, 0, 0, 0];
  if (points.length === 1) return [points[0], points[0]];
  return points;
}

function buildPieSplit(records) {
  const total = records.length;
  if (!total) {
    return [
      { label: "Present", value: 0, color: "#6be5b3" },
      { label: "Late", value: 0, color: "#ffcf66" },
      { label: "Absent", value: 0, color: "#ff8f94" },
    ];
  }

  const present = records.filter((row) => row.status === "present").length;
  const late = records.filter((row) => row.status === "late").length;
  const absent = records.filter((row) => row.status === "absent").length;

  return [
    { label: "Present", value: toPercent((present / total) * 100), color: "#6be5b3" },
    { label: "Late", value: toPercent((late / total) * 100), color: "#ffcf66" },
    { label: "Absent", value: toPercent((absent / total) * 100), color: "#ff8f94" },
  ];
}

export async function loginUser({ email, password }) {
  assertClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signupUser({ email, password }) {
  assertClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role: "student" },
    },
  });

  if (error) throw error;

  if (data.user && data.session) {
    await ensureProfile(data.user);
  }

  return data;
}

export async function logoutUser() {
  assertClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function ensureProfile(user) {
  assertClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;

  let profile = data;

  if (!profile) {
    const { data: inserted, error: insertError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email,
          role: "student",
        },
        { onConflict: "id" }
      )
      .select("id,email,role")
      .single();

    if (insertError) throw insertError;
    profile = inserted;
  }

  if (profile.role === "student") {
    const { error: studentError } = await supabase.from("students").upsert(
      {
        id: user.id,
        email: user.email,
        name: fallbackNameFromEmail(user.email),
      },
      { onConflict: "id" }
    );

    if (studentError) throw studentError;
  }

  return profile;
}

export async function fetchTeacherDashboardData(teacherId) {
  assertClient();

  const { data: classRows, error: classError } = await supabase
    .from("classes")
    .select("id,name,teacher_id")
    .eq("teacher_id", teacherId)
    .order("name", { ascending: true });

  if (classError) throw classError;

  const classes = safeArray(classRows);
  const classIds = classes.map((item) => item.id);

  if (!classIds.length) {
    return {
      classes: [],
      stats: [
        { title: "Total Students", value: "0", trend: "No students enrolled" },
        { title: "Attendance %", value: "0.0%", trend: "No records yet" },
        { title: "Classes Today", value: "0", trend: "No sessions today" },
      ],
      trendData: [0, 0, 0, 0, 0, 0],
      splitData: buildPieSplit([]),
      recentRows: [],
    };
  }

  const [{ data: enrollmentRows, error: enrollmentError }, { data: attendanceRows, error: attendanceError }] =
    await Promise.all([
      supabase
        .from("class_enrollments")
        .select("class_id,student_id,students(id,name,email)")
        .in("class_id", classIds),
      supabase
        .from("attendance")
        .select("id,class_id,student_id,date,status,students(name,email),classes(name)")
        .in("class_id", classIds)
        .order("date", { ascending: false })
        .limit(600),
    ]);

  if (enrollmentError) throw enrollmentError;
  if (attendanceError) throw attendanceError;

  const enrollments = safeArray(enrollmentRows);
  const attendance = safeArray(attendanceRows);

  const uniqueStudents = new Set(enrollments.map((item) => item.student_id));
  const totalRecords = attendance.length;
  const presentRecords = attendance.filter((row) => row.status === "present").length;
  const attendanceRate = totalRecords ? toPercent((presentRecords / totalRecords) * 100) : 0;

  const today = todayIso();
  const todaysAttendance = attendance.filter((row) => row.date === today);
  const todaysClasses = new Set(todaysAttendance.map((row) => row.class_id));

  const classStudentCount = new Map();
  for (const enrollment of enrollments) {
    classStudentCount.set(
      enrollment.class_id,
      (classStudentCount.get(enrollment.class_id) || 0) + 1
    );
  }

  const classesWithCounts = classes.map((klass) => ({
    ...klass,
    studentCount: classStudentCount.get(klass.id) || 0,
  }));

  const recentRows = attendance.slice(0, 12).map((row) => ({
    id: row.id,
    studentRef: row.student_id,
    name: row.students?.name || "Unknown Student",
    className: row.classes?.name || "Unassigned",
    date: formatDisplayDate(row.date),
    status: parseAttendanceStatus(row.status),
    time: "--",
  }));

  return {
    classes: classesWithCounts,
    stats: [
      {
        title: "Total Students",
        value: `${uniqueStudents.size}`,
        trend: `${classes.length} classes linked`,
      },
      {
        title: "Attendance %",
        value: `${attendanceRate}%`,
        trend: `${presentRecords}/${totalRecords} present`,
      },
      {
        title: "Classes Today",
        value: `${todaysClasses.size}`,
        trend: today,
      },
    ],
    trendData: buildLineTrend(attendance),
    splitData: buildPieSplit(todaysAttendance.length ? todaysAttendance : attendance),
    recentRows,
  };
}

export async function fetchClassRoster(classId) {
  assertClient();

  const { data, error } = await supabase
    .from("class_enrollments")
    .select("student_id,students(id,name,email)")
    .eq("class_id", classId)
    .order("student_id", { ascending: true });

  if (error) throw error;

  return safeArray(data)
    .map((item) => ({
      id: item.students?.id || item.student_id,
      name: item.students?.name || "Unknown",
      email: item.students?.email || "-",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchClassAttendanceForDate(classId, date) {
  assertClient();

  const { data, error } = await supabase
    .from("attendance")
    .select("student_id,status")
    .eq("class_id", classId)
    .eq("date", date);

  if (error) throw error;

  const draft = {};
  for (const row of safeArray(data)) {
    draft[row.student_id] = row.status;
  }
  return draft;
}

export async function saveClassAttendance({ classId, date, statusByStudent, teacherId }) {
  assertClient();

  const records = Object.entries(statusByStudent)
    .filter(([, status]) => ["present", "late", "absent"].includes(status))
    .map(([studentId, status]) => ({
      class_id: classId,
      student_id: studentId,
      date,
      status,
      marked_by: teacherId,
    }));

  if (!records.length) return 0;

  const { error } = await supabase
    .from("attendance")
    .upsert(records, { onConflict: "student_id,class_id,date" });

  if (error) throw error;
  return records.length;
}

export async function fetchStudentDashboardData(studentId) {
  assertClient();

  const [{ data: attendanceRows, error: attendanceError }, { data: enrollmentRows, error: enrollmentError }] =
    await Promise.all([
      supabase
        .from("attendance")
        .select("id,class_id,date,status,classes(name)")
        .eq("student_id", studentId)
        .order("date", { ascending: false })
        .limit(500),
      supabase
        .from("class_enrollments")
        .select("class_id,classes(name)")
        .eq("student_id", studentId),
    ]);

  if (attendanceError) throw attendanceError;
  if (enrollmentError) throw enrollmentError;

  const attendance = safeArray(attendanceRows);
  const enrollments = safeArray(enrollmentRows);

  const total = attendance.length;
  const present = attendance.filter((row) => row.status === "present").length;
  const percent = total ? toPercent((present / total) * 100) : 0;

  const historyRows = attendance.map((row) => ({
    id: row.id,
    name: "You",
    className: row.classes?.name || "Unassigned",
    date: formatDisplayDate(row.date),
    status: parseAttendanceStatus(row.status),
    time: "--",
  }));

  const classNames = enrollments.map((item) => item.classes?.name).filter(Boolean);

  return {
    stats: [
      { title: "My Attendance", value: `${percent}%`, trend: `${present}/${total} present` },
      { title: "My Classes", value: `${classNames.length}`, trend: classNames.slice(0, 2).join(", ") || "-" },
      { title: "Records", value: `${total}`, trend: "All attendance entries" },
    ],
    trendData: buildLineTrend(attendance),
    splitData: buildPieSplit(attendance),
    historyRows,
  };
}
