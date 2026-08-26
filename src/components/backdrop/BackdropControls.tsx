"use client";

import { useState } from "react";

import {
	DEFAULT_DITHER_SETTINGS,
	DEFAULT_LAYER_SETTINGS,
	type BackdropVariant,
	type DitherMethod,
	type DitherPattern,
	type DitherSettings,
	type LayerSettings,
} from "@/components/backdrop/config";

import styles from "./BackdropControls.module.css";

const LAYER_OPTIONS: Record<BackdropVariant, Array<{ key: keyof LayerSettings; label: string }>> = {
	infrastructure: [
		["grain", "Paper grain"], ["grid", "Technical grid"], ["tunnel", "Tunnel frames"], ["braces", "Cross-bracing"], ["rails", "Scaffold rails"],
		["nodes", "Nodes and circles"], ["routes", "Traffic routes"], ["packets", "Moving packets"], ["scan", "Scan wash"], ["dither", "Dither treatment"],
	].map(([key, label]) => ({ key: key as keyof LayerSettings, label })),
	topographic: [
		["grain", "Survey paper grain"], ["grid", "Rotated survey grid"], ["tunnel", "Topographic contours"], ["braces", "Field hatching"], ["rails", "Elevation bands"],
		["routes", "Signal traces"], ["packets", "Moving beacons"], ["scan", "Radial scan"], ["dither", "Dither treatment"],
	].map(([key, label]) => ({ key: key as keyof LayerSettings, label })),
};

type NumericDitherKey = Exclude<keyof DitherSettings, "method" | "pattern" | "secondaryEnabled">;
type Slider = {
	key: NumericDitherKey;
	label: string;
	help: string;
	min: number;
	max: number;
	step: number;
	format: "percent" | "pixels" | "times" | "decimal";
};

const PRIMARY_SLIDERS: Slider[] = [
	{ key: "markSize", label: "Mark size", help: "How large each printed mark appears.", min: 2, max: 14, step: 0.5, format: "pixels" },
	{ key: "amount", label: "Dither visibility", help: "Zero shows the smooth original; 100% shows only printed marks.", min: 0, max: 1, step: 0.01, format: "percent" },
	{ key: "inkCoverage", label: "Detail coverage", help: "Controls how much faint background detail becomes visible marks.", min: 0.35, max: 2.5, step: 0.01, format: "percent" },
	{ key: "inkPunch", label: "Ink punch", help: "Strengthens the existing colors inside each mark without remapping them.", min: 1, max: 4, step: 0.05, format: "times" },
	{ key: "definition", label: "Tone separation", help: "Higher values make strong structures bold and faint details sparse.", min: 0.4, max: 3, step: 0.01, format: "decimal" },
	{ key: "softness", label: "Mark softness", help: "Zero creates hard pixels; higher values smooth their edges.", min: 0, max: 1, step: 0.01, format: "percent" },
	{ key: "diffusion", label: "Diffusion spread", help: "Moves from a regular matrix toward organic error-diffusion texture.", min: 0, max: 1, step: 0.01, format: "percent" },
];

const SECONDARY_SLIDERS: Slider[] = [
	{ key: "secondarySize", label: "Cross size", help: "Sets the spacing and footprint of the secondary crosses.", min: 2, max: 8, step: 0.5, format: "pixels" },
	{ key: "secondaryAmount", label: "Cross visibility", help: "Controls how strongly the cross layer blends over the primary marks.", min: 0, max: 1, step: 0.01, format: "percent" },
	{ key: "secondaryCoverage", label: "Cross coverage", help: "Controls how readily crosses fill residual midtone gaps.", min: 0.2, max: 1.5, step: 0.01, format: "percent" },
	{ key: "secondaryInk", label: "Cross ink", help: "Sets cross color strength relative to the primary ink punch.", min: 0.25, max: 1.5, step: 0.01, format: "times" },
	{ key: "secondarySoftness", label: "Cross softness", help: "Softens only the edges of the secondary cross marks.", min: 0, max: 1, step: 0.01, format: "percent" },
];

const formatValue = (value: number, format: Slider["format"]) => ({
	percent: `${Math.round(value * 100)}%`,
	pixels: `${value}px`,
	times: `${value.toFixed(2)}×`,
	decimal: value.toFixed(2),
})[format];

function DitherSlider({ slider, value, onChange }: { slider: Slider; value: number; onChange: (value: number) => void }) {
	return (
		<label className={styles.control}>
			<span className={styles.controlHeading}><span>{slider.label}</span><output>{formatValue(value, slider.format)}</output></span>
			<input type="range" min={slider.min} max={slider.max} step={slider.step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
			<small>{slider.help}</small>
		</label>
	);
}

export function DitherControls({ settings, onChange }: { settings: DitherSettings; onChange: (settings: DitherSettings) => void }) {
	const [copied, setCopied] = useState(false);
	const update = <Key extends keyof DitherSettings>(key: Key, value: DitherSettings[Key]) => onChange({ ...settings, [key]: value });
	const renderSlider = (slider: Slider) => <DitherSlider key={slider.key} slider={slider} value={settings[slider.key]} onChange={(value) => update(slider.key, value)} />;
	const copySettings = async () => {
		await navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
		setCopied(true);
		setTimeout(() => setCopied(false), 1400);
	};

	return (
		<details className={`${styles.panel} ${styles.ditherPanel}`} open>
			<summary><span>Dither tuning</span><small>Development only</small></summary>
			<div className={styles.ditherBody}>
				<label className={styles.control}>
					<span className={styles.controlHeading}><span>Dither technique</span></span>
					<select value={settings.method} onChange={(event) => update("method", event.target.value as DitherMethod)}>
						<option value="diffusion">Floyd–Steinberg style — organic</option><option value="ordered">Ordered matrix — regular</option>
					</select>
					<small>Choose organic directional diffusion or a regular Bayer matrix.</small>
				</label>
				<label className={styles.control}>
					<span className={styles.controlHeading}><span>Mark style</span></span>
					<select value={settings.pattern} onChange={(event) => update("pattern", event.target.value as DitherPattern)}>
						<option value="cross">Crosses — closest to reference</option><option value="diamond">Diamonds</option><option value="dot">Dots</option><option value="ordered">Ordered squares</option>
					</select>
					<small>Choose the shape used to build the drawing.</small>
				</label>
				{PRIMARY_SLIDERS.filter(({ key }) => key !== "diffusion" || settings.method === "diffusion").map(renderSlider)}
				<fieldset className={styles.secondary}>
					<legend>Secondary cross layer</legend>
					<label className={styles.secondaryToggle}>
						<input type="checkbox" checked={settings.secondaryEnabled} onChange={(event) => update("secondaryEnabled", event.target.checked)} />
						<span><strong>Blend cross overlay</strong><small>Adds offset crosses where the primary marks leave visual gaps.</small></span>
					</label>
					{settings.secondaryEnabled ? <div className={styles.secondaryControls}>{SECONDARY_SLIDERS.map(renderSlider)}</div> : null}
				</fieldset>
				<div className={styles.actions}>
					<button type="button" onClick={() => onChange(DEFAULT_DITHER_SETTINGS)}>Reset</button>
					<button type="button" onClick={copySettings}>{copied ? "Copied" : "Copy settings"}</button>
				</div>
			</div>
		</details>
	);
}

export function LayerControls({ variant, layers, onVariantChange, onChange }: { variant: BackdropVariant; layers: LayerSettings; onVariantChange: (variant: BackdropVariant) => void; onChange: (layers: LayerSettings) => void }) {
	return (
		<details className={`${styles.panel} ${styles.layerPanel}`} open>
			<summary><span>Backdrop layers</span><small>Testing</small></summary>
			<div className={styles.layerBody}>
				<label className={styles.variant}>
					<span>Backdrop design</span>
					<select value={variant} onChange={(event) => onVariantChange(event.target.value as BackdropVariant)}><option value="infrastructure">Infrastructure Blueprint</option><option value="topographic">Topographic Flow</option></select>
				</label>
				{LAYER_OPTIONS[variant].map(({ key, label }) => (
					<label className={styles.toggle} key={key}><input type="checkbox" checked={layers[key]} onChange={(event) => onChange({ ...layers, [key]: event.target.checked })} /><span>{label}</span></label>
				))}
				<button className={styles.reset} type="button" onClick={() => onChange(DEFAULT_LAYER_SETTINGS)}>Show all</button>
			</div>
		</details>
	);
}
