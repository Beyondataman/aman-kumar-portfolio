import { useEffect, useRef, useState } from 'react'
import { animate, onScroll, prefersReduced, useAnime, useReveal } from '../motion/anime'
import { Card } from './CardGrid'
import { pad2 } from './rich'

const pinnable = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(min-width: 900px) and (pointer: fine)').matches &&
  !prefersReduced()

/**
 * TEMPLATE — HScrollTrack
 * --------------------------------------------------------------
 * A horizontal shelf of panels.
 *  - Desktop (fine pointer, ≥ 900px): the section pins and vertical scroll
 *    moves the track sideways (Anime.js onScroll, synced to scroll).
 *  - Phones / tablets / reduced motion: a native swipeable row with
 *    scroll-snap — no pinning, no scroll-jacking, nothing extra to render.
 *
 *   <HScrollTrack
 *     label="Selected work"                 // small label in the progress bar
 *     intro={<PageHero … />}                // optional first panel (text)
 *     items={[…]}
 *     renderPanel={(item, i, { active }) => …}   // default: a large Card
 *   />
 */
export default function HScrollTrack({ items, renderPanel, intro, label, className = '', onActive }) {
  const section = useRef(null)
  const track = useRef(null)
  const bar = useRef(null)
  const [pin, setPin] = useState(pinnable)
  const [active, setActive] = useState(0)
  const activeRef = useRef(0)
  const dist = useRef(0)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px) and (pointer: fine)')
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setPin(pinnable())
    mq.addEventListener?.('change', on)
    rm.addEventListener?.('change', on)
    return () => { mq.removeEventListener?.('change', on); rm.removeEventListener?.('change', on) }
  }, [])

  const setIndex = (i) => {
    if (i === activeRef.current) return
    activeRef.current = i
    setActive(i)
    onActive?.(i)
  }

  // pinned mode: section height = viewport + horizontal distance; progress → translateX
  useAnime(section, (root) => {
    const el = track.current
    if (!pin) {
      root.style.height = ''
      el.style.transform = ''
      return
    }
    const panels = () => [...el.querySelectorAll(':scope > .t-panel')]
    let observer
    const measure = () => {
      dist.current = Math.max(0, el.scrollWidth - window.innerWidth)
      root.style.height = `${window.innerHeight + dist.current}px`
      observer?.refresh()
    }
    measure()
    const state = { p: 0 }
    const apply = () => {
      const x = -state.p * dist.current
      el.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`
      if (bar.current) bar.current.style.transform = `scaleX(${state.p.toFixed(4)})`
      // active panel = the one whose centre is nearest the viewport centre
      const mid = -x + window.innerWidth / 2
      const ps = panels()
      let best = 0, bestD = Infinity
      ps.forEach((p, i) => {
        const d = Math.abs(p.offsetLeft + p.offsetWidth / 2 - mid)
        if (d < bestD) { bestD = d; best = i }
      })
      setIndex(intro ? Math.max(0, best - 1) : best)
    }
    observer = onScroll({ target: root, enter: 'top top', leave: 'bottom bottom', sync: 0.18 })
    animate(state, { p: [0, 1], ease: 'linear', duration: 1000, autoplay: observer, onUpdate: apply })
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
      root.style.height = ''
      el.style.transform = ''
    }
  }, [pin, items.length, !!intro])

  // native mode: track which panel is centred
  useEffect(() => {
    if (pin) return
    const el = track.current
    let raf = 0
    const onS = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const mid = el.scrollLeft + el.clientWidth / 2
        const ps = [...el.querySelectorAll(':scope > .t-panel')]
        let best = 0, bestD = Infinity
        ps.forEach((p, i) => { const d = Math.abs(p.offsetLeft + p.offsetWidth / 2 - mid); if (d < bestD) { bestD = d; best = i } })
        setIndex(intro ? Math.max(0, best - 1) : best)
        if (bar.current) bar.current.style.transform = `scaleX(${(el.scrollLeft / Math.max(1, el.scrollWidth - el.clientWidth)).toFixed(4)})`
      })
    }
    el.addEventListener('scroll', onS, { passive: true })
    onS()
    return () => { cancelAnimationFrame(raf); el.removeEventListener('scroll', onS) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, items.length])

  // keyboard: focusing an off-screen panel scrolls the page so it comes into view
  const onFocus = (e) => {
    if (!pin) return
    const p = e.target.closest('.t-panel')
    if (!p || !dist.current) return
    const target = Math.min(1, Math.max(0, (p.offsetLeft + p.offsetWidth / 2 - window.innerWidth / 2) / dist.current))
    const top = section.current.offsetTop + target * dist.current
    window.scrollTo({ top, behavior: 'auto' })
  }

  const enter = useRef(null)
  useReveal(enter, { selector: ':scope > .t-panel', step: 90, y: 40, on: 'view' }, [items.length, pin])

  return (
    <section ref={section} className={`t-track ${pin ? 't-track--pin' : 't-track--native'} ${className}`}>
      <div className="t-track-sticky">
        <div ref={(n) => { track.current = n; enter.current = n }} className="t-track-row" onFocus={onFocus}>
          {intro && <div className="t-panel t-panel--intro">{intro}</div>}
          {items.map((it, i) => (
            <div className={`t-panel ${active === i ? 'is-active' : ''}`} key={it.id ?? i}>
              {renderPanel ? renderPanel(it, i, { active: active === i }) : <Card {...it} n={i + 1} className="t-card--panel" />}
            </div>
          ))}
        </div>
        <div className="t-track-meta" aria-hidden="true">
          {label && <span className="mono">{label}</span>}
          <span className="t-track-bar"><i ref={bar} /></span>
          <span className="mono">{pad2(Math.min(active + 1, items.length))} / {pad2(items.length)}</span>
        </div>
      </div>
    </section>
  )
}
