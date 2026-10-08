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
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/login" element={<LoginPage onLogin={setUser} />} />

      {/* Public */}
      <Route path="/t/:publicId" element={<TokenStatusPage />} />
      <Route path="/display" element={<DisplayScreenPage />} />

      {/* Admin */}
      <Route path="/admin" element={
  <ProtectedRoute user={user}>
    <ForcePasswordChange user={user}>
      <AdminLayout user={user} onLogout={() => setUser(null)} />
    </ForcePasswordChange>
  </ProtectedRoute>
}>
  <Route index element={<DoctorsPage user={user} />} />
  <Route path="doctors/:doctorId" element={<DoctorQueuePage />} />

  <Route
    path="users"
    element={
      <RequireOwner user={user}>
        <UsersPage />
      </RequireOwner>
    }
  />

  <Route path="change-password" element={<ChangePasswordPage onDone={refreshMe} />} />

  {/* ADD THIS */}
  <Route path="print/:tokenId" element={<PrintTokenPage />} />
</Route>

      <Route path="*" element={<div style={{ padding: 18 }}>Not Found</div>} />
    </Routes>
  );
}