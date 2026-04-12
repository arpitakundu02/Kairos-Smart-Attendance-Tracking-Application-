const defaultColumns = [
  { key: "id", header: "Student ID" },
  { key: "name", header: "Name" },
  { key: "className", header: "Class" },
  { key: "date", header: "Date" },
  { key: "status", header: "Status" },
  { key: "time", header: "Time" },
];

function statusClass(status) {
  const normalized = status.toLowerCase();
  if (normalized === "present") return "status-present";
  if (normalized === "late") return "status-late";
  return "status-absent";
}

function renderCell(row, columnKey) {
  if (columnKey === "status") {
    return <span className={`status-pill ${statusClass(row.status)}`}>{row.status}</span>;
  }

  return row[columnKey];
}

export function AttendanceTable({ title, rows, columns = defaultColumns }) {
  return (
    <section className="glass-panel table-card panel-interactive">
      <div className="card-head">
        <p className="card-label">{title}</p>
        <p className="card-meta">Latest check-ins</p>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {columns.map((column) => (
                  <td key={`${row.id}-${column.key}`}>{renderCell(row, column.key)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
