#include "type.hlsl"

/*
contributors: Patricio Gonzalez Vivo
description: given a quaternion, returns its conjugate
use: <QUAT> quatConj(<QUAT> Q)
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/

#ifndef FNC_QUATCONJ
#define FNC_QUATCONJ
QUAT quatConj(QUAT q) { return QUAT(-q.xyz, q.w); }
#endif