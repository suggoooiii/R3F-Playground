/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unknown-property */
import React, { useRef } from 'react'
import { Canvas, extend, useFrame } from '@react-three/fiber'
import { OrbitControls, Sphere, Plane, shaderMaterial } from '@react-three/drei'
import { EffectComposer, Bloom, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'

const CustomShaderMaterial = shaderMaterial(
  { uTime: 0, uColor: new THREE.Color(0.0, 0.0, 1.0) },
  // vertex shader
  /*glsl*/ `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 pos = position;
    float swirl = sin(pos.y * 2.0 + uTime * 2.0) * 0.1;
    pos.x += swirl;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
  `,
  // fragment shader
  /*glsl*/ `
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    gl_FragColor = vec4(vUv.x, vUv.y, abs(sin(uColor.b + uColor.g * 2.0)), 1.0);
  }
  `
)

// declaratively
extend({ CustomShaderMaterial })

const CustomSphere = () => {
  const materialRef = useRef()
  useFrame(({ clock }) => {
    materialRef.current.uTime = clock.getElapsedTime()
  })

  return (
    <mesh>
      <sphereGeometry args={[1, 64, 64]} />
      <customShaderMaterial ref={materialRef} />
    </mesh>
  )
}

const Thing = () => {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={1.5} />
      <CustomSphere />
      <OrbitControls />
      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} />
      </EffectComposer>
    </Canvas>
  )
}

export default Thing
