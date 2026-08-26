uniform float uAspect;
uniform float uTime;
uniform float uNoiseTime;
uniform float uReveal;
uniform float uPixelRatio;
uniform float uRandomSeed;
uniform float uDitherMethod;
uniform float uDitherPattern;
uniform float uDitherSize;
uniform float uDitherAmount;
uniform float uDitherCoverage;
uniform float uDitherInkPunch;
uniform float uDitherContrast;
uniform float uDitherSoftness;
uniform float uDitherSpread;
uniform float uSecondaryDitherEnabled;
uniform float uSecondaryDitherSize;
uniform float uSecondaryDitherAmount;
uniform float uSecondaryDitherCoverage;
uniform float uSecondaryDitherInk;
uniform float uSecondaryDitherSoftness;
uniform float uLayerGrain;
uniform float uLayerGrid;
uniform float uLayerTunnel;
uniform float uLayerBraces;
uniform float uLayerRails;
uniform float uLayerRoutes;
uniform float uLayerPackets;
uniform float uLayerScan;
uniform float uLayerDither;
varying vec2 vUv;

const vec3 PAPER = vec3(0.957, 0.941, 0.902);
const vec3 COOL_PAPER = vec3(0.925, 0.941, 0.957);
const vec3 INK = vec3(0.094, 0.157, 0.231);
const vec3 COBALT = vec3(0.141, 0.341, 0.839);
const vec3 PERIWINKLE = vec3(0.686, 0.761, 0.902);

float hash21(vec2 point) {
	point = fract(point * vec2(234.34, 435.17));
	point += dot(point, point + 34.23);
	return fract(point.x * point.y);
}

float seededHash(vec2 point, float channel) {
	return hash21(point + vec2(uRandomSeed * 0.103 + channel * 19.19, uRandomSeed * 0.173 + channel * 47.47));
}

float valueNoise(vec2 point, float channel) {
	vec2 cell = floor(point);
	vec2 localPoint = fract(point);
	vec2 curve = localPoint * localPoint * (3.0 - 2.0 * localPoint);
	float bottom = mix(seededHash(cell, channel), seededHash(cell + vec2(1.0, 0.0), channel), curve.x);
	float top = mix(seededHash(cell + vec2(0.0, 1.0), channel), seededHash(cell + vec2(1.0), channel), curve.x);
	return mix(bottom, top, curve.y);
}

float fbm(vec2 point, float channel) {
	float value = 0.0;
	float amplitude = 0.57;
	mat2 rotation = mat2(0.82, 0.57, -0.57, 0.82);
	for (int octave = 0; octave < 3; octave++) {
		value += valueNoise(point, channel + float(octave) * 11.0) * amplitude;
		point = rotation * point * 2.08 + vec2(7.3, 3.1);
		amplitude *= 0.48;
	}
	return value / 0.975;
}

float line(float point, float width) {
	float antialias = min(fwidth(point) * 0.9, width * 1.6);
	return 1.0 - smoothstep(width - antialias, width + antialias, abs(point));
}

float periodicLine(float coordinate, float width) {
	float distanceToLine = abs(fract(coordinate - 0.5) - 0.5);
	float antialias = min(fwidth(coordinate) * 0.9, width * 2.0);
	return 1.0 - smoothstep(width - antialias, width + antialias, distanceToLine);
}

float roundedBox(vec2 point, vec2 halfSize, float radius) {
	vec2 edge = abs(point) - halfSize + radius;
	float distanceToEdge = length(max(edge, 0.0)) + min(max(edge.x, edge.y), 0.0) - radius;
	float antialias = min(fwidth(distanceToEdge) * 1.2, max(radius * 1.5, 0.0015));
	return 1.0 - smoothstep(-antialias, antialias, distanceToEdge);
}

float bayer2(vec2 cell) {
	vec2 point = mod(floor(cell), 2.0);
	float top = mix(0.0, 2.0, point.x);
	float bottom = mix(3.0, 1.0, point.x);
	return mix(top, bottom, point.y);
}

float bayer4(vec2 cell) {
	float fine = bayer2(mod(cell, 2.0));
	float coarse = bayer2(floor(cell * 0.5));
	return (fine * 4.0 + coarse + 0.5) / 16.0;
}

float diffusionThreshold(vec2 cell) {
	float direction = mix(-1.0, 1.0, step(1.0, mod(cell.y, 2.0)));
	float carriedError = seededHash(cell - vec2(direction, 0.0), 151.0) * (7.0 / 16.0);
	carriedError += seededHash(cell + vec2(direction, -1.0), 151.0) * (3.0 / 16.0);
	carriedError += seededHash(cell + vec2(0.0, -1.0), 151.0) * (5.0 / 16.0);
	carriedError += seededHash(cell + vec2(-direction, -1.0), 151.0) * (1.0 / 16.0);
	float diffused = fract(seededHash(cell, 157.0) + (carriedError - 0.5) * 1.8);
	return mix(bayer4(cell), diffused, uDitherSpread);
}

float ditherMark(vec2 localPoint, float pattern, float softness) {
	if (pattern < 0.5) return 1.0;
	float softEdge = mix(0.004, 0.055, softness);
	if (pattern < 1.5) {
		float diagonalDistance = min(abs(localPoint.x - localPoint.y), abs(localPoint.x + localPoint.y)) * 0.7071;
		float diagonal = 1.0 - smoothstep(0.070 - softEdge, 0.070 + softEdge, diagonalDistance);
		float extent = 1.0 - smoothstep(0.34 - softEdge, 0.43 + softEdge, max(abs(localPoint.x), abs(localPoint.y)));
		return diagonal * extent;
	}
	if (pattern < 2.5) {
		return 1.0 - smoothstep(0.25 - softEdge, 0.25 + softEdge, abs(localPoint.x) + abs(localPoint.y));
	}
	return 1.0 - smoothstep(0.20 - softEdge, 0.20 + softEdge, length(localPoint));
}

vec3 applyDither(vec3 source, vec3 paperColor) {
	float cellSize = max(uDitherSize * uPixelRatio, 1.0);
	vec2 cellPosition = gl_FragCoord.xy / cellSize;
	vec2 cell = floor(cellPosition);
	vec2 localPoint = fract(cellPosition) - 0.5;
	vec3 colorDistance = abs(source - paperColor);
	float inkAmount = max(colorDistance.r, max(colorDistance.g, colorDistance.b));
	float coverage = clamp(inkAmount * 5.0 * uDitherCoverage, 0.0, 1.0);
	coverage = clamp((coverage - 0.5) * uDitherContrast + 0.5, 0.0, 1.0);
	float threshold = mix(bayer4(cell), diffusionThreshold(cell), uDitherMethod);
	float thresholdSoftness = mix(0.002, 0.08, uDitherSoftness);
	float occupied = smoothstep(threshold - thresholdSoftness, threshold + thresholdSoftness, coverage);
	vec3 punched = clamp(paperColor + (source - paperColor) * uDitherInkPunch, 0.0, 1.0);
	float primaryMark = ditherMark(localPoint, uDitherPattern, uDitherSoftness);
	vec3 dithered = mix(paperColor, punched, occupied * primaryMark);
	vec3 primaryResult = mix(source, dithered, uDitherAmount * uLayerDither);

	float crossCellSize = max(uSecondaryDitherSize * uPixelRatio, 1.0);
	vec2 crossPosition = (gl_FragCoord.xy + vec2(1.25, 2.25) * uPixelRatio) / crossCellSize;
	vec2 crossCell = floor(crossPosition);
	vec2 crossLocalPoint = fract(crossPosition) - 0.5;
	float crossThreshold = mix(bayer4(crossCell + vec2(2.0, 1.0)), diffusionThreshold(crossCell + vec2(29.0, 17.0)), uDitherMethod);
	float crossCoverage = clamp(coverage * uSecondaryDitherCoverage, 0.0, 1.0);
	float crossOccupied = smoothstep(crossThreshold - thresholdSoftness, crossThreshold + thresholdSoftness, crossCoverage);
	float crossMark = ditherMark(crossLocalPoint, 1.0, uSecondaryDitherSoftness);
	float residualWeight = 1.0 - occupied * primaryMark * 0.68;
	float crossAlpha = crossOccupied * crossMark * residualWeight * uSecondaryDitherAmount * uSecondaryDitherEnabled * uDitherAmount * uLayerDither;
	vec3 crossInk = clamp(paperColor + (source - paperColor) * uDitherInkPunch * uSecondaryDitherInk, 0.0, 1.0);
	return mix(primaryResult, crossInk, crossAlpha);
}

float routeHeight(float routeId, float x, float time) {
	float seed = seededHash(vec2(routeId, 0.0), 501.0);
	float base = mix(-0.34, 0.34, routeId / 3.0) + (seed - 0.5) * 0.10;
	float drift = (fbm(vec2(x * 0.72, seed * 4.0) + vec2(time * 0.018, 0.0), 521.0 + routeId) - 0.5) * 0.17;
	return base + sin(x * 1.8 + seed * 6.283 + time * 0.11) * 0.045 + drift;
}

void main() {
	float aspect = max(uAspect, 1.0);
	vec2 point = vec2((vUv.x - 0.5) * aspect, vUv.y - 0.5);
	vec2 drift = vec2(uNoiseTime * 0.014, -uNoiseTime * 0.009);
	float revealNoise = fbm(point * 1.45, 673.0);
	float revealOrder = clamp(length(vUv - 0.5) * 1.28 + (revealNoise - 0.5) * 0.26, 0.0, 0.90);
	float revealStart = smoothstep(0.0, 0.10, uReveal);
	float growthReveal = revealStart * (1.0 - smoothstep(uReveal - 0.06, uReveal + 0.16, revealOrder));
	float atmosphericReveal = growthReveal * smoothstep(0.06, 0.52, uReveal);
	float trafficReveal = growthReveal * smoothstep(0.28, 0.72, uReveal);

	float paperCloud = fbm(point * 2.5 + drift * 0.2, 301.0) - 0.5;
	float paperFiber = fbm(vec2(point.x * 1.2, point.y * 28.0) - drift * 0.4, 331.0) - 0.5;
	vec2 grainCell = floor(gl_FragCoord.xy / max(2.0 * uPixelRatio, 1.0));
	float grain = (seededHash(grainCell, 349.0) - 0.5) * 0.026;
	vec3 paperVariation = vec3(0.070, 0.052, 0.018) * paperCloud;
	paperVariation += vec3(-0.012, 0.006, 0.034) * paperFiber + vec3(grain);
	vec3 paperColor = mix(PAPER, clamp(PAPER + paperVariation, 0.0, 1.0), uLayerGrain * atmosphericReveal);
	vec3 color = paperColor;

	vec2 warp = vec2(
		fbm(point * 1.18 + drift, 401.0),
		fbm(point * 1.18 - drift * 0.8, 419.0)
	) - 0.5;
	float field = fbm(point * 1.25 + warp * 0.92 + drift * 0.35, 431.0);
	field += (fbm(point * 3.9 - warp * 0.55 - drift * 0.2, 449.0) - 0.5) * 0.28;

	mat2 gridRotation = mat2(0.985, 0.174, -0.174, 0.985);
	vec2 surveyPoint = gridRotation * point;
	float surveyGrid = max(periodicLine(surveyPoint.x * 5.2, 0.014), periodicLine(surveyPoint.y * 5.2, 0.014));
	float surveyGridFine = max(periodicLine(surveyPoint.x * 20.8, 0.030), periodicLine(surveyPoint.y * 20.8, 0.030));
	float gridAlpha = clamp(surveyGrid * 0.25 + surveyGridFine * 0.060, 0.0, 0.30) * uLayerGrid * growthReveal;
	color = mix(color, INK, gridAlpha);

	float contour = periodicLine(field * 14.0, 0.060);
	float majorContour = periodicLine(field * 3.5, 0.032);
	float contourAlpha = clamp(contour * 0.32 + majorContour * 0.43, 0.0, 0.56) * uLayerTunnel * growthReveal;
	color = mix(color, mix(PERIWINKLE, COBALT, 0.26), contourAlpha);

	float hatch = periodicLine((surveyPoint.x + surveyPoint.y * 0.28) * 23.0 + field * 5.0 + uNoiseTime * 0.035, 0.052);
	float hatchMask = smoothstep(0.10, 0.30, abs(field - 0.5));
	color = mix(color, INK, hatch * hatchMask * 0.14 * uLayerBraces * atmosphericReveal);

	float elevationBand = smoothstep(0.78, 0.98, sin(field * 18.8496 - uNoiseTime * 0.12) * 0.5 + 0.5);
	vec3 elevationColor = mix(COOL_PAPER, PERIWINKLE, 0.48);
	color = mix(color, elevationColor, elevationBand * 0.30 * uLayerRails * atmosphericReveal);

	float routeAlpha = 0.0;
	float packetAlpha = 0.0;
	for (int routeIndex = 0; routeIndex < 4; routeIndex++) {
		float routeId = float(routeIndex);
		float routeY = routeHeight(routeId, point.x, uTime);
		float route = line(point.y - routeY, 0.0026);
		float dash = smoothstep(0.42, 0.58, sin(point.x * 56.0 + routeId * 2.7 - uTime * 0.34) * 0.5 + 0.5);
		routeAlpha = max(routeAlpha, route * dash);

		float speed = mix(0.035, 0.065, seededHash(vec2(routeId), 547.0));
		float progress = fract(uTime * speed + seededHash(vec2(routeId), 563.0));
		float packetX = mix(-aspect * 0.58, aspect * 0.58, progress);
		float packetY = routeHeight(routeId, packetX, uTime);
		float portalScale = smoothstep(0.01, 0.10, progress) * (1.0 - smoothstep(0.88, 0.99, progress));
		if (portalScale > 0.01) {
			// Measuring vertical distance against the route at every fragment bends the
			// beacon body with the signal trace instead of sliding a rigid rectangle.
			vec2 packetPoint = vec2(point.x - packetX, point.y - routeHeight(routeId, point.x, uTime));
			float packet = roundedBox(packetPoint, vec2(0.028, 0.0034) * portalScale, 0.0034 * portalScale);
			packetAlpha = max(packetAlpha, packet);
		}
	}
	color = mix(color, COBALT, routeAlpha * 0.21 * uLayerRoutes * trafficReveal);
	color = mix(color, mix(COBALT, INK, 0.08), packetAlpha * 0.92 * uLayerPackets * trafficReveal);

	vec2 scanCenter = vec2(
		mix(-aspect * 0.24, aspect * 0.24, seededHash(vec2(0.0), 601.0)),
		mix(-0.18, 0.18, seededHash(vec2(0.0), 607.0))
	);
	float scanRadius = fract(uTime * 0.028 + seededHash(vec2(0.0), 613.0)) * (aspect * 0.78 + 0.4);
	float scan = smoothstep(0.085, 0.0, abs(length(point - scanCenter) - scanRadius));
	color = mix(color, mix(COBALT, INK, 0.30), scan * 0.11 * uLayerScan * trafficReveal);

	color = applyDither(color, PAPER);
	gl_FragColor = vec4(color, 1.0);
}
