uniform float uAspect;
uniform float uScroll;
uniform float uTime;
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
uniform float uLayerNodes;
uniform float uLayerRoutes;
uniform float uLayerPackets;
uniform float uLayerScan;
uniform float uLayerDither;
varying vec2 vUv;

const vec3 PAPER = vec3(0.957, 0.941, 0.902);
const vec3 PAPER_GRAIN_TINT = vec3(0.925, 0.941, 0.957);
const float PAPER_GRAIN_STRENGTH = 3.0;
const vec3 INK = vec3(0.094, 0.157, 0.231);
const vec3 COBALT = vec3(0.141, 0.341, 0.839);
const vec3 PERIWINKLE = vec3(0.686, 0.761, 0.902);

float hash21(vec2 point) {
	point = fract(point * vec2(234.34, 435.17));
	point += dot(point, point + 34.23);
	return fract(point.x * point.y);
}

float seededHash(vec2 point, float channel) {
	vec2 seedOffset = vec2(
		uRandomSeed * 0.103 + channel * 19.19,
		uRandomSeed * 0.173 + channel * 47.47
	);
	return hash21(point + seedOffset);
}

float valueNoise(vec2 point, float channel) {
	vec2 cell = floor(point);
	vec2 localPoint = fract(point);
	vec2 curve = localPoint * localPoint * (3.0 - 2.0 * localPoint);

	float bottomLeft = seededHash(cell, channel);
	float bottomRight = seededHash(cell + vec2(1.0, 0.0), channel);
	float topLeft = seededHash(cell + vec2(0.0, 1.0), channel);
	float topRight = seededHash(cell + vec2(1.0), channel);
	float bottom = mix(bottomLeft, bottomRight, curve.x);
	float top = mix(topLeft, topRight, curve.x);
	return mix(bottom, top, curve.y);
}

float paperFbm(vec2 point, float channel) {
	float value = 0.0;
	float amplitude = 0.5;
	mat2 rotation = mat2(0.80, 0.60, -0.60, 0.80);
	for (int octave = 0; octave < 4; octave++) {
		value += valueNoise(point, channel + float(octave) * 7.0) * amplitude;
		point = rotation * point * 2.03 + vec2(11.7, 4.3);
		amplitude *= 0.5;
	}
	return value / 0.9375;
}

vec3 architecturalPaper(vec2 point) {
	vec2 drift = vec2(uTime * 0.008, -uTime * 0.005);
	vec2 warp = vec2(
		valueNoise(point * 0.8 + drift, 201.0),
		valueNoise(point * 0.8 - drift, 203.0)
	) - 0.5;

	float swell = paperFbm(point * 1.15 + warp * 2.4 + drift * 0.35, 207.0) - 0.5;
	float deepSwell = sign(swell) * pow(abs(swell) * 2.0, 1.18) * 0.5;
	float cloud = paperFbm(point * 3.0 + warp * 1.7 + drift, 211.0) - 0.5;
	float fibers = paperFbm(vec2(point.x * 1.4, point.y * 36.0) + warp * 0.45 + drift * 1.4, 239.0) - 0.5;
	float mottle = paperFbm(point * 10.0 + warp * 0.8 - drift * 0.7, 271.0) - 0.5;
	float dirtField = cloud * 0.72 + mottle * 0.28 + deepSwell * 0.22;
	float dirtDeposit = smoothstep(0.06, 0.28, dirtField);
	float dirtVeins = smoothstep(0.12, 0.34, mottle - cloud * 0.30);

	vec2 fleckCell = floor(gl_FragCoord.xy / max(2.0 * uPixelRatio, 1.0));
	float microGrain = (seededHash(fleckCell, 307.0) - 0.5) * 0.007;
	float sparseMask = step(0.975, seededHash(fleckCell, 311.0));
	float sparseFleck = sparseMask * (seededHash(fleckCell, 313.0) * 2.0 - 1.0) * 0.026;

	vec3 swellVariation = vec3(0.044, 0.033, 0.016) * deepSwell;
	vec3 warmVariation = vec3(0.026, 0.018, 0.004) * cloud;
	vec3 coolVariation = vec3(-0.014, -0.005, 0.018) * mottle;
	vec3 fiberVariation = vec3(0.014, 0.011, 0.006) * fibers;
	vec3 dirtVariation = vec3(-0.022, -0.019, -0.013) * dirtDeposit;
	dirtVariation += vec3(-0.010, -0.008, -0.004) * dirtVeins;
	return swellVariation + warmVariation + coolVariation + fiberVariation + dirtVariation + vec3(microGrain + sparseFleck);
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

float floydSteinbergThreshold(vec2 cell) {
	float direction = mix(-1.0, 1.0, step(1.0, mod(cell.y, 2.0)));
	float previousPixel = seededHash(cell - vec2(direction, 0.0), 151.0) * (7.0 / 16.0);
	float upperForward = seededHash(cell + vec2(direction, -1.0), 151.0) * (3.0 / 16.0);
	float upperCenter = seededHash(cell + vec2(0.0, -1.0), 151.0) * (5.0 / 16.0);
	float upperBack = seededHash(cell + vec2(-direction, -1.0), 151.0) * (1.0 / 16.0);
	float carriedError = previousPixel + upperForward + upperCenter + upperBack;
	float localThreshold = seededHash(cell, 157.0);
	float diffusedThreshold = fract(localThreshold + (carriedError - 0.5) * 1.8);
	return mix(bayer4(cell), diffusedThreshold, uDitherSpread);
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
		float diamondDistance = abs(localPoint.x) + abs(localPoint.y);
		return 1.0 - smoothstep(0.25 - softEdge, 0.25 + softEdge, diamondDistance);
	}

	float circleDistance = length(localPoint);
	return 1.0 - smoothstep(0.20 - softEdge, 0.20 + softEdge, circleDistance);
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

	float orderedThreshold = bayer4(cell);
	float diffusionThreshold = floydSteinbergThreshold(cell);
	float threshold = mix(orderedThreshold, diffusionThreshold, uDitherMethod);
	float thresholdSoftness = mix(0.002, 0.08, uDitherSoftness);
	float occupied = smoothstep(threshold - thresholdSoftness, threshold + thresholdSoftness, coverage);
	float mark = ditherMark(localPoint, uDitherPattern, uDitherSoftness);
	vec3 punchedColor = clamp(paperColor + (source - paperColor) * uDitherInkPunch, 0.0, 1.0);
	vec3 dithered = mix(paperColor, punchedColor, occupied * mark);
	vec3 primaryResult = mix(source, dithered, uDitherAmount * uLayerDither);

	float crossCellSize = max(uSecondaryDitherSize * uPixelRatio, 1.0);
	vec2 crossPosition = (gl_FragCoord.xy + vec2(1.25, 2.25) * uPixelRatio) / crossCellSize;
	vec2 crossCell = floor(crossPosition);
	vec2 crossLocalPoint = fract(crossPosition) - 0.5;
	float crossOrderedThreshold = bayer4(crossCell + vec2(2.0, 1.0));
	float crossDiffusionThreshold = floydSteinbergThreshold(crossCell + vec2(29.0, 17.0));
	float crossThreshold = mix(crossOrderedThreshold, crossDiffusionThreshold, uDitherMethod);
	float crossCoverage = clamp(coverage * uSecondaryDitherCoverage, 0.0, 1.0);
	float crossOccupied = smoothstep(crossThreshold - thresholdSoftness, crossThreshold + thresholdSoftness, crossCoverage);
	float crossMark = ditherMark(crossLocalPoint, 1.0, uSecondaryDitherSoftness);
	float residualWeight = 1.0 - occupied * mark * 0.68;
	float crossAlpha = crossOccupied * crossMark * residualWeight * uSecondaryDitherAmount * uSecondaryDitherEnabled * uDitherAmount * uLayerDither;
	vec3 crossInk = clamp(paperColor + (source - paperColor) * uDitherInkPunch * uSecondaryDitherInk, 0.0, 1.0);
	return mix(primaryResult, crossInk, crossAlpha);
}

float line(float point, float width) {
	float antialias = min(fwidth(point) * 0.85, width * 1.5);
	return 1.0 - smoothstep(width - antialias, width + antialias, abs(point));
}

float periodicLine(float coordinate, float width) {
	float distanceToLine = abs(fract(coordinate - 0.5) - 0.5);
	float antialias = fwidth(coordinate) * 0.85;
	return 1.0 - smoothstep(width - antialias, width + antialias, distanceToLine);
}

float smoothPeriodicMask(float coordinate, float start) {
	float phase = fract(coordinate);
	float antialias = clamp(fwidth(coordinate) * 1.25, 0.010, 0.18);
	float leadingEdge = smoothstep(start - antialias, start + antialias, phase);
	float trailingEdge = 1.0 - smoothstep(1.0 - antialias, 1.0, phase);
	return leadingEdge * trailingEdge;
}

float wrappedDistance(float point, float center) {
	return abs(mod(point - center + 0.5, 1.0) - 0.5);
}

float stroke(float distanceToLine, float width) {
	float antialias = fwidth(distanceToLine) * 1.2;
	return 1.0 - smoothstep(width - antialias, width + antialias, distanceToLine);
}

float tunnelFrame(vec2 point, vec2 center, vec2 halfSize, float width) {
	vec2 framePoint = abs(point - center);
	float vertical = stroke(abs(framePoint.x - halfSize.x), width) * step(framePoint.y, halfSize.y + width);
	float horizontal = stroke(abs(framePoint.y - halfSize.y), width) * step(framePoint.x, halfSize.x + width);
	return max(vertical, horizontal);
}

vec2 parallaxOffset(float depth) {
	const float PARALLAX_AMOUNT = 0.0;
	return vec2(
		sin(uScroll * 0.72) * 0.0035 * depth,
		-uScroll * 0.009 * depth
	) * PARALLAX_AMOUNT;
}

float roundedBox(vec2 point, vec2 halfSize, float radius) {
	vec2 edge = abs(point) - halfSize + radius;
	float distanceToEdge = length(max(edge, 0.0)) + min(max(edge.x, edge.y), 0.0) - radius;
	float antialias = min(fwidth(distanceToEdge) * 1.2, max(radius * 1.5, 0.0015));
	return 1.0 - smoothstep(-antialias, antialias, distanceToEdge);
}

float packetPortalScale(float routeProgress) {
	float emerge = smoothstep(0.02, 0.14, routeProgress);
	float shrink = 1.0 - smoothstep(0.82, 0.98, routeProgress);
	return emerge * shrink;
}

float horizontalRouteCenter(float routeId) {
	float jitter = (seededHash(vec2(routeId, 0.0), 101.0) - 0.5) * 0.036;
	return (routeId + 0.5) / 5.0 + jitter;
}

float horizontalRouteY(float routeId) {
	float jitter = (seededHash(vec2(routeId, 0.0), 103.0) - 0.5) * 0.060;
	return 0.155 + routeId * 0.145 + jitter;
}

float verticalRouteCenter(float routeId) {
	float jitter = (seededHash(vec2(routeId, 0.0), 107.0) - 0.5) * 0.036;
	return (routeId + 0.5) / 5.0 + jitter;
}

float verticalRouteX(float routeId) {
	float jitter = (seededHash(vec2(routeId, 0.0), 109.0) - 0.5) * 0.060;
	return 0.10 + routeId * 0.19 + jitter;
}

float horizontalPacket(vec2 point, float aspect, float routeId) {
	float routeEnabled = step(0.15, seededHash(vec2(routeId, 0.0), 11.0));
	float routeSpeed = mix(0.22, 0.40, seededHash(vec2(routeId, 0.0), 23.0));
	float routePhase = seededHash(vec2(routeId, 0.0), 37.0);
	float routeProgress = fract(uTime * routeSpeed + routePhase);
	float packetX = horizontalRouteCenter(routeId) + (routeProgress - 0.5) * 0.196;
	float packetY = horizontalRouteY(routeId);
	vec2 packetPoint = vec2((point.x - packetX) * aspect, point.y - packetY);
	float packetScale = packetPortalScale(routeProgress);
	if (packetScale < 0.01) return 0.0;
	return roundedBox(packetPoint, vec2(0.015, 0.0036) * packetScale, 0.0036 * packetScale) * routeEnabled;
}

float verticalPacket(vec2 point, float aspect, float routeId) {
	float routeEnabled = step(0.15, seededHash(vec2(routeId, 0.0), 71.0));
	float routeSpeed = mix(0.22, 0.40, seededHash(vec2(routeId, 0.0), 83.0));
	float routePhase = seededHash(vec2(routeId, 0.0), 97.0);
	float routeProgress = fract(uTime * routeSpeed + routePhase);
	float packetY = verticalRouteCenter(routeId) + (routeProgress - 0.5) * 0.196;
	float packetX = verticalRouteX(routeId);
	vec2 packetPoint = vec2((point.x - packetX) * aspect, point.y - packetY);
	float packetScale = packetPortalScale(routeProgress);
	if (packetScale < 0.01) return 0.0;
	return roundedBox(packetPoint, vec2(0.0036, 0.015) * packetScale, 0.0036 * packetScale) * routeEnabled;
}

void main() {
	float aspect = max(uAspect, 1.0);
	vec2 paperPoint = vec2(vUv.x * aspect, vUv.y);
	vec3 rawPaperVariation = architecturalPaper(paperPoint);
	vec3 paperVariation = rawPaperVariation * PAPER_GRAIN_STRENGTH * uLayerGrain;
	float grainTintMask = smoothstep(0.004, 0.024, length(rawPaperVariation)) * uLayerGrain;
	vec3 paperColor = mix(PAPER + paperVariation, PAPER_GRAIN_TINT, grainTintMask * 0.34);
	paperColor = clamp(paperColor, 0.0, 1.0);
	vec3 color = paperColor;

	vec2 gridUv = vUv + parallaxOffset(0.12);
	vec2 gridScaled = vec2(gridUv.x * aspect, gridUv.y);
	vec2 majorGridCoordinate = gridScaled * 9.0;
	vec2 minorGridCoordinate = gridScaled * 45.0;
	float majorGrid = max(periodicLine(majorGridCoordinate.x, 0.018), periodicLine(majorGridCoordinate.y, 0.018));
	float minorGrid = max(periodicLine(minorGridCoordinate.x, 0.039), periodicLine(minorGridCoordinate.y, 0.039));
	float gridAlpha = clamp(majorGrid * 0.58 + minorGrid * 0.12, 0.0, 0.64) * uLayerGrid;
	color = mix(color, INK, gridAlpha);

	vec2 tunnelUv = vUv + parallaxOffset(0.32);
	vec2 tunnelPoint = tunnelUv - 0.5;
	tunnelPoint.x *= aspect;
	vec2 vanishingPoint = vec2(0.10, -0.035);
	vec2 extent = vec2(aspect * 0.62, 0.60);
	float tunnel = 0.0;
	for (int index = 3; index <= 8; index++) {
		float depth = float(index) / 8.0;
		depth *= depth;
		vec2 halfSize = mix(vec2(0.042, 0.034), extent, depth);
		tunnel = max(tunnel, tunnelFrame(tunnelPoint, vanishingPoint, halfSize, 0.0033));
	}
	float tunnelAlpha = clamp(tunnel * 0.54, 0.0, 0.60) * uLayerTunnel;
	color = mix(color, mix(PERIWINKLE, COBALT, 0.16), tunnelAlpha);

	vec2 scaffoldUv = vUv + parallaxOffset(0.52);
	vec2 scaffoldScaled = vec2(scaffoldUv.x * aspect, scaffoldUv.y);
	vec2 scaffoldCoord = scaffoldScaled * 9.0;
	vec2 scaffoldCell = fract(scaffoldCoord);
	vec2 scaffoldId = floor(scaffoldCoord);
	float scaffoldNoise = seededHash(scaffoldId, 2.0);
	float braceMask = step(0.73, scaffoldNoise);
	float braces = max(
		line(scaffoldCell.x - scaffoldCell.y, 0.028),
		line(scaffoldCell.x + scaffoldCell.y - 1.0, 0.028)
	) * braceMask * uLayerBraces;
	float railV = periodicLine(scaffoldScaled.x * 1.86 - 0.5, 0.048);
	float railH = periodicLine(scaffoldUv.y * 1.68 - 0.5, 0.048);
	float dashV = smoothPeriodicMask(scaffoldUv.y * 70.0 + uTime * 0.12, 0.48);
	float dashH = smoothPeriodicMask(scaffoldUv.x * 80.0 - uTime * 0.10, 0.56);
	float scaffold = (railV * dashV + railH * dashH) * uLayerRails;
	float nodeSeed = step(0.957, scaffoldNoise) * braceMask;
	float nodePulsePhase = seededHash(scaffoldId, 3.0) * 6.2832;
	float nodePulse = 0.82 + sin(uTime * 1.4 + scaffoldId.x * 0.9 + scaffoldId.y * 1.3 + nodePulsePhase) * 0.18;
	float nodeCore = line(length(scaffoldCell - 0.5), 0.060) * nodeSeed;
	float nodeRing = line(length(scaffoldCell - 0.5) - 0.12, 0.017) * nodeSeed * nodePulse;
	float braceAlpha = braces * 0.70;
	float railAlpha = scaffold * 0.48;
	float nodeAlpha = (nodeRing * 0.40 + nodeCore * 0.64) * uLayerNodes;
	vec3 braceColor = mix(PERIWINKLE, COBALT, 0.18);
	vec3 railColor = mix(mix(PAPER_GRAIN_TINT, vec3(1.0), 0.78), PERIWINKLE, 0.22);
	vec3 nodeColor = mix(PERIWINKLE, COBALT, clamp(nodeAlpha * 1.7, 0.0, 1.0));
	color = mix(color, braceColor, clamp(braceAlpha, 0.0, 0.76));
	color = mix(color, railColor, clamp(railAlpha, 0.0, 0.55));
	color = mix(color, nodeColor, clamp(nodeAlpha, 0.0, 0.70));

	vec2 trafficUv = vUv + parallaxOffset(1.0);
	float routeH = 0.0;
	float routeV = 0.0;
	float packetH = 0.0;
	float packetV = 0.0;
	for (int routeIndex = 0; routeIndex < 5; routeIndex++) {
		float routeId = float(routeIndex);
		vec2 horizontalRoutePoint = vec2(
			(trafficUv.x - horizontalRouteCenter(routeId)) * aspect,
			trafficUv.y - horizontalRouteY(routeId)
		);
		vec2 verticalRoutePoint = vec2(
			(trafficUv.x - verticalRouteX(routeId)) * aspect,
			trafficUv.y - verticalRouteCenter(routeId)
		);
		routeH = max(routeH, roundedBox(horizontalRoutePoint, vec2(0.098 * aspect, 0.0026), 0.0026));
		routeV = max(routeV, roundedBox(verticalRoutePoint, vec2(0.0026, 0.098), 0.0026));
		packetH = max(packetH, horizontalPacket(trafficUv, aspect, routeId));
		packetV = max(packetV, verticalPacket(trafficUv, aspect, routeId));
	}
	routeH *= uLayerRoutes;
	routeV *= uLayerRoutes;
	packetH *= uLayerPackets;
	packetV *= uLayerPackets;
	float horizontalScanStart = mix(0.0, 0.20, seededHash(vec2(0.0), 401.0));
	float verticalScanStart = mix(0.85, 1.0, seededHash(vec2(0.0), 403.0));
	float horizontalScanPosition = fract(horizontalScanStart + uTime * 0.025);
	float verticalScanPosition = fract(verticalScanStart - uTime * 0.025);
	float horizontalScan = smoothstep(0.052, 0.0, wrappedDistance(trafficUv.y, horizontalScanPosition)) * 0.075;
	float verticalScan = smoothstep(0.052, 0.0, wrappedDistance(trafficUv.x, verticalScanPosition) * aspect) * 0.075;
	float scan = (horizontalScan + verticalScan) * uLayerScan;
	float routeAlpha = clamp((routeH + routeV) * 0.23, 0.0, 0.38);
	float packetAlpha = clamp(packetH * 1.35 + packetV * 1.25, 0.0, 1.0);
	vec3 packetColor = mix(COBALT, INK, 0.08);
	vec3 scanColor = mix(COBALT, INK, 0.34);
	color = mix(color, COBALT, routeAlpha);
	color = mix(color, packetColor, packetAlpha);
	color = mix(color, scanColor, clamp(scan, 0.0, 0.13));

	color = applyDither(color, PAPER);
	gl_FragColor = vec4(color, 1.0);
}
