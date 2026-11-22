import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { applySurface, loadPieces, loadShard } from './assets'
import { useStore } from '../lib/store'
import { live, kick } from '../lib/live'
import { rig } from './rig'
import { clamp, ease, k, lerp, mulberry32, sampleKeys, smooth } from './util'

/* ================================================================
 * STORY WORLD
 *  - an irregular architectural environment (instanced slabs) that
 *    re-composes itself per chapter
 *  - the fragmented core: shards that emerge FROM the environment,
 *    assemble, and then travel with the story as a recurring guide
 * Everything is a pure function of scroll position (live.story.c),
 * so restoring the scroll restores the object's state.
 * ================================================================ */

const N = 144 // shards
const N_GLOW = 24 // last N_GLOW shards are emissive
const N_ACCENT = 16
const LAYOUTS = 8

// ---------- camera keyframes (c = chapter index + fraction) ----------
const CAM = [
  { c: 0, x: 0, y: 0, z: 12, lx: 0, ly: 0, lz: 0 },
  { c: 1, x: -0.8, y: 0.4, z: 11.5, lx: 0.5, ly: 0, lz: 0 },
  { c: 2, x: 0, y: 0.6, z: 12.5, lx: 0, ly: 0, lz: -1 },
  { c: 3, x: 0.8, y: -0.2, z: 11.5, lx: -0.5, ly: 0, lz: 0 },
  { c: 4.3, x: 0, y: 0.25, z: 10.5, lx: 0, ly: 0.3, lz: 0 },
  { c: 5, x: 0, y: 0.5, z: 12, lx: 0, ly: 0, lz: 0 },
  { c: 6, x: -1, y: 0.6, z: 11.5, lx: 0, ly: 0, lz: 0 },
  { c: 7, x: 0, y: 0.3, z: 12, lx: 0, ly: 0, lz: 0 },
  { c: 8, x: 0, y: 0.3, z: 12, lx: 0, ly: 0, lz: 0 },
]

// ---------- core keyframes ----------
const SHAPES = ['scatter', 'sphere', 'lattice', 'ring', 'cursor']
const S = Object.fromEntries(SHAPES.map((s, i) => [s, i]))
const CORE = [
  { c: 0.0, shape: S.scatter, x: 0, y: 0, z: 0, s: 1 },
  { c: 0.24, shape: S.scatter, x: 0, y: 0, z: 0, s: 1 },
  { c: 0.62, shape: S.sphere, x: 0, y: 0.1, z: 0, s: 0.39 },
  { c: 0.92, shape: S.sphere, x: 3.4, y: 0.6, z: 0, s: 0.3 },
  { c: 1.25, shape: S.sphere, x: 3.5, y: 1.1, z: 0, s: 0.275 },
  { c: 1.85, shape: S.sphere, x: 3.5, y: -1.3, z: 0, s: 0.275 },
  { c: 2.15, shape: S.sphere, x: 0, y: -2.3, z: 0.5, s: 0.18 },
  { c: 2.85, shape: S.sphere, x: 0, y: -2.3, z: 0.5, s: 0.18 },
  { c: 3.2, shape: S.lattice, x: -3.6, y: 0.2, z: 0, s: 0.7 },
  { c: 3.85, shape: S.lattice, x: -3.6, y: -0.4, z: 0, s: 0.7 },
  { c: 4.25, shape: S.ring, x: 0, y: 0.35, z: 0, s: 1.25 },
  { c: 4.8, shape: S.ring, x: 0, y: 0.35, z: 0, s: 1.25 },
  { c: 5.2, shape: S.sphere, x: -3.4, y: 0, z: 0, s: 0.28 },
  { c: 5.85, shape: S.sphere, x: -3.4, y: 0, z: 0, s: 0.28 },
  { c: 6.2, shape: S.cursor, x: 4.6, y: -1.8, z: -1, s: 0.55 },
  { c: 6.9, shape: S.cursor, x: 4.6, y: -1.8, z: -1, s: 0.55 },
  { c: 7.3, shape: S.cursor, x: 5.4, y: 1.0, z: 0, s: 0.5 },
  { c: 8.0, shape: S.cursor, x: 5.4, y: 1.0, z: 0, s: 0.5 },
]
const SPIN = [0, 1, 0.45, 0.25, 0] // per shape
// shard i takes shape slot PERM[i] so the emissive shards are spread out, not bunched
const PERM = Array.from({ length: N }, (_, i) => (i * 37) % N)

// ---------------------------------------------------------------
// Environment layouts — one composition per chapter
// ---------------------------------------------------------------
function buildEnvironment(count) {
  const layouts = []
  const e = new THREE.Euler()
  const q = new THREE.Quaternion()
  for (let L = 0; L < LAYOUTS; L++) {
    const r = mulberry32(1000 + L * 97)
    const pos = new Float32Array(count * 3)
    const quat = new Float32Array(count * 4)
    const scl = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      let p = [0, 0, 0], rot = [0, 0, 0], s = [1, 1, 1]
      switch (L) {
        case 0: { // ORIGIN — dark irregular cavern of broken planes
          const a = r() * Math.PI * 2
          const fg = i % 7 === 0
          const rad = fg ? 6.5 + r() * 2 : 4.8 + r() * 7
          p = [Math.cos(a) * rad * 1.35, Math.sin(a) * rad * 0.8, fg ? 2.5 + r() * 2 : -2 - r() * 16]
          rot = [(r() - 0.5) * 1.2, (r() - 0.5) * 1.2, (r() - 0.5) * 1.4]
          const t = i % 3
          s = t === 0 ? [0.18 + r() * 0.3, 2 + r() * 4.5, 1.2 + r() * 2.4] : t === 1 ? [0.25 + r() * 0.4, 0.25 + r() * 0.4, 3 + r() * 4] : [0.8 + r() * 1.3, 0.8 + r() * 1.7, 0.8 + r() * 1.2]
          break
        }
        case 1: { // FOUNDATION — stepped terraces (a built base) + distant fins
          if (i % 3 !== 0) {
            p = [0.5 + r() * 8, 2.8 - (i % 6) * 1.1 + r() * 0.3, -2 - r() * 9]
            rot = [0, r() * 0.5 - 0.25, 0]
            s = [1.5 + r() * 3, 0.08 + r() * 0.1, 1 + r() * 2.5]
          } else {
            p = [-6 - r() * 6, r() * 6 - 3, -6 - r() * 10]
            rot = [0, r(), r() * 0.2]
            s = [0.15 + r() * 0.3, 3 + r() * 5, 1 + r() * 2]
          }
          break
        }
        case 2: { // EXPLORATION — three floating islands (skill clusters)
          const C = [[-4.6, 1.6, -3], [0.3, -1.4, -5], [4.8, 1.4, -3.5]]
          if (i % 4 === 3) {
            p = [r() * 28 - 14, r() * 14 - 7, -10 - r() * 12]
            s = [0.2 + r() * 0.5, 0.2 + r() * 0.5, 0.2 + r() * 0.5]
          } else {
            const c = C[i % 3]
            const u = r() * Math.PI * 2, v = Math.acos(2 * r() - 1), d = 0.6 + r() * 1.6
            p = [c[0] + Math.sin(v) * Math.cos(u) * d * 1.3, c[1] + Math.cos(v) * d * 0.8, c[2] + Math.sin(v) * Math.sin(u) * d]
            s = [0.25 + r() * 0.8, 0.15 + r() * 0.5, 0.25 + r() * 0.8]
          }
          rot = [r() * 3, r() * 3, r() * 3]
          break
        }
        case 3: { // BUILDING — scaffolding of columns and beams
          const col = i % 9, row = Math.floor(i / 9) % 4
          if (i % 2 === 0) {
            const h = 3 + r() * 5
            p = [-8 + col * 2 + r() * 0.3, -3 + h / 2, -3 - row * 3.5]
            s = [0.22, h, 0.22]
          } else {
            p = [-8 + col * 2 + 1, -3 + r() * 6, -3 - row * 3.5]
            rot = [0, r() > 0.5 ? Math.PI / 2 : 0, 0]
            s = [2 + r() * 1.6, 0.12, 0.12]
          }
          break
        }
        case 4: { // PORTAL — a corridor receding behind the ring
          const side = i % 2 ? 1 : -1
          const kk = Math.floor(i / 2)
          const z = 4 - kk * (40 / (count / 2))
          if (i % 6 < 4) {
            p = [side * (3.4 + r() * 1.6), r() * 4 - 2, z]
            rot = [0, side * 0.15, r() * 0.2 - 0.1]
            s = [0.2, 2 + r() * 4, 1 + r() * 2]
          } else {
            p = [r() * 6 - 3, i % 2 ? 4.2 : -3.6, z]
            s = [2 + r() * 3, 0.14, 1 + r() * 1.5]
          }
          break
        }
        case 5: { // CONTINUATION — open horizon, distant monoliths
          if (i % 8 === 0) {
            p = [r() * 24 - 12, 0, -18 - r() * 8]
            s = [0.8, 6 + r() * 6, 0.8]
          } else {
            p = [r() * 30 - 15, -3 - r() * 0.4, -r() * 25 + 2]
            rot = [r() * 0.08, r() * Math.PI, r() * 0.08]
            s = [1 + r() * 3, 0.1, 1 + r() * 3]
          }
          break
        }
        case 6: { // DEVELOPER ENGINE — floor grid + monitor-like back panels
          if (i % 5 !== 0) {
            p = [-8 + (i % 9) * 2, -3.2, -1 - Math.floor(i / 9) * 2]
            s = [1.86, 0.08, 1.86]
          } else {
            p = [r() * 16 - 8, r() * 4 - 1, -9 - r() * 4]
            rot = [0, r() * 0.4 - 0.2, 0]
            s = [2 + r() * 3, 1.2 + r() * 2, 0.08]
          }
          break
        }
        default: { // ENDING — everything settles
          p = [r() * 26 - 13, -3.4 - r() * 0.2, -r() * 22 + 1]
          rot = [0, r() * Math.PI, 0]
          s = [0.6 + r() * 2.4, 0.08, 0.6 + r() * 2.4]
        }
      }
      pos.set(p, i * 3)
      q.setFromEuler(e.set(rot[0], rot[1], rot[2]))
      quat.set([q.x, q.y, q.z, q.w], i * 4)
      scl.set(s, i * 3)
    }
    layouts.push({ pos, quat, scl })
  }
  return layouts
}

// ---------------------------------------------------------------
// Core shapes — every shard has a target in each shape
// ---------------------------------------------------------------
function buildShapes(env, count) {
  const r = mulberry32(7)
  const make = () => ({ pos: new Float32Array(N * 3), quat: new Float32Array(N * 4), scl: new Float32Array(N * 3) })
  const shapes = SHAPES.map(make)
  const q = new THREE.Quaternion(), e = new THREE.Euler(), up = new THREE.Vector3(0, 1, 0), n = new THREE.Vector3()
  const golden = Math.PI * (3 - Math.sqrt(5))
  const L0 = env[0]
  for (let i = 0; i < N; i++) {
    const shard = [0.12 + r() * 0.16, 0.05 + r() * 0.06, 0.1 + r() * 0.14]
    // scatter: chips living inside the environment slabs (the core is made FROM the environment)
    {
      const j = (i * 7) % count
      const sx = L0.scl[j * 3], sy = L0.scl[j * 3 + 1], sz = L0.scl[j * 3 + 2]
      const p = [L0.pos[j * 3] + (r() - 0.5) * sx, L0.pos[j * 3 + 1] + (r() - 0.5) * sy, L0.pos[j * 3 + 2] + (r() - 0.5) * sz]
      q.setFromEuler(e.set(r() * 6, r() * 6, r() * 6))
      shapes[S.scatter].pos.set(p, i * 3)
      shapes[S.scatter].quat.set([q.x, q.y, q.z, q.w], i * 4)
      shapes[S.scatter].scl.set(shard.map((v) => v * 1.4), i * 3)
    }
    // sphere: fragmented shell + inner seeds
    {
      const inner = i >= 112
      const m = inner ? N - 112 : 112, idx = inner ? i - 112 : i
      const y = 1 - (idx / (m - 1)) * 2
      const rad = Math.sqrt(1 - y * y)
      const th = golden * idx
      const R = (inner ? 0.5 : 1.15) + (r() - 0.5) * 0.08
      n.set(Math.cos(th) * rad, y, Math.sin(th) * rad).normalize()
      shapes[S.sphere].pos.set([n.x * R, n.y * R, n.z * R], i * 3)
      q.setFromUnitVectors(up, n)
      shapes[S.sphere].quat.set([q.x, q.y, q.z, q.w], i * 4)
      shapes[S.sphere].scl.set(inner ? shard.map((v) => v * 0.8) : [shard[0] * 1.3, shard[1], shard[2] * 1.3], i * 3)
    }
    // lattice: a 6×6×4 crystal block (building)
    {
      const ix = i % 6, iy = Math.floor(i / 6) % 6, iz = Math.floor(i / 36)
      shapes[S.lattice].pos.set([(ix - 2.5) * 0.4, (iy - 2.5) * 0.4, (iz - 1.5) * 0.4], i * 3)
      q.setFromEuler(e.set(0, Math.PI / 4, 0))
      shapes[S.lattice].quat.set([q.x, q.y, q.z, q.w], i * 4)
      shapes[S.lattice].scl.set([0.13, 0.13, 0.13], i * 3)
    }
    // ring: the portal
    {
      const a = (i / N) * Math.PI * 2
      const R = 2.2 + (r() - 0.5) * 0.28
      shapes[S.ring].pos.set([Math.cos(a) * R, Math.sin(a) * R, (r() - 0.5) * 0.35], i * 3)
      q.setFromEuler(e.set(0, 0, a + Math.PI / 2))
      shapes[S.ring].quat.set([q.x, q.y, q.z, q.w], i * 4)
      shapes[S.ring].scl.set([0.2, 0.05, 0.1], i * 3)
    }
    // cursor: a terminal block cursor
    {
      const ix = i % 8, iy = Math.floor(i / 8)
      shapes[S.cursor].pos.set([(ix - 3.5) * 0.14, (iy - 8.5) * 0.14, 0], i * 3)
      q.set(0, 0, 0, 1)
      shapes[S.cursor].quat.set([0, 0, 0, 1], i * 4)
      shapes[S.cursor].scl.set([0.075, 0.075, 0.075], i * 3)
    }
  }
  return shapes
}

const _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _s = new THREE.Vector3()
const _local = new THREE.Matrix4().compose(new THREE.Vector3(0, 0.5, 0.5), new THREE.Quaternion(), new THREE.Vector3(1.002, 0.018, 0.03))
const _acc = new THREE.Matrix4()
const _target = new THREE.Vector3()

export default function StoryWorld({ envCount }) {
  const route = useStore((s) => s.route)
  const visible = route === 'story' || route === 'project'

  const env = useMemo(() => buildEnvironment(envCount), [envCount])
  const shapes = useMemo(() => buildShapes(env, envCount), [env, envCount])
  const envRefs = [useRef(), useRef(), useRef(), useRef()], accRef = useRef(), coreRef = useRef(), glowRef = useRef(), coreGroup = useRef()
  const state = useRef({ x: 0, y: 0, z: 0, s: 1, rotY: 0, rotZ: 0, solid: 0, blend: 0, shapeA: 0, shapeB: 0, cur: null })

  const geos = useMemo(() => ({
    box: new THREE.BoxGeometry(1, 1, 1),
    // softened architecture: bevelled slabs read as one material with the core
    slab: new RoundedBoxGeometry(1, 1, 1, 3, 0.14),
    shard: new THREE.OctahedronGeometry(1, 0),
    // the assembled core: a complete, high-resolution solid
    solid: new THREE.SphereGeometry(1.16, 160, 120),
    // a thin orbit ring around the solid core
    seams: new THREE.TorusGeometry(1.62, 0.006, 8, 320),
  }), [])
  const mats = useMemo(() => ({
    // Blender-baked surface (triplanar): fractured-stone height, roughness and tone at 2048²
    env: applySurface(new THREE.MeshStandardMaterial({ color: '#2a2624', roughness: 0.5, metalness: 0.45, envMapIntensity: 0.7 }),
      { scale: 0.4, bump: 0.02, roughMin: 0.42, roughMax: 0.78, tone: 0.4, bias: 1.8, key: 'env' }),
    accent: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 0.9, 0.45), toneMapped: false }),
    core: applySurface(new THREE.MeshPhysicalMaterial({ color: '#e2d9cc', roughness: 0.22, metalness: 0.9, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1.3 }),
      { scale: 1.6, bump: 0.008, roughMin: 0.2, roughMax: 0.38, tone: 0.15, bias: 2.0, key: 'shard' }),
    glow: new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.25, 0.55), toneMapped: false }),
    // the complete core stays a clean, polished solid (160×120 segment sphere)
    solid: new THREE.MeshPhysicalMaterial({
      color: '#d8cbb8', metalness: 0.55, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.04,
      sheen: 0.4, sheenColor: new THREE.Color('#ffb070'), envMapIntensity: 1.25, transparent: true, opacity: 0,
    }),
    seams: new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.2, 0.5), toneMapped: false, transparent: true, opacity: 0, depthWrite: false }),
  }), [])
  const solidRef = useRef(), seamRef = useRef()

  // swap the placeholder geometry for the Blender pieces as soon as they load
  useEffect(() => {
    let alive = true
    loadPieces().then((p) => {
      if (!alive) return
      const variants = [p.slab_bevel, p.slab_chipped, p.slab_stepped, p.slab_split]
      envRefs.forEach((r, v) => { if (r.current && variants[v]) r.current.geometry = variants[v] })
      kick(600)
    }).catch(() => {})
    loadShard().then((g) => {
      if (!alive || !g) return
      coreRef.current.geometry = g
      glowRef.current.geometry = g
      kick(600)
    }).catch(() => {})
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // per-shard current transforms (damped) — keeps motion continuous even when scroll jumps
  const cur = useMemo(() => ({ pos: new Float32Array(N * 3), quat: new Float32Array(N * 4), init: false }), [])

  // GPU resource disposal when the world is ever unmounted
  useEffect(() => () => {
    Object.values(geos).forEach((g) => g.dispose())
    Object.values(mats).forEach((m) => m.dispose())
  }, [geos, mats])

  useLayoutEffect(() => {
    if (!live.story.introStart) live.story.introStart = performance.now()
  }, [])

  useFrame((st, dtRaw) => {
    if (!visible) return
    const dt = Math.min(dtRaw, 0.1)
    const now = performance.now()
    const snap = now < live.snapUntil
    const t = st.clock.elapsedTime
    const c = clamp(live.story.c, 0, 8)
    const P = live.pointer
    const reduced = live.reducedMotion

    // --- intro emergence (time based, first load only)
    if (live.story.intro < 1) {
      live.story.intro = reduced ? 1 : clamp((now - live.story.introStart) / 4200)
    }
    const intro = ease(live.story.intro)

    // --- portal dive
    live.story.dive += (live.story.diveTarget - live.story.dive) * (snap ? 1 : k(2.4, dt))
    const dive = live.story.dive

    // --- camera target
    const cam = sampleKeys(CAM, c, ['x', 'y', 'z', 'lx', 'ly', 'lz'])
    rig.cam.pos.set(cam.x + P.x * 0.35, cam.y + P.y * 0.22, cam.z)
    rig.cam.look.set(cam.lx, cam.ly, cam.lz)
    rig.cam.lambda = 3.2
    if (dive > 0.001) {
      rig.cam.pos.lerp(_target.set(0, 0.35, -2.5), ease(dive))
      rig.cam.look.lerp(_target.set(0, 0.35, -12), ease(dive))
      rig.cam.lambda = 5
    }
    rig.fog.near = 9; rig.fog.far = 36

    // --- environment layout blend
    const ec = clamp(c - 0.5, 0, LAYOUTS - 1)
    const i0 = Math.floor(ec), i1 = Math.min(LAYOUTS - 1, i0 + 1)
    const f = smooth((ec - i0 - 0.15) / 0.7)
    const A = env[i0], B = env[i1]
    const per = Math.ceil(envCount / 4)
    for (let i = 0; i < envCount; i++) {
      const i3 = i * 3, i4 = i * 4
      const drift = reduced ? 0 : Math.sin(t * 0.25 + i) * 0.05
      _p.set(lerp(A.pos[i3], B.pos[i3], f), lerp(A.pos[i3 + 1], B.pos[i3 + 1], f) + drift, lerp(A.pos[i3 + 2], B.pos[i3 + 2], f))
      _q.set(A.quat[i4], A.quat[i4 + 1], A.quat[i4 + 2], A.quat[i4 + 3])
      _q2.set(B.quat[i4], B.quat[i4 + 1], B.quat[i4 + 2], B.quat[i4 + 3])
      _q.slerp(_q2, f)
      _s.set(lerp(A.scl[i3], B.scl[i3], f), lerp(A.scl[i3 + 1], B.scl[i3 + 1], f), lerp(A.scl[i3 + 2], B.scl[i3 + 2], f))
      _m.compose(_p, _q, _s)
      envRefs[i % 4].current.setMatrixAt(Math.floor(i / 4), _m)
      // accent light strips ride along the top edge of every Nth slab
      if (i % Math.floor(envCount / N_ACCENT) === 0) {
        const a = i / Math.floor(envCount / N_ACCENT)
        if (a < N_ACCENT) {
          _acc.multiplyMatrices(_m, _local)
          // strips ignite progressively during the intro
          if (intro < (a + 1) / N_ACCENT) _acc.scale(_s.set(0, 0, 0))
          accRef.current.setMatrixAt(a, _acc)
        }
      }
    }
    envRefs.forEach((r) => { r.current.instanceMatrix.needsUpdate = true })
    void per
    accRef.current.instanceMatrix.needsUpdate = true

    // --- core keyframes
    const kf = sampleKeys(CORE, c, ['x', 'y', 'z', 's'])
    let shapeA = kf.a.shape, shapeB = kf.b.shape, blend = kf.f
    // first chapter: the core emerges over time, scroll completes the assembly
    if (c < 0.62) {
      shapeA = S.scatter; shapeB = S.sphere
      const scrollBlend = smooth((c - 0.24) / (0.62 - 0.24))
      blend = Math.max(scrollBlend, intro * 0.78)
    }
    let tx = kf.x, ty = kf.y, tz = kf.z, ts = kf.s
    // narrow screens: pull the object toward the centre
    const aspect = st.size.width / st.size.height
    const squeeze = clamp(aspect / 1.6, 0.35, 1)
    tx *= squeeze
    const portrait = aspect < 1
    if (portrait && c > 0.62) { ts *= 0.6; tz -= 2 }
    mats.glow.color.setRGB(2.4, 1.25, 0.55).multiplyScalar(portrait ? 0.45 : 1)

    // exploration: the core is drawn toward the hovered / active skill cluster
    const w = smooth((c - 2.05) / 0.15) * (1 - smooth((c - 2.85) / 0.15))
    if (w > 0 && live.story.attractor) {
      const halfH = Math.tan((st.camera.fov * Math.PI) / 360) * st.camera.position.z
      const ax = live.story.attractor.x * halfH * aspect
      const ay = live.story.attractor.y * halfH
      tx = lerp(tx, ax * 1.25, w); ty = lerp(ty, ay * 1.25, w); tz = lerp(tz, -3.2, w); ts = lerp(ts, 0.15, w)
    }

    const g = state.current
    const fk = snap ? 1 : k(2.2, dt)
    g.x += (tx - g.x) * fk; g.y += (ty - g.y) * fk; g.z += (tz - g.z) * fk; g.s += (ts - g.s) * fk
    const spinW = lerp(SPIN[shapeA], SPIN[shapeB], blend)
    if (!reduced) g.rotY += dt * 0.32 * spinW
    if (spinW < 0.5) {
      const tgt = Math.round(g.rotY / (Math.PI * 2)) * Math.PI * 2
      g.rotY += (tgt - g.rotY) * k(3 * (1 - spinW), dt)
    }
    // ring turns slowly in its own plane
    const ringW = (shapeA === S.ring ? 1 - blend : 0) + (shapeB === S.ring ? blend : 0)
    if (!reduced) g.rotZ += dt * 0.12 * ringW

    const grp = coreGroup.current
    grp.position.set(g.x, g.y + (reduced ? 0 : Math.sin(t * 0.6) * 0.05), g.z)
    grp.scale.setScalar(g.s * (1 + dive * 1.6))
    grp.rotation.set(0, g.rotY, g.rotZ)

    // --- shards
    const SA = shapes[shapeA], SB = shapes[shapeB]
    const organic = (shapeA === S.sphere || shapeA === S.scatter ? 1 - blend : 0) + (shapeB === S.sphere || shapeB === S.scatter ? blend : 0)
    // when fully assembled into a sphere, the shards fuse into one complete solid
    const sphereW = (shapeA === S.sphere ? 1 - blend : 0) + (shapeB === S.sphere ? blend : 0)
    const solidT = smooth((sphereW - 0.8) / 0.2) * (1 - dive)
    g.solid += (solidT - g.solid) * (snap ? 1 : k(3.5, dt))
    const fuse = 1 - smooth((g.solid - 0.35) / 0.6)
    // once fully fused, hide the shards entirely (no stray specks, fewer draw calls)
    coreRef.current.visible = glowRef.current.visible = fuse > 0.002
    mats.solid.opacity = g.solid
    solidRef.current.visible = g.solid > 0.01
    solidRef.current.scale.setScalar(0.965 + 0.035 * g.solid)
    seamRef.current.visible = g.solid > 0.01
    mats.seams.opacity = g.solid * 0.7
    seamRef.current.rotation.z = reduced ? 0.2 : t * 0.15
    const blink = (shapeA === S.cursor && shapeB === S.cursor && c > 7.2) ? (Math.sin(t * 3.2) > 0 ? 1 : 0.35) : 1
    const sk = snap || !cur.init ? 1 : k(4.5, dt)
    for (let i = 0; i < N; i++) {
      const j = PERM[i]
      const i3 = j * 3, i4 = j * 4, c3 = i * 3
      const wob = reduced ? 0 : organic * 0.035
      const px = lerp(SA.pos[i3], SB.pos[i3], blend) + Math.sin(t * 0.9 + j * 1.3) * wob
      const py = lerp(SA.pos[i3 + 1], SB.pos[i3 + 1], blend) + Math.cos(t * 0.7 + j) * wob
      const pz = lerp(SA.pos[i3 + 2], SB.pos[i3 + 2], blend)
      // (scatter targets are world positions; at c≈0 the group sits at the origin with scale 1,
      //  so local == world and the shards appear to peel off the surrounding slabs)
      cur.pos[c3] += (px - cur.pos[c3]) * sk
      cur.pos[c3 + 1] += (py - cur.pos[c3 + 1]) * sk
      cur.pos[c3 + 2] += (pz - cur.pos[c3 + 2]) * sk
      _q.set(SA.quat[i4], SA.quat[i4 + 1], SA.quat[i4 + 2], SA.quat[i4 + 3])
      _q2.set(SB.quat[i4], SB.quat[i4 + 1], SB.quat[i4 + 2], SB.quat[i4 + 3])
      _q.slerp(_q2, blend)
      _p.set(cur.pos[c3], cur.pos[c3 + 1], cur.pos[c3 + 2])
      const sc = (i >= N - N_GLOW ? blink : 1) * fuse
      _s.set(lerp(SA.scl[i3], SB.scl[i3], blend) * sc, lerp(SA.scl[i3 + 1], SB.scl[i3 + 1], blend) * sc, lerp(SA.scl[i3 + 2], SB.scl[i3 + 2], blend) * sc)
      _m.compose(_p, _q, _s)
      if (i < N - N_GLOW) coreRef.current.setMatrixAt(i, _m)
      else glowRef.current.setMatrixAt(i - (N - N_GLOW), _m)
    }
    cur.init = true
    coreRef.current.instanceMatrix.needsUpdate = true
    glowRef.current.instanceMatrix.needsUpdate = true

    // --- selective illumination follows the core
    const L = rig.light
    L.ambient = 0.16; L.key = 0.5; L.keyPos.set(-6, 8, 6); L.rim = 0.8; L.rimPos.set(0, 3, -12)
    L.keyColor.set('#e6ddd0'); L.rimColor.set('#ff9a52')
    L.spot = 46 + intro * 20; L.spotColor.set('#ffb27a')
    L.spotPos.set(g.x + 2.5, g.y + 5, g.z + 5)
    L.spotTarget.set(g.x, g.y, g.z)
    L.point = 5 + 3 * intro; L.pointPos.set(g.x + 0.6 * g.s, g.y + 0.8 * g.s, g.z + 0.4 + g.solid * 2.2 * g.s)
  })

  return (
    <group visible={visible}>
      {envRefs.map((r, v) => (
        <instancedMesh key={v} ref={r} args={[geos.slab, mats.env, Math.ceil((envCount - v) / 4)]} frustumCulled={false} />
      ))}
      <instancedMesh ref={accRef} args={[geos.box, mats.accent, N_ACCENT]} frustumCulled={false} />
      {/* scatter shards live in world space at c≈0, and the group is at origin/scale 1 there */}
      <group ref={coreGroup}>
        <instancedMesh ref={coreRef} args={[geos.shard, mats.core, N - N_GLOW]} frustumCulled={false} />
        <instancedMesh ref={glowRef} args={[geos.shard, mats.glow, N_GLOW]} frustumCulled={false} />
        <mesh ref={solidRef} geometry={geos.solid} material={mats.solid} visible={false} />
        <mesh ref={seamRef} geometry={geos.seams} material={mats.seams} visible={false} rotation={[1.2, 0.3, 0.2]} />
      </group>
    </group>
  )
}
