import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

test(
  "prep login, code, and notes survive restarting Next",
  { timeout: 40000 },
  async () => {
    const db = createClient(
      process.env.PREP_SUPABASE_URL,
      process.env.PREP_SUPABASE_SECRET_KEY,
      { auth: { persistSession: false } },
    );
    const id = "prep-restart-" + randomUUID();
    const base = "http://localhost:3101/prep/api";
    let server,
      cookie = "";
    const stop = async () => {
      if (!server || server.exitCode !== null) return;
      const exited = once(server, "exit");
      server.kill("SIGTERM");
      await exited;
    };
    const start = async () => {
      server = spawn(
        process.execPath,
        ["node_modules/next/dist/bin/next", "start", "--port", "3101"],
        { stdio: "ignore", env: process.env },
      );
      for (let n = 0; n < 100; n++) {
        try {
          if ((await fetch(base + "/auth/session")).ok) return;
        } catch {}
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      throw new Error("Next server did not start.");
    };
    const call = async (url, method = "GET", body) => {
      const response = await fetch(base + url, {
        method,
        headers: { cookie, "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const data = await response.json();
      assert.equal(response.status, 200, JSON.stringify(data));
      return { data, response };
    };
    try {
      const { error } = await db
        .from("prep_problems")
        .insert({
          id,
          payload: {
            id,
            title: "Restart validation",
            languages: ["python"],
            starters: {},
          },
        });
      assert.equal(error, null);
      await start();
      const login = await call("/auth/login", "POST", {
        password: process.env.PREP_PASSWORD,
      });
      cookie = login.response.headers.get("set-cookie").split(";")[0];
      await call(`/problems/${id}/work`, "PUT", {
        language: "python",
        code: "# saved through restart\n",
      });
      await call(`/problems/${id}/progress`, "PUT", {
        status: "attempted",
        notes: "Saved through restart",
      });
      await stop();
      await start();
      assert.equal((await call("/auth/session")).data.authenticated, true);
      const restored = (await call(`/problems/${id}`)).data;
      assert.equal(restored.work.python, "# saved through restart\n");
      assert.equal(restored.progress.notes, "Saved through restart");
      assert.equal(restored.progress.status, "attempted");
      await call("/auth/logout", "POST", {});
    } finally {
      await stop();
      for (const t of ["work", "progress"])
        await db
          .from("prep_" + t)
          .delete()
          .eq("problem_id", id);
      await db.from("prep_problems").delete().eq("id", id);
    }
  },
);
