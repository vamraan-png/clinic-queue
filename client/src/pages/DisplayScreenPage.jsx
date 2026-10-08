import { useEffect, useMemo, useState } from "react";
import { displayToken } from "../api/format";

function DoctorCard({ row }) {
  const { doctor, nowServing, upNext, waitingCount } = row;

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        background: "white",
        padding: 18,
        display: "grid",
        gap: 10
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{doctor.name}</div>
          <div style={{ color: "#6b7280" }}>Code: {doctor.code}</div>
        </div>
        <div style={{ color: "#6b7280" }}>
          Waiting: <strong style={{ color: "#111827" }}>{waitingCount}</strong>
        </div>
      </div>

      <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
        <div style={{ color: "#6b7280", fontWeight: 700, letterSpacing: 0.3 }}>NOW SERVING</div>
        <div style={{ fontSize: 44, fontWeight: 900, marginTop: 6, lineHeight: 1.05 }}>
          {nowServing ? displayToken(doctor.code, nowServing) : "—"}
        </div>
      </div>

      <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
        <div style={{ color: "#6b7280", fontWeight: 700, letterSpacing: 0.3 }}>UP NEXT</div>

        {upNext.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
            {upNext.map((n) => (
              <div
                key={n}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: "1px solid #e5e7eb",
                  fontWeight: 800,
                  fontSize: 18
                }}
              >
                {displayToken(doctor.code, n)}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ marginTop: 8, color: "#6b7280" }}>No waiting tokens.</div>
        )}
      </div>
    </div>
  );
}

export default function DisplayScreenPage() {
  const [payload, setPayload] = useState(null);
  const [status, setStatus] = useState("connecting"); // connecting | live | error

  const title = useMemo(() => {
    if (!payload) return "Clinic Queue Display";
    return `Clinic Queue Display — ${payload.dateKey}`;
  }, [payload]);

  useEffect(() => {
    document.title = title;
  }, [title]);

  useEffect(() => {
    setStatus("connecting");
    setPayload(null);

    const es = new EventSource("/api/public/display/stream");

    es.addEventListener("display", (event) => {
      const data = JSON.parse(event.data);
      setPayload(data);
      setStatus("live");
    });

    es.addEventListener("error", () => {
      setStatus("error");
      // Browser will auto-retry EventSource, so we just show status.
    });

    return () => es.close();
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 900 }}>Now Serving</div>
          <div style={{ color: "#6b7280" }}>
            {payload?.dateKey ? `Date: ${payload.dateKey}` : "Loading..."}
          </div>
        </div>

        <div style={{ color: status === "live" ? "#166534" : status === "connecting" ? "#92400e" : "#991b1b", fontWeight: 800 }}>
          {status === "live" ? "LIVE" : status === "connecting" ? "CONNECTING" : "RECONNECTING"}
        </div>
      </div>

      <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        {(payload?.doctors || []).map((row) => (
          <DoctorCard key={row.doctor.id} row={row} />
        ))}
      </div>

      {!payload ? (
        <div style={{ marginTop: 18, color: "#6b7280" }}>Waiting for data…</div>
      ) : null}
    </div>
  );
}