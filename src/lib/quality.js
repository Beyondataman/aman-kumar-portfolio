// Adaptive rendering tiers. The initial tier is a guess from the device;
// PerformanceMonitor then moves it up/down based on measured frame rate.
export const TIERS = {
  low: { dpr: 1.3, effects: false, label: 'low' },
  medium: { dpr: 1.5, effects: true, label: 'medium' },
  high: { dpr: 2, effects: true, label: 'high' },
}

export function initialTier() {
  if (typeof window === 'undefined') return 'medium'
  const coarse = window.matchMedia?.('(pointer: coarse)').matches
  const cores = navigator.hardwareConcurrency || 4
  const mem = navigator.deviceMemory || 4
  if (coarse && (cores <= 6 || mem <= 4)) return 'low'
  if (coarse || cores <= 4 || mem <= 4) return 'medium'
  return 'high'
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGL2RenderingContext && c.getContext('webgl2'))
  } catch { return false }
}
