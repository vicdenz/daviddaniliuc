# David Daniliuc - Personal Website

## Overview
Personal portfolio website built with Next.js 15, React 19, TypeScript, and Tailwind CSS 4. Features a Three.js animated shader background using @react-three/fiber and @react-three/drei.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 with custom CSS variables (dark theme, earthy color palette)
- **3D Graphics**: Three.js via @react-three/fiber, custom GLSL shaders (vertex + fragment)
- **Icons**: Font Awesome (brands + solid)
- **Fonts**: Funnel Sans + Funnel Display (Google Fonts)

## Project Structure
- `src/app/page.tsx` — Main homepage with About, Projects, and Contact sections
- `src/app/layout.tsx` — Root layout with font setup and metadata
- `src/app/globals.css` — Global styles, CSS variables, animations, glass-card effects
- `src/components/PageCanvas.tsx` — Three.js canvas wrapper for background shader
- `src/components/ShaderPlane.tsx` — Custom GLSL shader material with color uniforms
- `src/components/ProjectCard.tsx` — Reusable project display card
- `src/components/ContactButton.tsx` — Icon link button (Font Awesome)
- `src/components/Card.tsx` — Glass-morphism card component
- `src/components/Navbar.tsx` — Navbar (not currently used on main page)
- `src/resources/colors.ts` — Three.js Color constants matching CSS theme
- `src/components/shaders/` — GLSL vertex and fragment shader files

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — ESLint

## Design Notes
- Dark background with light text (deep charcoal bg, stone-gray/light text)
- Earthy color palette: moss green accents, stone grays, rice paper tones
- Staggered fade-in animations on page load
- Responsive: sidebar layout on desktop, stacked on mobile
- Custom GLSL shaders loaded via raw-loader + glslify-loader (configured in next.config.ts)
