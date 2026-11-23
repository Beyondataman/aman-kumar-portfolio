/**
 * MOTION FOR REACT LAYER (`motion` package, motion.dev)
 * --------------------------------------------------------------
 * Motion handles interaction and component-level motion: hover/press,
 * magnetic buttons, presence (mount/unmount) and layout transitions.
 * Anime.js (./anime.js) handles timelines, text splitting, SVG drawing
 * and scroll-linked work.
 *
 * LazyMotion + `m.*` keeps the shipped Motion code small: the domAnimation
 * feature bundle is fetched on demand (./features.js), not in the first load.
 * MotionConfig reducedMotion="user" disables transform/layout animation for
 * visitors who ask the OS for reduced motion.
 */
import { useRef } from 'react'
import { AnimatePresence, LazyMotion, MotionConfig, m, useMotionValue, useSpring } from 'motion/react'

export const EASE = [0.2, 0.8, 0.2, 1]
const loadFeatures = () => import('./features').then((r) => r.default)

export const SPRING = { type: 'spring', stiffness: 320, damping: 28, mass: 0.7 }

/** Wrap each page that uses Motion (kept off the story's first bundle on purpose). */
export function MotionRoot({ children }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.6, ease: EASE }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  )
}

/** Hover lift + press for cards and panels. `as` is any HTML tag name. */
export function Lift({ as = 'div', y = -6, children, ...rest }) {
  const C = m[as]
  return (
    <C whileHover={{ y }} whileTap={{ scale: 0.985 }} transition={SPRING} {...rest}>
      {children}
    </C>
  )
}

/** Button/link that leans toward the pointer while hovered. */
export function Magnetic({ as = 'button', strength = 0.28, children, className, ...rest }) {
  const ref = useRef(null)
  const x = useSpring(useMotionValue(0), SPRING)
  const y = useSpring(useMotionValue(0), SPRING)
  const C = m[as]
  const onMove = (e) => {
    if (e.pointerType !== 'mouse') return
    const r = ref.current.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * strength)
    y.set((e.clientY - (r.top + r.height / 2)) * strength)
  }
  const reset = () => { x.set(0); y.set(0) }
  return (
    <C ref={ref} className={className} style={{ x, y }} onPointerMove={onMove} onPointerLeave={reset} whileTap={{ scale: 0.96 }} {...rest}>
      {children}
    </C>
  )
}

/** Mount/unmount with a short fade + rise (menus, notices, tooltips). */
export function Presence({ show, children, y = 8, className, ...rest }) {
  return (
    <AnimatePresence>
      {show && (
        <m.div className={className} initial={{ opacity: 0, y }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: y / 2 }} transition={{ duration: 0.28, ease: EASE }} {...rest}>
          {children}
        </m.div>
      )}
    </AnimatePresence>
  )
}

export { m, AnimatePresence }
