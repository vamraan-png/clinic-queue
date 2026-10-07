import { useEffect, useState } from "react";
import { apiFetch } from "../api/http";

import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const data = await apiFetch("/api/admin/users");
    setUsers(data.users);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function createReception() {
    setBusy(true);
    setError("");
    setTempPassword("");
    try {
      const data = await apiFetch("/api/admin/users/reception", {
        method: "POST",
        body: JSON.stringify({ name, email })
      });
      setTempPassword(data.tempPassword);
      setName("");
      setEmail("");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(u) {
    setBusy(true);
    setError("");
    try {
      await apiFetch(`/api/admin/users/${u._id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !u.isActive })
      });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Typography variant="h5">Staff</Typography>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Create Reception User
        </Typography>

        <Box sx={{ display: "grid", gap: 1.5, maxWidth: 520 }}>
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button variant="contained" disabled={busy || !name || !email} onClick={createReception}>
            Create
          </Button>

          {tempPassword ? (
            <Alert severity="warning">
              Temporary password (copy now): <strong>{tempPassword}</strong>
              <br />
              User will be forced to change password on first login.
            </Alert>
          ) : null}
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Users
        </Typography>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Must Change Password</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u._id}>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell>
                  {u.isActive ? <Chip label="Active" color="success" size="small" /> : <Chip label="Disabled" size="small" />}
                </TableCell>
                <TableCell>{u.mustChangePassword ? "Yes" : "No"}</TableCell>
                <TableCell align="right">
                  <Button size="small" disabled={busy} onClick={() => toggleActive(u)}>
                    {u.isActive ? "Disable" : "Enable"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}