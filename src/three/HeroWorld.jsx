import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import portraitUrl from '../assets/aman-portrait.webp'
import { useStore } from '../lib/store'
import { live, kick } from '../lib/live'
import { rig } from './rig'
import { buildMosaic, layoutFor } from './mosaic'

/* ================================================================
 * HERO WORLD — the portrait mosaic (route "/").
 * Thousands of small squares fly in from a scattered cloud and settle
 * on a grid that samples Aman's photo; the white studio background is
 * keyed out (flood fill from the edges) so the figure sits on black.
 * Squares are pixel-sized at rest: the grid is rebuilt for the viewport.
 *
 * Progress values come from `live.hero`:
 *   t        0 → 1  assembly (time based, started by the Home page)
 *   scatter  0 → 1  hero scrolled away (squares drift apart and fade)
 * ================================================================ */

const VERT = /* glsl */ `
  uniform float uT;
  uniform float uTime;
  uniform float uSize;
  uniform float uScatter;
  uniform vec2 uPointer;
  uniform float uHover;
  attribute vec3 aStart;
  attribute vec3 aData; // x: brightness, y: arrival delay 0..1, z: random
  varying float vB;
  varying float vA;
  varying float vR;
  void main() {
    float d = clamp((uT - aData.y * 0.55) / 0.45, 0.0, 1.0);
    float e = 1.0 - pow(1.0 - d, 4.0);
    vec3 p = mix(aStart, position, e);

    // pointer: squares near the cursor lift toward the camera
    vec2 dp = p.xy - uPointer;
    float f = exp(-dot(dp, dp) / 0.28) * uHover * e;
    p.z += f * 0.9;
    p.xy += dp * f * 0.25;

    // scroll away: drift outward/up with depth
    float s = uScatter * (0.35 + aData.z);
    p.xy += normalize(position.xy + vec2(0.001)) * s * 1.6 + vec2(0.0, s * 1.2);
    p.z += s * (aData.z - 0.3) * 7.0;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (12.0 / max(1.0, -mv.z)) * mix(1.6, 1.0, e);

    float tw = 0.86 + 0.14 * sin(uTime * (0.6 + aData.z * 1.4) + aData.z * 40.0);
    vB = aData.x * mix(tw, 1.0, 0.35) * (0.35 + 0.65 * e) * (1.0 + f * 0.8);
    vA = smoothstep(0.0, 0.12, d) * (1.0 - smoothstep(0.2, 1.0, uScatter));
    vR = aData.z;
  }
`

const FRAG = /* glsl */ `
  varying float vB;
  varying float vA;
  varying float vR;
  void main() {
    // cool palette: deep slate → lavender white, a little hue jitter per square
    vec3 lo = vec3(0.07, 0.08, 0.13);
    vec3 hi = vec3(0.82, 0.87, 1.0);
    vec3 c = mix(lo, hi, clamp(vB, 0.0, 1.0)) * (0.45 + 0.85 * vB);
    c *= mix(vec3(1.0), vec3(0.86, 0.92, 1.16), vR);
    // authored in sRGB → linearise; three converts back for the screen
    // (directly, or in the composer's output pass on tiers with post effects)
    gl_FragColor = vec4(pow(c, vec3(2.2)), vA);
    #include <colorspace_fragment>
  }
`

const STAR_VERT = /* glsl */ `
  uniform float uSize;
  uniform float uTime;
  uniform float uFade;
  attribute float aR;
  varying float vA;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize;
    vA = (0.25 + 0.75 * (0.5 + 0.5 * sin(uTime * (0.3 + aR) + aR * 60.0))) * uFade * (0.35 + aR * 0.65);
  }
`
const STAR_FRAG = /* glsl */ `
  varying float vA;
  void main() {
    gl_FragColor = vec4(pow(vec3(0.55, 0.62, 0.85), vec3(2.2)), vA * 0.5);
    #include <colorspace_fragment>
  }
`

export default function HeroWorld() {
  const route = useStore((s) => s.route)
  const visible = route === 'story'
  const size = useThree((s) => s.size)
  const dpr = useThree((s) => s.viewport.dpr)
  const camera = useThree((s) => s.camera)
  const points = useRef()
  const stars = useRef()
  const img = useRef(null)
  const coarse = useMemo(() => window.matchMedia?.('(pointer: coarse)').matches, [])

  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, toneMapped: false,
    uniforms: {
      uT: { value: 0 }, uTime: { value: 0 }, uSize: { value: 6 }, uScatter: { value: 0 },
      uPointer: { value: new THREE.Vector2(99, 99) }, uHover: { value: 0 },
    },
  }), [])
  const starMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: STAR_VERT, fragmentShader: STAR_FRAG, transparent: true, depthWrite: false, toneMapped: false,
    uniforms: { uSize: { value: 1.5 }, uTime: { value: 0 }, uFade: { value: 0 } },
  }), [])
  const geo = useMemo(() => new THREE.BufferGeometry(), [])
  const starGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const n = 700
    const p = new Float32Array(n * 3), r = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      p[i * 3] = (Math.random() - 0.5) * 30
      p[i * 3 + 1] = (Math.random() - 0.5) * 16
      p[i * 3 + 2] = -2 - Math.random() * 10
      r[i] = Math.random()
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3))
    g.setAttribute('aR', new THREE.BufferAttribute(r, 1))
    return g
  }, [])

  // load the portrait once, then (re)build the mosaic whenever the viewport changes
  useEffect(() => {
    let alive = true
    let timer = 0
    const build = () => {
      if (!img.current || !alive) return
      const L = layoutFor(size.width, size.height, camera.fov)
      const m = buildMosaic(img.current, L)
      geo.setAttribute('position', new THREE.BufferAttribute(m.target, 3))
      geo.setAttribute('aStart', new THREE.BufferAttribute(m.start, 3))
      geo.setAttribute('aData', new THREE.BufferAttribute(m.data, 3))
      geo.setDrawRange(0, m.count)
      geo.computeBoundingSphere()
      geo.boundingSphere.radius = 60 // never cull while squares are flying in
      mat.uniforms.uSize.value = L.cell * 0.84 * dpr
      starMat.uniforms.uSize.value = Math.max(1, 1.4 * dpr)
      live.hero.ready = true
      kick(800)
    }
    const schedule = () => { clearTimeout(timer); timer = setTimeout(build, img.current?._built ? 180 : 0) }
    if (!img.current) {
      const im = new Image()
      im.decoding = 'async'
      im.onload = () => { if (!alive) return; img.current = im; build(); im._built = true }
      im.src = portraitUrl
    } else schedule()
    return () => { alive = false; clearTimeout(timer) }
  }, [size.width, size.height, dpr, camera, geo, mat, starMat])

  useFrame((state, dtRaw) => {
    if (!visible) return
    const H = live.hero
    const now = performance.now()
    if (H.requested && H.ready && !H.start) H.start = now
    if (H.start && H.t < 1) {
      H.t = live.reducedMotion ? 1 : Math.min(1, (now - H.start) / H.duration)
      kick(200)
    }
    mat.uniforms.uT.value = H.t
    mat.uniforms.uTime.value = state.clock.elapsedTime
    mat.uniforms.uScatter.value += ((H.scatter ?? 0) - mat.uniforms.uScatter.value) * Math.min(1, dtRaw * 8)
    // pointer in world units at z = 0
    const halfH = Math.tan((camera.fov * Math.PI) / 360) * 12
    const halfW = halfH * (size.width / size.height)
    mat.uniforms.uPointer.value.set(live.pointer.x * halfW, live.pointer.y * halfH)
    const hoverTarget = coarse || live.reducedMotion ? 0 : 1
    mat.uniforms.uHover.value += (hoverTarget - mat.uniforms.uHover.value) * Math.min(1, dtRaw * 3)
    starMat.uniforms.uTime.value = state.clock.elapsedTime
    starMat.uniforms.uFade.value += ((H.start ? 1 : 0) * (1 - (H.scatter ?? 0)) - starMat.uniforms.uFade.value) * Math.min(1, dtRaw * 2)
    if (points.current) points.current.visible = H.ready && (H.scatter ?? 0) < 0.999

    // camera: straight on, very slight parallax with the pointer
    rig.cam.pos.set(live.pointer.x * 0.12, live.pointer.y * 0.08, 12)
    rig.cam.look.set(0, 0, 0)
    rig.cam.lambda = 3
    rig.fog.near = 30; rig.fog.far = 80
    const L = rig.light
    L.ambient = 0.1; L.key = 0.3; L.rim = 0.4; L.spot = 0; L.point = 0
  })

  return (
    <group visible={visible}>
      <points ref={stars} geometry={starGeo} material={starMat} frustumCulled={false} />
      <points ref={points} geometry={geo} material={mat} frustumCulled={false} visible={false} />
    </group>
  )
}
