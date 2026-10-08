import { Link as RouterLink } from "react-router-dom";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

export default function RequireOwner({ user, children }) {
  if (!user) return null;

  if (user.role !== "OWNER") {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={800}>
          Not authorized
        </Typography>
        <Typography sx={{ color: "text.secondary", mt: 1 }}>
          This page is only available to the clinic owner.
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Button component={RouterLink} to="/admin" variant="contained">
            Back to Doctors
          </Button>
        </Box>
      </Paper>
    );
  }

  return children;
}