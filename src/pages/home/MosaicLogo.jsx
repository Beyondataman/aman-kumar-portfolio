import { useEffect, useRef } from 'react'

/**
 * A logo drawn as a pixel mosaic in the same palette as the hero portrait.
 * `src`: an image with a transparent background (PNG/SVG/WebP). Without one,
 * a generic pictogram (`icon`) is used. Whenever src/icon change, the old
 * squares leave and the new ones assemble with a randomly chosen transition
 * (scatter · rise · wipe · pop).
 */
const DEFAULT_CELLS = 16

// generic, brand-free pictograms drawn on a 64×64 canvas
const ICONS = {
  terminal: (g) => {
    g.lineWidth = 6; g.lineCap = 'round'; g.lineJoin = 'round'
    g.strokeRect(6, 10, 52, 44)
    g.beginPath(); g.moveTo(16, 26); g.lineTo(26, 33); g.lineTo(16, 40); g.stroke()
    g.beginPath(); g.moveTo(31, 41); g.lineTo(46, 41); g.stroke()
  },
  branch: (g) => {
    g.lineWidth = 6; g.lineCap = 'round'
    g.beginPath(); g.moveTo(20, 14); g.lineTo(20, 50); g.stroke()
    g.beginPath(); g.moveTo(44, 22); g.bezierCurveTo(44, 36, 20, 32, 20, 44); g.stroke()
    for (const [x, y] of [[20, 12], [20, 52], [44, 18]]) { g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fill() }
  },
  laptop: (g) => {
    g.lineWidth = 6; g.lineJoin = 'round'
    g.strokeRect(12, 12, 40, 28)
    g.fillRect(4, 46, 56, 7)
  },
  wrench: (g) => {
    g.lineWidth = 9; g.lineCap = 'round'
    g.beginPath(); g.moveTo(16, 50); g.lineTo(38, 28); g.stroke()
    g.beginPath(); g.arc(44, 20, 12, Math.PI * 0.15, Math.PI * 1.85); g.lineWidth = 7; g.stroke()
  },
  camera: (g) => {
    g.fillRect(6, 18, 52, 36); g.fillRect(20, 11, 16, 9)
    g.globalCompositeOperation = 'destination-out'
    g.beginPath(); g.arc(32, 36, 12, 0, Math.PI * 2); g.fill()
    g.globalCompositeOperation = 'source-over'
    g.beginPath(); g.arc(32, 36, 6, 0, Math.PI * 2); g.fill()
  },
  film: (g) => {
    g.fillRect(8, 22, 48, 34)
    g.beginPath(); g.moveTo(8, 18); g.lineTo(52, 8); g.lineTo(54, 16); g.lineTo(10, 26); g.closePath(); g.fill()
    g.globalCompositeOperation = 'destination-out'
    for (const x of [14, 26, 38]) g.fillRect(x, 30, 7, 18)
    g.globalCompositeOperation = 'source-over'
  },
  question: (g) => {
    g.lineWidth = 9; g.lineCap = 'round'
    g.beginPath(); g.arc(32, 22, 13, Math.PI * 1.05, Math.PI * 2.35); g.lineTo(32, 40); g.stroke()
    g.beginPath(); g.arc(32, 54, 5, 0, Math.PI * 2); g.fill()
  },
  database: (g) => {
    for (const y of [12, 27, 42]) {
      g.beginPath(); g.ellipse(32, y + 6, 22, 7, 0, 0, Math.PI * 2); g.fill()
      g.fillRect(10, y + 6, 44, 9)
    }
    g.globalCompositeOperation = 'destination-out'
    for (const y of [24, 39]) { g.beginPath(); g.ellipse(32, y, 22, 3, 0, 0, Math.PI); g.lineWidth = 3; g.stroke() }
    g.globalCompositeOperation = 'source-over'
  },
  chart: (g) => {
    g.fillRect(8, 40, 10, 16); g.fillRect(22, 30, 10, 26); g.fillRect(36, 18, 10, 38); g.fillRect(50, 8, 8, 48)
  },
  cube: (g) => {
    g.beginPath(); g.moveTo(32, 6); g.lineTo(56, 18); g.lineTo(32, 30); g.lineTo(8, 18); g.closePath(); g.fill()
    g.globalAlpha = 0.65; g.beginPath(); g.moveTo(8, 22); g.lineTo(30, 33); g.lineTo(30, 58); g.lineTo(8, 46); g.closePath(); g.fill()
    g.globalAlpha = 0.4; g.beginPath(); g.moveTo(56, 22); g.lineTo(34, 33); g.lineTo(34, 58); g.lineTo(56, 46); g.closePath(); g.fill()
    g.globalAlpha = 1
  },
  pen: (g) => {
    g.beginPath(); g.moveTo(32, 6); g.lineTo(48, 30); g.lineTo(36, 58); g.lineTo(28, 58); g.lineTo(16, 30); g.closePath(); g.fill()
    g.globalCompositeOperation = 'destination-out'
    g.beginPath(); g.arc(32, 32, 4.5, 0, Math.PI * 2); g.fill(); g.fillRect(31, 34, 2, 24)
    g.globalCompositeOperation = 'source-over'
  },
}

function sample(source, isIcon, CELLS = 16) {
  const S = 64
  const c = document.createElement('canvas'); c.width = c.height = S
  const g = c.getContext('2d', { willReadFrequently: true })
  if (isIcon && source.startsWith('text:')) {
    // typographic monogram (e.g. a ticker) — no brand marks are drawn
    const txt = source.slice(5)
    let fs = 40
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'
    g.font = `900 ${fs}px "Inter Tight", "Arial Black", sans-serif`
    while (g.measureText(txt).width > S * 0.9 && fs > 10) { fs -= 2; g.font = `900 ${fs}px "Inter Tight", "Arial Black", sans-serif` }
    g.fillText(txt, S / 2, S / 2 + fs * 0.04)
  } else if (isIcon) {
    g.fillStyle = g.strokeStyle = '#fff'
    ICONS[source]?.(g)
  } else {
    const w = source.naturalWidth || 64, h = source.naturalHeight || 64
    const k = (S * 0.92) / Math.max(w, h)
    g.drawImage(source, (S - w * k) / 2, (S - h * k) / 2, w * k, h * k)
  }
  const t = document.createElement('canvas'); t.width = t.height = CELLS
  const tg = t.getContext('2d', { willReadFrequently: true })
  tg.imageSmoothingQuality = 'high'
  tg.drawImage(c, 0, 0, CELLS, CELLS)
  const d = tg.getImageData(0, 0, CELLS, CELLS).data
  const cells = []
  let sum = 0, cnt = 0
  for (let i = 0; i < CELLS * CELLS; i++) {
    const a = d[i * 4 + 3] / 255
    if (a < 0.28) continue
    const L = (0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]) / 255
    cells.push({ i, a, L }); sum += L; cnt++
  }
  // dark logos (e.g. black marks) would vanish on black: invert their tones
  const invert = cnt && sum / cnt < 0.38
  let s = 7
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  const Ls = cells.map((c) => (invert ? 1 - c.L : c.L))
  // stretch the logo's own tonal range so colour differences (e.g. Python's blue
  // and yellow) survive as light/dark squares, like the portrait's shading
  const sorted = [...Ls].sort((a, b) => a - b)
  const lo = sorted[Math.floor(sorted.length * 0.05)] ?? 0
  const hi = sorted[Math.floor(sorted.length * 0.95)] ?? 1
  const flat = hi - lo < 0.15
  return cells.map((c, k) => {
    const r = rnd(), d = rnd()
    const t = flat ? 0.55 + 0.35 * rnd() : Math.min(1, Math.max(0, (Ls[k] - lo) / (hi - lo)))
    const b = Math.min(1, Math.max(0.12, (flat ? t : 0.2 + 0.8 * t) + (rnd() - 0.5) * 0.12)) * Math.min(1, c.a * 1.2)
    return { x: c.i % CELLS, y: (c.i / CELLS) | 0, b, r, d }
  })
}

function colour(b, r) {
  // same mapping as the portrait shader: slate → lavender white, slight hue jitter
  const v = 0.45 + 0.85 * b
  const lo = [0.07, 0.08, 0.13], hi = [0.82, 0.87, 1.0], tint = [1 - 0.14 * r, 1 - 0.08 * r, 1 + 0.16 * r]
  return `rgb(${[0, 1, 2].map((k) => Math.min(255, Math.round((lo[k] + (hi[k] - lo[k]) * b) * v * tint[k] * 255))).join(',')})`
}

// sampled + coloured squares, cached per logo
const cache = new Map()
function loadCells(src, icon, cells) {
  const key = `${src || `icon:${icon}`}@${cells}`
  if (!cache.has(key)) {
    cache.set(key, new Promise((resolve) => {
      const done = (source, isIcon) => resolve(sample(source, isIcon, cells).map((c) => ({ ...c, fill: colour(c.b, c.r) })))
      if (!src && icon?.startsWith('text:')) {
        const go = () => done(icon, true)
        return document.fonts?.load('900 40px "Inter Tight"').then(go, go) ?? go()
      }
      if (!src) return done(icon, true)
      const img = new Image()
      img.onload = () => done(img, false)
      img.onerror = () => done(icon, true)
      img.src = src
    }))
  }
  return cache.get(key)
}

const STYLES = ['scatter', 'rise', 'wipe', 'pop']
const OUT_MS = 380
const IN_MS = 760

/** progress of one square: delay window `d` (0..1 of the phase) then a 0.45 ramp */
const local = (t, d) => Math.min(1, Math.max(0, (t - d * 0.55) / 0.45))

export default function MosaicLogo({ src, icon, size = 64, delay = 0, cells: CELLS = DEFAULT_CELLS }) {
  const ref = useRef(null)
  const shown = useRef(null) // cells currently on screen
  const raf = useRef(0)
  const firstDelay = useRef(delay) // only the first appearance is delayed (staggered reveal)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const px = Math.round(size * dpr)
    if (cv.width !== px) { cv.width = cv.height = px }
    const g = cv.getContext('2d')
    const cell = cv.width / CELLS
    const sq = cell * 0.84
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let alive = true, timer = 0

    const paint = (cells, t, phase, style) => {
      for (const c of cells) {
        let d = c.d
        if (style === 'rise') d = 1 - c.y / CELLS
        else if (style === 'wipe') d = c.x / CELLS
        const p = local(t, d)
        const e = phase === 'in' ? 1 - Math.pow(1 - p, 3) : 1 - p * p
        if (e <= 0.01) continue
        let dx = 0, dy = 0, sc = 1
        const k = 1 - e
        if (style === 'scatter') { dx = (c.r - 0.5) * cell * 6 * k; dy = (c.d - 0.5) * cell * 6 * k }
        else if (style === 'rise') dy = cell * 4 * k * (phase === 'in' ? 1 : -1)
        else if (style === 'wipe') dx = cell * 2 * k * (phase === 'in' ? -1 : 1)
        else sc = e
        g.globalAlpha = e
        g.fillStyle = c.fill
        const w = sq * sc
        g.fillRect(c.x * cell + (sq - w) / 2 + dx, c.y * cell + (sq - w) / 2 + dy, w, w)
      }
      g.globalAlpha = 1
    }

    loadCells(src, icon, CELLS).then((next) => {
      if (!alive) return
      const prev = shown.current
      shown.current = next
      if (reduced) { g.clearRect(0, 0, cv.width, cv.height); paint(next, 1, 'in', 'pop'); return }
      const style = STYLES[Math.floor(Math.random() * STYLES.length)]
      const start = () => {
        const t0 = performance.now()
        const outMs = prev ? OUT_MS : 0
        const step = (now) => {
          const el = Math.max(0, now - t0) // rAF time can precede t0
          g.clearRect(0, 0, cv.width, cv.height)
          if (el < outMs) paint(prev, el / outMs, 'out', style)
          else paint(next, Math.min(1, (el - outMs) / IN_MS), 'in', style)
          if (el < outMs + IN_MS && alive) raf.current = requestAnimationFrame(step)
        }
        cancelAnimationFrame(raf.current)
        raf.current = requestAnimationFrame(step)
      }
      const wait = prev ? 0 : firstDelay.current
      if (wait) timer = setTimeout(start, wait)
      else start()
    })
    return () => { alive = false; clearTimeout(timer); cancelAnimationFrame(raf.current) }
  }, [src, icon, size, CELLS])

  return <canvas ref={ref} className="mlogo" style={{ width: size, height: size }} aria-hidden="true" />
}
