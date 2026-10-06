import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { displayToken } from "../api/format";

export default function TokenStatusPage() {
  const { publicId } = useParams();
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState("");

  const tokenText = useMemo(() => {
    if (!payload) return "";
    return displayToken(payload.doctor.code, payload.token.tokenNumber);
  }, [payload]);

  useEffect(() => {
    setError("");
    setPayload(null);

    const es = new EventSource(`/api/public/tokens/${publicId}/stream`);

    es.addEventListener("token", (event) => {
      const data = JSON.parse(event.data);
      setPayload(data);
    });

    es.addEventListener("error", () => {
      setError("Unable to load token status (connection error).");
    });

    return () => {
      es.close();
    };
  }, [publicId]);

  return (
    <div style={{ maxWidth: 720, margin: "28px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Link to="/">Home</Link>
        <div style={{ color: "#777" }}>Live Status</div>
      </div>

      <h2 style={{ marginBottom: 6 }}>Token Status</h2>

      {error ? <div style={{ color: "crimson" }}>{error}</div> : null}

      {!payload ? (
        <div style={{ marginTop: 14 }}>Loading...</div>
      ) : (
        <div style={{ marginTop: 14, border: "1px solid #ddd", borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{tokenText}</div>
          <div style={{ marginTop: 6, color: "#555" }}>
            Doctor: {payload.doctor.name}
          </div>

          <hr style={{ margin: "14px 0" }} />

          <div>
            <div>
              <strong>Status:</strong> {payload.token.status}
            </div>

            {payload.token.status === "WAITING" ? (
              <div style={{ marginTop: 8 }}>
                <strong>Your position:</strong> {payload.position ?? "-"}
              </div>
            ) : null}

            {payload.token.status === "CALLED" ? (
              <div style={{ marginTop: 10, padding: 10, background: "#f6ffed", border: "1px solid #b7eb8f" }}>
                Your token is called. Please proceed to the doctor.
              </div>
            ) : null}

            {payload.token.status === "SERVED" ? (
              <div style={{ marginTop: 10, padding: 10, background: "#f0f5ff", border: "1px solid #adc6ff" }}>
                Consultation completed. Thank you.
              </div>
            ) : null}

            {payload.token.status === "SKIPPED" ? (
              <div style={{ marginTop: 10, padding: 10, background: "#fff7e6", border: "1px solid #ffd591" }}>
                You were skipped. Please contact reception.
              </div>
            ) : null}

            {payload.token.status === "CANCELLED" ? (
              <div style={{ marginTop: 10, padding: 10, background: "#fff1f0", border: "1px solid #ffa39e" }}>
                This token was cancelled.
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}