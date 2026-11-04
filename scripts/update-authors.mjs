import { mkdir, readFile, writeFile, rename } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const HACS_INTEGRATIONS = 'https://data-v2.hacs.xyz/integration/data.json'
const GITHUB_SEARCH = 'https://api.github.com/search/repositories'
const USER_AGENT = 'homeassistant-app-stats/1.0 (+https://github.com/seb5594/homeassistant-app-stats)'

// The Supervisor identifies an app store by the first 8 hex digits of the SHA-1 of its lowercase URL.
export function storeHash(url) {
  return createHash('sha1').update(url.toLowerCase()).digest('hex').slice(0, 8)
}

// Users type store URLs in many spellings, and each spelling yields its own hash.
export function urlVariants(url) {
  const base = url.replace(/(\.git|\/)+$/, '')
  const variants = [base, `${base}.git`, `${base}/`, base.replace('https://', 'http://'), base.replace('https://github.com', 'https://www.github.com')]
  return [...new Set(variants)]
}

export function ownerOf(url) {
  return new URL(url).pathname.split('/').filter(Boolean)[0] || ''
}

// Maps each known store hash to the author who published it. Only stores seen in the analytics data are kept,
// so the file stays small and unrelated search results never leak into the dropdown.
export function buildStoreIndex({ seeds, repositories, appIds }) {
  const seen = new Set(appIds.map(id => id.split('_')[0]))
  const stores = {}
  for (const { hash, author, label } of seeds.hashes) stores[hash] = { author, ...(label && { label }) }
  const register = ({ url, label }, keepCanonical) => {
    const [canonical, ...others] = urlVariants(url)
    for (const variant of [canonical, ...others]) {
      const hash = storeHash(variant)
      const keep = seen.has(hash) || (keepCanonical && variant === canonical)
      if (keep && !stores[hash]) stores[hash] = { author: ownerOf(url), url: variant, ...(label && { label }) }
    }
  }
  // Curated stores stay listed even before their first report, so their link already works.
  seeds.repositories.forEach(seed => register(seed, true))
  repositories.forEach(repository => register(repository, false))
  return stores
}

// Resolves the owner of each HACS-listed integration domain. Integrations outside HACS have no known author.
export function buildIntegrationIndex(hacsData) {
  const index = {}
  for (const entry of Object.values(hacsData || {})) {
    if (entry?.domain && typeof entry.full_name === 'string') index[entry.domain] = entry.full_name.split('/')[0]
  }
  return index
}

async function getJson(url, headers = {}) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { 'User-Agent': USER_AGENT, Accept: 'application/json', ...headers } })
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`)
  return response.json()
}

// Optional enrichment: a failed discovery must never block the daily data refresh.
async function discoverRepositories(topics) {
  const headers = process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}
  const found = new Map()
  for (const topic of topics) {
    try {
      for (let page = 1; page <= 10; page++) {
        const result = await getJson(`${GITHUB_SEARCH}?q=${encodeURIComponent(`topic:${topic}`)}&per_page=100&page=${page}`, headers)
        for (const item of result.items) found.set(item.html_url.toLowerCase(), { url: item.html_url })
        if (result.items.length < 100) break
        await new Promise(resolve => setTimeout(resolve, 2500))
      }
    } catch (error) { console.warn(`Skipping topic "${topic}": ${error.message}`) }
  }
  return [...found.values()]
}

export async function main() {
  const dataDir = resolve('public/data')
  const seeds = JSON.parse(await readFile(new URL('./store-seeds.json', import.meta.url), 'utf8'))
  const apps = JSON.parse(await readFile(join(dataDir, 'apps.json'), 'utf8'))
  const repositories = await discoverRepositories(seeds.topics)
  let integrations = {}
  try { integrations = buildIntegrationIndex(await getJson(HACS_INTEGRATIONS)) } catch (error) { console.warn(`Integration authors unavailable: ${error.message}`) }
  const stores = buildStoreIndex({ seeds, repositories, appIds: Object.keys(apps) })
  const authors = { schemaVersion: 1, generatedAt: new Date().toISOString(), stores, integrations }
  await mkdir(dataDir, { recursive: true })
  await writeFile(join(dataDir, 'authors.json.tmp'), JSON.stringify(authors), 'utf8')
  await rename(join(dataDir, 'authors.json.tmp'), join(dataDir, 'authors.json'))
  console.log(`Resolved ${Object.keys(stores).length} app stores and ${Object.keys(integrations).length} integration domains.`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch(error => { console.error(error); process.exitCode = 1 })
