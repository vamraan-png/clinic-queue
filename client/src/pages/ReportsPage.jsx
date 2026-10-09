import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api/http";

import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import Button from "@mui/material/Button";

function todayLocalDateKey() {
  // YYYY-MM-DD (browser local); backend still uses clinic timezone if dateKey not provided
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function ReportsPage() {
  const [dateKey, setDateKey] = useState(todayLocalDateKey());
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  async function load(selectedDateKey) {
    setError("");
    const res = await apiFetch(`/api/admin/reports/daily?dateKey=${encodeURIComponent(selectedDateKey)}`);
    setData(res);
  }

  useEffect(() => {
    load(dateKey).catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalsLine = useMemo(() => {
    if (!data) return "";
    const t = data.totals;
    return `Total: ${t.total} (Waiting ${t.waiting}, Called ${t.called}, Served ${t.served}, Skipped ${t.skipped}, Cancelled ${t.cancelled})`;
  }, [data]);

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Typography variant="h5" fontWeight={900}>
        Daily Reports
      </Typography>

      <Paper sx={{ p: 2, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
        <TextField
          label="Date"
          type="date"
          value={dateKey}
          onChange={(e) => {
            const v = e.target.value;
            setDateKey(v);
            load(v).catch((err) => setError(err.message));
          }}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 220 }}
        />

        <Button
  variant="outlined"
  component="a"
  href={`/api/admin/reports/daily.csv?dateKey=${encodeURIComponent(dateKey)}`}
>
  Download CSV
</Button>

        <Typography sx={{ color: "text.secondary" }}>
          {data ? totalsLine : "Loading..."}
        </Typography>
      </Paper>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Paper sx={{ p: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Doctor</TableCell>
              <TableCell>Code</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="right">Served</TableCell>
              <TableCell align="right">Waiting</TableCell>
              <TableCell align="right">Skipped</TableCell>
              <TableCell align="right">Cancelled</TableCell>
              <TableCell align="right">Avg Wait (min)</TableCell>
              <TableCell align="right">Avg Service (min)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.doctors || []).map((r) => (
              <TableRow key={r.doctor.id} hover>
                <TableCell sx={{ fontWeight: 800 }}>{r.doctor.name}</TableCell>
                <TableCell>{r.doctor.code}</TableCell>
                <TableCell align="right">{r.counts.total}</TableCell>
                <TableCell align="right">{r.counts.served}</TableCell>
                <TableCell align="right">{r.counts.waiting}</TableCell>
                <TableCell align="right">{r.counts.skipped}</TableCell>
                <TableCell align="right">{r.counts.cancelled}</TableCell>
                <TableCell align="right">{r.avgWaitMinutes ?? "-"}</TableCell>
                <TableCell align="right">{r.avgServiceMinutes ?? "-"}</TableCell>
              </TableRow>
            ))}

            {!data?.doctors?.length ? (
              <TableRow>
                <TableCell colSpan={9} sx={{ color: "text.secondary" }}>
                  No data for this date.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}