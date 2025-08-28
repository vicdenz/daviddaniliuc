"use client";
import { Box } from "@react-three/drei";
import { shaderMaterial } from "@react-three/drei";
import { extend, useFrame, useThree } from "@react-three/fiber";
import React, { type FC, useRef } from "react";
import { Color, ShaderMaterial } from "three";

import { VEC3_COLORS } from "@/resources/colors";

import blurFragment from "./shaders/frag/blur.frag";
import bgVertex from "./shaders/vert/background.vert";

type Uniforms = {
	uTime: number;
	uAspect: number;
	uWashedWhiteColor: Color;
	uStoneGrayColor: Color;
	uStoneGrayLightColor: Color;
	uDeepCharcoalColor: Color;
	uCharcoalSoftColor: Color;
	uMossGreenColor: Color;
	uMossGreenLightColor: Color;
	uClayRedColor: Color;
	uClayRedSoftColor: Color;
	uWoodBrownColor: Color;
	uWoodBrownLightColor: Color;
	uRicePaperColor: Color;
	uScrollBeigeColor: Color;
	uInkWashColor: Color;
	uBambooMistColor: Color;
	uTeaStainColor: Color;
};

const INITIAL_UNIFORMS: Partial<Uniforms> = {
	uTime: 0,
	uWashedWhiteColor: VEC3_COLORS.WASHED_WHITE,
	uStoneGrayColor: VEC3_COLORS.STONE_GRAY,
	uStoneGrayLightColor: VEC3_COLORS.STONE_GRAY_LIGHT,
	uDeepCharcoalColor: VEC3_COLORS.DEEP_CHARCOAL,
	uCharcoalSoftColor: VEC3_COLORS.CHARCOAL_SOFT,
	uMossGreenColor: VEC3_COLORS.MOSS_GREEN,
	uMossGreenLightColor: VEC3_COLORS.MOSS_GREEN_LIGHT,
	uClayRedColor: VEC3_COLORS.CLAY_RED,
	uClayRedSoftColor: VEC3_COLORS.CLAY_RED_SOFT,
	uWoodBrownColor: VEC3_COLORS.WOOD_BROWN,
	uWoodBrownLightColor: VEC3_COLORS.WOOD_BROWN_LIGHT,
	uRicePaperColor: VEC3_COLORS.RICE_PAPER,
	uScrollBeigeColor: VEC3_COLORS.SCROLL_BEIGE,
	uInkWashColor: VEC3_COLORS.INK_WASH,
	uBambooMistColor: VEC3_COLORS.BAMBOO_MIST,
	uTeaStainColor: VEC3_COLORS.TEA_STAIN,
};

const BoxShaderMaterial = shaderMaterial(INITIAL_UNIFORMS, bgVertex, blurFragment);
extend({ BoxShaderMaterial });

interface ShaderBoxProps {
	position?: [number, number, number];
	size?: [number, number, number];
	rotation?: [number, number, number];
}

/**
 * ShaderBox behaves like a "div with a shader background"
 * You can drop it in your R3F scene and move/size it however you want.
 */
const ShaderBox: FC<ShaderBoxProps> = ({ position = [0, 0, 0], size = [2, 2, 2], rotation = [0, 0, 0] }) => {
	const { viewport } = useThree();
	const shader = useRef<ShaderMaterial & Uniforms>(null);

	useFrame(({ clock }) => {
		if (!shader.current) return;
		shader.current.uTime = clock.elapsedTime;
	});

	return (
		<Box args={size} position={position} rotation={rotation}>
			<boxShaderMaterial ref={shader} {...INITIAL_UNIFORMS} uAspect={viewport.aspect} />
		</Box>
	);
};

export default ShaderBox;
