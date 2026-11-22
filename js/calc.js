/* SAT Math: the Desmos graphing calculator. One calculator lives for the whole visit and moves between screens. */
(function (G) {
  "use strict";
  var S = G.SATM, DEMO_KEY = "dcb31709b452b1cf9dc26972add0fda6", VERSION = "v1.12";
  var COLORS = ["#2d70b3", "#c74440", "#388c46", "#6042a6", "#fa7e19", "#000000"];
  var Calc = S.Calc = { calc: null, ready: null, saved: null, demoKey: DEMO_KEY };

  function wrap() { return document.getElementById("calcWrap"); }
  function dark() {
    var t = document.documentElement.getAttribute("data-theme");
    return t === "dark" || (t !== "light" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
  }
  function showError(msg) {
    var el = document.getElementById("calc");
    if (!el) return;
    el.innerHTML = '<div class="calc-error"><p>' + S.fig.esc(msg) + '</p><button class="btn small" type="button" id="calcRetry">Try again</button></div>';
    var b = document.getElementById("calcRetry");
    if (b) b.onclick = function () { el.innerHTML = ""; Calc.load(); };
  }
  // Desmos's own LaTeX is a little stricter than what the question bank writes for display.
  function clean(latex) {
    return String(latex).replace(/\{,\}/g, "").replace(/([A-Za-z])_(\d)/g, "$1_{$2}").replace(/\\lt/g, "<").replace(/\\gt/g, ">").replace(/\\ne(?![a-z])/g, "\\ne ");
  }
  Calc.clean = clean;

  var scriptReady = null;
  Calc.loadScript = function () {
    if (scriptReady) return scriptReady;
    scriptReady = new Promise(function (res, rej) {
      if (window.Desmos) return res();
      var key = String((S.Store.settings().desmosKey || "")).trim() || DEMO_KEY;
      var s = document.createElement("script");
      s.src = "https://www.desmos.com/api/" + VERSION + "/calculator.js?apiKey=" + encodeURIComponent(key);
      s.async = true;
      s.onload = function () { window.Desmos ? res() : rej(new Error("The Desmos calculator didn't start.")); };
      s.onerror = function () { s.remove(); rej(new Error("Couldn't load the Desmos calculator. Check your internet connection" + (key !== DEMO_KEY ? ", or check the Desmos API key in Settings" : "") + ".")); };
      document.head.appendChild(s);
    });
    scriptReady.catch(function () { scriptReady = null; });
    return scriptReady;
  };
  Calc.load = function () {
    if (Calc.ready) return Calc.ready;
    Calc.ready = Calc.loadScript().then(function () {
      var el = document.getElementById("calc");
      el.innerHTML = "";
      Calc.calc = window.Desmos.GraphingCalculator(el, {
        keypad: true, expressions: true, settingsMenu: true, zoomButtons: true, expressionsTopbar: true,
        border: false, autosize: true, images: false, folders: false, notes: false
      });
      Calc.theme();
      return Calc.calc;
    });
    Calc.ready.catch(function (e) { Calc.ready = null; showError(e.message); });
    return Calc.ready;
  };
  Calc.mount = function (host) {
    var w = wrap();
    if (!w || !host) return;
    host.appendChild(w);
    Calc.load().then(function (c) { if (c.resize) c.resize(); }).catch(function () { });
  };
  Calc.park = function () { var w = wrap(), park = document.getElementById("calcPark"); if (w && park && w.parentNode !== park) park.appendChild(w); };
  Calc.theme = function () { if (Calc.calc) Calc.calc.updateSettings({ invertedColors: dark() }); };

  // An expression can be a LaTeX string or {latex, label, color}. Labeled points show their label on the graph.
  function toExpr(e, i, prefix) {
    var o = typeof e === "string" ? { latex: e } : e || {};
    var x = { id: (prefix || "m") + i, latex: clean(o.latex || ""), color: o.color || COLORS[i % COLORS.length] };
    if (o.label) { x.label = String(o.label); x.showLabel = true; }
    return x;
  }
  Calc.toExpr = toExpr;
  // A window that shows every numeric point (a,b) in the list, merged with the suggested bounds.
  Calc.fit = function (exprs, b) {
    var pts = [];
    (exprs || []).forEach(function (e) {
      var l = clean(typeof e === "string" ? e : (e && e.latex) || "").replace(/\\left|\\right/g, "").replace(/\s/g, "");
      var m = l.match(/^\((-?[\d.]+),(-?[\d.]+)\)$/), hy = l.match(/^y=(-?[\d.]+)$/), vx = l.match(/^x=(-?[\d.]+)$/);
      if (m) pts.push([+m[1], +m[2]]);
      else if (hy) pts.push([0, +hy[1]]);
      else if (vx) pts.push([+vx[1], 0]);
    });
    var ok = b && [b.left, b.right, b.bottom, b.top].every(function (v) { return typeof v === "number" && isFinite(v); }) && b.right > b.left && b.top > b.bottom;
    var L = ok ? b.left : Infinity, R = ok ? b.right : -Infinity, B = ok ? b.bottom : Infinity, T = ok ? b.top : -Infinity;
    pts.forEach(function (p) { L = Math.min(L, p[0]); R = Math.max(R, p[0]); B = Math.min(B, p[1]); T = Math.max(T, p[1]); });
    if (!isFinite(L)) return { left: -10, right: 10, bottom: -7, top: 7 };
    var w = Math.max(R - L, 2), hgt = Math.max(T - B, 2), px = pts.length && !ok ? w * 0.25 : w * 0.06, py = pts.length && !ok ? hgt * 0.25 : hgt * 0.06;
    if (!ok) { L = Math.min(L, 0); B = Math.min(B, 0); R = Math.max(R, 0); T = Math.max(T, 0); }
    var out = { left: L - px, right: R + px, bottom: B - py, top: T + py };
    if (!ok) {                       // keep a landscape window so lines through the points stay visible
      var W = out.right - out.left, Hh = out.top - out.bottom, cx = (out.left + out.right) / 2, cy = (out.top + out.bottom) / 2;
      if (W < Hh * 1.3) { W = Hh * 1.3; out.left = cx - W / 2; out.right = cx + W / 2; }
      if (Hh < W * 0.5) { Hh = W * 0.5; out.bottom = cy - Hh / 2; out.top = cy + Hh / 2; }
    }
    return out;
  };

  // Load a set of expressions (a question's Desmos method, a lesson example or the tutor's suggestion).
  Calc.show = function (dz, keepUndo) {
    return Calc.load().then(function (c) {
      if (!keepUndo) Calc.saved = c.getState();
      c.setBlank();
      c.updateSettings({ degreeMode: !!dz.degree });
      Calc.theme();
      c.setExpressions((dz.exprs || []).map(function (e, i) { return toExpr(e, i); }));
      if (dz.bounds) c.setMathBounds(dz.bounds);
      document.dispatchEvent(new CustomEvent("calc:loaded"));
      return c;
    });
  };

  // ---------------------------------------------------------------- the "lab": a hidden calculator the tutor uses itself
  // It checks answers numerically, finds broken expressions and draws graph snapshots, without touching the student's calculator.
  var labReady = null, labQueue = Promise.resolve();
  function lab() {
    if (labReady) return labReady;
    labReady = Calc.loadScript().then(function () {
      var el = document.createElement("div");
      el.id = "calcLab";
      el.setAttribute("aria-hidden", "true");
      el.style.cssText = "position:fixed;left:-10000px;top:0;width:640px;height:420px;pointer-events:none;";
      document.body.appendChild(el);
      return window.Desmos.GraphingCalculator(el, { expressions: false, settingsMenu: false, zoomButtons: false, keypad: false, border: false, lockViewport: true, autosize: false });
    });
    labReady.catch(function () { labReady = null; });
    return labReady;
  }
  function onLab(fn) { var p = labQueue.then(function () { return lab().then(fn); }); labQueue = p.catch(function () { }); return p; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function numeric(c, latex) {
    return new Promise(function (res) {
      var hx, done = false;
      function fin(v) { if (done) return; done = true; try { hx.unobserve("numericValue"); } catch (e) { } res(v); }
      try { hx = c.HelperExpression({ latex: clean(latex) }); } catch (e) { return res(NaN); }
      hx.observe("numericValue", function () { if (typeof hx.numericValue === "number") fin(hx.numericValue); });
      setTimeout(function () { fin(typeof hx.numericValue === "number" ? hx.numericValue : NaN); }, 2500);
    });
  }
  // checks: [{left, right}] -> [{left, right, lv, rv, status: "ok" | "bad" | "error"}]
  Calc.check = function (defs, checks) {
    return onLab(async function (c) {
      c.setBlank();
      c.setExpressions((defs || []).map(function (d, i) { return { id: "d" + i, latex: clean(d) }; }));
      await sleep(60);
      var out = [];
      for (var i = 0; i < (checks || []).length; i++) {
        var k = checks[i], lv = await numeric(c, k.left), rv = await numeric(c, k.right), st;
        if (!isFinite(lv) || !isFinite(rv)) st = "error";
        else st = Math.abs(lv - rv) <= 1e-3 * Math.max(1, Math.abs(lv), Math.abs(rv)) ? "ok" : "bad";
        out.push({ left: k.left, right: k.right, lv: lv, rv: rv, status: st });
      }
      c.setBlank();
      return out;
    });
  };
  // Which expressions does Desmos reject? Returns the list without them, plus the rejected ones.
  Calc.validate = function (exprs) {
    return onLab(async function (c) {
      c.setBlank();
      var list = (exprs || []).map(function (e, i) { return toExpr(e, i, "v"); });
      c.setExpressions(list);
      var an = {};
      for (var t = 0; t < 30; t++) { await sleep(80); an = c.expressionAnalysis || {}; if (list.every(function (x) { return an[x.id]; })) break; }
      var good = [], bad = [];
      list.forEach(function (x, i) { var a = an[x.id]; if (a && a.isError) bad.push({ latex: x.latex, error: a.errorMessage || "error" }); else good.push(exprs[i]); });
      c.setBlank();
      return { good: good, bad: bad };
    });
  };
  // A PNG data URI of a graph: {exprs, bounds, degree}
  Calc.snap = function (dz, w, hgt) {
    return onLab(async function (c) {
      c.setBlank();
      c.updateSettings({ degreeMode: !!dz.degree, invertedColors: false });
      c.setExpressions((dz.exprs || []).map(function (e, i) { return toExpr(e, i, "s"); }));
      var b = dz.bounds || Calc.fit(dz.exprs);
      c.setMathBounds(b);
      await sleep(250);
      var uri = await new Promise(function (res) {
        var to = setTimeout(function () { res(null); }, 6000);
        try { c.asyncScreenshot({ width: w || 560, height: hgt || 360, targetPixelRatio: 2, mathBounds: b, showLabels: true }, function (u) { clearTimeout(to); res(u || null); }); }
        catch (e) { clearTimeout(to); res(null); }
      });
      c.setBlank();
      return uri;
    });
  };
  Calc.undo = function () { if (Calc.calc && Calc.saved) { var s = Calc.saved; Calc.saved = null; Calc.calc.setState(s); Calc.theme(); } };
  Calc.clear = function () { if (Calc.calc) { Calc.saved = Calc.calc.getState(); Calc.calc.setBlank(); Calc.theme(); } };
  Calc.getState = function () { return Calc.calc ? Calc.calc.getState() : null; };
  Calc.setState = function (st) { if (!Calc.calc) return; if (st) Calc.calc.setState(st); else Calc.calc.setBlank(); Calc.theme(); };
  Calc.expressions = function () {
    if (!Calc.calc) return [];
    return Calc.calc.getExpressions().filter(function (e) { return e.type === "expression" && e.latex && e.latex.trim(); }).map(function (e) { return e.latex; });
  };
  Calc.screenshot = function () {
    return new Promise(function (res) {
      if (!Calc.calc) return res(null);
      try { Calc.calc.asyncScreenshot({ width: 560, height: 380, targetPixelRatio: 1 }, function (uri) { res(uri ? String(uri).replace(/^data:image\/png;base64,/, "") : null); }); }
      catch (e) { res(null); }
    });
  };
})(typeof window !== "undefined" ? window : globalThis);
