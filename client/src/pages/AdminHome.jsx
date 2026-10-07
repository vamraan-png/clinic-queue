import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/http";

export default function AdminHome({ user, onLogout }) {
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState("");

  <a href="/display" target="_blank" rel="noreferrer">
  Open Display Screen
</a>

  // Create doctor form (OWNER only)
  const [docName, setDocName] = useState("");
  const [docCode, setDocCode] = useState("");
  const [busy, setBusy] = useState(false);

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

  async function createDoctor(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await apiFetch("/api/admin/doctors", {
        method: "POST",
        body: JSON.stringify({ name: docName, code: docCode })
      });
      setDocName("");
      setDocCode("");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
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

      {user?.role === "OWNER" ? (
        <>
          <h3 style={{ marginBottom: 10 }}>Create Doctor</h3>
          <form onSubmit={createDoctor} style={{ display: "grid", gap: 10, maxWidth: 520 }}>
            <label>
              Doctor Name
              <input
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                required
                style={{ width: "100%", padding: 10, marginTop: 6 }}
              />
            </label>

            <label>
              Code (unique, e.g. A, ENT1)
              <input
                value={docCode}
                onChange={(e) => setDocCode(e.target.value)}
                required
                style={{ width: "100%", padding: 10, marginTop: 6 }}
              />
            </label>

            <button disabled={busy} style={{ padding: 10 }}>
              {busy ? "Creating..." : "Create Doctor"}
            </button>
          </form>

          <hr style={{ margin: "18px 0" }} />
        </>
      ) : null}

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
              <div style={{ color: "#555" }}>
                Code: {d.code} {d.isActive ? "" : "(inactive)"}
              </div>
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