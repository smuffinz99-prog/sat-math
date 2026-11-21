/* SAT Math: shared helpers. Seeded random numbers, exact fractions, math formatting,
   multiple-choice assembly and the Bluebook rules for typed-in answers.
   Plain script so it runs in the browser and in Node (tests/verify.js). */
(function (G) {
  "use strict";
  var S = G.SATM = G.SATM || {};

  // ---------------------------------------------------------------- seeded random numbers (mulberry32)
  function rng(seed) {
    var a = (seed >>> 0) || 1;
    function next() {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    var R = {
      float: next,
      int: function (lo, hi) { return lo + Math.floor(next() * (hi - lo + 1)); },
      nz: function (lo, hi) { for (var i = 0; i < 1000; i++) { var v = R.int(lo, hi); if (v !== 0) return v; } throw new Error("nz: empty range"); },
      pick: function (arr) { return arr[Math.floor(next() * arr.length)]; },
      shuffle: function (arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(next() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
        return a;
      },
      sample: function (arr, k) { return R.shuffle(arr).slice(0, k); },
      chance: function (p) { return next() < p; },
      sign: function () { return next() < 0.5 ? -1 : 1; },
      step: function (lo, hi, st) { return lo + st * R.int(0, Math.floor((hi - lo) / st)); }
    };
    return R;
  }
  S.rng = rng;
  S.newSeed = function () { return (Math.floor(Math.random() * 4294967295) >>> 0) || 7; };

  // ---------------------------------------------------------------- exact fractions
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  S.gcd = gcd;
  function Fr(n, d) {
    if (n && typeof n === "object") return n;
    if (d === undefined) d = 1;
    if (!Number.isInteger(n) || !Number.isInteger(d)) return Fr.div(Fr.of(n), Fr.of(d));
    if (d === 0) throw new Error("Fraction with a zero denominator");
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d) || 1;
    n = n / g; d = d / g;
    if (Math.abs(n) > Number.MAX_SAFE_INTEGER || d > Number.MAX_SAFE_INTEGER) throw new Error("Fraction overflow");
    return { n: n, d: d, f: true };
  }
  // Numbers (or decimal strings) to exact fractions. Floats with long binary tails are refused on purpose.
  Fr.of = function (x) {
    if (x && typeof x === "object") return x;
    if (typeof x === "number") {
      if (Number.isInteger(x)) return Fr(x, 1);
      if (!isFinite(x)) throw new Error("Not a finite number");
      x = String(x);
    }
    var s = String(x).trim();
    if (/e/i.test(s)) throw new Error("Can't convert " + s + " exactly");
    var neg = s[0] === "-";
    if (neg || s[0] === "+") s = s.slice(1);
    if (!/^(\d+\.?\d*|\.\d+)$/.test(s)) throw new Error("Not a decimal: " + x);
    var parts = s.split("."), dec = parts[1] || "";
    if (dec.length > 9) throw new Error("Too many decimals to convert exactly: " + x);
    var den = Math.pow(10, dec.length);
    var num = parseInt(parts[0] || "0", 10) * den + (dec ? parseInt(dec, 10) : 0);
    return Fr(neg ? -num : num, den);
  };
  Fr.add = function (a, b) { a = Fr.of(a); b = Fr.of(b); return Fr(a.n * b.d + b.n * a.d, a.d * b.d); };
  Fr.sub = function (a, b) { a = Fr.of(a); b = Fr.of(b); return Fr(a.n * b.d - b.n * a.d, a.d * b.d); };
  Fr.mul = function (a, b) { a = Fr.of(a); b = Fr.of(b); return Fr(a.n * b.n, a.d * b.d); };
  Fr.div = function (a, b) { a = Fr.of(a); b = Fr.of(b); if (b.n === 0) throw new Error("Division by zero"); return Fr(a.n * b.d, a.d * b.n); };
  Fr.neg = function (a) { a = Fr.of(a); return Fr(-a.n, a.d); };
  Fr.abs = function (a) { a = Fr.of(a); return Fr(Math.abs(a.n), a.d); };
  Fr.eq = function (a, b) { a = Fr.of(a); b = Fr.of(b); return a.n === b.n && a.d === b.d; };
  Fr.cmp = function (a, b) { var d = Fr.sub(a, b); return d.n === 0 ? 0 : d.n < 0 ? -1 : 1; };
  Fr.val = function (a) { if (typeof a === "number") return a; a = Fr.of(a); return a.n / a.d; };
  Fr.isInt = function (a) { return Fr.of(a).d === 1; };
  Fr.sum = function (list) { return list.reduce(function (s, x) { return Fr.add(s, x); }, Fr(0)); };
  Fr.pow = function (a, k) { var r = Fr(1); for (var i = 0; i < k; i++) r = Fr.mul(r, a); return r; };
  // Does it end as a decimal (denominator only has factors 2 and 5)? Returns the number of places or -1.
  Fr.places = function (a) {
    a = Fr.of(a); var d = a.d, p2 = 0, p5 = 0;
    while (d % 2 === 0) { d /= 2; p2++; }
    while (d % 5 === 0) { d /= 5; p5++; }
    return d === 1 ? Math.max(p2, p5) : -1;
  };
  Fr.floor = function (a) { a = Fr.of(a); return Math.floor(a.n / a.d); };
  Fr.ceil = function (a) { a = Fr.of(a); return Math.ceil(a.n / a.d); };
  S.Fr = Fr;

  // ---------------------------------------------------------------- number formatting
  function commas(intStr) { return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  // Exact decimal text for a terminating fraction ("12.5", "-0.75"); null if it doesn't terminate.
  function decStr(a) {
    a = Fr.of(a);
    var p = Fr.places(a);
    if (p < 0) return null;
    var neg = a.n < 0, n = Math.abs(a.n), scale = Math.pow(10, p);
    var whole = Math.round(n * scale / a.d);
    var s = String(whole);
    if (p > 0) { while (s.length <= p) s = "0" + s; s = s.slice(0, s.length - p) + "." + s.slice(s.length - p); }
    return (neg ? "-" : "") + s;
  }
  S.decStr = decStr;
  // Plain-text number: commas for thousands, decimals when it terminates, otherwise n/d.
  function num(x) {
    var a = Fr.of(x), s = decStr(a);
    if (s === null) return (a.n < 0 ? "-" : "") + Math.abs(a.n) + "/" + a.d;
    var neg = s[0] === "-"; if (neg) s = s.slice(1);
    var parts = s.split(".");
    return (neg ? "−" : "") + commas(parts[0]) + (parts[1] ? "." + parts[1] : "");
  }
  // LaTeX number: integers and fractions (\frac), thousands written 1{,}500.
  function tex(x) {
    var a = Fr.of(x);
    if (a.d === 1) return (a.n < 0 ? "-" : "") + commas(String(Math.abs(a.n))).replace(/,/g, "{,}");
    return (a.n < 0 ? "-" : "") + "\\frac{" + Math.abs(a.n) + "}{" + a.d + "}";
  }
  // LaTeX number that prefers a decimal when it terminates (money, measurements).
  function texd(x) {
    var a = Fr.of(x), s = decStr(a);
    if (s === null || a.d === 1) return tex(a);
    var neg = s[0] === "-"; if (neg) s = s.slice(1);
    var parts = s.split(".");
    return (neg ? "-" : "") + commas(parts[0]).replace(/,/g, "{,}") + "." + parts[1];
  }
  function money(x) {
    var a = Fr.of(x), s = decStr(a);
    if (s === null) throw new Error("Money that doesn't terminate");
    var neg = s[0] === "-"; if (neg) s = s.slice(1);
    var parts = s.split(".");
    var cents = parts[1] ? (parts[1] + "0").slice(0, 2) : "";
    if (parts[1] && parts[1].length > 2) throw new Error("Money with fractions of a cent");
    return (neg ? "−" : "") + "$" + commas(parts[0]) + (cents ? "." + cents : "");
  }
  S.fmt = { num: num, tex: tex, texd: texd, money: money, commas: commas };

  // ---------------------------------------------------------------- algebra formatting (LaTeX)
  // One term: c·v. "first" leaves off a leading plus. c may be a number, fraction or a raw string.
  function term(c, v, first, decimal) {
    if (typeof c === "string") return (first ? "" : " + ") + c + (v || "");
    c = Fr.of(c);
    if (c.n === 0) return "";
    var neg = c.n < 0, abs = Fr(Math.abs(c.n), c.d);
    var body = v ? ((abs.n === 1 && abs.d === 1) ? v : (decimal ? texd(abs) : tex(abs)) + v) : (decimal ? texd(abs) : tex(abs));
    if (first) return (neg ? "-" : "") + body;
    return (neg ? " - " : " + ") + body;
  }
  // A sum of [coefficient, variable] pairs, e.g. expr([[3,"x"],[-5,""]]) = "3x - 5".
  function expr(terms, decimal) {
    var out = "", first = true;
    terms.forEach(function (t) { var s = term(t[0], t[1], first, decimal); if (s) { out += s; first = false; } });
    return out || "0";
  }
  function lin(a, b, v, decimal) { return expr([[a, v || "x"], [b, ""]], decimal); }
  // Polynomial from coefficients, highest power first.
  function poly(coefs, v, decimal) {
    v = v || "x";
    var n = coefs.length - 1;
    return expr(coefs.map(function (c, i) { var p = n - i; return [c, p === 0 ? "" : p === 1 ? v : v + "^{" + p + "}"]; }), decimal);
  }
  // "x + 3" / "x - 3" inside parentheses-friendly form.
  function shift(v, k) { return expr([[1, v], [k, ""]]); }
  S.alg = { term: term, expr: expr, lin: lin, poly: poly, shift: shift };

  S.m = function (latex) { return "\\(" + latex + "\\)"; };       // inline math
  S.dm = function (latex) { return "\\[" + latex + "\\]"; };      // display math
  S.M = String.raw;                                              // write LaTeX without doubling backslashes

  // Polynomial arithmetic on coefficient arrays (highest power first), exact.
  function pAdd(p, q) {
    var n = Math.max(p.length, q.length), out = [];
    for (var i = 0; i < n; i++) {
      var a = i - (n - p.length) >= 0 ? p[i - (n - p.length)] : 0;
      var b = i - (n - q.length) >= 0 ? q[i - (n - q.length)] : 0;
      out.push(Fr.add(a, b));
    }
    return trim(out);
  }
  function pMul(p, q) {
    var out = [];
    for (var i = 0; i < p.length + q.length - 1; i++) out.push(Fr(0));
    for (var a = 0; a < p.length; a++) for (var b = 0; b < q.length; b++) out[a + b] = Fr.add(out[a + b], Fr.mul(p[a], q[b]));
    return trim(out);
  }
  function pScale(p, k) { return p.map(function (c) { return Fr.mul(c, k); }); }
  function trim(p) { var i = 0; while (i < p.length - 1 && Fr.of(p[i]).n === 0) i++; return p.slice(i).map(Fr.of); }
  function pEq(p, q) { p = trim(p); q = trim(q); if (p.length !== q.length) return false; for (var i = 0; i < p.length; i++) if (!Fr.eq(p[i], q[i])) return false; return true; }
  function pEval(p, x) { var r = Fr(0); p.forEach(function (c) { r = Fr.add(Fr.mul(r, x), c); }); return r; }
  S.P = { add: pAdd, mul: pMul, scale: pScale, eq: pEq, eval: pEval, trim: trim };

  // ---------------------------------------------------------------- multiple choice helpers
  // Pick distinct numeric distractors. cands: [{v: Fr|number, why}]; returns n of them, never equal to the answer.
  S.distinct = function (answer, cands, n, R, fallback) {
    var out = [], seen = [Fr.of(answer)];
    function has(v) { return seen.some(function (s) { return Fr.eq(s, v); }); }
    cands.forEach(function (c) {
      if (out.length >= n || c == null || c.v == null) return;
      var v = Fr.of(c.v);
      if (has(v)) return;
      seen.push(v); out.push({ v: v, why: c.why || "" });
    });
    var k = 1, tries = 0;
    while (out.length < n && tries++ < 200) {
      var v = fallback ? fallback(k, R) : Fr.add(answer, (k % 2 ? 1 : -1) * Math.ceil(k / 2));
      k++;
      if (v == null) continue;
      v = Fr.of(v);
      if (!has(v)) { seen.push(v); out.push({ v: v, why: "" }); }
    }
    if (out.length < n) throw new Error("Couldn't find enough distinct choices");
    return out;
  };

  // ---------------------------------------------------------------- typed-in answers (Bluebook rules)
  // Up to 5 characters for a positive answer, 6 for a negative one. Fractions and exact decimals count;
  // a decimal that doesn't end must fill every space, rounded or cut off. No mixed numbers, commas or symbols.
  function parseEntry(s) {
    s = String(s == null ? "" : s).trim().replace(/−/g, "-");
    if (!s) return null;
    var neg = s[0] === "-", body = neg ? s.slice(1) : s;
    if (/^\d+\/\d+$/.test(body)) {
      var p = body.split("/"), d = parseInt(p[1], 10);
      if (d === 0) return null;
      return { kind: "frac", value: Fr((neg ? -1 : 1) * parseInt(p[0], 10), d), len: body.length, places: 0 };
    }
    if (/^(\d+\.?\d*|\.\d+)$/.test(body)) {
      var places = body.indexOf(".") >= 0 ? body.length - body.indexOf(".") - 1 : 0;
      return { kind: places ? "dec" : "int", value: Fr.of((neg ? "-" : "") + body), len: body.length, places: places };
    }
    return null;
  }
  function entryOk(e, target) {
    target = Fr.of(target);
    if (Fr.eq(e.value, target)) return true;
    if (e.kind !== "dec" || e.len < 5) return false;
    if ((e.value.n < 0) !== (target.n < 0)) return false;
    var scale = Math.pow(10, e.places);
    var exact = Fr.mul(Fr.abs(target), scale);
    var entered = Math.round(Math.abs(Fr.val(e.value)) * scale);
    var trunc = Fr.floor(exact), round = Fr.floor(Fr.add(exact, Fr(1, 2)));
    return entered === trunc || entered === round;
  }
  S.parseEntry = parseEntry;
  S.checkEntry = function (s, answer, alts) {
    var e = parseEntry(s);
    if (!e) return { ok: false, invalid: true };
    var targets = [answer].concat(alts || []);
    for (var i = 0; i < targets.length; i++) if (entryOk(e, targets[i])) return { ok: true };
    return { ok: false };
  };
  // Can the answer be typed cleanly in the answer box (fraction or exact decimal that fits)?
  S.fitsGrid = function (a) {
    a = Fr.of(a);
    var limit = a.n < 0 ? 6 : 5;
    var fr = (a.n < 0 ? "-" : "") + Math.abs(a.n) + (a.d === 1 ? "" : "/" + a.d);
    if (fr.length <= limit) return true;
    var d = decStr(a);
    if (d !== null) { d = d.replace(/^(-?)0\./, "$1."); return d.length <= limit; }
    return false;
  };
  // The ways a student could correctly type this answer, for feedback ("7/4, 1.75").
  S.answerForms = function (a) {
    a = Fr.of(a);
    var out = [], neg = a.n < 0, sign = neg ? "-" : "", limit = 5;
    var fr = sign + Math.abs(a.n) + "/" + a.d;
    if (a.d === 1) out.push(sign + Math.abs(a.n));
    else if (fr.length <= limit + (neg ? 1 : 0)) out.push(fr);
    var d = decStr(a);
    if (d !== null) {
      if (a.d !== 1) {
        var short = d.replace(/^(-?)0\./, "$1.");
        if (d.replace("-", "").length <= limit) out.push(d);
        else if (short.replace("-", "").length <= limit) out.push(short);
      }
    } else {
      var abs = Fr.abs(a), whole = Fr.floor(abs), wholeDigits = String(whole).length;
      var forms = [];
      if (whole === 0) { forms.push([4, true]); forms.push([3, false]); }
      else if (wholeDigits <= 3) forms.push([limit - wholeDigits - 1, false]);
      forms.forEach(function (f) {
        var places = f[0], scale = Math.pow(10, places), ex = Fr.mul(abs, scale);
        [Fr.floor(ex), Fr.floor(Fr.add(ex, Fr(1, 2)))].forEach(function (v) {
          var s = String(v);
          while (s.length <= places) s = "0" + s;
          s = s.slice(0, s.length - places) + "." + s.slice(s.length - places);
          if (f[1]) s = s.replace(/^0\./, ".");
          s = sign + s;
          if (out.indexOf(s) < 0) out.push(s);
        });
      });
    }
    return out;
  };

  // ---------------------------------------------------------------- Desmos viewing window around key points
  S.bounds = function (pts, opts) {
    opts = opts || {};
    var xs = pts.map(function (p) { return Fr.val(p[0]); }), ys = pts.map(function (p) { return Fr.val(p[1]); });
    if (opts.origin !== false) { xs.push(0); ys.push(0); }
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    var w = Math.max(x1 - x0, opts.minW || 6), h = Math.max(y1 - y0, opts.minH || 6);
    var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    var pad = opts.pad || 0.3;
    return { left: cx - w * (0.5 + pad), right: cx + w * (0.5 + pad), bottom: cy - h * (0.5 + pad), top: cy + h * (0.5 + pad) };
  };

  // ---------------------------------------------------------------- question templates
  S.templates = S.templates || {};
  S.tplOrder = S.tplOrder || [];
  S.addTemplate = function (t) {
    if (S.templates[t.id]) throw new Error("Duplicate template " + t.id);
    t.levels = t.levels || [1, 2, 3];
    S.templates[t.id] = t;
    S.tplOrder.push(t.id);
  };
  var LETTERS = ["A", "B", "C", "D"];
  S.LETTERS = LETTERS;

  // Build one question from a template, level and seed. The same three always give the same question.
  S.make = function (tplId, level, seed) {
    var t = S.templates[tplId];
    if (!t) throw new Error("Unknown template " + tplId);
    var lv = t.levels.indexOf(level) >= 0 ? level : t.levels.reduce(function (best, l) { return Math.abs(l - level) < Math.abs(best - level) ? l : best; }, t.levels[0]);
    var R = rng(seed);
    var q = t.gen(R, lv);
    q.tpl = tplId; q.skill = t.skill; q.level = lv; q.seed = seed >>> 0;
    q.id = tplId + ":" + lv + ":" + q.seed;
    q.explain = q.explain || [];
    q.desmos = q.desmos || null;
    if (q.type === "mc") {
      var ch = q.choices;
      if (!ch || ch.length !== 4) throw new Error(tplId + ": needs 4 choices");
      var order = q.order || (ch.every(function (c) { return c.v != null; }) ? "value" : "shuffle");
      if (order === "value") ch = ch.slice().sort(function (a, b) { return Fr.cmp(a.v, b.v); });
      else if (order === "shuffle") ch = R.shuffle(ch);
      q.choices = ch;
      q.answer = ch.findIndex(function (c) { return c.ok; });
      if (ch.filter(function (c) { return c.ok; }).length !== 1) throw new Error(tplId + ": exactly one choice must be correct");
      q.answerText = LETTERS[q.answer];
      if (q.desmos && q.desmos.withChoices) {          // graph every choice after the given expressions, in A-D order
        var base = (q.desmos.exprs || []).length;
        q.desmos.exprs = (q.desmos.exprs || []).concat(ch.map(function (c) { return c.dz; }));
        q.desmos.steps = q.desmos.steps.concat(["In the loaded graph, lines " + (base + 1) + " to " + (base + 4) + " are choices A to D, in order."]);
      }
    } else if (q.type === "spr") {
      q.answer = Fr.of(q.answer);
      q.answerText = S.answerForms(q.answer).join(", ");
      if (q.alts) { q.alts = q.alts.map(Fr.of); q.answerText += " (other correct answers: " + q.alts.map(function (a) { return S.answerForms(a)[0]; }).join(", ") + ")"; }
    } else throw new Error(tplId + ": unknown question type");
    return q;
  };
  S.parseId = function (id) {
    var p = String(id).split(":");
    return { tpl: p[0], level: parseInt(p[1], 10), seed: parseInt(p[2], 10) >>> 0 };
  };
  S.fromId = function (id) { var p = S.parseId(id); return S.make(p.tpl, p.level, p.seed); };
})(typeof window !== "undefined" ? window : globalThis);
