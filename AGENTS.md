# David Daniliuc — Website

Personal site: Next.js, React, TypeScript, Three.js, React Three Fiber.

## Useful places

- `src/content/portfolio.ts` — portfolio facts and links
- `src/components/portfolio/` — portfolio UI
- `src/app/music/` — music page and player
- `private/audio/tracks.json` — track manifest; local MP3s live beside it
- `src/app/globals.css` — shared styles
- `src/components/PageCanvas.tsx` — shared loader and backdrop
- `public/` — public assets, including `/resume.pdf`

## Commands

- `npm run dev` — localhost:3000
- `npm run lint`
- `npm run build` — stop the dev server first
- `npm run test:audio` — range/session tests; needs Node.js 22.6+
- `npm run test:audio:http` — streaming/access tests against a running server with MP3s; override localhost:3000 with `AUDIO_TEST_BASE_URL`
- `npm run check:audio` — validate the manifest and local MP3s
- `npm run sync:resume` / `npm run sync:transcript` — update the public PDF; add `-- --check` to exit 1 if missing or outdated without writing
- `npm run test:prep` — Prep HTTP and restart persistence tests; needs a running server
- `npm run deploy:preview` / `npm run deploy:prod` — CLI deployments

## Deployment

- Deploy only from an up-to-date `main`, using the local checkout. Git deployments are disabled in `vercel.json`, so merging does not publish.
- CLI setup: `npx --yes vercel@65.2.0 login`, then `link` to `david-daniliucs-projects/daviddaniliuc`.
- CLI uploads include Git-ignored audio; `.vercelignore` excludes secrets and generated files. After upload-rule changes, verify with `npx --yes vercel@65.2.0 deploy --dry --format=json`.

## Audio

- Keep `private/` limited to audio. The manifest is tracked; MP3s are ignored, so fresh clones restore them from a local backup. Never force-add MP3s or rewrite Git history without an explicit request.
- The manifest is the only track list for the player, endpoint and deployment check. IDs are unique and `session` is reserved. Its order is the display order; `"demo": true` shows a `[demo]` tag.
- `/music?track=<id>` opens paused on that track, then the address bar settles on `/music`. Changing an ID breaks links shared with the old one.
- `src/lib/music.ts` passes only display metadata and playback URLs to the client.
- `/api/audio/[trackId]` streams with range support; `outputFileTracingIncludes` bundles the MP3s. Preserve cookie validation, session renewal and private/no-store caching.
- Preview and Production need `AUDIO_SESSION_SECRET` (32+ characters), and changing it requires a redeploy. Only `next dev` has a fallback, so set it locally for `next start`.
- Public playback can still be captured; historical Git copies remain accessible.

## Prep

- `/prep` serves the practice UI from a separate Vite build; branding stays davidprep. `prep/hosted/` is the Next API and Sandbox runner; `prep/server/` is the legacy local backend. See `prep/INTEGRATION.md` for setup, limits and adding questions.
- `npm run dev` and `npm run build` build the UI first into ignored `public/prep-ui/`. Keep private problem data and local credentials out of Git and Vercel uploads.
- Supabase project `prep` stores all library and practice data. Schema changes live in `supabase/migrations/`. `PREP_*` variables are server-only; pull local values with the Vercel CLI.
- Vercel Sandbox runs one fresh, network-disabled VM per batch, with Python/pytest and C++20. Never put storage credentials in the guest. Submit runs the whole available suite; there are no hidden tests.
- The daily compute target is advisory, not a provider cutoff. `prep_usage` covers this app from its migration onward, not account-wide billing. Keep those qualifications visible when changing the meter.
- PostCSS/source-map-js and CLI-config Zod overrides address advisories in upstream pins; review them when upgrading Next or the Sandbox SDK.

## Resume and transcript

`scripts/sync_resume.sh` copies `~/Documents/Resumes/David_Daniliuc_resume.pdf` to `public/resume.pdf` (override with `RESUME_SOURCE_PDF`). `scripts/sync_transcript.sh` copies `~/Documents/Resumes/transcript/David_Daniliuc_academic_history.pdf` to `public/transcript.pdf` (override with `TRANSCRIPT_SOURCE_PDF`). Never modify the originals or LaTeX files. Sync, commit the public PDF, then deploy to publish.

## Constraints

- Preserve the shared loader, backdrop, footer, local fonts (`src/app/fonts/`) and reduced-motion support.
- Keep one demand-driven shader plane; avoid heavy visual dependencies or post-processing without a clear reason.
- Match the warm paper, black/gray and restrained blue styling. Keep layouts responsive and accessible.
- Keep facts and links accurate; do not invent claims or metrics.
- Prefer focused changes and relevant validation.
- Never delete `.next` or `node_modules`. Restart the dev server if HMR gets stale.
- Keep the README brief and nontechnical; development context goes here.
- Use short, plain commit messages with no AI references.
