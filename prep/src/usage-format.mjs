export function cpuTime(ms) {
  const seconds = Math.max(0, Math.round(ms / 1000));
  if (seconds >= 3600)
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  if (seconds >= 60) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export function usageView(data) {
  const percent = (data.todayCpuMs / data.dailyBudgetMs) * 100;
  return {
    percent,
    width: Math.min(100, Math.max(0, percent)),
    percentage: percent > 0 && percent < 1 ? "<1%" : `${Math.round(percent)}%`,
    overMs: Math.max(0, data.todayCpuMs - data.dailyBudgetMs),
    rollingPercent: (data.rollingCpuMs / data.rollingBudgetMs) * 100,
  };
}
