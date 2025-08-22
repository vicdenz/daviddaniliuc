// Home Background Fragment shader

#pragma glslify: noise = require('glsl-noise/simplex/3d')

uniform float uTime;
uniform float uAspect;
uniform vec3 uWashedWhiteColor;
uniform vec3 uWoodBrownColor;
uniform vec3 uWoodBrownLightColor;

varying vec2 vUv;

void main() {        
  // Normalized noise values with different uv scales
  float noiseA = noise(vec3(vUv * 2., uTime * 0.2)) * 0.5 + 0.5;
  float noiseB = noise(vec3(vUv * 4., uTime * 0.1)) * 0.5 + 0.5;

  // mix 3 colors based on noise values
  vec3 color = mix(mix(uWashedWhiteColor, uWoodBrownLightColor, noiseB), uWoodBrownColor, noiseA);

  // vignette
  vec2 uv = vUv * 2.0 - 1.0;
  uv.x *= uAspect;
  float vignette = distance(uv, vec2(0.0));
  float vig = smoothstep(0.6, 1.2, vignette);
  color = mix(color, uWoodBrownColor, vig);

  // high frequency noise for a grainy effect
  float noiseV = noise(vec3(vUv * 400.0, uTime)); 
  vec3 noiseColor = mix(color, uWoodBrownLightColor, noiseV);

  color = mix(color, noiseColor, 0.2);

  gl_FragColor = vec4(color, 1.0);
}