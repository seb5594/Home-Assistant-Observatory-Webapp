# HA Observatory

**Home Assistant. In numbers.**

A modern, open dashboard for Home Assistant apps, add-ons, and custom integrations. Explore reported installations, version distributions, and the growth of your projects with shareable views and README badges.

[Open dashboard](https://seb5594.github.io/homeassistant-app-stats/) · [My projects](https://seb5594.github.io/homeassistant-app-stats/?view=projects) · [Official data source](https://analytics.home-assistant.io/)

## Repository description

> Beautiful, shareable analytics for Home Assistant apps and custom integrations. Track adoption, explore versions, and give your open-source projects a home in numbers.

## Features

- Separate, keyboard-accessible tabs for apps/add-ons and custom integrations.
- Search by name, slug, or domain; filter by exact app store; sort by usage or name.
- Contextual metrics, version distributions, and complete version tables.
- Daily installation history for the past 30, 90, or 365 days, with measurements available in tables.
- Light and dark modes, a responsive interface, and reduced animations when requested by your system settings.
- Shareable views, CSV export, preconfigured project views for all of your apps and integrations, and automatically updated SVG badges.
- Self-hosted fonts, no additional visitor tracking, and no requests to external font services.

## Understanding the data

| Content | Official source |
| --- | --- |
| Apps & add-ons | https://analytics.home-assistant.io/addons.json |
| Custom integrations | https://analytics.home-assistant.io/custom_integrations.json |
| Reporting Home Assistant installations | https://analytics.home-assistant.io/current_data.json |

Participation in Home Assistant Analytics is voluntary. These figures do not represent every installation. Totals across projects may count the same Home Assistant installation more than once. A missing domain or slug does **not** mean that a project has no users.

Version percentages are calculated from the sum of reported version counts, which may differ from the total installation count. The most widely used version is not necessarily the latest release. Automatic updates and protected mode are shown only for apps.

The project's own history starts with the first successful data fetch. Earlier periods are neither reconstructed nor simulated. Projects removed from the current dataset retain their existing history until the retention period expires; missing reports are not treated as zero. The dashboard shows the fetch time and displays a warning after 48 hours without an update.

## Setting up GitHub Pages

1. Under **Settings → Pages → Build and deployment → Source**, select **GitHub Actions**.
2. Under **Actions**, enable workflows for this fork if GitHub has disabled them.
3. Run the **Build and deploy Observatory** workflow manually or push changes to `main`.

The workflow tests the application, fetches and validates all three data sources, builds the site, and publishes it using the official Pages actions. It also runs daily at **04:17 UTC**. A failed data fetch does not replace the published site. The **Data freshness watchdog** workflow checks every six hours that the published data is younger than 36 hours; otherwise it re-enables and triggers the deploy workflow.

The same run resolves store authors (`public/data/authors.json`) by hashing known repository URLs and GitHub search results. See [docs/app-slugs.md](docs/app-slugs.md).

The separate `data` branch stores a compressed history archive (`history.json.gz`) containing up to 365 days of data. It contains no application code and must be preserved to maintain a continuous history. The frontend serves small, per-project history files that are loaded only when a project is selected. The workflow uses `GITHUB_TOKEN`; no personal API keys are required.

GitHub may disable scheduled workflows in public repositories after an extended period of inactivity. If the figures become outdated, check the workflow status and re-enable it if necessary.

## Local development

Requirements: Node.js 24 LTS and npm.

```sh
npm ci
npm run data
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

`npm run data` writes current statistics to `public/data/` and badges to `public/badges/`. The local history archive is stored in `.cache/history.json.gz`. These files are generated and are not committed to `main`. `npm run build` does not require network access; generate the statistics data at least once before publishing.

Vite uses relative asset paths, so the build works both under `/homeassistant-app-stats/` and on a custom domain. Navigation and filters use query parameters, allowing direct links to work without additional server rewrites.

## Links and badges for your repositories

Existing filter links remain compatible:

```text
https://seb5594.github.io/homeassistant-app-stats/?filter=68413af6
```

| Parameter | Meaning |
| --- | --- |
| `tab=integrations` | Show custom integrations (default: apps) |
| `filter=...` | Search by name, slug, or domain |
| `store=4c7fee11` | Filter by an exact app store |
| `author=seb5594` | Show every store and integration attributed to an author |
| `item=core_mosquitto` | Select a dataset entry |
| `project=vacuum_mapguard` | Select a preconfigured personal project |
| `days=30` / `90` / `365` | Set the history period |
| `view=projects` | Open personal projects and the badge generator |

How slugs, store hashes, and authors work, and why entries can be missing, is explained in [docs/app-slugs.md](docs/app-slugs.md). Ready-to-use links and Markdown snippets are available in [docs/repository-links.md](docs/repository-links.md). You can also copy them from the expandable README badge section of each card in the project overview.

Personal projects are configured in `src/catalog.js`. For apps, the analytics ID combines the store hash and the app slug. The Supervisor calculates the store hash from the first eight characters of the SHA-1 hash of the lowercase store URL. The current store, `https://github.com/seb5594/Home-Assistant-Apps`, produces `4c7fee11`; known individual repositories previously used as personal stores are also included. Statistics from Poeschl's store are not attributed to your projects. Custom integrations are matched using the exact domain from `manifest.json`.

## Technology and color palette

Vue 3 with the Composition API, Vite 8 / Rolldown, Chart.js 4, and Lucide. Bootstrap, Sass, icon fonts, and the previous tracking code have been removed.

The shared JavaScript color palette is defined in `src/palette.js`:

```js
['#193b69', '#4e87d5', '#55b5ad', '#8c80c7', '#e0af58', '#88b9e5', '#99aaba', '#bbc5d2']
```

## Thank you, Poeschl

The inspiration and original foundation come from **[Poeschl's Home Assistant Addon Stats](https://github.com/Poeschl/homeassistant-addon-stats)**. This fork builds on that idea with a new interface, custom integration support, and its own data pipelines. Thank you for sharing your work and inspiring this project.

The original **Apache License 2.0** is preserved. See [LICENCE](LICENCE) and [NOTICE](NOTICE). Home Assistant is a project of the Open Home Foundation; this dashboard is an independent community project.
