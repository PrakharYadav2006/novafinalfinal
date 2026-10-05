# Project LIGHTHOUSE — NovaDrive supplier-risk & sourcing decision platform

A static, no-build web app (plain HTML + CSS + JavaScript, no libraries, no server).
All data is bundled in `assets/data.js`; nothing is sent anywhere.
Case-competition prototype built on the fictional NovaDrive case data.

## Screens
Overview · Network Explorer (map / components / zones) · Supplier 360 · Risk Intelligence ·
External Risk Intelligence (events) · Alternate Supplier Intelligence · Scenario Lab ·
Evidence Center · Methodology · Help · plus the "Ask Lighthouse" panel and a first-visit welcome/tour.

## Run locally
    python3 -m http.server 8000      # then open http://localhost:8000
(Opening `index.html` directly from disk also works in most browsers.)

## Deploy on Vercel
**Option A – Vercel CLI**
    npm i -g vercel
    cd novadrive_lighthouse
    vercel            # preview; accept the defaults (Framework: Other, no build command)
    vercel --prod     # production

**Option B – GitHub import**
1. Push this folder to a GitHub repo (the files in this folder at the repo root).
2. vercel.com → Add New → Project → import the repo.
3. Framework Preset: **Other**. Build Command: empty. Output Directory: `.` (already set in `vercel.json`).
4. Deploy.

**Option C – drag and drop**: vercel.com/new → drag the unzipped folder in.

`vercel.json` already sets output directory, security headers and asset caching. No environment variables are needed.
(GitHub Pages also works: serve the folder root as-is. Routing uses `#/...` hashes, so no rewrites are required.)

## Folder layout
    index.html            app shell
    assets/data.js        generated data bundle (suppliers, links, events, alternates, evidence, assumptions)
    assets/logic.js       risk actions, impact propagation, scenario and sensitivity logic (no DOM)
    assets/ui.js          UI kit, router, search, tooltips, cross-filter context
    assets/p_*.js         one file per screen; p_ask.js = Ask Lighthouse; boot.js = start-up
    assets/styles.css     design system
    build/                Python that regenerates assets/data.js from data/ and source_inputs/
    data/, source_inputs/ provenance: scorecard v2 export, tiering workbook, geometry

Rebuild the data bundle after editing sources:  `python3 build/build_lighthouse_data.py`

## Things to know (read before presenting)
- Scores are scorecard **v2** (Jade 69.0, IonPeak 65.3, Orion 57.5, Meridian 57.4). Confidence never changes a risk %.
- **USD 1.56B** is annual NovaDrive *product revenue* behind the IonPeak dependency, not supplier spend or revenue at risk.
- Alternates are **shortlisted candidates** and need sourcing and engineering validation. The original Phase 2 ratings are company-claimed; the later PDF-listed names and fitment notes are user-provided leads, not independently verified assessments.
  Schweizer's six-factor ratings are Lighthouse-derived from Phase 2 prose (flagged A16). Orion/CeramTec's 16 weeks is a parent-component stand-in.
- The India zone map is **illustrative** (zones Z01–Z08 are fictional; only Z01 "East Delta" is named in the case).
- Scenario Lab outputs are **simulations**, not actual events. They do not model inventory, recovery or lost revenue.
- Ask Lighthouse is **not a live language model**: it answers a fixed set of question types from the same data and logic.
- Action labels refine the scorecard's "next step" (e.g. "Search alternate now" splits into SEARCH ALTERNATE / REVIEW / QUALIFY / VERIFY FIRST); the original next step stays visible under "Why this action?".
"# novafinalfinal" 
