import { Children, isValidElement, useEffect, useRef, useState } from 'react'
import { useReveal, useScrub } from '../motion/anime'
import PageHero from './PageHero'
import { pad2, rich } from './rich'

/**
 * TEMPLATE — CaseStudyLayout
 * --------------------------------------------------------------
 * One standard layout for project and company pages:
 *   hero → facts strip → numbered sections (Problem → Approach → Evidence → Outcome)
 * with a sticky section rail on desktop that tracks reading progress.
 *
 *   <CaseStudyLayout
 *     top={<button className="btn btn--ghost btn--sm">← Back</button>}
 *     hero={{ kicker: 'Case study', title: 'From *graphics* to AI', lede: '…' }}
 *     facts={[{ label: 'Role', value: '…' }, …]}
 *     footer={<…/>}
 *   >
 *     <CaseSection id="problem" label="Problem" title="…">…</CaseSection>
 *     <CaseSection id="approach" label="Approach"><Steps items={[…]} /></CaseSection>
 *     <CaseSection id="evidence" label="Evidence"><LineDraw … /></CaseSection>
 *     <CaseSection id="outcome" label="Outcome">…</CaseSection>
 *   </CaseStudyLayout>
 *
 * Sections are numbered automatically in order.
 */
export default function CaseStudyLayout({ top, hero, facts, children, footer, className = '' }) {
  const sections = Children.toArray(children).filter(isValidElement)
  const rail = useRef(null)
  const body = useRef(null)
  const [active, setActive] = useState(sections[0]?.props.id)

  // rail progress line follows reading position through the body (Anime.js scroll sync)
  useScrub(body, () => rail.current ? [rail.current.querySelector('.cs-rail-line i')] : [], () => ({ scaleY: [0, 1] }), {
    enter: 'center top', leave: 'center bottom', sync: 0.25,
  })

  // active section = last one whose top passed 40% of the viewport
  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.props.id)).filter(Boolean)
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (vis[0]) setActive(vis[0].target.id)
    }, { rootMargin: '-40% 0px -55% 0px' })
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections.length])

  const factsRef = useRef(null)
  useReveal(factsRef, { selector: ':scope > div', step: 70, on: 'mount', delay: 700 })

  return (
    <main className={`page cs ${className}`}>
      {top && <div className="cs-top">{top}</div>}
      <PageHero size="l" {...hero} />
      {facts?.length > 0 && (
        <dl ref={factsRef} className="cs-facts">
          {facts.map((f) => (
            <div key={f.label}><dt className="mono">{f.label}</dt><dd>{f.value}</dd></div>
          ))}
        </dl>
      )}
      <div className="cs-body" ref={body}>
        <nav className="cs-rail" ref={rail} aria-label="Sections">
          <span className="cs-rail-line" aria-hidden="true"><i /></span>
          <ol>
            {sections.map((s, i) => (
              <li key={s.props.id} className={active === s.props.id ? 'is-active' : ''}>
                <a href={`#${s.props.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(s.props.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>
                  <span className="mono">{pad2(i + 1)}</span> {s.props.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="cs-sections">
          {sections.map((s, i) => <s.type key={s.props.id} {...s.props} n={i + 1} />)}
        </div>
      </div>
      {footer && <footer className="cs-foot">{footer}</footer>}
    </main>
  )
}

export function CaseSection({ id, n, label, title, lede, children, wide = false }) {
  const ref = useRef(null)
  useReveal(ref, { selector: '[data-reveal], .cs-content > *', step: 80 })
  return (
    <section id={id} ref={ref} className={`cs-sec ${wide ? 'cs-sec--wide' : ''}`} aria-labelledby={`${id}-h`}>
      <p className="kicker" data-reveal><span className="mono">{pad2(n ?? 1)}</span>{label}</p>
      {title && <h2 id={`${id}-h`} className="cs-sec-title" data-reveal>{rich(title)}</h2>}
      {!title && <h2 id={`${id}-h`} className="sr-only">{label}</h2>}
      {lede && <p className="body-l muted" data-reveal>{lede}</p>}
      <div className="cs-content">{children}</div>
    </section>
  )
}

/**
 * Numbered steps joined by a line that draws itself as you reach them.
 * items = [{ title, text, detail? (node) }]
 */
export function Steps({ items }) {
  const ref = useRef(null)
  // the connecting line grows with scroll while the steps pass through the viewport
  useScrub(ref, (root) => [root.querySelector('.t-steps-line i')], () => ({ scaleY: [0, 1] }), {
    enter: 'bottom top', leave: 'center bottom', sync: 0.3,
  })
  return (
    <div ref={ref} className="t-steps">
      <span className="t-steps-line" aria-hidden="true"><i /></span>
      <ol>
        {items.map((s, i) => (
          <li key={s.title}>
            <span className="t-steps-n mono">{pad2(i + 1)}</span>
            <div>
              <h3>{rich(s.title)}</h3>
              {s.text && <p className="muted">{s.text}</p>}
              {s.detail}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

/** Numbered source list for evidence. sources = [{ label, url, note? }] */
export function Sources({ items }) {
  return (
    <ol className="cs-sources">
      {items.map((s, i) => (
        <li key={s.url ?? s.label}>
          <span className="mono muted">[{i + 1}]</span>{' '}
          {s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.label} ↗</a> : s.label}
          {s.note && <span className="muted"> — {s.note}</span>}
        </li>
      ))}
    </ol>
  )
}
