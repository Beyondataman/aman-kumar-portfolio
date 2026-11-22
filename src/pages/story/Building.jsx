import { experienceGroups, projects, projectOrder } from '../../data/profile'
import { Todo } from '../../components/Todo'

/** CHAPTER 4 — BUILDING & EXPERIENCE: leadership, events, and technology projects with dedicated CTAs. */
export default function Building({ ref, openProject }) {
  return (
    <section ref={ref} className="ch ch-building" id="building" aria-labelledby="building-title">
      <div className="ch-head ch-head--right">
        <p className="kicker"><span className="mono">04</span> Building &amp; Experience</p>
        <h2 id="building-title" className="display-l">Things I’ve<br /><em>organised</em> and <em>built</em>.</h2>
      </div>

      <div className="exp-grid">
        {experienceGroups.map((g) => (
          <div key={g.id} className="exp-col">
            <h3 className="exp-col-title mono">{g.title}</h3>
            <ul className="exp-list">
              {g.items.map((it) => (
                <li key={it.id} className="exp-item">
                  <h4>{it.title}</h4>
                  <p className="muted">{it.text}</p>
                  {it.detail && <Todo value={it.detail} />}
                  {it.projectId && (
                    <button className="link-arrow" onClick={() => openProject(it.projectId)}>
                      {projects[it.projectId].short} →
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="project-cards" role="list">
        {projectOrder.map((id, i) => {
          const p = projects[id]
          return (
            <article key={id} role="listitem" className={`pcard ${i === 0 ? 'pcard--feature' : ''}`}>
              <p className="kicker mono">{p.kicker}</p>
              <h3>{p.title}</h3>
              <p className="muted">{p.overview}</p>
              <button className="btn" onClick={() => openProject(id)}>{p.cta} →</button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
