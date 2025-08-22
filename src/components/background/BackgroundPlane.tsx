"use client";
import { Plane } from "@react-three/drei";
import { shaderMaterial } from "@react-three/drei";
import { extend, useFrame, useThree } from "@react-three/fiber";
import React, { type FC, useRef } from "react";
import { Color } from "three";

import { WASHED_WHITE_VEC3_RGB, WOOD_BROWN_VEC3_RGB, WOOD_BROWN_LIGHT_VEC3_RGB } from "@/resources/colours";

import bgFragment from "./background.frag";
import bgVertex from "./background.vert";

type Uniforms = {
	uTime: number;
	uAspect: number;
	uWashedWhiteColour: Color;
	uWoodBrownColour: Color;
	uWoodBrownLightColour: Color;
};

const INITIAL_UNIFORMS: Partial<Uniforms> = {
	uTime: 0,
	uWashedWhiteColour: WASHED_WHITE_VEC3_RGB,
	uWoodBrownColour: WOOD_BROWN_VEC3_RGB,
	uWoodBrownLightColour: WOOD_BROWN_VEC3_RGB,
};

const CustomShaderMaterial = shaderMaterial(INITIAL_UNIFORMS, bgVertex, bgFragment);
const HomeBackgroundShaderMaterial = extend(CustomShaderMaterial);

const HomeBackgroundPlane: FC = () => {
	const { viewport } = useThree();
	const shader = useRef<typeof HomeBackgroundShaderMaterial & Uniforms>(null);

	useFrame(({ clock }) => {
		if (!shader.current) return;
		shader.current.uTime = clock.elapsedTime;
	});

	return (
		<Plane args={[viewport.width * 3, viewport.height * 3, 1, 1]} position={[0, 0, -6]}>
			<HomeBackgroundShaderMaterial key={CustomShaderMaterial.key} ref={shader} {...INITIAL_UNIFORMS} uAspect={viewport.aspect} />
		</Plane>
	);
};

export default HomeBackgroundPlane;
