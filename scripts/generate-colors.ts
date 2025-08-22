#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { colorPalette, cssVariableMap, threeJsColorMap } from '../src/config/colors';

// Generate globals.css with dynamic colors
function generateGlobalsCss() {
  const cssVariables = Object.entries(colorPalette)
    .map(([key, value]) => {
      const cssVar = cssVariableMap[key as keyof typeof cssVariableMap];
      return `  ${cssVar}: ${value};`;
    })
    .join('\n');

  const cssContent = `@import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Inter:wght@300;400;500&display=swap');
@import "tailwindcss";

:root {
  /* Bonsai-inspired color palette */
${cssVariables}
  
  /* Typography */
  --font-heading: 'EB Garamond', serif;
  --font-body: 'Inter', sans-serif;
  
  /* Spacing & Layout */
  --container-max: 1200px;
  --section-padding: clamp(3rem, 8vw, 8rem);
  --element-spacing: clamp(1.5rem, 4vw, 3rem);
}

@theme inline {
  /* Colors */
  --color-washed-white: var(--washed-white);
  --color-stone-gray: var(--stone-gray);
  --color-stone-gray-light: var(--stone-gray-light);
  --color-deep-charcoal: var(--deep-charcoal);
  --color-charcoal-soft: var(--charcoal-soft);
  --color-moss-green: var(--moss-green);
  --color-moss-green-light: var(--moss-green-light);
  --color-clay-red: var(--clay-red);
  --color-clay-red-soft: var(--clay-red-soft);
  --color-wood-brown: var(--wood-brown);
  --color-wood-brown-light: var(--wood-brown-light);
  
  /* Typography */
  --font-family-heading: var(--font-heading);
  --font-family-body: var(--font-body);
  --font-family-sans: var(--font-body);
  
  /* Background and foreground */
  --color-background: var(--washed-white);
  --color-foreground: var(--deep-charcoal);
}

/* Global styles */
* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  background: var(--washed-white);
  color: var(--deep-charcoal);
  font-family: var(--font-body);
  font-weight: 400;
  line-height: 1.7;
  letter-spacing: 0.01em;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Heading styles */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: 400;
  line-height: 1.3;
  letter-spacing: 0.02em;
  margin: 0;
}

/* Subtle texture overlay */
body::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(circle at 25% 25%, rgba(110, 124, 96, 0.02) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(160, 92, 78, 0.01) 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--stone-gray-light);
}

::-webkit-scrollbar-thumb {
  background: var(--stone-gray);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--moss-green);
}

/* Selection styles */
::selection {
  background: var(--moss-green);
  color: var(--washed-white);
}

/* Focus styles */
:focus-visible {
  outline: 2px solid var(--moss-green);
  outline-offset: 2px;
  border-radius: 2px;
}

/* Smooth transitions for interactive elements */
a, button, [role="button"] {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Link styles */
a {
  color: var(--clay-red);
  text-decoration: none;
  position: relative;
}

a:hover {
  color: var(--deep-charcoal);
}

a:hover::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 1px;
  background: var(--clay-red);
  transform: scaleX(1);
  transition: transform 0.3s ease;
}

a::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 1px;
  background: var(--clay-red);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

/* Fade-in animation for content */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes gentleFloat {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes gentlePulse {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.8;
  }
}

/* Animation utilities */
.animate-fade-in-up {
  animation: fadeInUp 1s ease-out forwards;
}

.animate-fade-in {
  animation: fadeIn 1s ease-out forwards;
}

.animate-gentle-float {
  animation: gentleFloat 6s ease-in-out infinite;
}

.animate-gentle-pulse {
  animation: gentlePulse 4s ease-in-out infinite;
}

/* Delay classes for staggered animations */
.delay-100 {
  animation-delay: 0.1s;
}

.delay-200 {
  animation-delay: 0.2s;
}

.delay-300 {
  animation-delay: 0.3s;
}

.delay-400 {
  animation-delay: 0.4s;
}

.delay-500 {
  animation-delay: 0.5s;
}

/* Intersection Observer animation styles */
.fade-in-section {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-in-section.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* Button hover effects */
button:hover {
  transform: translateY(-2px);
}

button:active {
  transform: translateY(0);
}

/* Parallax scroll effect for decorative elements */
.parallax-slow {
  will-change: transform;
}

/* Responsive typography scale */
@media (max-width: 768px) {
  h1 {
    font-size: clamp(2.5rem, 8vw, 4rem);
  }
  
  h2 {
    font-size: clamp(2rem, 6vw, 3rem);
  }
  
  h3 {
    font-size: clamp(1.5rem, 5vw, 2rem);
  }
}

/* Improved focus management for accessibility */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--moss-green);
  color: var(--washed-white);
  padding: 8px;
  text-decoration: none;
  transition: top 0.3s;
}

.skip-link:focus {
  top: 6px;
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .animate-gentle-float,
  .animate-gentle-pulse {
    animation: none;
  }
}`;

  return cssContent;
}

// Generate Three.js colors
function generateThreeJsColors() {
  const colorImports = Object.entries(threeJsColorMap)
    .map(([exportName, colorKey]) => {
      const hexColor = colorPalette[colorKey as keyof typeof colorPalette];
      return `const ${exportName} = new Color('${hexColor}').convertLinearToSRGB(); // ${colorKey}`;
    })
    .join('\n');

  const exportList = Object.keys(threeJsColorMap).join(',\n  ');

  const tsContent = `// Auto-generated from src/config/colors.ts
// Do not edit this file directly - run 'npm run generate:colors' instead

import { Color } from 'three';

${colorImports}

export {
  ${exportList},
};`;

  return tsContent;
}

// Write files
function writeFiles() {
  const srcDir = path.join(process.cwd(), 'src');
  
  // Write globals.css
  const globalsCssPath = path.join(srcDir, 'app', 'globals.css');
  fs.writeFileSync(globalsCssPath, generateGlobalsCss());
  console.log('✅ Generated globals.css');

  // Write colors.ts
  const colorsPath = path.join(srcDir, 'resources', 'colours.ts');
  fs.writeFileSync(colorsPath, generateThreeJsColors());
  console.log('✅ Generated colours.ts');
}

// Run the script
writeFiles(); 