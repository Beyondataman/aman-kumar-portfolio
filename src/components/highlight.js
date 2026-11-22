// Tiny, dependency-free syntax highlighter for the Developer Engine snippets.
const KW = {
  python: /\b(import|from|as|def|return|for|in|if|else|print|class|with|lambda|None|True|False)\b/,
  sql: /\b(SELECT|FROM|WHERE|ORDER|BY|GROUP|OVER|PARTITION|SUM|ROUND|AS|AND|DESC|ASC|JOIN|ON)\b/,
  js: /\b(const|let|for|new|return|import|from|export|function|if|else)\b/,
  bash: /\b(alias|export|echo|sleep|open|killall|sudo|make|git)\b/,
  dax: /\b(CALCULATE|SUM|DIVIDE|FILTER|VAR|RETURN|ALL)\b/,
  excel: /\b(LET|XLOOKUP|N|SUM|IF)\b/,
  tableau: /\b(FIXED|SUM|IF|THEN|END|ELSE)\b/,
  log: /\b(fix|feat|chore|docs|revert)\b/,
}
const COMMENT = { python: /#.*/, sql: /--.*/, js: /\/\/.*/, bash: /#.*/, dax: /\/\/.*/, excel: /(?!x)x/, tableau: /\/\/.*/, log: /#.*/ }

export function highlight(code, lang) {
  const kw = KW[lang], cm = COMMENT[lang]
  const token = new RegExp(
    [cm.source, /"[^"]*"|'[^']*'|f"[^"]*"/.source, kw.source, /\b\d+(\.\d+)?\b/.source, /[A-Za-z_][\w]*(?=\()/.source].map((s) => `(${s})`).join('|'),
    'g'
  )
  return code.split('\n').map((line) => {
    const out = []
    let last = 0, m
    token.lastIndex = 0
    while ((m = token.exec(line))) {
      if (m.index > last) out.push({ t: line.slice(last, m.index) })
      const cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'k' : m[4] ? 'n' : 'f'
      out.push({ t: m[0], cls })
      last = m.index + m[0].length
      if (m[0].length === 0) token.lastIndex++
    }
    if (last < line.length) out.push({ t: line.slice(last) })
    return out
  })
}
