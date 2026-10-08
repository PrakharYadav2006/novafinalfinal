# Project LIGHTHOUSE

Supplier risk and sourcing decision platform for NovaDrive's CRO. I built this for the NovaDrive case competition, so all the data in it is the fictional case data.

It is a static web app: plain HTML, CSS and JavaScript, no libraries, no server and no build step. The data is bundled in `assets/data.js` and nothing gets sent anywhere.

## Screens

- Overview
- Network Explorer (map, components and zones views)
- Supplier 360
- Risk Intelligence
- External Risk Intelligence (events)
- Alternate Supplier Intelligence
- Scenario Lab
- Evidence Center
- Methodology
- Help

There is also an Ask Lighthouse panel and a welcome tour that shows up on the first visit.

## Running it locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000. Opening `index.html` directly from disk also works in most browsers.

## Deploying on Vercel

No build command and no environment variables are needed. `vercel.json` already has the output directory, security headers and asset caching set up.

**Option A: Vercel CLI**

```
npm i -g vercel
cd novadrive_lighthouse
vercel            # preview, accept the defaults (Framework: Other, no build command)
vercel --prod     # production
```

**Option B: GitHub import**

1. Push this folder to a GitHub repo (the files go at the repo root).
2. On vercel.com, Add New > Project, and import the repo.
3. Framework Preset: Other. Build Command: leave empty. Output Directory: `.` (already set in `vercel.json`).
4. Deploy.

**Option C: drag and drop**

Go to vercel.com/new and drag the unzipped folder in.

GitHub Pages also works if you serve the folder root as it is. Routing uses `#/...` hashes, so no rewrites are needed.

## Folder layout

```
index.html            app shell
assets/data.js        generated data bundle (suppliers, links, events, alternates, evidence, assumptions)
assets/logic.js       risk actions, impact propagation, scenario and sensitivity logic (no DOM)
assets/ui.js          UI kit, router, search, tooltips, cross-filter context
assets/p_*.js         one file per screen; p_ask.js is Ask Lighthouse; boot.js is the start-up
assets/styles.css     design system
build/                Python that regenerates assets/data.js from data/ and source_inputs/
data/, source_inputs/ provenance: scorecard v2 export, tiering workbook, geometry
```

To rebuild the data bundle after editing the sources:

```
python3 build/build_lighthouse_data.py
```

## Things to know before presenting

- Scores are from scorecard v2 (Jade 69.0, IonPeak 65.3, Orion 57.5, Meridian 57.4). Confidence never changes a risk %.
- USD 1.56B is the annual NovaDrive product revenue behind the IonPeak dependency. It is not supplier spend and it is not revenue at risk.
- The alternates are shortlisted candidates only. Every fit rating is company-claimed (taken from public pages) and would still need sourcing and engineering validation. The six-factor ratings for Schweizer are my own, derived from the Phase 2 text (flagged A16). The 16 weeks for Orion/CeramTec is a stand-in from the parent component.
- The India zone map is illustrative. Zones Z01 to Z08 are fictional, and only Z01 "East Delta" is named in the case.
- Scenario Lab outputs are simulations, not actual events. It does not model inventory, recovery or lost revenue.
- Ask Lighthouse is not a live language model. It answers a fixed set of question types from the same data and logic as the rest of the app.
- The action labels refine the scorecard's "next step" (for example, "Search alternate now" is split into SEARCH ALTERNATE, REVIEW, QUALIFY and VERIFY FIRST). The original next step is still visible under "Why this action?".

## Architecture

[![Architecture diagram of prakharyadav2006/novadrive](https://gitdiagram.com/prakharyadav2006/novadrive/diagram.png)](https://gitdiagram.com/prakharyadav2006/novadrive?utm_source=readme&utm_medium=picture)
