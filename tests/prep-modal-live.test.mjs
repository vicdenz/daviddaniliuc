import test from "node:test";
import assert from "node:assert/strict";
import { createModalSandbox } from "../prep/hosted/providers/modal.mjs";
import { executionStatus } from "../prep/hosted/providers/config.mjs";
import { createExecutor } from "../prep/hosted/executor.mjs";

const configured = executionStatus({
  ...process.env,
  PREP_EXECUTION_PROVIDER: "modal",
}).available;
test(
  "live Modal image runs unprivileged, blocks networking, and executes Python/C++ with visible verdicts",
  {
    timeout: 240000,
  },
  async () => {
    assert.ok(
      configured,
      "Modal credentials and PREP_MODAL_IMAGE_ID are required. Authenticate and complete prep/MODAL.md before running the live validation command.",
    );
    const sandbox = await createModalSandbox();
    try {
      const probe = `import json, os, socket, sys, pytest
blocked = False
try:
    socket.create_connection(('1.1.1.1', 443), timeout=1).close()
except OSError:
    blocked = True
with open('/work/probe.json', 'w') as f:
    json.dump({'uid': os.getuid(), 'networkBlocked': blocked, 'python': list(sys.version_info[:2]),
      'hasSecrets': any(key in os.environ for key in ['MODAL_TOKEN_ID', 'MODAL_TOKEN_SECRET', 'MODAL_IDENTITY_TOKEN', 'PREP_SUPABASE_SECRET_KEY', 'PREP_PASSWORD'])}, f)
`;
      const result = await sandbox.runCommand({
        cmd: sandbox.python,
        args: ["-c", probe],
        cwd: sandbox.cwd,
        timeoutMs: 10000,
        env: {},
      });
      assert.equal(result.exitCode, 0, "runtime and pytest must be available");
      const info = JSON.parse(
        (
          await sandbox.readFileToBuffer({ path: "/work/probe.json" })
        ).toString(),
      );
      assert.ok(info.uid > 0, "submitted code must not run as root");
      assert.equal(info.networkBlocked, true);
      assert.equal(info.hasSecrets, false);
      assert.deepEqual(info.python, [3, 12]);
    } finally {
      await sandbox.stop();
    }

    // These direct adapter tests exclude DB writes; the HTTP suite separately
    // covers the private usage ledger, durable jobs, and saved work.
    const execute = createExecutor({
      provider: () => "modal",
      status: () => ({ available: true }),
      begin: async () => ({ provider: "modal" }),
      finish: async () => {},
    });
    const problem = {
      id: "modal-live",
      entry: "Solution.doubleValue",
      args: [{ name: "value", type: "long long" }],
      judge: { mode: "method", className: "Solution", method: "doubleValue" },
    };
    const cases = [
      {
        id: "visible",
        name: "Visible example",
        kind: "function",
        input: [21],
        expected: 42,
        timeout: 2,
      },
    ];
    for (const [language, code] of [
      [
        "python",
        "class Solution:\n    def doubleValue(self, value): return value * 2",
      ],
      [
        "cpp",
        "class Solution { public: long long doubleValue(long long value) { return value * 2; } };",
      ],
    ]) {
      const [result] = await execute(problem, code, language, cases);
      assert.equal(result.status, "passed", JSON.stringify(result));
      assert.equal(result.actual, 42);
    }
    const [timeout] = await execute(problem, "while True: pass", "python", [
      { ...cases[0], timeout: 0.2 },
    ]);
    assert.equal(timeout.status, "timeout", JSON.stringify(timeout));
  },
);
