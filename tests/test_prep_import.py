"""Offline checks for selecting private problems without changing local data."""

import importlib.util
import json
from pathlib import Path
import sqlite3
import tempfile
import unittest


SPEC = importlib.util.spec_from_file_location(
    "prep_import", Path(__file__).resolve().parents[1] / "scripts/import_prep_problem.py"
)
IMPORTER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(IMPORTER)


class PrivateImportTests(unittest.TestCase):
    def test_missing_database_is_not_created(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "missing.sqlite"
            with self.assertRaises(sqlite3.OperationalError):
                IMPORTER.read_rows(path, ["missing"])
            self.assertFalse(path.exists())

    def test_selection_is_literal_and_does_not_change_database(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "private.sqlite"
            unusual_id = "question' OR 1=1 --"
            with sqlite3.connect(path) as db:
                db.executescript("""
                    CREATE TABLE problems(id TEXT, payload TEXT);
                    CREATE TABLE cases(id TEXT, problem_id TEXT, payload TEXT,
                                       deleted INTEGER, edited INTEGER);
                    CREATE TABLE artifacts(id TEXT, problem_id TEXT, path TEXT,
                                           hash TEXT, content TEXT);
                    CREATE TABLE work(problem_id TEXT, language TEXT, code TEXT, updated TEXT);
                """)
                for pid in (unusual_id, "unrelated"):
                    db.execute("INSERT INTO problems VALUES (?, ?)", (pid, json.dumps({
                        "id": pid, "judge": {"mode": "method"},
                        "starters": {"python": "class Solution: pass"},
                    })))
                    db.execute("INSERT INTO cases VALUES (?, ?, '{}', 0, 0)", (pid + "-case", pid))
            before = path.read_bytes()
            rows = IMPORTER.read_rows(path, [unusual_id])
            self.assertEqual([row[0] for row in rows["problems"]], [unusual_id])
            self.assertEqual(len(rows["cases"]), 1)
            self.assertEqual(path.read_bytes(), before)
            with self.assertRaises(ValueError):
                IMPORTER.read_rows(path, [unusual_id, "missing"])

    def test_copy_keeps_source_text_and_nulls_distinct(self):
        self.assertEqual(IMPORTER.copy_value(None), r"\N")
        self.assertEqual(IMPORTER.copy_value(r"\N"), r"\\N")
        self.assertEqual(IMPORTER.copy_value("a\tb\nc\rd\\e"), r"a\tb\nc\rd\\e")
        self.assertEqual(IMPORTER.copy_value(True), "t")
        self.assertEqual(IMPORTER.copy_value(False), "f")


if __name__ == "__main__":
    unittest.main()
