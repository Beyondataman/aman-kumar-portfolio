import { Suspense, lazy, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, DepthOfField } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useStore } from '../lib/store'
import { live } from '../lib/live'
import { TIERS } from '../lib/quality'
import { rig } from './rig'
import { k } from './util'
import HeroWorld from './HeroWorld'

// Worlds other than the story are code-split and mounted on first visit only.
const HallWorld = lazy(() => import('./HallWorld'))
const WorkspaceWorld = lazy(() => import('./WorkspaceWorld'))

/**
 * ONE persistent WebGL canvas for the whole site.
 * It is never unmounted, so there is exactly one GPU context and the
 * story object/environment are never re-created between routes.
 */
export default function Stage() {
  const tier = useStore((s) => s.tier)
  const baseTier = useStore((s) => s.baseTier)
  const route = useStore((s) => s.route)
  const worlds = useStore((s) => s.worlds)
  const T = TIERS[tier]
  const eventSource = useMemo(() => document.getElementById('root'), [])

  return (
    <Canvas
      className={`stage stage--${route}`}
      aria-hidden="true"
      frameloop="demand"
      dpr={[1, T.dpr]}
      shadows={TIERS[baseTier].shadows}
      gl={{ antialias: true, powerPreference: 'high-performance', stencil: false, alpha: false }}
      camera={{ fov: 35, near: 0.1, far: 220, position: [0, 0, 12] }}
      eventSource={eventSource}
      eventPrefix="client"
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
        gl.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault())
      }}
    >
      <color attach="background" args={['#050506']} />
      <fog attach="fog" args={['#050506', 14, 48]} />
      <RenderDriver />
      <Adaptive />
      <CameraRig />
      <LightRig shadows={TIERS[baseTier].shadows} />
      <Environment resolution={64} frames={1}>
        <Lightformer form="rect" intensity={2.2} color="#e4ebff" position={[-4, 3, 4]} scale={[6, 2, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#9fb4ff" position={[5, -1, 3]} scale={[4, 4, 1]} />
        <Lightformer form="ring" intensity={0.8} color="#ffffff" position={[0, 6, -6]} scale={3} />
      </Environment>

      <HeroWorld />
      {worlds.hall && (
        <Suspense fallback={null}>
          <HallWorld />
        </Suspense>
      )}
      {worlds.workspace && (
        <Suspense fallback={null}>
          <WorkspaceWorld />
        </Suspense>
      )}
      <Effects tier={tier} route={route} />
    </Canvas>
  )
}

/** Demand-based rendering: full rate while something moves, a low ambient rate (or none) when idle. */
function RenderDriver() {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    let raf
    let last = 0
    const loop = (t) => {
      raf = requestAnimationFrame(loop)
      if (document.hidden) return
      if (t < live.activeUntil) { last = t; invalidate(); return }
      const fps = live.reducedMotion ? 0 : live.idleFps
      if (fps > 0 && t - last >= 1000 / fps - 1) { last = t; invalidate() }
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [invalidate])
  return null
}

/** Adaptive quality: moves the tier with measured FPS (resolution + post effects only). */
function Adaptive() {
  const setTier = useStore((s) => s.setTier)
  const order = ['low', 'medium', 'high']
  const step = (d) => {
    const cur = useStore.getState().tier
    const i = Math.min(2, Math.max(0, order.indexOf(cur) + d))
    if (order[i] !== cur) setTier(order[i])
  }
  return (
    <PerformanceMonitor
      bounds={(refresh) => (refresh > 90 ? [50, 90] : [36, 55])}
      flipflops={4}
      onDecline={() => step(-1)}
      onIncline={() => step(1)}
      onFallback={() => setTier('low')}
    />
  )
}

const _look = new THREE.Vector3()
function CameraRig() {
  const look = useRef(new THREE.Vector3())
  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.1)
    const cam = state.camera
    const snap = performance.now() < live.snapUntil || cam.position.distanceTo(rig.cam.pos) > 60
    if (snap) {
      cam.position.copy(rig.cam.pos)
      look.current.copy(rig.cam.look)
    } else {
      const f = k(rig.cam.lambda, dt)
      cam.position.lerp(rig.cam.pos, f)
      look.current.lerp(rig.cam.look, f)
    }
    cam.lookAt(_look.copy(look.current))
    const fog = state.scene.fog
    if (fog) {
      const f = snap ? 1 : k(2, dt)
      fog.near += (rig.fog.near - fog.near) * f
      fog.far += (rig.fog.far - fog.far) * f
    }
  })
  return null
}

/**
 * A single shared light set for every world. Lights are never added/removed
 * on route changes (that would force shader recompiles) — worlds only move
 * and re-tune them.
 */
function LightRig({ shadows }) {
  const amb = useRef(), key = useRef(), rim = useRef(), spot = useRef(), point = useRef()
  const target = useMemo(() => new THREE.Object3D(), [])
  // directional lights aim at whatever the active world is looking at
  const aim = useMemo(() => new THREE.Object3D(), [])
  useEffect(() => {
    key.current.target = aim
    rim.current.target = aim
  }, [aim])
  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.1)
    const snap = performance.now() < live.snapUntil
    const f = snap ? 1 : k(4, dt)
    const L = rig.light
    amb.current.intensity += (L.ambient - amb.current.intensity) * f
    key.current.intensity += (L.key - key.current.intensity) * f
    key.current.position.lerp(L.keyPos, f)
    key.current.color.lerp(L.keyColor, f)
    rim.current.color.lerp(L.rimColor, f)
    rim.current.intensity += (L.rim - rim.current.intensity) * f
    rim.current.position.lerp(L.rimPos, f)
    spot.current.intensity += (L.spot - spot.current.intensity) * f
    spot.current.position.lerp(L.spotPos, f)
    spot.current.color.lerp(L.spotColor, f)
    target.position.lerp(L.spotTarget, f)
    target.updateMatrixWorld()
    aim.position.copy(rig.cam.look)
    aim.updateMatrixWorld()
    point.current.intensity += (L.point - point.current.intensity) * f
    point.current.position.lerp(L.pointPos, f)
  })
  return (
    <>
      <ambientLight ref={amb} intensity={0.16} color="#8a8f99" />
      <directionalLight ref={key} intensity={0.6} color="#9fb4ff" position={[-6, 8, 6]} />
      <directionalLight ref={rim} intensity={1} color="#6f8cff" position={[0, 3, -12]} />
      <primitive object={target} />
      <primitive object={aim} />
      <spotLight
        ref={spot}
        target={target}
        intensity={40}
        distance={30}
        angle={0.55}
        penumbra={1}
        decay={1.6}
        color="#cdd8ff"
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
      />
      <pointLight ref={point} intensity={6} distance={7} decay={2} color="#6f8cff" />
    </>
  )
}

function Effects({ tier, route }) {
  const T = TIERS[tier]
  if (!T.effects) return null
  // DOF only in the hall, only on capable devices.
  if (T.dof && route === 'hall') return <HallComposer />
  return (
    <EffectComposer multisampling={tier === 'high' ? 4 : 2} enableNormalPass={false}>
      <Bloom mipmapBlur luminanceThreshold={0.62} luminanceSmoothing={0.25} intensity={0.8} radius={0.72} />
      <Vignette offset={0.24} darkness={0.92} />
    </EffectComposer>
  )
}

function HallComposer() {
  const tier = useStore((s) => s.tier)
  const dof = useRef()
  const scale = useRef(0)
  useFrame((_, dtRaw) => {
    const e = dof.current
    if (!e) return
    const dt = Math.min(dtRaw, 0.1)
    scale.current += ((rig.focusOn ? 2.4 : 0.6) - scale.current) * k(3, dt)
    e.bokehScale = scale.current
    if (e.target) e.target.copy(rig.focus)
  })
  return (
    <EffectComposer multisampling={tier === 'high' ? 4 : 2} enableNormalPass={false}>
      <DepthOfField ref={dof} target={[0, 0, -500]} worldFocusRange={7} bokehScale={1} />
      <Bloom mipmapBlur luminanceThreshold={0.62} luminanceSmoothing={0.25} intensity={0.75} radius={0.72} />
      <Vignette offset={0.24} darkness={0.9} />
    </EffectComposer>
  )
}
