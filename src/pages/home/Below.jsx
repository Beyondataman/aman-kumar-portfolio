import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { MotionRoot, Magnetic, EASE } from '../../motion/motion'
import { useReveal, useSplitReveal } from '../../motion/anime'
import { profile, home, isTodo } from '../../data/profile'
import { income, YEARS } from '../../cases/nvidia/data'
import { rich, pad2 } from '../../templates/rich'
import portraitUrl from '../../assets/aman-portrait.webp'

/**
 * Everything below the hero, code-split so the first screen loads fast.
 * Sections: About (Intro + stack marquee) · Skills (numbered accordion) ·
 * Work (pinned rows) · Contact + footer.
 */
export default function Below({ go, onReady, sectionRef }) {
  useLayoutEffect(() => { onReady?.() }, [onReady])
  return (
    <MotionRoot>
      <About ref={sectionRef('about')} />
      <Services ref={sectionRef('skills')} go={go} />
      <Work ref={sectionRef('work')} go={go} />
      <Contact ref={sectionRef('contact')} go={go} />
    </MotionRoot>
  )
}

/* ------------------------------------------------------------------ */
/* About                                                               */
/* ------------------------------------------------------------------ */
function Bold({ text }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>
  )
}

function About({ ref }) {
  const big = useRef(null)
  const card = useRef(null)
  useSplitReveal(big, { split: 'chars', on: 'view', step: 45 })
  useReveal(card, { selector: ':scope > *', on: 'view', step: 90, y: 30 })
  return (
    <section ref={ref} id="about" className="hm-sec h-about" aria-labelledby="about-title">
      <div className="h-about-top">
        <div>
          <p className="h-kicker">About me</p>
          <h2 id="about-title" ref={big} className="h-giant">Intro</h2>
        </div>
        <div ref={card} className="h-bio">
          <p><Bold text={home.bio} /></p>
        </div>
      </div>
      <p className="h-kicker h-stack-label">The stack</p>
      <div className="h-marquee" aria-label="Skills and tools">
        {home.stack.map((row, i) => (
          <div key={i} className={`h-mq-row ${i % 2 ? 'is-rev' : ''}`} style={{ '--dur': `${38 + i * 9}s` }}>
            {/* two copies → seamless loop; the second is hidden from screen readers */}
            {[0, 1].map((copy) => (
              <ul key={copy} className="h-mq-track" aria-hidden={copy === 1}>
                {row.map((s) => <li key={s} className="h-chip">{s}</li>)}
              </ul>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Skills — numbered accordion                                         */
/* ------------------------------------------------------------------ */
function Services({ ref, go }) {
  const [open, setOpen] = useState(0)
  const title = useRef(null)
  const list = useRef(null)
  useSplitReveal(title, { split: 'words', on: 'view', step: 90 })
  useReveal(list, { selector: ':scope > li', on: 'view', step: 70, y: 22 })
  return (
    <section ref={ref} id="skills" className="hm-sec h-services" aria-labelledby="skills-title">
      <h2 id="skills-title" ref={title} className="h-giant h-giant--two">{rich(home.servicesTitle)}</h2>
      <ol ref={list} className="h-acc">
        {home.services.map((s, i) => {
          const isOpen = open === i
          return (
            <li key={s.id} className={`h-acc-item ${isOpen ? 'is-open' : ''}`}>
              <button className="h-acc-head" aria-expanded={isOpen} aria-controls={`acc-${s.id}`} onClick={() => setOpen(isOpen ? -1 : i)}>
                <span className="h-acc-n">{pad2(i + 1)}</span>
                <span className="h-acc-t">{s.title}</span>
                <span className="h-acc-arrow" aria-hidden="true">↘</span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <m.div
                    id={`acc-${s.id}`}
                    className="h-acc-body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.55, ease: EASE }}
                  >
                    <div className="h-acc-inner">
                      <ul className="h-acc-bullets">
                        {s.bullets.map((b) => <li key={b}>{b}</li>)}
                      </ul>
                      <div className="h-acc-text">
                        <p>{s.text}</p>
                        {s.cta && <button className="h-pill h-pill--solid" onClick={() => go(s.cta.to)}>{s.cta.label}</button>}
                      </div>
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Work — pinned, stacking rows                                        */
/* ------------------------------------------------------------------ */
function Work({ ref, go }) {
  const head = useRef(null)
  const sub = useRef(null)
  useSplitReveal(head, { split: 'words', on: 'view', step: 100 })
  useReveal(sub, { selector: ':scope > *', on: 'view', step: 90 })
  return (
    <section ref={ref} id="work" className="hm-sec h-work" aria-labelledby="work-title">
      <div className="h-work-head">
        <h2 id="work-title" ref={head} className="h-giant h-giant--work">Selected <em>work</em></h2>
        <div ref={sub} className="h-work-sub">
          <p>{home.workIntro}</p>
          <button className="h-pill" onClick={() => go('/hall')}>Analytics Hall ↗</button>
        </div>
      </div>
      <div className="h-rows">
        {home.work.map((w, i) => <WorkRow key={w.id} w={w} i={i} go={go} />)}
      </div>
    </section>
  )
}

function WorkRow({ w, i, go }) {
  const row = useRef(null)
  const title = useRef(null)
  useSplitReveal(title, { split: 'words', on: 'view', step: 80 })
  useReveal(row, { selector: '[data-in]', on: 'view', step: 90, delay: 200 })
  return (
    <article ref={row} className="h-row" style={{ '--i': i }}>
      <button className="h-row-media" onClick={() => go(w.to)} aria-label={`Open ${w.title.replace(/\*/g, '')}`}>
        <Media kind={w.media} />
      </button>
      <div className="h-row-text">
        <span className="h-row-n" data-in>{pad2(i + 1)}</span>
        <h3 className="h-row-title">
          <span ref={title} className="h-row-t1">{rich(w.title)}</span>
          <span className="h-row-t2" data-in>{w.sub}</span>
        </h3>
        <p data-in>{w.text}</p>
        <div className="h-row-links" data-in>
          {w.links.map((l) => <button key={l.label} className="h-pill" onClick={() => go(l.to)}>{l.label} ↗</button>)}
        </div>
      </div>
    </article>
  )
}

/** Generated artwork for each row (no screenshots needed). */
function Media({ kind }) {
  if (kind === 'chart') return <ChartArt />
  if (kind === 'ticket') return <TicketArt />
  if (kind === 'terminal') return <TerminalArt />
  return <MosaicArt />
}

function ChartArt() {
  const max = Math.max(...YEARS.map((y) => income[y].revenue))
  return (
    <div className="art art-chart">
      <span className="art-label mono">NVDA · revenue, FY22–FY26 · USD</span>
      <div className="art-bars">
        {YEARS.map((y, i) => (
          <div key={y} className="art-bar" style={{ '--h': income[y].revenue / max, '--i': i }}>
            <span className="mono">${(income[y].revenue / 1000).toFixed(1)}B</span>
            <i />
            <em className="mono">{y}</em>
          </div>
        ))}
      </div>
    </div>
  )
}

function TicketArt() {
  const cells = useMemo(() => {
    let s = 7
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647)
    return Array.from({ length: 121 }, () => r() > 0.52)
  }, [])
  return (
    <div className="art art-ticket">
      <div className="ticket">
        <div className="ticket-main">
          <span className="mono">Admit one</span>
          <strong>TEDxISME</strong>
          <span className="mono">Registration · Ticketing</span>
        </div>
        <div className="ticket-stub">
          <div className="qr">{cells.map((on, i) => <i key={i} className={on ? 'on' : ''} />)}</div>
        </div>
      </div>
    </div>
  )
}

function TerminalArt() {
  return (
    <div className="art art-term">
      <div className="term">
        <div className="term-bar"><i /><i /><i /><span className="mono">aman@lab: ~</span></div>
        <pre className="mono">
          <span className="t-p">aman@lab:~$</span> uname -s{'\n'}Linux{'\n'}
          <span className="t-p">aman@lab:~$</span> <span className="t-cur" />
        </pre>
      </div>
    </div>
  )
}

/** A tiny static mosaic of the portrait, drawn once on a 2D canvas. */
function MosaicArt() {
  const cv = useRef(null)
  useLayoutEffect(() => {
    const img = new Image()
    img.onload = () => {
      const c = cv.current
      if (!c) return
      const cols = 96, rows = Math.round(cols / (img.naturalWidth / img.naturalHeight))
      const t = document.createElement('canvas'); t.width = cols; t.height = rows
      const tx = t.getContext('2d', { willReadFrequently: true })
      tx.drawImage(img, 0, 0, cols, rows)
      const d = tx.getImageData(0, 0, cols, rows).data
      const cell = 6
      c.width = cols * cell; c.height = rows * cell
      const g = c.getContext('2d')
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const k = (y * cols + x) * 4
        if (d[k + 3] < 128) continue // backdrop (alpha mask)
        const L = d[k] / 255
        const b = Math.pow(Math.min(1, Math.max(0, (L - 0.03) / 0.8)), 0.9)
        const v = 0.45 + 0.85 * b
        g.fillStyle = `rgb(${Math.round((18 + 190 * b) * v)},${Math.round((20 + 202 * b) * v)},${Math.round((33 + 222 * b) * v)})`
        g.fillRect(x * cell, y * cell, cell - 1, cell - 1)
      }
    }
    img.src = portraitUrl
  }, [])
  return <div className="art art-mosaic"><canvas ref={cv} aria-hidden="true" /></div>
}

/* ------------------------------------------------------------------ */
/* Contact + footer                                                    */
/* ------------------------------------------------------------------ */
function Contact({ ref, go }) {
  const head = useRef(null)
  const left = useRef(null)
  useSplitReveal(head, { split: 'words', on: 'view', step: 100 })
  useReveal(left, { selector: '[data-in]', on: 'view', step: 90, delay: 250 })
  const c = profile.contact
  const [form, setForm] = useState({ name: '', message: '' })
  const mailto = (subject, body) => `mailto:${c.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  const send = (e) => {
    e.preventDefault()
    window.location.href = mailto(`Hello from ${form.name || 'your portfolio'}`, form.message)
  }
  const links = [['LinkedIn', c.linkedin], ['GitHub', c.github], ['Résumé', c.resume]].filter(([, v]) => v && !isTodo(v))
  return (
    <section ref={ref} id="contact" className="hm-sec h-contact" aria-labelledby="contact-title">
      <div className="h-smoke" aria-hidden="true" />
      <div className="h-contact-grid">
        <div ref={left}>
          <p className="h-dot" data-in><i /> Based in Bengaluru</p>
          <h2 id="contact-title" ref={head} className="h-giant h-giant--contact">{rich(home.contactTitle)}</h2>
          <p className="h-contact-text" data-in>{home.contactText}</p>
          <div className="h-contact-actions" data-in>
            <Magnetic as="a" className="h-pill h-pill--solid" href={`mailto:${c.email}`} aria-label="Email Aman Kumar">Email me ↗</Magnetic>
            {links.map(([label, href]) => (
              <a key={label} className="h-pill" href={href} target="_blank" rel="noopener noreferrer" aria-label={`Aman Kumar on ${label} (opens in a new tab)`}>{label} ↗</a>
            ))}
          </div>
        </div>
        <form className="h-form" onSubmit={send}>
          <label>
            <span className="mono">Your name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
          </label>
          <label>
            <span className="mono">Message</span>
            <textarea rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </label>
          <button className="h-pill h-pill--solid" type="submit">Write the email →</button>
          <p className="h-form-note mono">Opens your email app with the message filled in. Nothing is sent from this site.</p>
        </form>
      </div>
      <footer className="h-foot">
        <span>© 2026 {profile.name}. All rights reserved.</span>
        <nav aria-label="Footer">
          {home.nav.filter((n) => n.id !== 'home').map((n) => (
            <a key={n.id} href={`#${n.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(n.id)?.scrollIntoView({ behavior: 'smooth' }) }}>{n.label}</a>
          ))}
          <button onClick={() => go('/hall')}>Analytics Hall</button>
        </nav>
      </footer>
    </section>
  )
}
