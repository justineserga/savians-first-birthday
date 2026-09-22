# Savian's First Birthday 🎉

A front-end only, static website celebrating Savian Art A. Serga's 1st birthday — cozy mountain-town cartoon theme, complete with a Flappy-Bird-style mini game and a shared leaderboard.

## Pages

- `index.html` — home page with the party scene, invite details, and a photo strip
- `ninongs.html` — Ninongs & Ninangs (godparents)
- `venues.html` — mass and celebration venue details
- `game.html` — **Birthday Flappy**: pick a Ninong/Ninang, flap Savian through the presents, and climb the leaderboard

## Tech stack

Plain HTML, CSS, and vanilla JavaScript — no build step, no framework, no npm dependencies to install. Works by opening the files directly or serving them from any static host (GitHub Pages, Netlify, etc.).

The **leaderboard** is the one piece that isn't purely local: to show everyone's scores on every device, it stores scores in a small [Firebase Firestore](https://firebase.google.com/docs/firestore) database via the Firebase JS SDK, loaded straight from Google's CDN — no backend code, no build step, still a static site. **The game itself (playing, scoring, local high score) works completely offline even without Firebase set up** — only the shared leaderboard needs it.

## Project structure

```
├── index.html
├── ninongs.html
├── venues.html
├── game.html
├── css/
│   └── style.css            # shared styles (theme, layout, game UI)
├── js/
│   ├── people.js              # shared Ninong/Ninang roster (edit this to update names everywhere)
│   ├── site.js                  # nav/snow/godparent-card behavior shared across pages
│   ├── firebase-config.js         # your Firebase project keys (see setup below)
│   └── flappy.js                    # Birthday Flappy game + leaderboard logic
└── assets/img/                        # photos and game sprites
```

## Running locally

Any static file server works, e.g.:

```bash
npx serve .
# or
php -S localhost:8080
# or
python -m http.server 8080
```

Then open `http://localhost:<port>/index.html`.

## Editing party details

Search each HTML page for `Add ...` placeholders (date, time, venue) and swap in the real details.

To update the Ninong/Ninang names (used on both the Ninongs & Ninangs page and the Birthday Flappy player picker), edit the single list in **`js/people.js`** — every page picks it up automatically.

## Birthday Flappy controls

- **Desktop:** Space or ↑ to flap
- **Mobile:** tap the game canvas or the Flap button

Personal best is saved per-device via `localStorage`. The shared leaderboard (top 10 across everyone) needs the Firebase setup below.

## Setting up the shared leaderboard (Firebase)

Takes about 5 minutes, free, no credit card required.

1. **Create a project** — go to [console.firebase.google.com](https://console.firebase.google.com), click *Add project*, name it anything (e.g. `savians-birthday`), and finish the wizard (Google Analytics is optional — you can skip it).
2. **Create a Firestore database** — in the left sidebar, *Build → Firestore Database → Create database*. Choose a location close to you, and start in **production mode** (we'll paste our own rules next).
3. **Paste the security rules** — in Firestore, open the *Rules* tab and replace the contents with:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /scores/{scoreId} {
         allow read: if true;
         allow create: if request.resource.data.name is string
                       && request.resource.data.name.size() > 0
                       && request.resource.data.name.size() < 60
                       && request.resource.data.score is number
                       && request.resource.data.score >= 0
                       && request.resource.data.score < 100000;
         allow update, delete: if false;
       }
     }
   }
   ```

   This lets anyone read the leaderboard and submit a new score, but nobody can edit or delete existing scores. (It's intentionally simple for a family party game — a determined guest *could* open devtools and submit a fake score, same as most casual leaderboards. Not meant for anything higher-stakes.)
4. **Register a web app** — *Project settings* (gear icon) → scroll to *Your apps* → click the `</>` web icon → give it any nickname → *Register app*. Firebase will show a `firebaseConfig` object.
5. **Paste your config** — copy those values into `js/firebase-config.js` in this repo, replacing the `YOUR_...` placeholders. Commit and push (or redeploy) — the leaderboard will start working immediately, no other code changes needed.

That's it — `js/flappy.js` detects the config automatically and turns the leaderboard on.
