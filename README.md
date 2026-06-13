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

The "orbital environment" strip on the homepage reads from `data/spacetrack.json` — counts and the latest advisory mirrored from the **public** [Space-Track.org](https://www.space-track.org) login page (no credentials involved).

- `.github/workflows/spacetrack.yml` refreshes the JSON daily at 06:17 UTC (and on demand via **Actions → Refresh Space-Track scoreboard → Run workflow**).
- `scripts/fetch_spacetrack.py` does the scraping; if Space-Track changes their page layout, the script fails safely and the site keeps showing the last good snapshot (dated by the "updated" stamp on the page).
- One-time setup after pushing: **Settings → Actions → General → Workflow permissions → Read and write permissions**, so the workflow can commit the refreshed JSON.
- Data is attributed and linked on the page. Worth skimming Space-Track's user agreement once to confirm you're comfortable mirroring the public scoreboard/advisory; the script identifies itself and touches one public page once a day.

## Live SSA section

Section II renders three in-browser demonstrations:

- **Live ground tracks** — `data/tles.json` (refreshed daily by the same workflow, from CelesTrak) propagated client-side with SGP4 via a vendored copy of [satellite.js](https://github.com/shashwatak/satellite-js) v5 (`assets/vendor/satellite.min.js`, MIT). The seed file ships with stations/payloads; the first workflow run adds ENVISAT, a Starlink, Fengyun-1C and Cosmos-2251 debris pieces, and an SL-16 rocket body. To change the object set, edit `TARGETS` in `scripts/fetch_tles.py`.
- **Streak-detection demo** — pure canvas simulation, no data dependencies.
- **Population timeline** — approximate historical counts hard-coded in `index.html` (search `POPULATION TIMELINE`); update the 2026 endpoint if the scoreboard moves significantly.
