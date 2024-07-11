#include "../../math/const.glsl"

/*
contributors: Patricio Gonzalez Vivo
description: Calculate diffuse contribution using lambert equation
use:
    - <float> diffuseLambert(<vec3> light, <vec3> normal [, <vec3> view, <float> roughness])
    - <float> diffuseLambert(<vec3> L, <vec3> N, <vec3> V, <float> NoV, <float> NoL, <float> roughness)
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/

#ifndef FNC_DIFFUSE_LAMBERT
#define FNC_DIFFUSE_LAMBERT
float diffuseLambert() { return INV_PI; }
float diffuseLambert(const in vec3 L, const in vec3 N) { return max(0.0, dot(N, L)); }
float diffuseLambert(const in vec3 L, const in vec3 N, const in vec3 V, const in float roughness) { return diffuseLambert(L, N); }
float diffuseLambert(const in vec3 L, const in vec3 N, const in vec3 V, const in float NoV, const in float NoL, const in float roughness) { return max(0.0, NoL); }
#endif