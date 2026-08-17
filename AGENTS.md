# David Daniliuc — Personal Website

## Project

This repository contains David Daniliuc's single-page personal portfolio. It is built with Next.js 15, React 19, TypeScript, and Tailwind CSS 4.

The site presents David's infrastructure engineering practice, experience, selected projects, interests, and contact links. Preserve the current biography, experience, projects, contact destinations, and single-page route unless the user explicitly asks to change them.

## Commands

- `npm run dev` — start the development server
- `npm run build` — create a production build
- `npm run lint` — run linting

## Design Direction

The authoritative visual direction is **Systems Journal**: communicate an infrastructure practice through the visual language of a working architectural drawing.

- Mode: redesign overhaul
- Palette: rice paper `#f4f0e6`, blue-black `#18283b`, cobalt `#2457d6`, periwinkle `#afc2e6`, and blue wash `#dce5f2`
- Typography: DM Sans for reading and display text; IBM Plex Mono for enlarged technical metadata
- Structure: one continuous newspaper column; create hierarchy with typography and whitespace rather than bordered sections
- Motion: use restrained shader-layer parallax driven by page scroll, with animated packet traffic and node pulses; the middle-depth tunnel uses orthogonal frames without diagonal converging beams and remains static apart from parallax; do not add camera or pointer movement
- Rendering: build the procedural background as one Three.js and React Three Fiber shader plane; preserve the visual layers inside a single fragment shader to keep the scene to one draw call
- Background opacity: use layered opacity; keep major grid lines, tunnel frames, braces, and rails more defined than minor grid detail, nodes, routes, packets, and atmospheric motion
- Post-processing: none; render the procedural shader layers directly to the screen
- Tone: calm, precise, technically credible, and editorial

Avoid résumé imitation, boxed sections, horizontal separators, oversized headlines, navigation chrome, terminal cosplay, fabricated engineering metrics, and decorative effects that do not reinforce the systems-journal concept.

## Current Architecture

- `src/app/page.tsx` — homepage content and editorial structure
- `src/app/globals.css` — design tokens, typography, responsive layout, and interaction states
- `src/app/layout.tsx` — root layout and metadata
- `src/components/PageCanvas.tsx` — page composition and idle-time loading boundary for the graphics bundle
- `src/components/InfrastructureBackdrop.tsx` — single-plane React Three Fiber scene, 60 FPS scheduler, and scroll state
- `src/components/shaders/frag/infrastructure-background.frag` — procedural paper, grid, perspective tunnel, scaffold, traffic, and per-layer parallax

The former multi-shader, card, navigation, Font Awesome, and dark glass-card implementation has been removed. Do not reintroduce that visual system unless explicitly requested.

## Performance Profile

- Initial route JavaScript is approximately 103 kB in the current production build.
- Load the Three.js graphics bundle during browser idle time so it does not compete with initial page content.
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
