import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#14532d" },   // professional clinic green
    secondary: { main: "#1d4ed8" }
  },
  shape: { borderRadius: 10 }
});