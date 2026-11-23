import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { live, kick } from '../lib/live'
import { load, save } from '../lib/persist'
import { revealPage, useBack, useGo } from '../lib/nav'
import { caseStudies, companyById } from '../data/companies'
import '../styles/workspace.css'

/**
 * COMPANY ANALYTICAL WORKSPACE (route "/workspace/:companyId").
 * The selected view and filters live in the URL (?view=&from=&to=&unit=&hide=)
 * and in session storage, so they survive Hall ↔ Workspace round trips,
 * reloads and browser back/forward. View changes never reload the page.
 */
export default function Workspace() {
  const { companyId } = useParams()
  const company = companyById[companyId]
  const location = useLocation()
  const go = useGo()
  const back = useBack()
  const [params, setParams] = useSearchParams()
  const [mod, setMod] = useState(null)
  const [error, setError] = useState(null)
  const saved = useMemo(() => load(`ws:${companyId}`) || {}, [companyId])
  const [collapsed, setCollapsed] = useState(!!saved.collapsed)
  const canvasRef = useRef(null)

  // the dashboard (and its charting library) is downloaded only now
  useEffect(() => {
    let alive = true
    setMod(null)
    if (company?.caseStudy && caseStudies[companyId]) {
      caseStudies[companyId]()
        .then((m) => { if (alive) { setMod(m); useStore.getState().setWsBars(m.bars) } })
        .catch((e) => alive && setError(e))
    }
    return () => { alive = false }
  }, [companyId, company])

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
    live.workspace.enterStart = performance.now()
    kick(2400)
    revealPage()
  }, [location.pathname])

  const years = mod?.years ?? []
  const view = params.get('view') || saved.view || 'overview'
  const filters = {
    from: params.get('from') || saved.from || years[0],
    to: params.get('to') || saved.to || years[years.length - 1],
    unit: params.get('unit') || saved.unit || 'usd',
    hide: (params.get('hide') ?? saved.hide ?? '').split(',').filter(Boolean),
  }

  const toParams = (v, f) => {
    const p = new URLSearchParams()
    p.set('view', v)
    if (f.from) p.set('from', f.from)
    if (f.to) p.set('to', f.to)
    p.set('unit', f.unit)
    if (f.hide.length) p.set('hide', f.hide.join(','))
    return p
  }

  // on first load make the URL reflect the restored state (replace — no extra history entries)
  useEffect(() => {
    if (mod && !params.get('view')) setParams(toParams(view, filters), { replace: true, state: location.state })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mod])

  useEffect(() => {
    if (!mod) return
    save(`ws:${companyId}`, { view, from: filters.from, to: filters.to, unit: filters.unit, hide: filters.hide.join(','), collapsed })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, collapsed, mod])

  const setView = (id) => {
    setParams(toParams(id, filters), { replace: true, state: location.state })
    kick(900)
    const top = canvasRef.current?.getBoundingClientRect().top ?? 0
    if (top < 0) window.scrollTo({ top: window.scrollY + top - 90, behavior: live.reducedMotion ? 'auto' : 'smooth' })
  }
  const setFilter = (key, value) => {
    const f = { ...filters, [key]: value }
    if (years.indexOf(f.from) > years.indexOf(f.to)) {
      if (key === 'from') f.to = f.from
      else f.from = f.to
    }
    setParams(toParams(view, f), { replace: true, state: location.state })
  }

  const toHall = () => {
    if (location.state?.from === 'hall' && window.history.state?.idx > 0) back()
    else go('/hall', { state: { from: 'workspace' } })
  }
  const toStory = () => go('/', { state: { resume: true } })

  if (!company || !company.caseStudy) {
    return (
      <main className="page page--center ws-missing">
        <p className="mono muted">{company ? `${company.ticker} · ${company.sector}` : '404'}</p>
        <h1 className="display-m">{company ? `${company.name} — case study in progress` : 'Company not found'}</h1>
        <p className="muted">{company ? 'This company is in the Hall, but its analysis is not published yet.' : 'There is no workspace at this address.'}</p>
        <div className="row">
          <button className="btn" onClick={() => go('/hall', { state: { from: 'workspace' } })}>← Return to Analytics Hall</button>
          <button className="btn btn--ghost" onClick={toStory}>Back to Home</button>
        </div>
      </main>
    )
  }

  const SECTIONS = mod?.SECTIONS ?? []
  const active = Math.max(0, SECTIONS.findIndex((s) => s.id === view))
  const View = mod?.VIEWS?.[view] ?? mod?.VIEWS?.overview
  const relevant = mod?.FILTERS_FOR?.[view] ?? []

  return (
    <main className="ws">
      <header className="ws-top">
        <nav className="crumbs mono" aria-label="Breadcrumb">
          <button onClick={toHall}>Analytics Hall</button> <span aria-hidden="true">/</span> <span aria-current="page">{company.name}</span>
        </nav>
        <div className="ws-title">
          <p className="mono muted">{mod?.meta.ticker ?? company.ticker} · {mod?.meta.asOf ?? ''}</p>
          <h1>{company.name}<span className="muted"> — {mod?.meta.title ?? 'loading…'}</span></h1>
        </div>
        <div className="ws-actions">
          <button className="btn btn--ghost btn--sm" onClick={toHall}>← Return to Analytics Hall</button>
          <button className="btn btn--ghost btn--sm" onClick={toStory}>Back to Home</button>
        </div>
      </header>

      {error && <p className="card">Could not load this case study. <button className="link-arrow" onClick={() => window.location.reload()}>Retry</button></p>}

      <div className={`ws-body ${collapsed ? 'is-collapsed' : ''}`}>
        <Sidebar sections={SECTIONS} active={active} onSelect={setView} collapsed={collapsed} onToggle={() => { setCollapsed((v) => !v); kick(600) }} />

        <section ref={canvasRef} className="ws-canvas" aria-labelledby="ws-view-title">
          {mod ? (
            <>
              <div className="ws-view-head">
                <p className="kicker"><span className="mono">{String(active + 1).padStart(2, '0')} / {String(SECTIONS.length).padStart(2, '0')}</span></p>
                <h2 id="ws-view-title" className="display-s">{SECTIONS[active]?.label}</h2>
              </div>
              <FilterBar relevant={relevant} filters={filters} setFilter={setFilter} years={years} platforms={mod.PLATFORMS} />
              <div className="ws-view" key={view}>
                <View filters={filters} setFilter={setFilter} />
              </div>
            </>
          ) : (
            <div className="ws-loading" role="status"><span className="mono">opening workspace…</span></div>
          )}
        </section>
      </div>
    </main>
  )
}

/** Spatial instrument sidebar: segmented, curved in depth, active segment pushed forward. */
function Sidebar({ sections, active, onSelect, collapsed, onToggle }) {
  return (
    <nav className={`ws-side ${collapsed ? 'is-collapsed' : ''}`} aria-label="Analysis views">
      <div className="ws-rail">
        {sections.map((s, i) => {
          const d = i - active
          const ad = Math.abs(d)
          const style = {
            transform: `translateX(${ad * 3}px) translateZ(${d === 0 ? 40 : Math.max(0, 18 - ad * 2.5)}px) rotateY(${d * -1.6}deg) rotateX(${d * 1.2}deg)`,
            opacity: Math.max(0.55, 1 - ad * 0.06),
          }
          return (
            <button
              key={s.id}
              className={`seg ${d === 0 ? 'is-active' : ''}`}
              style={style}
              onClick={() => onSelect(s.id)}
              aria-current={d === 0 ? 'page' : undefined}
              title={s.label}
            >
              <span className="seg-n mono">{String(i + 1).padStart(2, '0')}</span>
              <span className="seg-label">{s.label}</span>
            </button>
          )
        })}
      </div>
      <button className="ws-collapse mono" onClick={onToggle} aria-expanded={!collapsed} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
        {collapsed ? '»' : '« collapse'}
      </button>
    </nav>
  )
}

function FilterBar({ relevant, filters, setFilter, years, platforms }) {
  if (!relevant.length) return <div className="filters filters--none mono muted">No filters for this view</div>
  return (
    <div className="filters" role="group" aria-label="Filters">
      {relevant.includes('years') && (
        <div className="filter">
          <span className="filter-label">Fiscal years</span>
          <select aria-label="From fiscal year" value={filters.from} onChange={(e) => setFilter('from', e.target.value)}>
            {years.map((y) => <option key={y}>{y}</option>)}
          </select>
          <span className="muted">to</span>
          <select aria-label="To fiscal year" value={filters.to} onChange={(e) => setFilter('to', e.target.value)}>
            {years.map((y) => <option key={y}>{y}</option>)}
          </select>
        </div>
      )}
      {relevant.includes('unit') && (
        <div className="filter seg-toggle" role="radiogroup" aria-label="Unit">
          <span className="filter-label">Show</span>
          {[['usd', '$ billions'], ['share', '% of revenue']].map(([v, l]) => (
            <button key={v} role="radio" aria-checked={filters.unit === v} className={filters.unit === v ? 'is-on' : ''} onClick={() => setFilter('unit', v)}>{l}</button>
          ))}
        </div>
      )}
      {relevant.includes('platforms') && (
        <div className="filter">
          <span className="filter-label">Platforms</span>
          {platforms.map((p) => {
            const on = !filters.hide.includes(p.key)
            return (
              <button key={p.key} className={`chip ${on ? 'is-on' : ''}`} aria-pressed={on}
                onClick={() => setFilter('hide', on ? [...filters.hide, p.key] : filters.hide.filter((h) => h !== p.key))}>
                <i style={{ background: p.color }} aria-hidden="true" /> {p.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
