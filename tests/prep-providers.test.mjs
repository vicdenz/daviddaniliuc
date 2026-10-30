import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createModalSandbox } from "../prep/hosted/providers/modal.mjs";
import {
  executionProvider,
  executionStatus,
} from "../prep/hosted/providers/config.mjs";
import { createExecutor } from "../prep/hosted/executor.mjs";
import {
  usageFinalization,
  MODAL_USD_PER_SECOND,
} from "../prep/hosted/usage-policy.mjs";

const env = {
  MODAL_TOKEN_ID: "test-id",
  MODAL_TOKEN_SECRET: "test-secret",
  PREP_MODAL_IMAGE_ID: "im-test",
  PREP_SUPABASE_SECRET_KEY: "must-never-enter-guest",
  PREP_PASSWORD: "must-never-enter-guest",
};
function modalFixture() {
  const calls = { closed: 0, terminated: 0, files: new Map() };
  const remote = {
    filesystem: {
      writeBytes: async (content, path) => calls.files.set(path, content),
      readBytes: async (path) => calls.files.get(path),
    },
    exec: async (command, params) => {
      if (command[2]?.includes("os.getuid()")) {
        calls.identity = { command, params };
        return { wait: async () => calls.identityExit ?? 0 };
      }
      calls.command = command;
      calls.commandParams = params;
      return { wait: async () => 7 };
    },
    terminate: async (params) => {
      calls.terminated++;
      calls.terminateParams = params;
    },
  };
  const client = {
    apps: {
      fromName: async (name) => {
        calls.app = name;
        return "app";
      },
    },
    images: {
      fromId: async (id) => {
        calls.image = id;
        return "image";
      },
    },
    sandboxes: {
      create: async (app, image, params) => {
        calls.create = { app, image, params };
        return remote;
      },
    },
    close: () => {
      calls.closed++;
    },
  };
  return {
    calls,
    client,
    remote,
    makeClient: (params) => {
      calls.clientParams = params;
      return client;
    },
  };
}

test("provider defaults preserve Vercel and invalid or unconfigured Modal never falls back", async () => {
  assert.equal(executionProvider({}), "vercel");
  assert.equal(
    executionProvider({ PREP_EXECUTION_PROVIDER: "modal" }),
    "modal",
  );
  assert.throws(
    () => executionProvider({ PREP_EXECUTION_PROVIDER: "typo" }),
    /must be vercel or modal/,
  );
  assert.equal(
    executionStatus({ ...env, PREP_EXECUTION_PROVIDER: "modal" }).available,
    true,
  );
  assert.equal(
    executionStatus({
      PREP_EXECUTION_PROVIDER: "modal",
      PREP_CPP_SNAPSHOT_ID: "snapshot",
    }).available,
    false,
  );
  let created = false;
  await assert.rejects(
    createModalSandbox({}, () => {
      created = true;
    }),
    /not configured/,
  );
  assert.equal(created, false);
});

test("Modal enforces a fresh, network-blocked Sandbox with hard CPU/memory/lifetime limits and no guest credentials", async () => {
  const f = modalFixture();
  const sandbox = await createModalSandbox(env, f.makeClient);
  assert.deepEqual(f.calls.create, {
    app: "app",
    image: "image",
    params: {
      cpu: 0.5,
      cpuLimit: 0.5,
      memoryMiB: 2048,
      memoryLimitMiB: 2048,
      timeoutMs: 240000,
      workdir: "/work",
      blockNetwork: true,
      includeOidcIdentityToken: false,
    },
  });
  assert.equal(f.calls.app, "prep");
  assert.equal(f.calls.image, "im-test");
  const content = Buffer.from("solution");
  await sandbox.writeFiles([{ path: "/work/main.py", content }]);
  assert.deepEqual(
    await sandbox.readFileToBuffer({ path: "/work/main.py" }),
    content,
  );
  const result = await sandbox.runCommand({
    cmd: "sh",
    args: ["-c", "echo test"],
    cwd: "/work",
    timeoutMs: 3000,
    env: { PYTHONDONTWRITEBYTECODE: "1" },
  });
  assert.equal(result.exitCode, 7);
  assert.deepEqual(f.calls.command, ["sh", "-c", "echo test"]);
  assert.deepEqual(f.calls.commandParams, {
    workdir: "/work",
    timeoutMs: 3000,
    env: { PYTHONDONTWRITEBYTECODE: "1" },
    stdout: "ignore",
    stderr: "ignore",
  });
  assert.equal(sandbox.activeCpuUsageMs, undefined);
  await sandbox.stop();
  assert.equal(f.calls.terminated, 1);
  assert.deepEqual(f.calls.terminateParams, { wait: true });
  assert.equal(f.calls.closed, 1);
});

test("Modal rejects root images before uploading code and cleans up failed identity probes", async () => {
  const f = modalFixture();
  f.calls.identityExit = 1;
  await assert.rejects(createModalSandbox(env, f.makeClient), /non-root user/);
  assert.equal(f.calls.files.size, 0);
  assert.equal(f.calls.terminated, 1);
  assert.equal(f.calls.closed, 1);
  assert.equal(f.calls.identity.params.timeoutMs, 5000);
  const g = modalFixture();
  g.remote.exec = async () => {
    throw new Error("probe timed out");
  };
  await assert.rejects(
    createModalSandbox(env, g.makeClient),
    /probe timed out/,
  );
  assert.equal(g.calls.terminated, 1);
  assert.equal(g.calls.closed, 1);
});

test("the explicit live Modal command fails when credentials are missing instead of reporting success", () => {
  const childEnv = {
    ...process.env,
    MODAL_TOKEN_ID: "",
    MODAL_TOKEN_SECRET: "",
    PREP_MODAL_IMAGE_ID: "",
  };
  delete childEnv.NODE_TEST_CONTEXT;
  const result = spawnSync(
    process.execPath,
    ["--test", "tests/prep-modal-live.test.mjs"],
    {
      encoding: "utf8",
      env: childEnv,
      timeout: 10000,
    },
  );
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(
    result.stdout + result.stderr,
    /Modal credentials and PREP_MODAL_IMAGE_ID are required/,
  );
});

test("Modal closes client on creation failure and on failed termination", async () => {
  const f = modalFixture();
  f.client.sandboxes.create = async () => {
    throw new Error("quota exhausted");
  };
  await assert.rejects(
    createModalSandbox(env, f.makeClient),
    /quota exhausted/,
  );
  assert.equal(f.calls.closed, 1);
  const g = modalFixture();
  const sandbox = await createModalSandbox(env, g.makeClient);
  g.remote.terminate = async () => {
    throw new Error("disconnected");
  };
  await assert.rejects(sandbox.stop(), /disconnected/);
  assert.equal(g.calls.closed, 1);
});

const problem = {
  id: "example",
  entry: "Solution.doubleValue",
  args: [{ name: "value", type: "long long" }],
  judge: { mode: "method", className: "Solution", method: "doubleValue" },
  origins: ["example"],
};
const cases = [
  {
    id: "visible",
    name: "Visible example",
    kind: "function",
    input: [21],
    expected: 42,
    timeout: 1,
  },
];
function executorFixture({
  result = { actual: 42, timeMs: 1, memoryKb: 1234 },
  exitCode = 0,
  compileCode = 0,
  writeError = null,
} = {}) {
  const calls = { stop: 0, finish: [], commands: [], files: new Map() };
  const sandbox = {
    cwd: "/work",
    python: "/opt/prep/runtime/bin/python",
    activeCpuUsageMs: undefined,
    writeFiles: async (files) => {
      if (writeError) throw writeError;
      for (const f of files) calls.files.set(f.path, f.content);
    },
    readFileToBuffer: async ({ path }) => calls.files.get(path),
    runCommand: async (options) => {
      calls.commands.push(options);
      const compiling = options.args.join(" ").includes("/usr/bin/g++");
      calls.files.set(
        "/work/protocol.json",
        Buffer.from(JSON.stringify(result)),
      );
      calls.files.set("/work/stdout.log", Buffer.from("printed output"));
      calls.files.set(
        "/work/stderr.log",
        Buffer.from(compiling && compileCode ? "invalid C++" : ""),
      );
      return { exitCode: compiling ? compileCode : exitCode };
    },
    stop: async () => {
      calls.stop++;
    },
  };
  const dependencies = {
    provider: () => "modal",
    status: () => ({ available: true }),
    createSandbox: async (provider) => {
      assert.equal(provider, "modal");
      return sandbox;
    },
    begin: async (provider) => ({ id: "usage", provider }),
    finish: async (...args) => {
      calls.finish.push(args);
    },
  };
  return {
    calls,
    sandbox,
    dependencies,
    execute: createExecutor(dependencies),
  };
}

test("shared runner preserves visible Python outputs, resource limits, safe artifact paths, and cleanup", async () => {
  const f = executorFixture();
  const results = await f.execute(
    problem,
    "class Solution: pass",
    "python",
    cases,
    [
      { path: "example/tests/test_original.py", content: "original test" },
      { path: "example/../escape.py", content: "escape" },
      { path: "example/limit.py", content: "override" },
      { path: "other/test.py", content: "unrelated" },
    ],
  );
  assert.equal(results[0].id, cases[0].id);
  assert.equal(results[0].status, "passed");
  assert.equal(results[0].actual, 42);
  assert.equal(results[0].memoryKb, 1234);
  assert.match(results[0].stdout, /printed output/);
  assert.ok(f.calls.files.has("/work/tests/test_original.py"));
  assert.equal(f.calls.files.has("/work/../escape.py"), false);
  assert.match(f.calls.files.get("/work/limit.py").toString(), /RLIMIT_NPROC/);
  assert.match(
    f.calls.commands[0].args.join(" "),
    /timeout --kill-after=1s 1s/,
  );
  assert.match(f.calls.commands[0].args.join(" "), /536870912/);
  assert.equal(f.calls.stop, 1);
  assert.equal(f.calls.finish[0][0].provider, "modal");
  assert.equal(f.calls.finish[0][2], true);
});

test("shared runner compiles C++20 once and preserves unsupported Python-native case explanations", async () => {
  const f = executorFixture();
  const results = await f.execute(problem, "class Solution {};", "cpp", [
    ...cases,
    { id: "native", name: "Original Python test", kind: "pytest" },
  ]);
  assert.equal(f.calls.commands.length, 2);
  assert.match(f.calls.commands[0].args.join(" "), /g\+\+.*-std=c\+\+20/);
  assert.match(f.calls.commands[0].args.join(" "), /1073741824/);
  assert.equal(results[0].status, "passed");
  assert.equal(results[1].status, "unsupported");
  assert.match(results[1].error, /preserved Python test suite/);
  assert.equal(f.calls.stop, 1);
});

test("shared runner preserves detailed wrong-answer, runtime, timeout, and compilation results", async () => {
  for (const [options, expected] of [
    [{ result: { actual: -1 } }, "failed"],
    [
      { result: { actual: null, error: "ValueError: useful detail" } },
      "runtime_error",
    ],
    [{ exitCode: 124 }, "timeout"],
  ]) {
    const f = executorFixture(options);
    const [result] = await f.execute(problem, "code", "python", cases);
    assert.equal(result.status, expected);
    if (expected === "runtime_error")
      assert.match(result.error, /useful detail/);
    if (expected === "timeout")
      assert.match(result.error, /Time limit exceeded/);
    assert.equal(f.calls.stop, 1);
  }
  const f = executorFixture({ compileCode: 1 });
  const [result] = await f.execute(problem, "invalid C++", "cpp", cases);
  assert.equal(result.status, "compilation_error");
  assert.match(result.error, /invalid C\+\+/);
  assert.equal(f.calls.stop, 1);
});

test("shared runner stops and finalizes usage after upload errors, and reserves full usage if stop fails", async () => {
  const f = executorFixture({ writeError: new Error("upload failed") });
  await assert.rejects(
    f.execute(problem, "code", "python", cases),
    /upload failed/,
  );
  assert.equal(f.calls.stop, 1);
  assert.equal(f.calls.finish[0][2], true);
  const g = executorFixture();
  g.sandbox.stop = async () => {
    throw new Error("stop failed");
  };
  await assert.rejects(
    g.execute(problem, "code", "python", cases),
    /stop failed/,
  );
  assert.equal(g.calls.finish[0][2], false);
  const h = executorFixture();
  h.dependencies.createSandbox = async () => {
    throw new Error("quota exhausted");
  };
  await assert.rejects(
    createExecutor(h.dependencies)(problem, "code", "python", cases),
    /quota exhausted/,
  );
  assert.equal(h.calls.finish[0][2], false);
});

test("Modal usage estimates CPU plus memory at Sandbox rates; failures and clock changes stay bounded", () => {
  const started_at = new Date(100000).toISOString();
  const record = { provider: "modal", started_at };
  const normal = usageFinalization(record, 1, true, 110000);
  assert.equal(
    normal.measurement,
    "upper_bound",
    "a Vercel-style CPU counter must never mark Modal cost as measured",
  );
  assert.equal(normal.wall_ms, 10000);
  assert.ok(
    Math.abs(normal.estimated_cost_usd - 10 * MODAL_USD_PER_SECOND) < 1e-12,
  );
  assert.equal(
    usageFinalization(record, undefined, false, 110000).wall_ms,
    240000,
  );
  assert.equal(usageFinalization(record, undefined, true, 99999).wall_ms, 0);
  assert.equal(
    usageFinalization(record, undefined, true, 999999).wall_ms,
    240000,
  );
  const vercel = usageFinalization({ started_at }, 1234, true, 110000);
  assert.equal(vercel.cpu_ms, 1234);
  assert.equal(vercel.measurement, "measured");
  assert.equal(Object.hasOwn(vercel, "estimated_cost_usd"), false);
});
