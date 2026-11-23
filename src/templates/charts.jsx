import { useMemo, useRef } from 'react'
import { animate, stagger, useCountUp, useDraw, useReveal, utils, prefersReduced, whenVisible, useAnime } from '../motion/anime'

/**
 * Lightweight SVG charts for templates (no chart library → tiny, and every
 * mark can be animated). Use Recharts in full dashboards; use these for
 * editorial "evidence" blocks.
 */

const W = 640, H = 280, PAD = { l: 52, r: 18, t: 18, b: 34 }

/** Round axis: 4–6 ticks on 1 / 2 / 2.5 / 5 steps, picking the tightest fit. */
function niceScale(v) {
  if (v <= 0) return { max: 1, step: 0.25 }
  let best = null
  for (const count of [4, 5, 6]) {
    const raw = v / count
    const e = Math.pow(10, Math.floor(Math.log10(raw)))
    const step = [1, 2, 2.5, 5, 10].map((m) => m * e).find((s) => s >= raw)
    if (!best || step * count < best.max) best = { max: step * count, step }
  }
  return best
}

/**
 * Line chart whose lines draw themselves when scrolled into view.
 *   data   = [{ label: 'FY22', revenue: 26914, netIncome: 9752 }, …]
 *   series = [{ key: 'revenue', label: 'Revenue' }, …]   (first series is the accent)
 *   format = (n) => '$27.0B'
 */
export function LineDraw({ data, series, format = (n) => n.toLocaleString(), axisFormat, title, caption }) {
  const ref = useRef(null)
  const { max, step } = useMemo(() => niceScale(Math.max(...data.flatMap((d) => series.map((s) => d[s.key] ?? 0)))), [data, series])
  const x = (i) => PAD.l + (i * (W - PAD.l - PAD.r)) / Math.max(1, data.length - 1)
  const y = (v) => H - PAD.b - (v / max) * (H - PAD.t - PAD.b)
  const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step)

  useDraw(ref, {
    selector: '[data-draw]',
    after: (root, instant) => {
      const dots = root.querySelectorAll('.lc-dot, .lc-area, .lc-end')
      if (instant) return
      animate(dots, { opacity: [0, 1], duration: 500, delay: stagger(30) })
    },
  }, [data.length])
  useAnime(ref, (root) => {
    if (prefersReduced()) return
    utils.set(root.querySelectorAll('.lc-dot, .lc-area, .lc-end'), { opacity: 0 })
  }, [data.length])

  return (
    <figure ref={ref} className="t-chart">
      {title && <figcaption className="t-chart-title">{title}</figcaption>}
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title || 'Line chart'}>
        <defs>
          <linearGradient id="lc-fade" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.22" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t} className="lc-grid">
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} />
            <text x={PAD.l - 8} y={y(t)} dy="0.32em" textAnchor="end">{(axisFormat ?? format)(t)}</text>
          </g>
        ))}
        {data.map((d, i) => (
          <text key={d.label} className="lc-x" x={x(i)} y={H - 10} textAnchor="middle">{d.label}</text>
        ))}
        <path
          className="lc-area"
          d={`M${x(0)},${y(0)} ` + data.map((d, i) => `L${x(i)},${y(d[series[0].key] ?? 0)}`).join(' ') + ` L${x(data.length - 1)},${y(0)} Z`}
          fill="url(#lc-fade)"
        />
        {series.map((s, si) => (
          <g key={s.key} className={`lc-series lc-series--${si}`}>
            <polyline data-draw points={data.map((d, i) => `${x(i)},${y(d[s.key] ?? 0)}`).join(' ')} />
            {data.map((d, i) => <circle key={i} className="lc-dot" cx={x(i)} cy={y(d[s.key] ?? 0)} r={si === 0 ? 3.6 : 2.8} />)}
            <text className="lc-end" x={x(data.length - 1) - 6} y={y(data[data.length - 1][s.key] ?? 0) - 10} textAnchor="end">
              {format(data[data.length - 1][s.key] ?? 0)}
            </text>
          </g>
        ))}
      </svg>
      <div className="t-legend">
        {series.map((s, si) => <span key={s.key} className={`t-legend-i t-legend-i--${si}`}><i />{s.label}</span>)}
      </div>
      {caption && <p className="t-chart-cap">{caption}</p>}
    </figure>
  )
}

/**
 * Horizontal bars that grow when visible. items = [{ label, value, note? }]
 * `highlight` = label to emphasise.
 */
export function BarRace({ items, format = (n) => n.toLocaleString(), title, caption, highlight }) {
  const ref = useRef(null)
  const max = Math.max(...items.map((i) => i.value))
  useAnime(ref, (root) => {
    const bars = root.querySelectorAll('.br-fill')
    if (prefersReduced()) return
    utils.set(bars, { scaleX: 0 })
    return whenVisible(root, () => animate(bars, { scaleX: [0, 1], duration: 1200, ease: 'outExpo', delay: stagger(90) }))
  }, [items.length])
  return (
    <figure ref={ref} className="t-chart t-bars">
      {title && <figcaption className="t-chart-title">{title}</figcaption>}
      <ul>
        {items.map((it) => (
          <li key={it.label} className={it.label === highlight ? 'is-hi' : ''}>
            <span className="br-label">{it.label}</span>
            <span className="br-track"><span className="br-fill" style={{ width: `${(it.value / max) * 100}%` }} /></span>
            <span className="br-val mono">{format(it.value)}</span>
          </li>
        ))}
      </ul>
      {caption && <p className="t-chart-cap">{caption}</p>}
    </figure>
  )
}

/** Row of big numbers that count up. stats = [{ value, label, format?, prefix?, suffix?, note? }] */
export function StatBand({ stats }) {
  const ref = useRef(null)
  useReveal(ref, { selector: ':scope > .t-stat', step: 90 })
  return (
    <div ref={ref} className="t-stats">
      {stats.map((s) => <Stat key={s.label} {...s} />)}
    </div>
  )
}

function Stat({ value, label, note, format, prefix = '', suffix = '' }) {
  const num = useRef(null)
  const isNum = typeof value === 'number'
  useCountUp(num, isNum ? value : null, { format: format ?? ((n) => Math.round(n).toLocaleString('en-US')) })
  return (
    <div className="t-stat">
      <div className="t-stat-v">
        {prefix}<span ref={num}>{isNum ? (format ?? ((n) => Math.round(n).toLocaleString('en-US')))(value) : value}</span>{suffix}
      </div>
      <div className="t-stat-l">{label}</div>
      {note && <div className="t-stat-n mono">{note}</div>}
    </div>
  )
}
