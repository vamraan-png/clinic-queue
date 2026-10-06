import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiFetch } from "../api/http";
import { displayToken } from "../api/format";

export default function DoctorQueuePage() {
  const { doctorId } = useParams();

  const [doctor, setDoctor] = useState(null);
  const [dateKey, setDateKey] = useState("");
  const [tokens, setTokens] = useState([]);

  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [createdInfo, setCreatedInfo] = useState(null);

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const calledToken = useMemo(
    () => tokens.find((t) => t.status === "CALLED") || null,
    [tokens]
  );

  async function loadQueue() {
    setError("");
    const data = await apiFetch(`/api/admin/doctors/${doctorId}/queue`);
    setDoctor(data.doctor);
    setDateKey(data.dateKey);
    setTokens(data.tokens);
  }

  useEffect(() => {
    loadQueue().catch((e) => setError(e.message));
  }, [doctorId]);

  async function createToken(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setCreatedInfo(null);
    try {
      const data = await apiFetch(`/api/admin/doctors/${doctorId}/tokens`, {
        method: "POST",
        body: JSON.stringify({
          patientName,
          patientPhone: patientPhone || undefined
        })
      });

      setCreatedInfo(data.token);
      setPatientName("");
      setPatientPhone("");
      await loadQueue();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setBusy(false);
    }
  }

  async function callNext() {
    setBusy(true);
    setError("");
    try {
      await apiFetch(`/api/admin/doctors/${doctorId}/call-next`, { method: "POST" });
      await loadQueue();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function actionToken(tokenId, action) {
    setBusy(true);
    setError("");
    try {
      await apiFetch(`/api/admin/tokens/${tokenId}/${action}`, { method: "POST" });
      await loadQueue();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!doctor) {
    return (
      <div style={{ maxWidth: 900, margin: "28px auto", padding: 16 }}>
        <Link to="/admin">← Back</Link>
        <div style={{ marginTop: 12 }}>Loading...</div>
        {error ? <div style={{ color: "crimson" }}>{error}</div> : null}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "28px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Link to="/admin">← Back</Link>
          <h2 style={{ margin: "10px 0 4px" }}>{doctor.name} Queue</h2>
          <div style={{ color: "#555" }}>
            Date: {dateKey} | Code: {doctor.code}
          </div>
        </div>

        <button disabled={busy} onClick={callNext} style={{ padding: 10 }}>
          Call Next
        </button>
      </div>

      {error ? <div style={{ color: "crimson", marginTop: 10 }}>{error}</div> : null}

      <hr style={{ margin: "18px 0" }} />

      <h3>Create Token</h3>
      <form onSubmit={createToken} style={{ display: "grid", gap: 10, maxWidth: 520 }}>
        <label>
          Patient Name
          <input
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            required
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </label>

        <label>
          Phone (optional for SMS)
          <input
            value={patientPhone}
            onChange={(e) => setPatientPhone(e.target.value)}
            placeholder="+9198xxxxxx"
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </label>

        <button disabled={busy} style={{ padding: 10 }}>
          {busy ? "Creating..." : "Create Token"}
        </button>
      </form>

      {createdInfo ? (
        <div style={{ marginTop: 12, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
          <div style={{ fontWeight: 700 }}>
            Token Created: {displayToken(createdInfo.doctor.code, createdInfo.tokenNumber)}
          </div>
          <div style={{ marginTop: 6 }}>
            Patient tracking link:{" "}
            <a href={`/t/${createdInfo.publicId}`} target="_blank" rel="noreferrer">
              /t/{createdInfo.publicId}
            </a>
          </div>
        </div>
      ) : null}

      <hr style={{ margin: "18px 0" }} />

      <h3>Currently Called</h3>
      {calledToken ? (
        <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
          <div style={{ fontWeight: 700 }}>
            {displayToken(doctor.code, calledToken.tokenNumber)} — {calledToken.patientName}
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
            <button disabled={busy} onClick={() => actionToken(calledToken._id, "serve")}>
              Mark Served
            </button>
            <button disabled={busy} onClick={() => actionToken(calledToken._id, "skip")}>
              Skip
            </button>
            <button disabled={busy} onClick={() => actionToken(calledToken._id, "cancel")}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div style={{ color: "#555" }}>No token is currently called.</div>
      )}

      <hr style={{ margin: "18px 0" }} />

      <h3>All Tokens</h3>
      <div style={{ display: "grid", gap: 8 }}>
        {tokens.map((t) => (
          <div
            key={t._id}
            style={{
              border: "1px solid #eee",
              borderRadius: 8,
              padding: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>
                {displayToken(doctor.code, t.tokenNumber)} — {t.patientName}
              </div>
              <div style={{ color: "#555" }}>Status: {t.status}</div>
            </div>
            <a href={`/t/${t.publicId}`} target="_blank" rel="noreferrer">
              Track
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}