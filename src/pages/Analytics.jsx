import { useLayoutEffect, useRef } from 'react'
import { revealPage, useGo } from '../lib/nav'
import { approach, education, skillGroups, SKILL_LEVELS, isTodo } from '../data/profile'
import { income, platforms, sources, YEARS, meta, derived } from '../cases/nvidia/data'
import SiteNav, { pageLinks } from '../components/SiteNav'
import { profile } from '../data/profile'
import { Todo } from '../components/Todo'
import PageHero from '../templates/PageHero'
import { StatBand } from '../templates/charts'
import { MotionRoot, Magnetic } from '../motion/motion'
import { useDraw, useReveal, useSplitReveal } from '../motion/anime'
import { rich, pad2 } from '../templates/rich'
import MosaicLogo from './home/MosaicLogo'

const STEP_ICON = { question: 'question', data: 'database', insight: 'chart', build: 'cube' }

/**
 * ANALYTICS (route "/analytics") — how Aman approaches a problem (the
 * Question → Data → Insight → Build loop, each step shown in the NVIDIA case)
 * and every tool with the evidence of where it was used. Unconfirmed evidence
 * stays a visible "to add" placeholder (src/data/profile.js).
 */
export default function Analytics() {
  const go = useGo()
  useLayoutEffect(() => { window.scrollTo(0, 0); revealPage() }, [])

  const pgdm = education.find((e) => e.id === 'pgdm')
  const { cagr } = derived()
  const dc = (y) => Math.round((platforms[y].dataCenter / income[y].revenue) * 100)
  const first = YEARS[0], last = YEARS[YEARS.length - 1]
  const inCase = {
    question: meta.question,
    data: `${sources.length} sources — led by NVIDIA's 10-K filings and quarterly results releases — for ${first}–${last}, with every figure traceable to its source.`,
    insight: `Revenue grew ${(income[last].revenue / income[first].revenue).toFixed(1)}× (${Math.round(cagr)}% a year); Data Center went from ${dc(first)}% to ${dc(last)}% of revenue.`,
    build: 'An interactive dashboard with nine views, a table behind every chart, and the dataset and sources one click away.',
  }

  return (
    <MotionRoot>
      <main className="pg an">
        <SiteNav links={pageLinks(go, 'analytics')} cta={{ label: 'Email me ↗', onClick: () => { window.location.href = `mailto:${profile.contact.email}` } }} onName={() => go('/', { state: { resume: true } })} />

        <PageHero
          size="xl"
          index="PGDM"
          kicker={`Business Analytics · ${pgdm.institution} · ${pgdm.period}`}
          title="Analytics *in practice*"
          lede="How I take a question from a decision to a dashboard — and the tools I use along the way, each linked to where I've used it."
          actions={<>
            <Magnetic className="h-pill h-pill--solid" onClick={() => document.getElementById('approach')?.scrollIntoView({ behavior: 'smooth' })}>The approach ↓</Magnetic>
            <Magnetic className="h-pill" onClick={() => go('/hall')}>Analytics Hall ↗</Magnetic>
          </>}
          cue
        />

        <Approach steps={approach.map((s) => ({ ...s, example: inCase[s.id] }))} />

        <section className="an-sec an-proof" aria-label="The NVIDIA case in numbers">
          <StatBand stats={[
            { value: sources.length, label: 'Primary sources behind the case' },
            { value: YEARS.length, label: `Fiscal years compared (${first}–${last})` },
            { value: cagr, label: 'Revenue CAGR found', suffix: '%', format: (n) => n.toFixed(0) },
            { value: 9, label: 'Dashboard views built' },
          ]} />
        </section>

        <Tools go={go} />

        <section className="an-sec an-cta">
          <CtaTitle />
          <div className="row">
            <Magnetic className="h-pill h-pill--solid" onClick={() => go('/hall')}>Open the Analytics Hall ↗</Magnetic>
            <Magnetic className="h-pill" onClick={() => go('/', { state: { scrollTo: 'contact' } })}>Get in touch ↗</Magnetic>
          </div>
        </section>
      </main>
    </MotionRoot>
  )
}

/* ---------------- Approach: four steps joined by a line that draws itself ---------------- */
function Approach({ steps }) {
  const head = useRef(null)
  const grid = useRef(null)
  useSplitReveal(head, { split: 'words', on: 'view', step: 100 })
  useReveal(grid, { selector: '.an-step', step: 120, y: 34 })
  useDraw(grid, { selector: '[data-draw]', duration: 2200 })
  return (
    <section id="approach" className="an-sec" aria-labelledby="approach-title">
      <p className="h-kicker">01 · Approach</p>
      <h2 id="approach-title" ref={head} className="h-giant an-giant">{rich('How I *work*')}</h2>
      <div ref={grid} className="an-steps">
        <svg className="an-line" viewBox="0 0 1000 10" preserveAspectRatio="none" aria-hidden="true">
          <line data-draw x1="0" y1="5" x2="1000" y2="5" />
        </svg>
        {steps.map((s, i) => (
          <article key={s.id} className="an-step">
            <span className="an-step-n">{pad2(i + 1)}</span>
            <MosaicLogo icon={STEP_ICON[s.id]} size={64} delay={i * 180} />
            <h3 className="an-step-t">{s.title}</h3>
            <p className="an-step-d">{s.text}</p>
            <p className="an-step-x"><span className="mono">In the NVIDIA case</span>{s.example}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

/* ---------------- Tools & skills, each with its evidence ---------------- */
function Tools({ go }) {
  const head = useRef(null)
  const list = useRef(null)
  useSplitReveal(head, { split: 'words', on: 'view', step: 100 })
  useReveal(list, { selector: '.an-row', step: 60, y: 22 })
  return (
    <section className="an-sec" aria-labelledby="tools-title">
      <p className="h-kicker">02 · Tools & skills</p>
      <h2 id="tools-title" ref={head} className="h-giant an-giant">{rich('Tools & *evidence*')}</h2>
      <div className="an-legend">
        {Object.entries(SKILL_LEVELS).map(([k, v]) => (
          <span key={k} className={`an-lvl an-lvl--${k}`} title={v.hint}>{v.label}<em> — {v.hint}</em></span>
        ))}
      </div>
      <div ref={list} className="an-groups">
        {skillGroups.map((g) => (
          <div key={g.id} className="an-group">
            <h3 className="an-group-t"><strong>{g.title}</strong> <em>{g.caption}</em></h3>
            <ul className="an-rows">
              {g.skills.map((sk) => (
                <li key={sk.id} className="an-row">
                  <span className="an-row-name">{sk.name}</span>
                  <span className={`an-lvl an-lvl--${sk.level}`}>{SKILL_LEVELS[sk.level].label}</span>
                  <span className="an-row-note">{sk.note}</span>
                  <span className="an-row-ev">
                    {isTodo(sk.evidence) || !sk.evidence ? <Todo value={sk.evidence ?? { todo: true, label: 'Where you used it' }} inline /> : sk.evidence.map((e) =>
                      e.to ? <button key={e.label} className="an-ev" onClick={() => go(e.to)}>{e.label} ↗</button>
                        : <span key={e.label} className="an-ev an-ev--static">{e.label}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

function CtaTitle() {
  const ref = useRef(null)
  useSplitReveal(ref, { split: 'words', on: 'view', step: 100 })
  return <h2 ref={ref} className="h-giant an-giant">{rich('See it *applied*')}</h2>
}
