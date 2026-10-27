"""Copy selected private SQLite problems into hosted Prep, preserving user work.

First use the documented local manifest importer. This command previews counts
by default; --apply writes all selected rows in one PostgreSQL transaction.
"""

import argparse
import json
import os
from pathlib import Path
import sqlite3
import subprocess


ROOT = Path(__file__).resolve().parents[1]
TABLES = {
    "problems": ("id", "payload"),
    "cases": ("id", "problem_id", "payload", "deleted", "edited"),
    "artifacts": ("id", "problem_id", "path", "hash", "content"),
    "work": ("problem_id", "language", "code", "updated"),
}


def copy_value(value):
    if value is None:
        return r"\N"
    if isinstance(value, bool):
        value = "t" if value else "f"
    return str(value).replace("\\", "\\\\").replace("\t", r"\t").replace(
        "\n", r"\n"
    ).replace("\r", r"\r")


def read_rows(path, ids):
    rows = {}
    placeholders = ",".join("?" for _ in ids)
    with sqlite3.connect(path.resolve().as_uri() + "?mode=ro", uri=True) as db:
        for table, columns in TABLES.items():
            key = "id" if table == "problems" else "problem_id"
            rows[table] = db.execute(
                f"SELECT {', '.join(columns)} FROM {table} "
                f"WHERE {key} IN ({placeholders}) ORDER BY {', '.join(columns[:2])}",
                ids,
            ).fetchall()
    found = {row[0] for row in rows["problems"]}
    if found != set(ids):
        raise ValueError("One or more requested problem IDs were not found")
    for pid, raw in rows["problems"]:
        problem = json.loads(raw)
        if problem["id"] != pid or not problem.get("judge") or not problem.get("starters"):
            raise ValueError("Import the manifest with interface migration first")
        if not any(row[1] == pid and not row[3] for row in rows["cases"]):
            raise ValueError("Each problem must have visible cases")
    return rows


def transaction(rows):
    sql = ["BEGIN;"]
    for table, columns in TABLES.items():
        names = ", ".join(columns)
        target = "public.prep_" + table
        staging = "import_" + table
        sql += [
            f"CREATE TEMP TABLE {staging} ON COMMIT DROP AS "
            f"SELECT {names} FROM {target} WITH NO DATA;",
            f"COPY {staging} ({names}) FROM STDIN;",
        ]
        for row in rows[table]:
            if table == "cases":
                row = (*row[:3], bool(row[3]), bool(row[4]))
            sql.append("\t".join(copy_value(value) for value in row))
        sql.append("\\.")
        conflict = (
            "(id) DO UPDATE SET payload=excluded.payload"
            if table == "problems" else "DO NOTHING"
        )
        sql.append(
            f"INSERT INTO {target} ({names}) SELECT {names} FROM {staging} "
            f"ON CONFLICT {conflict};"
        )
    sql.append("COMMIT;")
    return "\n".join(sql) + "\n"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("ids", nargs="+")
    parser.add_argument("--db", type=Path, default=ROOT / "prep/data/practice.sqlite")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    rows = read_rows(args.db, args.ids)
    print(json.dumps({"apply": args.apply, "rows": {k: len(v) for k, v in rows.items()}}))
    if not args.apply:
        return
    # Use the same local connection files as the initial migration. Never print
    # credentials, SQL, or private content, including PostgreSQL error details.
    password = (ROOT / "prep/.env.supabase.local").read_text().strip().split("=", 1)[1]
    pooler = (ROOT / "supabase/.temp/pooler-url").read_text().strip()
    result = subprocess.run(
        ["psql", "-X", "-q", "-v", "ON_ERROR_STOP=1", "-d", pooler],
        input=transaction(rows), text=True, capture_output=True,
        env={**os.environ, "PGPASSWORD": password},
    )
    if result.returncode:
        raise SystemExit("Hosted import failed; transaction rolled back. Check local connection/schema.")
    print("Hosted import committed. Existing cases and saved work preserved.")


if __name__ == "__main__":
    main()
