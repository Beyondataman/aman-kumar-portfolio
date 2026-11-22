/**
 * NVIDIA case study dataset
 * --------------------------------------------------------------
 * All values in USD millions unless stated. GAAP basis.
 * NVIDIA's fiscal year ends in late January: FY26 = year ended 25 Jan 2026.
 * Sources are listed in `sources` and shown in the "Dataset & Sources" view.
 * This module is code-split: it is downloaded only when the workspace opens.
 */

export const meta = {
  company: 'NVIDIA Corporation',
  ticker: 'NASDAQ: NVDA',
  title: 'From graphics company to AI infrastructure',
  question: 'How did NVIDIA grow revenue eight-fold in four years — and what does that concentration cost in risk?',
  asOf: 'Fiscal 2026 (year ended 25 January 2026)',
  lastReviewed: 'November 2026',
}

export const YEARS = ['FY22', 'FY23', 'FY24', 'FY25', 'FY26']
export const yearEnd = {
  FY22: '30 Jan 2022',
  FY23: '29 Jan 2023',
  FY24: '28 Jan 2024',
  FY25: '26 Jan 2025',
  FY26: '25 Jan 2026',
}

/* ---------- Income statement (GAAP) ---------- */
export const income = {
  FY22: { revenue: 26914, grossProfit: 17475, opex: 7434, operatingIncome: 10041, netIncome: 9752, eps: 0.39 },
  FY23: { revenue: 26974, grossProfit: 15356, opex: 11132, operatingIncome: 4224, netIncome: 4368, eps: 0.17 },
  FY24: { revenue: 60922, grossProfit: 44301, opex: 11329, operatingIncome: 32972, netIncome: 29760, eps: 1.19 },
  FY25: { revenue: 130497, grossProfit: 97858, opex: 16405, operatingIncome: 81453, netIncome: 72880, eps: 2.94 },
  FY26: { revenue: 215938, grossProfit: 153463, opex: 23076, operatingIncome: 130387, netIncome: 120067, eps: 4.9 },
}

export const cashFlow = {
  FY25: { operating: 64089, free: 60724 },
  FY26: { operating: 102718, free: 96575 },
}

/* ---------- Revenue by market platform ---------- */
export const PLATFORMS = [
  { key: 'dataCenter', label: 'Data Center' },
  { key: 'gaming', label: 'Gaming' },
  { key: 'proViz', label: 'Professional Visualization' },
  { key: 'automotive', label: 'Automotive & Robotics' },
  { key: 'oem', label: 'OEM & Other' },
]

export const platforms = {
  FY22: { dataCenter: 10613, gaming: 12462, proViz: 2111, automotive: 566, oem: 1162 },
  FY23: { dataCenter: 15005, gaming: 9067, proViz: 1544, automotive: 903, oem: 455 },
  FY24: { dataCenter: 47525, gaming: 10447, proViz: 1553, automotive: 1091, oem: 306 },
  FY25: { dataCenter: 115186, gaming: 11350, proViz: 1878, automotive: 1694, oem: 389 },
  FY26: { dataCenter: 193737, gaming: 16042, proViz: 3191, automotive: 2349, oem: 619 },
}

/** Data Center split, disclosed from FY24 onward */
export const dataCenterSplit = {
  FY24: { compute: 38950, networking: 8575 },
  FY25: { compute: 102196, networking: 12990 },
  FY26: { compute: 162361, networking: 31376 },
}

/* ---------- Reportable segments ---------- */
export const segments = {
  FY24: { cnRevenue: 47405, cnOpInc: 32016, grRevenue: 13517, grOpInc: 5846 },
  FY25: { cnRevenue: 116193, cnOpInc: 82875, grRevenue: 14304, grOpInc: 5085 },
  FY26: { cnRevenue: 193479, cnOpInc: 130141, grRevenue: 22459, grOpInc: 9156 },
}

/* ---------- Geography (customer headquarters basis, recast in FY26 10-K) ---------- */
export const REGIONS = [
  { key: 'us', label: 'United States' },
  { key: 'taiwan', label: 'Taiwan' },
  { key: 'china', label: 'China (incl. Hong Kong)' },
  { key: 'other', label: 'Other' },
]
export const geography = {
  FY24: { us: 31533, taiwan: 14912, china: 12330, other: 2147 },
  FY25: { us: 77482, taiwan: 23600, china: 25048, other: 4367 },
  FY26: { us: 149617, taiwan: 42345, china: 19677, other: 4299 },
}
/** The same FY25 year as originally reported (customer billing location) */
export const geographyFY25Billing = [
  { region: 'United States', value: 61257 },
  { region: 'Singapore', value: 23684 },
  { region: 'Taiwan', value: 20573 },
  { region: 'China (incl. HK)', value: 17108 },
  { region: 'Other', value: 7875 },
]

/* ---------- Customer concentration (direct customers ≥10% of revenue) ---------- */
export const customers = {
  FY24: [13],
  FY25: [12, 11, 11],
  FY26: [22, 14],
}

/* ---------- Quarterly (FY25–FY26) ---------- */
export const quarters = [
  { q: 'Q1 FY25', revenue: 26044, dataCenter: 22563, grossMargin: 78.4 },
  { q: 'Q2 FY25', revenue: 30040, dataCenter: 26272, grossMargin: 75.1 },
  { q: 'Q3 FY25', revenue: 35082, dataCenter: 30771, grossMargin: 74.6 },
  { q: 'Q4 FY25', revenue: 39331, dataCenter: 35580, grossMargin: 73.0 },
  { q: 'Q1 FY26', revenue: 44062, dataCenter: 39112, grossMargin: 60.5, note: 'Includes $4.5B H20 inventory & purchase-obligation charge' },
  { q: 'Q2 FY26', revenue: 46743, dataCenter: 41096, grossMargin: 72.4 },
  { q: 'Q3 FY26', revenue: 57006, dataCenter: 51215, grossMargin: 73.4 },
  { q: 'Q4 FY26', revenue: 68127, dataCenter: 62314, grossMargin: 75.0 },
]

/* ---------- Sources ---------- */
export const sources = [
  {
    id: 's1',
    title: 'NVIDIA — Financial Results for Fourth Quarter and Fiscal 2026 (press release, 25 Feb 2026)',
    url: 'https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Announces-Financial-Results-for-Fourth-Quarter-and-Fiscal-2026',
    used: 'FY26 & FY25 income statement, FY26 platform revenue, cash flow, Q3–Q4 FY26',
  },
  {
    id: 's2',
    title: 'NVIDIA FY2026 Form 10-K — segment, geographic and customer disclosures (via EDGAR data)',
    url: 'https://app.edgar.tools/companies/NVDA/disclosures/segments',
    used: 'FY24–FY26 platform & segment revenue, Data Center split, geography (HQ basis), customer concentration',
  },
  {
    id: 's3',
    title: 'NVIDIA — Financial Results for Fourth Quarter and Fiscal 2025 (press release)',
    url: 'https://nvidianews.nvidia.com/news/nvidia-announces-financial-results-for-fourth-quarter-and-fiscal-2025',
    used: 'FY25 & FY24 income statement',
  },
  {
    id: 's4',
    title: 'NVIDIA FY2023 Form 10-K (SEC EDGAR)',
    url: 'https://www.sec.gov/Archives/edgar/data/1045810/000104581023000017/nvda-20230129.htm',
    used: 'FY23 & FY22 platform revenue and income statement',
  },
  {
    id: 's5',
    title: 'NVIDIA — Financial Results for Fourth Quarter and Fiscal 2023 (press release)',
    url: 'https://nvidianews.nvidia.com/news/nvidia-announces-financial-results-for-fourth-quarter-and-fiscal-2023',
    used: 'FY23 & FY22 revenue, gross margin and operating expenses',
  },
  {
    id: 's6',
    title: 'NVIDIA — Financial Results for First Quarter Fiscal 2026 (press release)',
    url: 'https://nvidianews.nvidia.com/news/nvidia-announces-financial-results-for-first-quarter-fiscal-2026',
    used: 'Q1 FY26 revenue, Data Center, gross margin and the $4.5B H20 charge',
  },
  {
    id: 's7',
    title: 'NVIDIA — Financial Results for Second Quarter Fiscal 2026 (press release)',
    url: 'https://investor.nvidia.com/news/press-release-details/2025/NVIDIA-Announces-Financial-Results-for-Second-Quarter-Fiscal-2026/default.aspx',
    used: 'Q2 FY26 revenue and Data Center',
  },
  {
    id: 's8',
    title: 'Analysis of the FY26 geographic recast (FourWeekMBA)',
    url: 'https://fourweekmba.com/ai-nvidia-recount-singapore-gone-us-16-2b-china-7-9b/',
    used: 'Cross-check of FY25 billing-location figures vs. HQ-location recast',
  },
]

/* ---------- Derived helpers ---------- */
export const pct = (a, b) => (b ? (a / b) * 100 : null)
export const growth = (cur, prev) => (prev ? (cur / prev - 1) * 100 : null)

export function derived() {
  const rows = YEARS.map((y, i) => {
    const inc = income[y]
    const prev = i > 0 ? income[YEARS[i - 1]] : null
    const p = platforms[y]
    return {
      year: y,
      ...inc,
      grossMargin: pct(inc.grossProfit, inc.revenue),
      operatingMargin: pct(inc.operatingIncome, inc.revenue),
      netMargin: pct(inc.netIncome, inc.revenue),
      opexRatio: pct(inc.opex, inc.revenue),
      revenueGrowth: prev ? growth(inc.revenue, prev.revenue) : null,
      netIncomeGrowth: prev ? growth(inc.netIncome, prev.netIncome) : null,
      dcShare: pct(p.dataCenter, inc.revenue),
      ...p,
    }
  })
  const first = income.FY22.revenue
  const last = income.FY26.revenue
  const cagr = (Math.pow(last / first, 1 / 4) - 1) * 100
  return { rows, cagr }
}

/** Flat dataset for the CSV download / table view */
export function flatDataset() {
  const out = []
  for (const y of YEARS) {
    for (const [k, v] of Object.entries(income[y])) out.push({ fiscalYear: y, table: 'income', metric: k, value: v })
    for (const [k, v] of Object.entries(platforms[y])) out.push({ fiscalYear: y, table: 'platform_revenue', metric: k, value: v })
    if (geography[y]) for (const [k, v] of Object.entries(geography[y])) out.push({ fiscalYear: y, table: 'geography_hq', metric: k, value: v })
    if (segments[y]) for (const [k, v] of Object.entries(segments[y])) out.push({ fiscalYear: y, table: 'segments', metric: k, value: v })
  }
  for (const q of quarters) {
    out.push({ fiscalYear: q.q, table: 'quarterly', metric: 'revenue', value: q.revenue })
    out.push({ fiscalYear: q.q, table: 'quarterly', metric: 'dataCenter', value: q.dataCenter })
    out.push({ fiscalYear: q.q, table: 'quarterly', metric: 'grossMarginPct', value: q.grossMargin })
  }
  return out
}
