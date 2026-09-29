# Puppy Vote

A small photo gallery + ranked vote (pick a **1st** and **2nd** favorite) built for
sharing in a family group chat. Voting is live: results and the "who voted for who"
leaderboard update within a few seconds on every device.

Photos live in `images/<puppy>/`. Each puppy gets a header with **1st** / **2nd** buttons.

## Files

```
index.html      the page (generated - do not hand-edit)
app.js          voting + lightbox logic
config.js       <-- choose where votes are stored (edit this one)
images/         one folder per puppy
tools/server.py tiny Python server (vote store + static hosting)
tools/build.py  regenerates index.html from images/
votes.json      created by the server at runtime
```

## Option A - run it yourself (home network)

```bash
python3 tools/server.py            # serves on :8000
```

Open `http://localhost:8000/`, or on your phone `http://<your-lan-ip>:8000/`
(find it with `ipconfig getifaddr en0`). Keep `config.js` as `store: "server"`.

## Option B - publish to GitHub Pages (share a link in the group chat)

GitHub Pages only serves static files, so it can host the photos and page but **cannot
store votes**. To keep voting working you need a shared store: use the free Firebase
Realtime Database (below). The page then runs entirely in the browser.

### 1. Firebase (free, ~3 minutes)

1. Go to <https://console.firebase.google.com/> and create a project.
2. Build > **Realtime Database** > Create database > start in **test mode**.
3. Copy the database URL, e.g. `https://puppy-vote-default-rtdb.firebaseio.com`.
4. **Authentication > Sign-in method > enable `Anonymous`** — this gives every
   visitor a stable id with no login screen, so one device = one vote.
5. Copy your **Web API Key**: Project settings (gear) > General > Web API Key.

### 2. Point the page at it

Edit `config.js`:

```js
window.PUPPY = {
  store: "firebase",
  firebaseUrl: "https://puppy-vote-default-rtdb.firebaseio.com",
  apiKey: "AIza...your-web-api-key",
};
```

Votes are stored as `votes/<anonymous-uid> = { name, first, second }`, keyed by the
anonymous id (one per device) with the typed name kept for the leaderboard. Without
an `apiKey` the page falls back to a locally generated device id, so it still works.

```bash
git init
git add -A
git commit -m "Puppy vote"
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

Then on GitHub: **Settings > Pages > Source: Deploy from a branch > `main` / `root`**.
Your link will be `https://<you>.github.io/<repo>/`. Paste that in the group chat.

## Changing the photos

Add/remove files under `images/<puppy>/`, then:

```bash
python3 tools/build.py     # rewrites index.html
```

To reset the votes (server mode), delete `votes.json`. For Firebase, clear the `votes`
node in the Realtime Database console.
