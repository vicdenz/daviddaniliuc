import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
const cwd = new URL("../prep/", import.meta.url);
if (!existsSync(new URL("node_modules/vite/bin/vite.js", cwd))) {
  const install = spawnSync(
    "npm",
    ["ci", "--prefix", "prep", "--include=dev"],
    { stdio: "inherit" },
  );
  if (install.status) process.exit(install.status);
}
const build = spawnSync("npm", ["run", "build"], {
  cwd,
  stdio: "inherit",
  env: { ...process.env, PREP_WEBSITE_BUILD: "1" },
});
process.exit(build.status ?? 1);
