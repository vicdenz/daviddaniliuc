"use client";

import { Canvas } from "@react-three/fiber";
import { lazy, Suspense, useEffect, useState } from "react";

import { BackdropScene, RenderScheduler } from "@/components/backdrop/BackdropScene";
import {
	DEFAULT_BACKDROP_VARIANT,
	DEFAULT_DITHER_SETTINGS,
	DEFAULT_LAYER_SETTINGS,
	type BackdropVariant,
	type DitherSettings,
} from "@/components/backdrop/config";

const SHOW_TEST_CONTROLS = process.env.NEXT_PUBLIC_BACKDROP_TEST_CONTROLS === "true";
const BackdropTestHarness = SHOW_TEST_CONTROLS ? lazy(() => import("@/components/backdrop/BackdropTestHarness")) : null;

export default function InfrastructureBackdrop() {
	const [reduceMotion, setReduceMotion] = useState(false);
	const [variant, setVariant] = useState<BackdropVariant>(DEFAULT_BACKDROP_VARIANT);
	const [dither, setDither] = useState<DitherSettings>(DEFAULT_DITHER_SETTINGS);
	const [randomSeed, setRandomSeed] = useState(0);
	const [layers, setLayers] = useState(DEFAULT_LAYER_SETTINGS);

	useEffect(() => {
		const mediaQuery = matchMedia("(prefers-reduced-motion: reduce)");
		const updatePreference = () => setReduceMotion(mediaQuery.matches);
		updatePreference();
		mediaQuery.addEventListener("change", updatePreference);
		return () => mediaQuery.removeEventListener("change", updatePreference);
	}, []);

	useEffect(() => {
		const randomValue = new Uint32Array(1);
		crypto.getRandomValues(randomValue);
		setRandomSeed((randomValue[0] / 0xffffffff) * 4096);
	}, []);

	return (
		<>
			<div className="infrastructure-backdrop" aria-hidden="true">
				<Canvas orthographic camera={{ position: [0, 0, 10], zoom: 1 }} dpr={[1, 1.5]} frameloop="demand" gl={{ alpha: false, antialias: true, powerPreference: "high-performance" }} onCreated={({ gl }) => gl.setClearColor("#f4f0e6", 1)}>
					<RenderScheduler reduceMotion={reduceMotion} />
					<BackdropScene variant={variant} reduceMotion={reduceMotion} dither={dither} layers={layers} randomSeed={randomSeed} />
				</Canvas>
			</div>
			{BackdropTestHarness ? (
				<Suspense fallback={null}>
					<BackdropTestHarness variant={variant} setVariant={setVariant} dither={dither} setDither={setDither} layers={layers} setLayers={setLayers} />
				</Suspense>
			) : null}
		</>
	);
}
