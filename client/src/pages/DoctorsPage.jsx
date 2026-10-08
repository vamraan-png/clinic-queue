import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { apiFetch } from "../api/http";

import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";

export default function DoctorsPage({ user }) {
  const [doctors, setDoctors] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const isOwner = user?.role === "OWNER";

  // create doctor dialog
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const activeCount = useMemo(() => doctors.filter((d) => d.isActive).length, [doctors]);

  async function load() {
    const data = await apiFetch("/api/admin/doctors");
    setDoctors(data.doctors);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function createDoctor() {
    setBusy(true);
    setError("");
    try {
      await apiFetch("/api/admin/doctors", {
        method: "POST",
        body: JSON.stringify({ name, code })
      });
      setOpen(false);
      setName("");
      setCode("");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleDoctor(d) {
    setBusy(true);
    setError("");
    try {
      await apiFetch(`/api/admin/doctors/${d._id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !d.isActive })
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
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Doctors
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Active: {activeCount} / {doctors.length}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" component="a" href="/display" target="_blank" rel="noreferrer">
            Open Display Screen
          </Button>

          {isOwner ? (
            <Button variant="contained" onClick={() => setOpen(true)}>
              Create Doctor
            </Button>
          ) : null}
        </Box>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Paper sx={{ p: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Doctor</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Queue</TableCell>
              {isOwner ? <TableCell align="right">Action</TableCell> : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {doctors.map((d) => (
              <TableRow key={d._id} hover>
                <TableCell>
                  <Typography fontWeight={700}>{d.name}</Typography>
                </TableCell>
                <TableCell>{d.code}</TableCell>
                <TableCell>
                  {d.isActive ? (
                    <Chip label="Active" color="success" size="small" />
                  ) : (
                    <Chip label="Inactive" size="small" />
                  )}
                </TableCell>
                <TableCell align="right">
                  <Button
                    component={RouterLink}
                    to={`/admin/doctors/${d._id}`}
                    size="small"
                    variant="outlined"
                    disabled={!d.isActive}
                  >
                    Open
                  </Button>
                </TableCell>
                {isOwner ? (
                  <TableCell align="right">
                    <Button size="small" disabled={busy} onClick={() => toggleDoctor(d)}>
                      {d.isActive ? "Disable" : "Enable"}
                    </Button>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => (!busy ? setOpen(false) : null)} fullWidth maxWidth="sm">
        <DialogTitle>Create Doctor</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 1 }}>
          <TextField label="Doctor Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <TextField
            label="Code (unique, e.g. A, ENT1)"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Code must be unique. It will appear in tokens like A-001.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
          <Button onClick={createDoctor} variant="contained" disabled={busy || !name || !code}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}