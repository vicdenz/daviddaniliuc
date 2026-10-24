import { randomUUID } from "node:crypto";
import { getDb } from "./storage.mjs";

export async function beginUsage() {
  const record = {
    id: randomUUID(),
    started_at: new Date().toISOString(),
    cpu_ms: 0,
    measurement: "pending",
  };
  const { error } = await getDb().from("prep_usage").insert(record);
  if (error)
    throw new Error("Usage tracking unavailable. Please retry the run.");
  return record;
}

export async function finishUsage(record, reportedCpuMs, stopped = true) {
  const measured = Number.isFinite(reportedCpuMs) && reportedCpuMs >= 0;
  const elapsed = Math.max(
    0,
    Date.now() - new Date(record.started_at).getTime(),
  );
  const { error } = await getDb()
    .from("prep_usage")
    .update({
      cpu_ms: measured
        ? reportedCpuMs
        : stopped
          ? Math.min(elapsed, 240000)
          : 240000,
      measurement: measured ? "measured" : "upper_bound",
      ended_at: new Date().toISOString(),
    })
    .eq("id", record.id);
  // The pending row remains visible and becomes a conservative estimate if persistence fails.
  if (error)
    console.error("Prep usage finalization failed; pending usage retained.");
}

export async function getUsage() {
  const { data, error } = await getDb().rpc("prep_usage_summary", {
    zone: "America/Toronto",
  });
  if (error)
    throw Object.assign(new Error("Usage tracking unavailable."), {
      status: 503,
    });
  return {
    ...data,
    dailyBudgetMs: 600000,
    rollingBudgetMs: 18000000,
    scope: "davidprep",
    timeZone: "America/Toronto",
  };
}
