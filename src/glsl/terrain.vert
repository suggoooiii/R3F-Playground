#ifdef GL_ES
precision mediump float;
#endif

#include "../../lygia/generative/cnoise.glsl"


uniform float uTime;
uniform float uElevation;

varying vec3 vPosition;

void main() {
    vec3 pos = position;
    float n = cnoise(pos.xz * 0.1 + uTime * 0.1) * 0.5 + 0.5;
    pos.y += n * uElevation;
    vPosition = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}