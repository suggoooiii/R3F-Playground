/*
contributors: Patricio Gonzalez Vivo
description: Calculate point light
use: lightPoint(<float3> _diffuseColor, <float3> _specularColor, <float3> _N, <float3> _V, <float> _NoV, <float> _f0, out <float3> _diffuse, out <float3> _specular)
options:
    - DIFFUSE_FNC: diffuseOrenNayar, diffuseBurley, diffuseLambert (default)
    - SURFACE_POSITION: in glslViewer is v_position
    - LIGHT_POSITION: in glslViewer is u_light
    - LIGHT_COLOR: in glslViewer is u_lightColor
    - LIGHT_INTENSITY: in glslViewer is  u_lightIntensity
    - LIGHT_FALLOFF: in glslViewer is u_lightFalloff
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/

#include "../specular.hlsl"
#include "../diffuse.hlsl"
#include "falloff.hlsl"

#ifndef STR_LIGHT_POINT
#define STR_LIGHT_POINT
struct LightPoint
{
    float3 position;
    float3 color;
    float intensity;
    float falloff;
};
#endif

#ifndef FNC_LIGHT_POINT
#define FNC_LIGHT_POINT

void lightPoint(
    const in float3 _diffuseColor, const in float3 _specularColor,
    const in float3 _V,
    const in float3 _Lp, const in float3 _Ld, const in float3 _Lc, const in float _Li, const in float _Ldist, const in float _Lof,
    const in float3 _N, const in float _NoV, const in float _NoL, const in float _roughness, const in float _f0,
    inout float3 _diffuse, inout float3 _specular)
{

    float dif = diffuse(_Ld, _N, _V, _NoV, _NoL, _roughness); // * INV_PI;
    float spec = specular(_Ld, _N, _V, _NoV, _NoL, _roughness, _f0);

    float3 lightContribution = _Lc * _Li * _NoL;
    if (_Lof > 0.0)
        lightContribution *= falloff(_Ldist, _Lof);

    _diffuse += max(float3(0.0, 0.0, 0.0), _diffuseColor * lightContribution * dif);
    _specular += max(float3(0.0, 0.0, 0.0), _specularColor * lightContribution * spec);
}

#ifdef STR_MATERIAL
void lightPoint(
    const in float3 _diffuseColor, const in float3 _specularColor,
    LightPoint _L, const in Material _mat, 
    inout float3 _diffuse, inout float3 _specular) 
    {
    float dist  = length(_L.position);
    float3 L      = _L.position/dist;

    float f0    = max(_mat.f0.r, max(_mat.f0.g, _mat.f0.b));
    float NoL   = dot(_mat.normal, L);

    lightPoint( _diffuseColor, _specularColor, 
                _mat.V, 
                _L.position, L, _L.color, _L.intensity, dist, _L.falloff, 
                _mat.normal, _mat.NoV, NoL, _mat.roughness, f0, 
                _diffuse, _specular);

    // TODO:
    // - make sure that the shadow use a perspective projection
#ifdef SHADING_MODEL_SUBSURFACE
    float3  h     = normalize(_mat.V + L);
    float NoH   = saturate(dot(_mat.normal, h));
    float LoH   = saturate(dot(L, h));

    float scatterVoH = saturate(dot(_mat.V, -L));
    float forwardScatter = exp2(scatterVoH * _mat.subsurfacePower - _mat.subsurfacePower);
    float backScatter = saturate(NoL * _mat.thickness + (1.0 - _mat.thickness)) * 0.5;
    float subsurface = lerp(backScatter, 1.0, forwardScatter) * (1.0 - _mat.thickness);
    _diffuse += _mat.subsurfaceColor * (subsurface * diffuseLambert());
#endif
}
#endif

#endif