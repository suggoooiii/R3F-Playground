/* eslint-disable react/no-unknown-property */
import * as THREE from 'three'
import { CubeCamera, Float, MeshReflectorMaterial } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { forwardRef, useEffect, useState } from 'react'
import { Bloom, EffectComposer, GodRays } from '@react-three/postprocessing'
import Thing from './Thing'
import { useControls } from 'leva'
import { BlendFunction } from 'postprocessing'

export default function App() {
  return (
    <Canvas camera={{ position: [0, 0, 30], fov: 35, near: 1, far: 60 }} gl={{ antialias: false }}>
      <color attach="background" args={['#050505']} />
      <ambientLight />
      <Screen />
      <Float rotationIntensity={3} floatIntensity={3} speed={1}>
        <CubeCamera position={[-3, -1, -5]} resolution={256} frames={Infinity}>
          {(texture) => (
            <mesh>
              <sphereGeometry args={[2, 32, 32]} />
              <meshStandardMaterial metalness={1} roughness={0.1} envMap={texture} />
            </mesh>
          )}
        </CubeCamera>
      </Float>
      <Floor />
      <Rig />
    </Canvas>
    // <Thing />
  )
}

function Rig() {
  useFrame((state, delta) => {
    easing.damp3(
      state.camera.position,
      [5 + state.pointer.x, 0 + +state.pointer.y, 18 + Math.atan2(state.pointer.x, state.pointer.y) * 2],
      0.4,
      delta
    )
    state.camera.lookAt(0, 0, 0)
  })
}

const Floor = () => {
  const props = useControls('Floor', {
    blur: { value: [300, 50], min: 0, max: 1000, step: 1 },
    resolution: { value: 1024, min: 128, max: 2048, step: 128 },
    mixBlur: { value: 1, min: 0, max: 1, step: 0.1 },
    mixStrength: { value: 100, min: 0, max: 200, step: 1 },
    roughness: { value: 1, min: 0, max: 1, step: 0.1 },
    depthScale: { value: 1.2, min: 0, max: 2, step: 0.1 },
    minDepthThreshold: { value: 0.4, min: 0, max: 1, step: 0.1 },
    maxDepthThreshold: { value: 1.4, min: 0, max: 2, step: 0.1 },
    myFooColor: '#fff',
    metalness: { value: 0.8, min: 0, max: 1, step: 0.1 }
  })
  return (
    <mesh position={[0, -5.02, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[100, 100]} />
      <MeshReflectorMaterial {...props} />
    </mesh>
  )
}

const Emitter = forwardRef((props, forwardRef) => {
  const [video] = useState(() =>
    Object.assign(document.createElement('video'), {
      src: '/duvas.MOV',
      crossOrigin: 'Anonymous',
      loop: true,
      muted: true
    })
  )
  useEffect(() => void video.play(), [video])
  return (
    <mesh ref={forwardRef} position={[0, 0, -16]} {...props}>
      <planeGeometry args={[15, 10]} />
      <meshBasicMaterial opacity={0.2}>
        <videoTexture attach="map" args={[video]} colorSpace={THREE.SRGBColorSpace} />
      </meshBasicMaterial>
      <mesh scale={[16.05, 10.05, 1]} position={[0, 0, -0.01]}>
        <planeGeometry />
        <meshBasicMaterial color="black" />
      </mesh>
    </mesh>
  )
})
Emitter.displayName = 'Emitter'

function Screen() {
  const godRaysProps = useControls('God Rays', {
    blur: { value: true },
    blendFunction: { value: BlendFunction.SCREEN, options: BlendFunction },
    samples: { value: 60, min: 1, max: 100, step: 1 },
    density: { value: 0.96, min: 0, max: 1, step: 0.01 },
    decay: { value: 0.2, min: 0, max: 1, step: 0.01 },
    weight: { value: 0.7, min: 0, max: 1, step: 0.01 },
    exposure: { value: 0.3, min: 0, max: 1, step: 0.01 },
    clampMax: { value: 1, min: 0, max: 1, step: 0.01 },
    resolutionScale: { value: 0.5, min: 0, max: 1, step: 0.01 },
    kernelSize: { value: 1, min: 0, max: 3, step: 1 },
    width: { value: 1920 },
    height: { value: 1080 }
  })

  const bloomProps = useControls('Bloom', {
    intensity: { value: 1, min: 0, max: 3, step: 0.01 },
    blurPass: { value: true },
    luminanceThreshold: { value: 0.0, min: 0, max: 1, step: 0.01 },
    luminanceSmoothing: { value: 0.025, min: 0, max: 1, step: 0.001 },
    mipmapBlur: { value: true },
    resolutionScale: { value: 0.5, min: 0, max: 1, step: 0.01 },
    width: { value: 1920 },
    height: { value: 1080 }
  })
  const [material, set] = useState()

  return (
    <>
      <Emitter ref={set} />
      {material && (
        <EffectComposer disableNormalPass multisampling={8}>
          <GodRays sun={material} {...godRaysProps} />
          <Bloom luminanceThreshold={0.2} mipmapBlur luminanceSmoothing={1} intensity={1.0} />
        </EffectComposer>
      )}
    </>
  )
}
