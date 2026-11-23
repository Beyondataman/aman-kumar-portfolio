/**
 * ANIME.JS LAYER (v4)
 * --------------------------------------------------------------
 * Small React hooks around Anime.js for the site's motion vocabulary:
 *   useSplitReveal  – split a heading into words/chars and slide them up
 *   useReveal       – staggered fade/rise of children when they scroll into view
 *   useDraw         – SVG line drawing (createDrawable)
 *   useCountUp      – numbers that count to their value once visible
 *   useScrub        – an animation whose progress is tied to scroll (onScroll sync)
 *
 * Every hook is scoped (createScope → revert on unmount) and becomes a
 * no-op when the visitor prefers reduced motion: content is simply shown.
 */
import { useEffect, useLayoutEffect, useRef } from 'react'
import { animate, createScope, onScroll, splitText, stagger, svg, utils } from 'animejs'

export const EASE_OUT = 'outExpo'
export const EASE_SOFT = 'out(3)'

export const prefersReduced = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Run `cb` once when `el` scrolls into view. Returns a disposer. */
export function whenVisible(el, cb, { margin = '0px 0px -12% 0px', threshold = 0 } = {}) {
  if (!el) return () => {}
  if (!('IntersectionObserver' in window)) { cb(); return () => {} }
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); cb() }
  }, { rootMargin: margin, threshold })
  io.observe(el)
  return () => io.disconnect()
}

/**
 * Scoped Anime.js effect. `setup(root)` may return a cleanup function.
 * Uses a layout effect so initial (hidden) states are applied before paint.
 */
export function useAnime(ref, setup, deps = []) {
  const fn = useRef(setup)
  fn.current = setup
  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    const scope = createScope({ root })
    scope.add(() => fn.current(root))
    return () => scope.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/**
 * Split a heading into words (default), chars or lines, and slide each piece
 * up from behind a clip mask. `on: 'mount' | 'view'`.
 * Keep the element's children static (plain text / <em>): the split mutates the DOM.
 */
export function useSplitReveal(ref, { split = 'words', on = 'mount', delay = 0, step = 55, duration = 1200 } = {}, deps = []) {
  useAnime(ref, (el) => {
    if (prefersReduced()) return
    const splitter = splitText(el, { [split]: { wrap: 'clip' }, accessible: true })
    const parts = splitter[split]
    if (!parts?.length) return () => splitter.revert()
    utils.set(parts, { y: '110%' })
    // once settled, undo the split: the clip masks would otherwise crop italic
    // overhangs and tight letter-spacing at the edges of each word
    const play = () =>
      animate(parts, { y: ['110%', '0%'], duration, ease: EASE_OUT, delay: stagger(step, { start: delay }), onComplete: () => splitter.revert() })
    const stop = on === 'view' ? whenVisible(el, play) : (play(), () => {})
    return () => { stop(); splitter.revert() }
  }, deps)
}

/**
 * Staggered rise + fade for `selector` inside the root (or the root's direct
 * children when no selector is given) once the root is visible.
 */
export function useReveal(ref, { selector, on = 'view', y = 26, step = 70, delay = 0, duration = 1000 } = {}, deps = []) {
  useAnime(ref, (root) => {
    if (prefersReduced()) return
    const items = selector ? root.querySelectorAll(selector) : root.children
    if (!items.length) return
    utils.set(items, { opacity: 0, y })
    const play = () =>
      animate(items, { opacity: [0, 1], y: [y, 0], duration, ease: EASE_SOFT, delay: stagger(step, { start: delay }) })
    return on === 'view' ? whenVisible(root, play) : (play(), undefined)
  }, deps)
}

/** Draw every path/line/polyline matching `selector` when the root scrolls into view. */
export function useDraw(ref, { selector = '[data-draw]', duration = 1600, step = 120, delay = 0, after } = {}, deps = []) {
  useAnime(ref, (root) => {
    const paths = root.querySelectorAll(selector)
    if (!paths.length) return
    if (prefersReduced()) { after?.(root, true); return }
    const drawables = svg.createDrawable(paths)
    utils.set(drawables, { draw: '0 0' })
    const play = () => {
      animate(drawables, {
        draw: ['0 0', '0 1'], duration, ease: 'inOut(3)', delay: stagger(step, { start: delay }),
        onComplete: () => after?.(root, false),
      })
    }
    return whenVisible(root, play, { margin: '0px 0px -18% 0px' })
  }, deps)
}

/** Count a number up to `value` once visible. `format(n)` renders the text. */
export function useCountUp(ref, value, { duration = 1600, format = (n) => Math.round(n).toLocaleString('en-IN') } = {}) {
  const fmt = useRef(format)
  fmt.current = format
  useEffect(() => {
    const el = ref.current
    if (!el || typeof value !== 'number') return
    if (prefersReduced()) { el.textContent = fmt.current(value); return }
    const o = { v: 0 }
    el.textContent = fmt.current(0)
    let anim
    const stop = whenVisible(el, () => {
      anim = animate(o, { v: value, duration, ease: EASE_OUT, onUpdate: () => { el.textContent = fmt.current(o.v) } })
    })
    return () => { stop(); anim?.revert?.() }
  }, [ref, value, duration])
}

/**
 * Scroll-linked animation: `build(root)` returns Anime params for `targets`;
 * progress follows the scroll position of `root` between `enter` and `leave`
 * (Anime.js "container target" threshold syntax, e.g. 'top top').
 */
export function useScrub(ref, targets, build, { enter = 'bottom top', leave = 'top bottom', sync = 0.35 } = {}, deps = []) {
  useAnime(ref, (root) => {
    if (prefersReduced()) return
    const t = typeof targets === 'function' ? targets(root) : root.querySelectorAll(targets)
    if (!t || (t.length === 0)) return
    animate(t, {
      ...build(root),
      ease: 'linear',
      autoplay: onScroll({ target: root, enter, leave, sync }),
    })
  }, deps)
}

export { animate, stagger, utils, onScroll, splitText, svg }
