import test from "node:test";
import assert from "node:assert/strict";
import { cpuTime, usageView } from "../prep/src/usage-format.mjs";

const data = {
  todayCpuMs: 0,
  dailyBudgetMs: 600000,
  rollingCpuMs: 0,
  rollingBudgetMs: 18000000,
};
test("daily recommended budget reports actual overage while keeping the bar bounded", () => {
  assert.equal(usageView(data).percentage, "0%");
  assert.equal(usageView({ ...data, todayCpuMs: 100 }).percentage, "<1%");
  assert.equal(usageView({ ...data, todayCpuMs: 300000 }).percentage, "50%");
  const limit = usageView({ ...data, todayCpuMs: 600000 });
  assert.equal(limit.percentage, "100%");
  assert.equal(limit.overMs, 0);
  const over = usageView({
    ...data,
    todayCpuMs: 900000,
    rollingCpuMs: 18000000,
  });
  assert.equal(over.percentage, "150%");
  assert.equal(over.width, 100);
  assert.equal(cpuTime(over.overMs), "5m 0s");
  assert.equal(over.rollingPercent, 100);
  assert.equal(cpuTime(18000000), "5h 0m");
});
