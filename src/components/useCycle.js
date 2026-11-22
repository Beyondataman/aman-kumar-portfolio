import { useCallback, useEffect, useRef, useState } from 'react'
import { live } from '../lib/live'

/**
 * Rotates an index while `active`. `duration(i)` gives how long item i stays.
 * Pauses when inactive or with reduced motion; `next()` advances manually and restarts the timer.
 */
export function useCycle(count, duration, active, delay = 0) {
  const [i, setI] = useState(0)
  const [tick, setTick] = useState(0)
  const first = useRef(true)
  useEffect(() => {
    if (!active || live.reducedMotion || count < 2) return
    const wait = duration(i) + (first.current ? delay : 0)
    first.current = false
    const t = setTimeout(() => setI((v) => (v + 1) % count), wait)
    return () => clearTimeout(t)
  }, [i, tick, active, count, duration, delay])
  const next = useCallback(() => { setI((v) => (v + 1) % count); setTick((t) => t + 1) }, [count])
  return [i, next]
}

/** true while the element is on screen */
export function useInView(ref, threshold = 0.25) {
  const [inView, set] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const io = new IntersectionObserver(([e]) => set(e.isIntersecting), { threshold })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [ref, threshold])
  return inView
}
