export async function createExecutionSandbox(provider) {
  if (provider === "modal") {
    const { createModalSandbox } = await import("./modal.mjs");
    return createModalSandbox();
  }
  if (provider === "vercel") {
    const { createVercelSandbox } = await import("./vercel.mjs");
    return createVercelSandbox();
  }
  throw new Error("Unknown execution provider.");
}
