/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unknown-property */
import * as THREE from 'three'
import { useRef, useReducer, useMemo, useState } from 'react'
import { Environment, Lightformer, OrbitControls, Points } from '@react-three/drei'
import { BallCollider, Physics, RigidBody } from '@react-three/rapier'
import { Canvas, useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { Bloom, EffectComposer, Noise } from '@react-three/postprocessing'
import { BlurPass, Resizer, KernelSize, Resolution, BlendFunction } from 'postprocessing'
import * as random from 'maath/random'
import * as buffer from 'maath/buffer'
import * as misc from 'maath/misc'

const accents = ['#ff4060', '#ffcc00', '#20ffa0', '#4060ff']
const shuffle = (accent = 0) => [
  { color: '#444', roughness: 0.1, metalness: 0.8 },
  { color: '#444', roughness: 0.1, metalness: 0.8 },
  { color: '#444', roughness: 0.1, metalness: 0.8 },
  { color: 'white', roughness: 0.1, metalness: 0.1 },
  { color: 'white', roughness: 0.1, metalness: 0.1 },
  { color: 'white', roughness: 0.1, metalness: 0.1 },
  { color: accents[accent], roughness: 0.1, accent: true },
  { color: accents[accent], roughness: 0.1, accent: true },
  { color: accents[accent], roughness: 0.1, accent: true },
  { color: '#444', roughness: 0.1 },
  { color: '#444', roughness: 0.3 },
  { color: '#444', roughness: 0.3 },
  { color: 'white', roughness: 0.1 },
  { color: 'white', roughness: 0.2 },
  { color: 'white', roughness: 0.1 },
  {
    color: accents[accent],
    roughness: 0.1,
    accent: true,
    transparent: true,
    opacity: 0.5
  },
  { color: accents[accent], roughness: 0.3, accent: true },
  { color: accents[accent], roughness: 0.1, accent: true }
]

export default function App(props) {
  // const [count, setCount] = useState(0)
  const [accent, click] = useReducer((state) => ++state % accents.length, 0)
  const connectors = useMemo(() => shuffle(accent), [accent])

  return (
    <Canvas orthographic camera={{ zoom: 200 }}>
      <color attach="background" args={['#000']} />
      <PointsDemo />
      <OrbitControls />
    </Canvas>
  )
}

function Sphere({
  position,
  children,
  vec = new THREE.Vector3(),
  scale,
  r = THREE.MathUtils.randFloatSpread,
  accent,
  color = 'white',
  ...props
}) {
  const api = useRef()
  const ref = useRef()
  const pos = useMemo(() => position || [r(10), r(10), r(10)], [])
  useFrame((state, delta) => {
    delta = Math.min(0.1, delta)
    api.current?.applyImpulse(vec.copy(api.current.translation()).negate().multiplyScalar(0.2))
    easing.dampC(ref.current.material.color, color, 0.2, delta)
  })
  return (
    <RigidBody linearDamping={2} angularDamping={1} friction={0.2} position={pos} ref={api} colliders={false}>
      <BallCollider args={[1]} />
      <mesh ref={ref} castShadow receiveShadow>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial toneMapped={false} emissiveIntensity={0.2} {...props} />
        {children}
      </mesh>
    </RigidBody>
  )
}

function Pointer({ vec = new THREE.Vector3() }) {
  const ref = useRef()
  useFrame(({ pointer, viewport }) =>
    ref.current?.setNextKinematicTranslation(
      vec.set((pointer.x * viewport.width) / 2, (pointer.y * viewport.height) / 2, 0)
    )
  )
  return (
    <RigidBody position={[5, 5, 5]} type="kinematicPosition" colliders={true} ref={ref}>
      <BallCollider args={[2]} />
    </RigidBody>
  )
}

function Effects() {
  return (
    <EffectComposer>
      <Bloom
        intensity={0.1} // The bloom intensity.
        blurPass={undefined} // A blur pass.
        kernelSize={KernelSize.VERY_LARGE} // blur kernel size
        luminanceThreshold={0.5} // luminance threshold. Raise this value to mask out darker elements in the scene.
        luminanceSmoothing={0.2} // smoothness of the luminance threshold. Range is [0, 1]
        mipmapBlur={true} // Enables or disables mipmap blur.
        resolutionX={Resolution.AUTO_SIZE} // The horizontal resolution.
        resolutionY={Resolution.AUTO_SIZE} // The vertical resolution.
      />
      <Noise
        premultiply // enables or disables noise premultiplication
        blendFunction={BlendFunction.HUE} // blend mode
      />
    </EffectComposer>
  )
}

function Env() {
  return (
    <Environment resolution={256}>
      <group rotation={[-Math.PI / 3, 0, 1]}>
        <Lightformer form="circle" intensity={20} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={2} />
        <Lightformer form="circle" intensity={25} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={2} />
        <Lightformer form="circle" intensity={25} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={2} />
        <Lightformer form="circle" intensity={25} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={2} />
        <Lightformer
          form="ring"
          color="#4060ff"
          intensity={80}
          onUpdate={(self) => self.lookAt(0, 0, 0)}
          position={[10, 10, 0]}
          scale={10}
        />
      </group>
    </Environment>
  )
}

const rotationAxis = new THREE.Vector3(0, 1, 0).normalize()
const q = new THREE.Quaternion()

function PointsDemo(props) {
  const pointsRef = useRef()
  const [{ box, sphere, final }] = useState(() => {
    const box = random.inBox(new Float32Array(90000), { sides: [1, 2, 1] })
    const sphere = random.inSphere(box.slice(0), { radius: 0.75 })
    const final = box.slice(0) // final buffer that will be used for the points mesh

    return { box, sphere, final }
  })

  useFrame(({ clock }) => {
    const et = clock.getElapsedTime()
    const t = misc.remap(Math.sin(et), [-1, 1], [0, 1])
    const t2 = misc.remap(Math.cos(et * 3), [-1, 1], [0, 1])

    buffer.rotate(box, {
      q: q.setFromAxisAngle(rotationAxis, t2 * 0.1)
    })

    buffer.lerp(box, sphere, final, t)
  })

  return (
    <Points positions={final} stride={3} ref={pointsRef} {...props}>
      <pointsMaterial size={1} />
    </Points>
  )
}
