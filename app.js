// Puppy vote front-end. The storage backend is chosen in config.js.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var results = $('results'), count = $('count'), board = $('board');
  var msg = $('msg'), mode = $('mode'), voter = $('voter'), picksEl = $('picks');
  var PUPPIES = ['nacho', 'neeko', 'nero', 'newman', 'norman'];

  var cfg = window.PUPPY || { store: 'server' };
  var FB = (cfg.store === 'firebase' && cfg.firebaseUrl) ? cfg.firebaseUrl.replace(/\/+$/, '') : '';
  var SERVER = cfg.store === 'server';

  var picks = { first: '', second: '' };
  var ballots = {};
  function key() { return voter.value.trim().toLowerCase(); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  voter.value = localStorage.getItem('voter') || '';

  function computeTally(bs) {
    var t = {};
    PUPPIES.forEach(function (p) { t[p] = { first: 0, second: 0, points: 0 }; });
    Object.values(bs).forEach(function (v) {
      if (t[v.first]) { t[v.first].first++; t[v.first].points += 2; }
      if (t[v.second]) { t[v.second].second++; t[v.second].points += 1; }
    });
    return t;
  }

  async function loadBallots() {
    if (FB) {
      var r = await fetch(FB + '/votes.json');
      return (await r.json()) || {};
    }
    if (SERVER) {
      var s = await fetch('/results');
      if (!s.ok) throw new Error('no server');
      return (await s.json()).ballots || {};
    }
    return JSON.parse(localStorage.getItem('puppy_ballots') || '{}');
  }

  async function saveBallot(name, ballot) {
    if (FB) {
      await fetch(FB + '/votes/' + encodeURIComponent(name) + '.json', { method: 'PUT', body: JSON.stringify(ballot) });
      return;
    }
    if (SERVER) {
      var d = await (await fetch('/vote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name, first: ballot.first, second: ballot.second }) })).json();
      if (!d.ok) throw new Error(d.error);
      return;
    }
    var b = JSON.parse(localStorage.getItem('puppy_ballots') || '{}');
    b[name] = ballot;
    localStorage.setItem('puppy_ballots', JSON.stringify(b));
  }

  function paintPicks() {
    document.querySelectorAll('.pick').forEach(function (b) {
      b.classList.toggle('on', picks[b.dataset.rank] === b.closest('section').dataset.puppy);
    });
    picksEl.innerHTML = '1st: <b>' + (picks.first || '&mdash;') + '</b> &nbsp;&middot;&nbsp; 2nd: <b>' + (picks.second || '&mdash;') + '</b>';
  }

  function render() {
    var t = computeTally(ballots);
    var max = Math.max(1, Object.values(t).map(function (s) { return s.points; }).concat([1]));
    results.innerHTML = Object.entries(t)
      .sort(function (a, b) { return b[1].points - a[1].points; })
      .map(function (e) {
        var p = e[0], s = e[1];
        return '<div class="bar"><span class="pname">' + p + '</span>' +
          '<div class="track"><div class="fill" style="width:' + (s.points / max * 100) + '%"></div></div>' +
          '<span class="pts">' + s.points + ' pts &middot; 1st&times;' + s.first + ' 2nd&times;' + s.second + '</span></div>';
      }).join('');
    var nv = Object.keys(ballots).length;
    count.textContent = nv + ' vote' + (nv === 1 ? '' : 's') + ' cast';

    var rows = Object.entries(ballots).sort(function (a, b) { return a[0].localeCompare(b[0]); });
    board.innerHTML = rows.length
      ? '<table><tr><th>Voter</th><th>1st choice</th><th>2nd choice</th></tr>' + rows.map(function (e) {
          var n = e[0], b = e[1];
          return '<tr class="' + (n === key() ? 'me' : '') + '"><td>' + esc(n) + '</td><td>' + b.first + '</td><td>' + b.second + '</td></tr>';
        }).join('') + '</table>'
      : '<p id="empty">No votes yet &mdash; enter your name and tap 1st / 2nd on a puppy.</p>';
  }

  async function save() {
    var name = key();
    var existed = !!ballots[name];
    try {
      await saveBallot(name, { first: picks.first, second: picks.second });
      localStorage.setItem('voter', voter.value.trim());
      msg.className = 'ok';
      msg.textContent = (existed ? 'Updated vote for ' : 'Saved vote for ') + voter.value.trim() + '.';
      await refresh();
    } catch (e) {
      msg.className = 'err';
      msg.textContent = e.message || 'Could not save.';
    }
  }

  async function pick(puppy, rank) {
    if (!key()) { msg.className = 'err'; msg.textContent = 'Specify your first name first.'; voter.focus(); return; }
    var other = rank === 'first' ? 'second' : 'first';
    picks[rank] = picks[rank] === puppy ? '' : puppy;
    if (picks[other] === puppy) picks[other] = '';
    paintPicks();
    if (!picks.first || !picks.second) { msg.className = ''; msg.textContent = 'Pick a 1st and 2nd choice to save.'; return; }
    await save();
  }

  function prefillFromBallot() {
    var b = ballots[key()];
    if (b) {
      picks = { first: b.first, second: b.second };
      msg.className = '';
      msg.textContent = 'Editing existing vote for ' + voter.value.trim() + '.';
      paintPicks();
    }
  }

  async function refresh() {
    try {
      ballots = await loadBallots();
      var offline = !FB && !SERVER;
      mode.style.display = offline ? 'block' : 'none';
      if (offline) mode.textContent = 'Offline mode: votes are stored in this browser only.';
      render();
    } catch (e) {
      mode.style.display = 'block';
      mode.textContent = 'Could not reach the vote store. Start tools/server.py or set up config.js.';
    }
  }

  document.querySelectorAll('.pick').forEach(function (b) {
    b.addEventListener('click', function () { pick(b.closest('section').dataset.puppy, b.dataset.rank); });
  });
  voter.addEventListener('change', prefillFromBallot);

  paintPicks();
  refresh();
  setInterval(refresh, 3000);

  var photos = [].slice.call(document.querySelectorAll('.strip img')).map(function (img) {
    return { src: img.src, name: img.closest('section').querySelector('h2').textContent };
  });
  var i = 0;
  var lb = document.createElement('dialog');
  lb.id = 'lb';
  lb.innerHTML = '<img><button class="nav prev" aria-label="Previous">&#8249;</button>' +
    '<button class="nav next" aria-label="Next">&#8250;</button><div class="caption"></div>';
  document.body.appendChild(lb);
  var el = lb.querySelector('img');
  var caption = lb.querySelector('.caption');
  function show(n) { i = (n + photos.length) % photos.length; el.src = photos[i].src; caption.textContent = photos[i].name; }
  document.querySelectorAll('.strip img').forEach(function (img) {
    img.addEventListener('click', function () { show(photos.findIndex(function (p) { return p.src === img.src; })); lb.showModal(); });
  });
  lb.querySelector('.prev').addEventListener('click', function (e) { e.stopPropagation(); show(i - 1); });
  lb.querySelector('.next').addEventListener('click', function (e) { e.stopPropagation(); show(i + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target === el) lb.close(); });
  lb.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(i - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(i + 1); }
  });
})();
