"""Tiny check for the vote scoring. Run: python3 tools/test_tally.py"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from server import tally

votes = {
    "uid-alice": {"name": "alice", "first": "nacho", "second": "neeko"},
    "uid-bob":   {"name": "bob",   "first": "nacho", "second": "nero"},
    "uid-carol": {"name": "carol", "first": "nero",  "second": "nacho"},
}
t = tally(votes)
assert t["nacho"] == {"first": 2, "second": 1, "points": 5}, t["nacho"]
assert t["neeko"] == {"first": 0, "second": 1, "points": 1}, t["neeko"]
assert t["nero"]  == {"first": 1, "second": 1, "points": 3}, t["nero"]
assert t["newman"] == {"first": 0, "second": 0, "points": 0}, t["newman"]
# a ballot naming an unknown puppy must not crash or score
assert tally({"x": {"first": "ghost", "second": "nacho"}})["nacho"]["second"] == 1

# easter egg: david / audrey weigh 5x (points only; raw counts stay honest)
egg = tally({"u1": {"name": "David", "first": "newman", "second": "norman"}})
assert egg["newman"] == {"first": 1, "second": 0, "points": 10}, egg["newman"]
assert egg["norman"] == {"first": 0, "second": 1, "points": 5}, egg["norman"]
assert tally({"u2": {"name": "  AUDREY ", "first": "newman", "second": "norman"}})["newman"]["points"] == 10
assert tally({"u3": {"name": "dave", "first": "newman", "second": "norman"}})["newman"]["points"] == 2
print("tally OK")
