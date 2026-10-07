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

      {/* Public pages */}
      <Route path="/t/:publicId" element={<TokenStatusPage />} />
      <Route path="/display" element={<DisplayScreenPage />} />

      {/* Admin area */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute user={user}>
            <AdminLayout user={user} onLogout={() => setUser(null)} />
          </ProtectedRoute>
        }
      >
        {/* /admin */}
        <Route index element={<DoctorsPage user={user} />} />

        {/* /admin/doctors/:doctorId */}
        <Route path="doctors/:doctorId" element={<DoctorQueuePage />} />

        {/* /admin/users (OWNER only) */}
        <Route
          path="users"
          element={
            <RequireOwner user={user}>
              <UsersPage />
            </RequireOwner>
          }
        />
      </Route>

      <Route path="*" element={<div style={{ padding: 18 }}>Not Found</div>} />
    </Routes>
  );
}