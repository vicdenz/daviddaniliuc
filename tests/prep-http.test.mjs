import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { gzipSync } from "node:zlib";

const base = process.env.PREP_TEST_URL || "http://localhost:3000";
if (process.env.PREP_TEST_BYPASS) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (url, options = {}) => {
    if (String(url).startsWith(base)) {
      const headers = new Headers(options.headers);
      headers.set("x-vercel-protection-bypass", process.env.PREP_TEST_BYPASS);
      options = { ...options, headers };
    }
    return originalFetch(url, options);
  };
}
const db = createClient(
  process.env.PREP_SUPABASE_URL,
  process.env.PREP_SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } },
);
const id = "prep-test-" + randomUUID();
let cookie = "";
async function call(path, method = "GET", body) {
  const response = await fetch(base + "/prep/api" + path, {
    method,
    headers: { "Content-Type": "application/json", cookie },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  return { response, data };
}
async function run(language, code, mode, caseIds) {
  let { response, data } = await call(`/problems/${id}/run`, "POST", {
    language,
    code,
    mode,
    caseIds,
  });
  assert.equal(response.status, 202, JSON.stringify(data));
  let batches = 0;
  while (data.pending) {
    ({ response, data } = await call(
      `/jobs/${data.jobId}/advance`,
      "POST",
      {},
    ));
    assert.equal(response.status, 200, JSON.stringify(data));
    batches++;
    assert.ok(batches < 10);
  }
  return { ...data, batches };
}

test(
  "hosted prep preserves access controls, visible cases, persistence, and Python/C++ verdicts",
  { timeout: 240000 },
  async () => {
    assert.equal((await fetch(base + "/prep")).status, 200);
    assert.equal((await call("/problems")).response.status, 401);
    const csrf = await fetch(base + "/prep/api/auth/login", {
      method: "POST",
      headers: {
        origin: "https://example.invalid",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: process.env.PREP_PASSWORD }),
    });
    assert.equal(csrf.status, 403);
    assert.equal(
      (await call("/auth/login", "POST", { password: "incorrect" })).response
        .status,
      401,
    );
    const login = await call("/auth/login", "POST", {
      password: process.env.PREP_PASSWORD,
    });
    assert.equal(login.response.status, 200);
    cookie = login.response.headers.get("set-cookie").split(";")[0];
    assert.match(login.response.headers.get("set-cookie"), /HttpOnly/);
    assert.match(login.response.headers.get("set-cookie"), /Path=\/prep/);
    assert.equal((await call("/auth/session")).data.authenticated, true);
    const library = (await call("/problems")).data;
    assert.ok(library.length >= 36);
    assert.ok(library.every((p) => !p.description && !p.starters));

    const problem = {
      id,
      title: "Execution validation",
      languages: ["python", "cpp"],
      entry: "Solution.doubleValue",
      args: [{ name: "value", type: "long long" }],
      judge: {
        mode: "method",
        className: "Solution",
        method: "doubleValue",
        legacyEntry: "doubleValue",
      },
      origins: [id],
      starters: {},
      verification: { status: "provided" },
    };
    const result = await db
      .from("prep_problems")
      .insert({ id, payload: problem });
    assert.equal(result.error, null);
    const cases = Array.from({ length: 6 }, (_, i) => ({
      id: randomUUID(),
      name: `Value ${i}`,
      kind: "function",
      input: [i],
      expected: i * 2,
      timeout: 30,
      provenance: "generated",
    }));
    const native = {
      id: randomUUID(),
      name: "Visible pytest",
      kind: "pytest",
      input:
        "def test_double():\n    from main import Solution\n    assert Solution().doubleValue(3) == 6\n",
      expected: "all assertions pass",
      filename: "test_main.py",
      selector: "test_double",
      timeout: 8,
    };
    try {
      assert.equal(
        (
          await db
            .from("prep_cases")
            .insert(
              [...cases, native].map((c) => ({
                id: c.id,
                problem_id: id,
                payload: c,
              })),
            )
        ).error,
        null,
      );
      assert.equal(
        (
          await db
            .from("prep_artifacts")
            .insert({
              id: randomUUID(),
              problem_id: id,
              path: id + "/test_main.py",
              hash: "fixture",
              content: native.input,
            })
        ).error,
        null,
      );
      const py =
        "class Solution:\n    def doubleValue(self, value):\n        return value * 2\n";
      const cpp =
        "class Solution { public: long long doubleValue(long long value) { return value * 2; } };";
      assert.equal(
        (
          await call(`/problems/${id}/work`, "PUT", {
            language: "python",
            code: py,
          })
        ).response.status,
        200,
      );
      assert.equal(
        (
          await call(`/problems/${id}/progress`, "PUT", {
            notes: "persistent note",
            status: "attempted",
          })
        ).response.status,
        200,
      );
      const saved = (await call(`/problems/${id}`)).data;
      assert.equal(saved.work.python, py);
      assert.equal(saved.progress.notes, "persistent note");
      assert.equal(saved.cases.length, 7);
      assert.ok(saved.cases.every((c) => c.input === undefined));
      assert.deepEqual(
        (await call(`/problems/${id}/cases/${cases[0].id}`)).data.input,
        [0],
      );
      const largeInput = "x".repeat(8 * 1024 * 1024);
      const largeResponse = await fetch(
        base + `/prep/api/problems/${id}/cases`,
        {
          method: "POST",
          headers: {
            cookie,
            "Content-Type": "application/json",
            "Content-Encoding": "gzip",
          },
          body: gzipSync(
            JSON.stringify({
              name: "Large visible input",
              kind: "function",
              input: [largeInput],
              expected: 1,
            }),
          ),
        },
      );
      assert.equal(largeResponse.status, 200);
      const [largeCase] = await largeResponse.json();
      const inspected = await call(`/problems/${id}/cases/${largeCase.id}`);
      assert.equal(inspected.response.headers.get("content-encoding"), "gzip");
      assert.equal(inspected.data.input[0], largeInput);
      await call(`/problems/${id}/cases/${largeCase.id}`, "DELETE");
      const prepared = await call(`/problems/${id}/prepare`, "POST", {
        code: "def doubleValue(value):\n    return value * 2\n",
        language: "python",
      });
      assert.equal(
        prepared.response.status,
        200,
        JSON.stringify(prepared.data),
      );
      assert.match(prepared.data.code, /class Solution/);
      const submit = await run("python", py, "submit", [cases[0].id]);
      assert.equal(submit.total, 7); // Submit ignores a restricted selection.
      assert.equal(submit.accepted, true, JSON.stringify(submit));
      assert.ok(submit.batches >= 2);
      assert.equal(submit.results.length, 7);
      assert.equal(
        (await call(`/problems/${id}`)).data.progress.status,
        "solved",
      );
      const cxx = await run("cpp", cpp, "run", [cases[0].id]);
      assert.equal(cxx.accepted, true, JSON.stringify(cxx));
      const unsupported = await run("cpp", cpp, "run", [native.id]);
      assert.equal(unsupported.results[0].status, "unsupported");
      assert.match(unsupported.results[0].error, /Python/);
      const compilation = await run(
        "cpp",
        "class Solution { invalid syntax };",
        "run",
        [cases[0].id],
      );
      assert.equal(compilation.results[0].status, "compilation_error");
      assert.ok(compilation.results[0].error);
      const runtime = await run(
        "python",
        "raise ValueError('visible failure')",
        "run",
        [cases[0].id],
      );
      assert.equal(runtime.results[0].status, "runtime_error");
      assert.match(runtime.results[0].error, /visible failure/);
      const wrong = await run(
        "python",
        "class Solution:\n    def doubleValue(self,value): return -1",
        "run",
        [cases[0].id],
      );
      assert.equal(wrong.results[0].status, "failed");
      assert.equal(wrong.results[0].actual, -1);
      const created = await call(`/problems/${id}/cases`, "POST", {
        name: "Timeout",
        kind: "function",
        input: [1],
        expected: 2,
        timeout: 0.2,
      });
      assert.equal(created.response.status, 200);
      const extra = created.data[0];
      const timed = await run("python", "while True: pass", "run", [extra.id]);
      assert.equal(timed.results[0].status, "timeout", JSON.stringify(timed));
      const edited = await call(`/problems/${id}/cases/${extra.id}`, "PUT", {
        ...extra,
        name: "Edited timeout",
        timeout: 1,
      });
      assert.equal(edited.data.provenance, "user-edited");
      assert.equal(
        (await call(`/problems/${id}/cases/${extra.id}`, "DELETE")).data
          .deleted,
        true,
      );
      assert.equal(
        (await call(`/problems/${id}/cases/${extra.id}`)).response.status,
        404,
      );
      assert.equal(
        (await call(`/submissions/${submit.submissionId}`)).data.content,
        py,
      );
      assert.equal((await call(`/problems/${id}/export`)).data.cases.length, 7);
      await call("/auth/logout", "POST", {});
      assert.equal((await call("/problems")).response.status, 401);
    } finally {
      for (const t of [
        "jobs",
        "submissions",
        "work",
        "progress",
        "artifacts",
        "cases",
      ]) {
        const r = await db
          .from("prep_" + t)
          .delete()
          .eq("problem_id", id);
        assert.equal(r.error, null);
      }
      assert.equal(
        (await db.from("prep_problems").delete().eq("id", id)).error,
        null,
      );
    }
  },
);
