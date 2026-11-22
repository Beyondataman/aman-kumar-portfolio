// ============================================================
// THE DEVELOPER ENGINE — content that cycles in each window.
// Layouts only change the arrangement; editor, terminal and
// preview each rotate through their own set independently.
// Every figure quoted comes from the NVIDIA case-study dataset
// (src/cases/nvidia/data.js). Terminal gags nod to real Unix
// easter eggs: sl, apt moo, Python's `import this`, cowsay.
// ============================================================

export const LAYOUTS = [
  { id: 'split', label: 'Side by side' },
  { id: 'stack', label: 'Stacked' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'float', label: 'Floating' },
]

/* ---------------- Editor: one snippet per tool in the toolkit ---------------- */
export const SNIPPETS = [
  {
    file: 'analysis.py', lang: 'python',
    code: `import pandas as pd

rev = pd.read_csv("nvidia_fy22_fy26.csv", index_col="year")
rev["dc_share"] = rev["data_center"] / rev["revenue"]

first, last = rev.revenue.iloc[0], rev.revenue.iloc[-1]
cagr = (last / first) ** (1 / 4) - 1

print(f"Revenue CAGR FY22→FY26: {cagr:.1%}")   # 68.3%`,
  },
  {
    file: 'revenue_mix.sql', lang: 'sql',
    code: `SELECT fiscal_year,
       platform,
       revenue_musd,
       ROUND(100.0 * revenue_musd
             / SUM(revenue_musd) OVER (PARTITION BY fiscal_year), 1) AS share_pct
FROM   nvidia_platform_revenue
WHERE  fiscal_year = 'FY26'
ORDER  BY revenue_musd DESC;   -- Data Center: 89.7%`,
  },
  {
    file: 'measures.dax', lang: 'dax',
    code: `// Power BI · measure
Data Center Share =
DIVIDE (
    CALCULATE ( SUM ( Revenue[USD_M] ), Revenue[Platform] = "Data Center" ),
    SUM ( Revenue[USD_M] )
)
// FY26 → 89.7%. Gaming would like a word.`,
  },
  {
    file: 'growth.xlsx · C7', lang: 'excel',
    code: `=LET(
    now,  XLOOKUP("FY26", A2:A6, B2:B6),
    prev, XLOOKUP("FY25", A2:A6, B2:B6),
    now / prev - 1
) + N("65.5%. checked twice. then a third time.")`,
  },
  {
    file: 'china_share.twb', lang: 'tableau',
    code: `// Tableau · calculated field
{ FIXED [Fiscal Year] :
    SUM( IF [Region] = "China (incl. HK)" THEN [Revenue] END )
  / SUM( [Revenue] ) }

// FY24 20.2%  →  FY26 9.1%
// export rules 1, forecast 0`,
  },
  {
    file: 'clean.py', lang: 'python',
    code: `df = pd.read_csv("quarters.csv")
df["gm"] = df["gross_profit"] / df["revenue"]

before = len(df)
df = df.dropna()            # and just like that, no problems
print(before - len(df))     # 0 rows dropped. suspicious.

assert df["gm"].between(0, 1).all(), "margin over 100%? no."`,
  },
  {
    file: 'join.sql', lang: 'sql',
    code: `-- a query walks into a bar, sees two tables:
SELECT 'mind if I join you?' AS small_talk
FROM   table_one t1
JOIN   table_two t2 USING (bar_id);

-- 0 rows returned. tough crowd.`,
  },
  {
    file: '.aliases', lang: 'bash',
    code: `# small habits, automated
alias ls='ls -G'                 # sl is a train. ask me how I know.
alias coffee='echo "brewing…" && sleep 300'
alias focus='killall Slack; open -a "Visual Studio Code"'
export PATH="$HOME/curiosity/bin:$PATH"`,
  },
  {
    file: 'git.log', lang: 'log',
    code: `# git log --oneline
4f2a9c1 fix: off-by-one error
4f2a9c2 fix: off-by-one error in off-by-one fix
7b1e0aa chore: rename final.xlsx → final_v2_FINAL_really.xlsx
c0ffee1 feat: add coffee
d0ff1ce revert: "feat: add coffee" (jitters)
e3a1b2c docs: it works on my machine`,
  },
  {
    file: 'core.js', lang: 'js',
    code: `// the object you've been following all along
const core = new InstancedMesh(shard, metal, 144)

for (let i = 0; i < 144; i++) {
  const p = mix(scatter[i], sphere[i], progress)
  core.setMatrixAt(i, compose(p, spin(i), size[i]))
}
core.instanceMatrix.needsUpdate = true`,
  },
]

/* ---------------- Terminal: ten short sessions ---------------- */
export const SESSIONS = [
  [
    ['cmd', 'python analysis.py'],
    ['out', 'Revenue CAGR FY22→FY26: 68.3%'],
    ['cmd', 'git commit -am "It finally works. Don\'t touch it."'],
    ['ok', '[main 4f2a9c1] It finally works. Don\'t touch it.'],
  ],
  [
    ['cmd', 'psql -f revenue_mix.sql'],
    ['out', ' FY26 | Data Center | 193737 | 89.7'],
    ['out', ' FY26 | Gaming      |  16042 |  7.4'],
    ['warn', 'Warning: Coffee dependency missing'],
    ['out', 'Proceeding anyway. Results may be decaffeinated.'],
  ],
  [
    ['cmd', './analyze --why "margin dip, Q1 FY26"'],
    ['out', '→ gross margin 60.5% (Q4 FY25: 73.0%)'],
    ['out', '→ found: $4.5B H20 inventory charge'],
    ['err', 'Error: Overthinking detected. Restarting analysis...'],
    ['out', '→ short answer: export rules. Back to 75.0% by Q4.'],
  ],
  [
    ['cmd', 'sl'],
    ['out', '      ====        ________                ___________'],
    ['out', '  _D _|  |_______/        \\__I_I_____===__|_________|'],
    ['out', '   |(_)---  |   H\\________/ |   |        =|___ ___|'],
    ['muted', '(meant ls. the train left anyway.)'],
  ],
  [
    ['cmd', 'apt moo'],
    ['out', '                 (__)'],
    ['out', '                 (oo)'],
    ['out', '           /------\\/'],
    ['out', '          / |    ||'],
    ['out', '         *  /\\---/\\'],
    ['out', '            ~~   ~~'],
    ['ok', '..."Have you mooed today?"...'],
  ],
  [
    ['cmd', 'python -c "import this" | head -3'],
    ['out', 'The Zen of Python, by Tim Peters'],
    ['out', 'Beautiful is better than ugly.'],
    ['out', 'Explicit is better than implicit.'],
    ['muted', '# also applies to dashboards'],
  ],
  [
    ['cmd', 'cat hard_problems.txt'],
    ['out', '1. cache invalidation'],
    ['out', '2. naming things'],
    ['out', '3. off-by-one errors'],
    ['err', 'warning: list length is 3, expected 2'],
  ],
  [
    ['cmd', 'python -c "print(0o31 == 25)"'],
    ['ok', 'True'],
    ['muted', '# which is why programmers mix up'],
    ['muted', '# Halloween (Oct 31) and Christmas (Dec 25)'],
  ],
  [
    ['cmd', './deploy.sh --env production'],
    ['ok', '✓ 47 tests passed'],
    ['warn', 'It is Friday, 5:42 pm. Deploy anyway? [y/N]'],
    ['cmd', 'N'],
    ['ok', 'Wise. See you Monday.'],
  ],
  [
    ['cmd', 'npm run build'],
    ['ok', '✓ 1 canvas · 0 duplicate WebGL contexts'],
    ['ok', '✓ hall + dashboards code-split'],
    ['cmd', 'git push'],
    ['out', 'Everything up-to-date. Including me.'],
  ],
]

/* ---------------- Preview: mini charts from the NVIDIA dataset ---------------- */
// values verified against src/cases/nvidia/data.js
const FY = ['FY22', 'FY23', 'FY24', 'FY25', 'FY26']
const Q = ["Q1'25", "Q2'25", "Q3'25", "Q4'25", "Q1'26", "Q2'26", "Q3'26", "Q4'26"]
export const CHARTS = [
  { title: 'revenue.svg', caption: 'Revenue, $B', type: 'bar', labels: FY, values: [26.9, 27.0, 60.9, 130.5, 215.9], fmt: (v) => `$${v}B` },
  { title: 'net_income.svg', caption: 'Net income, $B', type: 'bar', labels: FY, values: [9.8, 4.4, 29.8, 72.9, 120.1], fmt: (v) => `$${v}B` },
  { title: 'dc_share.svg', caption: 'Data Center share of revenue', type: 'line', labels: FY, values: [39.4, 55.6, 78.0, 88.3, 89.7], fmt: (v) => `${v}%`, max: 100 },
  { title: 'gross_margin.svg', caption: 'Gross margin', type: 'line', labels: FY, values: [64.9, 56.9, 72.7, 75.0, 71.1], fmt: (v) => `${v}%`, min: 40, max: 85 },
  { title: 'quarters.svg', caption: 'Quarterly revenue, $B', type: 'bar', labels: Q, values: [26.0, 30.0, 35.1, 39.3, 44.1, 46.7, 57.0, 68.1], fmt: (v) => `$${v}B` },
  { title: 'q_margin.svg', caption: "Quarterly gross margin (Q1'26: H20 charge)", type: 'line', labels: Q, values: [78.4, 75.1, 74.6, 73.0, 60.5, 72.4, 73.4, 75.0], fmt: (v) => `${v}%`, min: 50, max: 85, mark: 4 },
  { title: 'geography.svg', caption: 'FY26 revenue by customer HQ, %', type: 'bar', labels: ['US', 'Taiwan', 'China', 'Other'], values: [69.3, 19.6, 9.1, 2.0], fmt: (v) => `${v}%`, peak: 0 },
  { title: 'networking.svg', caption: 'Data Center networking, $B', type: 'bar', labels: ['FY24', 'FY25', 'FY26'], values: [8.6, 13.0, 31.4], fmt: (v) => `$${v}B` },
  { title: 'opex_ratio.svg', caption: 'Operating expenses, % of revenue', type: 'line', labels: FY, values: [27.6, 41.3, 18.6, 12.6, 10.7], fmt: (v) => `${v}%`, min: 0, max: 50 },
  { title: 'concentration.svg', caption: 'Direct customers ≥10%, combined %', type: 'bar', labels: ['FY24', 'FY25', 'FY26'], values: [13, 34, 36], fmt: (v) => `${v}%` },
]

/* ---------------- The final terminal (ending) ---------------- */
export const ENDINGS = [
  [
    ['cmd', 'sudo make me employable'],
    ['out', '[sudo] password for recruiter: ••••••••'],
    ['out', 'Compiling curiosity ................ done'],
    ['out', 'Linking mathematics + analytics + code ...... done'],
    ['ok', '✔ Build succeeded. Ready for the next problem.'],
  ],
  [
    ['cmd', 'sudo make me a sandwich'],
    ['ok', 'Okay.'],
    ['muted', '# wrong window. let\'s try that again:'],
    ['cmd', 'sudo make me employable'],
    ['ok', '✔ Already in progress (PGDM, 2026–2028).'],
  ],
  [
    ['cmd', 'apt install experience'],
    ['err', 'E: Unable to locate package experience'],
    ['out', 'Hint: it depends on "opportunity". Try installing that first.'],
    ['cmd', 'apt install curiosity'],
    ['ok', 'curiosity is already the newest version.'],
  ],
  [
    ['cmd', 'ping recruiter'],
    ['out', 'PING recruiter: 56 data bytes'],
    ['out', 'Request timeout for icmp_seq 0'],
    ['out', 'Request timeout for icmp_seq 1'],
    ['ok', 'Switching protocol: scroll down → contact links'],
  ],
  [
    ['cmd', 'git blame resume.pdf'],
    ['out', '^4f2a9c1 (Aman Kumar)  every single line'],
    ['muted', '# nobody else to blame. good and bad.'],
  ],
  [
    ['cmd', './hire_me.sh --dry-run'],
    ['ok', '✔ mathematics ............ loaded'],
    ['ok', '✔ business analytics ..... in progress'],
    ['ok', '✔ toolkit ................ see chapter 03'],
    ['out', 'Dry run complete. Awaiting the real thing.'],
  ],
  [
    ['cmd', 'fortune'],
    ['out', 'You will soon receive an email that begins "Hi Aman,".'],
    ['muted', '            -- the terminal, being optimistic'],
  ],
  [
    ['cmd', 'cowsay "let\'s talk"'],
    ['out', ' ____________'],
    ['out', '< let\'s talk >'],
    ['out', ' ------------'],
    ['out', '        \\   ^__^'],
    ['out', '         \\  (oo)\\_______'],
    ['out', '            (__)\\       )\\/\\'],
  ],
  [
    ['cmd', 'uptime'],
    ['out', 'up since day one, 1 user, load average: 0.98, 1.02, ☕'],
  ],
  [
    ['cmd', 'while true; do learn; done'],
    ['out', 'learning… learning… learning…'],
    ['muted', '^C'],
    ['ok', 'just kidding. not stopping.'],
  ],
]
