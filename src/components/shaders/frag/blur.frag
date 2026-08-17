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
  vec2 scaled = vec2(uv.x * max(uAspect, 1.0), uv.y);
  vec2 majorCell = fract(scaled * 8.0);
  float majorGrid = max(line(majorCell.x, 0.011), line(majorCell.y, 0.011));
  vec2 minorCell = fract(scaled * 40.0);
  float minorGrid = max(line(minorCell.x, 0.018), line(minorCell.y, 0.018));

  float routeY = 0.33 + floor(uv.x * 5.0) * 0.073;
  float routeH = line(uv.y - routeY, 0.0025);
  float routeX = 0.18 + floor(uv.y * 4.0) * 0.17;
  float routeV = line(uv.x - routeX, 0.0025);
  float packetX = fract(uTime * 0.055 + uv.y * 0.41);
  float packet = line(uv.x - packetX, 0.007) * routeH;
  float nodes = line(length(fract(scaled * 8.0) - 0.5), 0.055) * step(0.72, hash21(floor(scaled * 8.0)));

  vec3 paper = vec3(0.91, 0.90, 0.86);
  vec3 graphite = vec3(0.10, 0.16, 0.15);
  vec3 cobalt = vec3(0.09, 0.25, 0.72);
  vec3 color = paper;
  color = mix(color, graphite, majorGrid * 0.12 + minorGrid * 0.035);
  color = mix(color, cobalt, (routeH + routeV) * 0.07 + nodes * 0.24 + packet * 0.75);
  gl_FragColor = vec4(color, 1.0);
}
