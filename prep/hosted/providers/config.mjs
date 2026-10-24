export const SANDBOX_TIMEOUT_MS = 240000;
export const MODAL_CPU_CORES = 0.5; // Modal physical cores; equivalent to one vCPU.
export const MODAL_MEMORY_MIB = 2048;

export function executionProvider(env = process.env) {
  const provider = env.PREP_EXECUTION_PROVIDER || "vercel";
  if (!["vercel", "modal"].includes(provider))
    throw new Error("PREP_EXECUTION_PROVIDER must be vercel or modal.");
  return provider;
}

export function executionStatus(env = process.env) {
  const provider = executionProvider(env);
  return {
    provider,
    backend: provider === "modal" ? "Modal Sandbox" : "Vercel Sandbox",
    available:
      provider === "modal"
        ? !!(
            env.MODAL_TOKEN_ID &&
            env.MODAL_TOKEN_SECRET &&
            env.PREP_MODAL_IMAGE_ID
          )
        : !!env.PREP_CPP_SNAPSHOT_ID,
  };
}
