import { useEffect, useLayoutEffect, useRef } from 'react'
import { animate, stagger, utils } from 'animejs'
import { profile, home } from '../../data/profile'

/**
 * HERO — the mosaic portrait lives in the shared WebGL canvas (three/HeroWorld);
 * this is the DOM layer: the giant silver word across the bottom, the role
 * line under it, and the scroll / contact buttons.
 * `phase`: 'wait' (behind the preloader) → 'in' (animate) → 'done' (static, e.g. restored)
 */
export default function Hero({ ref, phase, onDown, onContact }) {
  const word = useRef(null)
  const meta = useRef(null)

  // the word always spans ~78% of the width (92% on phones), whatever the font metrics
  useLayoutEffect(() => {
    const fit = () => {
      const el = word.current
      if (!el) return
      el.style.fontSize = '100px'
      const w = el.scrollWidth
      const target = window.innerWidth * (window.innerWidth < 700 ? 0.92 : 0.78)
      el.style.fontSize = `${Math.min((100 * target) / Math.max(1, w), window.innerHeight * 0.34)}px`
    }
    fit()
    // refit once the display face has really loaded (fonts.ready can resolve before it starts)
    document.fonts?.load('900 100px "Inter Tight"').then(fit, () => {})
    document.fonts?.ready.then(fit)
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  useEffect(() => {
    const w = word.current, items = meta.current?.querySelectorAll('[data-in]')
    if (phase === 'wait') {
      utils.set(w, { opacity: 0.06 })
      utils.set(items, { opacity: 0, y: 24 })
      return
    }
    if (phase === 'done') {
      utils.set(w, { opacity: 1 })
      utils.set(items, { opacity: 1, y: 0 })
      return
    }
    // 'in': the word brightens from near-black, then the meta row rises
    const a = animate(w, { opacity: [0.06, 1], duration: 1500, ease: 'inOut(2)' })
    const b = animate(items, { opacity: [0, 1], y: [24, 0], duration: 900, ease: 'out(3)', delay: stagger(110, { start: 1700 }) })
    return () => { a.pause(); b.pause() }
  }, [phase])

  return (
    <section ref={ref} id="home" className="h-hero" aria-labelledby="hero-title">
      <h1 id="hero-title" className="sr-only">{profile.name} — {home.role.strong} {home.role.em}</h1>
      <div className="h-hero-inner">
        <div ref={word} className="h-word" aria-hidden="true">{home.heroWord}</div>
        <div ref={meta} className="h-meta">
          <p className="h-role" data-in>
            <strong>{home.role.strong}</strong> <em>{home.role.em}</em>
          </p>
          <div className="h-actions" data-in>
            <button className="h-circle" onClick={onDown} aria-label="Scroll to About">↙</button>
            <button className="h-pill" onClick={onContact}>Contact</button>
          </div>
        </div>
      </div>
    </section>
  )
}
