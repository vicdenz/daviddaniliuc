// "Metaballs Fragment shader

#pragma glslify: noise = require('glsl-noise/simplex/3d')

uniform float uTime;
uniform float uAspect;
uniform vec3 uWashedWhiteColor;
uniform vec3 uRicePaperColor;
uniform vec3 uMossGreenColor;

varying vec2 vUv;

vec2 random2( vec2 p ) {
    return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

vec3 random3(vec3 c) {
    float j = 4096.0*sin(dot(c,vec3(17.0, 59.4, 15.0)));
    vec3 r;
    r.z = fract(512.0*j);
    j *= .125;
    r.x = fract(512.0*j);
    j *= .125;
    r.y = fract(512.0*j);
    return r-0.5;
}

void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= uAspect;
    vec3 greenColor = uMossGreenColor;
    vec3 color = uWashedWhiteColor;

    // Scale
    uv *= 5.;

    // Tile the space
    vec2 i_st = floor(uv);
    vec2 f_st = fract(uv);

    float m_dist = 1.;  // minimum distance
    for (int j= -1; j <= 1; j++ ) {
        for (int i= -1; i <= 1; i++ ) {
            // Neighbor place in the grid
            vec2 neighbor = vec2(float(i),float(j));

            // Random position from current + neighbor place in the grid
            vec2 offset = random2(i_st + neighbor);

            // Animate the offset
            offset = 0.5 + 0.5*sin(uTime + 6.2831*offset);

            // Position of the cell
            vec2 pos = neighbor + offset - f_st;

            // Cell distance
            float dist = length(pos);

            // Metaball it!
            m_dist = min(m_dist, m_dist*dist);
        }
    }

    // Draw cells
    if (m_dist < 0.25) {
	    color = greenColor;
    } else if (0.25 <= m_dist && m_dist <= 0.3) {
	    color = vec3(0.72, 0.45, 0.40) * (1.0 + noise(vec3(uTime * 0.35)));
    }

    gl_FragColor = vec4(color, 1.0);
}
