export function cpuTime(ms) {
  const seconds = Math.max(0, Math.round(ms / 1000));
  if (seconds >= 3600)
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  if (seconds >= 60) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export function usageView(data) {
  const modal = data.provider === "modal";
  const today = modal ? data.todayCostUsd : data.todayCpuMs;
  const budget = modal ? data.dailyBudgetUsd : data.dailyBudgetMs;
  const rolling = modal ? data.rollingCostUsd : data.rollingCpuMs;
  const rollingBudget = modal ? data.rollingBudgetUsd : data.rollingBudgetMs;
  const percent = (today / budget) * 100;
  return {
    percent,
    width: Math.min(100, Math.max(0, percent)),
    percentage: percent > 0 && percent < 1 ? "<1%" : `${Math.round(percent)}%`,
    overMs: modal ? 0 : Math.max(0, today - budget),
    overUsd: modal ? Math.max(0, today - budget) : 0,
    rollingPercent: (rolling / rollingBudget) * 100,
  };
}

export function dollars(value) {
  if (value > 0 && value < 0.001) return "<$0.001";
  return `$${value.toFixed(3)}`;
}
