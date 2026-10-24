import { spawn } from "node:child_process";
const children = [
  spawn(process.execPath, ["--watch", "server/index.mjs"], {
    stdio: "inherit",
  }),
  spawn(process.execPath, ["node_modules/vite/bin/vite.js"], {
    stdio: "inherit",
  }),
];
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    for (const p of children) p.kill(signal);
    process.exit();
  });
for (const p of children)
  p.on("exit", (code) => {
    for (const c of children) if (c !== p) c.kill();
    process.exit(code || 0);
  });
