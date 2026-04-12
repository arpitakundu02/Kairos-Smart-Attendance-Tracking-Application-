function buildPolylinePoints(data) {
  const safe = Array.isArray(data) ? data : [];
  if (safe.length === 0) return "0,180 420,180";
  if (safe.length === 1) {
    const y = 190 - (safe[0] / 100) * 170 - 10;
    return `0,${y} 420,${y}`;
  }

  const width = 420;
  const height = 190;
  const min = Math.min(...safe);
  const max = Math.max(...safe);
  const range = max - min || 1;

  return safe
    .map((value, index) => {
      const x = (index / (safe.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 20) - 10;
      return `${x},${y}`;
    })
    .join(" ");
}

export function LineChartCard({ title, subtitle, data }) {
  const points = buildPolylinePoints(data);

  return (
    <article className="glass-panel chart-card line-chart-card panel-interactive">
      <div className="card-head">
        <p className="card-label">{title}</p>
        <p className="card-meta">{subtitle}</p>
      </div>

      <div className="line-chart-wrap" role="img" aria-label="Attendance trend line chart">
        <svg viewBox="0 0 420 190" className="line-chart" preserveAspectRatio="none">
          <polyline className="line-grid" points="0,170 420,170" />
          <polyline className="line-grid" points="0,120 420,120" />
          <polyline className="line-grid" points="0,70 420,70" />
          <polyline className="line-path" points={points} />
        </svg>
      </div>
    </article>
  );
}
