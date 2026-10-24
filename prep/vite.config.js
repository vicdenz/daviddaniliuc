import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { config } from "./server/config.mjs";
export default defineConfig({
  base: process.env.PREP_WEBSITE_BUILD ? "/prep-ui/" : (config.basePath || "") + "/",
  build: process.env.PREP_WEBSITE_BUILD ? { outDir: "../public/prep-ui", emptyOutDir: true } : {},
  define: { "import.meta.env.VITE_API_BASE": JSON.stringify(process.env.PREP_WEBSITE_BUILD ? "/prep/api" : null) },
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: { [(config.basePath || "") + "/api"]: "http://127.0.0.1:4310" },
  },
});
