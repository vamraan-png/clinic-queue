import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/http";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      onLogin(data.user);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "48px auto", padding: 16 }}>
      <h2 style={{ marginBottom: 8 }}>Clinic Queue Admin</h2>
      <p style={{ marginTop: 0, color: "#555" }}>Login to manage doctors and tokens.</p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </label>

        <label>
          Password
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </label>

        {error ? <div style={{ color: "crimson" }}>{error}</div> : null}

        <button disabled={busy} style={{ padding: 10 }}>
          {busy ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
}