import { Sandbox } from "@vercel/sandbox";
import { SANDBOX_TIMEOUT_MS } from "./config.mjs";

export async function createVercelSandbox(env = process.env) {
  if (!env.PREP_CPP_SNAPSHOT_ID)
    throw new Error("Vercel execution environment is not configured.");
  const sandbox = await Sandbox.create({
    source: { type: "snapshot", snapshotId: env.PREP_CPP_SNAPSHOT_ID },
    networkPolicy: "deny-all",
    persistent: false,
    timeout: SANDBOX_TIMEOUT_MS,
    resources: { vcpus: 1 },
  });
  return {
    cwd: "/vercel/sandbox/work",
    python: "/vercel/sandbox/runtime/bin/python",
    writeFiles: (files) => sandbox.writeFiles(files),
    readFileToBuffer: (options) => sandbox.readFileToBuffer(options),
    runCommand: (options) => sandbox.runCommand(options),
    stop: () => sandbox.stop(),
    get activeCpuUsageMs() {
      return sandbox.activeCpuUsageMs;
    },
  };
}
