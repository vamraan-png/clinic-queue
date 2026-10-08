import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/http";

import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";

export default function ChangePasswordPage({ onDone }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword })
      });

      // refresh session user in App state
      await onDone?.();

      navigate("/admin", { replace: true });
    } catch (e2) {
      setError(e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Paper sx={{ p: 3, maxWidth: 520 }}>
      <Typography variant="h5" fontWeight={900}>
        Change Password
      </Typography>
      <Typography sx={{ color: "text.secondary", mt: 0.5 }}>
        For security, please set a new password to continue.
      </Typography>

      <Box component="form" onSubmit={submit} sx={{ display: "grid", gap: 2, mt: 3 }}>
        <TextField
          label="Current Password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />

        <TextField
          label="New Password (min 10 chars)"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        {error ? <Alert severity="error">{error}</Alert> : null}

        <Button type="submit" variant="contained" disabled={busy}>
          {busy ? "Saving..." : "Update Password"}
        </Button>
      </Box>
    </Paper>
  );
}