"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { Color, MathUtils, ShaderMaterial, Vector2 } from "three";

import backgroundVertex from "@/components/shaders/vert/background.vert";
import backgroundFragment from "@/components/shaders/frag/infrastructure-background.frag";

const TARGET_FRAME_TIME = 1000 / 60;

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

function InfrastructureScene({ reduceMotion }: { reduceMotion: boolean }) {
	const materialRef = useRef<ShaderMaterial>(null);
	const smoothedScroll = useRef(0);
	const { gl, size, viewport } = useThree();
	const uniforms = useMemo(
		() => ({
			uTime: { value: 0 },
			uAspect: { value: 1 },
			uResolution: { value: new Vector2(1, 1) },
			uScroll: { value: 0 },
		}),
		[],
	);

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

export default function InfrastructureBackdrop() {
	const [reduceMotion, setReduceMotion] = useState(false);

	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		const updatePreference = () => setReduceMotion(mediaQuery.matches);
		updatePreference();
		mediaQuery.addEventListener("change", updatePreference);
		return () => mediaQuery.removeEventListener("change", updatePreference);
	}, []);

	return (
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
				<InfrastructureScene reduceMotion={reduceMotion} />
			</Canvas>
		</div>
	);
}
