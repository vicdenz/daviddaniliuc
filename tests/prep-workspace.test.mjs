import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createSaveQueue } from "../prep/src/save-queue.mjs";

const source = readFileSync(
  new URL("../prep/src/main.jsx", import.meta.url),
  "utf8",
);
// Exercise the actual handlers with deferred I/O and React state setters, without
// needing Monaco, a browser, or a live database for these scheduling regressions.
function handler(start, end, dependencies) {
  const offset = source.indexOf(start);
  assert.notEqual(offset, -1);
  const boundary = source.indexOf(end, offset);
  assert.notEqual(boundary, -1);
  const expression = source.slice(offset, boundary);
  return new Function(...Object.keys(dependencies), `return (${expression});`)(
    ...Object.values(dependencies),
  );
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
const tick = () => new Promise((resolve) => setImmediate(resolve));

function editor() {
  const requests = [],
    drafts = new Map([["prep-draft:A:python", "older"]]);
  const state = { saved: null, error: null };
  const dependencies = {
    saveQueue: { current: createSaveQueue() },
    send: (_url, payload) => {
      const request = { ...deferred(), payload };
      requests.push(request);
      return request.promise;
    },
    getDraft: (key) => drafts.get(key) ?? null,
    removeDraft: (key) => drafts.delete(key),
    currentId: { current: "A" },
    languageRef: { current: "python" },
    codeRef: { current: "older" },
    dirty: { current: true },
    setSaveState: (value) => {
      state.saved = value;
    },
    setError: (value) => {
      state.error = value;
    },
  };
  const persist = handler(
    "async (id, lang, text) => {",
    ", []);",
    dependencies,
  );
  return { persist, requests, drafts, state, ...dependencies };
}

test("new edits wait for the older save and retain their recovery draft until acknowledged", async () => {
  const e = editor();
  const oldSave = e.persist("A", "python", "older");
  await tick();
  e.codeRef.current = "newer";
  e.drafts.set("prep-draft:A:python", "newer");
  const newSave = e.persist("A", "python", "newer");
  await tick();
  assert.equal(
    e.requests.length,
    1,
    "new save must not overtake an in-flight request",
  );
  e.requests[0].resolve();
  await oldSave;
  await tick();
  assert.equal(e.dirty.current, true);
  assert.equal(e.state.saved, null);
  assert.equal(e.drafts.get("prep-draft:A:python"), "newer");
  assert.equal(e.requests[1].payload.code, "newer");
  e.requests[1].resolve();
  await newSave;
  assert.equal(e.dirty.current, false);
  assert.equal(e.drafts.size, 0);
  assert.equal(e.state.saved, "Saved locally");
});

test("a failed older save does not block the newest save or discard its draft", async () => {
  const e = editor();
  const oldSave = e.persist("A", "python", "older");
  const failure = assert.rejects(oldSave, /offline/);
  await tick();
  e.codeRef.current = "newer";
  e.drafts.set("prep-draft:A:python", "newer");
  const newSave = e.persist("A", "python", "newer");
  e.requests[0].reject(new Error("offline"));
  await failure;
  await tick();
  assert.equal(e.drafts.get("prep-draft:A:python"), "newer");
  e.requests[1].resolve();
  await newSave;
  assert.equal(e.dirty.current, false);
});

test("late saves cannot mark another problem or language as saved", async () => {
  for (const target of ["problem", "language"]) {
    const e = editor();
    const saved = e.persist("A", "python", "older");
    await tick();
    if (target === "problem") e.currentId.current = "B";
    else e.languageRef.current = "cpp";
    e.requests[0].resolve();
    await saved;
    assert.equal(e.dirty.current, true);
    assert.equal(e.state.saved, null);
  }
});

test("save queues isolate buffers so one slow problem does not block another", async () => {
  const enqueue = createSaveQueue(),
    slow = deferred();
  const first = enqueue("A:python", () => slow.promise);
  assert.equal(await enqueue("B:cpp", async () => "saved B"), "saved B");
  slow.resolve();
  await first;
});

function runner() {
  const state = {
    problem: { id: "A", progress: { status: "todo" }, submissions: [] },
    result: null,
    error: "",
    running: false,
  };
  const request = deferred(),
    flushRequest = deferred(),
    sent = [];
  const dependencies = {
    problem: state.problem,
    runningRef: { current: false },
    currentId: { current: "A" },
    languageRef: { current: "python" },
    codeRef: { current: "solution A" },
    flush: () => flushRequest.promise,
    setRunning: (value) => {
      state.running = value;
    },
    setRunningMode: () => {},
    setCaseTab: () => {},
    setError: (value) => {
      state.error = value;
    },
    send: (url, payload) => {
      sent.push({ url, payload });
      return request.promise;
    },
    setResult: (value) => {
      state.result = value;
    },
    setProblem: (update) => {
      state.problem = update(state.problem);
    },
    refresh: () => {},
  };
  const run = handler(
    "async function run(",
    "\n  useEffect(() => {",
    dependencies,
  );
  return { run, state, request, flushRequest, sent, ...dependencies };
}

test("finishing problem A after switching to B leaves B's results and status untouched", async () => {
  const r = runner();
  const task = r.run("submit");
  r.flushRequest.resolve();
  await tick();
  const problemB = { id: "B", progress: { status: "todo" }, submissions: [] };
  r.state.problem = problemB;
  r.currentId.current = "B";
  const resultB = { results: ["B"] };
  r.state.result = resultB;
  r.request.resolve({ accepted: true, submissionId: 123 });
  await task;
  assert.equal(r.state.problem, problemB);
  assert.equal(r.state.result, resultB);
  assert.equal(r.state.running, false);
});

test("run snapshots code and language before awaiting saves and rejects duplicate starts", async () => {
  const r = runner();
  const task = r.run("submit");
  await r.run("submit");
  r.codeRef.current = "newer code";
  r.languageRef.current = "cpp";
  r.flushRequest.resolve();
  await tick();
  assert.equal(r.sent.length, 1);
  assert.equal(r.sent[0].payload.code, "solution A");
  assert.equal(r.sent[0].payload.language, "python");
  const result = { accepted: true, submissionId: 123 };
  r.request.resolve(result);
  await task;
  assert.equal(r.state.problem.progress.status, "solved");
  assert.equal(r.state.problem.submissions[0].language, "python");
  assert.equal(r.state.result, result);
  assert.equal(r.runningRef.current, false);
});

test("save failures release the run lock, and errors from A do not appear on B", async () => {
  const r = runner();
  const task = r.run("submit");
  r.currentId.current = "B";
  r.flushRequest.reject(new Error("save failed"));
  await task;
  assert.equal(r.sent.length, 0);
  assert.equal(r.runningRef.current, false);
  assert.equal(r.state.running, false);
  assert.equal(r.state.error, "");
});

test("notes use the same ordered-save protection and preserve newer drafts", async () => {
  const requests = [],
    draft = { value: "older" };
  const dependencies = {
    saveQueue: { current: createSaveQueue() },
    send: (_url, payload) => {
      const request = { ...deferred(), payload };
      requests.push(request);
      return request.promise;
    },
    getDraft: () => draft.value,
    removeDraft: () => {
      draft.value = null;
    },
    currentId: { current: "A" },
    notesRef: { current: "older" },
    noteDirty: { current: true },
  };
  const save = handler(
    "async function persistNotes(",
    "\n  async function flush(",
    dependencies,
  );
  const older = save("A", "older");
  await tick();
  draft.value = "newer";
  dependencies.notesRef.current = "newer";
  const newer = save("A", "newer", "solved");
  await tick();
  assert.equal(requests.length, 1);
  requests[0].resolve();
  await older;
  await tick();
  assert.equal(draft.value, "newer");
  assert.equal(dependencies.noteDirty.current, true);
  assert.deepEqual(requests[1].payload, { notes: "newer", status: "solved" });
  requests[1].resolve();
  await newer;
  assert.equal(draft.value, null);
  assert.equal(dependencies.noteDirty.current, false);
});

test("switching languages recovers an unsaved C++ draft and keeps it available after switching back", async () => {
  const dependencies = {
    flush: async () => {},
    languageRef: { current: "python" },
    setLanguage: () => {},
    getDraft: () => "recovered C++",
    problem: { id: "A", starters: { cpp: "starter" } },
    workRef: { current: { cpp: "older server code" } },
    dirty: { current: false },
    setSaveState: () => {},
    codeRef: { current: "" },
    setCode: () => {},
  };
  const change = handler(
    "async function changeLanguage(",
    "\n  async function openProblem(",
    dependencies,
  );
  await change("cpp");
  assert.equal(dependencies.codeRef.current, "recovered C++");
  assert.equal(dependencies.workRef.current.cpp, "recovered C++");
  assert.equal(dependencies.dirty.current, true);
});
