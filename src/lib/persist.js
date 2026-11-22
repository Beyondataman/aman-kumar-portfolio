// sessionStorage helpers — wrapped because storage can be unavailable (privacy modes, sandboxes).
const mem = new Map()
export function save(key, value) {
  mem.set(key, value)
  try { sessionStorage.setItem('ak:' + key, JSON.stringify(value)) } catch { /* memory fallback */ }
}
export function load(key) {
  if (mem.has(key)) return mem.get(key)
  try {
    const raw = sessionStorage.getItem('ak:' + key)
    if (raw) { const v = JSON.parse(raw); mem.set(key, v); return v }
  } catch { /* ignore */ }
  return null
}
