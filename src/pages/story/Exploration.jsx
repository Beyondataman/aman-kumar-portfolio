import { useEffect, useId, useRef, useState } from 'react'
import { skillGroups, SKILL_LEVELS } from '../../data/profile'
import { live, kick } from '../../lib/live'

// constellation layouts (percent coordinates inside each cluster)
const NODE_POS = [
  [[18, 30], [62, 18], [44, 70]],
  [[20, 62], [56, 28], [80, 70]],
  [[14, 40], [50, 16], [82, 46], [46, 78]],
]

/** CHAPTER 3 — EXPLORATION: skills as spatial clusters with interactive nodes. */
export default function Exploration({ ref }) {
  const clusterEls = useRef([])
  const sectionEl = useRef(null)
  const [hoverCluster, setHoverCluster] = useState(null)
  const [openSkill, setOpenSkill] = useState(null)

  // feed the 3D core an attractor: hovered cluster, else the one matching scroll progress
  useEffect(() => {
    let raf = 0, active = false
    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (!active) return
      const sec = sectionEl.current
      if (!sec) return
      const r = sec.getBoundingClientRect()
      const prog = Math.min(1, Math.max(0, (window.innerHeight * 0.5 - r.top) / r.height))
      const idx = hoverCluster ?? (prog < 0.42 ? 0 : prog < 0.66 ? 1 : 2)
      const el = clusterEls.current[idx]
      if (!el) return
      const b = el.getBoundingClientRect()
      const x = ((b.left + b.width / 2) / window.innerWidth) * 2 - 1
      const y = -(((b.top + b.height * 0.62) / window.innerHeight) * 2 - 1)
      const a = live.story.attractor
      if (!a || Math.abs(a.x - x) > 0.002 || Math.abs(a.y - y) > 0.002) { live.story.attractor = { x, y }; kick(600) }
    }
    const io = new IntersectionObserver(([e]) => { active = e.isIntersecting; if (!active) live.story.attractor = null })
    if (sectionEl.current) io.observe(sectionEl.current)
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); io.disconnect() }
  }, [hoverCluster])

  return (
    <section
      ref={(el) => { sectionEl.current = el; if (typeof ref === 'function') ref(el) }}
      className="ch ch-exploration"
      id="exploration"
      aria-labelledby="exploration-title"
    >
      <div className="ch-head ch-head--right">
        <p className="kicker"><span className="mono">03</span> Exploration</p>
        <h2 id="exploration-title" className="display-l">A toolkit,<br />clearly <em>labelled</em>.</h2>
        <p className="body-l muted">Three clusters, ten skills. Each one marked for where it stands — learning, practising, or applied.</p>
        <ul className="level-legend" aria-label="Skill levels">
          {Object.entries(SKILL_LEVELS).map(([k, v]) => (
            <li key={k}><span className={`lv lv--${k}`} aria-hidden="true" /> <strong>{v.label}</strong> <span className="muted">— {v.hint}</span></li>
          ))}
        </ul>
      </div>

      <div className="clusters">
        {skillGroups.map((g, gi) => (
          <div
            key={g.id}
            ref={(el) => (clusterEls.current[gi] = el)}
            className={`cluster cluster--${gi} ${hoverCluster === gi ? 'is-hot' : ''} ${hoverCluster !== null && hoverCluster !== gi ? 'is-dim' : ''}`}
            onPointerEnter={() => setHoverCluster(gi)}
            onPointerLeave={() => setHoverCluster(null)}
            onFocus={() => setHoverCluster(gi)}
            onBlur={() => setHoverCluster(null)}
          >
            <div className="cluster-head">
              <h3>{g.title}</h3>
              <p className="muted">{g.caption}</p>
            </div>
            <div className="constellation">
              <svg className="links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {g.skills.map((s, i) => {
                  const a = NODE_POS[gi][i], b = NODE_POS[gi][(i + 1) % g.skills.length]
                  return <line key={s.id} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
                })}
              </svg>
              {g.skills.map((s, i) => (
                <SkillNode key={s.id} skill={s} pos={NODE_POS[gi][i]} open={openSkill === s.id} setOpen={setOpenSkill} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function SkillNode({ skill, pos, open, setOpen }) {
  const id = useId()
  const lv = SKILL_LEVELS[skill.level]
  return (
    <div className={`node-wrap ${open ? 'is-open' : ''}`} style={{ left: `${pos[0]}%`, top: `${pos[1]}%` }}>
      <button
        className={`node lv--${skill.level}`}
        aria-describedby={id}
        onPointerEnter={() => setOpen(skill.id)}
        onPointerLeave={() => setOpen(null)}
        onFocus={() => setOpen(skill.id)}
        onBlur={() => setOpen(null)}
        onClick={() => setOpen(open ? null : skill.id)}
      >
        <span className="node-dot" aria-hidden="true" />
        <span className="node-label">{skill.name}</span>
        <span className="node-level mono">{lv.label}</span>
      </button>
      <div role="tooltip" id={id} className="tip">
        <strong>{skill.name}</strong>
        <span className={`tip-level lv-text--${skill.level}`}>{lv.label}</span>
        <p>{skill.note}</p>
      </div>
    </div>
  )
}
