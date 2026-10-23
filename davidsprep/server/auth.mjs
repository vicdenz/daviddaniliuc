import {
  randomBytes,
  createHash,
  timingSafeEqual,
  scryptSync,
} from "node:crypto";
const lifetime = 400 * 24 * 60 * 60 * 1000;
const hash = (value) => createHash("sha256").update(value).digest("hex");
export function installAuth(app, db, settings) {
  if (
    !settings.password ||
    !settings.sessionSecret ||
    settings.sessionSecret.length < 32
  )
    throw new Error(
      "Set DAVIDSPREP_PASSWORD and a DAVIDSPREP_SESSION_SECRET of at least 32 characters in .env.local.",
    );
  db.exec(`CREATE TABLE IF NOT EXISTS auth_sessions(token_hash TEXT PRIMARY KEY,password_version TEXT NOT NULL,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS auth_attempts(client TEXT PRIMARY KEY,failures INTEGER NOT NULL,reset_at INTEGER NOT NULL);`);
  const version = hash(settings.password + "\0" + settings.sessionSecret);
  const expected = scryptSync(settings.password, settings.sessionSecret, 32);
  const secure = !!settings.publicOrigin;
  const cookieName = secure
    ? "__Secure-davidsprep_session"
    : "davidsprep_session";
  const options = {
    httpOnly: true,
    sameSite: "strict",
    secure,
    path: settings.basePath || "/",
    maxAge: lifetime,
  };
  function session(req) {
    const cookies = req.headers.cookie || "";
    const token = cookies
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith(cookieName + "="))
      ?.slice(cookieName.length + 1);
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
    const row = db
      .prepare(
        "SELECT * FROM auth_sessions WHERE token_hash=? AND password_version=? AND expires>?",
      )
      .get(hash(token), version, Date.now());
    return row ? { token, ...row } : null;
  }
  function renew(req, res) {
    const s = session(req);
    if (!s) return null;
    db.prepare("UPDATE auth_sessions SET expires=? WHERE token_hash=?").run(
      Date.now() + lifetime,
      s.token_hash,
    );
    res.cookie(cookieName, s.token, options);
    return s;
  }
  app.get("/api/auth/session", (req, res) =>
    res.json({ authenticated: !!renew(req, res) }),
  );
  app.post("/api/auth/login", (req, res) => {
    const now = Date.now();
    const client = hash(req.ip || "unknown");
    db.prepare("DELETE FROM auth_attempts WHERE reset_at<=?").run(now);
    const attempts = db
      .prepare("SELECT * FROM auth_attempts WHERE client=?")
      .get(client);
    if (attempts?.failures >= 5) {
      res.setHeader("Retry-After", Math.ceil((attempts.reset_at - now) / 1000));
      return res
        .status(429)
        .json({ error: "Too many attempts. Try again in 15 minutes." });
    }
    const password = req.body?.password;
    const candidate = scryptSync(
      typeof password === "string" && password.length <= 1024 ? password : "",
      settings.sessionSecret,
      32,
    );
    if (typeof password !== "string" || !timingSafeEqual(candidate, expected)) {
      db.prepare(
        "INSERT INTO auth_attempts VALUES (?,1,?) ON CONFLICT(client) DO UPDATE SET failures=failures+1",
      ).run(client, now + 15 * 60 * 1000);
      return res.status(401).json({ error: "Incorrect password." });
    }
    db.prepare("DELETE FROM auth_attempts WHERE client=?").run(client);
    db.prepare(
      "DELETE FROM auth_sessions WHERE expires<=? OR password_version!=?",
    ).run(now, version);
    const token = randomBytes(32).toString("hex");
    db.prepare("INSERT INTO auth_sessions VALUES (?,?,?)").run(
      hash(token),
      version,
      now + lifetime,
    );
    res.cookie(cookieName, token, options);
    res.json({ authenticated: true });
  });
  app.post("/api/auth/logout", (req, res) => {
    const s = session(req);
    if (s)
      db.prepare("DELETE FROM auth_sessions WHERE token_hash=?").run(
        s.token_hash,
      );
    res.clearCookie(cookieName, { ...options, maxAge: undefined });
    res.json({ authenticated: false });
  });
  app.use("/api", (req, res, next) => {
    if (renew(req, res)) return next();
    res.status(401).json({ error: "Sign in to continue." });
  });
}
