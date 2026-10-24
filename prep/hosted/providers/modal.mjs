import { ModalClient } from "modal";
import {
  MODAL_CPU_CORES,
  MODAL_MEMORY_MIB,
  SANDBOX_TIMEOUT_MS,
} from "./config.mjs";

// A fresh client belongs to each batch; no Modal or Supabase secrets enter it.
export async function createModalSandbox(
  env = process.env,
  makeClient = (options) => new ModalClient(options),
) {
  if (
    !env.MODAL_TOKEN_ID ||
    !env.MODAL_TOKEN_SECRET ||
    !env.PREP_MODAL_IMAGE_ID
  )
    throw new Error(
      "Modal execution is not configured. Set MODAL_TOKEN_ID, MODAL_TOKEN_SECRET, and PREP_MODAL_IMAGE_ID.",
    );
  const client = makeClient({
    tokenId: env.MODAL_TOKEN_ID,
    tokenSecret: env.MODAL_TOKEN_SECRET,
    environment: env.PREP_MODAL_ENVIRONMENT || "main",
    timeoutMs: 20000,
    maxRetries: 1,
    maxThrottleWaitSecs: 5,
  });
  let sandbox;
  try {
    const app = await client.apps.fromName(env.PREP_MODAL_APP || "prep");
    const image = await client.images.fromId(env.PREP_MODAL_IMAGE_ID);
    sandbox = await client.sandboxes.create(app, image, {
      cpu: MODAL_CPU_CORES,
      cpuLimit: MODAL_CPU_CORES,
      memoryMiB: MODAL_MEMORY_MIB,
      memoryLimitMiB: MODAL_MEMORY_MIB,
      timeoutMs: SANDBOX_TIMEOUT_MS,
      workdir: "/work",
      blockNetwork: true,
      includeOidcIdentityToken: false,
    });
    return {
      cwd: "/work",
      python: "/opt/prep/runtime/bin/python",
      // Upload sequentially: artifacts may share parent directories.
      async writeFiles(files) {
        for (const file of files)
          await sandbox.filesystem.writeBytes(file.content, file.path);
      },
      async readFileToBuffer({ path }) {
        return Buffer.from(await sandbox.filesystem.readBytes(path));
      },
      async runCommand({ cmd, args, cwd, timeoutMs, env }) {
        const command = await sandbox.exec([cmd, ...args], {
          workdir: cwd,
          timeoutMs,
          env,
          stdout: "ignore",
          stderr: "ignore",
        });
        return { exitCode: await command.wait() };
      },
      async stop() {
        try {
          await sandbox.terminate({ wait: true });
        } finally {
          client.close();
        }
      },
      // Modal does not expose the Vercel activeCpuUsageMs counter. The usage
      // ledger records an explicitly estimated resource cost for this provider.
      activeCpuUsageMs: undefined,
    };
  } catch (error) {
    try {
      if (sandbox) await sandbox.terminate({ wait: true });
    } finally {
      client.close();
    }
    throw error;
  }
}
