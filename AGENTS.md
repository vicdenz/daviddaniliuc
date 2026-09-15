# David Daniliuc — Website

Small personal site built with Next.js, React, TypeScript, Three.js, and React Three Fiber.

## Useful places

- `/` — portfolio; content is in `src/content/portfolio.ts`
- `/music` — music player; tracks are in `src/content/music.ts`
- `src/app/globals.css` — shared tokens, shell, and global interaction styles
- `src/components/PageCanvas.tsx` — shared loader and backdrop
- `src/components/portfolio/` — portfolio UI
- `private/audio/` — server-only MP3s bundled into the audio streaming function
- `public/logos/` — local logo assets

## Commands

- `npm run dev` — local development server
- `npm run lint` — lint checks
- `npm run build` — production build; stop the dev server first
- `npm run sync:resume` — copy the latest resume PDF into `public/resume.pdf`
- `npm run sync:resume -- --check` — check whether the public PDF is current without changing it
- `npm run test:audio` — range and session tests; requires Node.js 22.6 or newer

## Audio streaming

- `/api/audio/[trackId]` streams allowlisted tracks from `private/audio` using the Node.js runtime. `outputFileTracingIncludes` bundles the MP3s into the function.
- Set `AUDIO_SESSION_SECRET` to a random value of at least 32 characters in Vercel Preview and Production, then redeploy. Generate one with `openssl rand -hex 32`. Production playback fails closed without it; development has a local-only fallback.
- Visiting `/music`, including route prefetches, issues an HttpOnly, SameSite=Strict signed cookie scoped to `/api/audio`. Sessions last one hour and renew on authorized audio requests. Revisit `/music` after an hour without audio requests.
- GET and HEAD support single byte ranges for seeking. Invalid ranges return 416; missing or invalid sessions return 403. Responses use `private, no-store` caching.
- Listening remains public, and visitors can capture streamed bytes. Committed audio remains accessible in a public repository and its history; older deployments may retain public audio URLs.
- No separate storage service is required. Streaming consumes Vercel function and transfer allowances.

## Resume

- `scripts/sync_resume.sh` copies only `~/Documents/Resumes/David_Daniliuc_resume.pdf` to `public/resume.pdf`, served at `/resume.pdf`.
- Set `RESUME_SOURCE_PDF` to override the source path. The source PDF and LaTeX files are never modified.
- Run the sync command after updating the resume, then commit the updated public PDF to include it in the next deployment.
- Check mode exits with code 1 if the public copy is missing or out of date.

## Keep it simple

- Preserve the shared loader, backdrop, footer, local fonts, and reduced-motion support across routes.
- Keep the background to one demand-driven shader plane; do not add heavy visual dependencies or post-processing without a clear reason.
- Use the existing warm paper, black/gray, and restrained blue visual language. Keep the site responsive and accessible.
- Keep biography, roles, project facts, and links accurate. Do not invent claims or metrics.
- Prefer small focused changes and validate them with the relevant check.

## Development and git

- Never delete `.next` or `node_modules`. If Next/HMR gets stale, restart the dev server cleanly instead.
- Keep local font files in `src/app/fonts/`.
- Use short, plain commit messages with no AI references.
