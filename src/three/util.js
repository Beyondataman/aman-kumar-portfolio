export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const ease = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 }
/** frame-rate independent damping factor */
export const k = (lambda, dt) => 1 - Math.exp(-lambda * dt)

export { mulberry32 } from '../lib/random'

