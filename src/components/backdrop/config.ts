export const SITE_ANIMATION = {
	loaderFallbackMs: 4000,
	loaderFadeMs: 60,
	loaderFadeEasing: "ease-in",
	backdropFadeMs: 960,
	backdropFadeEasing: "cubic-bezier(0.16, 1, 0.3, 1)",
	contentRevealMs: 900,
	revealEasing: "cubic-bezier(0.22, 1, 0.36, 1)",
	contentRevealDelayMs: 0,
	nameUnderlineDelayMs: 260,
	sectionDividerRevealDelayMs: 840,
	sectionDividerRevealMs: 220,
	sectionDividerRevealStaggerMs: 70,
	contentRevealStaggerMs: {
		0: 0,
		100: 110,
		200: 265,
		300: 430,
		500: 710,
	},
	shaderRevealDelayMs: 0,
	shaderRevealDurationMs: 1200,
} as const;

export const BACKDROP_ANIMATION = {
	frameTime: 1000 / 60,
	revealDelay: SITE_ANIMATION.shaderRevealDelayMs / 1000,
	revealDuration: SITE_ANIMATION.shaderRevealDurationMs / 1000,
	scrollDistanceForMaxBoost: 40,
	baseNoiseSpeed: 1.6,
	maxScrollSpeed: 12,
	scrollReturnDuration: 2.1,
	scrollResponseSmoothing: 10,
} as const;
