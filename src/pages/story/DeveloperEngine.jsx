import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LAYOUTS, SNIPPETS, SESSIONS, CHARTS } from './engineContent'
import { highlight } from '../../components/highlight'
import { useCycle, useInView } from '../../components/useCycle'

const PROMPT = 'aman@engine:~$'
const LINE_MS = 430

/** FINAL CHAPTER — THE DEVELOPER ENGINE: curated layouts; each window cycles its own content. */
export default function DeveloperEngine({ ref }) {
  const sec = useRef(null)
  const stage = useRef(null)
  const inView = useInView(stage, 0.3)
  const [scrollIdx, setScrollIdx] = useState(0)
  const [manual, setManual] = useState(null) // { idx, at }

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const el = sec.current
        if (!el) return
        const r = el.getBoundingClientRect()
        const p = -r.top / Math.max(1, r.height - window.innerHeight)
        setScrollIdx(Math.min(LAYOUTS.length - 1, Math.max(0, Math.floor(p * LAYOUTS.length))))
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll) }
  }, [])

  // a manual layout choice holds until scrolling moves to the next arrangement
  const layoutIdx = manual && manual.at === scrollIdx ? manual.idx : scrollIdx
  const L = LAYOUTS[layoutIdx]

  // three independent rotations, staggered so windows never change at the same moment
  const [ei, nextE] = useCycle(SNIPPETS.length, useCallback(() => 7000, []), inView, 1200)
  const [ti, nextT] = useCycle(SESSIONS.length, useCallback((i) => SESSIONS[i].length * LINE_MS + 3400, []), inView, 0)
  const [pi, nextP] = useCycle(CHARTS.length, useCallback(() => 5200, []), inView, 2600)

  const S = SNIPPETS[ei]
  const lines = useMemo(() => highlight(S.code, S.lang), [S])
  const tabs = [-1, 0, 1, 2].map((d) => SNIPPETS[(ei + d + SNIPPETS.length) % SNIPPETS.length].file)

  return (
    <section
      ref={(el) => { sec.current = el; if (typeof ref === 'function') ref(el) }}
      className="ch ch-engine"
      id="engine"
      aria-labelledby="engine-title"
    >
      <div className="sticky engine-stage" ref={stage}>
        <div className="engine-head">
          <p className="kicker"><span className="mono">07</span> The Developer Engine</p>
          <h2 id="engine-title" className="display-m">Where the analysis<br />becomes <em>software</em>.</h2>
          <div className="layout-switch" role="group" aria-label="Workstation layout">
            {LAYOUTS.map((l, i) => (
              <button key={l.id} aria-pressed={i === layoutIdx} className={i === layoutIdx ? 'is-on' : ''} onClick={() => setManual({ idx: i, at: scrollIdx })}>
                {l.label}
              </button>
            ))}
          </div>
          <p className="engine-hint mono muted">click any window to skip ahead</p>
        </div>

        <div className="engine" data-layout={L.id}>
          <div className="win win-editor" onClick={nextE} aria-label={`Code editor showing ${S.file}`}>
            <WinBar tabs={tabs} active={S.file} count={`${ei + 1}/${SNIPPETS.length}`} />
            <pre className="code" key={ei}>
              <code>
                {lines.map((ln, i) => (
                  <span className="code-line" key={i} style={{ '--i': i }}>
                    <span className="ln">{i + 1}</span>
                    {ln.map((tk, j) => <span key={j} className={tk.cls ? `tk-${tk.cls}` : undefined}>{tk.t}</span>)}
                    {'\n'}
                  </span>
                ))}
              </code>
            </pre>
          </div>

          <div className="win win-term" onClick={nextT} aria-label="Terminal">
            <WinBar title="zsh — engine" count={`${ti + 1}/${SESSIONS.length}`} />
            <Session lines={SESSIONS[ti]} key={ti} ms={LINE_MS} />
          </div>

          <div className="win win-preview" onClick={nextP} aria-label={`Preview: ${CHARTS[pi].caption}`}>
            <WinBar title={`preview — ${CHARTS[pi].title}`} count={`${pi + 1}/${CHARTS.length}`} />
            <MiniChart chart={CHARTS[pi]} key={pi} />
          </div>
        </div>
      </div>
    </section>
  )
}

export function Session({ lines, ms = 430, prompt = PROMPT, className = 'term' }) {
  return (
    <div className={className} aria-live="polite">
      {lines.map(([kind, text], i) => (
        <div key={i} className={`tl tl--${kind}`} style={{ '--i': i, '--ms': `${ms}ms` }}>
          {kind === 'cmd' && <span className="prompt">{prompt} </span>}
          {text}
        </div>
      ))}
      <div className="tl" style={{ '--i': lines.length, '--ms': `${ms}ms` }}><span className="prompt">{prompt} </span><span className="caret" /></div>
    </div>
  )
}

function MiniChart({ chart }) {
  const { type, labels, values, fmt } = chart
  const W = 240, H = 130, top = 26, bottom = 112, left = 12, right = 228
  const min = chart.min ?? 0
  const max = chart.max ?? Math.max(...values) * 1.08
  const y = (v) => bottom - ((v - min) / (max - min)) * (bottom - top)
  const step = (right - left) / values.length
  const x = (i) => left + step * i + step / 2
  const hi = chart.peak ?? values.length - 1
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mini-chart" role="img" aria-label={`${chart.caption}: ${labels.map((l, i) => `${l} ${fmt(values[i])}`).join(', ')}`}>
      <text x={left} y="12" className="mini-cap">{chart.caption}</text>
      <line x1={left} x2={right} y1={bottom} y2={bottom} className="mini-axis" />
      {type === 'bar' && values.map((v, i) => {
        const bw = Math.min(26, step * 0.62)
        return <rect key={i} x={x(i) - bw / 2} y={y(v)} width={bw} height={bottom - y(v)} rx="3" className="mini-bar" style={{ '--i': i }} />
      })}
      {type === 'line' && (
        <>
          <polyline className="mini-line" points={values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} />
          {values.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={i === (chart.mark ?? -1) ? 4 : 2.6} className={`mini-dot ${i === chart.mark ? 'is-mark' : ''}`} />)}
        </>
      )}
      {labels.map((l, i) => <text key={l} x={x(i)} y={H - 6} textAnchor="middle" className="mini-lbl">{l}</text>)}
      <text x={x(hi)} y={Math.max(22, y(values[hi]) - 6)} textAnchor={hi === values.length - 1 ? 'end' : 'middle'} dx={hi === values.length - 1 ? step / 2 - 2 : 0} className="mini-val">{fmt(values[hi])}</text>
    </svg>
  )
}

function WinBar({ title, tabs, active, count }) {
  return (
    <div className="winbar">
      <span className="dots" aria-hidden="true"><i /><i /><i /></span>
      {tabs ? (
        <span className="tabs">
          {tabs.map((t, i) => <span key={`${t}-${i}`} className={`tab ${t === active ? 'is-on' : ''}`}>{t}</span>)}
        </span>
      ) : (
        <span className="wintitle mono">{title}</span>
      )}
      {count && <span className="wincount mono">{count}</span>}
    </div>
  )
}
