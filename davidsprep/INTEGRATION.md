# DavidsPrep transfer

This directory is a copy of the local DavidsPrep application and its supporting code. The original problem folders remain in `Code/interview-prep/fastprep` and the other interview-prep folders. `data/practice.sqlite` is a consistent snapshot of the local database, including problems, visible cases, source artifacts, saved code, and notes. Login sessions and rate-limit records were cleared from this copy. The app's intended path is `/prep`; its local server and Vite build now use that path by default.

The website repository is public. The SQLite snapshot, problem content, reviewed solutions, import scripts, and test files are deliberately Git-ignored and excluded from Vercel CLI uploads; do not force-add them or include them in a public deployment. The code in this directory is not yet wired into the Next.js website. The existing local SQLite/Express runner still needs to be adapted to Supabase and Vercel Sandbox before `/prep` can run on Vercel. The copied `deploy/` templates document the previous standalone-host approach and are not the intended deployment path.

## Hosted services prepared

- Supabase project `davidsprep` (`bizfbtkhmyswpercocla`, Canada Central) has the private schema in `supabase/migrations/` and the copied problem data. `scripts/migrate_prep_to_supabase.py` seeds an empty schema from the ignored SQLite snapshot; it refuses to overwrite a populated database. The migration was checked row by row against the source for problems, cases, artifacts, and work.
- Vercel project `daviddaniliuc` has `DAVIDSPREP_SUPABASE_URL`, `DAVIDSPREP_SUPABASE_SECRET_KEY`, `DAVIDSPREP_PASSWORD`, `DAVIDSPREP_SESSION_SECRET`, and `DAVIDSPREP_CPP_SNAPSHOT_ID` set for Production, Preview, and Development. Do not expose the secret key to browser code.
- Vercel Sandbox access is verified with a network-disabled Python run. C++ uses snapshot `snap_xoEeNPgP1hEg8EuFxPtqdRvlOxNl`, which has `g++` installed and was tested in a fresh network-disabled sandbox. Create a fresh, non-persistent sandbox per run; do not give submitted code database credentials.

The remote services are prepared, but the website does **not** yet serve `/prep`. The next implementation step is to port the Express API to Next route handlers, use Supabase as the server-side data store, and use Vercel Sandbox for execution. A Free Plan Supabase project may pause after low activity; retain the local SQLite backup.

To refresh the snapshot, use SQLite's backup API against the original database, then clear `auth_sessions` and `auth_attempts` in the copy. Do not copy the live SQLite file while its write-ahead log is active.
