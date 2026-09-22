# Savian's First Birthday 🎉

A front-end only, static website celebrating Savian Art A. Serga's 1st birthday — cozy mountain-town cartoon theme, complete with a mini game.

## Pages

- `index.html` — home page with the party scene, invite details, and a photo strip
- `ninongs.html` — Ninongs & Ninangs (godparents)
- `venues.html` — mass and celebration venue details
- `game.html` — **Savian's Big Run**, a Chrome-dino-style endless runner starring Savian

## Tech stack

Plain HTML, CSS, and vanilla JavaScript — no build step, no framework, no dependencies. Works by opening the files directly or serving them from any static host (GitHub Pages, Netlify, etc.).

## Project structure

```
├── index.html
├── ninongs.html
├── venues.html
├── game.html
├── css/
│   └── style.css       # shared styles (theme, layout, game UI)
├── js/
│   ├── site.js          # nav/snow/card behavior shared across pages
│   └── game.js           # Savian's Big Run mini game (canvas)
└── assets/img/            # photos and game sprites
```

## Running locally

Any static file server works, e.g.:

```bash
npx serve .
# or
python -m http.server 8080
```

Then open `http://localhost:<port>/index.html`.

## Editing party details

Search each HTML page for `Add ...` placeholders (date, time, venue, godparent names) and swap in the real details — everything else (theme, layout, game) is ready to go.

## Mini game controls

- **Desktop:** Space or ↑ to jump
- **Mobile:** tap the game canvas or the Jump button

High score is saved in the browser via `localStorage`.
