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
