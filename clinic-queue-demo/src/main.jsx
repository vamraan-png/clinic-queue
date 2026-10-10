import React from "react";
import { createRoot } from "react-dom/client";
import ClinicDemo from "./ClinicDemo.jsx";
import "./ClinicDemo.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClinicDemo />
  </React.StrictMode>
);
