export function ClassManagement({ classes, activeClassId, onSelectClass, students, loading }) {
  return (
    <section className="classes-layout">
      <article className="glass-panel classes-list panel-interactive">
        <div className="card-head">
          <p className="card-label">Your Classes</p>
          <p className="card-meta">{classes.length} total</p>
        </div>

        <div className="class-grid">
          {classes.map((klass) => (
            <button
              type="button"
              key={klass.id}
              className={`class-item ${activeClassId === klass.id ? "active" : ""}`}
              onClick={() => onSelectClass(klass.id)}
            >
              <span>{klass.name}</span>
              <small>{klass.studentCount} students</small>
            </button>
          ))}
        </div>
      </article>

      <article className="glass-panel class-students panel-interactive">
        <div className="card-head">
          <p className="card-label">Students In Selected Class</p>
          <p className="card-meta">{students.length} roster</p>
        </div>

        {loading ? (
          <p className="card-meta">Loading students...</p>
        ) : students.length ? (
          <ul className="student-list">
            {students.map((student) => (
              <li key={student.id}>
                <strong>{student.name}</strong>
                <span>{student.email}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="card-meta">No students enrolled in this class.</p>
        )}
      </article>
    </section>
  );
}
