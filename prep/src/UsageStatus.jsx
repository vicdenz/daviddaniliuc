import React, { useEffect, useState } from "react";
import { cpuTime, usageView } from "./usage-format.mjs";

export default function UsageStatus({ request }) {
  const [usage, setUsage] = useState(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    let active = true;
    let busy = false;
    const refresh = async () => {
      if (busy || document.hidden) return;
      busy = true;
      try {
        const data = await request("/usage");
        if (active) {
          setUsage(data);
          setUnavailable(false);
        }
      } catch {
        if (active) setUnavailable(true);
      } finally {
        busy = false;
      }
    };
    refresh();
    const interval = setInterval(refresh, 30000);
    window.addEventListener("prep:usage", refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener("prep:usage", refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [request]);
  if (unavailable)
    return (
      <div className="usage-status usage-unavailable" role="status">
        Compute usage unavailable
      </div>
    );
  if (!usage)
    return (
      <div className="usage-status usage-unavailable">
        Loading compute usage…
      </div>
    );
  const view = usageView(usage);
  const estimate = usage.todayEstimated ? "~" : "";
  const title = `Recommended daily CPU budget, not a Vercel cutoff. Day resets at midnight in ${usage.timeZone}. Includes davidprep sessions started since ${new Date(usage.trackingStartedAt).toLocaleString()}; earlier usage and other projects are excluded. The 30-day figure is a rolling app total, not Vercel's billing cycle. ${usage.rollingEstimated ? "Some entries use conservative wall-time estimates because CPU measurements were unavailable. " : ""}Vercel's dashboard is authoritative.`;
  return (
    <section
      className={"usage-status" + (view.overMs ? " usage-over" : "")}
      title={title}
      aria-label="App compute usage"
    >
      <div className="usage-line">
        <span>
          Daily target{" "}
          <strong>
            {estimate}
            {view.percentage}
          </strong>
        </span>
        <span>
          {estimate}
          {cpuTime(usage.todayCpuMs)} / 10m
          {view.overMs > 0 && <strong> · {cpuTime(view.overMs)} over</strong>}
        </span>
      </div>
      <progress
        max="100"
        value={view.width}
        aria-label="Daily recommended CPU budget"
        aria-valuetext={`${estimate}${view.percentage} of daily recommendation${view.overMs ? `, ${cpuTime(view.overMs)} over` : ""}`}
      />
      <div className="usage-detail">
        App CPU only · 30d {usage.rollingEstimated ? "~" : ""}
        {cpuTime(usage.rollingCpuMs)} / 5h
        {usage.pending > 0
          ? ` · ${usage.pending} measuring`
          : view.rollingPercent >= 100
            ? " · check monthly quota"
            : ""}
      </div>
    </section>
  );
}
