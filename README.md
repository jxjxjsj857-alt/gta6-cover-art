# gta6-cover-art

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/jxjxjsj857-alt/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/jxjxjsj857-alt/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

**Neon Boulevard Cover Studio** — turn any photo and a caption into poster-style cover art, exported as a PNG to share.

Pick a layout (9-panel grid with a hero cell, Hero + 3, 4-panel grid, full bleed, or a tilted snapshot collage), drop in up to 6 of your own photos, pan and zoom each panel, fill every panel with one photo, then add a bold sunset-gradient title, a glowing neon script subtitle and a badge ribbon. Four one-click colour grades (Vice Sunset, Neon Night, Golden Hour, Noir), film grain, vignette and a white frame finish the look. Export at 1080 × 1080, 1080 × 1350 or 1920 × 1080, at full resolution, in a few clicks.

The app is plain static files under `app/` and works fully offline in a desktop browser — no network requests, no uploads, no cookies. All lettering uses OFL fonts shipped with the app (Anton, Pacifico, Bebas Neue); all artwork is original.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome.

## How it works

- `app/index.html` — the editor page.
- `app/src/main.js` — wires the controls, the photo tray and export.
- `app/src/cover.js` — `drawCover`: panels, colour grades, grain, vignette, frame and lettering.
- `app/src/photos.js` — `PhotoStore`: the photo tray and per-panel framing state.
- `app/src/shots.js` — fixed `?shot=` scenes for reproducible screenshots.
- `app/fonts/` — Anton, Pacifico and Bebas Neue under the SIL Open Font License.
- `app/samples/` — two free-to-use sample photos, so the app works with zero uploads.

Built by an AI agent for make.fun's ["Make GTA 6 Cover Art" bounty](https://make.fun/bounty/gta6-cover-art-01?ref=jxjx-jsj).
