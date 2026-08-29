"use client";

import { Canvas } from "@react-three/fiber";
import { lazy, Suspense, useEffect, useState } from "react";

import { BackdropScene, RenderScheduler } from "@/components/backdrop/BackdropScene";
import {
	DEFAULT_DITHER_SETTINGS,
	DEFAULT_LAYER_SETTINGS,
	type DitherSettings,
} from "@/components/backdrop/config";

// The harness owns every development-only panel, including font pairing controls.
// Keeping the conditional import here prevents its UI, fonts, and runtime behavior
// from entering production when the flag is disabled.
const SHOW_TEST_PANELS = process.env.NEXT_PUBLIC_BACKDROP_TEST_CONTROLS === "true";
const BackdropTestHarness = SHOW_TEST_PANELS ? lazy(() => import("@/components/backdrop/BackdropTestHarness")) : null;
const BACKDROP_SEED = 1729;

export default function TopographicBackdrop() {
	const [reduceMotion, setReduceMotion] = useState(false);
	const [dither, setDither] = useState<DitherSettings>(DEFAULT_DITHER_SETTINGS);
	const [layers, setLayers] = useState(DEFAULT_LAYER_SETTINGS);

	useEffect(() => {
		const mediaQuery = matchMedia("(prefers-reduced-motion: reduce)");
		const updatePreference = () => setReduceMotion(mediaQuery.matches);
		updatePreference();
		mediaQuery.addEventListener("change", updatePreference);
		return () => mediaQuery.removeEventListener("change", updatePreference);
	}, []);

	return (
		<>
			<div className="topographic-backdrop" aria-hidden="true">
				<Canvas orthographic camera={{ position: [0, 0, 10], zoom: 1 }} dpr={[1, 1.5]} frameloop="demand" gl={{ alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "high-performance" }} onCreated={({ gl }) => gl.setClearColor("#f4f0e6", 1)}>
					<RenderScheduler reduceMotion={reduceMotion} />
					<BackdropScene reduceMotion={reduceMotion} dither={dither} layers={layers} randomSeed={BACKDROP_SEED} />
				</Canvas>
			</div>
			{BackdropTestHarness ? (
				<Suspense fallback={null}>
					<BackdropTestHarness dither={dither} setDither={setDither} layers={layers} setLayers={setLayers} />
				</Suspense>
			) : null}
		</>
	);
}
