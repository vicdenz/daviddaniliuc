"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

import TypographyControls from "@/components/TypographyControls";
import { DitherControls, LayerControls } from "@/components/backdrop/BackdropControls";
import {
	DEFAULT_BACKDROP_VARIANT,
	DEFAULT_DITHER_SETTINGS,
	type BackdropVariant,
	type DitherSettings,
	type LayerSettings,
} from "@/components/backdrop/config";

const STORAGE_KEYS = {
	dither: "infrastructure-dither-settings-v9",
	variant: "backdrop-variant-v2",
} as const;

type BackdropTestHarnessProps = {
	variant: BackdropVariant;
	setVariant: Dispatch<SetStateAction<BackdropVariant>>;
	dither: DitherSettings;
	setDither: Dispatch<SetStateAction<DitherSettings>>;
	layers: LayerSettings;
	setLayers: Dispatch<SetStateAction<LayerSettings>>;
};

function readDitherSettings(): DitherSettings {
	try {
		const stored = localStorage.getItem(STORAGE_KEYS.dither);
		if (!stored) return DEFAULT_DITHER_SETTINGS;

		const parsed = JSON.parse(stored) as Partial<DitherSettings>;
		const settings = { ...DEFAULT_DITHER_SETTINGS, ...parsed };
		for (const key of Object.keys(DEFAULT_DITHER_SETTINGS) as Array<keyof DitherSettings>) {
			const value = settings[key];
			const fallback = DEFAULT_DITHER_SETTINGS[key];
			if (typeof value !== typeof fallback || (typeof value === "number" && !Number.isFinite(value))) return DEFAULT_DITHER_SETTINGS;
		}

		const validMethod = settings.method === "diffusion" || settings.method === "ordered";
		const validPattern = settings.pattern === "ordered" || settings.pattern === "cross" || settings.pattern === "diamond" || settings.pattern === "dot";
		return validMethod && validPattern ? settings : DEFAULT_DITHER_SETTINGS;
	} catch {
		return DEFAULT_DITHER_SETTINGS;
	}
}

function readVariant(): BackdropVariant {
	try {
		const stored = localStorage.getItem(STORAGE_KEYS.variant);
		return stored === "infrastructure" || stored === "topographic" ? stored : DEFAULT_BACKDROP_VARIANT;
	} catch {
		return DEFAULT_BACKDROP_VARIANT;
	}
}

function writeSetting(key: string, value: string) {
	try {
		localStorage.setItem(key, value);
	} catch {
		// Storage can be unavailable in privacy-restricted browsing contexts.
	}
}

export default function BackdropTestHarness({ variant, setVariant, dither, setDither, layers, setLayers }: BackdropTestHarnessProps) {
	const [settingsLoaded, setSettingsLoaded] = useState(false);

	useEffect(() => {
		setVariant(readVariant());
		setDither(readDitherSettings());
		setSettingsLoaded(true);
	}, [setDither, setVariant]);

	useEffect(() => {
		if (settingsLoaded) writeSetting(STORAGE_KEYS.variant, variant);
	}, [settingsLoaded, variant]);

	useEffect(() => {
		if (settingsLoaded) writeSetting(STORAGE_KEYS.dither, JSON.stringify(dither));
	}, [dither, settingsLoaded]);

	return (
		<>
			<LayerControls variant={variant} layers={layers} onVariantChange={setVariant} onChange={setLayers} />
			<TypographyControls />
			<DitherControls settings={dither} onChange={setDither} />
		</>
	);
}
