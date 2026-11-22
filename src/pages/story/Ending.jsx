import { useCallback, useRef } from 'react'
import { profile, isTodo } from '../../data/profile'
import { ENDINGS } from './engineContent'
import { Session } from './DeveloperEngine'
import { useCycle, useInView } from '../../components/useCycle'

const LINE_MS = 650

/** HUMOROUS ENDING — a terminal that cycles through ten short sessions, then the ways to get in touch. */
export default function Ending({ ref, enterHall, toTop }) {
  const sec = useRef(null)
  const inView = useInView(sec, 0.3)
  const [i, next] = useCycle(ENDINGS.length, useCallback((k) => ENDINGS[k].length * LINE_MS + 4200, []), inView)
  const c = profile.contact
  const links = [
    ['Email', c.email, (v) => `mailto:${v}`],
    ['LinkedIn', c.linkedin, (v) => v],
    ['GitHub', c.github, (v) => v],
    ['Résumé', c.resume, (v) => v],
  ]
  return (
    <section
      ref={(el) => { sec.current = el; if (typeof ref === 'function') ref(el) }}
      className="ch ch-ending"
      id="ending"
      aria-labelledby="ending-title"
    >
      <h2 id="ending-title" className="sr-only">sudo make me employable</h2>
      <div className={`end-term ${inView ? 'is-run' : ''}`} onClick={next} title="click for the next one">
        <div className="end-bar mono">
          <span className="dots" aria-hidden="true"><i /><i /><i /></span>
          <span className="muted">aman@engine — {i + 1}/{ENDINGS.length}</span>
          <ol className="end-dots" aria-hidden="true">
            {ENDINGS.map((_, k) => <li key={k} className={k === i ? 'is-on' : ''} />)}
          </ol>
        </div>
        <Session lines={ENDINGS[i]} key={i} ms={LINE_MS} className="end-session" />
      </div>
      <div className="contact">
        {links.map(([label, v, href]) =>
          isTodo(v) ? (
            <span key={label} className="contact-link is-todo" title={`Placeholder — ${v.label}`}>{label} <small className="mono">to add</small></span>
          ) : (
            <a key={label} className="contact-link" href={href(v)} target="_blank" rel="noreferrer">{label} ↗</a>
          )
        )}
      </div>
      <div className="end-actions">
        <button className="btn" onClick={enterHall}>Re-enter the Analytics Hall</button>
        <button className="btn btn--ghost" onClick={toTop}>Back to the beginning ↑</button>
      </div>
      <footer className="foot mono muted">
        <span>© 2026 {profile.name}</span>
        <span>git log -1 → “It finally works. Don’t touch it.”</span>
      </footer>
    </section>
  )
}
