// "Blur" Fragment shader

#pragma glslify: noise = require('glsl-noise/simplex/3d')

uniform float uTime;
uniform float uAspect;
uniform vec3 uWashedWhiteColor;
uniform vec3 uRicePaperColor;
uniform vec3 uMossGreenColor;

varying vec2 vUv;

float random(vec2 st) {
  return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);
}

void main() {
  // Normalized noise values with different uv scales
  float noiseA = noise(vec3(vUv * 2., uTime * 0.25)) * 0.4 + 0.6;
  float noiseB = noise(vec3(vUv * 4., uTime * 0.15)) * 0.6 + 0.4;

  // mix 3 colors based on noise values
  vec3 color = mix(uWashedWhiteColor, uMossGreenColor, noiseA);

  // vignette
  vec2 uv = vUv * 2.0 - 1.0;
  uv.x *= uAspect;
  float vignette = distance(uv, vec2(-0.0));
//   float vig = smoothstep(min(0.55, max(0.35, noiseB)), max(0.6, noiseB), vignette);
//   color = mix(uWashedWhiteColor, color, vig);
  float fade = smoothstep(min(0.65, max(0.5, noiseB)), 1.0, vUv.y);
  color = mix(uWashedWhiteColor, color, fade);

  // high frequency noise for a grainy effect
  float noiseV = noise(vec3(vUv * 800.0, uTime)) * 0.8 + 0.2;
  vec3 noiseColor = mix(color, uRicePaperColor, noiseV);

  color = mix(color, noiseColor, 0.2);

  gl_FragColor = vec4(color, 1);
}