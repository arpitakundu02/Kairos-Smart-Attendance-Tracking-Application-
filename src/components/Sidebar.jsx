export function Sidebar({ items, activeItem, onSelect }) {
  return (
    <aside className="glass-panel sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark">K</span>
        <div>
          <p className="brand-name">Kairos</p>
          <p className="brand-tag">Smart Attendance</p>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Primary">
        {items.map((item) => {
          const isActive = activeItem === item;
          return (
            <button
              key={item}
              type="button"
              className={`nav-item ${isActive ? "active" : ""}`}
              onClick={() => onSelect(item)}
            >
              <span>{item}</span>
              {isActive && <span className="nav-indicator" aria-hidden="true" />}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
