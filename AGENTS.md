# David Daniliuc — Website

Personal site built with Next.js, React, TypeScript, Three.js, and React Three Fiber.

## Useful places

- `src/content/portfolio.ts` — portfolio facts and links
- `src/components/portfolio/` — portfolio UI
- `src/app/music/` — music page and player
- `private/audio/tracks.json` — track metadata; local MP3s live beside it
- `src/app/globals.css` — shared styles
- `src/components/PageCanvas.tsx` — shared loader and backdrop
- `public/` — public assets, including `resume.pdf` served at `/resume.pdf`

## Commands

- `npm run dev` — localhost on port 3000
- `npm run lint` — lint
- `npm run build` — production build; stop the dev server first
- `npm run test:audio` — range/session tests; requires Node.js 22.6+
- `npm run check:audio` — validate the manifest and required local MP3s
- `npm run sync:resume` — update the public resume PDF
- `npm run sync:resume -- --check` — check without writing; exits 1 if missing or outdated
- `npm run deploy:preview` / `npm run deploy:prod` — CLI preview/production deployments

## Deployment and audio

- Deploy from the local checkout. Automatic Git deployments are disabled in `vercel.json`; merging alone does not publish. Fresh clones need the MP3s restored from a local backup.
- CLI setup: `npx --yes vercel@59.17.0 login`, then `npx --yes vercel@59.17.0 link`. Select the existing `david-daniliucs-projects/daviddaniliuc` project.
- CLI uploads include Git-ignored audio. `.vercelignore` excludes secrets and generated files. After upload-rule changes, verify with `npx --yes vercel@59.17.0 deploy --dry --format=json`.
- Keep `private/` limited to audio. The JSON manifest is tracked; MP3s are ignored. Never force-add MP3s or rewrite Git history without an explicit request.
- The manifest is the single track list for the player, endpoint and deployment check. Use unique IDs (`session` is reserved). `src/lib/music.ts` passes only display metadata and playback URLs to the client.
- `/api/audio/[trackId]` streams local files with range support. Next.js `outputFileTracingIncludes` bundles the MP3s. Preserve cookie validation, session renewal and private/no-store caching.
- Vercel Preview and Production require `AUDIO_SESSION_SECRET` of at least 32 characters. Development has a local fallback. Environment changes require redeployment.
- Public playback can still be captured; historical Git copies remain accessible.

## Resume

`scripts/sync_resume.sh` copies only `~/Documents/Resumes/David_Daniliuc_resume.pdf` to `public/resume.pdf`. Override the source with `RESUME_SOURCE_PDF`. Never modify the original PDF or LaTeX files. Sync, commit the public PDF, then deploy to publish updates.

## Constraints

- Preserve the shared loader, backdrop, footer, local fonts and reduced-motion support.
- Keep one demand-driven shader plane; avoid heavy visual dependencies or post-processing without a clear reason.
- Match the warm paper, black/gray and restrained blue styling. Keep layouts responsive and accessible.
- Keep facts and links accurate; do not invent claims or metrics.
- Prefer focused changes and relevant validation.
- Never delete `.next` or `node_modules`. Restart the dev server cleanly if HMR gets stale.
- Keep fonts in `src/app/fonts/`.
- Keep the README brief and nontechnical; put development context here.
- Use short, plain commit messages with no AI references.
