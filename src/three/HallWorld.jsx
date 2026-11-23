import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import { companies } from '../data/companies'
import { useStore } from '../lib/store'
import { live } from '../lib/live'
import { TIERS } from '../lib/quality'
import { rig } from './rig'
import { mulberry32 } from './util'

/* ================================================================
 * ANALYTICS HALL — one floating island per company.
 *  - a cloud-like base built from small cubes (the portrait's squares in 3D)
 *  - the company mark on top: an extruded SVG logo if one is supplied in
 *    src/assets/company-logos/<id>.svg, otherwise the ticker built from
 *    solid voxel cubes (no brand artwork is drawn by hand)
 *  - free cubes of the same size orbit, and every so often one flies in,
 *    touches the mark and drifts back out
 * Each island sits exactly behind its DOM panel: every frame it reads the
 * panel's stage slot (live.hall.slots) and converts it to world space, so
 * the 3D follows the horizontal gallery (pinned or swiped) perfectly.
 * ================================================================ */

const LOGO_FILES = import.meta.glob('../assets/company-logos/*.svg', { eager: true, query: '?url', import: 'default' })
const LOGOS = Object.fromEntries(Object.entries(LOGO_FILES).map(([p, u]) => [p.split('/').pop().replace('.svg', ''), u]))

const CUBE = 0.13 // cube edge (world units at island scale 1)
const STEP = 0.16 // grid pitch → small gaps like the mosaic
const ISLAND_H = 3.4 // design height of an island (base + mark + orbit room)
const CAM_Z = 12
const MARK_Y = 0.85 // the mark floats just above the cloud's crowns

// palette shared with the portrait (sRGB → used as linear-ish colours under ACES)
const LO = new THREE.Color(0.07, 0.08, 0.13)
const HI = new THREE.Color(0.82, 0.87, 1.0)
const tone = (b, r, out) => {
  out.copy(LO).lerp(HI, b).multiplyScalar(0.45 + 0.85 * b)
  out.r *= 1 - 0.14 * r; out.g *= 1 - 0.08 * r; out.b *= 1 + 0.16 * r
  return out.convertSRGBToLinear()
}

/** puffy cloud: union of flattened spheres, sampled on the cube grid */
function buildCloud(seed, density) {
  const r = mulberry32(seed)
  // a long, low bank of puffs with a few rounded heads on top
  const lumps = [
    ...Array.from({ length: 6 }, (_, i) => ({
      x: -1.35 + (i / 5) * 2.7 + (r() - 0.5) * 0.25,
      y: -1.05 + (r() - 0.5) * 0.12,
      z: (r() - 0.5) * 0.4,
      rad: 0.5 + r() * 0.28 - Math.abs(i - 2.5) * 0.05,
    })),
    ...[-0.75, 0.05, 0.85].map((x) => ({ x: x + (r() - 0.5) * 0.3, y: -0.62 + r() * 0.1, z: (r() - 0.5) * 0.3, rad: 0.36 + r() * 0.14 })),
  ]
  const inside = (x, y, z) => lumps.some((l) => {
    const dx = x - l.x, dy = (y - l.y) / 0.78, dz = z - l.z
    return dx * dx + dy * dy + dz * dz < l.rad * l.rad
  })
  const pts = []
  for (let x = -2.3; x <= 2.3; x += STEP) for (let y = -1.8; y <= -0.1; y += STEP) for (let z = -1.0; z <= 1.0; z += STEP) {
    if (!inside(x, y, z)) continue
    // keep the shell (what you see) and a sprinkle of the inside
    const shell = !inside(x + STEP, y, z) || !inside(x - STEP, y, z) || !inside(x, y + STEP, z) || !inside(x, y - STEP, z) || !inside(x, y, z + STEP) || !inside(x, y, z - STEP)
    if (!shell && r() > 0.08) continue
    if (r() > density) continue
    // lit from above like a cloud: brighter crowns, darker underside; shell cubes vary in size
    const lift = Math.min(1, Math.max(0, (y + 1.6) / 1.3))
    pts.push({ x, y, z, b: 0.22 + 0.45 * lift + 0.18 * r(), s: shell ? 0.7 + 0.35 * r() : 1, ph: r() * Math.PI * 2, f: 0.6 + r() * 0.9, r: r() })
  }
  return pts
}

/** ticker as solid voxels (3 cubes deep), drawn from the display font */
function buildTickerVoxels(text) {
  const H = 12
  const c = document.createElement('canvas')
  const g = c.getContext('2d', { willReadFrequently: true })
  g.font = `900 ${H * 1.25}px "Inter Tight", "Arial Black", sans-serif`
  const W = Math.ceil(g.measureText(text).width) + 2
  c.width = W; c.height = H + 2
  g.font = `900 ${H * 1.25}px "Inter Tight", "Arial Black", sans-serif`
  g.fillStyle = '#fff'; g.textBaseline = 'middle'
  g.fillText(text, 1, (H + 2) / 2 + 1)
  const d = g.getImageData(0, 0, W, H + 2).data
  const vox = []
  const s = 0.105 // solid: cubes touch
  for (let y = 0; y < H + 2; y++) for (let x = 0; x < W; x++) {
    if (d[(y * W + x) * 4 + 3] < 110) continue
    for (let z = 0; z < 3; z++) vox.push({ x: (x - W / 2) * s, y: ((H + 2) / 2 - y) * s, z: (z - 1) * s })
  }
  // fit to ~2.6 units wide
  const scale = Math.min(1, 2.6 / (W * s))
  return { vox, size: s * scale, scale }
}

export default function HallWorld() {
  const [fontReady, setFontReady] = useState(false)
  useEffect(() => {
    // the voxel tickers are drawn from the display face: wait for it
    const done = () => setFontReady(true)
    document.fonts?.load('900 15px "Inter Tight"').then(done, done) ?? done()
  }, [])
  const route = useStore((s) => s.route)
  const baseTier = useStore((s) => s.baseTier)
  const visible = route === 'hall'
  const density = TIERS[baseTier].label === 'low' ? 0.55 : 1

  useFrame(() => {
    if (!visible) return
    rig.cam.pos.set(0, 0, CAM_Z)
    rig.cam.look.set(0, 0, 0)
    rig.cam.lambda = 6
    rig.fog.near = 30; rig.fog.far = 90
    const L = rig.light
    L.ambient = 0.35; L.key = 1.4; L.keyPos.set(-5, 7, 9); L.keyColor.set('#e8edff')
    L.rim = 1.2; L.rimPos.set(4, 3, -8); L.rimColor.set('#7f9cff')
    L.spot = 0; L.point = 0
  })

  return (
    <group visible={visible}>
      {fontReady && companies.map((c, i) => <Island key={c.id} c={c} index={i} density={density} active={visible} />)}
    </group>
  )
}

function Island({ c, index, density, active }) {
  const group = useRef()
  const float = useRef()
  const cloudRef = useRef()
  const orbitRef = useRef()
  const markRef = useRef()
  const svgRef = useRef()
  const size = useThree((s) => s.size)
  const camera = useThree((s) => s.camera)

  const live_ = c.caseStudy
  const cloud = useMemo(() => buildCloud(101 + index * 37, density), [index, density])
  const orbit = useMemo(() => {
    const r = mulberry32(900 + index * 13)
    return Array.from({ length: c.caseStudy ? 34 : 20 }, () => ({
      rad: 1.45 + r() * 0.9, tilt: (r() - 0.5) * 0.8, speed: (0.25 + r() * 0.35) * (r() > 0.5 ? 1 : -1),
      ph: r() * Math.PI * 2, y: 0.35 + r() * 1.0, b: 0.35 + r() * 0.55, r: r(),
      dock: 0, dockTarget: null, // 0..1 progress of a visit to the mark
    }))
  }, [index, c.caseStudy])
  const ticker = useMemo(() => (LOGOS[c.id] ? null : buildTickerVoxels(c.ticker)), [c])

  const geo = useMemo(() => new THREE.BoxGeometry(CUBE, CUBE, CUBE), [])
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.38, metalness: 0.2, envMapIntensity: 0.8, emissive: new THREE.Color('#141a33'), emissiveIntensity: 1 }), [])
  const markMat = useMemo(() => (live_
    ? new THREE.MeshPhysicalMaterial({
      color: '#f1f4ff', metalness: 0.85, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.08,
      envMapIntensity: 1.6, emissive: new THREE.Color('#3a55d6'), emissiveIntensity: 0.45,
    })
    : new THREE.MeshStandardMaterial({
      color: '#6f7892', metalness: 0.55, roughness: 0.5, envMapIntensity: 0.7,
      emissive: new THREE.Color('#0c1024'), emissiveIntensity: 0.3,
    })), [live_])
  const halo = useMemo(() => {
    if (!live_) return null
    const cv = document.createElement('canvas'); cv.width = cv.height = 128
    const g = cv.getContext('2d')
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    gr.addColorStop(0, 'rgba(150,175,255,0.55)'); gr.addColorStop(0.45, 'rgba(110,140,255,0.18)'); gr.addColorStop(1, 'rgba(110,140,255,0)')
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128)
    const tex = new THREE.CanvasTexture(cv)
    return new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })
  }, [live_])
  const haloRef = useRef()
  const dockPts = useRef(null) // points on the logo's front face that cubes fly to
  useEffect(() => () => { geo.dispose(); mat.dispose(); markMat.dispose(); halo?.map.dispose(); halo?.dispose() }, [geo, mat, markMat, halo])

  // static colours + the ticker voxels (written once)
  useEffect(() => {
    const col = new THREE.Color(), m = new THREE.Matrix4()
    cloud.forEach((p, i) => cloudRef.current.setColorAt(i, tone(Math.min(1, p.b * (live_ ? 1.12 : 0.7)), p.r, col)))
    cloudRef.current.instanceColor.needsUpdate = true
    orbit.forEach((o, i) => orbitRef.current.setColorAt(i, tone(Math.min(1, o.b * (live_ ? 1.15 : 0.75)), o.r, col)))
    orbitRef.current.instanceColor.needsUpdate = true
    if (ticker && markRef.current) {
      const k = ticker.size / 0.105
      ticker.vox.forEach((v, i) => {
        m.makeScale(ticker.size / CUBE, ticker.size / CUBE, ticker.size / CUBE).setPosition(v.x * k, v.y * k, v.z * k)
        markRef.current.setMatrixAt(i, m)
      })
      markRef.current.instanceMatrix.needsUpdate = true
    }
  }, [cloud, orbit, ticker, live_])

  // official logo → solid bevelled extrusion
  useEffect(() => {
    const url = LOGOS[c.id]
    if (!url) return
    let alive = true
    new SVGLoader().load(url, (data) => {
      if (!alive || !svgRef.current) return
      const shapes = data.paths.flatMap((p) => SVGLoader.createShapes(p))
      // Simple Icons are drawn on a 24-unit grid
      const g = new THREE.ExtrudeGeometry(shapes, {
        depth: 3.2, curveSegments: 18, bevelEnabled: true, bevelThickness: 0.55, bevelSize: 0.28, bevelSegments: 4,
      })
      g.center(); g.computeBoundingBox()
      const bb = g.boundingBox, w = bb.max.x - bb.min.x, h = bb.max.y - bb.min.y
      const [mw, mh] = live_ ? [2.7, 1.85] : [2.1, 1.35]
      const sc = Math.min(mw / w, mh / h)
      g.scale(sc, -sc, sc) // SVG y points down
      g.computeVertexNormals()
      // front-face points for the visiting cubes
      const pos = g.attributes.position, zmax = (bb.max.z - bb.min.z) * sc / 2
      const pts = []
      for (let i = 0; i < pos.count; i += 7) if (pos.getZ(i) > zmax * 0.8) pts.push({ x: pos.getX(i), y: pos.getY(i), z: pos.getZ(i) })
      dockPts.current = pts
      svgRef.current.geometry?.dispose()
      svgRef.current.geometry = g
    })
    return () => { alive = false }
  }, [c.id, live_])

  const _m = useMemo(() => new THREE.Matrix4(), [])
  const _p = useMemo(() => new THREE.Vector3(), [])
  const _q = useMemo(() => new THREE.Quaternion(), [])
  const _s = useMemo(() => new THREE.Vector3(1, 1, 1), [])
  const _sc = useMemo(() => new THREE.Vector3(1, 1, 1), [])
  const _e = useMemo(() => new THREE.Euler(), [])

  useFrame((st, dtRaw) => {
    const gr = group.current
    if (!gr) return
    const el = active && live.hall.slots.get(c.id)
    if (!el) { gr.visible = false; return }
    const r = el.getBoundingClientRect()
    const W = size.width, H = size.height
    if (r.right < -40 || r.left > W + 40 || r.bottom < -40 || r.top > H + 40 || r.height < 10) { gr.visible = false; return }
    gr.visible = true

    // DOM slot → world (z = 0 plane, camera straight on)
    const unit = (2 * CAM_Z * Math.tan((camera.fov * Math.PI) / 360)) / H
    gr.position.set((r.left + r.width / 2 - W / 2) * unit, (H / 2 - (r.top + r.height / 2)) * unit, 0)
    gr.scale.setScalar(Math.min(r.height / ISLAND_H, r.width / 5.2) * unit)

    const t = st.clock.elapsedTime + index * 1.7
    const dt = Math.min(0.05, dtRaw)
    const hot = live.hall.hovered === c.id ? 1 : 0
    const reduced = live.reducedMotion

    // the whole island floats; the mark sways
    float.current.position.y = -0.15 + (reduced ? 0 : Math.sin(t * 0.7) * 0.08)
    float.current.rotation.y = reduced ? 0 : Math.sin(t * 0.25) * (live_ ? 0.42 : 0.2) + live.pointer.x * 0.15 * hot
    float.current.rotation.x = reduced ? 0 : Math.sin(t * 0.31) * 0.04

    // cloud cubes breathe individually
    cloud.forEach((p, i) => {
      const w = reduced ? 0 : Math.sin(t * p.f + p.ph)
      _p.set(p.x, p.y + 0.45 + w * 0.025, p.z)
      _q.setFromEuler(_e.set(w * 0.08, w * 0.12, 0))
      _m.compose(_p, _q, _sc.setScalar(p.s))
      cloudRef.current.setMatrixAt(i, _m)
    })
    cloudRef.current.instanceMatrix.needsUpdate = true

    // orbiting cubes; now and then one visits the mark and floats back out
    const voxels = ticker?.vox ?? dockPts.current
    const k = ticker ? ticker.size / 0.105 : 1
    orbit.forEach((o, i) => {
      const a = o.ph + t * o.speed * (1 + hot * 1.2)
      let x = Math.cos(a) * o.rad, z = Math.sin(a) * o.rad * 0.55
      let y = o.y + Math.sin(a) * o.tilt + Math.sin(t * 0.9 + o.ph) * 0.06
      if (!reduced) {
        if (!o.dockTarget && voxels?.length && Math.random() < dt * (live_ ? 0.05 : 0.02)) {
          const v = voxels[Math.floor(Math.random() * voxels.length)]
          o.dockTarget = { x: v.x * k, y: v.y * k + MARK_Y, z: v.z * k + (ticker ? 0.2 : 0.09) } // land on the front face
          o.dock = 0
        }
        if (o.dockTarget) {
          o.dock += dt / 3.2
          const u = o.dock < 0.4 ? o.dock / 0.4 : o.dock < 0.6 ? 1 : 1 - (o.dock - 0.6) / 0.4
          const e = u * u * (3 - 2 * u)
          x += (o.dockTarget.x - x) * e; y += (o.dockTarget.y - y) * e; z += (o.dockTarget.z - z) * e
          if (o.dock >= 1) o.dockTarget = null
        }
      }
      _p.set(x, y, z)
      _q.setFromEuler(_e.set(t * 0.6 + o.ph, t * 0.4 + o.ph, 0))
      _m.compose(_p, _q, _s)
      orbitRef.current.setMatrixAt(i, _m)
    })
    orbitRef.current.instanceMatrix.needsUpdate = true

    // the mark: gentle bob, brighter while hovered
    const pulse = live_ && !reduced ? 0.5 + 0.5 * Math.sin(t * 1.6) : 0.5
    const glow = (live_ ? 0.32 + 0.3 * pulse : 0.3) + hot * 0.45
    markMat.emissiveIntensity += (glow - markMat.emissiveIntensity) * Math.min(1, dt * 4)
    if (haloRef.current) {
      haloRef.current.material.opacity = 0.75 + 0.25 * pulse + hot * 0.3
      haloRef.current.scale.setScalar(3.6 + 0.25 * pulse + hot * 0.4)
    }
  })

  return (
    <group ref={group} visible={false}>
      <group ref={float} position-y={-0.15}>
        <instancedMesh ref={cloudRef} args={[geo, mat, cloud.length]} frustumCulled={false} />
        <instancedMesh ref={orbitRef} args={[geo, mat, orbit.length]} frustumCulled={false} />
        <group position={[0, MARK_Y, 0]}>
          {halo && <mesh ref={haloRef} material={halo} position-z={-0.6} renderOrder={-1}><planeGeometry args={[1, 0.62]} /></mesh>}
          {ticker ? (
            <instancedMesh ref={markRef} args={[geo, markMat, ticker.vox.length]} frustumCulled={false} />
          ) : (
            <mesh ref={svgRef} material={markMat} />
          )}
        </group>
      </group>
    </group>
  )
}
