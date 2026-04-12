function buildPieGradient(segments) {
  const safe = Array.isArray(segments) ? segments : [];
  const total = safe.reduce((sum, segment) => sum + Number(segment.value || 0), 0);

  if (!total) {
    return "conic-gradient(#7a8ca8 0% 100%)";
  }

  let cursor = 0;

  const slices = safe.map((segment) => {
    const start = cursor;
    const amount = (Number(segment.value || 0) / total) * 100;
    cursor += amount;
    return `${segment.color} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`;
  });

  return `conic-gradient(${slices.join(", ")})`;
}

export function PieChartCard({ title, subtitle, segments }) {
  const gradient = buildPieGradient(segments);
  const safeSegments = Array.isArray(segments) ? segments : [];

  return (
    <article className="glass-panel chart-card pie-chart-card panel-interactive">
      <div className="card-head">
        <p className="card-label">{title}</p>
        <p className="card-meta">{subtitle}</p>
      </div>

      <div className="pie-layout">
        <div className="pie-chart" style={{ background: gradient }} aria-hidden="true" />

        <ul className="pie-legend">
          {safeSegments.map((segment) => (
            <li key={segment.label}>
              <span style={{ backgroundColor: segment.color }} className="legend-dot" />
              <span className="legend-label">{segment.label}</span>
              <span className="legend-value">{segment.value}%</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
