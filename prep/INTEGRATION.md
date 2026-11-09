# Prep

The website serves the davidprep frontend at `/prep`; code, environment variables and cookies use `prep`/`PREP_*`. Original problem folders stay in `Code/interview-prep/`, and `prep/data/practice.sqlite` is an ignored local backup.

The repository is public. The SQLite snapshot, problem content, reviewed solutions and legacy import files are Git-ignored and excluded from Vercel uploads. The browser gets private content only through authenticated `/prep/api` requests, and Supabase keys never reach the frontend bundle.

## Architecture

- **Supabase:** project `prep` (`bizfbtkhmyswpercocla`, Canada Central) holds the private schema in `supabase/migrations/` and the problem data. `scripts/migrate_prep_to_supabase.py` seeds an empty schema from the SQLite snapshot and refuses to overwrite a populated database.
- **Vercel:** project `daviddaniliuc` has `PREP_SUPABASE_URL`, `PREP_SUPABASE_SECRET_KEY`, `PREP_PASSWORD`, `PREP_SESSION_SECRET` and `PREP_CPP_SNAPSHOT_ID` in all environments.
- **Serving:** `/prep` serves the UI document, with assets under `/prep-ui/` and the API under `/prep/api/`. The website uses `prep/hosted/`; `prep/server/` is only for standalone local use.
- **Sandbox:** snapshot `snap_GkRQxSlvWLTPnhDlI9C0Pcy6r0ii` has Python, pytest and g++. Each batch gets a fresh, non-persistent, network-disabled microVM with limits on CPU, memory, processes, files, output and wall time. No database credentials enter the guest.
- **Jobs:** Submit creates a durable job that runs the entire suite in bounded batches, and the client advances it until the result is ready. Run can select individual visible tests. JSON over 1 MB is compressed, which keeps the 7.8 MB visible case within Vercel's transfer limit.
- **Saving:** final submissions are transactional and idempotent. Editor autosave is independent of run snapshots, and changing a selected test during a run requires a fresh run.
- **Auth:** sessions persist in Supabase, use HttpOnly/Secure cookies on HTTPS, and renew for up to 400 days. Login attempts are rate-limited atomically. Exposed tables have RLS, and anonymous access is revoked.

## Local development

Run `npx vercel env pull .env.local` after linking the project, and apply schema changes with `npx supabase db push`. `node --env-file=.env.local --test tests/prep-http.test.mjs` checks a running site (`PREP_TEST_URL` targets a preview), and `tests/prep-restart.test.mjs` checks persistence across restarts. Tests use temporary problems and clean them up.

## Adding private questions

Use the ignored `prep/docs/problem.example.json` format: a stable problem ID, authorized statement with source qualifications, metadata, Python/C++ class starters, callable argument types, and visible function cases. Test inputs are positional argument arrays. Include supplied examples and independently checked edge cases; do not invent source constraints or a difficulty rating.

Import and validate the manifest locally, then copy only that problem into hosted Prep:

```sh
python3 prep/scripts/import_manifest.py prep/problems/collection/question.json
python3 scripts/import_prep_problem.py question-id
python3 scripts/import_prep_problem.py question-id --apply
```

The hosted importer previews counts by default and only reads SQLite. `--apply` uses `psql` and the ignored `prep/.env.supabase.local` and `supabase/.temp/pooler-url` files. It updates problem metadata and inserts missing cases, artifacts and starter work in one transaction. Reimports preserve existing cases (including edits and deletions), saved code, notes, progress and submissions, so changed case content needs a new case ID or an edit through Prep.

Keep manifests, generators, solutions and validation reports in the ignored private folders, and never commit them. Database additions are available immediately, with no website deployment.

## Limits

- **Vercel Hobby:** at setup, Sandbox includes 5 active CPU hours, 420 GB-hours of memory, 5,000 creations per month and 15 GB of snapshot storage, shared across the account. Exceeding an allowance pauses creation rather than charging. Check [current quotas](https://vercel.com/docs/sandbox/pricing) before changing plans.
- **Supabase Free:** includes a [500 MB database and 5 GB of egress](https://supabase.com/docs/guides/platform/billing-on-supabase). It may pause after low activity: the project host stops resolving in DNS, the pooler reports `tenant/user not found`, and it must be restored from the Supabase dashboard. Keep the local SQLite backup.
- The `prep/deploy/` templates describe an obsolete standalone hosting approach.

## Usage meter

The header tracks this app's Sandbox CPU from the usage migration onward. Each session is recorded before creation, and `activeCpuUsageMs` is saved after stopping, including compilation, preparation and failed tests. Missing measurements use marked conservative estimates, and stale pending sessions reserve the four-minute maximum. Days use the session's start date in America/Toronto.

The daily recommendation is 10 CPU-minutes (five hours over 30 days), and crossing it only changes the indicator. The secondary total is a rolling 30 days, not the account's billing cycle. Earlier sessions and other projects are excluded, so the Vercel dashboard remains authoritative. Usage refreshes after a run, on focus, and every 30 seconds while visible.

## Refreshing the snapshot

Use SQLite's backup API against the original database, then clear `auth_sessions` and `auth_attempts` in the copy. Do not copy the live file while its write-ahead log is active.
