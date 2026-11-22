import { useLayoutEffect } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { projects, projectOrder, isTodo } from '../data/profile'
import { Todo } from '../components/Todo'
import { revealPage, useBack, useGo } from '../lib/nav'

/**
 * PROJECT DETAIL DESTINATION (route "/projects/:projectId").
 * Same structure for every project. "Return to Story" restores the
 * exact story position the visitor left from.
 */
export default function Project() {
  const { projectId } = useParams()
  const p = projects[projectId]
  const location = useLocation()
  const go = useGo()
  const back = useBack()

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
    revealPage()
  }, [projectId])

  const toStory = () => {
    if (location.state?.from === 'story' && window.history.state?.idx > 0) back()
    else go('/', { state: { resume: true } })
  }

  if (!p) {
    return (
      <main className="page page--center">
        <h1 className="display-m">Project not found</h1>
        <button className="btn" onClick={toStory}>Return to Story</button>
      </main>
    )
  }

  const i = projectOrder.indexOf(projectId)
  const next = projects[projectOrder[(i + 1) % projectOrder.length]]

  return (
    <main className="page project">
      <header className="project-top">
        <button className="btn btn--ghost btn--sm" onClick={toStory}>← Return to Story</button>
        <span className="mono muted">Project {String(i + 1).padStart(2, '0')} / {String(projectOrder.length).padStart(2, '0')}</span>
      </header>

      <section className="project-hero">
        <p className="kicker mono">{p.kicker}</p>
        <h1 className="display-l">{p.title}</h1>
        <p className="body-l">{p.overview}</p>
        <dl className="project-facts">
          <div><dt>Status</dt><dd><Todo value={p.status} /></dd></div>
          <div><dt>My role</dt><dd><Todo value={p.role} /></dd></div>
        </dl>
      </section>

      <div className="project-grid">
        <section className="card">
          <h2 className="h-sec">Problem</h2>
          <p><Todo value={p.problem} /></p>
        </section>
        <section className="card">
          <h2 className="h-sec">Technologies</h2>
          {isTodo(p.technologies) ? <Todo value={p.technologies} /> : (
            <ul className="tags">{p.technologies.split(',').map((t) => <li key={t}>{t.trim().replace(/\.$/, '')}</li>)}</ul>
          )}
        </section>
      </div>

      <section className="card">
        <h2 className="h-sec">Implementation</h2>
        <ol className="impl">
          {p.implementation.map((s, n) => (
            <li key={s.title}>
              <span className="mono impl-n">{String(n + 1).padStart(2, '0')}</span>
              <div>
                <h3>{s.title}</h3>
                <p className="muted">{s.text}</p>
                {s.detail && <Todo value={s.detail} />}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="card">
        <h2 className="h-sec">Screenshots</h2>
        {p.screenshots.length ? (
          <div className="shots">
            {p.screenshots.map((s) => (
              <figure key={s.caption} className="shot">
                {s.src ? <img src={s.src} alt={s.caption} loading="lazy" /> : <div className="shot-empty mono">screenshot to add<br /><small>public/screenshots/</small></div>}
                <figcaption className="muted">{s.caption}</figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="muted">You are looking at it.</p>
        )}
      </section>

      <section className="card links-card">
        <h2 className="h-sec">Links</h2>
        <div className="row">
          {[['GitHub', p.links.github], ['Live preview', p.links.live]].map(([label, v]) =>
            v == null ? <span key={label} className="muted">{label}: not available</span>
              : isTodo(v) ? <Todo key={label} value={v} />
                : <a key={label} className="btn btn--ghost btn--sm" href={v} target="_blank" rel="noreferrer">{label} ↗</a>
          )}
        </div>
      </section>

      <footer className="project-foot">
        <button className="btn" onClick={toStory}>← Return to Story</button>
        <button className="btn btn--ghost" onClick={() => go(`/projects/${next.id}`, { state: location.state, replace: true })}>Next: {next.short} →</button>
      </footer>
    </main>
  )
}
