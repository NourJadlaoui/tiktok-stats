# TikTok Stats

A full, responsive, **commercial-ready** analytics SaaS for TikTok — a public marketing landing page,
a free trial + paid plans billed through Stripe, and a client dashboard behind Google sign-in, with
everyone's data private to their own account in a shared Supabase/Postgres backend (and visible to
you as admin):

- **Landing page** (`/`) — public marketing page with a live-styled product preview, pricing pulled
  straight from the database, and a free-trial signup — see "Landing page & SEO" below.
- **Client Dashboard** (`/app` and everything under it) — the actual product, behind Google sign-in:
  - **Profile Stats** — type in a `@username` and get real growth stats, a posting calendar,
    monetization estimates, and SEO insights for that one page, pulled live from TikTok.
  - **Niche Stats** — type in a topic/keyword and discover the top creators posting about it, ranked by
    followers, recent activity, and more, with one click through to their full Profile Stats.
  - **Niche Finder** — pick up to 3 languages and let it automatically scan dozens of niche topics at
    once, scoring and ranking every one so you can see where demand is high and competition is low
    without running searches one at a time.
  - **Bulk Search** — paste or drop a list of usernames and scan all of them in one background job,
    sharing a single browser session end to end.
  - **Billing** — see usage against your plan's limits and upgrade/manage your subscription via Stripe
    Checkout + the Billing Portal.
- **Admin dashboard** — platform-wide stats (users, active users, scans, MRR), per-user usage logs,
  plan pricing/limits editing, a payments on/off switch, and full **Act as** impersonation to see any
  user's dashboard exactly as they see it — all enforced by the database itself via Row Level Security,
  not just the UI.

## Features

### Profile Stats (per-account dashboard)

- **Search page** — enter any `@username` to load its dashboard.
- **Overview** — a 0-100 **Creator Score** with a full breakdown (see "How scoring works" below), a
  plain-English **Creator Verdict** (Winning/Promising/Not there yet/Inactive, based on your configurable
  revenue goals and activity window in Settings), first video date, subscriber count, video totals
  (avg/month, this month, last month, best month, lowest month with mm/yy), activity in the last 7 days,
  a growth chart (cumulative videos + views by month), a monthly posting-cadence chart, and a
  **follower/views/revenue history chart** built from every real sync since you first looked the channel
  up — its Y-axis auto-scales to the actual range of your data (instead of always starting at 0), so
  small real changes stay visible instead of flattening into a near-straight line, and the tooltip shows
  exact figures plus a precise sync date/time.
- **Calendar** — a year × month heatmap of video counts (click a cell to filter), plus search, year,
  hashtag, and min-views filters over the full video list.
- **Videos** — a sortable/filterable table of every video with duration and a monetized/not-monetized
  badge (TikTok's Creator Rewards Program requires ≥60s), a monetized-status filter, and an editable
  per-video RPM override. Supports `?hashtag=` / `?q=` URL params for one-click filtering from the SEO tab.
- **Monetization** — niche, **auto-detected language**, and RPM (fully manual/editable). Revenue
  estimates only count videos ≥60s long by default (matching TikTok's own eligibility rule) — a
  monetizable-vs-not breakdown is shown, and per-video RPM overrides can force revenue on a short
  video anyway (e.g. a paid sponsorship).
- **SEO** — most-used title words and hashtags (click either to jump straight to those videos on the
  Videos tab), best-performing hashtags by average views, title-length-vs-views, and a day/hour
  posting-time heatmap.

### Niche Stats (topic/keyword discovery)

- Enter any topic, niche, or hashtag — it scans real TikTok search results (up to a configurable video
  count), groups every video found by its creator, and returns a ranked list of profiles.
- A 0-100 **Niche Score** summarizing whether it looks like a good niche to enter (demand, momentum,
  engagement, competition — see "How scoring works" below), plus a Creator Score per profile found.
- Niche-wide SEO insights: most-used hashtags and title words across everything scanned, the best day/
  hour to post, and the top-performing videos found.
- Sort profiles by Creator Score, followers, activity in the last 30 days, videos found for the topic,
  average views, or total views found — filter by name or a minimum follower count.
- Each result links straight into that creator's full Profile Stats dashboard.
- Every search is cached and listed on the Accounts page (see below) so you can revisit results without
  rescanning, and `/niche?q=<term>` reloads a cached search directly.
- Scrolling stops as soon as TikTok's own "No more results" end-of-list marker appears on the page, or
  your configured video limit is reached — whichever comes first — rather than guessing based on a fixed
  number of scroll attempts, so a search that genuinely has fewer results than your limit doesn't scroll
  forever, and one that has more doesn't stop early.

### Niche Finder (automatic multi-niche discovery)

- Pick 1-3 languages, a coverage level (Quick ~12 niches/language, Standard ~25, Full = every curated
  niche), and how many videos to scan per niche, then hit **Run Niche Finder**.
- It works through a curated list of niche topics for the languages you picked, running the same
  real-data Niche Stats scan on each one in the background — you can leave the tab and come back later,
  since progress and results are saved as they complete, not just at the end.
- Every niche gets a full **Niche Score** breakdown (demand/momentum/engagement/competition) plus an
  **opportunity tag** — `Hidden gem` (good demand, low competition), `Hot right now` (high demand +
  momentum), `Rising` (momentum building), or `Saturated` (competition-dominated) — to flag where the
  actual opportunity is at a glance, not just which niche is biggest.
- Results are sortable/filterable by score, demand, momentum, competition, profiles found, language, or
  opportunity tag, and each one links straight into its full Niche Stats results page.
- Past runs are kept in a history list below, so you can revisit an earlier scan without re-running it.
- Saved in its own `niche_finder_runs` table — these runs can get large (dozens of niches × dozens of
  profiles each), so they're kept separate from the smaller per-channel/per-search caches Profile Stats
  and Niche Stats use.

### Similar Creators (on Profile Stats)

- From any channel's Overview page, click **Find similar creators** to see other real TikTok accounts
  posting about the same topic — it reuses the channel's own top hashtag as a search term and runs it
  through the same Niche Stats scan, then ranks the results by Creator Score.
- Each result links straight to that creator's own Profile Stats dashboard.

### Bulk Search — scanning many profiles in one go

- Paste a comma/newline-separated list of usernames, or drag-and-drop a `.txt` (one per line, or
  comma-separated) or `.json` file (an array of usernames, or `{"usernames": [...]}`), then **Run scan**.
- The whole batch runs as **one background job**, scanning every username sequentially (never in
  parallel) — that's what makes "solve a CAPTCHA once for this batch" actually work: the scraper already
  reuses one Playwright browser process for the app's whole lifetime and saves a verified session to
  disk after every successful scrape, reloading it into the next scrape's context. So if TikTok
  challenges the very first profile (only reachable with `scrapeHeadless: false`, since a headless run
  can't show you anything to solve), solving it saves that session before the second username's scrape
  even starts — every profile after that reuses the already-verified session instead of hitting a fresh
  challenge.
- Progress is shown live, and once the batch finishes, the scanned profiles appear right there as a card
  gallery (see below) as well as on Accounts.

### Categories, My Score, Notes & Tracking (on Profile Stats)

- From any channel's Overview page, the **My tracking** card lets you assign it to one or more
  **categories** (a shared list managed from Settings, so it stays consistent and filterable across the
  whole app instead of free-text-per-profile), set a personal **My Score** (0-10 slider), write free-text
  **notes**, and flip **Track this creator** on.
- Categories and the tracked toggle save instantly on click; My Score and notes save with an explicit
  "Save Score & Notes" button.
- Both the **Accounts** page and the **Tracked** dashboard (below) can filter by category, minimum My
  Score, and tracked-only — so once you've tagged and scored creators here, you can slice by them
  anywhere else in the app.

### Tracked dashboard

- A dedicated **Tracked** page shows progression across every creator you've flipped "Track this
  creator" on: combined followers/revenue, a % follower-growth bar chart (green = growing, red =
  shrinking) since each creator's first sync, and a per-creator card grid with their category chips, My
  Score, and a link into their full Profile Stats dashboard.
- Filter the whole dashboard down to one category at a time with the category dropdown.
- Growth is computed from the same sync-history snapshots that power each channel's own history chart —
  a creator needs at least two real syncs before growth shows as a number instead of "not enough sync
  history yet".

### Profile gallery — table or cards, your choice

- Both **Accounts** and any finished **Bulk Search** batch can switch between the original sortable
  table and a card gallery — 3-up grid, 4-up grid, or a horizontal list — via the view toggle at the top.
- Each card shows the current Creator Score alongside real **week-over-week** and **year-over-year**
  follower-growth deltas (computed from sync-history snapshots — a profile needs at least two syncs
  spanning that window before a delta shows as a number instead of "—"), plus RPM, categories, My Score,
  and the tracked bookmark.

### Admin dashboard

Sign in with an email listed in Settings' **Admin access** panel (seeded with one address when you run
`supabase/schema.sql`) to unlock the **Admin** link in your account menu (top-right avatar).

- **Platform stats** — total users, users active in the last 30 days, scans this month, profiles on
  file, paying subscribers, and MRR, all computed live from the database.
- **Users** — every signed-up user with their channel/tracked counts, requests used this month, and
  current plan. **View data** opens a read-only look at exactly what that user sees on their own
  Accounts page. **Act as** goes further — it starts full impersonation (see below).
- **Act as (full impersonation)** — click **Act as** next to any user and you're dropped into `/app`
  seeing *their* real, live, fully-interactive dashboard: their tracked creators, their searches, their
  settings, their plan and usage — not a read-only copy. A banner across the top of every page
  ("Acting as user@example.com — Exit") makes it unmistakable you're impersonating, with one click to
  return to your own account. This is the same `effectiveUserId` mechanism every data-access function
  in the app already uses (see "Row Level Security" below) — the target user's id just replaces your
  own for the rest of the request, with your own admin session re-verified server-side on every load
  (an `acting_as_user_id` cookie carries no authority by itself; a non-admin session ignores it
  entirely).
- **Plans & billing** — edit every plan's price, monthly request limit, max tracked profiles, max
  videos per profile, bulk-scan batch size, active status, and Stripe price ID inline, plus a global
  **payment gateway** on/off switch (see "Billing & subscriptions" below).

This isn't just a UI convention — every table's Row Level Security policy has an explicit admin-bypass
clause (see `supabase/schema.sql`), so an admin account can read (and, for owned-row tables, insert as)
any user at the database level, not just through this page.

### Shared

- **Accounts** — every Profile Stats channel you've looked up, plus every Niche Stats search you've run
  (with its score, profiles found, and a link back to the results) — a combined history of everything
  you've searched, filterable by category, tracked-only, and minimum My Score.
- **Sync now** — every channel and niche search shows "Synced X ago" plus a **Sync now** button that
  forces an instant re-scan regardless of your configured auto-sync interval; short of that button,
  a page load only re-scans automatically once the interval has elapsed, so revisiting a channel doesn't
  re-scrape it every time.
- **Money** — revenue figures are shown as whole-dollar amounts with thousands separators (e.g.
  `$28,700`); hover any revenue figure to see the EUR equivalent at your configured exchange rate.
- **Settings** — data source status, session/scraping status, and several fully editable managers:
  - **Sync & currency** — how often (4h/12h/24h/48h) pages auto-re-sync instead of serving cached data,
    and the USD→EUR rate used for the hover conversion on every revenue figure.
  - **Scoring thresholds** — the monthly/lifetime revenue goals and "active" window (days) that drive
    the Creator Verdict and Niche Verdict shown on Profile Stats and Niche Stats.
  - **Categories** — add or delete the shared category list used to tag creators (see "Categories, My
    Score, Notes & Tracking" above); deleting a category also strips it from every creator it was
    assigned to, so filters never reference a stale category.
  - **Niche RPM** — add, edit, or delete the RPM used to seed a new channel's monetization estimate by
    niche (the `default` entry can be edited but not deleted). Changes apply immediately to newly-loaded
    channels; existing channels keep whatever RPM they already have (editable per-channel from that
    channel's Monetization tab).
  - **Niche Finder search terms** — add, edit, or delete the candidate niche topics Niche Finder scans
    for any language, starting from a curated English list. For any other language, **Translate from
    English** calls a configurable open-source translation API to generate a starting list in one click,
    which you can then keep editing — see "Translating Niche Finder terms" below.
  - Session status (whether a saved session exists, with a button to clear it) and read-only visibility
    into the current scraping config (headless/debug/video limits) — see "About TikTok's CAPTCHA" above
    for what these are for.

Dark mode, fully responsive, no TikTok login required to use the app.

### Client Dashboard header & navigation

- The top bar shows your real Google name/avatar and current plan in an account menu (top-right),
  with Billing, Settings, and (if you're an admin) Admin dashboard grouped inside it — click your
  avatar to open it.
- The tool pages (Profile Stats, Niche Stats, Niche Finder, Bulk Search) are grouped under a
  **Discover** dropdown, and Accounts/Tracked under **Library**, instead of eight equal-weight links
  competing for space.
- **Loading UX** — Next.js's built-in `loading.tsx` convention drives two layers of feedback so
  navigation never looks frozen: a generic full-page skeleton for switching between top-level sections
  (`src/app/loading.tsx`), and a scoped skeleton *inside* a profile's tab content
  (`src/app/dashboard/[username]/*/loading.tsx`) that keeps the profile header and tab bar fixed in
  place while only the tab body shows it's loading — switching from Overview to Calendar shows a
  contained loading state instead of the whole page stalling with no feedback.

### Billing & subscriptions (Stripe)

- Every new sign-up is auto-provisioned onto the **Free Trial** plan (2 profile scans total, up to 50
  videos per profile by default — all limits are admin-editable). Paid plans (**Starter**, **Pro** by
  default) are billed monthly through **Stripe Checkout**, which also accepts PayPal as a payment
  method automatically when enabled on your Stripe account — no separate integration needed, and no
  raw card numbers ever touch this app's own servers.
- **Billing page** (`/billing`) shows usage against your plan's limit and lets you upgrade (redirects to
  Stripe Checkout) or manage an existing subscription (redirects to the Stripe Billing Portal — update
  card, switch plans, cancel).
- **Enforcement** happens server-side before every *real* scan (never for cache hits) — `enforceRequestLimit`,
  `enforceDistinctProfilesLimit`, and `enforceBulkScanLimit` in `src/lib/plans.ts` throw a
  `PlanLimitError` that every entry point (API routes, the profile dashboard layout) turns into a clean
  "upgrade to continue" response instead of a raw 500.
- **Webhook** (`/api/webhooks/stripe`) keeps `subscriptions` in sync with Stripe as the source of truth —
  driven by the Stripe *subscription* object's metadata (set at Checkout time, preserved across
  Billing-Portal plan switches) rather than the one-off checkout-session event, so upgrades/downgrades/
  cancellations done later through the portal stay in sync too.
- Payments are **off by default** — flip the switch in Admin → Plans & billing once you've configured
  Stripe (see "Getting started" below). While off, upgrade buttons are disabled everywhere.

### Landing page & SEO

- `/` is a public marketing page (no sign-in required) — hero, feature grid, a live-styled dashboard
  preview built from the app's own `StatCard`/`ScoreCard` components with illustrative demo data, a
  "how it works" section, and a pricing table pulled live from the `plans` table (so editing plans in
  Admin updates the marketing page too).
- Signed-in visitors are redirected straight to `/app`; signed-out visitors hitting anything under
  `/app` are redirected to `/login` with a `next` param that sends them back after signing in.
- SEO: per-page metadata (title template, description, keywords), Open Graph + Twitter card images
  generated on the fly (`src/app/opengraph-image.tsx`), a branded favicon (`src/app/icon.tsx`),
  `robots.txt` and `sitemap.xml` (`src/app/robots.ts` / `sitemap.ts`) that disallow crawling the
  authenticated app routes. Set `NEXT_PUBLIC_SITE_URL` in your env to your real deployed URL so these
  all point at the right domain.

## How scoring works

Both scores are fully transparent — click "How this works" on either score card in the app for the
same explanation shown here, and the exact formulas live in `src/lib/scoring.ts`.

**Creator Score** (0-100, one per profile) — five sub-scores:

| Sub-score | Weight | What it measures |
|---|---|---|
| Audience | 25% | Follower count, log-scaled (so accounts under 1M don't all read as ~zero) |
| Engagement | 30% | Avg (likes+comments+shares)/views — the best proxy for "is the content good," independent of size |
| Growth | 20% | Views in the last 30 days vs the 30 days before (flat = 50, doubling = 100, halving = 0) |
| Consistency | 15% | How steady the monthly posting cadence is |
| Monetization | 10% | Share of videos ≥60s (TikTok's Creator Rewards minimum) combined with view size |

Grades: 80+ Excellent · 60+ Strong · 40+ Average · 20+ Weak · under 3 videos = not enough data. Profile
Stats scores use a channel's full fetched history; Niche Stats per-profile scores use only the (much
smaller) sample of videos found for that search term, so treat those as a rougher, directional read.

**Niche Score** (0-100, one per search) — four sub-scores:

| Sub-score | Weight | What it measures |
|---|---|---|
| Demand | 35% | Average views per video across everything scanned, log-scaled |
| Momentum | 25% | % of found videos posted in the last 30 days — is this topic trending right now? |
| Engagement | 20% | Avg (likes+comments+shares)/views across the scan |
| Competition | 20% (inverted) | % of total views held by the top 3 creators found — a niche dominated by a few huge accounts scores lower (harder to break in) |

Grades: 75+ Excellent opportunity · 55+ Good opportunity · 35+ Moderate · else Saturated (high
competition) or Low demand. This reflects only the videos scanned for that search (up to your chosen
limit), not TikTok's full index — a useful signal, not a guarantee.

**Opportunity tags** (Niche Finder only) — a quick label layered on top of the same sub-scores:

| Tag | Condition |
|---|---|
| Hidden gem | Demand ≥ 60 and competition ≤ 40 — real interest, room to break in |
| Hot right now | Demand ≥ 70 and momentum ≥ 60 — big and actively trending |
| Rising | Momentum ≥ 70 — growing fast regardless of current size |
| Saturated | Competition ≥ 70 — a handful of accounts dominate the views |

A niche can also get no tag at all if it doesn't clearly match any of these.

## Getting started

This app needs a **Supabase project** (free tier) for its database + Google auth, and a **Google Cloud
OAuth client** so Supabase can actually run the "Sign in with Google" flow. Neither can be created
automatically — here's the full walkthrough, roughly 10 minutes end to end.

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com), sign up (free), and create a new project.
2. Once it's ready, open **SQL Editor** → **New query**, paste in the entire contents of
   [`supabase/schema.sql`](./supabase/schema.sql) from this repo, and run it. This creates every table,
   enables Row Level Security, and seeds `pawpunchlines@gmail.com` as the first admin — **edit that
   email at the top of the file first** if a different account should be the initial admin (more admins
   can be added later from Settings once you're signed in).
3. Open **Project Settings → API**. You'll need three values from here in step 4: the **Project URL**,
   the **anon public** key, and the **service_role** key (⚠️ keep this one secret — it bypasses Row
   Level Security entirely; only used server-side by the Admin page's "list all users" API route).

#### Already have this app's Supabase project set up? Update it, don't recreate it.

If you already ran an earlier version of `supabase/schema.sql` against this project — Google auth is
working, you've got real data in there — you do **not** need a new project or to touch Google/OAuth
setup again (skip straight to step 4). You only need the database to pick up whatever's new in this
version (new tables like `plans`, `subscriptions`, `usage_events`, `app_config`, new columns, new RLS
policies, etc.).

**Just re-run the current `supabase/schema.sql`** — open **SQL Editor → New query**, paste in the
*entire, current* contents of the file (not a diff — the whole thing), and run it, exactly like the
first time. This is safe on a project that already has data:

- Every `create table` uses `if not exists` — existing tables and their rows are left alone.
- Every seed `insert` (the admin email, the default plans, the `payments_enabled` flag) uses
  `on conflict ... do nothing` — it never overwrites something you've already customized (e.g. plan
  prices you've since edited from Admin → Plans).
- Every `create policy` is preceded by a matching `drop policy if exists` — Postgres has no
  `CREATE POLICY IF NOT EXISTS`, so policies are dropped and recreated instead, which is what makes
  re-running the *whole* file safe rather than erroring out partway through with "policy already
  exists" (which would otherwise abort before reaching this version's new tables at the bottom of the
  file).
- Functions (`is_admin()`, `_apply_owner_policies()`, `handle_new_user()`, ...) all use
  `create or replace`, and the one trigger uses `drop trigger if exists` + recreate.

In short: nothing in this file can destroy existing rows, and re-running it is exactly how you pick up
schema changes from a newer version of this app. If a future version of `schema.sql` ever needs an
actual data migration (backfilling a new column from existing rows, say), it'll be called out
explicitly here — a plain re-run won't silently lose anything either way.

### 2. Create a Google OAuth client

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) → create/select a project →
   **APIs & Services → OAuth consent screen**. Choose **External**, fill in the required fields, and
   either publish it or leave it in Testing and add your own Google account as a test user.
2. **APIs & Services → Credentials → Create Credentials → OAuth client ID** → **Web application**.
3. Under **Authorized redirect URIs**, add your Supabase project's callback URL — find the exact value
   in the Supabase dashboard under **Authentication → Providers → Google**
   (`https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`).
4. Save, then copy the generated **Client ID** and **Client Secret**.

### 3. Wire Google into Supabase Auth

1. In Supabase: **Authentication → Providers → Google** → toggle it on, paste in the Client ID/Secret
   from step 2, save.
2. **Authentication → URL Configuration** → set **Site URL** to where you'll run this app (e.g.
   `http://localhost:3000` for local dev), and add it under **Redirect URLs** too.

### 4. Configure and run the app

```bash
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
# from Supabase Project Settings > API (step 1.3 above)

npm install
npx playwright install chromium   # one-time download of the headless browser used to fetch real data
npm run dev
```

Open http://localhost:3000 — you'll land on the public marketing landing page. Click **Sign in** /
**Start free**, sign in with Google, and you'll be dropped into `/app`. Search a real TikTok username —
data is fetched live, directly from TikTok, the first time you load a channel, then cached until your
configured auto-sync interval elapses (Settings → Sync & currency).

**If videos come back empty, don't stop here** — jump straight to "Step by step: go live with real
data" below. It's almost always one missing step (a browser session cookie).

### 5. (Optional) Enable Stripe billing

Skip this if you just want to run the app for free — every plan works with `payments_enabled: false`
(the default), it just means the Billing page's upgrade buttons stay disabled. To take real payments:

1. Create a [Stripe](https://stripe.com) account, then in the Dashboard create one **Product + Price**
   per paid plan (e.g. Starter $19/mo, Pro $49/mo) — use **recurring** prices.
2. Copy each price's ID (`price_...`) into that plan's **Stripe price ID** field in Admin → Plans &
   billing.
3. **Developers → API keys** → copy the **Secret key** into `STRIPE_SECRET_KEY` in `.env.local`.
4. Set up a webhook endpoint pointing at `https://your-domain.com/api/webhooks/stripe`, listening for
   `customer.subscription.created`, `customer.subscription.updated`, and
   `customer.subscription.deleted`. Copy its **Signing secret** into `STRIPE_WEBHOOK_SECRET`. For local
   testing, use the [Stripe CLI](https://stripe.com/docs/stripe-cli) instead:
   `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.
5. Flip **Payments enabled** on in Admin → Plans & billing. PayPal shows up automatically as a payment
   method on Stripe Checkout once you enable it in your Stripe account settings — no code changes
   needed on this side.

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

**Niche Stats** works the same way, pointed at TikTok's search results page instead of a profile page:
it scrolls to collect up to `nicheMaxVideos` (default 500) matching videos, reading each one's author
info straight out of the same per-item JSON the search results embed (which usually includes that
author's follower count too, so no extra per-profile fetch is needed). Its response shape is less
thoroughly verified than the profile endpoint's (this repo couldn't be tested against live tiktok.com —
see Limitations) — if results look off, the parsing to adjust lives in
`src/lib/dataProviders/tiktokSearch.ts`, and `scrapeDebug` logs the raw responses the same way it does
for Profile Stats.

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

## Step by step: go live with real data

1. **Install and get a browser.**
   ```bash
   npm install
   npx playwright install chromium
   ```
2. **Get a TikTok cookie.** This is the single biggest factor in whether scraping works — a
   cookie-less headless browser looks like a bot and is the traffic TikTok is most likely to block or
   serve an empty/verification response to. You do **not** need to log in; even the cookies from an
   anonymous visit help a lot. `curl` cannot get this for you (see "Why curl doesn't work" below) — use
   a real browser:
   1. Open Chrome/Firefox/Edge and go to `https://www.tiktok.com` (browse around a bit — view a profile
      or two — so TikTok sets its usual anti-bot cookies).
   2. Open DevTools (`F12` or right-click → Inspect), go to the **Network** tab, and reload the page.
   3. Click any request to `www.tiktok.com` in the list (the top one, the actual page document, works
      well).
   4. In the **Headers** panel, find **Request Headers** → **Cookie**. It's one long line like
      `tt_chain_token=...; ttwid=...; sessionid=...; msToken=...; ...`.
   5. Copy that entire value — you'll paste it in step 3.
3. **Add the cookie via `.env.local`, not the JSON file.** This matters: real TikTok cookies (like
   `g_state`) contain raw `"` characters. Pasted into a JSON string, those break the file's syntax and
   the **whole config gets silently ignored** — which is almost certainly what happened if you edited
   `config/credentials.json` directly and it didn't seem to take effect. `.env.local` has no such
   escaping problem:
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` and paste your cookie on one line, no quotes needed:
   ```
   TIKTOK_COOKIE=tt_chain_token=...; ttwid=...; sessionid=...; msToken=...; ...
   ```
   (If you'd still rather use `config/credentials.json` for the cookie, copy
   `config/credentials.example.json` to `config/credentials.json` and read the `_cookie_WARNING` note
   in it first — every `"` in the cookie must become `\"` or the file won't parse.)
4. **Start the app** and search a real username:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000, enter a username (no `@`), and hit Analyze.
5. **If a channel comes back with no videos**, see Troubleshooting below before assuming something's
   broken — it's almost always the missing-cookie issue from step 3.

### Why `curl` doesn't work for getting a cookie

`curl https://www.tiktok.com` only shows `Set-Cookie` response headers for the handful of cookies the
server sets on the very first, unauthenticated request — it doesn't run TikTok's JavaScript, so it
never gets the fuller set of anti-bot cookies (`ttwid`, `tt_chain_token`, etc.) a real browser
generates after loading the page. You need an actual browser's DevTools (step 3 above) to capture the
real `Cookie:` **request** header a logged browser sends on subsequent requests — that's different from
the `Set-Cookie` **response** header curl shows you.

### Troubleshooting: no videos returned

If the dashboard loads a profile (followers/avatar/etc. show up) but the video list is empty:

1. **Add a cookie** if you haven't (see step 3 above) — this fixes it most of the time.
2. **Turn on debug mode** to see exactly what TikTok sent back. Add to `config/credentials.json`:
   ```json
   "scrapeDebug": true
   ```
   or run with `TIKTOK_SCRAPE_DEBUG=1 npm run dev`. Then reload the channel and watch the terminal
   running `npm run dev` — it logs every TikTok API response, including any verification/error status
   codes, which tells you exactly what TikTok is doing.
3. **Watch it happen live.** Add `"scrapeHeadless": false` to `config/credentials.json` (or run with
   `TIKTOK_SCRAPE_HEADLESS=false npm run dev`) and reload the channel — a real Chromium window will pop
   up so you can see if TikTok is showing a CAPTCHA, a "verify you're human" wall, or a region/consent
   redirect instead of the normal profile page.
4. **Check the error message.** If the app now shows a red error banner instead of a blank video list,
   read it — recent changes make the scraper surface *why* it got nothing (verification wall, blocked
   request, etc.) instead of failing silently.
5. Still stuck? The TikTok video-list API endpoint or page structure may have shifted since this was
   built — the parsing logic to update lives in `src/lib/dataProviders/tiktokWeb.ts` (functions
   `extractProfile` and the `page.on('response', ...)` handler).

### About TikTok's CAPTCHA (slide/rotate puzzle)

TikTok sometimes shows an interactive puzzle CAPTCHA (rotate an image, or slide a piece into a gap)
when it suspects automated traffic. This app **does not** and **will not** try to solve that puzzle
automatically. That specific check exists to tell humans and bots apart, so auto-solving it means
building a tool whose entire purpose is defeating a site's anti-bot protection — that's a step beyond
"read public pages like a logged-out visitor" (which is the grey-area-but-defensible thing this app
already does) and into actively bypassing an access control, which isn't something to automate here
regardless of the target being TikTok specifically.

What this app does instead, all aimed at simply not triggering the CAPTCHA as often:

- **Session reuse** (new, on by default — `persistSession` in `config/credentials.json` /
  `PERSIST_SESSION=false` env var to disable): once a browser session gets through TikTok's check —
  whether that's a normal request that never got challenged, or a `scrapeHeadless: false` run where
  *you* solved a CAPTCHA by hand — its cookies/localStorage are saved to `data/session-state.json` and
  reused on the next scrape, so you're not starting from zero (and risking a fresh check) every time.
  Delete that file to force a clean session.
- **A real session cookie** (see "Step by step: go live with real data" above) — by far the biggest
  factor in avoiding the check in the first place, since it makes requests look like a returning visitor
  rather than a fresh anonymous one.
- **Stealth tweaks + human-like pacing** — masking the most common headless-browser tells, and
  randomized delays/scroll patterns instead of robotic fixed-interval requests (see
  `src/lib/dataProviders/browserUtils.ts`).
- **A visible fallback**: `scrapeHeadless: false` lets you watch it happen and solve a CAPTCHA yourself
  if one appears — combined with session reuse above, you should then only need to do that occasionally,
  not on every request.
- **The paid RapidAPI fallback below**, which routes through a third-party provider's own
  infrastructure instead of your browser entirely, sidestepping the question here.

### Translating Niche Finder terms

The Settings page's **Translate from English** button (see "Niche Finder search terms" above) calls a
[LibreTranslate](https://github.com/LibreTranslate/LibreTranslate)-compatible API — LibreTranslate is
open-source and self-hostable, which is what "an open-source API" means here. By default it points at
the public `libretranslate.com` instance, which is free but can be slow, rate-limited, or occasionally
unavailable since it's a shared community resource. For anything beyond occasional use, self-host your
own instance (a single `docker run -p 5000:5000 libretranslate/libretranslate` is enough to get started —
see their README for details) and point this app at it:

```
"translateApiUrl": "http://localhost:5000/translate",
"translateApiKey": ""
```

(or the `TRANSLATE_API_URL` / `TRANSLATE_API_KEY` env vars). Machine translation of short niche-topic
phrases is a starting point, not a final answer — always skim the translated list afterward and fix
anything that reads oddly using the same add/edit/delete controls.

### Optional: a paid, more reliable fallback

If you'd rather not rely on scraping at all, you can switch to a paid RapidAPI TikTok scraper instead:

1. In `config/credentials.json`, subscribe to a TikTok scraper API on RapidAPI (the code targets the
   common "TikTok Scraper" / `tiktok-scraper7` response shape — adjust
   `src/lib/dataProviders/rapidapi.ts` if your provider's fields differ) and paste your key into
   `rapidApi.key`.
2. Set `"dataProvider": "rapidapi"` in that file (or `DATA_PROVIDER=rapidapi` / `RAPIDAPI_KEY=...` in a
   `.env.local`, copied from `.env.example` — env vars win over the JSON file).
3. Restart the app.

There's also an explicit `"dataProvider": "mock"` option (deterministic offline demo data, no network
calls) if you ever want to test the UI without hitting TikTok at all.

## Data & storage

Everything lives in your Supabase Postgres database — channel cache and settings, per-video RPM
overrides, Niche Finder runs, Bulk Search jobs, and append-only sync-history snapshots (one row per real
sync, powering the follower/views/revenue history chart, the profile gallery's week/year deltas, and the
Tracked dashboard's growth numbers) all read/write through it, scoped per user by Row Level Security.

Most of it keeps the same "one JSON blob per row" shape the app has always used internally — see
`kv_channels`, `kv_profile_cache`, `kv_video_overrides`, `kv_niche_search_cache`, `kv_settings` in
`supabase/schema.sql` — just backed by Postgres `jsonb` columns instead of a local file, via
`src/lib/sql/engine.ts`'s `kvGetAll`/`kvSetAll`. `profile_history` and `niche_history` are genuinely
relational tables (append-only, queried directly) since they're unbounded and grow over time.

Whether a channel or niche search re-scans TikTok on page load, or serves what's cached, is governed by
the **auto-sync interval** in Settings (4h/12h/24h/48h, default 24h) — a **Sync now** button always
forces an instant re-scan regardless of the interval.

Everything editable from the Settings page — Niche RPM, Niche Finder term lists, the shared category
list, sync interval, USD→EUR rate, and scoring thresholds — is seeded once from
`config/credentials.json`/the built-in defaults, then the database becomes the source of truth; editing
the config file afterward won't change anything already seeded, use the Settings page instead.

## Multi-user, Google auth, and admin visibility

Every table in `supabase/schema.sql` carries a `user_id` column defaulting to `auth.uid()`, and Row
Level Security is enabled on all of them: a signed-in user can only read/write rows where `user_id`
matches their own account — enforced by Postgres itself, not just hidden by the UI. Every page in the
app is gated behind Google sign-in by `src/middleware.ts` (note: it lives in `src/`, not the repo root —
Next.js requires that placement for a `src/app` project), which is also the very first thing a new
visitor sees.

Accounts listed in the `admin_emails` table (editable from Settings once you're signed in as an admin)
get an extra RLS policy bypass that lets them read (and, for a few operations, write) **any** user's
rows — that's what powers the **Admin** page. This is a database-level guarantee, not an app-level
convention — even a raw SQL query run as an admin account gets the same bypass.

A couple of things worth knowing if more than one or two people will actually use this:

- The TikTok scraping session (`data/session-state.json`, see "Bulk Search" above) is one file shared by
  **every** signed-in user on the server, not per-user — solving a CAPTCHA once helps everyone's scans,
  but it's a shared scraping identity, not an isolated one per account.
- There's no self-service "delete my account/data" flow yet.
- Concurrent scrapes from different users each launch their own browser context off the one shared
  Playwright browser process — fine for a handful of people, worth watching if this grows further.

## Project structure

```
supabase/
  schema.sql                 # run once in the Supabase SQL editor — tables, RLS, admin bootstrap
src/
  middleware.ts               # Google-auth gate for every route (must live in src/, not repo root)
  app/                       # Next.js App Router pages + API routes
    login/                   # Google sign-in page
    auth/callback/           # OAuth code exchange
    admin/                   # user list + "view as" (admin-only)
    bulk/                    # Bulk Search: paste/drop usernames, background scan, results gallery
    page.tsx                 # Profile Stats search (home page)
    niche/                   # Niche Stats search + results page
    niche-finder/            # Niche Finder: multi-language auto-scan dashboard
    dashboard/[username]/    # overview, calendar, videos, monetization, seo tabs
    accounts/                # tracked Profile Stats channels + Niche Stats search history
    tracked/                 # Tracked dashboard — progression across every "tracked" creator
    settings/                # data source status, sync/currency, scoring thresholds, categories,
                              # admin emails, RPM manager, Niche Finder terms manager
    api/
      bulk-scan/                     # start / status / results-as-gallery-rows endpoints
      admin/users/                   # service-role "list every signed-up user" endpoint
      channel/[username]/similar/    # Similar Creators (reuses Niche Stats search)
      channel/[username]/history/    # per-channel sync-history snapshots
      channel/[username]/tracking/   # per-channel categories/myScore/notes/tracked
      niche-finder/                  # run / status / history endpoints
      settings/                      # rpm, niche-terms (+ translate), categories, sync-interval,
                                      # currency, scoring-thresholds, admin-emails, session endpoints
      ...                            # profile fetch, channel settings, video RPM, niche search + history, accounts
  components/                # UI building blocks (charts, calendar, tables, cards, ModeTabs, ScoreCard)
    ProfileGallery.tsx             # table-alternative card view: grid/list toggle + score/week/year deltas
    AdminUsersList.tsx             # Admin page's user list + "view data" links
    SimilarCreators.tsx           # "Find similar creators" panel on Profile Stats overview
    CreatorTrackingCard.tsx       # categories / My Score / notes / track toggle, on Profile Stats overview
    TrackedDashboard.tsx          # Tracked dashboard: growth chart + per-creator card grid
    ProfileHistoryCard.tsx        # follower/views/revenue history chart with adaptive Y-axis precision
    CreatorVerdictCard.tsx / NicheVerdictBanner.tsx   # plain-English verdicts from scoring.ts
    Money.tsx                     # whole-dollar formatting with EUR-on-hover
    NicheFinderResultsTable.tsx   # sortable/filterable Niche Finder results table
    settings/
      RpmManager.tsx               # Settings: add/edit/delete niche RPM
      NicheTermsManager.tsx        # Settings: add/edit/delete/translate Niche Finder terms per language
      CategoryManager.tsx          # Settings: add/delete the shared creator category list
      SyncCurrencySettings.tsx     # Settings: auto-sync interval + USD→EUR rate
      ScoringSettings.tsx          # Settings: revenue goals + active-window thresholds for verdicts
      AdminEmailsManager.tsx       # Settings: who can sign in and see every user's data (admin-only)
  lib/
    supabase/
      client.ts / server.ts    # browser / cookie-bound server Supabase clients
      admin.ts                  # service-role client — server-only, Admin page's user list
      context.ts / tokenClient.ts   # lets background jobs (Bulk Search, Niche Finder) carry an
                                      # explicit authenticated client past their triggering request
    auth.ts                    # getCurrentUser() — session + is_admin() check
    bulkScan.ts                 # Bulk Search's background batch scanner (sequential, one browser session)
    galleryRows.ts               # batches Supabase reads into ProfileGallery's row shape
    sql/engine.ts             # Supabase-backed "JSON blob per row" KV helpers (kvGetAll/kvSetAll)
    history.ts                # append-only profile/niche sync-history snapshots
    money.ts                  # whole-dollar USD formatting + USD→EUR conversion
    dataProviders/
      tiktokWeb.ts             # live profile scraper (default)
      tiktokSearch.ts          # live Niche Stats keyword-search scraper
      browserUtils.ts          # shared Playwright browser/context/scroll helpers (dynamic auto-scroll,
                                # "No more results" detection, session persistence)
      tiktokItemUtils.ts       # shared TikTok "item" JSON → our shape mapping
      rapidapi.ts / mock.ts    # optional paid fallback + offline demo data (incl. niche mock)
    channel.ts / nicheSearch.ts   # data-access layers: cache, settings, overrides, search history, tracking
    nicheFinder.ts              # Niche Finder background batch-scan orchestrator
    nicheFinderStore.ts          # Niche Finder runs, backed by Supabase
    nicheFinderTerms.ts           # built-in curated per-language niche term lists + coverage levels
    settings.ts                 # editable RPM/terms/categories/sync/currency/scoring-threshold overrides
    scoring.ts                 # Creator Score + Niche Score + verdicts — see "How scoring works"
    stats.ts / revenue.ts / seo.ts   # all derived-stat calculations
    langDetect.ts / languages.ts     # open-source offline language detection (franc)
    db.ts / config.ts         # Supabase-backed store, config loading
```

## Tech stack

Next.js 15 (App Router, TypeScript) · Supabase (Postgres, Auth, Row Level Security) · Tailwind CSS ·
Recharts · Playwright · franc · Zod · date-fns

## Deploying to OVH Public Cloud

Two supported paths: **Path A** (plain Compute instance + PM2 + Nginx) is the most explicit and the
easiest to debug by hand; **Path B** (Docker) uses the `Dockerfile`/`docker-compose.yml` already in
this repo and is easier to redeploy repeatably. Either way, Supabase and Stripe stay external
services you're already using — nothing about them changes, you're only moving where the Next.js
server itself runs. Budget 30-45 minutes end to end.

**Before you start:** you need a domain name pointed at OVH (or any registrar — you'll edit its DNS),
and everything from "Getting started" above already done once (a working Supabase project, Google
OAuth client, and your filled-in `.env.local` from local dev — you'll copy those same values to the
server).

### 1. Create the OVH Public Cloud instance

1. In the [OVHcloud Control Panel](https://www.ovh.com/manager/), go to **Public Cloud** → create a
   project if you don't have one yet (billing requires a payment method, but Public Cloud is
   pay-as-you-go, no upfront commitment).
2. **Instances → Create an instance**:
   - **Image**: Ubuntu 22.04.
   - **Model**: pick at least a 4 GB RAM instance (e.g. `b2-7` or `d2-4`) — Playwright's headless
     Chromium is memory-hungry, and `b2-3`/2 GB will swap or OOM-kill under real scraping load.
   - **Region**: whichever is closest to your users (e.g. Gravelines/Strasbourg for Europe,
     Beauharnois for North America).
   - **Network**: keep the default public network so it gets a public IPv4.
   - Add your **SSH public key** here (Public Cloud → SSH Keys, or paste one during instance
     creation) — you'll need it to log in.
3. Once it's running, note its **public IP address** from the instance list.

### 2. Point your domain at it

In your DNS provider (OVH's own DNS zone editor if the domain is registered there, or wherever it's
hosted): add an **A record** for your domain (and `www` if you want both) pointing at the instance's
public IP. DNS propagation is usually minutes, sometimes up to a few hours.

### 3. SSH in and install the base system

```bash
ssh ubuntu@YOUR_INSTANCE_IP    # Ubuntu cloud images default to the "ubuntu" user

sudo apt update && sudo apt upgrade -y

# Node.js 20 (via NodeSource — Ubuntu's default apt Node is usually too old)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx

node -v   # should print v20.x
```

### 4A. Path A — plain PM2 + Nginx (recommended default)

```bash
# Get the code onto the server. If you've pushed this repo to your own GitHub:
git clone https://github.com/YOUR_USERNAME/tiktok-stats.git
cd tiktok-stats
# ...or if you're working from the zip Claude delivered: scp it up and unzip instead of git clone.

npm install
npx playwright install --with-deps chromium   # downloads Chromium + its system libraries

cp .env.example .env.local
nano .env.local   # fill in every value — see below
```

Fill in `.env.local` with your **production** values:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — same
  Supabase project you already set up (or a fresh one — just re-run `supabase/schema.sql` there too,
  see "Getting started" step 1).
- `NEXT_PUBLIC_SITE_URL` — your real domain, e.g. `https://tiktokstats.yourdomain.com`.
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` if you're taking payments — see "Getting started" step
  5, and point the Stripe webhook at `https://your-domain.com/api/webhooks/stripe`.
- `DATA_PROVIDER`, `RAPIDAPI_KEY`, `TIKTOK_COOKIE` etc. — whatever you were already using locally.

Then build and start it under PM2 (keeps it running, restarts on crash, restarts on reboot):

```bash
npm run build

sudo npm install -g pm2
pm2 start npm --name tiktok-stats -- start
pm2 startup systemd   # prints a command — copy/paste and run it, it registers PM2 with systemd
pm2 save              # persists the current process list so it comes back after a reboot
```

`pm2 status` / `pm2 logs tiktok-stats` are your friends for checking it's actually up.

**Redeploying later**, once this is running:
```bash
cd tiktok-stats
git pull                      # or re-upload the new zip
npm install
npm run build
pm2 restart tiktok-stats
```

### 4B. Path B — Docker

```bash
sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER && newgrp docker   # so you don't need sudo for docker commands

git clone https://github.com/YOUR_USERNAME/tiktok-stats.git
cd tiktok-stats
cp .env.example .env.local
nano .env.local   # same values as Path A above

docker compose up -d --build
```

The `Dockerfile` in this repo is a multi-stage build: it builds the app in a slim Node image, then
runs it from Playwright's own official image (`mcr.microsoft.com/playwright:v1.61.1-jammy`) so
Chromium and all its system libraries are already present and version-matched — no manual
`apt install` list to maintain. `next.config.js` sets `output: 'standalone'` so the final image only
ships the files actually needed at runtime.

**Redeploying later**: `git pull && docker compose up -d --build`.

### 5. Nginx reverse proxy + free SSL

Either path runs the app on `localhost:3000`; Nginx sits in front on 80/443 so you get a real domain
and HTTPS instead of `http://ip:3000`.

```bash
sudo nano /etc/nginx/sites-available/tiktok-stats
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/tiktok-stats /etc/nginx/sites-enabled/
sudo nginx -t   # validates the config before touching anything live
sudo systemctl reload nginx

# Free Let's Encrypt certificate, auto-configures the HTTPS server block above and sets up renewal:
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot edits the Nginx config in place to add the `listen 443 ssl` block and redirect HTTP→HTTPS,
and installs a systemd timer that renews the cert automatically before it expires — nothing further
to maintain.

### 6. Open the firewall

OVH Public Cloud instances usually allow all outbound and default-allow inbound on a fresh install
(Ubuntu's own `ufw` is inactive by default), but double-check both layers:

- **OVH's Network Security Groups** (Public Cloud → your instance → Network tab), if you've attached
  one: allow inbound TCP 22 (SSH), 80 (HTTP), 443 (HTTPS).
- **On the instance itself**, if you enable `ufw`: `sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable`.

Do **not** expose port 3000 publicly — only Nginx (80/443) should be reachable from the internet; the
Next.js server itself should only ever be reached via `localhost:3000` through the proxy.

### 7. Point Supabase and Stripe at the new domain

- **Supabase → Authentication → URL Configuration**: set **Site URL** to `https://your-domain.com`,
  and add it under **Redirect URLs** too (alongside `localhost:3000` if you still develop locally).
- **Stripe → Developers → Webhooks**: update (or create) the endpoint URL to
  `https://your-domain.com/api/webhooks/stripe` if you moved from local `stripe listen` testing.

### 8. Verify

Visit `https://your-domain.com` — you should land on the marketing page over HTTPS with a valid
certificate (padlock, no warnings). Sign in with Google, run a real scan, and confirm data actually
saves (check the Supabase table editor for a new row). If the scraper comes back empty, jump to
"Troubleshooting: no videos returned" above — the same causes (missing session cookie, TikTok
rate-limiting) apply on a server exactly as they do locally.

### Ongoing operations

- **Logs**: `pm2 logs tiktok-stats` (Path A) or `docker compose logs -f` (Path B).
- **Backups**: your actual data lives in Supabase, not on this instance — back up there (Supabase
  project settings → Database → Backups), not the OVH instance itself. The instance is stateless and
  disposable; if it dies, spin up a new one and repeat steps 1-7.
- **Scaling**: this app is a single Node process — for more headroom, resize the OVH instance
  (Public Cloud lets you resize with a short reboot) before reaching for multiple instances + a load
  balancer, which would need session/cookie handling considered (not set up by default here).
