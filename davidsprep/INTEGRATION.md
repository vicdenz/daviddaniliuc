# DavidsPrep transfer

This directory is a copy of the local DavidsPrep application and its supporting code. The original problem folders remain in `Code/interview-prep/fastprep` and the other interview-prep folders. `data/practice.sqlite` is a consistent snapshot of the local database, including problems, visible cases, source artifacts, saved code, and notes. Login sessions and rate-limit records were cleared from this copy. The app's intended path is `/prep`; its local server and Vite build now use that path by default.

The website repository is public. The SQLite snapshot, problem content, reviewed solutions, import scripts, and test files are deliberately Git-ignored and excluded from Vercel CLI uploads; do not force-add them or include them in a public deployment. The code in this directory is not yet wired into the Next.js website. The existing local SQLite/Express runner still needs to be adapted to Supabase and Vercel Sandbox before `/prep` can run on Vercel. The copied `deploy/` templates document the previous standalone-host approach and are not the intended deployment path.

To refresh the snapshot, use SQLite's backup API against the original database, then clear `auth_sessions` and `auth_attempts` in the copy. Do not copy the live SQLite file while its write-ahead log is active.
