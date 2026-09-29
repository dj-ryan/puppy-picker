// Where votes are stored. Pick ONE and save this file.
//
//   "server"   -> the bundled Python server (tools/server.py). Great on your home
//                 network. Does not work on GitHub Pages.
//   "firebase" -> a free Firebase Realtime Database. Works on GitHub Pages, keeps
//                 working for everyone in the group chat, and updates live.
//                 Fill in firebaseUrl below. See README.md.
//   "local"    -> this browser only. No sharing (offline/demo).
window.PUPPY = {
  store: "server",
  firebaseUrl: "", // e.g. "https://puppy-vote-default-rtdb.firebaseio.com"
};
