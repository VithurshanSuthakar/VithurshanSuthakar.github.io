# vithurshansuthakar.github.io

Personal academic website of **Vithurshan Suthakar** — PhD candidate in Earth and Space Science, York University. Optical detection and image processing for Space Situational Awareness.

Single static `index.html` with no build step, frameworks, or dependencies. Hosted on GitHub Pages.

## Structure

```
.
├── index.html      # the entire site (HTML + CSS + JS, self-contained)
├── 404.html        # custom not-found page in the same style
├── assets/         # photos (pre-optimized for web)
├── .nojekyll       # tells GitHub Pages to skip Jekyll processing
└── LICENSE
```

## Deploying to GitHub Pages

1. Create a repository named exactly `<your-username>.github.io` (for a user site at the root URL). For this account: `VithurshanSuthakar.github.io`.
2. Push the contents of this folder to the `main` branch:

   ```bash
   cd path/to/this/folder
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin git@github.com:VithurshanSuthakar/VithurshanSuthakar.github.io.git
   git push -u origin main
   ```

3. In the repo: **Settings → Pages → Source: Deploy from a branch → main / (root)**. For `<username>.github.io` repos this is usually enabled automatically.
4. The site goes live at `https://vithurshansuthakar.github.io/` within a minute or two.

## Updating content

Everything lives in `index.html`:

- **Publications** — add a `<li class="pub-item" data-type="journal|conference|review">` block inside `#pub-list`. The filter buttons pick up `data-type` automatically.
- **Experience / Teaching / Awards** — copy an existing `.post`, `.course`, or `.award-item` block.
- **Photos** — drop into `assets/` and reference with a `.figure` block. Resize to ≤1600 px wide and compress before committing (keeps the page fast).

## Notes

- Social-preview (`og:`) and canonical URLs in `<head>` point to `https://vithurshansuthakar.github.io/` — update if you ever attach a custom domain (also add a `CNAME` file containing the domain).
- Interactive touches (orbit animation, scroll reveals, photo lightbox, scrollspy nav) automatically switch off for visitors with reduced-motion enabled.
- The page has a print stylesheet, so **Ctrl/Cmd-P** produces a clean CV-style printout.

## Live Space-Track scoreboard

The "orbital environment" strip reads from `data/spacetrack.json`, refreshed daily from the **Space-Track.org authenticated API** (the `boxscore` class, whose `COUNTRY=ALL` row holds the global totals shown on the public scoreboard).

- Credentials live in two repository secrets, **`SPACETRACK_USER`** and **`SPACETRACK_PASS`** (Settings → Secrets and variables → Actions). The workflow passes them to `scripts/fetch_spacetrack.py` as environment variables; they never appear in the committed files.
- The four published figures map from the API as: `active_payloads = ORBITAL_PAYLOAD_COUNT`, `debris = ORBITAL_DEBRIS_COUNT`, `total = ORBITAL_TOTAL_COUNT`, and `analyst_objects = total − payloads − debris` (matching the public page's "Analyst Objects").
- **Failure is non-fatal by design.** If credentials are missing/rejected or Space-Track is unreachable, the script logs the reason, leaves the existing JSON untouched, and exits 0 — so the workflow stays green and the site keeps showing the last good snapshot. Run with `STRICT=1` locally if you want a hard failure while debugging: `STRICT=1 python scripts/fetch_spacetrack.py`.
- The red advisory banner is only on the public HTML page (not the API), so the API path preserves whatever `alert` is already in the JSON rather than overwriting it. Edit `data/spacetrack.json` by hand to update the banner text.

## Live SSA section

Section II renders three in-browser demonstrations:

- **Live ground tracks** — `data/tles.json` (refreshed daily by the same workflow, from CelesTrak) propagated client-side with SGP4 via a vendored copy of [satellite.js](https://github.com/shashwatak/satellite-js) v5 (`assets/vendor/satellite.min.js`, MIT). The seed file ships with stations/payloads; the first workflow run adds ENVISAT, a Starlink, Fengyun-1C and Cosmos-2251 debris pieces, and an SL-16 rocket body. To change the object set, edit `TARGETS` in `scripts/fetch_tles.py`.
- **Streak-detection demo** — pure canvas simulation, no data dependencies.
- **Population timeline** — approximate historical counts hard-coded in `index.html` (search `POPULATION TIMELINE`); update the 2026 endpoint if the scoreboard moves significantly.
