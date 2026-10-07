import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { apiFetch } from "./api/http";

import LoginPage from "./pages/LoginPage";
import AdminHome from "./pages/AdminHome";
import DoctorQueuePage from "./pages/DoctorQueuePage";
import TokenStatusPage from "./pages/TokenStatusPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import UsersPage from "./pages/UsersPage";
import DisplayScreenPage from "./pages/DisplayScreenPage";

export default function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    apiFetch("/api/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />

      <Route path="/login" element={<LoginPage onLogin={setUser} />} />

      <Route
  path="/admin"
  element={
    <ProtectedRoute user={user}>
      <AdminLayout user={user} onLogout={() => setUser(null)} />
    </ProtectedRoute>
  }
>
  <Route index element={<AdminHome user={user} onLogout={() => setUser(null)} />} />
  <Route path="doctors/:doctorId" element={<DoctorQueuePage />} />

  {/* OWNER only link is shown in UI; backend still enforces security */}
  <Route path="users" element={<UsersPage />} />
</Route>

      <Route
        path="/admin/doctors/:doctorId"
        element={
          <ProtectedRoute user={user}>
            <DoctorQueuePage />
          </ProtectedRoute>
        }
      />

      <Route path="/t/:publicId" element={<TokenStatusPage />} />
      <Route path="/display" element={<DisplayScreenPage />} />

      <Route path="*" element={<div style={{ padding: 18 }}>Not Found</div>} />
    </Routes>
  );
}