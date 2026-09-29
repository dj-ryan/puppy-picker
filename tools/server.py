#!/usr/bin/env python3
"""Puppy voting: serves the static page and stores one ballot (1st + 2nd choice) per first name.

Re-submitting a name edits that person's existing ballot.
"""
import json, os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOTES = os.path.join(ROOT, "votes.json")
PUPPIES = ["nacho", "neeko", "nero", "newman", "norman"]


def load():
    if os.path.exists(VOTES):
        with open(VOTES) as f:
            return json.load(f)
    return {}


def save(votes):
    with open(VOTES, "w") as f:
        json.dump(votes, f, indent=2)


def tally(votes):
    res = {p: {"first": 0, "second": 0, "points": 0} for p in PUPPIES}
    for v in votes.values():
        mult = 5 if str(v.get("name", "")).strip().lower() in ("david", "audrey") else 1
        if v.get("first") in res:
            res[v["first"]]["first"] += 1
            res[v["first"]]["points"] += 2 * mult
        if v.get("second") in res:
            res[v["second"]]["second"] += 1
            res[v["second"]]["points"] += 1 * mult
    return res


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def _json(self, obj, code=200):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/results":
            votes = load()
            return self._json({"votes": len(votes), "results": tally(votes), "ballots": votes})
        return super().do_GET()

    def do_POST(self):
        if self.path != "/vote":
            return self._json({"error": "not found"}, 404)
        n = int(self.headers.get("Content-Length", 0))
        try:
            data = json.loads(self.rfile.read(n) or b"{}")
        except ValueError:
            return self._json({"error": "Bad request."}, 400)

        name = (data.get("name") or "").strip()
        uid = (data.get("uid") or "").strip()
        first, second = data.get("first"), data.get("second")
        if not uid or len(uid) > 128:
            return self._json({"error": "Missing voter id."}, 400)
        if not name or len(name) > 40:
            return self._json({"error": "Enter your first name."}, 400)
        if first not in PUPPIES or second not in PUPPIES:
            return self._json({"error": "Pick a 1st and 2nd choice."}, 400)
        if first == second:
            return self._json({"error": "1st and 2nd choice must be different."}, 400)

        votes = load()
        updated = uid in votes
        votes[uid] = {"name": name, "first": first, "second": second}  # add or edit
        save(votes)
        return self._json({"ok": True, "updated": updated, "votes": len(votes), "results": tally(votes), "ballots": votes})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"Puppy voting on http://0.0.0.0:{port}/  (Ctrl-C to stop)")
    ThreadingHTTPServer(("0.0.0.0", port), Handler).serve_forever()
