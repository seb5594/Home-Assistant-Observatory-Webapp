import { test } from 'node:test'
import assert from 'node:assert/strict'
import { filterEntries, normalize, storeLabel, authorOptions, sortedVersions, historyPoints, growth, buildLink, csv, dailySeries } from '../src/statistics.js'
import { projects, projectMatches } from '../src/catalog.js'
import { validateDataset, updateHistory, badge } from '../scripts/update-data.mjs'
import { storeHash, urlVariants, buildStoreIndex, buildIntegrationIndex } from '../scripts/update-authors.mjs'
const app = { total: 10, versions: { '1.0.0': 3, '1.2.0-beta': 7 }, protected: 8, auto_update: 4 }
test('legacy Poeschl filter, friendly names, and exact stores remain separate', () => {
 const data = normalize({ '68413af6_git-exporter': app, 'd46539d0_git-exporter': app, core_mosquitto: app })
 assert.equal(filterEntries(data, { query: '68413af6' }).length, 1)
 assert.equal(filterEntries(data, { query: 'MOSQUITTO' })[0].id, 'core_mosquitto')
 assert.equal(filterEntries(data, { store: 'core' }).length, 1)
 assert.equal(filterEntries(data, { query: 'no-such-project' }).length, 0)
 assert.equal(projectMatches(data[0], projects[0]), false)
 assert.equal(projectMatches(data[1], projects[0]), true)
 assert.equal(projectMatches({ id: '4c7fee11_git-exporter' }, projects[0]), true)
})
test('custom integration matching is exact, not a substring', () => {
 const p = projects.find(p => p.id === 'vacuum_mapguard')
 assert.equal(projectMatches({ id: 'vacuum_mapguard' }, p), true)
 assert.equal(projectMatches({ id: 'vacuum_mapguard_other' }, p), false)
})
test('versions are sorted by actual usage; arbitrary version labels do not crash', () => {
 assert.equal(sortedVersions(app)[0][0], '1.2.0-beta')
 assert.deepEqual(sortedVersions(undefined), [])
 assert.equal(sortedVersions({ versions: { latest: 100, '0.1dev': 1 } })[0][0], 'latest')
})
test('share URLs round-trip special characters, tabs, scopes, selection and period', () => {
 const link = new URL(buildLink({ kind: 'integrations', filter: 'foo & bar', item: 'one', project: 'vacuum_mapguard', days: 30 }, 'https://example.com/repo/?old=1#anchor'))
 assert.equal(link.pathname, '/repo/')
 assert.equal(link.searchParams.get('filter'), 'foo & bar')
 assert.equal(link.searchParams.get('tab'), 'integrations')
 assert.equal(link.searchParams.get('days'), '30')
 assert.equal(link.hash, '')
 assert.equal(link.searchParams.has('old'), false)
})
test('daily snapshots replace the same date, retain zero, prune removed projects and never infer zero from absence', () => {
 const old = { apps: { retained: { '2025-01-01': 7, '2026-10-17': 9 }, gone: { '2026-10-17': 4 }, ancient: { '2025-01-01': 1 } } }
 const h = updateHistory(old, { apps: { retained: { total: 0 } }, integrations: {} }, new Date('2026-10-18T12:00:00Z'))
 assert.deepEqual(h.apps.retained, { '2026-10-17': 9, '2026-10-18': 0 })
 assert.deepEqual(h.apps.gone, { '2026-10-17': 4 })
 assert.equal(h.apps.ancient, undefined)
 const same = updateHistory(h, { apps: { retained: { total: 8 } }, integrations: {} }, new Date('2026-10-18T13:00:00Z'))
 assert.equal(Object.keys(same.apps.retained).length, 2)
 assert.equal(same.apps.retained['2026-10-18'], 8)
})
test('history sorts dates and constrains windows; one point cannot imply growth', () => {
 const h = { apps: { id: { '2026-10-18': 20, '2026-01-01': 100, '2026-10-17': 10 } } }
 const points = historyPoints(h, 'apps', 'id', 30)
 assert.equal(points.length, 2)
 assert.deepEqual(growth(points), { absolute: 10, relative: 100 })
 assert.equal(growth([points[0]]), null)
 assert.deepEqual(historyPoints(h, 'apps', 'missing'), [])
})
test('invalid and incomplete upstream datasets fail before publication', () => {
 assert.throws(() => validateDataset({}, 'apps'))
 assert.throws(() => validateDataset({ x: { total: -1, versions: {} } }, 'integrations'))
 assert.throws(() => validateDataset({ x: { total: 1, versions: { v: '1' } } }, 'integrations'))
 assert.throws(() => validateDataset({ x: { total: 1, versions: {} } }, 'apps'))
 assert.equal(validateDataset({ x: app }, 'apps').x.total, 10)
})
test('CSV handles quotes and formula injection without requiring browser APIs', () => {
 const value = csv([{ id: '=cmd()', name: 'A "quoted" name', total: 10, versions: {} }], 'apps')
 assert.ok(value.startsWith('\uFEFF'))
 assert.ok(value.includes('"\'=cmd()"'))
 assert.ok(value.includes('A ""quoted"" name'))
})
test('badges distinguish missing data from an observed zero', () => {
 assert.ok(badge(undefined).includes('noch nicht gemeldet'))
 assert.ok(badge(0).includes('HA Installationen: 0'))
})

test('chart spacing includes unobserved days as null, preserving real observed zeros', () => {
 assert.deepEqual(dailySeries([['2026-10-16', 1], ['2026-10-18', 0]]), [['2026-10-16', 1], ['2026-10-17', null], ['2026-10-18', 0]])
 assert.deepEqual(dailySeries([]), [])
})

test('store hash follows the Supervisor rule: SHA-1 of the lowercase URL, first 8 characters', () => {
 assert.equal(storeHash('https://github.com/seb5594/Home-Assistant-Apps'), '4c7fee11')
 assert.equal(storeHash('https://github.com/SEB5594/home-assistant-apps'), '4c7fee11')
 assert.equal(storeHash('https://github.com/hassio-addons/repository'), 'a0d7b954')
 assert.notEqual(storeHash('https://github.com/seb5594/Home-Assistant-Apps.git'), '4c7fee11')
 assert.equal(urlVariants('https://github.com/a/b.git').length, 5)
})
test('store index keeps curated stores, seen stores and ignores unseen search results', () => {
 const seeds = { hashes: [{ hash: 'core', author: 'Home Assistant' }], repositories: [{ url: 'https://github.com/seb5594/Home-Assistant-Apps', label: 'seb5594 apps' }] }
 const other = 'https://github.com/someone/their-apps'
 const stores = buildStoreIndex({ seeds, repositories: [{ url: other }, { url: 'https://github.com/unseen/apps' }], appIds: [`${storeHash(other)}_demo`] })
 assert.equal(stores['4c7fee11'].author, 'seb5594')
 assert.equal(stores[storeHash(other)].author, 'someone')
 assert.equal(stores[storeHash('https://github.com/unseen/apps')], undefined)
 assert.equal(stores.core.author, 'Home Assistant')
})
test('authors label stores, filter entries and rank by installations', () => {
 const authors = { stores: { '4c7fee11': { author: 'seb5594' }, b0b0b0b0: { author: 'big' } }, integrations: { demo: 'seb5594' } }
 const apps = normalize({ '4c7fee11_x': { ...app, total: 5 }, b0b0b0b0_y: { ...app, total: 50 }, core_z: app }, 'apps', authors)
 assert.equal(storeLabel('4c7fee11', authors), '4c7fee11 (seb5594)')
 assert.equal(storeLabel('unknown1', authors), 'unknown1')
 assert.deepEqual(filterEntries(apps, { author: 'SEB5594' }).map(e => e.id), ['4c7fee11_x'])
 assert.deepEqual(filterEntries(apps, { query: 'big' }).map(e => e.id), ['b0b0b0b0_y'])
 assert.deepEqual(authorOptions(apps), ['big', 'seb5594'])
 assert.equal(normalize({ demo: app }, 'integrations', authors)[0].author, 'seb5594')
 assert.deepEqual(buildIntegrationIndex({ 1: { domain: 'demo', full_name: 'seb5594/demo' }, 2: { full_name: 'x/y' } }), { demo: 'seb5594' })
})
test('author links are shareable', () => {
 assert.equal(new URL(buildLink({ author: 'seb5594' }, 'https://example.com/')).searchParams.get('author'), 'seb5594')
})
test('other authors reusing a personal slug are not renamed or counted as personal projects', () => {
 const entry = normalize({ '9a0d868d_gitea_runner': app, '4c7fee11_gitea_runner': app })
 assert.equal(entry[0].name, 'Gitea Runner')
 assert.equal(projectMatches(entry[0], projects.find(p => p.id === 'gitea_runner')), false)
 assert.equal(projectMatches(entry[1], projects.find(p => p.id === 'gitea_runner')), true)
})
