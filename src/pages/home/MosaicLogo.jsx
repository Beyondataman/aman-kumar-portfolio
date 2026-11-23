import { useEffect, useRef } from 'react'

/**
 * A logo drawn as a pixel mosaic in the same palette as the hero portrait.
 * `src`: an image with a transparent background (PNG/SVG/WebP). Without one,
 * a generic pictogram (`icon`) is used. The squares assemble the first time
 * the tile scrolls into view.
 */
const CELLS = 16

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
  pen: (g) => {
    g.beginPath(); g.moveTo(32, 6); g.lineTo(48, 30); g.lineTo(36, 58); g.lineTo(28, 58); g.lineTo(16, 30); g.closePath(); g.fill()
    g.globalCompositeOperation = 'destination-out'
    g.beginPath(); g.arc(32, 32, 4.5, 0, Math.PI * 2); g.fill(); g.fillRect(31, 34, 2, 24)
    g.globalCompositeOperation = 'source-over'
  },
}

function sample(source, isIcon) {
  const S = 64
  const c = document.createElement('canvas'); c.width = c.height = S
  const g = c.getContext('2d', { willReadFrequently: true })
  if (isIcon) {
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

export default function MosaicLogo({ src, icon, size = 64 }) {
  const ref = useRef(null)
  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    cv.width = cv.height = Math.round(size * dpr)
    const g = cv.getContext('2d')
    const cell = cv.width / CELLS
    let cells = null, raf = 0, io, alive = true
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    const draw = (t) => {
      g.clearRect(0, 0, cv.width, cv.height)
      for (const c of cells) {
        const p = Math.min(1, Math.max(0, (t - c.d * 0.6) / 0.4)) // per-square arrival
        if (p <= 0) continue
        const e = 1 - Math.pow(1 - p, 3)
        const off = (1 - e) * cell * 3 * (c.r - 0.5)
        g.globalAlpha = e
        g.fillStyle = colour(c.b, c.r)
        g.fillRect(c.x * cell + off, c.y * cell - (1 - e) * cell * 2, cell * 0.84, cell * 0.84)
      }
      g.globalAlpha = 1
    }
    const play = () => {
      if (reduced) { draw(1); return }
      const t0 = performance.now()
      const step = (now) => {
        const t = Math.min(1, (now - t0) / 1100)
        draw(t)
        if (t < 1 && alive) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }
    const ready = (source, isIcon) => {
      if (!alive) return
      cells = sample(source, isIcon)
      io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); play() } })
      io.observe(cv)
    }
    if (src) {
      const img = new Image()
      img.onload = () => ready(img, false)
      img.onerror = () => ready(icon, true)
      img.src = src
    } else ready(icon, true)
    return () => { alive = false; cancelAnimationFrame(raf); io?.disconnect() }
  }, [src, icon, size])

  return <canvas ref={ref} className="mlogo" style={{ width: size, height: size }} aria-hidden="true" />
}
