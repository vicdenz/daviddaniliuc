export type DitherMethod = "diffusion" | "ordered";
export type DitherPattern = "ordered" | "cross" | "diamond" | "dot";

export type DitherSettings = {
	method: DitherMethod;
	pattern: DitherPattern;
	markSize: number;
	amount: number;
	inkCoverage: number;
	inkPunch: number;
	definition: number;
	softness: number;
	diffusion: number;
	secondaryEnabled: boolean;
	secondarySize: number;
	secondaryAmount: number;
	secondaryCoverage: number;
	secondaryInk: number;
	secondarySoftness: number;
};

export type LayerSettings = Record<"grain" | "grid" | "tunnel" | "braces" | "rails" | "routes" | "packets" | "scan" | "dither", boolean>;

export const SITE_ANIMATION = {
	loaderFallbackMs: 4000,
	loaderFadeMs: 80,
	loaderFadeEasing: "ease-in",
	backdropFadeMs: 960,
	backdropFadeEasing: "cubic-bezier(0.16, 1, 0.3, 1)",
	contentRevealMs: 840,
	contentRevealEasing: "cubic-bezier(0.22, 1, 0.36, 1)",
	contentRevealDelayMs: 0,
	contentRevealStaggerMs: {
		0: 0,
		100: 110,
		200: 265,
		300: 430,
		400: 580,
		500: 710,
	},
	shaderRevealDelayMs: 0,
	shaderRevealDurationMs: 1200,
} as const;

export const BACKDROP_ANIMATION = {
	frameTime: 1000 / 60,
	// The canvas opacity transition provides the initial handoff from the CSS
	// fallback, so the procedural reveal can begin immediately with it.
	revealDelay: SITE_ANIMATION.shaderRevealDelayMs / 1000,
	revealDuration: SITE_ANIMATION.shaderRevealDurationMs / 1000,
	scrollDistanceForMaxBoost: 40,
	baseNoiseSpeed: 1.6,
	maxScrollSpeed: 12,
	scrollReturnDuration: 2.1,
} as const;

export const DEFAULT_DITHER_SETTINGS: DitherSettings = {
	method: "diffusion",
	pattern: "diamond",
	markSize: 4,
	amount: 0.94,
	inkCoverage: 2.5,
	inkPunch: 3.6,
	definition: 0.49,
	softness: 0.84,
	diffusion: 0.92,
	secondaryEnabled: true,
	secondarySize: 3.5,
	secondaryAmount: 0.26,
	secondaryCoverage: 1.23,
	secondaryInk: 1.06,
	secondarySoftness: 0.19,
};

export const DEFAULT_LAYER_SETTINGS: LayerSettings = {
	grain: true,
	grid: true,
	tunnel: true,
	braces: true,
	rails: true,
	routes: true,
	packets: true,
	scan: true,
	dither: true,
};

export const METHOD_VALUE: Record<DitherMethod, number> = { ordered: 0, diffusion: 1 };
export const PATTERN_VALUE: Record<DitherPattern, number> = { ordered: 0, cross: 1, diamond: 2, dot: 3 };

export const DITHER_UNIFORMS = [
	["markSize", "uDitherSize"],
	["amount", "uDitherAmount"],
	["inkCoverage", "uDitherCoverage"],
	["inkPunch", "uDitherInkPunch"],
	["definition", "uDitherContrast"],
	["softness", "uDitherSoftness"],
	["diffusion", "uDitherSpread"],
	["secondarySize", "uSecondaryDitherSize"],
	["secondaryAmount", "uSecondaryDitherAmount"],
	["secondaryCoverage", "uSecondaryDitherCoverage"],
	["secondaryInk", "uSecondaryDitherInk"],
	["secondarySoftness", "uSecondaryDitherSoftness"],
] as const satisfies ReadonlyArray<readonly [keyof DitherSettings, string]>;

export const LAYER_UNIFORMS = {
	grain: "uLayerGrain",
	grid: "uLayerGrid",
	tunnel: "uLayerTunnel",
	braces: "uLayerBraces",
	rails: "uLayerRails",
	routes: "uLayerRoutes",
	packets: "uLayerPackets",
	scan: "uLayerScan",
	dither: "uLayerDither",
} as const satisfies Record<keyof LayerSettings, string>;
