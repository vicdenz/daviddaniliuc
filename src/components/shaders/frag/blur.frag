uniform float uTime;
uniform float uAspect;
uniform vec3 uWashedWhiteColor;
uniform vec3 uDeepCharcoalColor;
uniform vec3 uMossGreenColor;
varying vec2 vUv;

float hash21(vec2 p) {
  p = fract(p * vec2(234.34, 435.17));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float line(float p, float width) { return smoothstep(width, 0.0, abs(p)); }

void main() {
  vec2 uv = vUv;
  float aspect = max(uAspect, 1.0);
  vec2 scaled = vec2(uv.x * aspect, uv.y);

  vec2 majorCoord = scaled * 9.0;
  vec2 majorCell = fract(majorCoord);
  vec2 majorId = floor(majorCoord);
  float majorGrid = max(line(majorCell.x, 0.014), line(majorCell.y, 0.014));

  vec2 minorCell = fract(scaled * 45.0);
  float minorGrid = max(line(minorCell.x, 0.028), line(minorCell.y, 0.028));

  float braceMask = step(0.77, hash21(majorId));
  float braceA = line(majorCell.x - majorCell.y, 0.014);
  float braceB = line(majorCell.x + majorCell.y - 1.0, 0.014);
  float braces = max(braceA, braceB) * braceMask;

  float railV = line(fract(scaled.x * 4.5) - 0.5, 0.018);
  float railH = line(fract(uv.y * 4.0) - 0.5, 0.018);
  float dashV = step(0.48, fract(uv.y * 70.0 + uTime * 0.12));
  float dashH = step(0.56, fract(uv.x * 80.0 - uTime * 0.10));
  float scaffold = railV * dashV + railH * dashH;

  float routeY = 0.19 + floor(uv.x * 5.0) * 0.12;
  float routeH = line(uv.y - routeY, 0.0025);
  float routeX = 0.12 + floor(uv.y * 5.0) * 0.17;
  float routeV = line(uv.x - routeX, 0.0025);
  float packetX = fract(uTime * 0.060 + uv.y * 0.37);
  float packetY = fract(uTime * 0.044 + uv.x * 0.31);
  float packetH = line(uv.x - packetX, 0.0065) * routeH;
  float packetV = line(uv.y - packetY, 0.0065) * routeV;

  float nodeSeed = step(0.68, hash21(majorId));
  float nodeCore = line(length(majorCell - 0.5), 0.054) * nodeSeed;
  float nodeRing = line(length(majorCell - 0.5) - 0.12, 0.012) * nodeSeed;
  float scan = smoothstep(0.09, 0.0, abs(uv.y - fract(uTime * 0.025))) * 0.08;
  float grain = (hash21(gl_FragCoord.xy + floor(uTime * 3.0)) - 0.5) * 0.028;

  vec3 paper = vec3(0.957, 0.941, 0.902);
  vec3 ink = vec3(0.094, 0.157, 0.231);
  vec3 blue = vec3(0.141, 0.341, 0.839);
  vec3 softBlue = vec3(0.686, 0.761, 0.902);

  vec3 color = paper;
  color = mix(color, ink, majorGrid * 0.19 + minorGrid * 0.055);
  color = mix(color, softBlue, braces * 0.34 + scaffold * 0.20);
  color = mix(color, blue, (routeH + routeV) * 0.10 + nodeRing * 0.28 + nodeCore * 0.48 + packetH * 0.9 + packetV * 0.75 + scan);
  color += grain;
  gl_FragColor = vec4(color, 1.0);
}
