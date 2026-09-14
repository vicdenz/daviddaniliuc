# David Daniliuc — Website

Small personal site built with Next.js, React, TypeScript, Three.js, and React Three Fiber.

## Useful places

- `/` — portfolio; content is in `src/content/portfolio.ts`
- `/music` — music player; tracks are in `src/content/music.ts`
- `src/app/globals.css` — shared tokens, shell, and global interaction styles
- `src/components/PageCanvas.tsx` — shared loader and backdrop
- `src/components/portfolio/` — portfolio UI
- `public/audio/` and `public/logos/` — local media/assets

## Commands

- `npm run dev` — local development server
- `npm run lint` — lint checks
- `npm run build` — production build; stop the dev server first

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
