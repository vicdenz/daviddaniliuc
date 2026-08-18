"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { Color, MathUtils, ShaderMaterial, Vector2 } from "three";

import backgroundVertex from "@/components/shaders/vert/background.vert";
import backgroundFragment from "@/components/shaders/frag/infrastructure-background.frag";

const TARGET_FRAME_TIME = 1000 / 60;
const DITHER_STORAGE_KEY = "infrastructure-dither-settings-v5";

type DitherMethod = "diffusion" | "ordered";
type DitherPattern = "ordered" | "cross" | "diamond" | "dot";

type DitherSettings = {
	method: DitherMethod;
	pattern: DitherPattern;
	markSize: number;
	amount: number;
	inkCoverage: number;
	inkPunch: number;
	definition: number;
	softness: number;
	diffusion: number;
};

const DEFAULT_DITHER_SETTINGS: DitherSettings = {
	method: "diffusion",
	pattern: "cross",
	markSize: 7.5,
	amount: 0.92,
	inkCoverage: 2.5,
	inkPunch: 2.6,
	definition: 0.6,
	softness: 0.04,
	diffusion: 0.82,
};

const METHOD_VALUE: Record<DitherMethod, number> = {
	ordered: 0,
	diffusion: 1,
};

const PATTERN_VALUE: Record<DitherPattern, number> = {
	ordered: 0,
	cross: 1,
	diamond: 2,
	dot: 3,
};

const CONTROL_COPY = {
	markSize: {
		label: "Mark size",
		help: "How large each printed mark appears.",
	},
	amount: {
		label: "Dither visibility",
		help: "Zero shows the smooth original; 100% shows only printed marks.",
	},
	inkCoverage: {
		label: "Detail coverage",
		help: "Controls how much faint background detail becomes visible marks.",
	},
	inkPunch: {
		label: "Ink punch",
		help: "Strengthens the existing colors inside each mark without remapping them.",
	},
	definition: {
		label: "Tone separation",
		help: "Higher values make strong structures bold and faint details sparse.",
	},
	softness: {
		label: "Mark softness",
		help: "Zero creates hard pixels; higher values smooth their edges.",
	},
	diffusion: {
		label: "Diffusion spread",
		help: "Moves from a regular matrix toward organic error-diffusion texture.",
	},
} as const;

type LayerSettings = {
	grain: boolean;
	grid: boolean;
	tunnel: boolean;
	braces: boolean;
	rails: boolean;
	nodes: boolean;
	routes: boolean;
	packets: boolean;
	scan: boolean;
	dither: boolean;
};

const DEFAULT_LAYER_SETTINGS: LayerSettings = {
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

const LAYER_OPTIONS: Array<{ key: keyof LayerSettings; label: string }> = [
  { key: "grain", label: "Paper grain" },
	{ key: "grid", label: "Technical grid" },
	{ key: "tunnel", label: "Tunnel frames" },
	{ key: "braces", label: "Cross-bracing" },
	{ key: "rails", label: "Scaffold rails" },
	{ key: "nodes", label: "Nodes and circles" },
	{ key: "routes", label: "Traffic routes" },
	{ key: "packets", label: "Moving packets" },
	{ key: "scan", label: "Scan wash" },
	{ key: "dither", label: "Dither treatment" },
];

function RenderScheduler({ reduceMotion }: { reduceMotion: boolean }) {
	const invalidate = useThree((state) => state.invalidate);

	useEffect(() => {
		invalidate();
		if (reduceMotion) return;

		let animationFrame = 0;
		let previousFrame = 0;
		const schedule = (timestamp: number) => {
			if (document.visibilityState === "visible" && timestamp - previousFrame >= TARGET_FRAME_TIME - 1) {
				previousFrame = timestamp;
				invalidate();
			}
			animationFrame = window.requestAnimationFrame(schedule);
		};
		animationFrame = window.requestAnimationFrame(schedule);
		return () => window.cancelAnimationFrame(animationFrame);
	}, [invalidate, reduceMotion]);

	return null;
}

function InfrastructureScene({ reduceMotion, dither, layers, randomSeed }: { reduceMotion: boolean; dither: DitherSettings; layers: LayerSettings; randomSeed: number }) {
	const materialRef = useRef<ShaderMaterial>(null);
	const smoothedScroll = useRef(0);
	const { gl, invalidate, size, viewport } = useThree();
	const uniforms = useMemo(
		() => ({
			uTime: { value: 0 },
			uAspect: { value: 1 },
			uResolution: { value: new Vector2(1, 1) },
			uScroll: { value: 0 },
			uPixelRatio: { value: 1 },
			uRandomSeed: { value: 0 },
			uDitherMethod: { value: METHOD_VALUE[DEFAULT_DITHER_SETTINGS.method] },
			uDitherPattern: { value: PATTERN_VALUE[DEFAULT_DITHER_SETTINGS.pattern] },
			uDitherSize: { value: DEFAULT_DITHER_SETTINGS.markSize },
			uDitherAmount: { value: DEFAULT_DITHER_SETTINGS.amount },
			uDitherCoverage: { value: DEFAULT_DITHER_SETTINGS.inkCoverage },
			uDitherInkPunch: { value: DEFAULT_DITHER_SETTINGS.inkPunch },
			uDitherContrast: { value: DEFAULT_DITHER_SETTINGS.definition },
			uDitherSoftness: { value: DEFAULT_DITHER_SETTINGS.softness },
			uDitherSpread: { value: DEFAULT_DITHER_SETTINGS.diffusion },
			uLayerGrain: { value: 1 },
			uLayerGrid: { value: 1 },
			uLayerTunnel: { value: 1 },
			uLayerBraces: { value: 1 },
			uLayerRails: { value: 1 },
			uLayerNodes: { value: 1 },
			uLayerRoutes: { value: 1 },
			uLayerPackets: { value: 1 },
			uLayerScan: { value: 1 },
			uLayerDither: { value: 1 },
		}),
		[],
	);

	useEffect(() => invalidate(), [dither, invalidate, layers, randomSeed]);

	useFrame(({ clock }, delta) => {
		const material = materialRef.current;
		if (!material) return;

		const scrollTarget = reduceMotion ? 0 : window.scrollY / Math.max(window.innerHeight, 1);
		smoothedScroll.current = MathUtils.damp(smoothedScroll.current, scrollTarget, 3.4, delta);
		const pixelRatio = gl.getPixelRatio();

		material.uniforms.uTime.value = reduceMotion ? 0 : clock.elapsedTime;
		material.uniforms.uAspect.value = size.width / Math.max(size.height, 1);
		material.uniforms.uResolution.value.set(size.width * pixelRatio, size.height * pixelRatio);
		material.uniforms.uScroll.value = smoothedScroll.current;
		material.uniforms.uPixelRatio.value = pixelRatio;
		material.uniforms.uRandomSeed.value = randomSeed;
		material.uniforms.uDitherMethod.value = METHOD_VALUE[dither.method];
		material.uniforms.uDitherPattern.value = PATTERN_VALUE[dither.pattern];
		material.uniforms.uDitherSize.value = dither.markSize;
		material.uniforms.uDitherAmount.value = dither.amount;
		material.uniforms.uDitherCoverage.value = dither.inkCoverage;
		material.uniforms.uDitherInkPunch.value = dither.inkPunch;
		material.uniforms.uDitherContrast.value = dither.definition;
		material.uniforms.uDitherSoftness.value = dither.softness;
		material.uniforms.uDitherSpread.value = dither.diffusion;
		material.uniforms.uLayerGrain.value = Number(layers.grain);
		material.uniforms.uLayerGrid.value = Number(layers.grid);
		material.uniforms.uLayerTunnel.value = Number(layers.tunnel);
		material.uniforms.uLayerBraces.value = Number(layers.braces);
		material.uniforms.uLayerRails.value = Number(layers.rails);
		material.uniforms.uLayerNodes.value = Number(layers.nodes);
		material.uniforms.uLayerRoutes.value = Number(layers.routes);
		material.uniforms.uLayerPackets.value = Number(layers.packets);
		material.uniforms.uLayerScan.value = Number(layers.scan);
		material.uniforms.uLayerDither.value = Number(layers.dither);
	});

	return (
		<mesh scale={[viewport.width, viewport.height, 1]} frustumCulled={false}>
			<planeGeometry args={[1, 1]} />
			<shaderMaterial
				ref={materialRef}
				vertexShader={backgroundVertex}
				fragmentShader={backgroundFragment}
				uniforms={uniforms}
				depthTest={false}
				depthWrite={false}
				toneMapped={false}
			/>
		</mesh>
	);
}

type DitherSliderProps = {
	name: keyof typeof CONTROL_COPY;
	value: number;
	min: number;
	max: number;
	step: number;
	valueLabel: string;
	onChange: (value: number) => void;
};

function DitherSlider({ name, value, min, max, step, valueLabel, onChange }: DitherSliderProps) {
	const copy = CONTROL_COPY[name];

	return (
		<label className="dither-control">
			<span className="dither-control-heading">
				<span>{copy.label}</span>
				<output>{valueLabel}</output>
			</span>
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(event) => onChange(Number(event.target.value))}
			/>
			<small>{copy.help}</small>
		</label>
	);
}

function DitherControls({ settings, onChange }: { settings: DitherSettings; onChange: (settings: DitherSettings) => void }) {
	const [copied, setCopied] = useState(false);
	const update = <Key extends keyof DitherSettings>(key: Key, value: DitherSettings[Key]) => {
		onChange({ ...settings, [key]: value });
	};

	const copySettings = async () => {
		await navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1400);
	};

	return (
		<details className="dither-panel" open>
			<summary>
				<span>Dither tuning</span>
				<small>Development only</small>
			</summary>
			<div className="dither-panel-body">
				<label className="dither-control">
					<span className="dither-control-heading">
						<span>Dither technique</span>
					</span>
					<select value={settings.method} onChange={(event) => update("method", event.target.value as DitherMethod)}>
						<option value="diffusion">Floyd–Steinberg style — organic</option>
						<option value="ordered">Ordered matrix — regular</option>
					</select>
					<small>Choose organic directional diffusion or a regular Bayer matrix.</small>
				</label>

				<label className="dither-control">
					<span className="dither-control-heading">
						<span>Mark style</span>
					</span>
					<select value={settings.pattern} onChange={(event) => update("pattern", event.target.value as DitherPattern)}>
						<option value="cross">Crosses — closest to reference</option>
						<option value="diamond">Diamonds</option>
						<option value="dot">Dots</option>
						<option value="ordered">Ordered squares</option>
					</select>
					<small>Choose the shape used to build the drawing.</small>
				</label>

				<DitherSlider name="markSize" value={settings.markSize} min={2} max={14} step={0.5} valueLabel={`${settings.markSize}px`} onChange={(value) => update("markSize", value)} />
				<DitherSlider name="amount" value={settings.amount} min={0} max={1} step={0.01} valueLabel={`${Math.round(settings.amount * 100)}%`} onChange={(value) => update("amount", value)} />
				<DitherSlider name="inkCoverage" value={settings.inkCoverage} min={0.35} max={2.5} step={0.01} valueLabel={`${Math.round(settings.inkCoverage * 100)}%`} onChange={(value) => update("inkCoverage", value)} />
				<DitherSlider name="inkPunch" value={settings.inkPunch} min={1} max={4} step={0.05} valueLabel={`${settings.inkPunch.toFixed(2)}×`} onChange={(value) => update("inkPunch", value)} />
				<DitherSlider name="definition" value={settings.definition} min={0.4} max={3} step={0.01} valueLabel={settings.definition.toFixed(2)} onChange={(value) => update("definition", value)} />
				<DitherSlider name="softness" value={settings.softness} min={0} max={1} step={0.01} valueLabel={`${Math.round(settings.softness * 100)}%`} onChange={(value) => update("softness", value)} />
				{settings.method === "diffusion" ? <DitherSlider name="diffusion" value={settings.diffusion} min={0} max={1} step={0.01} valueLabel={`${Math.round(settings.diffusion * 100)}%`} onChange={(value) => update("diffusion", value)} /> : null}

				<div className="dither-actions">
					<button type="button" onClick={() => onChange(DEFAULT_DITHER_SETTINGS)}>Reset</button>
					<button type="button" onClick={copySettings}>{copied ? "Copied" : "Copy settings"}</button>
				</div>
			</div>
		</details>
	);
}

function LayerControls({ layers, onChange }: { layers: LayerSettings; onChange: (layers: LayerSettings) => void }) {
	return (
		<details className="layer-panel" open>
			<summary>
				<span>Backdrop layers</span>
				<small>Testing</small>
			</summary>
			<div className="layer-panel-body">
				{LAYER_OPTIONS.map((option) => (
					<label className="layer-toggle" key={option.key}>
						<input
							type="checkbox"
							checked={layers[option.key]}
							onChange={(event) => onChange({ ...layers, [option.key]: event.target.checked })}
						/>
						<span>{option.label}</span>
					</label>
				))}
				<button className="layer-reset" type="button" onClick={() => onChange(DEFAULT_LAYER_SETTINGS)}>Show all</button>
			</div>
		</details>
	);
}

export default function InfrastructureBackdrop() {
	const [reduceMotion, setReduceMotion] = useState(false);
	const [dither, setDither] = useState<DitherSettings>(DEFAULT_DITHER_SETTINGS);
	const [settingsLoaded, setSettingsLoaded] = useState(false);
	const [randomSeed, setRandomSeed] = useState(0);
	const [layers, setLayers] = useState<LayerSettings>(DEFAULT_LAYER_SETTINGS);

	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		const updatePreference = () => setReduceMotion(mediaQuery.matches);
		updatePreference();
		mediaQuery.addEventListener("change", updatePreference);
		return () => mediaQuery.removeEventListener("change", updatePreference);
	}, []);

	useEffect(() => {
		const randomValue = new Uint32Array(1);
		window.crypto.getRandomValues(randomValue);
		setRandomSeed((randomValue[0] / 4294967295) * 4096);
	}, []);

	useEffect(() => {
		try {
			const storedSettings = window.localStorage.getItem(DITHER_STORAGE_KEY);
			if (storedSettings) {
				setDither({ ...DEFAULT_DITHER_SETTINGS, ...JSON.parse(storedSettings) });
			}
		} catch {
			window.localStorage.removeItem(DITHER_STORAGE_KEY);
		}
		setSettingsLoaded(true);
	}, []);

	useEffect(() => {
		if (!settingsLoaded) return;
		window.localStorage.setItem(DITHER_STORAGE_KEY, JSON.stringify(dither));
	}, [dither, settingsLoaded]);

	return (
		<>
			<div className="infrastructure-backdrop" aria-hidden="true">
				<Canvas
					orthographic
					camera={{ position: [0, 0, 10], zoom: 1 }}
					dpr={[1, 1.5]}
					frameloop="demand"
					gl={{ alpha: false, antialias: true, powerPreference: "high-performance" }}
					onCreated={({ gl }) => gl.setClearColor(new Color("#f4f0e6"), 1)}
				>
					<RenderScheduler reduceMotion={reduceMotion} />
					<InfrastructureScene reduceMotion={reduceMotion} dither={dither} layers={layers} randomSeed={randomSeed} />
				</Canvas>
			</div>
			{process.env.NODE_ENV !== "production" ? (
				<>
					<LayerControls layers={layers} onChange={setLayers} />
					<DitherControls settings={dither} onChange={setDither} />
				</>
			) : null}
		</>
	);
}
