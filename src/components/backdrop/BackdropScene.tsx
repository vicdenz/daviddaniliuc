"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { MathUtils, ShaderMaterial } from "three";

import backgroundVertex from "@/components/shaders/vert/background.vert";
import topographicFragment from "@/components/shaders/frag/topographic-flow.frag";
import { BACKDROP_ANIMATION } from "@/components/backdrop/config";

type SceneProps = {
	reduceMotion: boolean;
	reveal: boolean;
};

type BackdropSceneProps = SceneProps & {
	onReady: () => void;
};

type AnimationState = {
	previousScrollY: number | null;
	noiseRate: number;
	returnStartRate: number;
	returnElapsed: number;
	noiseTime: number;
	sceneTime: number;
	revealElapsed: number;
};

const createUniforms = () => {
	const uniforms: Record<string, { value: number }> = {
		uTime: { value: 0 },
		uNoiseTime: { value: 0 },
		uReveal: { value: 0 },
		uAspect: { value: 1 },
		uPixelRatio: { value: 1 },
		uRandomSeed: { value: 1729 },
		uDitherMethod: { value: 1 },
		uDitherPattern: { value: 2 },
		uDitherSize: { value: 4 },
		uDitherAmount: { value: 0.94 },
		uDitherCoverage: { value: 2.5 },
		uDitherInkPunch: { value: 3.6 },
		uDitherContrast: { value: 0.49 },
		uDitherSoftness: { value: 0.84 },
		uDitherSpread: { value: 0.92 },
		uSecondaryDitherEnabled: { value: 1 },
		uSecondaryDitherSize: { value: 3.5 },
		uSecondaryDitherAmount: { value: 0.26 },
		uSecondaryDitherCoverage: { value: 1.23 },
		uSecondaryDitherInk: { value: 1.06 },
		uSecondaryDitherSoftness: { value: 0.19 },
		uLayerGrain: { value: 1 },
		uLayerGrid: { value: 1 },
		uLayerTunnel: { value: 1 },
		uLayerBraces: { value: 1 },
		uLayerRails: { value: 1 },
		uLayerRoutes: { value: 1 },
		uLayerPackets: { value: 1 },
		uLayerScan: { value: 1 },
		uLayerDither: { value: 1 },
	};
	return uniforms;
};

export function RenderScheduler({ reduceMotion, reveal }: Pick<SceneProps, "reduceMotion" | "reveal">) {
	const invalidate = useThree((state) => state.invalidate);

	useEffect(() => {
		invalidate();
		if (reduceMotion || !reveal) return;
		let animationFrame = 0;
		let previousFrame = 0;
		const schedule = (timestamp: number) => {
			if (document.visibilityState === "visible" && timestamp - previousFrame >= BACKDROP_ANIMATION.frameTime - 1) {
				previousFrame = timestamp;
				invalidate();
			}
			animationFrame = requestAnimationFrame(schedule);
		};
		animationFrame = requestAnimationFrame(schedule);
		return () => cancelAnimationFrame(animationFrame);
	}, [invalidate, reduceMotion, reveal]);

	return null;
}

export function BackdropScene({ reduceMotion, reveal, onReady }: BackdropSceneProps) {
	const materialRef = useRef<ShaderMaterial>(null);
	const readyFrame = useRef<number | null>(null);
	const readySignaled = useRef(false);
	const animation = useRef<AnimationState>({
		previousScrollY: null as number | null,
		noiseRate: 1,
		returnStartRate: 1,
		returnElapsed: BACKDROP_ANIMATION.scrollReturnDuration,
		noiseTime: 0,
		sceneTime: 0,
		revealElapsed: 0,
	});
	const { gl, size, viewport } = useThree();
	const uniforms = useMemo(createUniforms, []);

	useEffect(() => () => {
		if (readyFrame.current !== null) window.cancelAnimationFrame(readyFrame.current);
	}, []);

	useFrame((_, delta) => {
		const material = materialRef.current;
		if (!material) return;

		const state = animation.current;
		const frameDelta = Math.min(delta, 0.05);
		const scrollY = window.scrollY;
		const scrollDelta = state.previousScrollY === null ? 0 : scrollY - state.previousScrollY;
		state.previousScrollY = scrollY;

		const active = !reduceMotion && reveal;
		const activity = active ? Math.min(Math.abs(scrollDelta) / BACKDROP_ANIMATION.scrollDistanceForMaxBoost, 1) : 0;
		if (!active) {
			state.noiseRate = state.returnStartRate = 1;
			state.returnElapsed = BACKDROP_ANIMATION.scrollReturnDuration;
		} else if (activity > 0) {
			state.noiseRate = Math.sign(scrollDelta) * (1 + (BACKDROP_ANIMATION.maxScrollSpeed - 1) * activity);
			state.returnStartRate = state.noiseRate;
			state.returnElapsed = 0;
		} else {
			state.returnElapsed = Math.min(state.returnElapsed + frameDelta, BACKDROP_ANIMATION.scrollReturnDuration);
			const progress = state.returnElapsed / BACKDROP_ANIMATION.scrollReturnDuration;
			state.noiseRate = MathUtils.lerp(state.returnStartRate, 1, 1 - (1 - progress) ** 3);
		}
		if (active) {
			state.sceneTime += frameDelta;
			state.noiseTime += frameDelta * BACKDROP_ANIMATION.baseNoiseSpeed * state.noiseRate;
		}
		// Reveal time begins with the first visible rendered frame, not page time.
		// The graphics bundle can arrive after the page animation has begun; using
		// an absolute clock made those late loads jump straight to a finished scene.
		if (active && document.visibilityState === "visible") {
			state.revealElapsed = Math.min(
				state.revealElapsed + frameDelta,
				BACKDROP_ANIMATION.revealDelay + BACKDROP_ANIMATION.revealDuration,
			);
		}

		const values = material.uniforms;
		const pixelRatio = gl.getPixelRatio();
		values.uTime.value = active ? state.sceneTime : 0;
		values.uNoiseTime.value = active ? state.noiseTime : 0;
		const revealProgress = MathUtils.clamp(
			(state.revealElapsed - BACKDROP_ANIMATION.revealDelay) / BACKDROP_ANIMATION.revealDuration,
			0,
			1,
		);
		values.uReveal.value = reduceMotion && reveal ? 1 : active ? 1 - (1 - revealProgress) ** 4 : 0;
		values.uAspect.value = size.width / Math.max(size.height, 1);
		values.uPixelRatio.value = pixelRatio;

		if (!readySignaled.current) {
			readySignaled.current = true;
			readyFrame.current = window.requestAnimationFrame(() => {
				readyFrame.current = null;
				onReady();
			});
		}
	});

	return (
		<mesh scale={[viewport.width, viewport.height, 1]} frustumCulled={false}>
			<planeGeometry args={[1, 1]} />
			<shaderMaterial ref={materialRef} vertexShader={backgroundVertex} fragmentShader={topographicFragment} uniforms={uniforms} depthTest={false} depthWrite={false} toneMapped={false} />
		</mesh>
	);
}
