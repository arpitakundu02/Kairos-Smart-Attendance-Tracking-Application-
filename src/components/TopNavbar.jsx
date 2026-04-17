function getInitials(email) {
  const value = (email || "KAIROS").split("@")[0].trim();
  return value.slice(0, 2).toUpperCase();
}

export function TopNavbar({ title, userEmail, roleLabel = "User", onLogout }) {
  return (
    <header className="glass-panel topbar panel-interactive">
      <div>
        <p className="eyebrow">Overview</p>
        <h1>{title}</h1>
      </div>

      <div className="topbar-actions">
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
