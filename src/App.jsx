/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unknown-property */
import * as THREE from 'three'
import { useRef, useReducer, useMemo, useState, useEffect } from 'react'
import { Environment, Lightformer, Line, OrbitControls, Points, Sky, SpotLight, Stars } from '@react-three/drei'
import { BallCollider, Physics, RigidBody } from '@react-three/rapier'
import { Canvas, useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { Bloom, EffectComposer, Noise } from '@react-three/postprocessing'
import { BlurPass, Resizer, KernelSize, Resolution, BlendFunction } from 'postprocessing'
import * as random from 'maath/random'
import * as buffer from 'maath/buffer'
import * as misc from 'maath/misc'
import complexWave from './easings/complexWave'
import fragterrain from './glsl/terrain.frag'
import fragvert from './glsl/terrain.vert'

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
    <Canvas orthographic camera={{ zoom: 100 }}>
      {/* <PointsDemo /> */}
      <Stars radius={100} depth={50} count={500} factor={4} saturation={0} fade speed={1} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Terrain />
      <OrbitControls />
    </Canvas>
  )
}

function Terrain({ width = 100, height = 100, resolution = 1, elevation = 10 }) {
  const meshRef = useRef()
  const uniformsRef = useRef({
    uTime: { value: 0 },
    uElevation: { value: elevation },
    uLowColor: { value: new THREE.Color(0x1e6091) },
    uHighColor: { value: new THREE.Color(0xffffff) }
  })

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(width, height, width / resolution, height / resolution)
    geo.rotateX(-Math.PI / 2)
    return geo
  }, [width, height, resolution])

  useFrame((state) => {
    const { clock } = state
    if (meshRef.current) {
      meshRef.current.material.uniforms.uTime.value = clock.getElapsedTime()
    }
  })

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <shaderMaterial
        vertexShader={fragterrain}
        fragmentShader={fragterrain}
        uniforms={uniformsRef.current}
        side={THREE.DoubleSide}
      />
    </mesh>
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

const rotationAxis = new THREE.Vector3(0.2, 1, 0.5).normalize()
const q = new THREE.Quaternion()

function PointsDemo(props) {
  const pointsRef = useRef()
  // export declare function inRect<T extends TypedArray>(buffer: T, rect?: Rect, rng?: Generator): T;

  useEffect(() => {
    console.log('🚀 ~ useEffect ~ pointsRef.current:', pointsRef.current)
  }, [])
  const [{ box, sphere, final }] = useState(() => {
    const box = random.inBox(new Float32Array(10000 * 3), { side: 3 })
    const sphere = random.inSphere(new Float32Array(10000 * 3), { radius: 0.75 })
    const final = box.slice(0) // final buffer that will be used for the points mesh
    return { box, sphere, final }
  })

  // export declare function inSphere(buffer: TypedArray, sphere?: Sphere, rng?: Generator): TypedArray;

  useFrame(({ clock }) => {
    const et = clock.getElapsedTime()
    const delta = clock.getDelta()
    const t = misc.remap(Math.sin(et), [-1, 1], [0, 1])
    const t2 = misc.remap(Math.cos(et * 1), [-1, 1], [0, 1])
    const t3 = misc.remap(complexWave(et), [-1, 1], [0, 1])
    const t4 = easing.linear(t)

    // pointsRef.current.material.color.setHSL(t, 3, 0.2)
    // change material color with dampC
    // easing.dampC(pointsRef.current.material.color, { r: 0.2, g: 0.2, b: 0.5 }, 0.25, delta)

    buffer.rotate(sphere, {
      q: q.setFromAxisAngle(rotationAxis, t4 * 0.05)
    })
    buffer.swizzle(box, 4, 'xzy')
    buffer.lerp(box, sphere, final, t4)
  })
  // export declare function swizzle(buffer: TypedArray, stride?: number, swizzle?: string): TypedArray;

  return (
    <>
      <Sky distance={45000000} sunPosition={[1, 1, 1]} inclination={0} azimuth={0.25} {...props} />
      <Points
        positions={final}
        stride={3}
        //    ref={pointsRef}
        {...props}>
        <pointsMaterial size={1} blending={1} />
      </Points>
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
    </>
  )
}

function Scene() {
  // This is a super cheap depth buffer that only renders once (frames: 1 is optional!), which works well for static scenes
  // Spots can optionally use that for realism, learn about soft particles here: http://john-chapman-graphics.blogspot.com/2013/01/good-enough-volumetrics-for-spotlights.html
  const depthBuffer = useDepthBuffer({ frames: 1 })
  const { nodes, materials } = useGLTF(
    'https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/dragon/model.gltf'
  )
  return (
    <>
      <MovingSpot depthBuffer={depthBuffer} color="#0c8cbf" position={[3, 3, 2]} />
      <MovingSpot depthBuffer={depthBuffer} color="#b00c3f" position={[1, 3, 0]} />
      <mesh
        position={[0, -1.03, 0]}
        castShadow
        receiveShadow
        geometry={nodes.dragon.geometry}
        material={materials['Default OBJ.001']}
        dispose={null}
      />
      <mesh receiveShadow position={[0, -1, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[50, 50]} />
        <meshPhongMaterial />
      </mesh>
    </>
  )
}

function MovingSpot({ vec = new Vector3(), ...props }) {
  const light = useRef()
  const viewport = useThree((state) => state.viewport)
  useFrame((state) => {
    light.current.target.position.lerp(
      vec.set((state.mouse.x * viewport.width) / 2, (state.mouse.y * viewport.height) / 2, 0),
      0.1
    )
    light.current.target.updateMatrixWorld()
  })
  return (
    <SpotLight
      castShadow
      ref={light}
      penumbra={1}
      distance={6}
      angle={0.35}
      attenuation={5}
      anglePower={4}
      intensity={2}
      {...props}
    />
  )
}
