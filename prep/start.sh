#!/bin/sh
set -eu
cd "$(dirname "$0")"
command -v node >/dev/null || { echo 'Install Node.js 22.13 or newer.'; exit 1; }
command -v python3 >/dev/null || { echo 'Install Python 3.12 or newer.'; exit 1; }
if ! test -d node_modules; then npm ci; fi
if ! python3 -c 'import pytest' >/dev/null 2>&1; then
  if ! test -d .venv; then python3 -m venv .venv; fi
  .venv/bin/python -m pip install -r requirements.txt
  export FASTPREP_PYTHON="$PWD/.venv/bin/python"
fi
if ! test -f data/practice.sqlite; then python3 scripts/import_problems.py; fi
if ! test -f dist/index.html || test src/main.jsx -nt dist/index.html || test src/style.css -nt dist/index.html; then npm run build; fi
exec node server/index.mjs
