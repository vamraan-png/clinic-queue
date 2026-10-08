import { useState } from "react";
import { useNavigate, useParams, Link as RouterLink } from "react-router-dom";
import { apiFetch } from "../api/http";

import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword })
      });

      navigate("/login", { replace: true });
    } catch (e2) {
      setError(e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={900}>
          Reset Password
        </Typography>
        <Typography sx={{ color: "text.secondary", mt: 0.5 }}>
          Set a new password for your account.
        </Typography>

        <Box component="form" onSubmit={submit} sx={{ mt: 3, display: "grid", gap: 2 }}>
          <TextField
            label="New Password (min 10 chars)"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          {error ? <Alert severity="error">{error}</Alert> : null}

          <Button type="submit" variant="contained" disabled={busy}>
            {busy ? "Updating..." : "Update Password"}
          </Button>

          <Link component={RouterLink} to="/login" underline="hover">
            Back to login
          </Link>
        </Box>
      </Paper>
    </Container>
  );
}