import { Link as RouterLink, Outlet, useNavigate } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";

import { apiFetch } from "../api/http";

export default function AdminLayout({ user, onLogout }) {
  const navigate = useNavigate();

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    onLogout();
    navigate("/login", { replace: true });
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fafafa" }}>
      <AppBar position="sticky" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Clinic Queue
          </Typography>

          <Button color="inherit" component={RouterLink} to="/admin">
            Doctors
          </Button>

          {user?.role === "OWNER" ? (
            <Button color="inherit" component={RouterLink} to="/admin/users">
              Staff
            </Button>
          ) : null}

          <Box sx={{ mx: 2, opacity: 0.9 }}>
            {user?.name} ({user?.role})
          </Box>

          <Button color="inherit" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container sx={{ py: 3 }}>
        <Outlet />
      </Container>
    </Box>
  );
}