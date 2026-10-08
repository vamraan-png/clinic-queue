import { useEffect, useMemo, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { apiFetch } from "../api/http";
import { displayToken } from "../api/format";
import { QRCodeCanvas } from "qrcode.react";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";

export default function PrintTokenPage() {
  const { tokenId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    apiFetch(`/api/admin/tokens/${tokenId}`)
      .then((d) => setData(d))
      .catch((e) => setError(e.message));
  }, [tokenId]);

  const trackUrl = useMemo(() => {
    if (!data) return "";
    return `${window.location.origin}/t/${data.token.publicId}`;
  }, [data]);

  const bigToken = useMemo(() => {
    if (!data) return "";
    return displayToken(data.doctor.code, data.token.tokenNumber);
  }, [data]);

  function doPrint() {
    window.print();
  }

  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        "@media print": {
          gap: 0
        }
      }}
    >
      {/* Controls (hidden in print) */}
      <Box className="no-print" sx={{ display: "flex", gap: 1 }}>
        <Button component={RouterLink} to="/admin" variant="outlined">
          Back
        </Button>
        <Button onClick={doPrint} variant="contained">
          Print
        </Button>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {!data ? (
        <Paper sx={{ p: 2 }}>Loading…</Paper>
      ) : (
        <Paper
          className="print-slip"
          sx={{
            p: 2,
            width: "80mm",
            maxWidth: "100%",
            "@media print": {
              boxShadow: "none",
              border: "none",
              width: "80mm",
              p: 0
            }
          }}
        >
          <Typography fontWeight={900} sx={{ fontSize: 16 }}>
            Clinic Queue Token
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 12 }}>
            Date: {data.token.dateKey}
          </Typography>

          <Divider sx={{ my: 1 }} />

          <Typography sx={{ fontSize: 12, color: "text.secondary" }}>Doctor</Typography>
          <Typography fontWeight={800}>{data.doctor.name}</Typography>

          <Divider sx={{ my: 1 }} />

          <Typography sx={{ fontSize: 12, color: "text.secondary" }}>Token</Typography>
          <Typography sx={{ fontSize: 34, fontWeight: 900, lineHeight: 1.1 }}>
            {bigToken}
          </Typography>

          <Typography sx={{ mt: 1, fontSize: 12 }}>
            Patient: <strong>{data.token.patientName}</strong>
          </Typography>

          <Divider sx={{ my: 1 }} />

          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <QRCodeCanvas value={trackUrl} size={92} />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                Track live status:
              </Typography>
              <Typography sx={{ fontSize: 12, wordBreak: "break-all" }}>
                {trackUrl}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 1 }} />

          <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
            Please keep this slip until your consultation is complete.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}