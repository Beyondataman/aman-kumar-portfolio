import { useLayoutEffect } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { projects, projectOrder, isTodo } from '../data/profile'
import { Todo } from '../components/Todo'
import { revealPage, useBack, useGo } from '../lib/nav'
import CaseStudyLayout, { CaseSection, Steps } from '../templates/CaseStudyLayout'
import { pad2 } from '../templates/rich'
import { MotionRoot } from '../motion/motion'

/**
 * PROJECT DETAIL DESTINATION (route "/projects/:projectId").
 * Built on the CaseStudyLayout template: Problem → Approach → Evidence → Outcome.
 * "Back to Home" restores the exact story position the visitor left from.
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
    if (['home', 'story'].includes(location.state?.from) && window.history.state?.idx > 0) back()
    else go('/', { state: { resume: true } })
  }

  if (!p) {
    return (
      <main className="page page--center">
        <h1 className="display-m">Project not found</h1>
        <button className="btn" onClick={toStory}>Back to Home</button>
      </main>
    )
  }

  const i = projectOrder.indexOf(projectId)
  const next = projects[projectOrder[(i + 1) % projectOrder.length]]

  return (
    <MotionRoot>
      <CaseStudyLayout
        key={projectId}
        className="project"
        top={<>
          <button className="btn btn--ghost btn--sm" onClick={toStory}>← Back to Home</button>
          <span className="mono muted">Project {pad2(i + 1)} / {pad2(projectOrder.length)}</span>
        </>}
        hero={{ kicker: p.kicker, title: p.title, lede: p.overview }}
        facts={[
          { label: 'Status', value: <Todo value={p.status} /> },
          { label: 'My role', value: <Todo value={p.role} /> },
        ]}
        footer={<>
          <button className="btn" onClick={toStory}>← Back to Home</button>
          <button className="btn btn--ghost" onClick={() => go(`/projects/${next.id}`, { state: location.state, replace: true })}>Next: {next.short} →</button>
        </>}
      >
        <CaseSection id="problem" label="Problem">
          <p className="body-l"><Todo value={p.problem} /></p>
        </CaseSection>

        <CaseSection id="approach" label="Approach">
          <Steps items={p.implementation.map((s) => ({ title: s.title, text: s.text, detail: s.detail ? <Todo value={s.detail} /> : null }))} />
        </CaseSection>

        <CaseSection id="evidence" label="Evidence" wide>
          <h3 className="h-sec">Technologies</h3>
          {isTodo(p.technologies) ? <Todo value={p.technologies} /> : (
            <ul className="tags">{p.technologies.split(',').map((t) => <li key={t}>{t.trim().replace(/\.$/, '')}</li>)}</ul>
          )}
          <h3 className="h-sec">Screenshots</h3>
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
        </CaseSection>

        <CaseSection id="outcome" label="Outcome">
          <p className="body-l"><Todo value={p.status} /></p>
          <div className="row">
            {[['GitHub', p.links.github], ['Live preview', p.links.live]].map(([label, v]) =>
              v == null ? <span key={label} className="muted">{label}: not available</span>
                : isTodo(v) ? <Todo key={label} value={v} />
                  : <a key={label} className="btn btn--ghost btn--sm" href={v} target="_blank" rel="noreferrer">{label} ↗</a>
            )}
          </div>
        </CaseSection>
      </CaseStudyLayout>
    </MotionRoot>
  )
}
