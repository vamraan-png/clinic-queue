import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  configFile: false,
  plugins: [react()],
  css: {
    postcss: {
      plugins: []
    }
  }
});
