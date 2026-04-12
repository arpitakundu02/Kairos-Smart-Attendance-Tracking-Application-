export function StatCard({ title, value, trend }) {
  return (
    <article className="glass-panel stat-card panel-interactive">
      <p className="card-label">{title}</p>
      <p className="card-value">{value}</p>
      <p className="card-meta">{trend}</p>
    </article>
  );
}
