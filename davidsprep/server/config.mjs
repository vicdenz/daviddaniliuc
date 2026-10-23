import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
const envFile = fileURLToPath(new URL("../.env.local", import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);
export const config = {
  password: process.env.DAVIDSPREP_PASSWORD,
  sessionSecret: process.env.DAVIDSPREP_SESSION_SECRET,
  publicOrigin: process.env.DAVIDSPREP_PUBLIC_ORIGIN || null,
  allowedHosts: (process.env.DAVIDSPREP_ALLOWED_HOSTS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  basePath: (process.env.DAVIDSPREP_BASE_PATH ?? "/prep").replace(/\/$/, ""),
};
if (config.basePath && !/^\/[a-zA-Z0-9/_-]+$/.test(config.basePath))
  throw new Error("Invalid DAVIDSPREP_BASE_PATH");
if (config.publicOrigin) {
  const u = new URL(config.publicOrigin);
  if (u.protocol !== "https:") throw new Error("Public origin must use HTTPS");
  config.publicOrigin = u.origin;
}
