import { useMemo, useState } from "react";
import { hasSupabaseEnv, supabaseEnvError } from "../lib/supabase";
import { loginUser, signupUser } from "../lib/dataApi";

export function AuthPage() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const isLogin = mode === "login";

  const ctaLabel = useMemo(() => {
    if (isSubmitting) return "Please wait...";
    return isLogin ? "Login" : "Create account";
  }, [isLogin, isSubmitting]);

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setStatusMessage("");

    if (!hasSupabaseEnv) {
      setErrorMessage(supabaseEnvError);
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLogin) {
        await loginUser({ email, password });
      } else {
        const data = await signupUser({ email, password });
        if (!data.session) {
          setStatusMessage(
            "Signup successful. Check your email to verify your account, then login."
          );
        }
      }
    } catch (error) {
      setErrorMessage(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <section className="glass-panel auth-card auth-hero panel-interactive">
        <p className="eyebrow">Kairos</p>
        <h1 className="auth-title">Smart Attendance System</h1>
        <p className="auth-subtitle">
          {isLogin
            ? "Sign in to access your attendance dashboard."
            : "Create your account to start managing attendance."}
        </p>

        <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            role="tab"
            aria-selected={isLogin}
            className={`auth-tab ${isLogin ? "active" : ""}`}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isLogin}
            className={`auth-tab ${!isLogin ? "active" : ""}`}
            onClick={() => setMode("signup")}
          >
            Signup
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              required
              minLength={6}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </label>

          {!isLogin && (
            <label>
              Confirm Password
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm password"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </label>
          )}

          {statusMessage ? <p className="auth-status">{statusMessage}</p> : null}
          {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

          <button type="submit" className="auth-submit" disabled={isSubmitting}>
            {ctaLabel}
          </button>
        </form>
      </section>
    </div>
  );
}
