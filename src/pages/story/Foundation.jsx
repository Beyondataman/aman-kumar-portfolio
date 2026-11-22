import { useEffect, useRef, useState } from 'react'
import { education } from '../../data/profile'
import { Todo } from '../../components/Todo'

/** CHAPTER 2 — FOUNDATION: education as an asymmetric editorial timeline with selective focus. */
export default function Foundation({ ref }) {
  const [focus, setFocus] = useState(education[0].id)
  const items = useRef({})

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setFocus(e.target.dataset.id)),
      { rootMargin: '-42% 0px -42% 0px' }
    )
    Object.values(items.current).forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <section ref={ref} className="ch ch-foundation" id="foundation" aria-labelledby="foundation-title">
      <div className="ch-head ch-head--left">
        <p className="kicker"><span className="mono">02</span> Foundation</p>
        <h2 id="foundation-title" className="display-l">
          Numbers first.<br /><em>Business</em> next.
        </h2>
        <p className="body-l muted">A mathematics degree as the base; a business-analytics programme as the bridge from equations to decisions.</p>
      </div>

      <ol className="timeline" aria-label="Education">
        {education.map((e, i) => (
          <li
            key={e.id}
            data-id={e.id}
            ref={(el) => (items.current[e.id] = el)}
            className={`tl-item tl-item--${i % 2 ? 'b' : 'a'} ${focus === e.id ? 'is-focus' : ''}`}
          >
            <div className="tl-period mono"><Todo value={e.period} inline /></div>
            <div className="tl-card">
              <h3 className="tl-degree">{e.degree}</h3>
              <p className="tl-inst">{e.institution}<span className="muted"> — {e.place}</span></p>
              <p className="tl-note muted">{e.note}</p>
              {e.status && <span className="pill">{e.status}</span>}
            </div>
            <span className="tl-node" aria-hidden="true" />
          </li>
        ))}
      </ol>
    </section>
  )
}
