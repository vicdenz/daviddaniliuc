# David Daniliuc

David's single-page portfolio, built with Next.js, React, TypeScript, Tailwind CSS, React Three Fiber, and a single-plane procedural backdrop.

## Development

```bash
npm install
npm run dev
```

Use `npm run lint` for linting and `npm run build` for a production build.

## Where to edit

- `src/content/portfolio.ts` — experience and project content
- `src/components/journal/Journal.tsx` — page-level journal structure
- `src/components/journal/ExperienceList.tsx` — experience rendering
- `src/components/journal/ProjectList.tsx` — project rendering
- `src/components/journal/Journal.module.css` — journal typography, paper, spacing, and responsive styles
- `src/components/backdrop/config.ts` — production backdrop defaults and shader mappings
- `src/components/backdrop/BackdropScene.tsx` — shader plane and animation behavior
- `src/components/shaders/` — fragment and vertex shaders

## Backdrop testing controls

Copy `.env.example` to `.env.local`, set the following variable, and restart the development server:

```bash
NEXT_PUBLIC_BACKDROP_TEST_CONTROLS=true
```

The controls expose both retained backdrop designs, individual shader layers, dither tuning, and font testing. Set the variable to `false` or remove it to hide the panels and exclude the testing harness from production assets.
