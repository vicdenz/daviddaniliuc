"use client";
import { Plane } from "@react-three/drei";
import { shaderMaterial } from "@react-three/drei";
import { extend, useFrame, useThree } from "@react-three/fiber";
import React, { type FC, useRef } from "react";
import { Color } from "three";

import { WASHED_WHITE_VEC3_RGB, WOOD_BROWN_VEC3_RGB, WOOD_BROWN_LIGHT_VEC3_RGB, RICE_PAPER_VEC3_RGB, SCROLL_BEIGE_VEC3_RGB, INK_WASH_VEC3_RGB, BAMBOO_MIST_VEC3_RGB, TEA_STAIN_VEC3_RGB, STONE_GRAY_VEC3_RGB, STONE_GRAY_LIGHT_VEC3_RGB, CHARCOAL_SOFT_VEC3_RGB, MOSS_GREEN_VEC3_RGB, MOSS_GREEN_LIGHT_VEC3_RGB, CLAY_RED_VEC3_RGB, CLAY_RED_SOFT_VEC3_RGB, DEEP_CHARCOAL_VEC3_RGB } from "@/resources/colors";

import bgFragment from "./background.frag";
import bgVertex from "./background.vert";

type Uniforms = {
	uTime: number;
	uAspect: number;
	uWashedWhiteColor: Color;
	uWoodBrownColor: Color;
	uWoodBrownLightColor: Color;
	uRicePaperColor: Color;
	uScrollBeigeColor: Color;
	uInkWashColor: Color;
	uBambooMistColor: Color;
	uTeaStainColor: Color;
	uStoneGrayColor: Color;
	uStoneGrayLightColor: Color;
	uCharcoalSoftColor: Color;
	uMossGreenColor: Color;
	uMossGreenLightColor: Color;
	uClayRedColor: Color;
	uClayRedSoftColor: Color;
};

const INITIAL_UNIFORMS: Partial<Uniforms> = {
	uTime: 0,
	uWashedWhiteColor: WASHED_WHITE_VEC3_RGB,
	uWoodBrownColor: WOOD_BROWN_VEC3_RGB,
	uWoodBrownLightColor: WOOD_BROWN_LIGHT_VEC3_RGB,
	uRicePaperColor: RICE_PAPER_VEC3_RGB,
	uScrollBeigeColor: SCROLL_BEIGE_VEC3_RGB,
	uInkWashColor: INK_WASH_VEC3_RGB,
	uBambooMistColor: BAMBOO_MIST_VEC3_RGB,
	uTeaStainColor: TEA_STAIN_VEC3_RGB,
	uStoneGrayColor: STONE_GRAY_VEC3_RGB,
	uStoneGrayLightColor: STONE_GRAY_LIGHT_VEC3_RGB,
	uCharcoalSoftColor: CHARCOAL_SOFT_VEC3_RGB,
	uMossGreenColor: MOSS_GREEN_VEC3_RGB,
	uMossGreenLightColor: MOSS_GREEN_LIGHT_VEC3_RGB,
	uClayRedColor: CLAY_RED_VEC3_RGB,
	uClayRedSoftColor: CLAY_RED_SOFT_VEC3_RGB,
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
