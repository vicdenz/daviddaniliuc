export type BackdropVariant = "infrastructure" | "topographic";
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

export type LayerSettings = Record<"grain" | "grid" | "tunnel" | "braces" | "rails" | "nodes" | "routes" | "packets" | "scan" | "dither", boolean>;

export const DEFAULT_BACKDROP_VARIANT: BackdropVariant = "topographic";

export const BACKDROP_ANIMATION = {
	frameTime: 1000 / 60,
	revealDuration: 0.8,
	scrollDistanceForMaxBoost: 40,
	baseNoiseSpeed: 1.6,
	maxScrollSpeed: 12,
	scrollReturnDuration: 1.8,
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
	nodes: true,
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
	nodes: "uLayerNodes",
	routes: "uLayerRoutes",
	packets: "uLayerPackets",
	scan: "uLayerScan",
	dither: "uLayerDither",
} as const satisfies Record<keyof LayerSettings, string>;
