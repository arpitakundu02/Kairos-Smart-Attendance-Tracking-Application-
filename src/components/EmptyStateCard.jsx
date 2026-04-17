export function EmptyStateCard({
  title,
  message,
  ctaLabel = "Join Class",
  ctaHint = "Contact your teacher or admin to get enrolled.",
  onCtaClick,
}) {
  return (
    <section className="glass-panel empty-state-card panel-interactive">
      <div className="empty-orb" aria-hidden="true" />
      <p className="empty-title">{title}</p>
      <p className="empty-message">{message}</p>
      <button type="button" className="empty-cta-btn" onClick={onCtaClick}>
        {ctaLabel}
      </button>
      <p className="empty-hint">{ctaHint}</p>
    </section>
  );
}
