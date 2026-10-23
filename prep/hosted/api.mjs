import { createClient } from "@supabase/supabase-js";
import {
  createHash,
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";
import { execute, prepareCode } from "./executor.mjs";

let client;
const hash = (s) => createHash("sha256").update(s).digest("hex");
const lifetime = 400 * 24 * 60 * 60 * 1000;
const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};
const db = () => {
  if (!process.env.PREP_SUPABASE_URL || !process.env.PREP_SUPABASE_SECRET_KEY)
    fail("Prep storage is not configured.", 503);
  return (client ??= createClient(
    process.env.PREP_SUPABASE_URL,
    process.env.PREP_SUPABASE_SECRET_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  ));
};
const checked = async (query) => {
  const r = await query;
  if (r.error) fail(r.error.message, 503);
  return r.data;
};
const table = (name) => db().from("prep_" + name);
const getProblem = async (id) => {
  const row = await checked(
    table("problems").select("payload").eq("id", id).maybeSingle(),
  );
  if (!row) fail("Problem not found.", 404);
  return row.payload;
};
const getCases = async (id, summaries = false) => {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const page = await checked(
      table(summaries ? "case_summaries" : "cases")
        .select("payload")
        .eq("problem_id", id)
        .eq("deleted", false)
        .order("position")
        .range(offset, offset + 999),
    );
    rows.push(...page.map((r) => r.payload));
    if (page.length < 1000) return rows;
  }
};
const artifacts = (id, content = false) =>
  checked(
    table("artifacts")
      .select(content ? "*" : "id,path,hash")
      .eq("problem_id", id)
      .order("path"),
  );
const getProgress = async (id) =>
  (await checked(
    table("progress").select("notes,status").eq("problem_id", id).maybeSingle(),
  )) || { notes: "", status: "todo" };
function validateCase(c) {
  if (
    typeof c.name !== "string" ||
    !c.name.trim() ||
    !["function", "pytest", "unittest"].includes(c.kind)
  )
    fail("A test needs a name and supported kind.");
  if (c.kind === "function" && !Array.isArray(c.input))
    fail("Function input must be a JSON array of positional arguments.");
  if (!Object.hasOwn(c, "expected")) fail("Expected output is required.");
  if (c.kind !== "function" && typeof c.input !== "string")
    fail("Native test input must be Python source.");
  if (
    c.timeout !== undefined &&
    (!Number.isFinite(c.timeout) || c.timeout < 0.1 || c.timeout > 30)
  )
    fail("Test time limit must be 0.1–30 seconds.");
}

export async function handle(request) {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
  });
  const reply = (data, status = 200) => {
    const body = JSON.stringify(data);
    if (Buffer.byteLength(body) > 128000) {
      headers.set("Content-Encoding", "gzip");
      headers.set("Vary", "Accept-Encoding");
      return new Response(gzipSync(body), { status, headers });
    }
    return new Response(body, { status, headers });
  };
  try {
    const url = new URL(request.url);
    const route = url.pathname
      .replace(/^\/prep\/api\/?/, "")
      .split("/")
      .filter(Boolean)
      .map(decodeURIComponent);
    const method = request.method;
    if (!["GET", "HEAD"].includes(method)) {
      const origin = request.headers.get("origin");
      if (origin && origin !== url.origin)
        fail("Cross-origin requests are not allowed.", 403);
      if (Number(request.headers.get("content-length") || 0) > 4 * 1024 * 1024)
        fail("Request is too large.", 413);
    }
    let body = {};
    if (["POST", "PUT"].includes(method)) {
      const raw = Buffer.from(await request.arrayBuffer());
      if (raw.length > 4 * 1024 * 1024) fail("Request is too large.", 413);
      try {
        body = JSON.parse(
          (request.headers.get("content-encoding") === "gzip"
            ? gunzipSync(raw, { maxOutputLength: 32 * 1024 * 1024 })
            : raw
          ).toString("utf8"),
        );
      } catch {
        fail("Invalid JSON or request larger than 32 MB.");
      }
    }
    const password = process.env.PREP_PASSWORD,
      secret = process.env.PREP_SESSION_SECRET;
    if (!password || !secret || secret.length < 32)
      fail("Prep authentication is not configured.", 503);
    const version = hash(password + "\0" + secret);
    const secure = url.protocol === "https:";
    const cookieName = secure ? "__Secure-prep_session" : "prep_session";
    const cookie = (token, age = lifetime) =>
      `${cookieName}=${token}; Path=/prep; HttpOnly; SameSite=Strict; Max-Age=${Math.floor(age / 1000)}${secure ? "; Secure" : ""}`;
    const token = (request.headers.get("cookie") || "")
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith(cookieName + "="))
      ?.slice(cookieName.length + 1);
    let session = null;
    if (token && /^[a-f0-9]{64}$/.test(token))
      session = await checked(
        table("auth_sessions")
          .select("token_hash")
          .eq("token_hash", hash(token))
          .eq("password_version", version)
          .gt("expires", Date.now())
          .maybeSingle(),
      );
    if (route.join("/") === "auth/login" && method === "POST") {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
      const clientKey = hash(ip + secret);
      const allowed = await checked(
        db().rpc("prep_login_attempt", { client_key: clientKey }),
      );
      if (!allowed) {
        headers.set("Retry-After", "900");
        fail("Too many attempts. Try again in 15 minutes.", 429);
      }
      const candidate = scryptSync(
        typeof body.password === "string" && body.password.length <= 1024
          ? body.password
          : "",
        secret,
        32,
      );
      if (!timingSafeEqual(candidate, scryptSync(password, secret, 32)))
        fail("Incorrect password.", 401);
      await checked(table("auth_attempts").delete().eq("client", clientKey));
      const next = randomBytes(32).toString("hex");
      await checked(
        table("auth_sessions").insert({
          token_hash: hash(next),
          password_version: version,
          expires: Date.now() + lifetime,
        }),
      );
      headers.append("Set-Cookie", cookie(next));
      return reply({ authenticated: true });
    }
    if (route.join("/") === "auth/logout" && method === "POST") {
      if (session)
        await checked(
          table("auth_sessions").delete().eq("token_hash", session.token_hash),
        );
      headers.append("Set-Cookie", cookie("", 0));
      return reply({ authenticated: false });
    }
    if (session) {
      await checked(
        table("auth_sessions")
          .update({ expires: Date.now() + lifetime })
          .eq("token_hash", session.token_hash),
      );
      headers.append("Set-Cookie", cookie(token));
    }
    if (route.join("/") === "auth/session" && method === "GET")
      return reply({ authenticated: !!session });
    if (!session) fail("Sign in to continue.", 401);
    if (route[0] === "health")
      return reply({
        ok: true,
        sandbox: {
          backend: "Vercel Sandbox",
          available: !!process.env.PREP_CPP_SNAPSHOT_ID,
        },
      });
    if (route[0] === "migration") {
      const row = await checked(
        table("settings")
          .select("value")
          .eq("key", "migration_report")
          .maybeSingle(),
      );
      return reply(
        row?.value || {
          folders: 35,
          uniqueProblems: 36,
          totalCases: 1244,
          artifacts: 239,
          duplicates: [],
        },
      );
    }
    if (route[0] === "artifacts" && method === "GET") {
      const row = await checked(
        table("artifacts").select("*").eq("id", route[1]).maybeSingle(),
      );
      if (!row) fail("Source not found.", 404);
      return reply({
        ...row,
        language: /\.py$/.test(row.path)
          ? "python"
          : /\.(cpp|cc|hpp|h)$/.test(row.path)
            ? "cpp"
            : undefined,
      });
    }
    if (route[0] === "submissions" && method === "GET") {
      const row = await checked(
        table("submissions").select("*").eq("id", route[1]).maybeSingle(),
      );
      if (!row) fail("Submission not found.", 404);
      return reply({
        type: "submission",
        path: `Submission #${row.id} · ${row.language}`,
        content: row.code,
        language: row.language,
        hash: hash(row.code),
      });
    }
    if (route[0] === "jobs" && route[2] === "advance" && method === "POST")
      return reply(await advanceJob(route[1]));
    if (route[0] !== "problems") fail("Not found.", 404);
    if (!route[1] && method === "GET") {
      const [problems, progress, counts] = await Promise.all([
        checked(table("problems").select("id,payload")),
        checked(table("progress").select("*")),
        checked(table("case_counts").select("*")),
      ]);
      return reply(
        problems
          .map(({ id, payload: p }) => ({
            ...p,
            starters: undefined,
            description: undefined,
            status: progress.find((s) => s.problem_id === id)?.status || "todo",
            notes: progress.find((s) => s.problem_id === id)?.notes || "",
            testCount: counts.find((c) => c.problem_id === id)?.count || 0,
          }))
          .sort((a, b) => a.title.localeCompare(b.title)),
      );
    }
    const p = await getProblem(route[1]);
    if (route.length === 2 && method === "GET") {
      const [cases, work, progress, sources, submissions] = await Promise.all([
        getCases(p.id, true),
        checked(table("work").select("language,code").eq("problem_id", p.id)),
        getProgress(p.id),
        artifacts(p.id),
        checked(
          table("submissions")
            .select("id,language,mode,created,result")
            .eq("problem_id", p.id)
            .order("id", { ascending: false })
            .limit(30),
        ),
      ]);
      return reply({
        ...p,
        cases,
        work: Object.fromEntries(work.map((r) => [r.language, r.code])),
        progress,
        artifacts: sources,
        submissions,
      });
    }
    if (route[2] === "export" && method === "GET") {
      headers.set("Content-Disposition", `attachment; filename="${p.id}.json"`);
      return reply({
        problem: p,
        cases: await getCases(p.id),
        artifacts: await artifacts(p.id, true),
        progress: await getProgress(p.id),
        work: await checked(table("work").select("*").eq("problem_id", p.id)),
      });
    }
    if (route[2] === "prepare" && method === "POST") {
      if (typeof body.code !== "string" || body.code.length > 1000000)
        fail("Code must be a string under 1 MB.");
      return reply({ code: await prepareCode(p, body.code, body.language) });
    }
    if (route[2] === "work" && method === "PUT") {
      if (
        !p.languages.includes(body.language) ||
        typeof body.code !== "string" ||
        body.code.length > 2000000
      )
        fail("Invalid language or code.");
      await checked(
        table("work").upsert({
          problem_id: p.id,
          language: body.language,
          code: body.code,
          updated: new Date().toISOString(),
        }),
      );
      const progress = await getProgress(p.id);
      if (progress.status === "todo")
        await checked(
          table("progress").upsert({
            problem_id: p.id,
            ...progress,
            status: "attempted",
          }),
        );
      return reply({ saved: true });
    }
    if (route[2] === "progress" && method === "PUT") {
      const old = await getProgress(p.id),
        status = body.status ?? old.status;
      if (
        typeof body.notes !== "string" ||
        body.notes.length > 1000000 ||
        !["todo", "attempted", "solved"].includes(status)
      )
        fail("Invalid progress.");
      await checked(
        table("progress").upsert({
          problem_id: p.id,
          notes: body.notes,
          status,
          updated: new Date().toISOString(),
        }),
      );
      return reply({ saved: true });
    }
    if (route[2] === "cases") {
      if (!route[3] && method === "POST") {
        const list = Array.isArray(body) ? body : [body];
        if (list.length > 2000) fail("Import at most 2,000 tests at a time.");
        list.forEach(validateCase);
        const added = list.map((c) => ({
          ...c,
          id: randomUUID(),
          provenance: "user",
          sourceVerified: false,
          origin: "User-created",
          timeout: c.timeout || 8,
        }));
        await checked(
          table("cases").insert(
            added.map((c) => ({
              id: c.id,
              problem_id: p.id,
              payload: c,
              edited: true,
            })),
          ),
        );
        return reply(added);
      }
      const old = await checked(
        table("cases")
          .select("payload")
          .eq("id", route[3])
          .eq("problem_id", p.id)
          .eq("deleted", false)
          .maybeSingle(),
      );
      if (!old) fail("Test not found.", 404);
      if (method === "GET") return reply(old.payload);
      if (method === "DELETE") {
        await checked(
          table("cases").update({ deleted: true }).eq("id", route[3]),
        );
        return reply({ deleted: true });
      }
      if (method === "PUT") {
        const c = {
          ...old.payload,
          ...body,
          id: old.payload.id,
          kind: old.payload.kind,
          provenance: "user-edited",
          sourceVerified: false,
          editedSource: old.payload.kind !== "function",
        };
        validateCase(c);
        await checked(
          table("cases").update({ payload: c, edited: true }).eq("id", c.id),
        );
        return reply(c);
      }
    }
    if (route[2] === "run" && method === "POST") {
      const { language, code, mode = "run", caseIds } = body;
      if (
        !p.languages.includes(language) ||
        typeof code !== "string" ||
        code.length > 2000000 ||
        !["run", "submit"].includes(mode) ||
        (caseIds &&
          (!Array.isArray(caseIds) ||
            !caseIds.every((id) => typeof id === "string")))
      )
        fail("Invalid execution request.");
      const summaries = await getCases(p.id, true);
      const selected =
        mode === "submit" || !caseIds
          ? summaries
          : summaries.filter((c) => caseIds.includes(c.id));
      if (!selected.length)
        fail("No tests selected. Add a visible test case first.");
      const recent = await checked(
        table("jobs")
          .select("id")
          .gte("created", new Date(Date.now() - 60000).toISOString())
          .limit(11),
      );
      if (recent.length >= 10)
        fail("Please wait a minute before starting more runs.", 429);
      const id = randomUUID();
      await checked(
        table("jobs").insert({
          id,
          problem_id: p.id,
          language,
          code,
          mode,
          case_ids: selected.map((c) => c.id),
        }),
      );
      return reply({ jobId: id, pending: true }, 202);
    }
    fail("Not found.", 404);
  } catch (e) {
    return reply({ error: e.message || "Request failed." }, e.status || 500);
  }
}

async function advanceJob(id) {
  let job = await checked(table("jobs").select("*").eq("id", id).maybeSingle());
  if (!job) fail("Run not found.", 404);
  const summary = (r, submissionId) => ({
    results: r,
    passed: r.filter((x) => x.status === "passed").length,
    total: r.length,
    accepted: r.length > 0 && r.every((x) => x.status === "passed"),
    language: job.language,
    mode: job.mode,
    submissionId,
  });
  if (job.state === "complete") return summary(job.results, job.submission_id);
  const claimed = await checked(
    table("jobs")
      .update({
        lease_expires: Date.now() + 240000,
        updated: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("state", "pending")
      .lte("lease_expires", Date.now())
      .select("*"),
  );
  if (!claimed.length) return { jobId: id, pending: true, retryAfter: 1500 };
  job = claimed[0];
  try {
    const p = await getProblem(job.problem_id);
    const all = await getCases(p.id, true);
    const chosenMetadata = [];
    let budget = 0;
    for (const caseId of job.case_ids.slice(job.cursor)) {
      const c = all.find((c) => c.id === caseId);
      if (!c)
        fail(
          "A selected test was removed during this run. Start the run again.",
        );
      const cost = (c.timeout || 8) * (c.growthFactor ? 2 : 1);
      if (
        chosenMetadata.length &&
        (budget + cost > 150 || chosenMetadata.length >= 50)
      )
        break;
      chosenMetadata.push(c);
      budget += cost;
    }
    const payloads = await checked(
      table("cases")
        .select("id,payload")
        .eq("problem_id", p.id)
        .in(
          "id",
          chosenMetadata.map((c) => c.id),
        ),
    );
    const chosen = chosenMetadata.map(
      (c) => payloads.find((row) => row.id === c.id).payload,
    );
    const batch = await execute(
      p,
      job.code,
      job.language,
      chosen,
      await artifacts(p.id, true),
    );
    const results = [...job.results, ...batch];
    const cursor = job.cursor + chosen.length;
    if (cursor < job.case_ids.length) {
      await checked(
        table("jobs")
          .update({
            results,
            cursor,
            lease_expires: 0,
            updated: new Date().toISOString(),
          })
          .eq("id", id),
      );
      return { jobId: id, pending: true };
    }
    const result = summary(results);
    const submission = await checked(
      table("submissions")
        .insert({
          problem_id: p.id,
          language: job.language,
          code: job.code,
          mode: job.mode,
          result,
        })
        .select("id")
        .single(),
    );
    await checked(
      table("work").upsert({
        problem_id: p.id,
        language: job.language,
        code: job.code,
        updated: new Date().toISOString(),
      }),
    );
    const old = await getProgress(p.id);
    await checked(
      table("progress").upsert({
        problem_id: p.id,
        ...old,
        status:
          job.mode === "submit" && result.accepted
            ? "solved"
            : old.status === "todo"
              ? "attempted"
              : old.status,
      }),
    );
    await checked(
      table("jobs")
        .update({
          results,
          cursor,
          state: "complete",
          submission_id: submission.id,
          lease_expires: 0,
          updated: new Date().toISOString(),
        })
        .eq("id", id),
    );
    return { ...result, submissionId: submission.id };
  } catch (e) {
    await checked(table("jobs").update({ lease_expires: 0 }).eq("id", id));
    throw e;
  }
}
