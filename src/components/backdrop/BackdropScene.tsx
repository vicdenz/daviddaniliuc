"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { MathUtils, ShaderMaterial } from "three";

import backgroundVertex from "@/components/shaders/vert/background.vert";
import infrastructureFragment from "@/components/shaders/frag/infrastructure-background.frag";
import topographicFragment from "@/components/shaders/frag/topographic-flow.frag";
import {
	BACKDROP_ANIMATION,
	DEFAULT_DITHER_SETTINGS,
	DITHER_UNIFORMS,
	LAYER_UNIFORMS,
	METHOD_VALUE,
	PATTERN_VALUE,
	type BackdropVariant,
	type DitherSettings,
	type LayerSettings,
} from "@/components/backdrop/config";

type SceneProps = {
	variant: BackdropVariant;
	reduceMotion: boolean;
	dither: DitherSettings;
	layers: LayerSettings;
	randomSeed: number;
};

type AnimationState = {
	smoothedScroll: number;
	previousScrollY: number | null;
	noiseRate: number;
	returnStartRate: number;
	returnElapsed: number;
	noiseTime: number;
	revealElapsed: number;
};

const createUniforms = () => {
	const uniforms: Record<string, { value: number }> = {
		uTime: { value: 0 },
		uNoiseTime: { value: 0 },
		uReveal: { value: 0 },
		uAspect: { value: 1 },
		uScroll: { value: 0 },
		uPixelRatio: { value: 1 },
		uRandomSeed: { value: 0 },
		uDitherMethod: { value: METHOD_VALUE[DEFAULT_DITHER_SETTINGS.method] },
		uDitherPattern: { value: PATTERN_VALUE[DEFAULT_DITHER_SETTINGS.pattern] },
		uSecondaryDitherEnabled: { value: Number(DEFAULT_DITHER_SETTINGS.secondaryEnabled) },
	};
	for (const [key, name] of DITHER_UNIFORMS) uniforms[name] = { value: Number(DEFAULT_DITHER_SETTINGS[key]) };
	for (const name of Object.values(LAYER_UNIFORMS)) uniforms[name] = { value: 1 };
	return uniforms;
};

export function RenderScheduler({ reduceMotion }: Pick<SceneProps, "reduceMotion">) {
	const invalidate = useThree((state) => state.invalidate);

	useEffect(() => {
		invalidate();
		if (reduceMotion) return;
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
	}, [invalidate, reduceMotion]);

	return null;
}

export function BackdropScene({ variant, reduceMotion, dither, layers, randomSeed }: SceneProps) {
	const materialRef = useRef<ShaderMaterial>(null);
	const animation = useRef<AnimationState>({
		smoothedScroll: 0,
		previousScrollY: null as number | null,
		noiseRate: 1,
		returnStartRate: 1,
		returnElapsed: BACKDROP_ANIMATION.scrollReturnDuration,
		noiseTime: 0,
		revealElapsed: 0,
	});
	const { gl, invalidate, size, viewport } = useThree();
	const uniforms = useMemo(createUniforms, []);

	useEffect(() => invalidate(), [dither, invalidate, layers, randomSeed, variant]);

	useFrame(({ clock }, delta) => {
		const material = materialRef.current;
		if (!material) return;

		const state = animation.current;
		const scrollY = window.scrollY;
		const scrollDelta = state.previousScrollY === null ? 0 : scrollY - state.previousScrollY;
		state.previousScrollY = scrollY;
		state.smoothedScroll = MathUtils.damp(state.smoothedScroll, reduceMotion ? 0 : scrollY / Math.max(innerHeight, 1), 3.4, delta);

		const active = !reduceMotion && variant === "topographic";
		const activity = active ? Math.min(Math.abs(scrollDelta) / BACKDROP_ANIMATION.scrollDistanceForMaxBoost, 1) : 0;
		if (!active) {
			state.noiseRate = state.returnStartRate = 1;
			state.returnElapsed = BACKDROP_ANIMATION.scrollReturnDuration;
		} else if (activity > 0) {
			state.noiseRate = Math.sign(scrollDelta) * (1 + (BACKDROP_ANIMATION.maxScrollSpeed - 1) * activity);
			state.returnStartRate = state.noiseRate;
			state.returnElapsed = 0;
		} else {
			state.returnElapsed = Math.min(state.returnElapsed + delta, BACKDROP_ANIMATION.scrollReturnDuration);
			const progress = state.returnElapsed / BACKDROP_ANIMATION.scrollReturnDuration;
			state.noiseRate = MathUtils.lerp(state.returnStartRate, 1, 1 - (1 - progress) ** 3);
		}
		if (!reduceMotion) state.noiseTime += delta * BACKDROP_ANIMATION.baseNoiseSpeed * state.noiseRate;
		if (active && document.visibilityState === "visible") state.revealElapsed += Math.min(delta, 0.05);

		const values = material.uniforms;
		const pixelRatio = gl.getPixelRatio();
		values.uTime.value = reduceMotion ? 0 : clock.elapsedTime;
		values.uNoiseTime.value = reduceMotion ? 0 : state.noiseTime;
		values.uReveal.value = reduceMotion || variant !== "topographic" ? 1 : MathUtils.smoothstep(state.revealElapsed, 0, BACKDROP_ANIMATION.revealDuration);
		values.uAspect.value = size.width / Math.max(size.height, 1);
		values.uScroll.value = state.smoothedScroll;
		values.uPixelRatio.value = pixelRatio;
		values.uRandomSeed.value = randomSeed;
		values.uDitherMethod.value = METHOD_VALUE[dither.method];
		values.uDitherPattern.value = PATTERN_VALUE[dither.pattern];
		values.uSecondaryDitherEnabled.value = Number(dither.secondaryEnabled);
		for (const [key, name] of DITHER_UNIFORMS) values[name].value = Number(dither[key]);
		for (const key of Object.keys(LAYER_UNIFORMS) as Array<keyof LayerSettings>) values[LAYER_UNIFORMS[key]].value = Number(layers[key]);
	});

	return (
		<mesh scale={[viewport.width, viewport.height, 1]} frustumCulled={false}>
			<planeGeometry args={[1, 1]} />
			<shaderMaterial key={variant} ref={materialRef} vertexShader={backgroundVertex} fragmentShader={variant === "topographic" ? topographicFragment : infrastructureFragment} uniforms={uniforms} depthTest={false} depthWrite={false} toneMapped={false} />
		</mesh>
	);
}
