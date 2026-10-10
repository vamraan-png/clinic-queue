import { useEffect, useState } from "react";
import { apiFetch } from "../api/http";

export default function AuditLogsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAuditLogs() {
      try {
        const data = await apiFetch("/api/audit-logs?limit=100");
        setEvents(data.events || []);
      } catch (err) {
        setError(err.message || "Could not load audit logs.");
      } finally {
        setLoading(false);
      }
    }

    loadAuditLogs();
  }, []);

  if (loading) {
    return <div style={{ padding: 24 }}>Loading audit logs...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 24, color: "crimson" }}>
        Failed to load audit logs: {error}
      </div>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Audit Logs</h1>
      <p>Recent activity recorded by the clinic system.</p>

      {events.length === 0 ? (
        <p>No audit events found.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Time", "User", "Role", "Action", "Entity", "Date"].map(
                  (heading) => (
                    <th key={heading} style={cellStyle}>
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event._id}>
                  <td style={cellStyle}>
                    {event.createdAt
                      ? new Date(event.createdAt).toLocaleString()
                      : "—"}
                  </td>
                  <td style={cellStyle}>{event.actorEmail || "System"}</td>
                  <td style={cellStyle}>{event.actorRole || "—"}</td>
                  <td style={cellStyle}>{event.action}</td>
                  <td style={cellStyle}>{event.entityType}</td>
                  <td style={cellStyle}>{event.dateKey || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        type="button"
        onClick={() => window.location.reload()}
        style={{ marginTop: 20, padding: "10px 16px", cursor: "pointer" }}
      >
        Refresh Logs
      </button>
    </main>
  );
}

const cellStyle = {
  padding: 12,
  borderBottom: "1px solid #ddd",
  textAlign: "left",
  whiteSpace: "nowrap",
};