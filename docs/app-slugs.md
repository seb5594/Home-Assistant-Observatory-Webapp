# App slugs, store hashes, and authors

Home Assistant Analytics does not know who wrote an app. It only sees an **analytics ID** made of two parts:

```text
<store hash>_<app slug>      e.g. 4c7fee11_git-exporter
```

## The app slug

The slug is the `slug` field in your app's `config.yaml`. You choose it once and should never change it afterwards, because it is part of the installed app's identity.

```yaml
name: Rsync Local
slug: rsync-local
version: 1.75.0
```

Use lowercase letters, digits, `-`, and `_`. Prefer something unique (`sony_playstation_vr_camera_loader` rather than `camera`), because every store that ships the same slug ends up under its own hash in the statistics.

## The store hash

The Supervisor derives the hash from the repository URL a user adds to the app store: lowercase the URL, compute SHA-1, keep the first eight characters.

```bash
printf '%s' 'https://github.com/seb5594/home-assistant-apps' | sha1sum | cut -c1-8
# 4c7fee11
```

Every spelling is a different store: `…/Home-Assistant-Apps.git`, a trailing `/`, `http://`, or `www.` each produce another hash. Casing does not matter. This is why a store may appear in the data under several hashes, or not at all when nobody has added it with that exact URL.

Special hashes: `core` (official apps) and `local` (apps installed from `/addons`).

## Why an author is not part of the official data

The author is not transmitted. HA Observatory reconstructs it by hashing known repository URLs and matching the result against the hashes in `addons.json`:

1. `scripts/store-seeds.json` lists curated stores and legacy hashes whose URL is unknown.
2. `npm run data` also searches GitHub for repositories with app store topics (`home-assistant-addons`, `hassio-addons`, …) and hashes each URL spelling.
3. Hashes that appear in the analytics data are written to `public/data/authors.json` together with the repository owner. The dashboard shows them as `4c7fee11 (seb5594)` and offers an author filter.

To get your own store labelled, add its URL to `repositories` in `store-seeds.json` or give the repository one of the topics above and wait for the next daily run.

Authors of custom integrations are taken from the HACS default list (`full_name` of the repository). Integrations that are not listed in HACS have no author in the dashboard; add them to `src/catalog.js` instead.

## Why my app or integration is missing

Analytics are opt-in. An entry exists once at least one installation with analytics enabled reports it. A missing entry therefore means "not reported yet", never "zero installations". Check that:

- the store URL users add is the one you hashed (see the spellings above),
- the app slug in `config.yaml` matches the one in `src/catalog.js`,
- for integrations, the `domain` in `manifest.json` matches the catalog `id`. Domains that shadow a core integration may be counted under the core integration instead.
