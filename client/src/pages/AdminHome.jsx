import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/http";

export default function AdminHome({ user, onLogout }) {
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const data = await apiFetch("/api/admin/doctors");
      setDoctors(data.doctors);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    onLogout();
  }

  return (
    <div style={{ maxWidth: 900, margin: "28px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>Admin</h2>
          <div style={{ color: "#555" }}>
            {user?.name} ({user?.role})
          </div>
        </div>
        <button onClick={logout} style={{ padding: 10 }}>Logout</button>
      </div>

      <hr style={{ margin: "18px 0" }} />

      <h3 style={{ marginBottom: 10 }}>Doctors</h3>
      {error ? <div style={{ color: "crimson" }}>{error}</div> : null}

      <div style={{ display: "grid", gap: 10 }}>
        {doctors.map((d) => (
          <div
            key={d._id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{d.name}</div>
              <div style={{ color: "#555" }}>Code: {d.code} {d.isActive ? "" : "(inactive)"}</div>
            </div>
            <Link to={`/admin/doctors/${d._id}`} style={{ textDecoration: "none" }}>
              Open Queue →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}