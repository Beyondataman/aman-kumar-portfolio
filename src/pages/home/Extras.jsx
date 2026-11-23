import { useEffect, useMemo, useRef, useState } from 'react'
import { home } from '../../data/profile'
import { rich } from '../../templates/rich'
import { useSplitReveal } from '../../motion/anime'
import MosaicLogo from './MosaicLogo'

// every logo file in src/assets/logos, keyed by file name (bundled → works offline too)
const FILES = import.meta.glob('../../assets/logos/*.{png,svg,webp}', { eager: true, query: '?url', import: 'default' })
const LOGOS = Object.fromEntries(Object.entries(FILES).map(([path, url]) => [path.split('/').pop().replace(/\.\w+$/, ''), url]))

const SWAP_MS = 1500 // one tile changes this often
const STAGGER_MS = 140 // first reveal: tiles appear one after another

const shuffle = (a) => {
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] }
  return b
}

/**
 * EXTRAS — the banner skills plus extras as mosaic tiles.
 * A fixed grid of slots: on first view the tiles assemble one after another,
 * then every SWAP_MS a random tile dissolves and another skill assembles in
 * its place (random transition style), so every skill comes round in turn.
 * Pauses while hovered (to read), off-screen, or in a hidden tab.
 * Reduced motion: a static grid of every skill.
 */
export default function Extras() {
  const root = useRef(null)
  const head = useRef(null)
  useSplitReveal(head, { split: 'words', on: 'view', step: 100 })

  const all = useMemo(() => home.extras.flatMap((g) => g.items.map((it) => ({ ...it, group: g.label }))), [])
  const reduced = useMemo(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches, [])
  const [slots, setSlots] = useState(() => (window.matchMedia?.('(max-width: 560px)').matches ? 6 : 9))
  const [shown, setShown] = useState(null) // item index per slot (null until first in view)
  const [started, setStarted] = useState(false)
  const firstHand = useRef(true) // the first deal reveals tiles one after another

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 560px)')
    const on = () => setSlots(mq.matches ? 6 : 9)
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [])

  // deal the first hand when the panel is first seen
  useEffect(() => {
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { setStarted(true); io.disconnect() }
    }, { rootMargin: '0px 0px -15% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    const order = shuffle(all.map((_, i) => i))
    setShown(order.slice(0, slots))
    const t = setTimeout(() => { firstHand.current = false }, slots * STAGGER_MS + 200)
    return () => clearTimeout(t)
  }, [started, slots, all])

  // swap loop
  useEffect(() => {
    if (!shown || reduced || all.length <= slots) return
    const el = root.current
    let visible = true, hovered = false, recent = []
    const io = new IntersectionObserver((es) => { visible = es.some((e) => e.isIntersecting) })
    io.observe(el)
    const enter = () => { hovered = true }
    const leave = () => { hovered = false }
    el.addEventListener('pointerenter', enter)
    el.addEventListener('pointerleave', leave)
    let queue = []
    const id = setInterval(() => {
      if (!visible || hovered || document.hidden) return
      setShown((cur) => {
        if (!cur) return cur
        // next skill: from a shuffled queue of the ones not on screen
        queue = queue.filter((i) => !cur.includes(i))
        if (!queue.length) queue = shuffle(all.map((_, i) => i).filter((i) => !cur.includes(i)))
        const nextItem = queue.shift()
        const choices = cur.map((_, s) => s).filter((s) => !recent.includes(s))
        const slot = choices[Math.floor(Math.random() * choices.length)]
        recent = [slot, ...recent].slice(0, Math.min(3, cur.length - 1))
        const out = [...cur]
        out[slot] = nextItem
        return out
      })
    }, SWAP_MS)
    return () => {
      clearInterval(id); io.disconnect()
      el.removeEventListener('pointerenter', enter); el.removeEventListener('pointerleave', leave)
    }
  }, [shown === null, reduced, all, slots]) // eslint-disable-line react-hooks/exhaustive-deps

  const items = reduced ? all.map((_, i) => i) : shown ?? []

  return (
    <div ref={root} className="ex">
      <h3 ref={head} className="h-giant ex-title">{rich(home.extrasTitle)}</h3>
      <div className={`ex-frame ${reduced ? 'is-static' : ''}`}>
        <ul className="ex-grid" aria-label="Extra skills">
          {(reduced ? items : Array.from({ length: slots }, (_, s) => items[s])).map((i, s) => {
            const it = i == null ? null : all[i]
            return (
              <li key={reduced ? i : s} className="ex-tile">
                {it && (
                  <>
                    <MosaicLogo src={LOGOS[it.logo]} icon={it.icon ?? 'terminal'} size={80} delay={firstHand.current ? s * STAGGER_MS : 0} />
                    <NameSwap item={it} delay={(firstHand.current ? s * STAGGER_MS : 380) + 300} />
                  </>
                )}
              </li>
            )
          })}
        </ul>
        {/* every skill, for screen readers (the grid only shows some at a time) */}
        <p className="sr-only">{all.map((it) => it.name + (it.note ? ` (${it.note})` : '')).join(', ')}</p>
      </div>
    </div>
  )
}

/** the tile's caption: the old name blurs away while the logo dissolves, the new one rises in */
function NameSwap({ item, delay }) {
  const [pair, setPair] = useState({ cur: item, prev: null })
  useEffect(() => {
    setPair((p) => (p.cur.id === item.id ? p : { cur: item, prev: p.cur }))
    const t = setTimeout(() => setPair((p) => ({ ...p, prev: null })), 500)
    return () => clearTimeout(t)
  }, [item])
  const label = (it) => <>{it.name}{it.note && <em> {it.note}</em>}</>
  return (
    <span className="ex-names">
      {pair.prev && <span className="ex-name is-leaving" key={`out-${pair.prev.id}`} aria-hidden="true">{label(pair.prev)}</span>}
      <span className="ex-name" key={pair.cur.id} style={{ animationDelay: `${delay}ms` }}>{label(pair.cur)}</span>
    </span>
  )
}
