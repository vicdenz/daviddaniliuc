uniform float uAspect;
uniform float uScroll;
uniform float uTime;
uniform vec2 uResolution;
varying vec2 vUv;

const vec3 PAPER = vec3(0.957, 0.941, 0.902);
const vec3 INK = vec3(0.094, 0.157, 0.231);
const vec3 COBALT = vec3(0.141, 0.341, 0.839);
const vec3 PERIWINKLE = vec3(0.686, 0.761, 0.902);

float hash21(vec2 point) {
	point = fract(point * vec2(234.34, 435.17));
	point += dot(point, point + 34.23);
	return fract(point.x * point.y);
}

float line(float point, float width) {
	float antialias = fwidth(point) * 0.85;
	return 1.0 - smoothstep(width - antialias, width + antialias, abs(point));
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
	return vec2(
		sin(uScroll * 0.72) * 0.0035 * depth,
		-uScroll * 0.009 * depth
	);
}

void main() {
	float aspect = max(uAspect, 1.0);
	vec2 grainCell = floor(gl_FragCoord.xy / max(uResolution / vec2(1440.0, 900.0), vec2(1.0)));
	float grain = (hash21(grainCell) - 0.5) * 0.006;
	vec3 color = PAPER + grain;

	vec2 gridUv = vUv + parallaxOffset(0.12);
	vec2 gridScaled = vec2(gridUv.x * aspect, gridUv.y);
	vec2 majorCell = fract(gridScaled * 9.0);
	vec2 minorCell = fract(gridScaled * 45.0);
	float majorGrid = max(line(majorCell.x, 0.018), line(majorCell.y, 0.018));
	float minorGrid = max(line(minorCell.x, 0.034), line(minorCell.y, 0.034));
	float gridAlpha = clamp(majorGrid * 0.44 + minorGrid * 0.075, 0.0, 0.48);
	color = mix(color, INK, gridAlpha);

	vec2 tunnelUv = vUv + parallaxOffset(0.32);
	vec2 tunnelPoint = tunnelUv - 0.5;
	tunnelPoint.x *= aspect;
	vec2 vanishingPoint = vec2(0.10, -0.035);
	vec2 extent = vec2(aspect * 0.62, 0.60);
	float tunnel = 0.0;
	for (int index = 1; index <= 8; index++) {
		float depth = float(index) / 8.0;
		depth *= depth;
		vec2 halfSize = mix(vec2(0.042, 0.034), extent, depth);
		tunnel = max(tunnel, tunnelFrame(tunnelPoint, vanishingPoint, halfSize, 0.0022));
	}
	float tunnelAlpha = clamp(tunnel * 0.46, 0.0, 0.52);
	color = mix(color, mix(PERIWINKLE, COBALT, 0.16), tunnelAlpha);

	vec2 scaffoldUv = vUv + parallaxOffset(0.52);
	vec2 scaffoldScaled = vec2(scaffoldUv.x * aspect, scaffoldUv.y);
	vec2 scaffoldCoord = scaffoldScaled * 9.0;
	vec2 scaffoldCell = fract(scaffoldCoord);
	vec2 scaffoldId = floor(scaffoldCoord);
	float braceMask = step(0.77, hash21(scaffoldId));
	float braces = max(
		line(scaffoldCell.x - scaffoldCell.y, 0.019),
		line(scaffoldCell.x + scaffoldCell.y - 1.0, 0.019)
	) * braceMask;
	float railV = line(fract(scaffoldScaled.x * 4.5) - 0.5, 0.024);
	float railH = line(fract(scaffoldUv.y * 4.0) - 0.5, 0.024);
	float dashV = step(0.48, fract(scaffoldUv.y * 70.0 + uTime * 0.12));
	float dashH = step(0.56, fract(scaffoldUv.x * 80.0 - uTime * 0.10));
	float scaffold = railV * dashV + railH * dashH;
	float nodeSeed = step(0.68, hash21(scaffoldId));
	float nodePulse = 0.82 + sin(uTime * 1.4 + scaffoldId.x * 0.9 + scaffoldId.y * 1.3) * 0.18;
	float nodeCore = line(length(scaffoldCell - 0.5), 0.060) * nodeSeed;
	float nodeRing = line(length(scaffoldCell - 0.5) - 0.12, 0.017) * nodeSeed * nodePulse;
	float structureAlpha = braces * 0.62 + scaffold * 0.44;
	float nodeAlpha = nodeRing * 0.35 + nodeCore * 0.58;
	float scaffoldAlpha = clamp(structureAlpha + nodeAlpha, 0.0, 0.76);
	vec3 scaffoldColor = mix(PERIWINKLE, COBALT, clamp(nodeAlpha * 1.7, 0.0, 1.0));
	color = mix(color, scaffoldColor, scaffoldAlpha);

	vec2 trafficUv = vUv + parallaxOffset(1.0);
	float routeY = 0.19 + floor(trafficUv.x * 5.0) * 0.12;
	float routeH = line(trafficUv.y - routeY, 0.0038);
	float routeX = 0.12 + floor(trafficUv.y * 5.0) * 0.17;
	float routeV = line(trafficUv.x - routeX, 0.0038);
	float packetH = 0.0;
	packetH = max(packetH, line(trafficUv.x - fract(uTime * 0.060 + trafficUv.y * 0.37), 0.0084));
	packetH = max(packetH, line(trafficUv.x - fract(uTime * 0.047 + trafficUv.y * 0.21 + 0.34), 0.0072));
	packetH = max(packetH, line(trafficUv.x - fract(uTime * 0.071 + trafficUv.y * 0.46 + 0.68), 0.0065));
	packetH *= routeH;
	float packetV = 0.0;
	packetV = max(packetV, line(trafficUv.y - fract(uTime * 0.044 + trafficUv.x * 0.31), 0.0084));
	packetV = max(packetV, line(trafficUv.y - fract(uTime * 0.057 + trafficUv.x * 0.19 + 0.41), 0.0072));
	packetV = max(packetV, line(trafficUv.y - fract(uTime * 0.036 + trafficUv.x * 0.43 + 0.76), 0.0065));
	packetV *= routeV;
	float scan = smoothstep(0.09, 0.0, abs(trafficUv.y - fract(uTime * 0.025))) * 0.06;
	float trafficAlpha = clamp((routeH + routeV) * 0.18 + packetH * 0.95 + packetV * 0.85 + scan, 0.0, 0.94);
	color = mix(color, COBALT, trafficAlpha);

	gl_FragColor = vec4(color, 1.0);
}
