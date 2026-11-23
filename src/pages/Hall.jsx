import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { useStore } from '../lib/store'
import { live, kick, snap } from '../lib/live'
import { load, save } from '../lib/persist'
import { revealPage, useBack, useGo } from '../lib/nav'
import { companies, companyById } from '../data/companies'

/**
 * EXPERIENCE B — THE ANALYTICS HALL (route "/hall").
 * The 3D gallery lives in the shared canvas (three/HallWorld). This page is
 * the DOM layer: title, navigation, hover card, accessible company index,
 * and the scroll track that moves the camera through the hall.
 */
export default function Hall() {
  const location = useLocation()
  const navType = useNavigationType()
  const go = useGo()
  const back = useBack()
  const hovered = useStore((s) => s.hallHovered)
  const selected = useStore((s) => s.hallSelected)
  const setHovered = useStore((s) => s.setHallHovered)
  const setSelected = useStore((s) => s.setHallSelected)
  const [notice, setNotice] = useState(null)
  const card = useRef(null)
  const bar = useRef(null)

  const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
  const update = useCallback(() => {
    const t = Math.min(1, Math.max(0, window.scrollY / maxScroll()))
    live.hall.t = t
    if (bar.current) bar.current.style.transform = `scaleX(${t})`
    save('hall', { t, selected: useStore.getState().hallSelected })
  }, [])

  // restore gallery position + selected company (also on browser back/forward)
  useLayoutEffect(() => {
    live.hall.entering = null
    const saved = load('hall')
    if (saved) {
      window.scrollTo(0, saved.t * maxScroll())
      setSelected(saved.selected ?? null)
    } else {
      window.scrollTo(0, 0)
    }
    update()
    snap(220)
    revealPage()
    void navType
    return () => {
      setHovered(null)
      document.body.style.cursor = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key])

  useEffect(() => {
    let raf = 0
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update() }) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll) }
  }, [update])

  // hover card follows the focused pillar (no React re-render per frame)
  useEffect(() => {
    let raf
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const p = live.hall.card
      if (!card.current || !p) return
      const w = card.current.offsetWidth, h = card.current.offsetHeight
      const x = Math.min(window.innerWidth - w - 16, Math.max(16, p.x + 12))
      const y = Math.min(window.innerHeight - h - 96, Math.max(96, p.y - h / 2))
      card.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const activate = useCallback((id) => {
    const c = companyById[id]
    if (!c || live.hall.entering) return
    setSelected(id)
    save('hall', { t: live.hall.t, selected: id })
    if (!c.caseStudy) {
      setNotice(id)
      kick(800)
      return
    }
    setHovered(id)
    live.hall.entering = id
    live.hall.enterStart = performance.now()
    kick(3000)
    import('./Workspace') // warm the dashboard chunk during the camera flight
    window.setTimeout(() => go(`/workspace/${id}`, { state: { from: 'hall' } }), 640)
  }, [go, setHovered, setSelected])

  useEffect(() => {
    useStore.setState({ hallActivate: activate })
    return () => useStore.setState({ hallActivate: null })
  }, [activate])

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), 3600)
    return () => clearTimeout(t)
  }, [notice])

  const returnToStory = () => {
    if (['home', 'story'].includes(location.state?.from) && window.history.state?.idx > 0) back()
    else go('/', { state: { resume: true } })
  }

  const hc = hovered ? companyById[hovered] : null

  return (
    <main className="hall">
      <header className="hall-head">
        <div>
          <p className="kicker"><span className="mono">B</span> Experience</p>
          <h1 className="display-m">The Analytics Hall</h1>
          <p className="muted hall-sub">Explore companies, investigate business performance, and discover the stories hidden inside data.</p>
        </div>
        <nav className="hall-nav">
          <button className="btn btn--ghost btn--sm" onClick={returnToStory}>← Back to Home</button>
        </nav>
      </header>

      <aside ref={card} className={`hall-card ${hc ? 'is-on' : ''}`} aria-hidden={!hc}>
        {hc && (
          <>
            <p className="mono muted">{hc.ticker} · {hc.sector}</p>
            <h2>{hc.name}</h2>
            <p className="hall-card-desc">{hc.description}</p>
            {hc.caseStudy ? (
              <p className="hall-card-status is-open"><span className="dot" /> Case study available <span className="kbd">click to enter ↵</span></p>
            ) : (
              <p className="hall-card-status"><span className="dot dot--hollow" /> Case study in progress</p>
            )}
          </>
        )}
      </aside>

      <div className={`hall-notice ${notice ? 'is-on' : ''}`} role="status" aria-live="polite">
        {notice && <><strong>{companyById[notice].name}</strong> — case study in progress. NVIDIA is open now; more companies are being researched.</>}
      </div>

      <footer className="hall-foot">
        <div className="hall-track"><i ref={bar} /></div>
        <p className="mono muted hall-hint">scroll to move through the hall · hover a pillar · click to enter</p>
        <ul className="hall-index" aria-label="Companies in the hall">
          {companies.map((c) => (
            <li key={c.id}>
              <button
                className={`hi-btn ${hovered === c.id ? 'is-hot' : ''} ${selected === c.id ? 'is-sel' : ''} ${c.caseStudy ? 'is-open' : ''}`}
                onPointerEnter={() => { setHovered(c.id); kick(1200) }}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => { setHovered(c.id); kick(1200) }}
                onBlur={() => setHovered(null)}
                onClick={() => activate(c.id)}
                aria-label={`${c.name}${c.caseStudy ? ' — open case study' : ' — case study in progress'}`}
              >
                <span className={`dot ${c.caseStudy ? '' : 'dot--hollow'}`} aria-hidden="true" />
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </footer>
      <div className="hall-scroll" aria-hidden="true" />
    </main>
  )
}
