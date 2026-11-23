import { useLayoutEffect } from 'react'
import { revealPage, useGo } from '../lib/nav'
import { education, projects, projectOrder, skillGroups, SKILL_LEVELS, isTodo } from '../data/profile'
import { income, platforms, YEARS, sources as nvSources, derived } from '../cases/nvidia/data'
import PageHero from '../templates/PageHero'
import CardGrid, { Card } from '../templates/CardGrid'
import HScrollTrack from '../templates/HScrollTrack'
import { CaseSection, Steps, Sources } from '../templates/CaseStudyLayout'
import { BarRace, LineDraw, StatBand } from '../templates/charts'
import { Magnetic, MotionRoot } from '../motion/motion'

/**
 * TEMPLATE KIT PREVIEW (route "/templates", not linked from the site).
 * Every block here is a reusable template fed from the real data files —
 * nothing on this page is invented.
 */
const usdB = (m) => `$${(m / 1000).toFixed(m >= 100000 || m % 1000 === 0 ? 0 : 1)}B`

export default function Templates() {
  const go = useGo()
  useLayoutEffect(() => { window.scrollTo(0, 0); revealPage() }, [])

  const pgdm = education.find((e) => e.id === 'pgdm')
  const skills = skillGroups.flatMap((g) => g.skills.map((s) => ({
    id: s.id, kicker: g.title, title: s.name, text: s.note,
    status: { label: SKILL_LEVELS[s.level].label, tone: s.level },
  })))
  const work = projectOrder.map((id) => projects[id])
  const nv = YEARS.map((y) => ({ label: y, revenue: income[y].revenue, netIncome: income[y].netIncome }))
  const { cagr } = derived()

  return (
    <MotionRoot>
      <main className="page tpl">
        <header className="tpl-top">
          <button className="btn btn--ghost btn--sm" onClick={() => go('/', { state: { resume: true } })}>← Story</button>
          <span className="mono muted">v2 · template kit</span>
        </header>

        <Label name="PageHero" note='size="xl" · split-text headline · cue' />
        <PageHero
          size="xl"
          index="00"
          kicker="Template kit"
          title="Subtle, *animated,*|reusable."
          lede="Each block on this page is a template: drop in data from src/data, and the motion — split-text reveals, staggers, line drawing, scroll-linked tracks — comes with it."
          actions={<>
            <Magnetic className="btn" onClick={() => document.getElementById('tpl-grid')?.scrollIntoView({ behavior: 'smooth' })}>See the templates ↓</Magnetic>
            <Magnetic className="btn btn--ghost" onClick={() => go('/projects/portfolio')}>Case-study page →</Magnetic>
          </>}
          cue
        />

        <Label name="PageHero" note='size="m" · aside · on="view"' />
        <PageHero
          as="h2"
          size="m"
          on="view"
          index="02"
          kicker="Foundation"
          title={`${pgdm.degree.replace('Business Analytics', '*Business Analytics*')}`}
          lede={pgdm.note}
          aside={
            <dl className="tpl-facts">
              <div><dt className="mono">Institution</dt><dd>{pgdm.institution}, {pgdm.place}</dd></div>
              <div><dt className="mono">Period</dt><dd>{pgdm.period}</dd></div>
              <div><dt className="mono">Status</dt><dd>{pgdm.status}</dd></div>
            </dl>
          }
        />

        <Label id="tpl-grid" name="CardGrid" note="staggered reveal · hover lift" />
        <section className="tpl-block">
          <CardGrid items={skills} columns={3} numbered />
        </section>

        <Label name="HScrollTrack" note="pinned on desktop · swipe row on phones" />
        <HScrollTrack
          label="Projects"
          intro={
            <div className="tpl-intro">
              <p className="kicker"><span className="mono">04</span>Building</p>
              <h2 className="t-hero-title t-hero-title--m">Selected <em>work</em></h2>
              <p className="muted">Scroll (or swipe on a phone) to move the shelf.</p>
            </div>
          }
          items={work}
          renderPanel={(p, i) => (
            <Card
              className="t-card--panel"
              n={i + 1}
              kicker={p.kicker}
              title={p.title}
              text={p.overview}
              meta={isTodo(p.status) ? 'status to add' : p.status}
              onClick={() => go(`/projects/${p.id}`)}
            />
          )}
        />

        <Label name="CaseSection · Steps · LineDraw · StatBand · BarRace" note="the building blocks of CaseStudyLayout" />
        <div className="tpl-cs">
          <CaseSection id="tpl-approach" n={2} label="Approach" title="How the *NVIDIA* case was built">
            <Steps items={[
              { title: 'Frame the question', text: 'How did revenue grow eight-fold in four years — and what does that concentration cost in risk?' },
              { title: 'Collect from *filings*', text: 'Income statement, platform revenue, geography and customer concentration from 10-Ks and results releases.' },
              { title: 'Derive & compare', text: 'Margins, growth rates, mix shift and concentration across FY22–FY26.' },
            ]} />
          </CaseSection>
          <CaseSection id="tpl-evidence" n={3} label="Evidence" title="Revenue vs. net income, *FY22–FY26*" wide>
            <StatBand stats={[
              { value: income.FY26.revenue / 1000, label: 'FY26 revenue', prefix: '$', suffix: 'B', format: (n) => n.toFixed(1) },
              { value: cagr, label: 'Revenue CAGR, FY22–FY26', suffix: '%', format: (n) => n.toFixed(0) },
              { value: (platforms.FY26.dataCenter / income.FY26.revenue) * 100, label: 'Data Center share of FY26 revenue', suffix: '%', format: (n) => n.toFixed(0) },
            ]} />
            <LineDraw
              data={nv}
              series={[{ key: 'revenue', label: 'Revenue' }, { key: 'netIncome', label: 'Net income' }]}
              format={usdB}
              caption="USD, GAAP. Fiscal years end in late January."
            />
            <BarRace
              title="FY26 revenue by market platform"
              highlight="Data Center"
              format={usdB}
              items={[
                { label: 'Data Center', value: platforms.FY26.dataCenter },
                { label: 'Gaming', value: platforms.FY26.gaming },
                { label: 'Pro Visualization', value: platforms.FY26.proViz },
                { label: 'Automotive', value: platforms.FY26.automotive },
                { label: 'OEM & Other', value: platforms.FY26.oem },
              ]}
            />
            <Sources items={nvSources.slice(0, 3).map((s) => ({ label: s.title, url: s.url }))} />
          </CaseSection>
        </div>

        <footer className="tpl-foot">
          <button className="btn" onClick={() => go('/projects/portfolio')}>Open the CaseStudyLayout page →</button>
        </footer>
      </main>
    </MotionRoot>
  )
}

function Label({ id, name, note }) {
  return (
    <div id={id} className="tpl-label">
      <span className="mono">template</span>
      <strong>{`<${name.split(' ')[0]}>`}</strong>
      {name.includes(' ') && <span className="mono muted">{name.split(' ').slice(1).join(' ')}</span>}
      <span className="mono muted">{note}</span>
    </div>
  )
}
