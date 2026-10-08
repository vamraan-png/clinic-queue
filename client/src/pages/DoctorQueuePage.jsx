import { useEffect, useMemo, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { apiFetch } from "../api/http";
import { displayToken } from "../api/format";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import Snackbar from "@mui/material/Snackbar";

export default function DoctorQueuePage() {
  const { doctorId } = useParams();

  const [doctor, setDoctor] = useState(null);
  const [dateKey, setDateKey] = useState("");
  const [tokens, setTokens] = useState([]);

  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");

  const [filter, setFilter] = useState("ALL");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [live, setLive] = useState(false);

  const [snack, setSnack] = useState({
    open: false,
    message: "",
  });

  const calledToken = useMemo(
    () => tokens.find((t) => t.status === "CALLED") || null,
    [tokens]
  );

  const filteredTokens = useMemo(() => {
    if (filter === "ALL") return tokens;
    return tokens.filter((t) => t.status === filter);
  }, [tokens, filter]);

  async function loadQueueOnce() {
    const data = await apiFetch(`/api/admin/doctors/${doctorId}/queue`);

    setDoctor(data.doctor);
    setDateKey(data.dateKey);
    setTokens(data.tokens);
  }

  useEffect(() => {
    setError("");
    setLive(false);

    // Initial load
    loadQueueOnce().catch((e) => setError(e.message));

    // Live stream
    const es = new EventSource(
      `/api/admin/doctors/${doctorId}/queue/stream`
    );

    es.addEventListener("queue", (event) => {
      try {
        const data = JSON.parse(event.data);

        setDoctor(data.doctor);
        setDateKey(data.dateKey);
        setTokens(data.tokens);
        setLive(true);
        setError("");
      } catch (e) {
        setError("Failed to update queue.");
      }
    });

    es.addEventListener("error", () => {
      // EventSource auto-retries
      setLive(false);
    });

    return () => es.close();
  }, [doctorId]);

  async function createToken(e) {
    e.preventDefault();

    setBusy(true);
    setError("");

    try {
      const data = await apiFetch(
        `/api/admin/doctors/${doctorId}/tokens`,
        {
          method: "POST",
          body: JSON.stringify({
            patientName,
            patientPhone: patientPhone || undefined,
          }),
        }
      );

      const link = `${window.location.origin}/t/${data.token.publicId}`;

      setSnack({
        open: true,
        message: `Token created: ${data.token.displayToken} | Link copied`,
      });

      try {
        await navigator.clipboard.writeText(link);
      } catch {
        // Ignore clipboard errors
      }

      setPatientName("");
      setPatientPhone("");

      // Immediately update this screen too.
      await loadQueueOnce();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function callNext() {
    setBusy(true);
    setError("");

    try {
      await apiFetch(
        `/api/admin/doctors/${doctorId}/call-next`,
        {
          method: "POST",
        }
      );

      // Immediately update this screen.
      await loadQueueOnce();
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
      await apiFetch(
        `/api/admin/tokens/${tokenId}/${action}`,
        {
          method: "POST",
        }
      );

      /*
       * IMPORTANT:
       * After Served / Skip / Cancel, immediately reload the queue.
       *
       * This fixes the problem where the screen still shows
       * the old CALLED token until the page is manually refreshed.
       */
      await loadQueueOnce();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!doctor) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography fontWeight={800}>
          Loading queue…
        </Typography>

        {error ? (
          <Alert sx={{ mt: 2 }} severity="error">
            {error}
          </Alert>
        ) : null}
      </Paper>
    );
  }

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
        <Box>
          <Button
            component={RouterLink}
            to="/admin"
            variant="text"
          >
            ← Back to Doctors
          </Button>

          <Typography
            variant="h5"
            fontWeight={900}
            sx={{ mt: 1 }}
          >
            {doctor.name}
          </Typography>

          <Typography sx={{ color: "text.secondary" }}>
            Date: {dateKey} • Code: {doctor.code} •{" "}
            <strong
              style={{
                color: live ? "#166534" : "#92400e",
              }}
            >
              {live ? "LIVE" : "RECONNECTING"}
            </strong>
          </Typography>
        </Box>

        <Button
          variant="contained"
          onClick={callNext}
          disabled={busy}
        >
          Call Next
        </Button>
      </Stack>

      {error ? (
        <Alert severity="error">
          {error}
        </Alert>
      ) : null}

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight={800}>
          Now Serving
        </Typography>

        <Divider sx={{ my: 1.5 }} />

        {calledToken ? (
          <Stack
  direction={{ xs: "column", sm: "row" }}
  sx={{
    justifyContent: "space-between",
    alignItems: { xs: "flex-start", sm: "center" },
    gap: 2
  }}
>
            <Box>
              <Typography
                variant="h4"
                fontWeight={900}
              >
                {displayToken(
                  doctor.code,
                  calledToken.tokenNumber
                )}
              </Typography>

              <Typography
                sx={{
                  color: "text.secondary",
                }}
              >
                {calledToken.patientName}
              </Typography>
            </Box>

            <Stack direction="row" gap={1}>
              <Button
                variant="contained"
                color="success"
                disabled={busy}
                onClick={() =>
                  actionToken(
                    calledToken._id,
                    "serve"
                  )
                }
              >
                Served
              </Button>

              <Button
                variant="outlined"
                disabled={busy}
                onClick={() =>
                  actionToken(
                    calledToken._id,
                    "skip"
                  )
                }
              >
                Skip
              </Button>

              <Button
                variant="outlined"
                color="error"
                disabled={busy}
                onClick={() =>
                  actionToken(
                    calledToken._id,
                    "cancel"
                  )
                }
              >
                Cancel
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Typography
            sx={{
              color: "text.secondary",
            }}
          >
            No token is currently called.
          </Typography>
        )}
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight={800}>
          Create Token
        </Typography>

        <Divider sx={{ my: 1.5 }} />

        <Box
          component="form"
          onSubmit={createToken}
          sx={{
            display: "grid",
            gap: 2,
            maxWidth: 520,
          }}
        >
          <TextField
            label="Patient Name"
            value={patientName}
            onChange={(e) =>
              setPatientName(e.target.value)
            }
            required
          />

          <TextField
            label="Phone (optional for SMS later)"
            value={patientPhone}
            onChange={(e) =>
              setPatientPhone(e.target.value)
            }
            placeholder="+9198xxxxxx"
          />

          <Button
            type="submit"
            variant="contained"
            disabled={busy || !patientName}
          >
            Create Token
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="baseline"
        >
          <Typography
            variant="h6"
            fontWeight={800}
          >
            Tokens
          </Typography>

          <Stack
            direction="row"
            gap={1}
            flexWrap="wrap"
          >
            {[
              "ALL",
              "WAITING",
              "CALLED",
              "SERVED",
              "SKIPPED",
              "CANCELLED",
            ].map((s) => (
              <Chip
                key={s}
                label={s}
                clickable
                color={
                  filter === s
                    ? "primary"
                    : "default"
                }
                variant={
                  filter === s
                    ? "filled"
                    : "outlined"
                }
                onClick={() => setFilter(s)}
                size="small"
              />
            ))}
          </Stack>
        </Stack>

        <Divider sx={{ my: 1.5 }} />

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Token</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">
                Track
              </TableCell>
              <TableCell align="right">Print</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredTokens.map((t) => (
              <TableRow
                key={t._id}
                hover
              >
                <TableCell
                  sx={{
                    fontWeight: 800,
                  }}
                >
                  {displayToken(
                    doctor.code,
                    t.tokenNumber
                  )}
                </TableCell>

                <TableCell>
                  {t.patientName}
                </TableCell>

                <TableCell>
                  {t.status}
                </TableCell>

                <TableCell align="right">
                  <Button
                    component="a"
                    href={`/t/${t.publicId}`}
                    target="_blank"
                    rel="noreferrer"
                    size="small"
                    variant="outlined"
                  >
                    Open
                  </Button>
                </TableCell>
                <TableCell align="right">
  <Button
    component="a"
    href={`/admin/print/${t._id}`}
    target="_blank"
    rel="noreferrer"
    size="small"
    variant="outlined"
  >
    Print
  </Button>
</TableCell>
              </TableRow>
            ))}

            {!filteredTokens.length ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  sx={{
                    color: "text.secondary",
                  }}
                >
                  No tokens in this filter.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Paper>
      
      <Snackbar
        open={snack.open}
        autoHideDuration={2200}
        onClose={() =>
          setSnack({
            open: false,
            message: "",
          })
        }
        message={snack.message}
      />
    </Box>
  );
}