import express from "express";
import { config } from "./config.mjs";
import { installAuth } from "./auth.mjs";
import { randomUUID, createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { base, openDb, decode } from "./db.mjs";
import { execute, sandboxInfo, prepareCode } from "./executor.mjs";
export function createApp(db = openDb(), options = {}) {
  const settings = { ...config, ...options };
  const app = express();
  let busy = false;
  // A trusted local reverse proxy may serve the app at a secret website path.
  if (settings.publicOrigin) app.set("trust proxy", "loopback");
  app.use((req, res, next) => {
    res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
    res.setHeader("Referrer-Policy", "same-origin");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    if (settings.basePath) {
      if (req.path === settings.basePath)
        return res.redirect(308, settings.basePath + "/");
      if (!req.path.startsWith(settings.basePath + "/"))
        return res.sendStatus(404);
      req.url = req.url.slice(settings.basePath.length);
    }
    next();
  });
  app.disable("x-powered-by");
  app.use(express.json({ limit: "32mb" }));
  app.use("/api", (req, res, next) => {
    const host = req.hostname;
    if (
      ![
        "127.0.0.1",
        "localhost",
        "::1",
        ...(settings.allowedHosts || []),
        ...(settings.publicOrigin
          ? [new URL(settings.publicOrigin).hostname]
          : []),
      ].includes(host)
    )
      return res.status(403).json({ error: "Local access only." });
    if (req.headers.origin) {
      try {
        const origin = new URL(req.headers.origin).origin;
        const allowed = settings.publicOrigin
          ? [settings.publicOrigin]
          : [
              `http://${req.headers.host}`,
              "http://127.0.0.1:5173",
              "http://localhost:5173",
            ];
        if (!allowed.includes(origin))
          return res
            .status(403)
            .json({ error: "Cross-origin requests are not allowed." });
      } catch {
        return res.sendStatus(403);
      }
    }
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  installAuth(app, db, settings);
  const problem = (id) =>
    decode(db.prepare("SELECT payload FROM problems WHERE id=?").get(id));
  const cases = (id) =>
    db
      .prepare(
        "SELECT payload FROM cases WHERE problem_id=? AND deleted=0 ORDER BY rowid",
      )
      .all(id)
      .map(decode);
  const artifacts = (id) =>
    db
      .prepare(
        "SELECT id,path,hash,content FROM artifacts WHERE problem_id=? ORDER BY path",
      )
      .all(id);
  app.get("/api/health", (req, res) =>
    res.json({ ok: true, sandbox: sandboxInfo() }),
  );
  app.get("/api/problems", (req, res) => {
    const rows = db
      .prepare(
        "SELECT p.payload,coalesce(s.status,'todo') status,coalesce(s.notes,'') notes FROM problems p LEFT JOIN progress s ON s.problem_id=p.id ORDER BY json_extract(p.payload,'$.title')",
      )
      .all();
    res.json(
      rows.map((r) => {
        const p = decode(r);
        return {
          ...p,
          starters: undefined,
          description: undefined,
          status: r.status,
          notes: r.notes,
          testCount: db
            .prepare(
              "SELECT count(*) n FROM cases WHERE problem_id=? AND deleted=0",
            )
            .get(p.id).n,
        };
      }),
    );
  });
  app.get("/api/problems/:id", (req, res) => {
    const p = problem(req.params.id);
    if (!p) return res.status(404).json({ error: "Problem not found" });
    res.json({
      ...p,
      cases: cases(p.id).map((c) => ({
        ...c,
        input: undefined,
        expected: undefined,
      })),
      work: Object.fromEntries(
        db
          .prepare("SELECT language,code FROM work WHERE problem_id=?")
          .all(p.id)
          .map((r) => [r.language, r.code]),
      ),
      progress: db
        .prepare("SELECT notes,status FROM progress WHERE problem_id=?")
        .get(p.id) || { notes: "", status: "todo" },
      artifacts: artifacts(p.id).map((a) => ({ ...a, content: undefined })),
      submissions: db
        .prepare(
          "SELECT id,language,mode,created,result FROM submissions WHERE problem_id=? ORDER BY id DESC LIMIT 30",
        )
        .all(p.id)
        .map((r) => ({ ...r, result: JSON.parse(r.result) })),
    });
  });
  app.post("/api/problems/:id/prepare", async (req, res) => {
    const p = problem(req.params.id);
    if (!p) return res.status(404).json({ error: "Problem not found" });
    if (typeof req.body.code !== "string" || req.body.code.length > 1024 * 1024)
      return res
        .status(400)
        .json({ error: "Code must be a string under 1 MB." });
    try {
      res.json({
        code: await prepareCode(p, req.body.code, req.body.language),
      });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });
  app.get("/api/problems/:id/cases/:caseId", (req, res) => {
    const c = decode(
      db
        .prepare(
          "SELECT payload FROM cases WHERE id=? AND problem_id=? AND deleted=0",
        )
        .get(req.params.caseId, req.params.id),
    );
    if (!c) return res.sendStatus(404);
    res.json(c);
  });
  app.get("/api/problems/:id/export", (req, res) => {
    const p = problem(req.params.id);
    if (!p) return res.sendStatus(404);
    res.setHeader("Content-Disposition", `attachment; filename="${p.id}.json"`);
    res.json({
      problem: p,
      cases: cases(p.id),
      artifacts: artifacts(p.id),
      progress: db
        .prepare("SELECT * FROM progress WHERE problem_id=?")
        .get(p.id),
      work: db.prepare("SELECT * FROM work WHERE problem_id=?").all(p.id),
    });
  });
  app.get("/api/submissions/:id", (req, res) => {
    const row = db
      .prepare("SELECT * FROM submissions WHERE id=?")
      .get(req.params.id);
    if (!row) return res.sendStatus(404);
    res.json({
      type: "submission",
      path: `Submission #${row.id} · ${row.language}`,
      content: row.code,
      language: row.language,
      hash: createHash("sha256").update(row.code).digest("hex"),
    });
  });
  app.get("/api/artifacts/:id", (req, res) => {
    const a = db
      .prepare("SELECT * FROM artifacts WHERE id=?")
      .get(req.params.id);
    if (!a) return res.sendStatus(404);
    res.json({
      ...a,
      language: /\.py$/.test(a.path)
        ? "python"
        : /\.(cpp|cc|hpp|h)$/.test(a.path)
          ? "cpp"
          : undefined,
    });
  });
  app.put("/api/problems/:id/work", (req, res) => {
    const p = problem(req.params.id);
    if (!p) return res.sendStatus(404);
    const { language, code } = req.body;
    if (
      !p.languages.includes(language) ||
      typeof code !== "string" ||
      code.length > 2000000
    )
      return res.status(400).json({ error: "Invalid language or code" });
    db.prepare(
      "INSERT INTO work(problem_id,language,code) VALUES (?,?,?) ON CONFLICT(problem_id,language) DO UPDATE SET code=excluded.code,updated=CURRENT_TIMESTAMP",
    ).run(p.id, language, code);
    db.prepare(
      "INSERT INTO progress(problem_id,status) VALUES (?,'attempted') ON CONFLICT(problem_id) DO UPDATE SET status=CASE WHEN progress.status='todo' THEN 'attempted' ELSE progress.status END",
    ).run(p.id);
    res.json({ saved: true });
  });
  app.put("/api/problems/:id/progress", (req, res) => {
    if (!problem(req.params.id)) return res.sendStatus(404);
    const notes = req.body.notes;
    const status =
      req.body.status ??
      db
        .prepare("SELECT status FROM progress WHERE problem_id=?")
        .get(req.params.id)?.status ??
      "todo";
    if (
      typeof notes !== "string" ||
      notes.length > 1000000 ||
      !["todo", "attempted", "solved"].includes(status)
    )
      return res.status(400).json({ error: "Invalid progress" });
    db.prepare(
      "INSERT INTO progress(problem_id,notes,status) VALUES (?,?,?) ON CONFLICT(problem_id) DO UPDATE SET notes=excluded.notes,status=excluded.status,updated=CURRENT_TIMESTAMP",
    ).run(req.params.id, notes, status);
    res.json({ saved: true });
  });
  function validateCase(c) {
    if (
      typeof c.name !== "string" ||
      !c.name.trim() ||
      !["function", "pytest", "unittest"].includes(c.kind)
    )
      throw new Error("A test needs a name and supported kind.");
    if (c.kind === "function" && !Array.isArray(c.input))
      throw new Error(
        "Function input must be a JSON array of positional arguments.",
      );
    if (!Object.hasOwn(c, "expected"))
      throw new Error("Expected output is required.");
    if (c.kind !== "function" && typeof c.input !== "string")
      throw new Error("Native test input must be Python source.");
    if (
      c.timeout !== undefined &&
      (!Number.isFinite(c.timeout) || c.timeout < 0.1 || c.timeout > 30)
    )
      throw new Error("Test time limit must be 0.1–30 seconds.");
  }
  app.post("/api/problems/:id/cases", (req, res) => {
    if (!problem(req.params.id)) return res.sendStatus(404);
    const list = Array.isArray(req.body) ? req.body : [req.body];
    if (list.length > 2000)
      return res
        .status(400)
        .json({ error: "Import at most 2,000 tests at a time." });
    try {
      for (const c of list) validateCase(c);
      const added = [];
      db.exec("BEGIN");
      for (const raw of list) {
        const c = {
          ...raw,
          id: randomUUID(),
          provenance: "user",
          sourceVerified: false,
          origin: "User-created",
          timeout: raw.timeout || 8,
        };
        db.prepare(
          "INSERT INTO cases(id,problem_id,payload,edited) VALUES (?,?,?,1)",
        ).run(c.id, req.params.id, JSON.stringify(c));
        added.push(c);
      }
      db.exec("COMMIT");
      res.json(added);
    } catch (e) {
      if (db.isTransaction) db.exec("ROLLBACK");
      res.status(400).json({ error: e.message });
    }
  });
  app.put("/api/problems/:id/cases/:caseId", (req, res) => {
    const old = decode(
      db
        .prepare(
          "SELECT payload FROM cases WHERE id=? AND problem_id=? AND deleted=0",
        )
        .get(req.params.caseId, req.params.id),
    );
    if (!old) return res.sendStatus(404);
    try {
      const c = {
        ...old,
        ...req.body,
        id: old.id,
        kind: old.kind,
        provenance: "user-edited",
        sourceVerified: false,
        editedSource: old.kind !== "function",
      };
      validateCase(c);
      db.prepare("UPDATE cases SET payload=?,edited=1 WHERE id=?").run(
        JSON.stringify(c),
        old.id,
      );
      res.json(c);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });
  app.delete("/api/problems/:id/cases/:caseId", (req, res) => {
    const r = db
      .prepare("UPDATE cases SET deleted=1 WHERE id=? AND problem_id=?")
      .run(req.params.caseId, req.params.id);
    res.json({ deleted: r.changes > 0 });
  });
  app.post("/api/problems/:id/run", async (req, res) => {
    const p = problem(req.params.id);
    if (!p) return res.sendStatus(404);
    const { language, code, mode = "run", caseIds } = req.body;
    if (
      !p.languages.includes(language) ||
      typeof code !== "string" ||
      code.length > 2000000 ||
      !["run", "submit"].includes(mode)
    )
      return res.status(400).json({ error: "Invalid execution request" });
    if (busy)
      return res.status(409).json({
        error: "An execution is already running. Please wait for it to finish.",
      });
    const all = cases(p.id);
    const selected =
      mode === "submit"
        ? all
        : caseIds
          ? all.filter((c) => caseIds.includes(c.id))
          : all;
    if (!selected.length)
      return res
        .status(400)
        .json({ error: "No tests selected. Add a visible test case first." });
    busy = true;
    try {
      const results = await execute(
        p,
        code,
        language,
        selected,
        artifacts(p.id),
      );
      const result = {
        results,
        passed: results.filter((r) => r.status === "passed").length,
        total: results.length,
        accepted: results.every((r) => r.status === "passed"),
        language,
        mode,
      };
      const saved = db
        .prepare(
          "INSERT INTO submissions(problem_id,language,code,mode,result) VALUES (?,?,?,?,?)",
        )
        .run(p.id, language, code, mode, JSON.stringify(result));
      db.prepare(
        "INSERT INTO work(problem_id,language,code) VALUES (?,?,?) ON CONFLICT(problem_id,language) DO UPDATE SET code=excluded.code,updated=CURRENT_TIMESTAMP",
      ).run(p.id, language, code);
      db.prepare(
        "INSERT INTO progress(problem_id,status) VALUES (?,?) ON CONFLICT(problem_id) DO UPDATE SET status=CASE WHEN excluded.status='solved' THEN 'solved' WHEN progress.status='todo' THEN 'attempted' ELSE progress.status END",
      ).run(
        p.id,
        mode === "submit" && result.accepted ? "solved" : "attempted",
      );
      res.json({ ...result, submissionId: Number(saved.lastInsertRowid) });
    } catch (e) {
      res.status(503).json({ error: e.message });
    } finally {
      busy = false;
    }
  });
  app.get("/api/migration", async (req, res) =>
    res.json(
      JSON.parse(
        await readFile(path.join(base, "data/migration-report.json"), "utf8"),
      ),
    ),
  );
  const staticDir = options.staticDir || path.join(base, "dist");
  if (existsSync(staticDir)) {
    app.use(express.static(staticDir));
    app.get("/{*path}", (req, res) =>
      res.sendFile(path.join(staticDir, "index.html")),
    );
  }
  app.use((err, req, res, next) =>
    res.status(400).json({ error: err.message }),
  );
  return app;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const port = Number(process.env.PORT || 4310);
  createApp().listen(port, "127.0.0.1", () =>
    console.log(`davidprep: http://127.0.0.1:${port}${config.basePath}/`),
  );
}
