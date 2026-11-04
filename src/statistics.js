import { displayName } from './catalog.js'
export const number = value => new Intl.NumberFormat('de-DE').format(value)
export const percent = (value, total) => total ? value / total * 100 : 0
export const percentage = (value, total) => `${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(percent(value, total))} %`
export const compact = value => new Intl.NumberFormat('de-DE', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
// `authors` is the optional index from authors.json: { stores: { hash: { author } }, integrations: { domain: author } }.
export function normalize(data = {}, kind = 'apps', authors = {}) {
  return Object.entries(data).filter(([, d]) => d && Number.isFinite(d.total)).map(([id, d]) => {
    const store = kind === 'apps' && id.includes('_') ? id.split('_')[0] : '—'
    const author = kind === 'apps' ? authors.stores?.[store]?.author : authors.integrations?.[id]
    return { ...d, id, name: displayName(id), versions: d.versions || {}, store, author: author || '' }
  })
}
// Authors are matched case-insensitively because GitHub user names are.
export const sameAuthor = (a, b) => !!a && !!b && a.toLowerCase() === b.toLowerCase()
export function filterEntries(entries, { query = '', store = '', author = '', ids = [] } = {}) {
  const term = query.toLowerCase().trim()
  return entries.filter(e => (!term || `${e.id} ${e.name} ${e.author || ''}`.toLowerCase().includes(term)) && (!store || e.store === store) && (!author || sameAuthor(e.author, author)) && (!ids.length || ids.includes(e.id)))
}
// Dropdown label such as "4c7fee11 (seb5594)": the hash stays visible because it is the technical identifier.
export function storeLabel(hash, authors = {}) {
  const info = authors.stores?.[hash]
  if (hash === 'core') return 'Offizielle Apps'
  return info?.author ? `${hash} (${info.author})` : hash
}
// Authors ranked by their total reported installations across the given entries.
export function authorOptions(entries) {
  const totals = new Map()
  for (const { author, total } of entries) if (author) totals.set(author, (totals.get(author) || 0) + total)
  return [...totals].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name]) => name)
}
export function sortedVersions(entry) {
  return Object.entries(entry?.versions || {}).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}
export function historyPoints(history, kind, id, days = 90) {
  const points = Object.entries(history?.[kind]?.[id] || {}).filter(([, n]) => Number.isFinite(n)).sort(([a], [b]) => a.localeCompare(b))
  if (!points.length) return []
  const end = Date.parse(points.at(-1)[0])
  return points.filter(([date]) => end - Date.parse(date) < days * 86400000)
}
export function growth(points) {
  if (points.length < 2) return null
  const start = points[0][1], end = points.at(-1)[1]
  return { absolute: end - start, relative: start ? (end - start) / start * 100 : null }
}
export function buildLink({ kind = 'apps', filter = '', store = '', author = '', item = '', project = '', view = '', days = 90 } = {}, base = 'https://seb5594.github.io/homeassistant-app-stats/') {
  const url = new URL(base); url.search = ''; url.hash = ''
  if (kind !== 'apps') url.searchParams.set('tab', kind)
  for (const [key, value] of Object.entries({ filter, store, author, item, project, view })) if (value) url.searchParams.set(key, value)
  if (Number(days) !== 90) url.searchParams.set('days', days)
  return url.href
}
export function csv(entries, kind) {
  const quote = v => `"${String(v ?? '').replace(/^[=+@\-\t\r]/, "'$&").replaceAll('"', '""')}"`
  const rows = [['id', 'name', 'type', 'reported_installations', 'auto_update', 'protected', 'reported_versions'], ...entries.map(e => [e.id, e.name, kind, e.total, e.auto_update, e.protected, Object.keys(e.versions).length])]
  return '\uFEFF' + rows.map(row => row.map(quote).join(',')).join('\r\n')
}

// Preserve the real spacing of days and break lines across unobserved dates.
export function dailySeries(points) {
  if (!points.length) return []
  const values = new Map(points)
  const result = [], start = Date.parse(points[0][0]), end = Date.parse(points.at(-1)[0])
  for (let time = start; time <= end; time += 86400000) {
    const day = new Date(time).toISOString().slice(0, 10)
    result.push([day, values.has(day) ? values.get(day) : null])
  }
  return result
}
