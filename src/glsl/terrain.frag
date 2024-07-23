
#ifdef GL_ES
precision mediump float;
#endif

uniform float uTime;
uniform float uElevation;
uniform vec3 uLowColor;
uniform vec3 uHighColor;

#include "lygia/generative/cnoise.glsl"


varying vec3 vPosition;

void main() {
    float n = cnoise(vPosition * 0.1 + uTime * 0.1) * 0.5 + 0.5;
    float height = smoothstep(0.0, uElevation, vPosition.y + n * uElevation);
    vec3 color = mix(uLowColor, uHighColor, height);
    gl_FragColor = vec4(color, 1.0);
}