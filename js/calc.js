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

  Calc.load = function () {
    if (Calc.ready) return Calc.ready;
    Calc.ready = new Promise(function (res, rej) {
      if (window.Desmos) return res();
      var key = String((S.Store.settings().desmosKey || "")).trim() || DEMO_KEY;
      var s = document.createElement("script");
      s.src = "https://www.desmos.com/api/" + VERSION + "/calculator.js?apiKey=" + encodeURIComponent(key);
      s.async = true;
      s.onload = function () { window.Desmos ? res() : rej(new Error("The Desmos calculator didn't start.")); };
      s.onerror = function () { rej(new Error("Couldn't load the Desmos calculator. Check your internet connection" + (key !== DEMO_KEY ? ", or check the Desmos API key in Settings" : "") + ".")); };
      document.head.appendChild(s);
    }).then(function () {
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

  // Load a set of expressions (a question's Desmos method, a lesson example or the tutor's suggestion).
  Calc.show = function (dz) {
    return Calc.load().then(function (c) {
      Calc.saved = c.getState();
      c.setBlank();
      c.updateSettings({ degreeMode: !!dz.degree });
      Calc.theme();
      c.setExpressions((dz.exprs || []).map(function (latex, i) { return { id: "m" + i, latex: clean(latex), color: COLORS[i % COLORS.length] }; }));
      if (dz.bounds) c.setMathBounds(dz.bounds);
      document.dispatchEvent(new CustomEvent("calc:loaded"));
      return c;
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
