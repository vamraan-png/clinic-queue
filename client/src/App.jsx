import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { apiFetch } from "./api/http";

import LoginPage from "./pages/LoginPage";
import DoctorQueuePage from "./pages/DoctorQueuePage";
import TokenStatusPage from "./pages/TokenStatusPage";
import DisplayScreenPage from "./pages/DisplayScreenPage";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import DoctorsPage from "./pages/DoctorsPage";
import UsersPage from "./pages/UsersPage";
import RequireOwner from "./components/RequireOwner";

import ChangePasswordPage from "./pages/ChangePasswordPage";
import ForcePasswordChange from "./components/ForcePasswordChange";
import PrintTokenPage from "./pages/PrintTokenPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ReportsPage from "./pages/ReportsPage";
import AuditLogsPage from "./pages/AuditLogsPage";

function HomeRedirect({ user }) {
  if (user === undefined) {
    return <div style={{ padding: 18 }}>Loading...</div>;
  }

  return <Navigate to={user ? "/admin" : "/login"} replace />;
}

export default function App() {
  const [user, setUser] = useState(undefined);

  async function refreshMe() {
    const data = await apiFetch("/api/auth/me");
    setUser(data.user);
  }

  useEffect(() => {
    refreshMe().catch(() => setUser(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Routes>
      <Route path="/" element={<HomeRedirect user={user} />} />

      <Route
        path="/login"
        element={<LoginPage onLogin={setUser} />}
      />

      {/* Public routes */}
      <Route path="/t/:publicId" element={<TokenStatusPage />} />
      <Route path="/display" element={<DisplayScreenPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute user={user}>
            <ForcePasswordChange user={user}>
              <AdminLayout
                user={user}
                onLogout={() => setUser(null)}
              />
            </ForcePasswordChange>
          </ProtectedRoute>
        }
      >
        <Route index element={<DoctorsPage user={user} />} />

        <Route
          path="doctors/:doctorId"
          element={<DoctorQueuePage />}
        />

        <Route
          path="users"
          element={
            <RequireOwner user={user}>
              <UsersPage />
            </RequireOwner>
          }
        />

        {/* Reports — owner only */}
        <Route
          path="reports"
          element={
            <RequireOwner user={user}>
              <ReportsPage />
            </RequireOwner>
          }
        />

        {/* Audit Logs — owner only */}
        <Route
          path="audit-logs"
          element={
            <RequireOwner user={user}>
              <AuditLogsPage />
            </RequireOwner>
          }
        />

        <Route
          path="change-password"
          element={<ChangePasswordPage onDone={refreshMe} />}
        />

        <Route
          path="print/:tokenId"
          element={<PrintTokenPage />}
        />
      </Route>

      {/* Not found */}
      <Route
        path="*"
        element={<div style={{ padding: 18 }}>Not Found</div>}
      />
    </Routes>
  );
}