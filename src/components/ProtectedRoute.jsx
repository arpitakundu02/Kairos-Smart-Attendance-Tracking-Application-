import { Navigate } from "react-router-dom";

export function ProtectedRoute({ session, profile, allowedRole, children }) {
  if (!session) return <Navigate to="/auth" replace />;
  if (!profile) return <Navigate to="/auth" replace />;
  if (profile.role !== allowedRole) {
    return <Navigate to={profile.role === "teacher" ? "/teacher" : "/student"} replace />;
  }
  return children;
}
