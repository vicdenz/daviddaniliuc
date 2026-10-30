import {
  MODAL_CPU_CORES,
  MODAL_MEMORY_MIB,
  SANDBOX_TIMEOUT_MS,
} from "./providers/config.mjs";

// Modal's published non-preemptible Sandbox rates, checked 2026-10-24.
// These are app estimates, not billing data; image builds/other apps are excluded.
export const MODAL_CPU_USD_PER_CORE_SECOND = 0.00003942;
export const MODAL_MEMORY_USD_PER_GIB_SECOND = 0.00000667;
export const MODAL_USD_PER_SECOND =
  MODAL_CPU_CORES * MODAL_CPU_USD_PER_CORE_SECOND +
  (MODAL_MEMORY_MIB / 1024) * MODAL_MEMORY_USD_PER_GIB_SECOND;

export function usageFinalization(
  record,
  reportedCpuMs,
  stopped = true,
  now = Date.now(),
) {
  const elapsed = Math.max(0, now - new Date(record.started_at).getTime());
  const measured =
    record.provider !== "modal" &&
    Number.isFinite(reportedCpuMs) &&
    reportedCpuMs >= 0;
  const estimateMs = stopped
    ? Math.min(elapsed, SANDBOX_TIMEOUT_MS)
    : SANDBOX_TIMEOUT_MS;
  return {
    cpu_ms: measured ? reportedCpuMs : estimateMs,
    measurement: measured ? "measured" : "upper_bound",
    ended_at: new Date(now).toISOString(),
    ...(record.provider === "modal"
      ? {
          wall_ms: estimateMs,
          estimated_cost_usd: (estimateMs / 1000) * MODAL_USD_PER_SECOND,
        }
      : {}),
  };
}
