"""Seed an empty Supabase prep schema from the ignored local SQLite snapshot.

Requires `psql`, a linked Supabase project, and the local ignored database password
file created during project setup. Source files and database credentials stay local.
"""

import os
import sqlite3
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "davidsprep/data/practice.sqlite"
PASSWORD_FILE = ROOT / "davidsprep/.env.supabase.local"
POOLER_URL_FILE = ROOT / "supabase/.temp/pooler-url"
TABLES = (
    ("problems", "prep_problems", ("id", "payload")),
    ("cases", "prep_cases", ("id", "problem_id", "payload", "deleted", "edited")),
    ("artifacts", "prep_artifacts", ("id", "problem_id", "path", "hash", "content")),
    ("work", "prep_work", ("problem_id", "language", "code", "updated")),
    ("progress", "prep_progress", ("problem_id", "notes", "status", "updated")),
    (
        "submissions",
        "prep_submissions",
        ("id", "problem_id", "language", "code", "mode", "result", "created"),
    ),
)


def copy_value(value):
    if value is None:
        return r"\N"
    if isinstance(value, bool):
        value = "t" if value else "f"
    return (
        str(value)
        .replace("\\", "\\\\")
        .replace("\t", r"\t")
        .replace("\n", r"\n")
        .replace("\r", r"\r")
    )


def main():
    password = PASSWORD_FILE.read_text().strip().split("=", 1)[1]
    pooler_url = POOLER_URL_FILE.read_text().strip()
    db = sqlite3.connect(f"file:{SOURCE}?mode=ro", uri=True)
    env = dict(os.environ, PGPASSWORD=password)
    process = subprocess.Popen(
        ["psql", "-X", "-v", "ON_ERROR_STOP=1", "-d", pooler_url],
        stdin=subprocess.PIPE,
        env=env,
        text=True,
        encoding="utf-8",
    )
    assert process.stdin is not None
    out = process.stdin
    out.write("BEGIN;\n")
    out.write(
        "DO $$ BEGIN IF EXISTS (SELECT 1 FROM public.prep_problems LIMIT 1) "
        "THEN RAISE EXCEPTION 'Prep database is not empty; import aborted'; "
        "END IF; END $$;\n"
    )
    counts = {}
    for source, target, columns in TABLES:
        names = ", ".join(columns)
        out.write(f"COPY public.{target} ({names}) FROM STDIN;\n")
        count = 0
        for row in db.execute(f"SELECT {names} FROM {source}"):
            if source == "cases":
                row = (*row[:3], bool(row[3]), bool(row[4]))
            out.write("\t".join(copy_value(value) for value in row) + "\n")
            count += 1
        out.write("\\.\n")
        counts[source] = count
    out.write(
        "SELECT setval(pg_get_serial_sequence('public.prep_submissions','id'), "
        "GREATEST(COALESCE(MAX(id), 1), 1), COUNT(*) > 0) "
        "FROM public.prep_submissions;\n"
    )
    out.write("COMMIT;\n")
    out.close()
    db.close()
    if process.wait() != 0:
        raise SystemExit("Supabase import failed; the transaction was rolled back")
    print("Imported:", counts)


if __name__ == "__main__":
    main()
