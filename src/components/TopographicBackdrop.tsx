"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";

import { BackdropScene, RenderScheduler } from "@/components/backdrop/BackdropScene";

type TopographicBackdropProps = {
	onReady: () => void;
	reveal: boolean;
};

export default function TopographicBackdrop({ onReady, reveal }: TopographicBackdropProps) {
	const [reduceMotion, setReduceMotion] = useState(false);

	useEffect(() => {
		const mediaQuery = matchMedia("(prefers-reduced-motion: reduce)");
		const updatePreference = () => setReduceMotion(mediaQuery.matches);
		updatePreference();
		mediaQuery.addEventListener("change", updatePreference);
		return () => mediaQuery.removeEventListener("change", updatePreference);
	}, []);

	return (
		<div className={`topographic-backdrop${reveal ? " topographic-backdrop-ready" : ""}`} aria-hidden="true">
			<Canvas orthographic camera={{ position: [0, 0, 10], zoom: 1 }} dpr={[1, 2]} frameloop="demand" gl={{ alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "high-performance" }} onCreated={({ gl }) => gl.setClearColor("#faf8f0", 1)}>
				<RenderScheduler reduceMotion={reduceMotion} reveal={reveal} />
				<BackdropScene reduceMotion={reduceMotion} reveal={reveal} onReady={onReady} />
			</Canvas>
		</div>
	);
}
