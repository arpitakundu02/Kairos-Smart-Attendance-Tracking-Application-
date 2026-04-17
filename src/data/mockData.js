export const mockTeacherDashboard = {
  classes: [
    { id: "mock-class-1", name: "Physics Lab A", studentCount: 28 },
    { id: "mock-class-2", name: "Math Core B", studentCount: 24 },
  ],
  stats: [
    { title: "Total Students", value: "52", trend: "2 active classes" },
    { title: "Attendance %", value: "93.2%", trend: "97/104 present" },
    { title: "Classes Today", value: "2", trend: "Mon, Apr 12" },
  ],
  trendData: [84, 88, 90, 87, 91, 93, 94, 92, 95, 96, 94, 97],
  splitData: [
    { label: "Present", value: 78, color: "#6be5b3" },
    { label: "Late", value: 14, color: "#ffcf66" },
    { label: "Absent", value: 8, color: "#ff8f94" },
  ],
  recentRows: [
    {
      id: "mock-att-1",
      studentRef: "STU-1001",
      name: "Arjun Sharma",
      className: "Physics Lab A",
      date: "Apr 12, 2026",
      status: "Present",
      time: "--",
    },
    {
      id: "mock-att-2",
      studentRef: "STU-1002",
      name: "Riya Kapoor",
      className: "Math Core B",
      date: "Apr 12, 2026",
      status: "Late",
      time: "--",
    },
  ],
};

export const mockStudentDashboard = {
  stats: [
    { title: "My Attendance", value: "95.0%", trend: "19/20 present" },
    { title: "My Classes", value: "3", trend: "Physics Lab A, Math Core B" },
    { title: "Records", value: "20", trend: "Preview data mode" },
  ],
  trendData: [86, 88, 90, 89, 91, 93, 95, 96, 94, 97, 96, 98],
  splitData: [
    { label: "Present", value: 80, color: "#6be5b3" },
    { label: "Late", value: 15, color: "#ffcf66" },
    { label: "Absent", value: 5, color: "#ff8f94" },
  ],
  historyRows: [
    {
      id: "mock-stu-1",
      name: "You",
      className: "Physics Lab A",
      date: "Apr 12, 2026",
      status: "Present",
      time: "--",
    },
    {
      id: "mock-stu-2",
      name: "You",
      className: "Math Core B",
      date: "Apr 11, 2026",
      status: "Late",
      time: "--",
    },
  ],
};
