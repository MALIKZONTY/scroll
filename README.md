# Connect

An Instagram-style feed of text posts: pickup lines, love, heartbreak, quotes, motivation,
relatable, friendship, space, Earth, time & universe, psychology, mind-blowing facts and animals.

Plain HTML/CSS/JS, no framework, no backend. Likes, seen posts and the last tab live in the
visitor's browser (localStorage).

## Run locally

```bash
npm run dev          # builds public/data/*.json, serves on http://localhost:4321
node scripts/serve.mjs 4777   # serve on another port
```

## Add or edit posts

Posts live in `content/<topic>/*.txt`, one post per line.

- `\n` inside a line is a line break in the post.
- Lines starting with `#` are comments.
- Quotes: put the author on its own line, e.g. `"Quote text."\n\n— Seneca`.

Then run `npm run build` (or `npm run check` to also list near-duplicates). The build:

- drops exact duplicates and near-duplicates (same topic, ~70% word overlap),
- warns about posts over 300 characters,
- gives every post an ID from a hash of its text, so likes and "seen" survive reordering.

Commit the regenerated `public/data/*.json` together with the content.

## How the feed works

- **Order:** shuffled on every load, every pull-to-refresh (mobile), the refresh button, the
  logo, or tapping the active tab again.
- **Seen:** a post counts as seen once its whole card is on screen. Seen posts never come back
  in that browser; when a tab runs out you get "You're all caught up" with a Start over button.
- **For you** mixes all topics and avoids two posts from the same topic in a row.
- **Liked** shows liked posts, newest first. Double-tap a card or tap ❤️.
- **Seen** shows every post you've fully seen, most recent first, so nothing is lost when it
  drops out of the feed. "Start over" in a topic clears that topic's seen history.
- **Download** renders the card to a 1080×1350 PNG (shares to the share sheet on phones).

## Deploy to Cloudflare Pages

1. Push this folder to a GitHub repo.
2. Cloudflare dashboard → Workers & Pages → Create → Pages → connect the repo.
3. Build command: `npm run build` · Build output directory: `public`.
4. You get `https://<project>.pages.dev`. Add a custom domain later under Custom domains.

`public/_headers` sets caching for the data files.

## Ads (Monetag)

- **Site-wide tags** (popunder, in-page push, vignette…): paste the snippets from the Monetag
  dashboard into `public/index.html`, where the `<!-- Monetag -->` comment is in `<head>`.
- **In-feed slots:** set `ads.renderSlot` in `public/config.js` to a function that puts your
  banner/native zone code into the `slot` element. A "Sponsored" card then appears every
  `ads.every` posts (not in the Liked tab). Leave it `null` to show no in-feed slots.
- If Monetag asks for a verification file (e.g. `sw.js`) put it in `public/`.
