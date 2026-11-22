import { education } from '../../data/profile'

const STEPS = [
  { n: '01', t: 'Question', d: 'Start from the decision someone actually has to make.' },
  { n: '02', t: 'Data', d: 'Find the sources, clean them, and question them.' },
  { n: '03', t: 'Insight', d: 'Model, visualise, and test what the numbers really say.' },
  { n: '04', t: 'Build', d: 'Ship it as something people can use — a dashboard, a tool, a site.' },
]

/** CHAPTER 6 — the story continues after the (optional) Hall. */
export default function Continuation({ ref }) {
  const now = education[0]
  return (
    <section ref={ref} className="ch ch-continuation" id="continuation" aria-labelledby="cont-title">
      <div className="ch-head ch-head--right">
        <p className="kicker"><span className="mono">06</span> The story continues</p>
        <h2 id="cont-title" className="display-l">The Hall was a room<br />off the <em>corridor</em>.</h2>
        <p className="body-l muted">Explore it or skip it — the story keeps going. Here is the loop I run on every problem.</p>
      </div>
      <ol className="steps">
        {STEPS.map((s) => (
          <li key={s.n} className="step">
            <span className="mono step-n">{s.n}</span>
            <h3>{s.t}</h3>
            <p className="muted">{s.d}</p>
          </li>
        ))}
      </ol>
      <p className="now mono"><span className="pill">Now</span> {now.degree} · {now.institution}, {now.place} · {now.period}</p>
    </section>
  )
}
