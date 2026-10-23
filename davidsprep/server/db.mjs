import "./config.mjs";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";
export const base = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
export function openDb(
  filename = process.env.DAVIDSPREP_DB ||
    process.env.FASTPREP_DB ||
    path.join(base, "data/practice.sqlite"),
) {
  const db = new DatabaseSync(filename);
  db.exec(
    "PRAGMA journal_mode=WAL;PRAGMA foreign_keys=ON;PRAGMA busy_timeout=5000;",
  );
  return db;
}
export const decode = (r) => (r ? JSON.parse(r.payload) : null);
