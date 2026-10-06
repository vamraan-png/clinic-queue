import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage.jsx";
import AdminHome from "./pages/AdminHome.jsx";
import DoctorQueuePage from "./pages/DoctorQueuePage.jsx";
import TokenStatusPage from "./pages/TokenStatusPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { apiFetch } from "./api/http.js";

function App() {
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
            <AdminHome user={user} onLogout={() => setUser(null)} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/doctors/:doctorId"
        element={
          <ProtectedRoute user={user}>
            <DoctorQueuePage />
          </ProtectedRoute>
        }
      />

      {/* Patient tracking */}
      <Route path="/t/:publicId" element={<TokenStatusPage />} />

      <Route path="*" element={<div style={{ padding: 18 }}>Not Found</div>} />
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);