import * as THREE from 'three'

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const lerp = (a, b, t) => a + (b - a) * t
export const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t) }
export const ease = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 }
/** frame-rate independent damping factor */
export const k = (lambda, dt) => 1 - Math.exp(-lambda * dt)

export { mulberry32 } from '../lib/random'

/** Sample a keyframe list [{c, ...numbers}] at position c with smoothstep easing. */
export function sampleKeys(keys, c, fields) {
  let i = 0
  while (i < keys.length - 2 && c > keys[i + 1].c) i++
  const a = keys[i], b = keys[i + 1]
  const f = b.c === a.c ? 0 : smooth((c - a.c) / (b.c - a.c))
  const out = { a, b, f }
  for (const key of fields) out[key] = lerp(a[key], b[key], f)
  return out
}

/** Project a world point to CSS pixel coordinates. */
const _v = new THREE.Vector3()
export function toScreen(point, camera, size) {
  _v.copy(point).project(camera)
  return { x: (_v.x * 0.5 + 0.5) * size.width, y: (-_v.y * 0.5 + 0.5) * size.height, behind: _v.z > 1 }
}

/** Typographic name plate texture (used when no licensed logo file is supplied). */
export function makePlateTexture({ name, ticker, logo }, onUpdate) {
  const W = 1024, H = 440
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4

  const draw = (img) => {
    ctx.clearRect(0, 0, W, H)
    // glass plate
    const r = 36
    ctx.beginPath()
    ctx.roundRect(8, 8, W - 16, H - 16, r)
    ctx.fillStyle = 'rgba(14,15,18,0.62)'
    ctx.fill()
    ctx.lineWidth = 3
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'
    ctx.stroke()
    if (img) {
      const s = Math.min((W - 160) / img.width, (H - 170) / img.height)
      ctx.drawImage(img, (W - img.width * s) / 2, (H - 70 - img.height * s) / 2 + 10, img.width * s, img.height * s)
    } else {
      ctx.fillStyle = '#eef1f6'
      let size = 170
      ctx.font = `800 ${size}px "Inter Tight", "Arial Black", sans-serif`
      while (ctx.measureText(name).width > W - 140 && size > 60) { size -= 8; ctx.font = `800 ${size}px "Inter Tight", "Arial Black", sans-serif` }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(name, W / 2, H / 2 - 30)
    }
    ctx.font = '600 44px "JetBrains Mono", monospace'
    ctx.fillStyle = 'rgba(236,239,245,0.62)'
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
    ctx.fillText(ticker, W / 2, H - 52)
    tex.needsUpdate = true
    onUpdate?.()
  }
  draw(null)
  // redraw once web fonts are ready so the plate uses the display face
  document.fonts?.ready.then(() => { if (!logo) draw(null) })
  if (logo) {
    const img = new Image()
    img.onload = () => draw(img)
    img.src = logo
  }
  return tex
}

/** Soft radial blob for contact shadows / light pools. */
export function makeRadialTexture(inner = 'rgba(0,0,0,0.85)', outer = 'rgba(0,0,0,0)') {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128)
  grd.addColorStop(0, inner); grd.addColorStop(1, outer)
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256)
  const t = new THREE.CanvasTexture(c)
  return t
}
