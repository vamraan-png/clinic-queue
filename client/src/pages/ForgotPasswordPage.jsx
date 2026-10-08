import { useState } from "react";
import { apiFetch } from "../api/http";
import { Link as RouterLink } from "react-router-dom";

import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email })
      });
      setDone(true);
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
          Forgot Password
        </Typography>
        <Typography sx={{ color: "text.secondary", mt: 0.5 }}>
          Enter your email and we will send a reset link.
        </Typography>

        <Box component="form" onSubmit={submit} sx={{ mt: 3, display: "grid", gap: 2 }}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {error ? <Alert severity="error">{error}</Alert> : null}
          {done ? (
            <Alert severity="success">
              If this email exists, a reset link has been sent.
            </Alert>
          ) : null}

          <Button type="submit" variant="contained" disabled={busy}>
            {busy ? "Sending..." : "Send Reset Link"}
          </Button>

          <Link component={RouterLink} to="/login" underline="hover">
            Back to login
          </Link>
        </Box>
      </Paper>
    </Container>
  );
}