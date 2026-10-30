import React, { useEffect, useState } from "react";
import { cpuTime, usageView, dollars } from "./usage-format.mjs";

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
  const modal = usage.provider === "modal";
  const over = modal ? view.overUsd : view.overMs;
  const today = modal ? dollars(usage.todayCostUsd) : cpuTime(usage.todayCpuMs);
  const budget = modal
    ? dollars(usage.dailyBudgetUsd)
    : cpuTime(usage.dailyBudgetMs);
  const rolling = modal
    ? dollars(usage.rollingCostUsd)
    : cpuTime(usage.rollingCpuMs);
  const rollingBudget = modal
    ? dollars(usage.rollingBudgetUsd)
    : cpuTime(usage.rollingBudgetMs);
  const overLabel = modal ? dollars(over) : cpuTime(over);
  const estimate = usage.todayEstimated ? "~" : "";
  const title = modal
    ? `Estimated Modal Sandbox cost for davidprep only, using 0.5 physical CPU cores and 2 GiB at published Sandbox rates checked ${usage.pricingCheckedAt}. Daily target is advisory; $30 over 30 days is a planning reference, not a guaranteed free allowance or a spending limit. Includes this app's sessions since ${new Date(usage.trackingStartedAt).toLocaleString()}; excludes image builds, storage, other apps, and earlier usage. The rolling 30-day total does not match your billing cycle. Day resets at midnight in ${usage.timeZone}. Modal's billing dashboard is authoritative.`
    : `Recommended daily CPU budget, not a Vercel cutoff. Day resets at midnight in ${usage.timeZone}. Includes davidprep sessions started since ${new Date(usage.trackingStartedAt).toLocaleString()}; earlier usage and other projects are excluded. The 30-day figure is a rolling app total, not Vercel's billing cycle. ${usage.rollingEstimated ? "Some entries use conservative wall-time estimates because CPU measurements were unavailable. " : ""}Vercel's dashboard is authoritative.`;
  return (
    <section
      className={"usage-status" + (over ? " usage-over" : "")}
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
          {today} / {budget}
          {over > 0 && <strong> · {overLabel} over</strong>}
        </span>
      </div>
      <progress
        max="100"
        value={view.width}
        aria-label={
          modal
            ? "Daily recommended compute cost"
            : "Daily recommended CPU budget"
        }
        aria-valuetext={`${estimate}${view.percentage} of daily recommendation${over ? `, ${overLabel} over` : ""}`}
      />
      <div className="usage-detail">
        {modal ? "Modal estimate" : "App CPU only"} · 30d{" "}
        {usage.rollingEstimated ? "~" : ""}
        {rolling} / {rollingBudget}
        {usage.pending > 0
          ? ` · ${usage.pending} measuring`
          : view.rollingPercent >= 100
            ? " · check monthly quota"
            : ""}
      </div>
    </section>
  );
}
