const options = [
  { label: "Present", value: "present", className: "pick-present" },
  { label: "Late", value: "late", className: "pick-late" },
  { label: "Absent", value: "absent", className: "pick-absent" },
];

export function TeacherAttendanceManager({
  classes,
  selectedClassId,
  onSelectClass,
  selectedDate,
  onChangeDate,
  students,
  statusDraft,
  onPickStatus,
  onSave,
  isSaving,
  isLoading,
}) {
  return (
    <section className="glass-panel attendance-manager panel-interactive">
      <div className="card-head">
        <p className="card-label">Mark Attendance</p>
        <p className="card-meta">Save by class and date</p>
      </div>

      <div className="attendance-toolbar">
        <label>
          Class
          <select
            value={selectedClassId || ""}
            onChange={(event) => onSelectClass(event.target.value)}
          >
            <option value="" disabled>
              Select a class
            </option>
            {classes.map((klass) => (
              <option key={klass.id} value={klass.id}>
                {klass.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Date
          <input type="date" value={selectedDate} onChange={(event) => onChangeDate(event.target.value)} />
        </label>

        <button type="button" className="auth-submit save-btn" onClick={onSave} disabled={isSaving || !students.length}>
          {isSaving ? "Saving..." : "Save Attendance"}
        </button>
      </div>

      {isLoading ? (
        <p className="card-meta">Loading class roster...</p>
      ) : students.length ? (
        <div className="marking-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>{student.email}</td>
                  <td>
                    <div className="status-picker">
                      {options.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`status-choice ${option.className} ${
                            statusDraft[student.id] === option.value ? "active" : ""
                          }`}
                          onClick={() => onPickStatus(student.id, option.value)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="card-meta">No students to mark yet for this class.</p>
      )}
    </section>
  );
}
