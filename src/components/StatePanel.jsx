export function StatePanel({ title, description, kind = "info" }) {
  return (
    <section className={`glass-panel state-panel state-${kind}`}>
      <p className="state-title">{title}</p>
      {description ? <p className="state-description">{description}</p> : null}
    </section>
  );
}
