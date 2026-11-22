import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MeshReflectorMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../lib/store'
import { live, kick } from '../lib/live'
import { TIERS } from '../lib/quality'
import { companies, HALL_EXTENT } from '../data/companies'
import { rig } from './rig'
import { applySurface, loadPieces } from './assets'
import { clamp, ease, k, lerp, makePlateTexture, makeRadialTexture, toScreen } from './util'

export const HALL_ORIGIN = new THREE.Vector3(0, 0, -500)
const PILLAR_SIZE = 0.75 // overall pillar scale
const PILLAR_W = 1.5 * PILLAR_SIZE
const hOf = (c) => c.height * PILLAR_SIZE

/* ================================================================
 * THE ANALYTICS HALL — a minimal, architectural gallery.
 * One monolith per company, asymmetrical, different heights,
 * selective light, floor reflections, soft contact shadows, fog
 * for atmospheric depth and depth-of-field (high tier) on focus.
 * ================================================================ */
export default function HallWorld() {
  const route = useStore((s) => s.route)
  const tier = useStore((s) => s.tier)
  const visible = route === 'hall'
  const T = TIERS[tier]

  const shared = useMemo(() => ({
    box: new THREE.BoxGeometry(1, 1, 1),
    plane: new THREE.PlaneGeometry(1, 1),
    stone: applySurface(new THREE.MeshStandardMaterial({ color: '#2e2b29', roughness: 0.45, metalness: 0.25, envMapIntensity: 0.55 }),
      { scale: 0.9, bump: 0.01, roughMin: 0.32, roughMax: 0.55, tone: 0.14, bias: 2.0, key: 'pillar' }),
    shadowTex: makeRadialTexture('rgba(0,0,0,0.9)', 'rgba(0,0,0,0)'),
    poolTex: makeRadialTexture('rgba(255,190,140,0.55)', 'rgba(255,190,140,0)'),
  }), [])
  useEffect(() => () => {
    shared.box.dispose(); shared.plane.dispose(); shared.stone.dispose()
    shared.shadowTex.dispose(); shared.poolTex.dispose()
  }, [shared])

  const { size } = useThree()
  // Blender-made bevelled monolith replaces the plain box once loaded
  const [pillarGeo, setPillarGeo] = useState(null)
  useEffect(() => {
    let alive = true
    loadPieces().then((p) => { if (alive) { setPillarGeo(p.slab_bevel); kick(600) } }).catch(() => {})
    return () => { alive = false }
  }, [])

  useFrame((st, dtRaw) => {
    if (!visible) return
    const dt = Math.min(dtRaw, 0.1)
    const P = live.pointer
    const s = useStore.getState()
    const hovered = s.hallHovered
    const entering = live.hall.entering
    const t = live.hall.t
    const camX = lerp(HALL_EXTENT.minX + 3.5, HALL_EXTENT.maxX - 3.5, t)

    // camera path: a slow lateral track through the gallery
    const O = HALL_ORIGIN
    const aspect = size.width / size.height
    const back = aspect < 1.2 ? (1.2 / aspect - 1) * 9 : 0 // portrait screens: step back to keep several pillars in view
    rig.cam.pos.set(O.x + camX + P.x * 0.7, 3.7 + back * 0.25 + P.y * 0.35, O.z + 14.5 + back)
    rig.cam.look.set(O.x + camX, 2.7, O.z - 5)
    rig.cam.lambda = 2.6
    const focusId = entering || hovered || s.hallSelected || 'nvidia'
    const fc = companies.find((c) => c.id === focusId)
    if (hovered && !entering) {
      rig.cam.look.x = lerp(rig.cam.look.x, O.x + fc.slot[0], 0.25)
    }
    if (entering) {
      const e = ease(clamp((performance.now() - live.hall.enterStart) / 900))
      rig.cam.pos.lerp(new THREE.Vector3(O.x + fc.slot[0], hOf(fc) * 0.8, O.z + fc.slot[1] + 4.2), e)
      rig.cam.look.lerp(new THREE.Vector3(O.x + fc.slot[0], hOf(fc) * 0.85, O.z + fc.slot[1] - 2), e)
      rig.cam.lambda = 4.5
    }
    rig.fog.near = 14; rig.fog.far = 42

    // selective light on the focused company
    const L = rig.light
    L.keyColor.set('#d9d4cc'); L.rimColor.set('#9aa6c4')
    L.ambient = 0.55; L.key = 1.3; L.keyPos.set(O.x + camX - 10, 14, O.z + 10)
    L.rim = 1.4; L.rimPos.set(O.x + camX, 6, O.z - 20)
    L.spot = hovered || entering ? 140 : 95
    L.spotColor.set(hovered || entering ? '#ffe2c8' : '#ffc89e')
    L.spotPos.set(O.x + fc.slot[0] + 1.5, hOf(fc) + 7, O.z + fc.slot[1] + 4)
    L.spotTarget.set(O.x + fc.slot[0], hOf(fc) * 0.5, O.z + fc.slot[1])
    L.point = 0; L.pointPos.set(O.x, -50, O.z)

    rig.focus.set(O.x + fc.slot[0], hOf(fc) * 0.6, O.z + fc.slot[1])
    rig.focusOn = !!(hovered || entering)

    // hover card anchor (DOM reads this — no React re-render while moving)
    if (hovered) {
      const p = toScreen(new THREE.Vector3(O.x + fc.slot[0] + PILLAR_W * 0.9, hOf(fc) * 0.75, O.z + fc.slot[1]), st.camera, size)
      live.hall.card = p
    }
    void dt
  })

  return (
    <group position={HALL_ORIGIN} visible={visible}>
      {/* floor: reflective on capable devices, plain stone otherwise */}
      <mesh rotation-x={-Math.PI / 2} position={[6, 0, -6]} receiveShadow>
        <planeGeometry args={[90, 60]} />
        {T.reflector && visible ? (
          <MeshReflectorMaterial
            blur={[300, 80]}
            resolution={tier === 'high' ? 1024 : 512}
            mixBlur={1}
            mixStrength={1.6}
            roughness={0.9}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#0b0b0d"
            metalness={0.55}
            mirror={0.5}
          />
        ) : (
          <meshStandardMaterial color="#0b0b0d" roughness={0.7} metalness={0.4} />
        )}
      </mesh>
      {/* a back wall plane that catches the rim light — gives depth without a "museum" */}
      <mesh position={[6, 9, -22]}>
        <planeGeometry args={[90, 22]} />
        <meshStandardMaterial color="#08080a" roughness={1} />
      </mesh>
      {companies.map((c, i) => (
        <Pillar key={c.id} c={c} index={i} shared={shared} geo={pillarGeo || shared.box} visible={visible} shadows={TIERS[useStore.getState().baseTier].shadows} />
      ))}
    </group>
  )
}

function Pillar({ c, index, shared, geo, visible, shadows }) {
  const group = useRef(), body = useRef(), cap = useRef(), plate = useRef(), shadow = useRef(), pool = useRef()
  const plateTex = useMemo(() => makePlateTexture(c, () => kick(300)), [c])
  const mats = useMemo(() => ({
    plate: new THREE.MeshBasicMaterial({ map: plateTex, transparent: true, toneMapped: false, depthWrite: false, opacity: 0.8 }),
    cap: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 1.1, 0.6), toneMapped: false }),
    shadow: new THREE.MeshBasicMaterial({ map: shared.shadowTex, transparent: true, depthWrite: false, opacity: 0.8 }),
    pool: new THREE.MeshBasicMaterial({ map: shared.poolTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }),
  }), [plateTex, shared])
  useEffect(() => () => { plateTex.dispose(); Object.values(mats).forEach((m) => m.dispose()) }, [plateTex, mats])

  const anim = useRef({ fwd: 0, sink: 0, glow: c.featured ? 0.6 : 0.25, op: 0.8 })
  const [x, z] = c.slot
  const h = hOf(c)

  useFrame((st, dtRaw) => {
    if (!visible) return
    const dt = Math.min(dtRaw, 0.1)
    const s = useStore.getState()
    const hovered = s.hallHovered
    const entering = live.hall.entering
    const isHover = hovered === c.id
    const isFocus = entering === c.id || isHover
    const a = anim.current
    const snap = performance.now() < live.snapUntil
    const f = snap ? 1 : k(5, dt)

    const fwdT = entering === c.id ? 1.1 : isHover ? 0.7 : 0
    const sinkT = entering && entering !== c.id ? 1.6 : 0
    const glowT = isFocus ? 1.4 : c.featured || s.hallSelected === c.id ? 0.7 : 0.28
    // never fade labels below readable levels
    const opT = entering && entering !== c.id ? 0.25 : isFocus ? 1 : hovered ? 0.62 : c.featured ? 0.95 : 0.8

    a.fwd += (fwdT - a.fwd) * f
    a.sink += (sinkT - a.sink) * f
    a.glow += (glowT - a.glow) * f
    a.op += (opT - a.op) * f

    group.current.position.set(x, -a.sink, z + a.fwd)
    cap.current.material.color.setRGB(1.8 * a.glow, 1.1 * a.glow, 0.6 * a.glow)
    plate.current.material.opacity = a.op
    pool.current.material.opacity = clamp((a.glow - 0.3) * 0.5, 0, 0.5)
    // the name plate turns gently toward the viewer
    const camLocalX = st.camera.position.x - (HALL_ORIGIN.x + x)
    const camLocalZ = st.camera.position.z - (HALL_ORIGIN.z + z)
    plate.current.rotation.y = Math.atan2(camLocalX, camLocalZ) * 0.6
    const bob = live.reducedMotion ? 0 : Math.sin(st.clock.elapsedTime * 0.8 + index) * 0.04
    plate.current.position.y = h + 0.85 + bob
  })

  const activate = (e) => {
    e.stopPropagation()
    // touch: first tap focuses (shows the description), second tap enters
    const touch = e.nativeEvent?.pointerType === 'touch' || e.pointerType === 'touch'
    if (touch && useStore.getState().hallHovered !== c.id) {
      useStore.getState().setHallHovered(c.id)
      kick(1500)
      return
    }
    useStore.getState().hallActivate?.(c.id)
  }
  const over = (e) => {
    e.stopPropagation()
    if (live.hall.entering) return
    useStore.getState().setHallHovered(c.id)
    document.body.style.cursor = 'pointer'
    kick(1500)
  }
  const out = () => {
    if (useStore.getState().hallHovered === c.id) useStore.getState().setHallHovered(null)
    document.body.style.cursor = ''
    kick(1200)
  }

  return (
    <group ref={group} position={[x, 0, z]}>
      <mesh ref={body} geometry={geo} material={shared.stone} position={[0, h / 2, 0]} scale={[PILLAR_W, h, PILLAR_W]}
        castShadow={shadows} receiveShadow={shadows} onPointerOver={over} onPointerOut={out} onClick={activate} />
      {/* luminous cap — the pillar's "selective illumination" */}
      <mesh ref={cap} geometry={shared.box} material={mats.cap} position={[0, h + 0.015, 0]} scale={[PILLAR_W + 0.02, 0.03, PILLAR_W + 0.02]} />
      {/* logo / name plate integrated as a floating 3D plane */}
      <mesh ref={plate} geometry={shared.plane} material={mats.plate} position={[0, h + 0.85, 0]} scale={[2.2, 0.94, 1]}
        onPointerOver={over} onPointerOut={out} onClick={activate} />
      {/* soft contact shadow + warm light pool */}
      <mesh ref={shadow} geometry={shared.plane} material={mats.shadow} rotation-x={-Math.PI / 2} position={[0.2, 0.01, 0.28]} scale={[3.2, 3.2, 1]} />
      <mesh ref={pool} geometry={shared.plane} material={mats.pool} rotation-x={-Math.PI / 2} position={[0, 0.02, 0.9]} scale={[3.8, 3.8, 1]} />
    </group>
  )
}
