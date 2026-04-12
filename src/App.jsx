import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { AuthPage } from "./components/AuthPage";
import { DashboardView } from "./components/DashboardView";
import { StudentDashboard } from "./components/StudentDashboard";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { StatePanel } from "./components/StatePanel";
import { ensureProfile, logoutUser } from "./lib/dataApi";
import { hasSupabaseEnv, supabase } from "./lib/supabase";

function pathByRole(role) {
  return role === "teacher" ? "/teacher" : "/student";
}

function LoadingShell() {
  return (
    <div className="auth-shell">
      <section className="glass-panel auth-card loading-card">
        <p className="auth-title">Loading your workspace...</p>
      </section>
    </div>
  );
}

export default function App() {
  const [dark, setDark] = useState(() => {
    const savedTheme = window.localStorage.getItem("kairos-theme");
    if (savedTheme === "light") return false;
    if (savedTheme === "dark") return true;
    return true;
  });

  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    window.localStorage.setItem("kairos-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    if (!hasSupabaseEnv || !supabase) {
      setAuthLoading(false);
      return;
    }

    let mounted = true;

    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session ?? null);
      setAuthLoading(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const currentUser = session?.user;

    if (!currentUser) {
      setProfile(null);
      setProfileLoading(false);
      setProfileError("");
      return;
    }

    let mounted = true;

    async function loadProfile() {
      setProfileLoading(true);
      setProfileError("");

      try {
        const nextProfile = await ensureProfile(currentUser);
        if (!mounted) return;
        setProfile(nextProfile);
      } catch (error) {
        if (!mounted) return;
        setProfileError(error.message || "Unable to load your profile.");
      } finally {
        if (mounted) setProfileLoading(false);
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [session?.user]);

  async function handleLogout() {
    try {
      await logoutUser();
    } catch {
      setProfile(null);
      setSession(null);
    }
  }

  const shouldShowLoading = authLoading || (!!session && profileLoading);
  const hasAuthenticatedProfile = !!session && !!profile;

  return (
    <div className={`app ${dark ? "theme-dark" : "theme-light"}`}>
      <div className="video-shell w-full h-screen">
        <video autoPlay loop muted playsInline className="video-bg" aria-hidden="true">
          <source src="/bg.mp4" type="video/mp4" />
        </video>

        <div className="video-overlay" />

        <div className="app-content">
          {shouldShowLoading ? (
            <LoadingShell />
          ) : profileError ? (
            <div className="auth-shell">
              <StatePanel kind="error" title="Profile Error" description={profileError} />
            </div>
          ) : (
            <Routes>
              <Route
                path="/auth"
                element={hasAuthenticatedProfile ? <Navigate to={pathByRole(profile.role)} replace /> : <AuthPage />}
              />

              <Route
                path="/teacher"
                element={
                  <ProtectedRoute session={session} profile={profile} allowedRole="teacher">
                    <DashboardView
                      dark={dark}
                      onToggleTheme={() => setDark((current) => !current)}
                      user={session?.user}
                      onLogout={handleLogout}
                    />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/student"
                element={
                  <ProtectedRoute session={session} profile={profile} allowedRole="student">
                    <StudentDashboard
                      dark={dark}
                      onToggleTheme={() => setDark((current) => !current)}
                      user={session?.user}
                      onLogout={handleLogout}
                    />
                  </ProtectedRoute>
                }
              />

              <Route
                path="*"
                element={
                  hasAuthenticatedProfile ? (
                    <Navigate to={pathByRole(profile.role)} replace />
                  ) : (
                    <Navigate to="/auth" replace />
                  )
                }
              />
            </Routes>
          )}
        </div>
      </div>
    </div>
  );
}
