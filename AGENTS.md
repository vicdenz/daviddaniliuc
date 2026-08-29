# David Daniliuc — Personal Website

## Project

This repository contains David Daniliuc's single-page personal portfolio. It is built with Next.js 15, React 19, TypeScript, Three.js, and React Three Fiber.

The site presents David's infrastructure engineering practice, experience, selected projects, interests, and contact links. Preserve the current biography, experience, projects, contact destinations, and single-page route unless the user explicitly asks to change them.

## Commands

- `npm run dev` — start the development server
- `npm run build` — create a production build
- `npm run lint` — run linting

## Design Direction

The authoritative visual direction is **Systems Journal**: communicate an infrastructure practice through the visual language of a working architectural drawing.

- Mode: redesign overhaul
- Palette: rice paper `#f4f0e6`, blue-black `#18283b`, cobalt `#2457d6`, periwinkle `#afc2e6`, and blue wash `#dce5f2`
- Typography: Geist for reading and display text
- Structure: one continuous newspaper column; create hierarchy with typography and whitespace rather than bordered sections
- Motion: use restrained topographic field motion driven by page scroll, with animated signal traces, moving beacons, and a radial scan; do not add camera or pointer movement
- Rendering: build the procedural background as one Three.js and React Three Fiber shader plane using only the topographic fragment shader; keep the scene to one draw call
- Background opacity: use layered opacity; keep contours and elevation structure more defined than minor survey-grid detail, traces, beacons, and atmospheric motion
- Post-processing: none; render the procedural shader layers directly to the screen
- Tone: calm, precise, technically credible, and editorial

Avoid résumé imitation, boxed sections, horizontal separators, oversized headlines, navigation chrome, terminal cosplay, fabricated engineering metrics, and decorative effects that do not reinforce the systems-journal concept.

## Current Architecture

- `src/app/page.tsx` — homepage content and editorial structure
- `src/app/globals.css` — design tokens, typography, responsive layout, and interaction states
- `src/app/layout.tsx` — root layout and metadata
- `src/components/PageCanvas.tsx` — page composition and lazy-loading boundary for the graphics bundle
- `src/components/TopographicBackdrop.tsx` — single-plane React Three Fiber canvas and development controls boundary
- `src/components/backdrop/BackdropScene.tsx` — topographic scene, 60 FPS scheduler, reveal timing, and scroll state
- `src/components/shaders/frag/topographic-flow.frag` — procedural paper, survey grid, contours, elevation bands, signal traffic, and reveal

The former infrastructure-blueprint variant, multi-shader system, paper card, navigation, Font Awesome, and dark glass-card implementation has been removed. The topographic flow is the sole production backdrop; do not reintroduce alternate backdrop variants unless explicitly requested.

## Performance Profile

- Initial route JavaScript is approximately 103 kB in the current production build.
- Lazy-load the Three.js graphics bundle immediately while the static CSS fallback covers its startup.
- Keep the procedural background to one full-screen plane and one draw call.
- Calculate scroll damping once per rendered frame and derive visual-layer parallax inside the fragment shader.
- Render at a demand-driven 60 FPS, stop invalidating frames while the document is hidden, and cap DPR at 1.5.

## Implementation Guidelines

- Extend the existing editorial and architectural vocabulary instead of introducing an unrelated visual system.
- Keep the page responsive and respect `prefers-reduced-motion`.
- Keep ambient rendering demand-driven at 60 FPS, pause it while the document is hidden, and cap DPR at 1.5 unless a visible quality problem justifies a higher cost.
- Maintain accessible landmarks, heading order, link states, and visible keyboard focus.
- Do not fabricate experience details, project metrics, testimonials, or claims.
- Prefer small, focused changes over broad rewrites.
- Validate meaningful changes with the most relevant available checks.

## Git Guidelines

- Prefer small, incremental commits.
- Write each commit message as one short sentence.
- Never mention AI tools in commit messages, co-author tags, or pull requests.
