/* SAT Math: progress and settings (kept in this browser's localStorage), mastery, and choosing what to practice next. */
(function (G) {
  "use strict";
  var S = G.SATM, KEY = "satm.data", SKEY = "satm.settings";

  function read(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function blank() { return { v: 1, skills: {}, hist: [], mistakes: [], days: {}, modules: [], lessons: {}, module: null, lastModule: null }; }
  function normalize(d) {
    var b = blank();
    if (!d || typeof d !== "object" || d.v !== 1) return b;
    Object.keys(b).forEach(function (k) { if (d[k] === undefined) d[k] = b[k]; });
    return d;
  }
  var data = normalize(read(KEY)), settings = read(SKEY) || {};
  function today() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  var Store = S.Store = {
    today: today,
    data: function () { return data; },
    save: function () { return write(KEY, data); },
    settings: function () { return settings; },
    setSettings: function (patch) { Object.keys(patch).forEach(function (k) { if (patch[k] === undefined) delete settings[k]; else settings[k] = patch[k]; }); write(SKEY, settings); },
    reset: function () { data = blank(); write(KEY, data); },
    exportJSON: function () { return JSON.stringify({ app: "sat-math", exported: new Date().toISOString(), data: data }); },
    importJSON: function (text) {
      var o = JSON.parse(text);
      if (!o || o.app !== "sat-math" || !o.data || o.data.v !== 1) throw new Error("That file isn't a SAT Math backup.");
      data = normalize(o.data); write(KEY, data);
    }
  };

  // ---------------------------------------------------------------- results
  Store.skill = function (id) { return data.skills[id] || { n: 0, c: 0, lvl: 1, recent: [], last: 0 }; };
  Store.record = function (q, ok, ms, mode) {
    var sk = data.skills[q.skill] || (data.skills[q.skill] = { n: 0, c: 0, lvl: 1, recent: [], last: 0 });
    sk.n++; if (ok) sk.c++;
    sk.recent.push(ok ? 1 : 0); if (sk.recent.length > 12) sk.recent.shift();
    sk.last = Date.now();
    if (mode !== "module") sk.lvl = Math.max(1, Math.min(3, sk.lvl + (ok ? 0.5 : -0.5)));
    data.hist.push({ t: Date.now(), id: q.id, ok: ok ? 1 : 0, ms: Math.round(ms || 0), m: mode });
    if (data.hist.length > 600) data.hist.splice(0, data.hist.length - 600);
    var d = today(); data.days[d] = (data.days[d] || 0) + 1;
    data.mistakes = data.mistakes.filter(function (x) { return x.id !== q.id; });
    if (!ok) data.mistakes.unshift({ id: q.id, t: Date.now() });
    if (data.mistakes.length > 150) data.mistakes.length = 150;
    Store.save();
  };
  // 0-100: recent accuracy (smoothed), scaled by how hard the questions have been.
  Store.mastery = function (id) {
    var sk = data.skills[id];
    if (!sk || !sk.n) return 0;
    var r = sk.recent, acc = (r.reduce(function (a, b) { return a + b; }, 0) + 1) / (r.length + 2);
    return Math.round(100 * acc * (0.6 + 0.2 * (sk.lvl - 1)));
  };
  Store.masteryLabel = function (v, n) { return !n ? "Not started" : v < 40 ? "Getting started" : v < 65 ? "Practicing" : v < 85 ? "Strong" : "Mastered"; };
  Store.totals = function () {
    var n = 0, c = 0;
    Object.keys(data.skills).forEach(function (k) { n += data.skills[k].n; c += data.skills[k].c; });
    return { n: n, c: c, acc: n ? Math.round(100 * c / n) : 0 };
  };
  Store.streak = function () {
    var d = new Date(), count = 0;
    var key = function (x) { return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
    if (!data.days[key(d)]) d.setDate(d.getDate() - 1);
    while (data.days[key(d)]) { count++; d.setDate(d.getDate() - 1); }
    return count;
  };

  // ---------------------------------------------------------------- what to practice
  function allSkills() { return S.domains.reduce(function (a, d) { return a.concat(d.skills); }, []); }
  function tplsFor(skill) { return S.tplOrder.filter(function (id) { return S.templates[id].skill === skill; }); }
  Store.questionFor = function (skill, avoidTpls, level) {
    var lvl = level || Math.round(Store.skill(skill).lvl);
    var all = tplsFor(skill), fit = all.filter(function (id) { return S.templates[id].levels.indexOf(lvl) >= 0; });
    var pool = fit.length ? fit : all, fresh = pool.filter(function (id) { return (avoidTpls || []).indexOf(id) < 0; });
    if (fresh.length) pool = fresh;
    var id = pool[Math.floor(Math.random() * pool.length)];
    return S.make(id, lvl, S.newSeed());
  };
  Store.questionFromTemplates = function (tpls, avoid) {
    var fresh = tpls.filter(function (id) { return (avoid || []).indexOf(id) < 0; }), pool = fresh.length ? fresh : tpls;
    var id = pool[Math.floor(Math.random() * pool.length)], t = S.templates[id];
    return S.make(id, Math.round(Store.skill(t.skill).lvl), S.newSeed());
  };
  // Weaker skills come up more often; Algebra and Advanced Math count most, as on the test.
  Store.pickSkill = function (not) {
    var opts = [];
    S.domains.forEach(function (d) {
      d.skills.forEach(function (s) { if (s !== not) opts.push({ s: s, w: d.weight / d.skills.length * (1.6 - Store.mastery(s) / 100) }); });
    });
    var tot = opts.reduce(function (a, o) { return a + o.w; }, 0), r = Math.random() * tot;
    for (var i = 0; i < opts.length; i++) { r -= opts[i].w; if (r <= 0) return opts[i].s; }
    return opts[opts.length - 1].s;
  };
  Store.weakest = function () {
    var best = null;
    allSkills().forEach(function (s) {
      var sk = Store.skill(s), score = sk.n < 3 ? 45 + sk.n : Store.mastery(s);
      var d = S.domainById(S.domainOf(s)), adj = score - d.weight * 10;
      if (!best || adj < best.adj) best = { s: s, adj: adj };
    });
    return best.s;
  };
  Store.nextLesson = function () {
    var l = S.playbook.filter(function (x) { return !data.lessons[x.id]; })[0];
    return l || S.playbook[0];
  };
  // A module like the real one: 22 questions, about 35% Algebra, 35% Advanced Math, 15% each for the others, easier first.
  Store.newModule = function () {
    var counts = { alg: 8, adv: 8, psda: 3, geo: 3 }, slots = [];
    S.domains.forEach(function (d) { var sk = shuffle(d.skills); for (var i = 0; i < counts[d.id]; i++) slots.push(sk[i % sk.length]); });
    slots = shuffle(slots);
    var used = [];
    var ids = slots.map(function (skill, i) {
      var lvl = i < 7 ? 1 : i < 16 ? 2 : 3, q = Store.questionFor(skill, used, lvl);
      used.push(q.tpl);
      return q.id;
    });
    data.module = { ids: ids, answers: ids.map(function () { return null; }), marks: ids.map(function () { return false; }), started: Date.now(), limit: 35 * 60, cur: 0 };
    Store.save();
    return data.module;
  };
  Store.finishModule = function () {
    var md = data.module;
    if (!md) return null;
    var res = { t: Date.now(), ids: md.ids, answers: md.answers, ok: [], secs: Math.min(md.limit, Math.round((Date.now() - md.started) / 1000)), byDomain: {} };
    md.ids.forEach(function (id, i) {
      var q = S.fromId(id), a = md.answers[i], ok = false;
      if (a != null) ok = q.type === "mc" ? a === q.answer : S.checkEntry(a, q.answer, q.alts).ok;
      res.ok.push(ok ? 1 : 0);
      var dm = S.domainOf(q.skill); res.byDomain[dm] = res.byDomain[dm] || [0, 0]; res.byDomain[dm][1]++; if (ok) res.byDomain[dm][0]++;
      Store.record(q, ok, 0, "module");
    });
    res.score = res.ok.reduce(function (a, b) { return a + b; }, 0);
    data.modules.unshift({ t: res.t, score: res.score, total: md.ids.length, secs: res.secs, byDomain: res.byDomain });
    if (data.modules.length > 30) data.modules.length = 30;
    data.lastModule = res; data.module = null;
    Store.save();
    return res;
  };
})(typeof window !== "undefined" ? window : globalThis);
