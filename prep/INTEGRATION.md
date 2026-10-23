# Prep

The website serves the existing DavidsPrep frontend at `/prep`. Code, environment variables, and cookies use `prep`/`PREP_*`; the visible branding is unchanged. Original problem folders remain in `Code/interview-prep/fastprep` and the other interview-prep folders. `prep/data/practice.sqlite` is an ignored local backup.

The website repository is public. The SQLite snapshot, problem content, reviewed solutions, and legacy import files are Git-ignored and excluded from Vercel uploads. The browser receives private content only through authenticated `/prep/api` requests. Supabase keys never reach the frontend bundle.

## Architecture and setup

- Supabase project `prep` (`bizfbtkhmyswpercocla`, Canada Central) has the private schema in `supabase/migrations/` and the copied problem data. `scripts/migrate_prep_to_supabase.py` seeds an empty schema from the ignored SQLite snapshot; it refuses to overwrite a populated database. The migration was checked row by row against the source for problems, cases, artifacts, and work.
- Vercel project `daviddaniliuc` has `PREP_SUPABASE_URL`, `PREP_SUPABASE_SECRET_KEY`, `PREP_PASSWORD`, `PREP_SESSION_SECRET`, and `PREP_CPP_SNAPSHOT_ID` set for Production, Preview, and Development. Do not expose the secret key to browser code.
- `npm run dev` builds the existing Vite UI and starts Next. `npm run build` builds both. `/prep` serves the UI document directly, with its assets under `/prep-ui/` and API under `/prep/api/`. The legacy `prep/server/` files support standalone local use; the website uses `prep/hosted/`.
- Vercel Sandbox uses snapshot `snap_GkRQxSlvWLTPnhDlI9C0Pcy6r0ii`, with Python, pytest, and g++. Each batch gets a fresh non-persistent, network-disabled microVM. Submitted processes have CPU, memory, process-count, file/output and wall-time limits, plus privilege escalation disabled. No database credentials enter the guest.
- Submit creates a durable job and executes every selected visible test in bounded batches. The client advances the job until its complete result is available. Input/output JSON larger than 1 MB is compressed for transfer; large responses are compressed too. This preserves the existing 7.8 MB visible case within Vercel's transfer limit.
- Login sessions persist in Supabase, use HttpOnly/Secure cookies on HTTPS, and renew for up to 400 days as browsers permit. Login attempts are rate-limited atomically. All exposed tables have RLS and anonymous access revoked.

For local website development, run `npx vercel env pull .env.local` after linking the existing Vercel project. Apply schema changes with `npx supabase db push`. `node --env-file=.env.local --test tests/prep-http.test.mjs` checks a running site (set `PREP_TEST_URL` to use a preview), and `tests/prep-restart.test.mjs` verifies persistence across Next restarts. Tests use temporary problems and clean them up.

The Vercel project is on Hobby: Sandbox has a free monthly usage allowance and pauses when exhausted. Supabase is on Free and may pause after low activity. Keep the local SQLite backup. The copied `deploy/` templates describe an obsolete standalone hosting approach.

To refresh the snapshot, use SQLite's backup API against the original database, then clear `auth_sessions` and `auth_attempts` in the copy. Do not copy the live SQLite file while its write-ahead log is active.
