import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { config } from "./server/config.mjs";
export default defineConfig({
  base: (config.basePath || "") + "/",
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: { [(config.basePath || "") + "/api"]: "http://127.0.0.1:4310" },
  },
});
