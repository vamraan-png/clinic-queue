import { Navigate, useLocation } from "react-router-dom";

export default function ForcePasswordChange({ user, children }) {
  const location = useLocation();

  if (!user) return children;

  const isOnChangePasswordPage = location.pathname === "/admin/change-password";

  if (user.mustChangePassword && !isOnChangePasswordPage) {
    return <Navigate to="/admin/change-password" replace />;
  }

  return children;
}