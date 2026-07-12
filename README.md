# TikTok Stats

A full, responsive analytics dashboard for any TikTok page. Type in a username and get real growth
stats, a posting calendar, monetization estimates, and SEO insights — pulled live from TikTok.

## Features

- **Search page** — enter any `@username` to load its dashboard.
- **Overview** — first video date, subscriber count, video totals (avg/month, this month, last month,
  best month, lowest month with mm/yy), activity in the last 7 days, and a line chart of cumulative
  videos since the channel's creation plus a monthly posting-cadence chart.
- **Calendar** — a year × month heatmap of video counts (click a cell to filter), plus search, year,
  hashtag, and min-views filters over the full video list.
- **Videos** — a sortable/filterable table of every video, with an editable per-video RPM override.
- **Monetization** — niche, **auto-detected language**, and RPM (fully manual/editable, drives every
  estimate), estimated revenue per month (table + chart), and top earning videos.
- **SEO** — most-used title words, most-used hashtags, best-performing hashtags by average views,
  title-length-vs-views, and a day/hour posting-time heatmap.
- **Accounts** — every channel you've looked up, for quick comparison/navigation.
- **Settings** — data source status and default RPM per niche.

Dark mode, fully responsive, no TikTok login required to use the app.

## Getting started

```bash
npm install
npx playwright install chromium   # one-time download of the headless browser used to fetch real data
npm run dev
```

Open http://localhost:3000 and search a real TikTok username. Data is fetched live, directly from
TikTok, the first time you load a channel, then cached locally for 15 minutes.

## How real data works

TikTok has no official public API for follower counts, video lists, etc., and scripted
username/password logins don't work reliably (TikTok requires captcha/2FA for those). Instead, by
default this app:

- Launches a real (headless) Chromium browser with Playwright and opens the public profile page,
  the same way a logged-out visitor's browser would.
- Reads the profile stats (followers, likes, video count, bio, avatar, verified badge) straight out of
  the JSON TikTok's own web app embeds in that page.
- Scrolls the page to trigger TikTok's own "load more videos" requests, and captures each video's real
  stats (views, likes, comments, shares, saves, captions, hashtags, post date) as they load.

No account, password, or API key is required for public profiles. **Language** is auto-detected per
channel from its bio + recent captions using [`franc`](https://github.com/wooorm/franc), an
open-source, fully offline language-detection library — no external API call involved. **Niche** is
auto-detected from bio/hashtag keywords. Both can be corrected manually from the Monetization tab if
the auto-detection guesses wrong.

### Limitations — please read

TikTok rate-limits and occasionally blocks automated browser traffic, and without logging in it will
only paginate through so much history. In practice:

- Very large/old channels may only return their most recent videos (up to `maxVideosToFetch`, default
  300) rather than their full archive. When that happens the dashboard shows a clear "showing the N
  most recent of Y total videos" notice, and stats like "first video" reflect only what was fetched.
- If TikTok blocks a request outright, you'll see a clear error screen (not a crash) suggesting you
  retry, or switch to the paid fallback below.
- TikTok changes its site's internal structure periodically; if scraping stops working, the fix is
  updating the parsing logic in `src/lib/dataProviders/tiktokWeb.ts` to match the new shape.
- Automated scraping is a grey area under most sites' Terms of Service. This tool only reads public
  page data the same way a normal logged-out browser would (no auth bypass, no private data) — use it
  for your own analytics/research responsibly.

### Optional: a paid, more reliable fallback

If you'd rather not rely on scraping, you can switch to a paid RapidAPI TikTok scraper instead:

1. Copy `config/credentials.example.json` to `config/credentials.json` (already gitignored, so your
   key never gets committed).
2. Subscribe to a TikTok scraper API on RapidAPI (the code targets the common "TikTok Scraper" /
   `tiktok-scraper7` response shape — adjust `src/lib/dataProviders/rapidapi.ts` if your provider's
   fields differ) and paste your key into `rapidApi.key`.
3. Set `"dataProvider": "rapidapi"` in that file (or `DATA_PROVIDER=rapidapi` / `RAPIDAPI_KEY=...` in a
   `.env.local`, copied from `.env.example` — env vars win over the JSON file).
4. Restart the app.

`config/credentials.json` also has an optional `tiktokAccount.cookie` field — paste a logged-in
browser session's `cookie` header there to make the built-in scraper look like a real logged-in visit,
which can reduce rate-limiting if you're getting blocked often. Direct username/password login is
never used to authenticate anywhere in the app.

There's also an explicit `"dataProvider": "mock"` option (deterministic offline demo data, no network
calls) if you ever want to test the UI without hitting TikTok at all.

## Data & storage

Fetched profile/video data is cached in a local SQLite database at `data/tiktok-stats.sqlite`
(gitignored) for 15 minutes, and channel settings (niche/language/RPM) and per-video RPM overrides are
stored there permanently. Use the refresh button on a channel's header to force a re-fetch.

## Project structure

```
src/
  app/                       # Next.js App Router pages + API routes
    dashboard/[username]/    # overview, calendar, videos, monetization, seo tabs
    accounts/                # tracked accounts list
    settings/                # data source & default RPM config
    api/                     # profile fetch, channel settings, video RPM, accounts
  components/                # UI building blocks (charts, calendar, tables, cards)
  lib/
    dataProviders/           # tiktokWeb (live scraper, default) + rapidapi + mock adapters
    channel.ts                # data-access layer: cache, settings, overrides
    stats.ts / revenue.ts / seo.ts   # all derived-stat calculations
    langDetect.ts / languages.ts     # open-source offline language detection (franc)
    db.ts / config.ts         # SQLite setup, config loading
```

## Tech stack

Next.js 15 (App Router, TypeScript) · Tailwind CSS · Recharts · Playwright · franc · better-sqlite3 · Zod
