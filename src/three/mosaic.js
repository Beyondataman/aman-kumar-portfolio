/**
 * Portrait → mosaic grid.
 * Samples the photo at one square per `cell` CSS pixels, drops the studio
 * background using the image's alpha mask (made once by
 * tools/make_portrait_mask.py, which keeps the white collar and neck),
 * adds a soft rim on the silhouette so the dark suit reads against black,
 * and returns typed arrays ready for a THREE.Points geometry.
 */

const CAM_Z = 12

export function layoutFor(vw, vh, fov) {
  const cell = Math.max(5, Math.min(8, Math.round(vh / 138)))
  const unit = (2 * CAM_Z * Math.tan((fov * Math.PI) / 360)) / vh // world units per CSS px at z = 0
  return { vw, vh, cell, unit }
}

function rng(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function buildMosaic(img, { vw, vh, cell, unit }) {
  const aspect = img.naturalWidth / img.naturalHeight
  // figure fills the height on desktop; on narrow screens let the shoulders crop
  const Hd = Math.min(vh * 0.96, (vw * 1.85) / (aspect * 0.61))
  const Wd = Hd * aspect
  const cols = Math.max(8, Math.round(Wd / cell))
  const rows = Math.max(8, Math.round(Hd / cell))

  // two-step downscale for a clean average
  const mid = document.createElement('canvas')
  mid.width = cols * 2; mid.height = rows * 2
  const mctx = mid.getContext('2d')
  mctx.imageSmoothingQuality = 'high'
  mctx.drawImage(img, 0, 0, mid.width, mid.height)
  const c = document.createElement('canvas')
  c.width = cols; c.height = rows
  const ctx = c.getContext('2d', { willReadFrequently: true })
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(mid, 0, 0, cols, rows)
  const px = ctx.getImageData(0, 0, cols, rows).data

  const n = cols * rows
  // the portrait carries an alpha mask (tools/make_portrait_mask.py): 0 = studio backdrop
  const lum = new Float32Array(n)
  const alpha = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    lum[i] = (0.2126 * px[i * 4] + 0.7152 * px[i * 4 + 1] + 0.0722 * px[i * 4 + 2]) / 255
    alpha[i] = px[i * 4 + 3] / 255
  }
  const bg = new Uint8Array(n)
  for (let i = 0; i < n; i++) bg[i] = alpha[i] < 0.5 ? 1 : 0

  // rim: distance (0, 1, 2 cells) to the background
  const rimOf = (x, y) => {
    for (let r = 1; r <= 2; r++) {
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const xx = x + dx, yy = y + dy
        if (xx < 0 || yy < 0 || xx >= cols || yy >= rows) continue
        if (bg[yy * cols + xx]) return r === 1 ? 1 : 0.45
      }
    }
    return 0
  }

  const r = rng(1376 + cols * 7 + rows)
  // on narrow screens pan toward the head (it sits right of centre in the photo)
  const focus = 0.5 + 0.115 * Math.min(1, Math.max(0, (1.1 - vw / vh) / 0.5))
  const x0 = vw / 2 - focus * cols * cell
  const y0 = vh - rows * cell // bottom-anchored
  const worldW = vw * unit, worldH = vh * unit

  const target = new Float32Array(n * 3)
  const start = new Float32Array(n * 3)
  const data = new Float32Array(n * 3)
  let k = 0
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x
      let b
      if (bg[i]) {
        if (r() > 0.035) continue // a little dust around the figure
        b = 0.03 + r() * 0.05
      } else {
        const L = Math.min(1, Math.max(0, (lum[i] - 0.03) / 0.8))
        b = Math.min(1, Math.pow(L, 0.85) * Math.min(1, alpha[i] * 1.3) + rimOf(x, y) * 0.1)
      }
      const sx = x0 + (x + 0.5) * cell
      const sy = y0 + (y + 0.5) * cell
      target[k * 3] = (sx - vw / 2) * unit
      target[k * 3 + 1] = (vh / 2 - sy) * unit
      target[k * 3 + 2] = 0
      start[k * 3] = (r() - 0.5) * worldW * 2.4
      start[k * 3 + 1] = (r() - 0.5) * worldH * 2.4
      start[k * 3 + 2] = -18 + r() * 22
      data[k * 3] = b
      data[k * 3 + 1] = Math.min(1, 0.55 * r() + 0.45 * (y / rows))
      data[k * 3 + 2] = r()
      k++
    }
  }
  return { count: k, target, start, data, cols, rows, rect: { x: x0, y: y0, w: cols * cell, h: rows * cell } }
}
