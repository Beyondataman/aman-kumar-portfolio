import { useEffect, useRef } from 'react'
import { home } from '../../data/profile'
import { rich } from '../../templates/rich'
import { useSplitReveal, useReveal } from '../../motion/anime'
import MosaicLogo from './MosaicLogo'

// every logo file in src/assets/logos, keyed by file name (bundled → works offline too)
const FILES = import.meta.glob('../../assets/logos/*.{png,svg,webp}', { eager: true, query: '?url', import: 'default' })
const LOGOS = Object.fromEntries(Object.entries(FILES).map(([path, url]) => [path.split('/').pop().replace(/\.\w+$/, ''), url]))

const SPEED = 22 // px per second
const IDLE_MS = 4000 // auto-scroll resumes this long after the visitor stops scrolling

/**
 * EXTRAS — skills from the LinkedIn banner plus extras, as mosaic logo tiles.
 * The list scrolls by itself; as soon as the visitor scrolls it (wheel, touch,
 * drag, keys) it hands over control, and resumes after a few idle seconds.
 * The content is rendered twice so the loop is seamless.
 */
export default function Extras() {
  const box = useRef(null)
  const head = useRef(null)
  const root = useRef(null)
  useSplitReveal(head, { split: 'words', on: 'view', step: 100 })
  useReveal(root, { selector: '[data-in]', on: 'view', step: 90, delay: 200 })

  useEffect(() => {
    const el = box.current
    if (!el) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let raf = 0, last = performance.now(), acc = 0, visible = false, manualUntil = 0
    const half = () => el.scrollHeight / 2
    const wrap = () => {
      const h = half()
      if (h <= 0) return
      if (el.scrollTop >= h) el.scrollTop -= h
      else if (el.scrollTop <= 0 && manualUntil) el.scrollTop += h
    }
    const loop = (t) => {
      raf = requestAnimationFrame(loop)
      const dt = Math.min(0.05, (t - last) / 1000)
      last = t
      if (!visible || reduced || t < manualUntil) { wrap(); return }
      acc += SPEED * dt
      if (acc >= 0.5) { el.scrollTop += acc; acc = 0 }
      wrap()
    }
    const manual = () => { manualUntil = performance.now() + IDLE_MS }
    const io = new IntersectionObserver((es) => { visible = es.some((e) => e.isIntersecting) })
    io.observe(el)
    const opts = { passive: true }
    el.addEventListener('wheel', manual, opts)
    el.addEventListener('touchstart', manual, opts)
    el.addEventListener('pointerdown', manual, opts)
    el.addEventListener('keydown', manual)
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf); io.disconnect()
      el.removeEventListener('wheel', manual); el.removeEventListener('touchstart', manual)
      el.removeEventListener('pointerdown', manual); el.removeEventListener('keydown', manual)
    }
  }, [])

  const list = (copy) => (
    <div className="ex-copy" aria-hidden={copy === 1 || undefined} inert={copy === 1 ? '' : undefined}>
      {home.extras.map((g) => (
        <section key={g.id} className="ex-group">
          <h4 className="ex-label"><strong>{g.label}</strong> {g.em && <em>{g.em}</em>}</h4>
          <ul className="ex-grid">
            {g.items.map((it) => (
              <li key={it.id} className="ex-tile">
                <MosaicLogo src={LOGOS[it.logo]} icon={it.icon ?? 'terminal'} size={80} />
                <span className="ex-name">{it.name}{it.note && <em> {it.note}</em>}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )

  return (
    <div ref={root} className="ex">
      <h3 ref={head} className="h-giant ex-title">{rich(home.extrasTitle)}</h3>
      <div className="ex-frame" data-in>
        <div ref={box} className="ex-scroll" tabIndex={0} aria-label="Extra skills (scrolls automatically; scroll to take control)">
          {list(0)}
          {list(1)}
        </div>
      </div>
    </div>
  )
}
