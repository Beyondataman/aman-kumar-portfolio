import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { animate } from 'animejs'
import { companies } from '../data/companies'
import { income, YEARS } from '../cases/nvidia/data'
import { load, save } from '../lib/persist'
import { live, kick } from '../lib/live'
import { revealPage, useGo } from '../lib/nav'
import SiteNav, { pageLinks } from '../components/SiteNav'
import { profile } from '../data/profile'
import HScrollTrack from '../templates/HScrollTrack'
import { MotionRoot } from '../motion/motion'
import { prefersReduced, useSplitReveal } from '../motion/anime'
import { pad2, rich } from '../templates/rich'

/** Figures shown on a panel must come from a sourced case dataset. */
const PREVIEW = {
  nvidia: { label: `Revenue, ${YEARS[0]}–${YEARS[YEARS.length - 1]} · USD`, values: YEARS.map((y) => ({ y, v: income[y].revenue })) },
}

/**
 * THE ANALYTICS HALL (route "/hall") — a horizontal gallery of company panels.
 * Desktop: the page pins and scrolling moves the shelf sideways; phones: a
 * swipe row. Opening a live case grows its panel to full screen, then the
 * dashboard loads behind it. The scroll position is restored on return.
 */
export default function Hall() {
  const go = useGo()
  const location = useLocation()
  const navType = useNavigationType()
  const head = useRef(null)
  useSplitReveal(head, { split: 'words', on: 'mount', step: 110, delay: 150 })

  // restore the shelf position when coming back from a dashboard (or Back/Forward)
  useLayoutEffect(() => {
    const saved = load('hall2')
    const back = navType === 'POP' || location.state?.from === 'workspace'
    window.scrollTo(0, back && saved ? saved.y : 0)
    requestAnimationFrame(() => { if (back && saved) window.scrollTo(0, saved.y) })
    revealPage()
    const onScroll = () => { if (live.route === 'hall') save('hall2', { y: window.scrollY }) } // ignore the next page's scroll reset
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key])

  // swipe row (phones): the 3D islands follow the panels, so render while it moves
  useEffect(() => {
    const row = document.querySelector('.hall2-track .t-track-row')
    if (!row) return
    const on = () => kick(500)
    row.addEventListener('scroll', on, { passive: true })
    return () => row.removeEventListener('scroll', on)
  }, [])

  const open = useCallback((c, el) => {
    if (!c.caseStudy) return
    save('hall2', { y: window.scrollY })
    import('./Workspace') // warm the dashboard chunk while the panel expands
    const to = `/workspace/${c.id}`
    if (!el || prefersReduced()) { go(to, { state: { from: 'hall' } }); return }
    // grow a copy of the panel to cover the screen, then hand over to the dashboard
    const r = el.getBoundingClientRect()
    const ghost = document.createElement('div')
    ghost.className = 'hall-ghost'
    Object.assign(ghost.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` })
    document.body.appendChild(ghost)
    animate(ghost, {
      left: 0, top: 0, width: window.innerWidth, height: window.innerHeight, borderRadius: [26, 0],
      duration: 620, ease: 'inOut(3)',
      onComplete: () => {
        go(to, { state: { from: 'hall' } }, 0)
        setTimeout(() => ghost.remove(), 700)
      },
    })
  }, [go])

  return (
    <MotionRoot>
      <main className="pg hall2">
        <SiteNav links={pageLinks(go, 'hall')} cta={{ label: 'Email me ↗', onClick: () => { window.location.href = `mailto:${profile.contact.email}` } }} onName={() => go('/', { state: { resume: true } })} />
        <HScrollTrack
          className="hall2-track"
          label="Companies"
          intro={
            <div className="hall2-intro">
              <p className="h-kicker">Case studies</p>
              <h1 ref={head} className="h-giant hall2-title">{rich('The Analytics|*Hall*')}</h1>
              <p className="hall2-lede">Company case studies built from primary filings. NVIDIA is open now; the rest are being researched.</p>
              <p className="hall2-legend"><span><i className="dot" /> Case study live</span><span><i className="dot dot--hollow" /> In progress</span></p>
            </div>
          }
          items={companies}
          renderPanel={(c, i, { active }) => <CompanyPanel c={c} i={i} active={active} onOpen={open} />}
        />
      </main>
    </MotionRoot>
  )
}

function CompanyPanel({ c, i, active, onOpen }) {
  const ref = useRef(null)
  const p = PREVIEW[c.id]
  const max = p ? Math.max(...p.values.map((d) => d.v)) : 1
  const Tag = c.caseStudy ? 'button' : 'article'
  return (
    <Tag
      ref={ref}
      className={`cp ${c.caseStudy ? 'cp--live' : ''} ${active ? 'is-active' : ''}`}
      onPointerEnter={() => { live.hall.hovered = c.id; kick(1500) }}
      onPointerLeave={() => { if (live.hall.hovered === c.id) live.hall.hovered = null }}
      {...(c.caseStudy ? { onClick: () => onOpen(c, ref.current), 'aria-label': `Open the ${c.name} case study` } : {})}
    >
      <div className="cp-top">
        <span className="mono cp-n">{pad2(i + 1)}</span>
        <span className="mono cp-ticker">{c.ticker}</span>
        <span className={`cp-status ${c.caseStudy ? 'is-live' : ''}`}><i className={`dot ${c.caseStudy ? '' : 'dot--hollow'}`} />{c.caseStudy ? 'Case study live' : 'In progress'}</span>
      </div>
      {/* the company's floating cube island (three/HallWorld) renders behind this slot */}
      <div className="cp-stage" aria-hidden="true" ref={(el) => { if (el) live.hall.slots.set(c.id, el); else live.hall.slots.delete(c.id) }} />
      <h2 className="cp-name">{c.name}</h2>
      <p className="cp-sector">{c.sector}</p>
      <p className="cp-desc">{c.description}</p>
      {p ? (
        <div className="cp-preview">
          <span className="mono cp-plabel">{p.label}</span>
          <div className="cp-bars">
            {p.values.map((d, k) => (
              <span key={d.y} className="cp-bar" style={{ '--h': d.v / max, '--k': k }}>
                <i /><em className="mono">{d.y}</em>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="cp-wait mono">Figures will be added from the company's filings.</p>
      )}
      <div className="cp-foot">
        {c.caseStudy ? <span className="h-pill h-pill--solid cp-open">Open case study ↗</span> : <span className="cp-soon mono">Coming soon</span>}
      </div>
    </Tag>
  )
}
