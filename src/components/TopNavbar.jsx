function ThemeIcon({ dark }) {
  if (dark) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5.25a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75Zm0 11.5a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-1.5 0v-.75a.75.75 0 0 1 .75-.75ZM6.67 7.73a.75.75 0 0 1 1.06 0l.53.53a.75.75 0 0 1-1.06 1.06l-.53-.53a.75.75 0 0 1 0-1.06Zm9.07 9.07a.75.75 0 0 1 1.06 0l.53.53a.75.75 0 0 1-1.06 1.06l-.53-.53a.75.75 0 0 1 0-1.06ZM5.25 12a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 0 1.5H6a.75.75 0 0 1-.75-.75Zm11.5 0a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 0 1.5h-.75a.75.75 0 0 1-.75-.75ZM7.2 16.8a.75.75 0 0 1 1.06 0 .75.75 0 0 1 0 1.06l-.53.53a.75.75 0 0 1-1.06-1.06l.53-.53Zm9.6-9.6a.75.75 0 0 1 1.06 0 .75.75 0 0 1 0 1.06l-.53.53a.75.75 0 0 1-1.06-1.06l.53-.53ZM12 8.25a3.75 3.75 0 1 1 0 7.5 3.75 3.75 0 0 1 0-7.5Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14.84 2.36a.75.75 0 0 0-.91.91 8.25 8.25 0 0 1-10.66 10.66.75.75 0 0 0-.91.91 9.75 9.75 0 1 0 12.48-12.48Z" />
    </svg>
  );
}

function getInitials(email) {
  const value = (email || "KAIROS").split("@")[0].trim();
  return value.slice(0, 2).toUpperCase();
}

export function TopNavbar({ dark, onToggleTheme, title, userEmail, roleLabel = "User", onLogout }) {
  return (
    <header className="glass-panel topbar panel-interactive">
      <div>
        <p className="eyebrow">Overview</p>
        <h1>{title}</h1>
      </div>

      <div className="topbar-actions">
        <button
          type="button"
          className="theme-icon-toggle"
          onClick={onToggleTheme}
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          title={dark ? "Light mode" : "Dark mode"}
        >
          <ThemeIcon dark={dark} />
        </button>

        <div className="profile-chip">
          <div className="profile-avatar" aria-hidden="true">
            {getInitials(userEmail)}
          </div>
          <div>
            <p className="profile-name">{userEmail}</p>
            <p className="profile-role">{roleLabel}</p>
          </div>
        </div>

        <button type="button" className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
