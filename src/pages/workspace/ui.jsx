import { useState } from 'react'

/* Validated dark categorical palette (dataviz validator: all checks pass on #111216).
 * Colors follow the ENTITY, never its rank: hiding a series never repaints the rest. */
export const SERIES = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181']
export const SURFACE = '#111216'
export const GRID = '#23252b'
export const INK = { primary: '#f0efec', secondary: '#c3c2b7', muted: '#8d8c85' }

export const fmtB = (m, d = 1) => (m == null ? '—' : `$${(m / 1000).toFixed(d)}B`)
export const fmtPct = (v, d = 1) => (v == null ? '—' : `${v.toFixed(d)}%`)
export const fmtSigned = (v, d = 1, unit = '%') => (v == null ? '—' : `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(d)}${unit}`)

export const axisProps = {
  tick: { fill: INK.muted, fontSize: 12, fontFamily: 'Inter, sans-serif' },
  tickLine: false,
  axisLine: false,
}
export const gridProps = { stroke: GRID, vertical: false }

export function Kpi({ label, value, delta, note }) {
  return (
    <div className="kpi">
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value}</p>
      {delta && <p className="kpi-delta">{delta}</p>}
      {note && <p className="kpi-note">{note}</p>}
    </div>
  )
}

/** A chart card with title, legend, and a table view (accessibility + exactness). */
export function ChartCard({ title, subtitle, legend, table, children, className = '', footnote }) {
  const [asTable, setAsTable] = useState(false)
  return (
    <figure className={`card chart-card ${className}`}>
      <figcaption className="card-head">
        <div>
          <h3>{title}</h3>
          {subtitle && <p className="muted">{subtitle}</p>}
        </div>
        {table && (
          <button className="chip" aria-pressed={asTable} onClick={() => setAsTable((v) => !v)}>
            {asTable ? 'Chart view' : 'Table view'}
          </button>
        )}
      </figcaption>
      {legend}
      {asTable && table ? <DataTable {...table} /> : <div className="chart-body">{children}</div>}
      {footnote && <p className="footnote">{footnote}</p>}
    </figure>
  )
}

export function DataTable({ columns, rows, caption }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>{columns.map((c) => <th key={c.key} scope="col" className={c.num ? 'num' : ''}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {columns.map((c, j) => {
                const v = c.format ? c.format(r[c.key], r) : r[c.key]
                return j === 0 ? <th key={c.key} scope="row">{v}</th> : <td key={c.key} className={c.num ? 'num' : ''}>{v}</td>
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Legend chips; when `onToggle` is given they also filter series (color stays with the entity). */
export function Legend({ items, hidden = [], onToggle }) {
  return (
    <ul className="legend" aria-label="Legend">
      {items.map((it) => {
        const off = hidden.includes(it.key)
        const Tag = onToggle ? 'button' : 'span'
        return (
          <li key={it.key}>
            <Tag
              className={`legend-item ${off ? 'is-off' : ''}`}
              {...(onToggle ? { onClick: () => onToggle(it.key), 'aria-pressed': !off } : {})}
            >
              <i style={{ background: it.color }} className={it.line ? 'is-line' : ''} aria-hidden="true" />
              {it.label}
            </Tag>
          </li>
        )
      })}
    </ul>
  )
}

/** Tooltip in text ink; a colored key beside each value carries identity. */
export function Tip({ active, payload, label, format = fmtB, total }) {
  if (!active || !payload?.length) return null
  const rows = payload.filter((p) => p.value != null)
  return (
    <div className="viz-tip">
      <p className="viz-tip-title">{label}</p>
      {rows.map((p) => (
        <p key={p.dataKey} className="viz-tip-row">
          <i style={{ background: p.color || p.fill || p.stroke }} aria-hidden="true" />
          <span>{p.name}</span>
          <strong>{format(p.value, p)}</strong>
        </p>
      ))}
      {total != null && (
        <p className="viz-tip-row viz-tip-total"><span>Total</span><strong>{format(total)}</strong></p>
      )}
    </div>
  )
}

export function Insight({ n, title, children }) {
  return (
    <div className="insight">
      <span className="mono insight-n">{n}</span>
      <div>
        <h4>{title}</h4>
        <p>{children}</p>
      </div>
    </div>
  )
}

export function Cite({ ids }) {
  return <sup className="cite mono">[{ids.join(', ')}]</sup>
}
