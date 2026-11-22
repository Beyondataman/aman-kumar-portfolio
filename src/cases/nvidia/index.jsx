import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, LabelList, ReferenceLine,
} from 'recharts'
import * as D from './data'
import {
  SERIES, SURFACE, INK, axisProps, gridProps, fmtB, fmtPct, fmtSigned,
  Kpi, ChartCard, Legend, Tip, Insight, Cite, DataTable,
} from '../../pages/workspace/ui'

/* ================================================================
 * NVIDIA — analytical workspace views
 * Each section receives { filters, setFilter }. All numbers come
 * from ./data.js; derived metrics are computed here, never typed in.
 * ================================================================ */

export const meta = D.meta
export const years = D.YEARS
export const bars = D.YEARS.map((y) => ({ label: y, value: D.income[y].revenue }))

const { rows: ROWS, cagr: CAGR } = D.derived()
const byYear = Object.fromEntries(ROWS.map((r) => [r.year, r]))
const PCOLOR = Object.fromEntries(D.PLATFORMS.map((p, i) => [p.key, SERIES[i]]))
const RCOLOR = Object.fromEntries(D.REGIONS.map((r, i) => [r.key, SERIES[i]]))
const yearsIn = (f) => D.YEARS.slice(D.YEARS.indexOf(f.from), D.YEARS.indexOf(f.to) + 1)
const cagrOf = (a, b, n) => (Math.pow(b / a, 1 / n) - 1) * 100
const bn = (m) => m / 1000
const chartH = 300
const BAR = 30

export const SECTIONS = [
  { id: 'overview', label: 'Executive Overview' },
  { id: 'financials', label: 'Financial Performance' },
  { id: 'revenue', label: 'Revenue Breakdown' },
  { id: 'growth', label: 'Growth Analysis' },
  { id: 'profitability', label: 'Profitability' },
  { id: 'geography', label: 'Geography' },
  { id: 'risk', label: 'Risk & Concentration' },
  { id: 'methodology', label: 'Methodology' },
  { id: 'sources', label: 'Dataset & Sources' },
]

/** Which filters each view uses (the filter bar shows only relevant controls). */
export const FILTERS_FOR = {
  overview: ['years'],
  financials: ['years'],
  revenue: ['years', 'unit', 'platforms'],
  growth: ['years', 'platforms'],
  profitability: ['years'],
  geography: ['unit'],
  risk: [],
  methodology: [],
  sources: [],
}
export const PLATFORMS = D.PLATFORMS.map((p) => ({ ...p, color: PCOLOR[p.key] }))

/* ---------------------------------------------------------------- */
function Overview({ filters }) {
  const y = yearsIn(filters)
  const r26 = byYear.FY26, r25 = byYear.FY25
  const data = y.map((yr) => ({ year: yr, revenue: bn(D.income[yr].revenue) }))
  const fcfG = (D.cashFlow.FY26.free / D.cashFlow.FY25.free - 1) * 100
  return (
    <>
      <div className="kpis">
        <Kpi label="Revenue · FY26" value={fmtB(r26.revenue)} delta={`${fmtSigned(r26.revenueGrowth, 0)} YoY`} />
        <Kpi label="Net income · FY26" value={fmtB(r26.netIncome)} delta={`${fmtSigned(r26.netIncomeGrowth, 0)} YoY`} />
        <Kpi label="Gross margin · FY26" value={fmtPct(r26.grossMargin)} delta={`${fmtSigned(r26.grossMargin - r25.grossMargin, 1, ' pts')} YoY`} />
        <Kpi label="Data Center share" value={fmtPct(r26.dcShare)} delta={`${fmtSigned(r26.dcShare - r25.dcShare, 1, ' pts')} YoY`} />
        <Kpi label="Free cash flow · FY26" value={fmtB(D.cashFlow.FY26.free)} delta={`${fmtSigned(fcfG, 0)} YoY`} />
      </div>

      <div className="grid-2">
        <ChartCard
          title="Revenue by fiscal year"
          subtitle={`$ billions · ${y[0]}–${y[y.length - 1]}`}
          table={{ columns: [{ key: 'year', label: 'Fiscal year' }, { key: 'revenue', label: 'Revenue ($B)', num: true, format: (v) => v.toFixed(1) }], rows: data }}
        >
          <ResponsiveContainer width="100%" height={chartH}>
            <BarChart data={data} margin={{ top: 24, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="year" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => `$${v}`} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<Tip format={(v) => `$${Number(v).toFixed(1)}B`} />} />
              <Bar dataKey="revenue" name="Revenue" fill={SERIES[0]} radius={[4, 4, 0, 0]} barSize={BAR}>
                <LabelList dataKey="revenue" position="top" fill={INK.secondary} fontSize={12} formatter={(v) => `$${v.toFixed(1)}B`} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="card insights">
          <h3>Executive insights</h3>
          <Insight n="01" title="Eight-fold in four years">
            Revenue rose from {fmtB(D.income.FY22.revenue)} (FY22) to {fmtB(D.income.FY26.revenue)} (FY26) — a {CAGR.toFixed(1)}% compound annual growth rate. <Cite ids={['s1', 's4']} />
          </Insight>
          <Insight n="02" title="Growth is now one business">
            Data Center went from {fmtPct(byYear.FY22.dcShare, 0)} of revenue in FY22 to {fmtPct(r26.dcShare)} in FY26. <Cite ids={['s2', 's4']} />
          </Insight>
          <Insight n="03" title="Margins dipped, then recovered">
            FY26 gross margin fell {Math.abs(r26.grossMargin - r25.grossMargin).toFixed(1)} pts to {fmtPct(r26.grossMargin)}. The $4.5B H20 charge in Q1 alone is ≈{(4500 / D.income.FY26.revenue * 100).toFixed(1)} pts of revenue; by Q4 the quarterly margin was back at 75.0%. <Cite ids={['s1', 's6']} />
          </Insight>
          <Insight n="04" title="Fewer customers, bigger cheques">
            Two direct customers made up 22% and 14% of FY26 revenue (36% combined), versus one customer at 13% in FY24. <Cite ids={['s2']} />
          </Insight>
        </div>
      </div>

      <div className="card prose">
        <h3>Analyst’s read</h3>
        <p>
          NVIDIA’s numbers tell a story of a platform shift captured almost perfectly: accelerated computing for AI moved from a
          segment to the company. The same shift is the main risk — revenue now depends on one end-market, a handful of hyperscale
          buyers, and export policy. The views in this workspace walk through each part of that trade-off.
        </p>
      </div>
    </>
  )
}

/* ---------------------------------------------------------------- */
function Financials({ filters }) {
  const y = yearsIn(filters)
  const data = y.map((yr) => ({ year: yr, revenue: bn(D.income[yr].revenue), netIncome: bn(D.income[yr].netIncome) }))
  const rows = [
    ['Revenue', 'revenue', fmtB], ['Gross profit', 'grossProfit', fmtB], ['Operating expenses', 'opex', fmtB],
    ['Operating income', 'operatingIncome', fmtB], ['Net income', 'netIncome', fmtB], ['Diluted EPS (split-adj.)', 'eps', (v) => `$${v.toFixed(2)}`],
    ['Revenue growth', 'revenueGrowth', (v) => (v == null ? '—' : fmtSigned(v, Math.abs(v) < 10 ? 1 : 0))],
  ]
  const legend = [{ key: 'revenue', label: 'Revenue', color: SERIES[0], line: true }, { key: 'netIncome', label: 'Net income', color: SERIES[1], line: true }]
  return (
    <>
      <div className="card">
        <div className="card-head"><div><h3>Income statement (GAAP)</h3><p className="muted">USD · fiscal years end late January</p></div></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th scope="col">Metric</th>{y.map((yr) => <th key={yr} scope="col" className="num">{yr}</th>)}</tr></thead>
            <tbody>
              {rows.map(([label, key, f]) => (
                <tr key={key}><th scope="row">{label}</th>{y.map((yr) => <td key={yr} className="num">{f(byYear[yr][key])}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="footnote">EPS restated for the 10-for-1 split of June 2024. Sources <Cite ids={['s1', 's3', 's5']} /></p>
      </div>
      <div className="grid-2">
        <ChartCard
          title="Revenue and net income"
          subtitle="$ billions — same unit, one axis"
          legend={<Legend items={legend} />}
          table={{ columns: [{ key: 'year', label: 'Year' }, { key: 'revenue', label: 'Revenue ($B)', num: true, format: (v) => v.toFixed(1) }, { key: 'netIncome', label: 'Net income ($B)', num: true, format: (v) => v.toFixed(1) }], rows: data }}
        >
          <ResponsiveContainer width="100%" height={chartH}>
            <LineChart data={data} margin={{ top: 16, right: 96, left: -8, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="year" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => `$${v}`} />
              <Tooltip content={<Tip format={(v) => `$${Number(v).toFixed(1)}B`} />} />
              <Line dataKey="revenue" name="Revenue" stroke={SERIES[0]} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, stroke: SURFACE }} activeDot={{ r: 6 }}>
                <LabelList dataKey="revenue" content={endLabel(data.length, 'Revenue', SERIES[0])} />
              </Line>
              <Line dataKey="netIncome" name="Net income" stroke={SERIES[1]} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, stroke: SURFACE }} activeDot={{ r: 6 }}>
                <LabelList dataKey="netIncome" content={endLabel(data.length, 'Net income', SERIES[1])} />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <div className="card prose">
          <h3>Reading the statement</h3>
          <p><strong>FY23 was the reset year.</strong> Revenue was flat at {fmtB(D.income.FY23.revenue)} while operating expenses rose {fmtSigned((D.income.FY23.opex / D.income.FY22.opex - 1) * 100, 0)} — including a $1.35B charge for the terminated Arm acquisition — and net income fell {Math.abs(byYear.FY23.netIncomeGrowth).toFixed(0)}%, as gaming channel inventory was worked down.</p>
          <p><strong>FY24–FY26 is operating leverage.</strong> Operating expenses grew roughly 2× while revenue grew {(D.income.FY26.revenue / D.income.FY24.revenue).toFixed(1)}×; opex fell from {fmtPct(byYear.FY22.opexRatio)} of revenue in FY22 to {fmtPct(byYear.FY26.opexRatio)} in FY26.</p>
          <div className="kpis kpis--2">
            <Kpi label="Operating cash flow · FY26" value={fmtB(D.cashFlow.FY26.operating)} delta={`FY25 ${fmtB(D.cashFlow.FY25.operating)}`} />
            <Kpi label="Free cash flow · FY26" value={fmtB(D.cashFlow.FY26.free)} delta={`FY25 ${fmtB(D.cashFlow.FY25.free)}`} />
          </div>
        </div>
      </div>
    </>
  )
}

/** Direct label at the end of a line (selective labelling instead of a number on every point). */
function endLabel(n, text) {
  // eslint-disable-next-line react/display-name
  return (props) => {
    const { x, y, index, value } = props
    if (index !== n - 1) return null
    return (
      <text x={x + 10} y={y + 4} fill={INK.secondary} fontSize={12}>
        {text} ${Number(value).toFixed(0)}B
      </text>
    )
  }
}

/* ---------------------------------------------------------------- */
function RevenueBreakdown({ filters, setFilter }) {
  const y = yearsIn(filters)
  const share = filters.unit === 'share'
  const visible = D.PLATFORMS.filter((p) => !filters.hide.includes(p.key))
  const data = y.map((yr) => {
    const row = { year: yr }
    for (const p of D.PLATFORMS) {
      const v = D.platforms[yr][p.key]
      row[p.key] = share ? (v / D.income[yr].revenue) * 100 : bn(v)
    }
    return row
  })
  const last = visible[visible.length - 1]?.key
  const fmt = share ? (v) => `${Number(v).toFixed(1)}%` : (v) => `$${Number(v).toFixed(1)}B`
  const toggle = (key) => setFilter('hide', filters.hide.includes(key) ? filters.hide.filter((h) => h !== key) : [...filters.hide, key])
  const dc = Object.entries(D.dataCenterSplit).map(([yr, v]) => ({ year: yr, compute: bn(v.compute), networking: bn(v.networking), netShare: (v.networking / (v.compute + v.networking)) * 100 }))

  return (
    <>
      <ChartCard
        title={share ? 'Revenue mix by market platform' : 'Revenue by market platform'}
        subtitle={share ? '% of total revenue' : '$ billions, stacked'}
        legend={<Legend items={PLATFORMS} hidden={filters.hide} onToggle={toggle} />}
        table={{
          columns: [{ key: 'year', label: 'Year' }, ...D.PLATFORMS.map((p) => ({ key: p.key, label: p.label, num: true, format: (v) => fmt(v) }))],
          rows: data,
        }}
        footnote={<>Click a legend item to hide or show a platform. Shares are of total revenue, so they do not re-normalise when platforms are hidden. <Cite ids={['s2', 's4']} /></>}
      >
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={data} margin={{ top: 16, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="year" {...axisProps} />
            <YAxis {...axisProps} tickFormatter={(v) => (share ? `${v}%` : `$${v}`)} domain={share ? [0, 100] : [0, 'auto']} />
            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<Tip format={fmt} />} />
            {visible.map((p) => (
              <Bar key={p.key} dataKey={p.key} name={p.label} stackId="a" fill={PCOLOR[p.key]} stroke={SURFACE} strokeWidth={2}
                radius={p.key === last ? [4, 4, 0, 0] : 0} barSize={BAR + 8} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid-2">
        <ChartCard
          title="Inside Data Center: compute vs networking"
          subtitle="$ billions · disclosed from FY24"
          legend={<Legend items={[{ key: 'c', label: 'Compute', color: SERIES[0] }, { key: 'n', label: 'Networking', color: SERIES[1] }]} />}
          table={{ columns: [{ key: 'year', label: 'Year' }, { key: 'compute', label: 'Compute ($B)', num: true, format: (v) => v.toFixed(1) }, { key: 'networking', label: 'Networking ($B)', num: true, format: (v) => v.toFixed(1) }, { key: 'netShare', label: 'Networking share', num: true, format: (v) => `${v.toFixed(1)}%` }], rows: dc }}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dc} margin={{ top: 16, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="year" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => `$${v}`} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<Tip format={(v) => `$${Number(v).toFixed(1)}B`} />} />
              <Bar dataKey="compute" name="Compute" stackId="d" fill={SERIES[0]} stroke={SURFACE} strokeWidth={2} barSize={BAR + 8} />
              <Bar dataKey="networking" name="Networking" stackId="d" fill={SERIES[1]} stroke={SURFACE} strokeWidth={2} radius={[4, 4, 0, 0]} barSize={BAR + 8} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <div className="card prose">
          <h3>What changed in the mix</h3>
          <p>In FY22 Gaming was the largest platform ({fmtB(D.platforms.FY22.gaming)} vs {fmtB(D.platforms.FY22.dataCenter)} for Data Center). By FY26 Data Center was {(D.platforms.FY26.dataCenter / D.platforms.FY26.gaming).toFixed(0)}× Gaming.</p>
          <p>Gaming did not shrink — it grew to {fmtB(D.platforms.FY26.gaming)} — it was simply outgrown.</p>
          <p>Networking more than doubled in FY26 to {fmtB(D.dataCenterSplit.FY26.networking)}, rising to {dc[2].netShare.toFixed(1)}% of Data Center revenue: buyers are purchasing whole systems, not just GPUs.</p>
        </div>
      </div>
    </>
  )
}

/* ---------------------------------------------------------------- */
function Growth({ filters }) {
  const y = yearsIn(filters)
  const visible = D.PLATFORMS.filter((p) => !filters.hide.includes(p.key))
  const yoy = y.slice(1).map((yr) => {
    const prev = D.YEARS[D.YEARS.indexOf(yr) - 1]
    const row = { year: yr }
    for (const p of D.PLATFORMS) row[p.key] = (D.platforms[yr][p.key] / D.platforms[prev][p.key] - 1) * 100
    row.total = (D.income[yr].revenue / D.income[prev].revenue - 1) * 100
    return row
  })
  const n = D.YEARS.length - 1
  const q = D.quarters.map((x) => ({ ...x, revenue: bn(x.revenue), dataCenter: bn(x.dataCenter) }))
  const legend = [{ key: 'r', label: 'Total revenue', color: SERIES[0], line: true }, { key: 'd', label: 'Data Center', color: SERIES[1], line: true }]
  return (
    <>
      <div className="kpis">
        <Kpi label="Revenue CAGR FY22→FY26" value={fmtPct(CAGR)} />
        {D.PLATFORMS.slice(0, 4).map((p) => (
          <Kpi key={p.key} label={`${p.label} CAGR`} value={fmtPct(cagrOf(D.platforms.FY22[p.key], D.platforms.FY26[p.key], n))} />
        ))}
      </div>
      <div className="card">
        <div className="card-head"><div><h3>Year-over-year growth by platform</h3><p className="muted">% change vs prior fiscal year · ▲ growth ▼ decline</p></div></div>
        {yoy.length ? (
          <DataTable
            columns={[
              { key: 'year', label: 'Year' },
              ...visible.map((p) => ({ key: p.key, label: p.label, num: true, format: (v) => `${v >= 0 ? '▲' : '▼'} ${Math.abs(v).toFixed(0)}%` })),
              { key: 'total', label: 'Total', num: true, format: (v) => `${v >= 0 ? '▲' : '▼'} ${Math.abs(v).toFixed(0)}%` },
            ]}
            rows={yoy}
          />
        ) : <p className="muted">Select at least two fiscal years to compare growth.</p>}
      </div>
      <ChartCard
        title="Quarterly revenue, FY25–FY26"
        subtitle="$ billions per quarter"
        legend={<Legend items={legend} />}
        table={{ columns: [{ key: 'q', label: 'Quarter' }, { key: 'revenue', label: 'Revenue ($B)', num: true, format: (v) => v.toFixed(1) }, { key: 'dataCenter', label: 'Data Center ($B)', num: true, format: (v) => v.toFixed(1) }], rows: q }}
        footnote={<>Quarterly view is fixed to the eight most recent quarters. <Cite ids={['s1', 's6', 's7']} /></>}
      >
        <ResponsiveContainer width="100%" height={chartH}>
          <LineChart data={q} margin={{ top: 16, right: 24, left: -8, bottom: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="q" {...axisProps} interval={0} tick={{ ...axisProps.tick, fontSize: 11 }} tickFormatter={(v) => v.replace(' FY', "'")} />
            <YAxis {...axisProps} tickFormatter={(v) => `$${v}`} />
            <Tooltip content={<Tip format={(v) => `$${Number(v).toFixed(1)}B`} />} />
            <Line dataKey="revenue" name="Total revenue" stroke={SERIES[0]} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, stroke: SURFACE }} />
            <Line dataKey="dataCenter" name="Data Center" stroke={SERIES[1]} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, stroke: SURFACE }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </>
  )
}

/* ---------------------------------------------------------------- */
function Profitability({ filters }) {
  const y = yearsIn(filters)
  const m = y.map((yr) => ({ year: yr, gross: byYear[yr].grossMargin, operating: byYear[yr].operatingMargin, net: byYear[yr].netMargin }))
  const seg = Object.entries(D.segments).map(([yr, s]) => ({
    year: yr, cn: bn(s.cnOpInc), gr: bn(s.grOpInc), cnM: (s.cnOpInc / s.cnRevenue) * 100, grM: (s.grOpInc / s.grRevenue) * 100,
  }))
  const legend = [
    { key: 'g', label: 'Gross margin', color: SERIES[0], line: true },
    { key: 'o', label: 'Operating margin', color: SERIES[1], line: true },
    { key: 'n', label: 'Net margin', color: SERIES[2], line: true },
  ]
  return (
    <>
      <div className="grid-2">
        <ChartCard
          title="Margins"
          subtitle="% of revenue (GAAP)"
          legend={<Legend items={legend} />}
          table={{ columns: [{ key: 'year', label: 'Year' }, { key: 'gross', label: 'Gross', num: true, format: (v) => fmtPct(v) }, { key: 'operating', label: 'Operating', num: true, format: (v) => fmtPct(v) }, { key: 'net', label: 'Net', num: true, format: (v) => fmtPct(v) }], rows: m }}
        >
          <ResponsiveContainer width="100%" height={chartH}>
            <LineChart data={m} margin={{ top: 16, right: 16, left: -8, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="year" {...axisProps} />
              <YAxis {...axisProps} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<Tip format={(v) => fmtPct(Number(v))} />} />
              <Line dataKey="gross" name="Gross margin" stroke={SERIES[0]} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, stroke: SURFACE }} />
              <Line dataKey="operating" name="Operating margin" stroke={SERIES[1]} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, stroke: SURFACE }} />
              <Line dataKey="net" name="Net margin" stroke={SERIES[2]} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, stroke: SURFACE }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Quarterly gross margin"
          subtitle="% · FY25–FY26"
          table={{ columns: [{ key: 'q', label: 'Quarter' }, { key: 'grossMargin', label: 'Gross margin', num: true, format: (v) => fmtPct(v) }], rows: D.quarters }}
          footnote={<>Q1 FY26 includes a $4.5B charge for H20 excess inventory and purchase obligations after a US export licence requirement. <Cite ids={['s6']} /></>}
        >
          <ResponsiveContainer width="100%" height={chartH}>
            <LineChart data={D.quarters} margin={{ top: 16, right: 30, left: -8, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="q" {...axisProps} interval={0} tick={{ ...axisProps.tick, fontSize: 10 }} tickFormatter={(v) => v.replace(' FY', "'")} />
              <YAxis {...axisProps} domain={[50, 85]} ticks={[50, 60, 70, 80]} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<Tip format={(v) => fmtPct(Number(v))} />} />
              <ReferenceLine x="Q1 FY26" stroke={INK.muted} strokeWidth={1} label={{ value: 'H20 charge', fill: INK.secondary, fontSize: 11, position: 'insideTopRight' }} />
              <Line dataKey="grossMargin" name="Gross margin" stroke={SERIES[0]} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, stroke: SURFACE }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <div className="grid-2">
        <ChartCard
          title="Segment operating income"
          subtitle="$ billions · reportable segments"
          legend={<Legend items={[{ key: 'cn', label: 'Compute & Networking', color: SERIES[0] }, { key: 'gr', label: 'Graphics', color: SERIES[1] }]} />}
          table={{ columns: [{ key: 'year', label: 'Year' }, { key: 'cn', label: 'C&N ($B)', num: true, format: (v) => v.toFixed(1) }, { key: 'cnM', label: 'C&N margin', num: true, format: (v) => fmtPct(v) }, { key: 'gr', label: 'Graphics ($B)', num: true, format: (v) => v.toFixed(1) }, { key: 'grM', label: 'Graphics margin', num: true, format: (v) => fmtPct(v) }], rows: seg }}
          footnote={<>Segment operating income excludes the “All Other” category (stock-based compensation, corporate costs, acquisition charges). <Cite ids={['s2']} /></>}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={seg} margin={{ top: 16, right: 8, left: -8, bottom: 0 }} barGap={4}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="year" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => `$${v}`} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<Tip format={(v) => `$${Number(v).toFixed(1)}B`} />} />
              <Bar dataKey="cn" name="Compute & Networking" fill={SERIES[0]} radius={[4, 4, 0, 0]} barSize={BAR} />
              <Bar dataKey="gr" name="Graphics" fill={SERIES[1]} radius={[4, 4, 0, 0]} barSize={BAR} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <div className="card prose">
          <h3>Where the profit comes from</h3>
          <p>Compute &amp; Networking earned a {fmtPct(seg[2].cnM)} segment operating margin in FY26 against {fmtPct(seg[2].grM)} for Graphics — and it is {(D.segments.FY26.cnRevenue / D.income.FY26.revenue * 100).toFixed(0)}% of revenue.</p>
          <p>Operating expenses fell from {fmtPct(byYear.FY22.opexRatio)} to {fmtPct(byYear.FY26.opexRatio)} of revenue between FY22 and FY26: the cost base scaled far slower than sales.</p>
        </div>
      </div>
    </>
  )
}

/* ---------------------------------------------------------------- */
function Geography({ filters }) {
  const share = filters.unit === 'share'
  const data = Object.entries(D.geography).map(([yr, g]) => {
    const row = { year: yr }
    for (const r of D.REGIONS) row[r.key] = share ? (g[r.key] / D.income[yr].revenue) * 100 : bn(g[r.key])
    return row
  })
  const fmt = share ? (v) => `${Number(v).toFixed(1)}%` : (v) => `$${Number(v).toFixed(1)}B`
  const regions = D.REGIONS.map((r) => ({ ...r, color: RCOLOR[r.key] }))
  const china = Object.entries(D.geography).map(([yr, g]) => (g.china / D.income[yr].revenue) * 100)
  return (
    <>
      <div className="grid-2">
        <ChartCard
          title="Revenue by customer headquarters"
          subtitle={share ? '% of total revenue' : '$ billions, stacked'}
          legend={<Legend items={regions} />}
          table={{ columns: [{ key: 'year', label: 'Year' }, ...D.REGIONS.map((r) => ({ key: r.key, label: r.label, num: true, format: fmt }))], rows: data }}
          footnote={<>Recast basis from the FY26 10-K. <Cite ids={['s2']} /></>}
        >
          <ResponsiveContainer width="100%" height={chartH}>
            <BarChart data={data} margin={{ top: 16, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="year" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => (share ? `${v}%` : `$${v}`)} domain={share ? [0, 100] : [0, 'auto']} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<Tip format={fmt} />} />
              {D.REGIONS.map((r, i) => (
                <Bar key={r.key} dataKey={r.key} name={r.label} stackId="g" fill={RCOLOR[r.key]} stroke={SURFACE} strokeWidth={2}
                  radius={i === D.REGIONS.length - 1 ? [4, 4, 0, 0] : 0} barSize={BAR + 8} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <div className="card prose">
          <h3>A methodology change worth knowing</h3>
          <p>Until Q3 FY26 NVIDIA reported geography by <strong>customer billing location</strong>. It now reports by <strong>customer headquarters</strong> and recast prior years.</p>
          <p>Under the old basis FY25 showed Singapore at $23.7B — mostly an invoicing hub. Under the new basis Singapore disappears and the United States rises from $61.3B to $77.5B. <Cite ids={['s2', 's8']} /></p>
          <p>NVIDIA estimates 76% of FY26 Data Center revenue from Taiwan-headquartered customers was attributed to end customers in the United States and Europe.</p>
          <p><strong>China (incl. Hong Kong)</strong> fell from {china[0].toFixed(1)}% of revenue in FY24 to {china[2].toFixed(1)}% in FY26.</p>
        </div>
      </div>
      <div className="card">
        <div className="card-head"><div><h3>FY25 as originally reported (billing location)</h3><p className="muted">For comparison with the recast above</p></div></div>
        <DataTable
          columns={[{ key: 'region', label: 'Region' }, { key: 'value', label: 'Revenue', num: true, format: (v) => fmtB(v) }, { key: 'share', label: 'Share', num: true, format: (_, r) => fmtPct((r.value / D.income.FY25.revenue) * 100) }]}
          rows={D.geographyFY25Billing}
        />
      </div>
    </>
  )
}

const topKey = (row) => (row.c3 ? 'c3' : row.c2 ? 'c2' : 'c1')
/** Bar segment with 4px rounded top only when it is the top of its stack. */
function TopRounded({ x, y, width, height, fill, stroke, strokeWidth, isTop }) {
  if (!height || height <= 0) return null
  const r = isTop ? Math.min(4, height) : 0
  const d = `M${x},${y + height} V${y + r} Q${x},${y} ${x + r},${y} H${x + width - r} Q${x + width},${y} ${x + width},${y + r} V${y + height} Z`
  return <path d={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
}

/* ---------------------------------------------------------------- */
function Risk() {
  const conc = Object.entries(D.customers).map(([yr, c]) => ({ year: yr, c1: c[0] ?? 0, c2: c[1] ?? 0, c3: c[2] ?? 0, total: c.reduce((a, b) => a + b, 0) }))
  const dep = ROWS.map((r) => ({ year: r.year, dc: r.dcShare }))
  const legend = [
    { key: 'c1', label: 'Largest direct customer', color: SERIES[0] },
    { key: 'c2', label: 'Second', color: SERIES[1] },
    { key: 'c3', label: 'Third', color: SERIES[2] },
  ]
  const risks = [
    { lvl: 'High', t: 'Export controls', d: 'A US licence requirement on H20 sales to China led to a $4.5B Q1 FY26 charge; NVIDIA’s Q1 FY27 outlook assumes no Data Center compute revenue from China.', s: ['s1', 's6'] },
    { lvl: 'High', t: 'Customer concentration', d: 'Two direct customers were 36% of FY26 revenue. A spending pause by one hyperscaler would be visible in the top line.', s: ['s2'] },
    { lvl: 'High', t: 'End-market concentration', d: `Data Center is ${fmtPct(byYear.FY26.dcShare)} of revenue; growth depends on continued AI infrastructure investment.`, s: ['s2'] },
    { lvl: 'Medium', t: 'Supply chain', d: 'NVIDIA is fabless: manufacturing, packaging and memory come from a small number of external suppliers, many in Taiwan.', s: [] },
    { lvl: 'Medium', t: 'Cyclicality', d: 'FY23 showed how quickly demand can reset: flat revenue and a 55% fall in net income during a channel inventory correction.', s: ['s4', 's5'] },
  ]
  return (
    <>
      <div className="grid-2">
        <ChartCard
          title="Direct customers ≥10% of revenue"
          subtitle="% of total revenue · customers are anonymous and may differ year to year"
          legend={<Legend items={legend} />}
          table={{ columns: [{ key: 'year', label: 'Year' }, { key: 'c1', label: 'Largest', num: true, format: (v) => (v ? `${v}%` : '—') }, { key: 'c2', label: 'Second', num: true, format: (v) => (v ? `${v}%` : '—') }, { key: 'c3', label: 'Third', num: true, format: (v) => (v ? `${v}%` : '—') }, { key: 'total', label: 'Combined', num: true, format: (v) => `${v}%` }], rows: conc }}
          footnote={<><Cite ids={['s2']} /></>}
        >
          <ResponsiveContainer width="100%" height={chartH}>
            <BarChart data={conc} margin={{ top: 24, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="year" {...axisProps} />
              <YAxis {...axisProps} domain={[0, 50]} ticks={[0, 10, 20, 30, 40, 50]} tickFormatter={(v) => `${v}%`} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<Tip format={(v) => (v ? `${v}%` : '—')} />} />
              {['c1', 'c2', 'c3'].map((key, k) => (
                <Bar key={key} dataKey={key} name={legend[k].label} stackId="c" fill={SERIES[k]} stroke={SURFACE} strokeWidth={2} barSize={BAR + 8}
                  shape={(props) => <TopRounded {...props} isTop={topKey(conc[props.index]) === key} />}>
                  <LabelList dataKey="total" content={(p) => (topKey(conc[p.index]) === key ? (
                    <text x={p.x + p.width / 2} y={p.y - 8} textAnchor="middle" fill={INK.secondary} fontSize={12}>{p.value}% combined</text>
                  ) : null)} />
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Dependence on Data Center"
          subtitle="Data Center as % of total revenue"
          table={{ columns: [{ key: 'year', label: 'Year' }, { key: 'dc', label: 'Data Center share', num: true, format: (v) => fmtPct(v) }], rows: dep }}
        >
          <ResponsiveContainer width="100%" height={chartH}>
            <LineChart data={dep} margin={{ top: 24, right: 24, left: -8, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="year" {...axisProps} />
              <YAxis {...axisProps} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<Tip format={(v) => fmtPct(Number(v))} />} />
              <Line dataKey="dc" name="Data Center share" stroke={SERIES[0]} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, stroke: SURFACE }}>
                <LabelList dataKey="dc" position="top" fill={INK.secondary} fontSize={12} formatter={(v) => `${v.toFixed(0)}%`} />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <div className="card">
        <div className="card-head"><div><h3>Risk register</h3><p className="muted">Analyst assessment based on the disclosures cited</p></div></div>
        <ul className="risks">
          {risks.map((r) => (
            <li key={r.t} className={`risk risk--${r.lvl.toLowerCase()}`}>
              <span className="risk-lvl"><span aria-hidden="true">{r.lvl === 'High' ? '▲' : '◆'}</span> {r.lvl}</span>
              <div><h4>{r.t}</h4><p>{r.d} {r.s.length > 0 && <Cite ids={r.s} />}</p></div>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

/* ---------------------------------------------------------------- */
function Methodology() {
  return (
    <div className="card prose prose--wide">
      <h3>Question</h3>
      <p>{D.meta.question}</p>
      <h3>Data collection</h3>
      <p>Figures were taken from NVIDIA’s own annual reports (Form 10-K) and quarterly earnings releases. Where a later filing restated an earlier year, the later filing is used. Every source is listed under <em>Dataset &amp; Sources</em> with what it supplied.</p>
      <h3>Definitions</h3>
      <ul>
        <li><strong>Fiscal year</strong> — NVIDIA’s year ends on the last Sunday of January; FY26 = year ended {D.yearEnd.FY26}.</li>
        <li><strong>Margins</strong> — gross profit, operating income or net income ÷ revenue (GAAP).</li>
        <li><strong>Growth</strong> — (current ÷ prior) − 1. <strong>CAGR</strong> — (FY26 ÷ FY22)<sup>1/4</sup> − 1.</li>
        <li><strong>Share</strong> — a platform’s or region’s revenue ÷ total revenue for the same year.</li>
        <li><strong>Segment margin</strong> — segment operating income ÷ segment revenue; excludes “All Other”.</li>
      </ul>
      <h3>Adjustments</h3>
      <ul>
        <li>EPS restated for the 10-for-1 stock split of June 2024.</li>
        <li>Geography uses the customer-headquarters basis adopted in Q3 FY26 (FY24–FY26 recast by NVIDIA). The original FY25 billing-location table is shown for comparison.</li>
        <li>“Automotive” is labelled “Automotive &amp; Robotics” to match NVIDIA’s FY26 naming.</li>
      </ul>
      <h3>Limitations</h3>
      <ul>
        <li>Customer concentration covers only <em>direct</em> customers above 10%; NVIDIA does not name them, and they may differ across years.</li>
        <li>Data Center compute / networking is disclosed only from FY24.</li>
        <li>This is a historical analysis of reported results, not a valuation or investment recommendation.</li>
      </ul>
      <h3>Reproducibility</h3>
      <p>All derived numbers on these pages are computed in the browser from the raw dataset, which you can download as CSV from <em>Dataset &amp; Sources</em>.</p>
    </div>
  )
}

/* ---------------------------------------------------------------- */
function Sources() {
  const flat = D.flatDataset()
  const download = () => {
    const csv = ['fiscal_period,table,metric,value', ...flat.map((r) => `${r.fiscalYear},${r.table},${r.metric},${r.value}`)].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url; a.download = 'nvidia_case_study_dataset.csv'
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const tables = [
    ['income', 'Income statement (GAAP)', 'FY22–FY26', 'USD millions'],
    ['platform_revenue', 'Revenue by market platform', 'FY22–FY26', 'USD millions'],
    ['segments', 'Segment revenue & operating income', 'FY24–FY26', 'USD millions'],
    ['geography_hq', 'Revenue by customer HQ', 'FY24–FY26', 'USD millions'],
    ['quarterly', 'Quarterly revenue, Data Center, gross margin', 'Q1 FY25–Q4 FY26', 'USD millions / %'],
  ]
  return (
    <>
      <div className="card">
        <div className="card-head">
          <div><h3>Dataset</h3><p className="muted">{flat.length} data points · last reviewed {D.meta.lastReviewed}</p></div>
          <button className="btn btn--sm" onClick={download}>Download CSV ↓</button>
        </div>
        <DataTable
          columns={[{ key: 0, label: 'Table' }, { key: 1, label: 'Contents' }, { key: 2, label: 'Coverage' }, { key: 3, label: 'Unit' }]}
          rows={tables.map((t) => ({ 0: t[0], 1: t[1], 2: t[2], 3: t[3] }))}
        />
      </div>
      <div className="card">
        <div className="card-head"><div><h3>Sources</h3><p className="muted">Primary filings first</p></div></div>
        <ol className="sources">
          {D.sources.map((s) => (
            <li key={s.id} id={`src-${s.id}`}>
              <span className="mono">[{s.id}]</span>
              <div>
                <a href={s.url} target="_blank" rel="noreferrer">{s.title} ↗</a>
                <p className="muted">Used for: {s.used}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </>
  )
}

export const VIEWS = {
  overview: Overview,
  financials: Financials,
  revenue: RevenueBreakdown,
  growth: Growth,
  profitability: Profitability,
  geography: Geography,
  risk: Risk,
  methodology: Methodology,
  sources: Sources,
}
