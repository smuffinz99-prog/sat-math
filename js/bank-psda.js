/* SAT Math question templates: Problem-Solving and Data Analysis. */
(function (G) {
  "use strict";
  var S = G.SATM, Fr = S.Fr, fm = S.fmt, tx = fm.tex, td = fm.texd, A = S.alg, m = S.m, H = S.H;
  var add = S.addTemplate, fail = H.fail, eqAns = H.eqAns, numChoices = H.numChoices, approx = H.approx;

  function calc(expr, result, note) {                 // Desmos used as a calculator
    return { steps: ["Type " + m(expr) + " into a new line. Desmos shows " + m(result) + "." + (note ? " " + note : "")], exprs: [expr] };
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function list(xs) { return xs.map(function (x) { return fm.num(x); }).join(", "); }
  function dzList(xs) { return "[" + xs.map(function (x) { return S.decStr(x); }).join(",") + "]"; }
  function mean(xs) { return Fr.div(Fr.sum(xs), xs.length); }
  function median(xs) {
    var s = xs.slice().sort(function (a, b) { return Fr.cmp(a, b); }), n = s.length;
    return n % 2 ? Fr.of(s[(n - 1) / 2]) : Fr.div(Fr.add(s[n / 2 - 1], s[n / 2]), 2);
  }
  function sd(xs) { var mu = Fr.val(mean(xs)); return Math.sqrt(xs.reduce(function (t, x) { return t + Math.pow(Fr.val(x) - mu, 2); }, 0) / xs.length); }

  // ================================================================ Ratios, rates, proportions and units
  var CONVERT = [
    function (R) {
      var v = 3 * R.int(4, 25), ans = Fr(v * 22, 15);
      return { stem: "A cyclist rides at a constant speed of " + v + " miles per hour. What is this speed, in feet per second? (1 mile = 5,280 feet)", ans: ans,
               ex: ["Convert miles to feet and hours to seconds: " + m(v + "\\ \\frac{\\text{mi}}{\\text{hr}} \\cdot \\frac{5{,}280\\ \\text{ft}}{1\\ \\text{mi}} \\cdot \\frac{1\\ \\text{hr}}{3{,}600\\ \\text{s}}") + ".",
                    "That's " + m("\\frac{" + v + "\\cdot 5{,}280}{3{,}600} = " + td(ans)) + " feet per second."],
               dz: v + "\\cdot\\frac{5280}{3600}", data: { k: "speed", v: v } };
    },
    function (R) {
      var c = R.pick([1.5, 2, 2.5, 3]), u = R.pick([2, 3, 4]), n = u * R.int(4, 9), t = R.pick([Fr(2), Fr(3), Fr(3, 2), Fr(5, 2), Fr(1, 2)]);
      var k = Fr.mul(n, t); if (!Fr.isInt(k)) { t = Fr(2); k = Fr.mul(n, t); }
      var ans = Fr.div(Fr.mul(c, k), n);
      return { stem: "A recipe uses " + fm.num(c) + " cups of flour to make " + n + " cookies. At this rate, how many cups of flour are needed to make " + fm.num(k) + " cookies?", ans: ans,
               ex: ["Set up a proportion: " + m("\\frac{" + td(c) + "\\ \\text{cups}}{" + n + "\\ \\text{cookies}} = \\frac{x\\ \\text{cups}}{" + tx(k) + "\\ \\text{cookies}}") + ".",
                    "So " + m("x = \\frac{" + td(c) + "\\cdot " + tx(k) + "}{" + n + "} = " + td(ans)) + " cups."],
               dz: "\\frac{" + S.decStr(c) + "\\cdot " + S.decStr(k) + "}{" + n + "}", data: { k: "recipe", c: c, n: n, kk: k } };
    },
    function (R) {
      var p = R.int(3, 12), s = R.pick([4, 5, 6, 10, 12, 15, 20]), mins = R.int(2, 9), ans = Fr(p * 60 * mins, s);
      return { stem: "A printer prints " + p + " pages every " + s + " seconds. At this rate, how many pages does it print in " + mins + " minutes?", ans: ans,
               ex: [mins + " minutes is " + m(mins + "\\cdot 60 = " + mins * 60) + " seconds.",
                    "Pages: " + m("\\frac{" + p + "\\ \\text{pages}}{" + s + "\\ \\text{s}} \\cdot " + mins * 60 + "\\ \\text{s} = " + tx(ans)) + " pages."],
               dz: "\\frac{" + p + "}{" + s + "}\\cdot " + mins + "\\cdot60", data: { k: "printer", p: p, s: s, mins: mins } };
    },
    function (R) {
      var d = R.pick([24, 25, 28, 30, 32, 35]), kk = R.int(3, 15), g = R.pick([3.2, 3.45, 3.6, 3.85, 4.1]), M = d * kk, ans = Fr.mul(kk, g);
      return { stem: "A car travels " + d + " miles on each gallon of gas, and gas costs " + fm.money(g) + " per gallon. What is the cost, in dollars, of the gas needed to drive " + fm.num(M) + " miles?", ans: ans,
               ex: ["Gallons needed: " + m("\\frac{" + tx(M) + "}{" + d + "} = " + kk) + ".",
                    "Cost: " + m(kk + "\\cdot " + td(g) + " = " + td(ans)) + " dollars."],
               dz: "\\frac{" + M + "}{" + d + "}\\cdot " + S.decStr(g), data: { k: "gas", d: d, M: M, g: g } };
    },
    function (R) {
      var cm = R.pick([1.5, 2, 2.5, 4]), km = R.pick([10, 20, 25, 30, 50]), mult = R.pick([2, 3, 4, 5, 6]), dist = Fr.mul(cm, mult), ans = Fr(km * mult);
      return { stem: "On a map, " + fm.num(cm) + " centimeters represents " + km + " kilometers. Two towns are " + fm.num(dist) + " centimeters apart on the map. How many kilometers apart are the actual towns?", ans: ans,
               ex: ["The map distance is " + m("\\frac{" + td(dist) + "}{" + td(cm) + "} = " + mult) + " times the scale length.",
                    "So the real distance is " + m(mult + "\\cdot " + km + " = " + tx(ans)) + " kilometers."],
               dz: "\\frac{" + S.decStr(dist) + "}{" + S.decStr(cm) + "}\\cdot " + km, data: { k: "map", cm: cm, km: km, dist: dist } };
    },
    function (R) {
      var rho = R.pick([2.7, 7.8, 8.9, 11.3, 19.3]), V = R.int(3, 12), ans = Fr.mul(rho, V);
      return { stem: "A metal block has a density of " + fm.num(rho) + " grams per cubic centimeter and a volume of " + V + " cubic centimeters. What is the mass, in grams, of the block?", ans: ans,
               ex: ["Density is mass divided by volume, so mass = density × volume.", m(td(rho) + "\\cdot " + V + " = " + td(ans)) + " grams."],
               dz: S.decStr(rho) + "\\cdot " + V, data: { k: "density", rho: rho, V: V } };
    }
  ];
  add({
    id: "ratio.convert", skill: "psda.ratio", levels: [1, 2], title: "Rates and unit conversion",
    gen: function (R, L) {
      var c;
      for (var t = 0; t < 40; t++) { c = (L === 1 ? R.pick([CONVERT[1], CONVERT[4], CONVERT[5]]) : R.pick([CONVERT[0], CONVERT[2], CONVERT[3]]))(R); if (S.fitsGrid(c.ans)) break; }
      return { type: "spr", stem: "<p>" + c.stem + "</p>", answer: c.ans, explain: c.ex, desmos: calc(c.dz, approx(c.ans)), data: c.data };
    },
    check: function (q) {
      var d = q.data, want;
      if (d.k === "speed") want = Fr(d.v * 5280, 3600);
      else if (d.k === "recipe") want = Fr.mul(Fr.div(d.c, d.n), d.kk);
      else if (d.k === "printer") want = Fr.mul(Fr(d.p, d.s), d.mins * 60);
      else if (d.k === "gas") want = Fr.mul(Fr(d.M, d.d), d.g);
      else if (d.k === "map") want = Fr.mul(Fr.div(d.dist, d.cm), d.km);
      else want = Fr.mul(d.rho, d.V);
      return eqAns(q, want);
    }
  });

  var SHARE = [
    { a: "red marbles", b: "blue marbles", where: "a bag that contains only red and blue marbles", total: "marbles" },
    { a: "boys", b: "girls", where: "a chess club", total: "members" },
    { a: "juniors", b: "seniors", where: "a school band made up of only juniors and seniors", total: "members" },
    { a: "cups of water", b: "cups of juice", where: "a punch recipe made of only water and juice", total: "cups of punch" }
  ];
  add({
    id: "ratio.share", skill: "psda.ratio", levels: [1, 2], title: "Split a total in a ratio",
    gen: function (R, L) {
      var c = R.pick(SHARE), p, q;
      do { p = R.int(1, 9); q = R.int(1, 9); } while (p === q || S.gcd(p, q) !== 1);
      var k = R.int(3, 15);
      if (L === 1 || R.chance(0.5)) {
        var T = (p + q) * k, askB = R.chance(0.5), ans = askB ? q * k : p * k;
        return {
          type: "spr",
          stem: "<p>The ratio of " + c.a + " to " + c.b + " in " + c.where + " is " + p + " to " + q + ". There are " + fm.num(T) + " " + c.total + " in all. How many " + (askB ? c.b : c.a) + " are there?</p>",
          answer: ans,
          explain: ["A ratio of " + p + " to " + q + " splits the total into " + m(p + " + " + q + " = " + (p + q)) + " equal parts.",
                    "Each part is " + m("\\frac{" + tx(T) + "}{" + (p + q) + "} = " + k) + ", so there are " + m((askB ? q : p) + "\\cdot " + k + " = " + ans) + " " + (askB ? c.b : c.a) + "."],
          desmos: calc("\\frac{" + T + "}{" + (p + q) + "}\\cdot " + (askB ? q : p), tx(ans)),
          data: { mode: "total", p: p, q: q, T: T, askB: askB }
        };
      }
      if (p > q) { var tmp = p; p = q; q = tmp; }
      var D = (q - p) * k;
      return {
        type: "spr",
        stem: "<p>The ratio of " + c.a + " to " + c.b + " in " + c.where + " is " + p + " to " + q + ". There are " + D + " more " + c.b + " than " + c.a + ". How many " + c.a + " are there?</p>",
        answer: p * k,
        explain: ["Write the amounts as " + m(p + "k") + " and " + m(q + "k") + ". The difference is " + m(q + "k - " + p + "k = " + (q - p) + "k") + ".",
                  "So " + m((q - p) + "k = " + D) + ", " + m("k = " + k) + ", and there are " + m(p + "\\cdot " + k + " = " + p * k) + " " + c.a + "."],
        desmos: calc("\\frac{" + D + "}{" + (q - p) + "}\\cdot " + p, tx(p * k)),
        data: { mode: "diff", p: p, q: q, D: D }
      };
    },
    check: function (q) {
      var d = q.data;
      if (d.mode === "total") { var part = Fr(d.T, d.p + d.q); return eqAns(q, Fr.mul(part, d.askB ? d.q : d.p)); }
      var a = q.answer, b = Fr.add(a, d.D);                              // a : b must be p : q
      if (!Fr.eq(Fr.mul(a, d.q), Fr.mul(b, d.p))) fail("ratio");
      return true;
    }
  });

  // ================================================================ Percentages
  add({
    id: "pct.change", skill: "psda.pct", levels: [1, 2], title: "Percent change",
    gen: function (R, L) {
      var variant = L === 1 ? R.pick(["change", "greater"]) : R.pick(["successive", "successive", "change"]);
      if (variant === "successive") {
        var P0, a, b, ans;
        for (var t = 0; t < 80; t++) {
          P0 = R.pick([40, 60, 75, 80, 120, 150, 200, 250]); a = R.pick([10, 15, 20, 25, 30, 40, 50]); b = R.pick([10, 15, 20, 25, 30, 40, 50]);
          ans = Fr.mul(Fr.mul(P0, Fr.add(1, Fr(a, 100))), Fr.sub(1, Fr(b, 100)));
          if (S.fitsGrid(ans) && Fr.places(ans) <= 2) break;
        }
        var mid = Fr.mul(P0, Fr.add(1, Fr(a, 100)));
        return {
          type: "spr",
          stem: "<p>The price of a jacket was " + fm.money(P0) + ". The price was increased by " + a + "%, and then the new price was decreased by " + b + "%. What is the final price, in dollars?</p>",
          answer: ans,
          explain: ["An increase of " + a + "% multiplies by " + m(td(Fr.add(1, Fr(a, 100)))) + ": " + m(tx(P0) + "\\cdot " + td(Fr.add(1, Fr(a, 100))) + " = " + td(mid)) + ".",
                    "A decrease of " + b + "% multiplies by " + m(td(Fr.sub(1, Fr(b, 100)))) + ": " + m(td(mid) + "\\cdot " + td(Fr.sub(1, Fr(b, 100))) + " = " + td(ans)) + ".",
                    "The two changes don't cancel, because the " + b + "% is taken from the new, " + (a > 0 ? "higher" : "lower") + " price."],
          desmos: calc(P0 + "\\cdot " + S.decStr(Fr.add(1, Fr(a, 100))) + "\\cdot " + S.decStr(Fr.sub(1, Fr(b, 100))), td(ans)),
          data: { mode: "successive", P0: P0, a: a, b: b }
        };
      }
      if (variant === "change") {
        var A0 = 20 * R.int(2, 30), p = R.pick([5, 10, 15, 20, 25, 30, 40, 50, 60, 75]), up = R.chance(0.6);
        if (!up && p >= 75) p = 40;
        var B = Fr.mul(A0, up ? Fr.add(1, Fr(p, 100)) : Fr.sub(1, Fr(p, 100)));
        return {
          type: "spr",
          stem: "<p>The number of members of a club " + (up ? "increased" : "decreased") + " from " + fm.num(A0) + " to " + fm.num(B) + ". By what percent did the number of members " + (up ? "increase" : "decrease") + "?</p>",
          answer: p,
          explain: ["Percent change = " + m("\\frac{\\text{change}}{\\text{original}} \\cdot 100") + ".",
                    "The change is " + m(fm.tex(Fr.abs(Fr.sub(B, A0)))) + ", so " + m("\\frac{" + tx(Fr.abs(Fr.sub(B, A0))) + "}{" + tx(A0) + "} \\cdot 100 = " + p) + ". Enter " + m(p) + " (no percent sign)."],
          desmos: calc("\\frac{" + S.decStr(Fr.abs(Fr.sub(B, A0))) + "}{" + A0 + "}\\cdot100", tx(p)),
          data: { mode: "change", A0: A0, B: B, up: up }
        };
      }
      var y = 10 * R.int(2, 30), p2 = R.pick([10, 20, 25, 30, 40, 50, 75, 120, 150]), x = Fr.mul(y, Fr.add(1, Fr(p2, 100)));
      return {
        type: "spr",
        stem: "<p>The value of " + m("x") + " is " + p2 + "% greater than the value of " + m("y") + ". If " + m("y = " + y) + ", what is the value of " + m("x") + "?</p>",
        answer: x,
        explain: [p2 + "% greater means " + m("x = y + " + td(Fr(p2, 100)) + "y = " + td(Fr.add(1, Fr(p2, 100))) + "y") + ".",
                  "So " + m("x = " + td(Fr.add(1, Fr(p2, 100))) + "\\cdot " + y + " = " + td(x)) + "."],
        desmos: calc(S.decStr(Fr.add(1, Fr(p2, 100))) + "\\cdot " + y, td(x)),
        data: { mode: "greater", y: y, p: p2 }
      };
    },
    check: function (q) {
      var d = q.data;
      if (d.mode === "successive") return eqAns(q, Fr.div(Fr.mul(Fr.mul(d.P0, 100 + d.a), 100 - d.b), 10000));
      if (d.mode === "change") return eqAns(q, Fr.mul(Fr.div(Fr.abs(Fr.sub(d.B, d.A0)), d.A0), 100));
      return eqAns(q, Fr.div(Fr.mul(d.y, 100 + d.p), 100));
    }
  });

  add({
    id: "pct.reverse", skill: "psda.pct", levels: [2, 3], title: "Work backward from a percent change",
    gen: function (R) {
      var down = R.chance(0.6), O, d, S0;
      if (down) {
        d = R.pick([10, 15, 20, 25, 30, 40]); O = R.pick([40, 60, 80, 120, 160, 200, 240]);
        S0 = Fr.mul(O, Fr.sub(1, Fr(d, 100)));
        var cands = [
          { v: Fr.mul(S0, Fr.add(1, Fr(d, 100))), why: "Adding " + d + "% of the sale price doesn't undo the discount. The discount was " + d + "% of the original, larger price." },
          { v: Fr.add(S0, d), why: "The discount is " + d + " percent, not " + d + " dollars." },
          { v: Fr.mul(S0, Fr.sub(1, Fr(d, 100))), why: "That takes the discount off a second time." }
        ];
        return {
          type: "mc",
          stem: "<p>After a " + d + "% discount, the sale price of a lamp is " + fm.money(S0) + ". What was the original price of the lamp?</p>",
          choices: numChoices(O, cands, R, fm.money),
          explain: ["A " + d + "% discount leaves " + (100 - d) + "% of the original price: " + m(td(Fr(100 - d, 100)) + "x = " + td(S0)) + ".",
                    "Divide: " + m("x = \\frac{" + td(S0) + "}{" + td(Fr(100 - d, 100)) + "} = " + td(O)) + ", so the original price was " + fm.money(O) + "."],
          desmos: calc("\\frac{" + S.decStr(S0) + "}{" + S.decStr(Fr(100 - d, 100)) + "}", td(O)),
          data: { down: true, d: d, S: S0 }
        };
      }
      d = R.pick([10, 20, 25, 50, 60]); O = 100 * R.int(12, 90);
      var N = Fr.mul(O, Fr.add(1, Fr(d, 100)));
      var c2 = [
        { v: Fr.mul(N, Fr.sub(1, Fr(d, 100))), why: "Taking " + d + "% off the new population doesn't undo the increase, because the increase was " + d + "% of the smaller, original population." },
        { v: Fr.sub(N, d), why: "The increase was " + d + " percent, not " + d + " people." },
        { v: Fr.mul(N, Fr.add(1, Fr(d, 100))), why: "That applies the increase a second time." }
      ];
      return {
        type: "mc",
        stem: "<p>The population of a town increased by " + d + "% from 2015 to 2020. The population in 2020 was " + fm.num(N) + ". What was the population in 2015?</p>",
        choices: numChoices(O, c2, R, function (v) { return fm.num(v); }),
        explain: ["An increase of " + d + "% multiplies the 2015 population by " + m(td(Fr.add(1, Fr(d, 100)))) + ": " + m(td(Fr.add(1, Fr(d, 100))) + "x = " + tx(N)) + ".",
                  "Divide: " + m("x = \\frac{" + tx(N) + "}{" + td(Fr.add(1, Fr(d, 100))) + "} = " + tx(O)) + "."],
        desmos: calc("\\frac{" + S.decStr(N) + "}{" + S.decStr(Fr.add(1, Fr(d, 100))) + "}", tx(O)),
        data: { down: false, d: d, S: N }
      };
    },
    check: function (q) {
      var d = q.data, f = d.down ? Fr(100 - d.d, 100) : Fr(100 + d.d, 100);
      q.choices.forEach(function (c, i) { var ok = Fr.eq(Fr.mul(c.v, f), d.S); if ((i === q.answer) !== ok) fail("reverse percent " + i); });
      return true;
    }
  });

  // ================================================================ One-variable data
  var MEANCTX = [
    { s: "The list gives the number of goals a soccer team scored in each of its first {n} games.", lo: 0, hi: 6 },
    { s: "The list gives the daily high temperatures, in degrees Fahrenheit, in a city for {n} days.", lo: 58, hi: 88 },
    { s: "The list gives the number of books each of {n} students read over the summer.", lo: 1, hi: 14 },
    { s: "The list gives the scores, out of 20, that {n} students earned on a quiz.", lo: 8, hi: 20 }
  ];
  add({
    id: "stats1.mean", skill: "psda.stats1", levels: [1, 2], title: "Mean",
    gen: function (R, L) {
      var variant = L === 1 ? "list" : R.pick(["removed", "added", "list"]);
      if (variant === "list") {
        var c = R.pick(MEANCTX), n, xs, mu;
        for (var t = 0; t < 80; t++) { n = R.int(5, 8); xs = []; for (var i = 0; i < n; i++) xs.push(R.int(c.lo, c.hi)); mu = mean(xs); if (S.fitsGrid(mu) && (L === 2 || Fr.places(mu) >= 0 && Fr.places(mu) <= 1)) break; }
        return {
          type: "spr",
          stem: "<p>" + c.s.replace("{n}", n) + "</p><p class=\"datalist\">" + list(xs) + "</p><p>What is the mean of the data?</p>",
          answer: mu,
          explain: ["Add the values: " + m(xs.join(" + ") + " = " + Fr.val(Fr.sum(xs))) + ".", "Divide by the number of values, " + n + ": " + m("\\frac{" + Fr.val(Fr.sum(xs)) + "}{" + n + "} = " + tx(mu)) + ". " + H.gridTip(mu)],
          desmos: { steps: ["Type the data as a list: " + m("L=" + dzList(xs)) + ".", "Type " + m("\\operatorname{mean}(L)") + ". Desmos shows " + m(approx(mu)) + "."], exprs: ["L=" + dzList(xs), "\\operatorname{mean}(L)"] },
          data: { mode: "list", xs: xs }
        };
      }
      if (variant === "removed") {
        var n2 = R.int(5, 10), M2 = R.int(10, 40), M3, removed;
        for (var u = 0; u < 80; u++) { M3 = M2 + R.nz(-4, 4); removed = n2 * M2 - (n2 - 1) * M3; if (removed > 0) break; }
        return {
          type: "spr",
          stem: "<p>The mean of a data set of " + n2 + " numbers is " + M2 + ". When one number is removed, the mean of the remaining " + (n2 - 1) + " numbers is " + M3 + ". What number was removed?</p>",
          answer: removed,
          explain: ["The " + n2 + " numbers add up to " + m(n2 + "\\cdot " + M2 + " = " + n2 * M2) + ".",
                    "The remaining " + (n2 - 1) + " add up to " + m((n2 - 1) + "\\cdot " + M3 + " = " + (n2 - 1) * M3) + ".",
                    "The removed number is the difference: " + m(n2 * M2 + " - " + (n2 - 1) * M3 + " = " + removed) + "."],
          desmos: calc(n2 + "\\cdot " + M2 + "-" + (n2 - 1) + "\\cdot " + M3, tx(removed)),
          data: { mode: "removed", n: n2, M: M2, M2: M3 }
        };
      }
      var n3, M4, v, nm;
      for (var w = 0; w < 80; w++) { n3 = R.int(4, 9); M4 = R.int(12, 60); v = R.int(5, 90); nm = Fr(n3 * M4 + v, n3 + 1); if (S.fitsGrid(nm)) break; }
      return {
        type: "spr",
        stem: "<p>The mean of a data set of " + n3 + " numbers is " + M4 + ". The number " + v + " is added to the data set. What is the mean of the new data set of " + (n3 + 1) + " numbers?</p>",
        answer: nm,
        explain: ["The original numbers add up to " + m(n3 + "\\cdot " + M4 + " = " + n3 * M4) + ". With " + v + " added, the total is " + m(n3 * M4 + v) + ".",
                  "New mean: " + m("\\frac{" + (n3 * M4 + v) + "}{" + (n3 + 1) + "} = " + tx(nm)) + ". " + H.gridTip(nm)],
        desmos: calc("\\frac{" + n3 + "\\cdot " + M4 + "+" + v + "}{" + (n3 + 1) + "}", approx(nm)),
        data: { mode: "added", n: n3, M: M4, v: v }
      };
    },
    check: function (q) {
      var d = q.data;
      if (d.mode === "list") return eqAns(q, Fr(d.xs.reduce(function (a, b) { return a + b; }, 0), d.xs.length));
      if (d.mode === "removed") { var rest = (d.n - 1) * d.M2; if (!Fr.eq(Fr.div(Fr.add(rest, q.answer), d.n), d.M)) fail("removed"); return true; }
      return eqAns(q, Fr.div(Fr.add(d.n * d.M, d.v), d.n + 1));
    }
  });

  var FREQ = [
    { label: "Number of pets", who: "students", vals: [0, 1, 2, 3, 4, 5] },
    { label: "Number of siblings", who: "students", vals: [0, 1, 2, 3, 4] },
    { label: "Books read last month", who: "club members", vals: [1, 2, 3, 4, 5, 6] },
    { label: "Goals scored", who: "games", vals: [0, 1, 2, 3, 4, 5] }
  ];
  add({
    id: "stats1.median", skill: "psda.stats1", levels: [2], title: "Median from a frequency table",
    gen: function (R) {
      var c = R.pick(FREQ), fs, xs, ask = R.chance(0.7) ? "median" : "mean", ans;
      for (var t = 0; t < 100; t++) {
        fs = c.vals.map(function () { return R.int(1, 8); });
        xs = [];
        c.vals.forEach(function (v, i) { for (var k = 0; k < fs[i]; k++) xs.push(v); });
        ans = ask === "median" ? median(xs) : mean(xs);
        if (S.fitsGrid(ans) && xs.length <= 40) break;
      }
      var N = xs.length;
      var tbl = S.table([c.label, "Frequency"], c.vals.map(function (v, i) { return [String(v), String(fs[i])]; }));
      var ex = ask === "median"
        ? ["There are " + m(fs.join(" + ") + " = " + N) + " values in all.",
           N % 2 ? "With " + N + " values, the median is value number " + m("\\frac{" + N + " + 1}{2} = " + (N + 1) / 2) + " when they're in order." : "With " + N + " values, the median is the mean of values number " + N / 2 + " and " + (N / 2 + 1) + " in order.",
           "Count through the table from the smallest value: the median is " + m(tx(ans)) + "."]
        : ["Multiply each value by its frequency and add: " + m(c.vals.map(function (v, i) { return v + "\\cdot " + fs[i]; }).join(" + ") + " = " + Fr.val(Fr.sum(xs))) + ".",
           "Divide by the number of values, " + N + ": " + m("\\frac{" + Fr.val(Fr.sum(xs)) + "}{" + N + "} = " + tx(ans)) + ". " + H.gridTip(ans)];
      return {
        type: "spr",
        stem: "<p>The frequency table summarizes data about " + N + " " + c.who + ".</p>" + tbl + "<p>What is the " + ask + " of the data?</p>",
        answer: ans, explain: ex,
        desmos: { steps: ["Type every value as a list, repeating each one as many times as its frequency: " + m("L=" + dzList(xs)) + ".", "Type " + m("\\operatorname{" + ask + "}(L)") + ". Desmos shows " + m(approx(ans)) + "."],
                  exprs: ["L=" + dzList(xs), "\\operatorname{" + ask + "}(L)"] },
        data: { vals: c.vals, fs: fs, ask: ask }
      };
    },
    check: function (q) {
      var d = q.data, xs = [];
      d.vals.forEach(function (v, i) { for (var k = 0; k < d.fs[i]; k++) xs.push(v); });
      xs.sort(function (a, b) { return a - b; });
      var n = xs.length, med = n % 2 ? Fr(xs[(n - 1) / 2]) : Fr(xs[n / 2 - 1] + xs[n / 2], 2);
      return eqAns(q, d.ask === "median" ? med : Fr(xs.reduce(function (a, b) { return a + b; }, 0), n));
    }
  });

  add({
    id: "stats1.compare", skill: "psda.stats1", levels: [2, 3], title: "How changes affect mean, median and spread",
    gen: function (R, L) {
      if (L === 2 || R.chance(0.6)) {
        var n = R.pick([5, 7, 9]), xs = [];
        for (var i = 0; i < n; i++) xs.push(R.int(10, 40));
        xs.sort(function (a, b) { return a - b; });
        var top = R.chance(0.6), old = top ? xs[n - 1] : xs[0], nw = top ? old + R.int(25, 60) : Math.max(0, old - R.int(8, 9));
        if (!top && nw === old) nw = old - 1;
        var ys = xs.slice(); ys[top ? n - 1 : 0] = nw;
        var dMean = Fr.cmp(mean(ys), mean(xs)), dMed = Fr.cmp(median(ys), median(xs));
        function phrase(cmpMean, cmpMed) {
          var w = function (c) { return c > 0 ? "greater than" : c < 0 ? "less than" : "equal to"; };
          return "The mean of data set B is " + w(cmpMean) + " the mean of data set A, and the median of data set B is " + w(cmpMed) + " the median of data set A.";
        }
        var dir = top ? 1 : -1, combos = [[dMean, dMed], [dir, dir], [0, dir], [0, 0], [dir, 0], [-dir, 0]], seen = {}, choices = [];
        combos.forEach(function (cmb) {
          var key = cmb.join(",");
          if (seen[key] || choices.length >= 4) return;
          seen[key] = 1;
          choices.push({ t: phrase(cmb[0], cmb[1]), ok: choices.length === 0,
                         why: choices.length === 0 ? "" : "Changing the " + (top ? "largest" : "smallest") + " value changes the total, so the mean " + (dMean > 0 ? "goes up" : "goes down") + ". The middle value doesn't move, so the median " + (dMed === 0 ? "stays the same" : "changes") + "." });
        });
        return {
          type: "mc",
          stem: "<p>Data set A consists of the values " + list(xs) + ". Data set B is the same as data set A, except that the value " + old + " is replaced with " + nw + ".</p><p>Which statement correctly compares the two data sets?</p>",
          choices: choices,
          explain: ["Mean: the total changes by " + m(tx(nw - old)) + ", so the mean changes by " + m("\\frac{" + tx(nw - old) + "}{" + n + "}") + ": data set B's mean is " + (dMean > 0 ? "greater" : "less") + ".",
                    "Median: with " + n + " values, the median is the middle (" + ((n + 1) / 2) + "th) value. Replacing the " + (top ? "largest" : "smallest") + " value with an even " + (top ? "larger" : "smaller") + " one doesn't change the middle value, so the medians are equal."],
          desmos: { steps: ["Type " + m("A=" + dzList(xs)) + " and " + m("B=" + dzList(ys)) + ".", "Type " + m("\\operatorname{mean}(A)") + ", " + m("\\operatorname{mean}(B)") + ", " + m("\\operatorname{median}(A)") + " and " + m("\\operatorname{median}(B)") + " to compare."],
                    exprs: ["A=" + dzList(xs), "B=" + dzList(ys), "\\operatorname{mean}(A)", "\\operatorname{mean}(B)", "\\operatorname{median}(A)", "\\operatorname{median}(B)"] },
          data: { mode: "outlier", xs: xs, ys: ys }
        };
      }
      var mu = R.int(20, 60), sc = R.pick([1, 1.5, 2]);
      var wide = [-20, -10, 0, 10, 20].map(function (d) { return mu + d * sc; }), narrow = [-2, -1, 0, 1, 2].map(function (d) { return mu + d; });
      var aWide = R.chance(0.5), setA = aWide ? wide : narrow, setB = aWide ? narrow : wide;
      var choices2 = [
        { t: "The standard deviation of data set A is greater.", key: "A" },
        { t: "The standard deviation of data set B is greater.", key: "B" },
        { t: "The standard deviations are equal.", key: "eq" },
        { t: "There isn't enough information to compare the standard deviations.", key: "info" }
      ];
      var bigger = sd(setA) > sd(setB) ? "A" : "B";
      choices2.forEach(function (c) { c.ok = c.key === bigger; c.why = c.ok ? "" : "Standard deviation measures spread. Data set " + bigger + "'s values are much farther from the mean (" + mu + ") than data set " + (bigger === "A" ? "B" : "A") + "'s."; });
      return {
        type: "mc", order: "fixed",
        stem: "<p>Data set A: " + list(setA) + "<br>Data set B: " + list(setB) + "</p><p>Both data sets have a mean of " + mu + ". Which statement about the standard deviations of the two data sets is true?</p>",
        choices: choices2,
        explain: ["Standard deviation measures how spread out the values are around the mean.",
                  "Data set " + bigger + "'s values range from " + Math.min.apply(null, bigger === "A" ? setA : setB) + " to " + Math.max.apply(null, bigger === "A" ? setA : setB) + ", while the other set stays within 2 of the mean. So data set " + bigger + " has the greater standard deviation. You don't need to calculate it."],
        desmos: { steps: ["Type " + m("A=" + dzList(setA)) + " and " + m("B=" + dzList(setB)) + ".", "Type " + m("\\operatorname{stdev}(A)") + " and " + m("\\operatorname{stdev}(B)") + " to compare."],
                  exprs: ["A=" + dzList(setA), "B=" + dzList(setB), "\\operatorname{stdev}(A)", "\\operatorname{stdev}(B)"] },
        data: { mode: "sd", A: setA, B: setB, mu: mu }
      };
    },
    check: function (q) {
      var d = q.data;
      if (d.mode === "sd") {
        if (!Fr.eq(mean(d.A), d.mu) || !Fr.eq(mean(d.B), d.mu)) fail("means differ");
        var want = sd(d.A) > sd(d.B) ? "A" : "B";
        if (q.choices[q.answer].key !== want) fail("sd");
        return true;
      }
      var w = function (c) { return c > 0 ? "greater than" : c < 0 ? "less than" : "equal to"; };
      var truth = "The mean of data set B is " + w(Fr.cmp(mean(d.ys), mean(d.xs))) + " the mean of data set A, and the median of data set B is " + w(Fr.cmp(median(d.ys), median(d.xs))) + " the median of data set A.";
      if (q.choices[q.answer].t !== truth) fail("outlier statement");
      return true;
    }
  });

  // ================================================================ Two-variable data
  var SCATTER = [
    { x: "Hours studied", y: "Test score", xr: [0, 10, 2], yr: [40, 100, 10], m: [3, 3.5, 4, 4.5], b: [48, 50, 52, 55], noise: 6, xs: [0.5, 9.5],
      xu: "hour studied", yu: "points", xn: "number of hours a student studied", yn: "test score" },
    { x: "Age of car (years)", y: "Value (thousands of dollars)", xr: [0, 12, 2], yr: [0, 40, 5], m: [-1.5, -2, -2.5], b: [30, 32, 35, 36], noise: 2.5, xs: [0.5, 11.5],
      xu: "year of age", yu: "thousand dollars", xn: "age of a car, in years", yn: "value of the car, in thousands of dollars" },
    { x: "Daily high temperature (°F)", y: "Iced drinks sold", xr: [60, 100, 10], yr: [0, 200, 25], m: [3, 3.5, 4], b: [-170, -180, -190, -200], noise: 14, xs: [62, 98],
      xu: "degree Fahrenheit", yu: "drinks", xn: "daily high temperature, in degrees Fahrenheit", yn: "number of iced drinks sold" }
  ];
  function lsq(pts) {
    var n = pts.length, sx = 0, sy = 0, sxx = 0, sxy = 0;
    pts.forEach(function (p) { sx += p[0]; sy += p[1]; sxx += p[0] * p[0]; sxy += p[0] * p[1]; });
    var mm = (n * sxy - sx * sy) / (n * sxx - sx * sx);
    return { m: mm, b: (sy - mm * sx) / n };
  }
  add({
    id: "stats2.lobf", skill: "psda.stats2", levels: [2, 3], title: "Line of best fit",
    gen: function (R, L) {
      var c = R.pick(SCATTER), mm, bb, pts;
      for (var t = 0; t < 60; t++) {
        mm = R.pick(c.m); bb = R.pick(c.b); pts = [];
        var used = {};
        while (pts.length < 12) {
          var x = c.xs[0] + R.int(0, Math.round((c.xs[1] - c.xs[0]) * 2)) / 2;
          if (used[x]) continue;
          used[x] = 1;
          var y = Math.round(mm * x + bb + (R.float() * 2 - 1) * c.noise);
          if (y < c.yr[0] + 1 || y > c.yr[1] - 1) { delete used[x]; continue; }
          pts.push([x, y]);
        }
        var fit = lsq(pts);
        if (Math.abs(fit.m - mm) <= 0.2 * Math.abs(mm) && Math.abs((fit.m - mm) * (c.xr[0] + c.xr[1]) / 2 + fit.b - bb) <= c.noise * 0.6) break;
      }
      pts.sort(function (a, b) { return a[0] - b[0]; });
      var line = A.lin(Fr.of(mm), Fr.of(bb), "x", true);
      var figure = S.fig.scatter({ xmin: c.xr[0], xmax: c.xr[1], xstep: c.xr[2], ymin: c.yr[0], ymax: c.yr[1], ystep: c.yr[2], xlabel: c.x, ylabel: c.y, pts: pts, line: { m: mm, b: bb },
                                   alt: "Scatterplot of " + c.y.toLowerCase() + " against " + c.x.toLowerCase() + " with 12 points and a line of best fit." });
      var alt = "Scatterplot of " + c.y + " (y) against " + c.x + " (x). Points: " + pts.map(function (p) { return "(" + p[0] + ", " + p[1] + ")"; }).join(", ") + ". The line of best fit shown is y = " + S.decStr(mm) + "x + " + S.decStr(bb) + ".";
      var desmos = { steps: ["Type the data as lists: " + m("x_1=") + "the x-values and " + m("y_1=") + "the y-values, then " + m("(x_1,y_1)") + " to plot them.",
                             "Type " + m("y_1\\sim mx_1+b") + ". Desmos finds the line of best fit (about " + m("m \\approx " + approx(Fr.of(Math.round(lsq(pts).m * 100) / 100))) + ")."],
                     exprs: ["x_1=[" + pts.map(function (p) { return p[0]; }).join(",") + "]", "y_1=[" + pts.map(function (p) { return p[1]; }).join(",") + "]", "(x_1,y_1)", "y_1\\sim mx_1+b"],
                     bounds: { left: c.xr[0] - (c.xr[1] - c.xr[0]) * 0.05, right: c.xr[1], bottom: c.yr[0], top: c.yr[1] } };
      var variant = L === 2 ? R.pick(["which", "predict"]) : R.pick(["predict", "residual", "which"]);
      if (variant === "which") {
        var dist = c.noise * 4;
        var cands = [
          { m: -mm, b: bb, why: "This line " + (mm > 0 ? "goes down" : "goes up") + " from left to right, but the data " + (mm > 0 ? "go up" : "go down") + "." },
          { m: mm, b: bb - dist * (mm > 0 ? 1 : -1) * 1, why: "This line is as steep as the data, but it sits well " + (mm > 0 ? "below" : "above") + " the points." },
          { m: bb, b: mm, why: "This swaps the slope and the y-intercept." }
        ];
        var fixMid = (c.xr[0] + c.xr[1]) / 2;
        if (c === SCATTER[2]) cands[0] = { m: -mm, b: bb + 2 * mm * fixMid, why: "This line goes down from left to right, but the data go up." };
        var choices = [{ t: m("y = " + line), ok: true, ln: { m: mm, b: bb } }].concat(cands.map(function (k) { return { t: m("y = " + A.lin(Fr.of(k.m), Fr.of(k.b), "x", true)), why: k.why, ln: { m: k.m, b: k.b } }; }));
        return {
          type: "mc", stem: figure + "<p>The scatterplot shows the relationship between two variables, " + m("x") + " and " + m("y") + ". Which equation is the most appropriate line of best fit for the data?</p>",
          choices: choices, alt: alt,
          explain: ["The data " + (mm > 0 ? "rise" : "fall") + " from left to right, so the slope should be " + (mm > 0 ? "positive" : "negative") + ".",
                    "Check a point on each line against the data, for example at " + m("x = " + c.xr[0]) + ": " + m("y = " + line) + " gives " + m(td(Fr.of(Math.round((mm * c.xr[0] + bb) * 100) / 100))) + ", right in the middle of the points.",
                    "So " + m("y = " + line) + " fits best."],
          desmos: desmos, data: { mode: "which", pts: pts }
        };
      }
      if (variant === "predict") {
        var X, pred;
        for (var u = 0; u < 50; u++) { X = c.xr[0] + R.int(1, (c.xr[1] - c.xr[0]) - 1); pred = Fr.add(Fr.mul(Fr.of(mm), X), Fr.of(bb)); if (S.fitsGrid(pred) && Fr.val(pred) > 0) break; }
        return {
          type: "spr",
          stem: figure + "<p>The scatterplot shows data for 12 values of " + m("x") + " and " + m("y") + ", where " + m("x") + " is the " + c.xn + " and " + m("y") + " is the " + c.yn + ". A line of best fit is also shown, and its equation is " + m("y = " + line) + ". Based on the line of best fit, what is the predicted value of " + m("y") + " when " + m("x = " + X) + "?</p>",
          answer: pred, alt: alt,
          explain: ["Substitute " + m("x = " + X) + " into the line of best fit: " + m("y = " + td(Fr.of(mm)) + "(" + X + ")" + A.term(Fr.of(bb), "", false, true) + " = " + td(pred)) + "."],
          desmos: { steps: ["Type " + m("y=" + line) + ", then " + m(td(Fr.of(mm)) + "\\cdot " + X + A.term(Fr.of(bb), "", false, true)) + ". Desmos shows " + m(td(pred)) + "."], exprs: ["y=" + line, td(Fr.of(mm)) + "\\cdot " + X + A.term(Fr.of(bb), "", false, true).replace(/ /g, "")] },
          data: { mode: "predict", mm: mm, bb: bb, X: X }
        };
      }
      var P, resid;
      for (var w = 0; w < 50; w++) { P = R.pick(pts); resid = Fr.sub(P[1], Fr.add(Fr.mul(Fr.of(mm), Fr.of(P[0])), Fr.of(bb))); if (S.fitsGrid(resid) && resid.n !== 0) break; }
      var predP = Fr.add(Fr.mul(Fr.of(mm), Fr.of(P[0])), Fr.of(bb));
      return {
        type: "spr",
        stem: figure + "<p>The scatterplot shows 12 data points and a line of best fit with equation " + m("y = " + line) + ". One of the data points is " + m("(" + td(Fr.of(P[0])) + ", " + P[1] + ")") + ". What is the actual " + m("y") + "-value of this point minus the " + m("y") + "-value predicted by the line of best fit?</p>",
        answer: resid, alt: alt,
        explain: ["The line predicts " + m("y = " + td(Fr.of(mm)) + "(" + td(Fr.of(P[0])) + ")" + A.term(Fr.of(bb), "", false, true) + " = " + td(predP)) + ".",
                  "Actual minus predicted: " + m(P[1] + " - " + H.pr(predP).replace(/\\frac/g, "\\frac") + " = " + td(resid)) + "." + (resid.n < 0 ? " It's negative because the point is below the line." : " It's positive because the point is above the line.")],
        desmos: { steps: ["Type " + m(P[1] + "-(" + td(Fr.of(mm)) + "\\cdot " + td(Fr.of(P[0])) + A.term(Fr.of(bb), "", false, true) + ")") + ". Desmos shows " + m(td(resid)) + "."],
                  exprs: [P[1] + "-(" + td(Fr.of(mm)) + "\\cdot " + td(Fr.of(P[0])) + A.term(Fr.of(bb), "", false, true).replace(/ /g, "") + ")"] },
        data: { mode: "residual", mm: mm, bb: bb, P: P }
      };
    },
    check: function (q) {
      var d = q.data;
      if (d.mode === "predict") return eqAns(q, Fr.add(Fr.mul(Fr.of(d.mm), d.X), Fr.of(d.bb)));
      if (d.mode === "residual") return eqAns(q, Fr.sub(d.P[1], Fr.add(Fr.mul(Fr.of(d.mm), Fr.of(d.P[0])), Fr.of(d.bb))));
      // the right line must fit the points much better than every other choice
      function sse(l) { return d.pts.reduce(function (s, p) { return s + Math.pow(p[1] - (l.m * p[0] + l.b), 2); }, 0); }
      var best = sse(q.choices[q.answer].ln);
      q.choices.forEach(function (c, i) { if (i !== q.answer && sse(c.ln) < best * 3) fail("a wrong line fits too well"); });
      return true;
    }
  });

  var INTERP2 = [
    { x: "the number of hours a student practiced piano each week", y: "the student's score on a performance exam", xn: "weekly practice time", yn: "exam score",
      xu: "hour of weekly practice", yu: "points", yu1: "point on the exam", x0: "a student who practiced 0 hours per week", m: [1.5, 2.5, 3.2, 4], b: [52, 60, 65] },
    { x: "the number of years since 2000", y: "the average price, in dollars, of a movie ticket", xn: "number of years since 2000", yn: "average ticket price",
      xu: "year", yu: "dollars", yu1: "dollar of ticket price", x0: "the year 2000", m: [0.18, 0.25, 0.32], b: [5.4, 6, 6.5] },
    { x: "the distance, in miles, from a house to the city center", y: "the price of the house, in thousands of dollars", xn: "distance from the city center", yn: "house price",
      xu: "mile from the city center", yu: "thousand dollars", yu1: "thousand dollars of house price", x0: "a house at the city center (0 miles away)", m: [-6, -8.5, -12], b: [420, 480, 510] },
    { x: "the daily high temperature, in degrees Fahrenheit", y: "the number of visitors to a public pool", xn: "temperature", yn: "number of visitors",
      xu: "degree Fahrenheit", yu: "visitors", yu1: "visitor", x0: "a day with a high of 0 degrees", m: [4.5, 6, 7.5], b: [-280, -310, -350] }
  ];
  add({
    id: "stats2.interpret", skill: "psda.stats2", levels: [2], title: "Interpret a line of best fit",
    gen: function (R) {
      var c = R.pick(INTERP2), mm = R.pick(c.m), bb = R.pick(c.b), up = mm > 0, ask = bb > 0 && R.chance(0.3) ? "b" : "m";
      var eq = "y = " + A.lin(Fr.of(mm), Fr.of(bb), "x", true), am = td(Fr.abs(Fr.of(mm))), ch = up ? "increases" : "decreases";
      var choices = ask === "m" ? [
        { t: "For each additional " + c.xu + ", the predicted " + c.yn + " " + ch + " by " + am + " " + c.yu + ".", ok: true },
        { t: "For each additional " + c.yu1 + ", the predicted " + c.xn + " " + ch + " by " + am + ".", why: "This mixes up the variables. The slope tells how the predicted y changes when x goes up by 1." },
        { t: "The predicted " + c.yn + " for " + c.x0 + ".", why: "That's the y-intercept, " + td(Fr.of(bb)) + ", not the slope." },
        { t: "For each additional " + c.xu + ", the actual " + c.yn + " " + ch + " by exactly " + am + " " + c.yu + ".", why: "A line of best fit gives predictions. The actual data points don't all lie on the line." }
      ] : [
        { t: "The predicted " + c.yn + " for " + c.x0 + ".", ok: true },
        { t: "For each additional " + c.xu + ", the predicted " + c.yn + " changes by " + td(Fr.of(bb)) + ".", why: "That describes a slope. " + td(Fr.of(bb)) + " is the y-intercept: the prediction when " + m("x = 0") + "." },
        { t: "The greatest " + c.yn + " in the data.", why: "The line doesn't tell you the greatest data value. " + td(Fr.of(bb)) + " is its value when " + m("x = 0") + "." },
        { t: "The " + c.xn + " at which the predicted " + c.yn + " is 0.", why: "That would be the x-intercept. " + td(Fr.of(bb)) + " is where the line crosses the y-axis." }
      ];
      var num = ask === "m" ? td(Fr.of(mm)) : td(Fr.of(bb));
      return {
        type: "mc",
        stem: "<p>A data set relates " + m("x") + ", " + c.x + ", and " + m("y") + ", " + c.y + ". A line of best fit for the data is " + m(eq) + ". What is the best interpretation of " + m(num) + " in this context?</p>",
        choices: choices,
        explain: ask === "m" ? ["In " + m("y = mx + b") + ", the slope " + m("m = " + td(Fr.of(mm))) + " is the change in the predicted " + m("y") + " for each increase of 1 in " + m("x") + ".",
                                "Because it's a line of best fit, it describes predicted values, not exact actual values."]
                             : ["The y-intercept " + m("b = " + td(Fr.of(bb))) + " is the predicted " + m("y") + " when " + m("x = 0") + "."],
        desmos: { steps: ["Graph " + m(eq.replace(" = ", "=")) + ". Click the line at " + m("x=0") + " to see the intercept, then move 1 unit right: " + m("y") + " changes by " + m(td(Fr.of(mm))) + "."], exprs: [eq.replace(/ /g, "")],
                  bounds: { left: -2, right: 20, bottom: Math.min(0, bb + 20 * mm) - 10, top: Math.max(bb, bb + 20 * mm) + 20 } },
        data: { ask: ask }
      };
    },
    check: function (q) { if (!q.choices[q.answer].ok) fail("interpret"); return true; }
  });

  add({
    id: "stats2.model", skill: "psda.stats2", levels: [2], title: "Linear or exponential?",
    gen: function (R) {
      var kind = R.pick(["inclin", "declin", "incexp", "decexp"]), xs = [0, 1, 2, 3, 4], ys;
      if (kind === "inclin") { var a = R.int(2, 30), d = R.int(3, 12); ys = xs.map(function (x) { return a + d * x; }); }
      else if (kind === "declin") { var a2 = R.int(60, 120), d2 = R.int(3, 12); ys = xs.map(function (x) { return a2 - d2 * x; }); }
      else if (kind === "incexp") { var a3 = R.int(2, 9), r = R.pick([2, 3]); ys = xs.map(function (x) { return a3 * Math.pow(r, x); }); }
      else { var r2 = R.pick([2, 3]), a4 = Math.pow(r2, 4) * R.int(2, 6); ys = xs.map(function (x) { return a4 / Math.pow(r2, x); }); }
      var labels = { inclin: "Increasing linear", declin: "Decreasing linear", incexp: "Increasing exponential", decexp: "Decreasing exponential" };
      var diffs = ys.slice(1).map(function (y, i) { return y - ys[i]; }), lin = kind.slice(3) === "lin";
      var tbl = S.table([m("x")].concat(xs.map(String)), [[m("y")].concat(ys.map(String))], { firstCol: true });
      var why = lin ? "The y-values change by the same amount (" + diffs[0] + ") each time x goes up by 1, so the relationship is linear." :
                      "The y-values are multiplied by the same factor (" + (kind === "incexp" ? ys[1] / ys[0] : "1/" + ys[0] / ys[1]) + ") each time x goes up by 1, so the relationship is exponential.";
      return {
        type: "mc", order: "fixed",
        stem: "<p>The table shows several values of " + m("x") + " and their corresponding values of " + m("y") + ".</p>" + tbl + "<p>Which of the following best describes the relationship between " + m("x") + " and " + m("y") + "?</p>",
        choices: ["inclin", "declin", "incexp", "decexp"].map(function (k) { return { t: labels[k], key: k, ok: k === kind, why: why }; }),
        explain: ["Differences between consecutive y-values: " + diffs.join(", ") + ".", why],
        desmos: { steps: ["Type " + m("x_1=[0,1,2,3,4]") + " and " + m("y_1=" + dzList(ys)) + ".", "Try " + m("y_1\\sim mx_1+b") + " and " + m("y_1\\sim ab^{x_1}") + ". The model that fits exactly has " + m("R^{2}=1") + "."],
                  exprs: ["x_1=[0,1,2,3,4]", "y_1=" + dzList(ys), "(x_1,y_1)", "y_1\\sim mx_1+b", "y_1\\sim ab^{x_1}"], bounds: { left: -1, right: 5, bottom: Math.min.apply(null, ys) - 5, top: Math.max.apply(null, ys) + 10 } },
        data: { ys: ys, kind: kind }
      };
    },
    check: function (q) {
      var ys = q.data.ys, d = ys.slice(1).map(function (y, i) { return y - ys[i]; }), r = ys.slice(1).map(function (y, i) { return y / ys[i]; });
      var lin = d.every(function (v) { return v === d[0]; }), ex = r.every(function (v) { return Math.abs(v - r[0]) < 1e-12; });
      var kind = lin ? (d[0] > 0 ? "inclin" : "declin") : ex ? (r[0] > 1 ? "incexp" : "decexp") : "?";
      if (q.choices[q.answer].key !== kind) fail("model kind");
      return true;
    }
  });

  // ================================================================ Probability
  var TWOWAY = [
    { rows: ["9th grade", "10th grade"], cols: ["Basketball", "Soccer", "Track"], noun: "student", all: "all the students in the table",
      intro: "A group of students was asked to choose a favorite sport. The table shows the results by grade.",
      groupRow: function (r) { return "the students in " + r; }, groupCol: function (c) { return "the students who chose " + c.toLowerCase(); },
      isRow: function (r) { return "is in " + r; }, isCol: function (c) { return "chose " + c.toLowerCase(); } },
    { rows: ["Fertilizer A", "Fertilizer B"], cols: ["Short", "Medium", "Tall"], noun: "plant", all: "all the plants in the table",
      intro: "A gardener grew plants with two kinds of fertilizer and classified each plant by height. The table shows the results.",
      groupRow: function (r) { return "the plants given " + r; }, groupCol: function (c) { return "the plants classified as " + c.toLowerCase(); },
      isRow: function (r) { return "was given " + r; }, isCol: function (c) { return "is classified as " + c.toLowerCase(); } },
    { rows: ["Under 30", "30 or older"], cols: ["Phone", "Laptop", "Tablet"], noun: "person", all: "all the people surveyed",
      intro: "People at a library were asked which device they prefer for reading. The table shows the results by age group.",
      groupRow: function (r) { return "the people in the “" + r.toLowerCase() + "” age group"; }, groupCol: function (c) { return "the people who prefer a " + c.toLowerCase(); },
      isRow: function (r) { return "is in the “" + r.toLowerCase() + "” age group"; }, isCol: function (c) { return "prefers a " + c.toLowerCase(); } }
  ];
  add({
    id: "prob.twoway", skill: "psda.prob", levels: [2, 3], title: "Probability from a two-way table",
    gen: function (R) {
      var c = R.pick(TWOWAY), cells, ask, ans, ri, ci, num, den;
      for (var t = 0; t < 300; t++) {
        cells = [[R.int(5, 30), R.int(5, 30), R.int(5, 30)], [R.int(5, 30), R.int(5, 30), R.int(5, 30)]];
        ri = R.int(0, 1); ci = R.int(0, 2); ask = R.pick(["row", "col", "all"]);
        var rowT = cells[ri][0] + cells[ri][1] + cells[ri][2], colT = cells[0][ci] + cells[1][ci], all = rowT + cells[1 - ri][0] + cells[1 - ri][1] + cells[1 - ri][2];
        num = cells[ri][ci]; den = ask === "row" ? rowT : ask === "col" ? colT : all;
        ans = Fr(num, den);
        if (S.fitsGrid(ans)) break;
      }
      var rt = cells.map(function (r) { return r[0] + r[1] + r[2]; }), ct = [0, 1, 2].map(function (j) { return cells[0][j] + cells[1][j]; }), grand = rt[0] + rt[1];
      var tbl = S.table([""].concat(c.cols).concat(["Total"]), cells.map(function (r, i) { return [c.rows[i]].concat(r.map(String)).concat([String(rt[i])]); }).concat([["Total"].concat(ct.map(String)).concat([String(grand)])]), { firstCol: true });
      var rName = c.rows[ri], cName = c.cols[ci];
      var q = ask === "row" ? "If one of " + c.groupRow(rName) + " is selected at random, what is the probability that the " + c.noun + " " + c.isCol(cName) + "?" :
              ask === "col" ? "If one of " + c.groupCol(cName) + " is selected at random, what is the probability that the " + c.noun + " " + c.isRow(rName) + "?" :
                              "If one of " + c.all + " is selected at random, what is the probability that the " + c.noun + " " + c.isRow(rName) + " and " + c.isCol(cName) + "?";
      var group = ask === "row" ? c.groupRow(rName) + " (" + rt[ri] + " in all)" : ask === "col" ? c.groupCol(cName) + " (" + ct[ci] + " in all)" : c.all + " (" + grand + ")";
      var match = ask === "row" ? c.isCol(cName) : ask === "col" ? c.isRow(rName) : c.isRow(rName) + " and " + c.isCol(cName);
      return {
        type: "spr",
        stem: "<p>" + c.intro + "</p>" + tbl + "<p>" + q + "</p>",
        answer: ans,
        explain: ["The selection is made only from " + group + ". That total is the denominator.",
                  "Of those, " + num + " " + match.replace(/\bis\b/g, "are").replace(/\bwas\b/g, "were").replace(/\bprefers\b/g, "prefer") +
                  ". So the probability is " + m("\\frac{" + num + "}{" + den + "}" + (ans.d !== den ? " = " + tx(ans) : "")) + ". " + H.gridTip(ans)],
        desmos: calc("\\frac{" + num + "}{" + den + "}", approx(ans), "Enter the fraction " + num + "/" + den + " or a decimal that fills the answer box."),
        data: { cells: cells, ri: ri, ci: ci, ask: ask }
      };
    },
    check: function (q) {
      var d = q.data, c = d.cells, n = c[d.ri][d.ci];
      var den = d.ask === "row" ? c[d.ri].reduce(function (a, b) { return a + b; }, 0) : d.ask === "col" ? c[0][d.ci] + c[1][d.ci] : c[0].concat(c[1]).reduce(function (a, b) { return a + b; }, 0);
      return eqAns(q, Fr(n, den));
    }
  });

  add({
    id: "prob.basic", skill: "psda.prob", levels: [1, 2], title: "Simple probability and expected counts",
    gen: function (R, L) {
      if (L === 1 || R.chance(0.5)) {
        var r, b, g, ans, not = R.pick(["red", "blue", "green"]);
        for (var t = 0; t < 100; t++) { r = R.int(2, 15); b = R.int(2, 15); g = R.int(2, 15); ans = Fr(r + b + g - { red: r, blue: b, green: g }[not], r + b + g); if (S.fitsGrid(ans)) break; }
        var tot = r + b + g, cnt = tot - { red: r, blue: b, green: g }[not];
        return {
          type: "spr",
          stem: "<p>A bag contains " + r + " red marbles, " + b + " blue marbles, and " + g + " green marbles. If one marble is chosen at random, what is the probability that it is not " + not + "?</p>",
          answer: ans,
          explain: ["There are " + m(r + " + " + b + " + " + g + " = " + tot) + " marbles. The ones that aren't " + not + ": " + m(tx(cnt)) + ".",
                    "Probability: " + m("\\frac{" + cnt + "}{" + tot + "}" + (ans.d !== tot ? " = " + tx(ans) : "")) + ". " + H.gridTip(ans)],
          desmos: calc("\\frac{" + cnt + "}{" + tot + "}", approx(ans)),
          data: { mode: "bag", r: r, b: b, g: g, not: not }
        };
      }
      var p = R.pick([0.02, 0.025, 0.04, 0.05, 0.015, 0.08]), N = R.pick([400, 800, 1200, 2000, 3000, 3600]), ex = Fr.mul(p, N);
      return {
        type: "spr",
        stem: "<p>The probability that a randomly selected light bulb from a factory is defective is " + fm.num(p) + ". Based on this probability, how many defective bulbs would be expected in a shipment of " + fm.num(N) + " bulbs?</p>",
        answer: ex,
        explain: ["Expected number = probability × number of trials: " + m(td(p) + "\\cdot " + tx(N) + " = " + tx(ex)) + "."],
        desmos: calc(S.decStr(p) + "\\cdot " + N, tx(ex)),
        data: { mode: "expect", p: p, N: N }
      };
    },
    check: function (q) {
      var d = q.data;
      if (d.mode === "expect") return eqAns(q, Fr.mul(d.p, d.N));
      var tot = d.r + d.b + d.g;
      return eqAns(q, Fr(tot - d[d.not === "red" ? "r" : d.not === "blue" ? "b" : "g"], tot));
    }
  });

  // ================================================================ Inference from samples
  var SURVEY = [
    { pop: "residents of a city", short: "residents", claim: "support building a new park" },
    { pop: "students at a large high school", short: "students", claim: "would prefer a later start time" },
    { pop: "customers of a grocery chain", short: "customers", claim: "would use a delivery service" },
    { pop: "registered voters in a county", short: "voters", claim: "plan to vote in the next election" }
  ];
  add({
    id: "infer.moe", skill: "psda.infer", levels: [2], title: "Margin of error",
    gen: function (R) {
      var c = R.pick(SURVEY), N = R.pick([300, 400, 500, 600, 800, 1000]), p = R.int(35, 70), e = R.pick([3, 4, 5, 6]);
      if (R.chance(0.65)) {
        return {
          type: "mc",
          stem: "<p>A random sample of " + fm.num(N) + " " + c.pop + " was surveyed, and " + p + "% of those surveyed said they " + c.claim + ". The margin of error for this estimate is " + e + " percentage points. Which of the following is the most appropriate conclusion?</p>",
          choices: [
            { t: "It is plausible that between " + (p - e) + "% and " + (p + e) + "% of all " + c.pop + " " + c.claim + ".", ok: true },
            { t: "Exactly " + p + "% of all " + c.pop + " " + c.claim + ".", why: "A sample only gives an estimate. The margin of error says the true percent for everyone could reasonably be anywhere from " + (p - e) + "% to " + (p + e) + "%." },
            { t: "Between " + (p - e) + "% and " + (p + e) + "% of the " + fm.num(N) + " " + c.short + " surveyed " + c.claim + ".", why: "For the people in the sample, the percent is known exactly: " + p + "%. The margin of error is about all " + c.pop + "." },
            { t: "It is plausible that between " + p + "% and " + (p + e) + "% of all " + c.pop + " " + c.claim + ".", why: "The margin of error goes both ways: from " + (p - e) + "% up to " + (p + e) + "%." }
          ],
          explain: ["A margin of error of " + e + " points means the true percent for the whole population is plausibly within " + e + " points of the sample's " + p + "%.",
                    "So the plausible range is " + (p - e) + "% to " + (p + e) + "%, and it applies to all " + c.pop + ", not just the people surveyed."],
          desmos: calc(p + "-" + e, String(p - e), "and " + m(p + "+" + e) + " gives " + m(String(p + e)) + ": the plausible range."),
          data: { kind: "range" }
        };
      }
      return {
        type: "mc",
        stem: "<p>A random sample of " + fm.num(N) + " " + c.pop + " was surveyed to estimate the percent who " + c.claim + ". The estimate had a margin of error of " + e + " percentage points. Which change to the survey would most likely produce a smaller margin of error?</p>",
        choices: [
          { t: "Survey a larger random sample of " + c.pop + ".", ok: true },
          { t: "Survey a smaller random sample of " + c.pop + ".", why: "Smaller samples give larger margins of error, not smaller ones." },
          { t: "Survey only " + c.short + " who are likely to answer yes.", why: "That makes the sample biased. It doesn't make the estimate more precise for all " + c.pop + "." },
          { t: "Survey the same " + c.short + " a second time.", why: "Asking the same people again doesn't add new information about the population." }
        ],
        explain: ["The margin of error shrinks as the random sample gets larger, because a bigger random sample tends to land closer to the true population percent."],
        desmos: null,
        data: { kind: "size" }
      };
    },
    check: function (q) { if (!q.choices[q.answer].ok) fail("moe"); return true; }
  });

  var EST = [
    { pop: "students at a high school", who: "students", act: "walk to school" },
    { pop: "trees in a forest preserve", who: "trees", act: "show signs of a beetle infestation" },
    { pop: "households in a town", who: "households", act: "have a pet dog" },
    { pop: "phones produced at a factory one week", who: "phones", act: "have a defective screen" }
  ];
  add({
    id: "infer.estimate", skill: "psda.infer", levels: [1, 2], title: "Estimate a population from a sample",
    gen: function (R) {
      var c = R.pick(EST), n = R.pick([40, 50, 60, 80, 100, 120, 200]), mult = R.int(5, 30), N = n * mult, k = R.int(3, Math.floor(n * 0.6));
      return {
        type: "spr",
        stem: "<p>A random sample of " + n + " " + c.who + " was selected from the " + fm.num(N) + " " + c.pop + ". Of the " + c.who + " in the sample, " + k + " " + c.act + ". Based on the sample, about how many of the " + fm.num(N) + " " + c.who + " " + c.act + "?</p>",
        answer: k * mult,
        explain: ["In the sample, the fraction is " + m("\\frac{" + k + "}{" + n + "}") + ". Because the sample was random, the same fraction is a good estimate for the whole group.",
                  m("\\frac{" + k + "}{" + n + "}\\cdot " + tx(N) + " = " + tx(k * mult)) + "."],
        desmos: calc("\\frac{" + k + "}{" + n + "}\\cdot " + N, tx(k * mult)),
        data: { n: n, N: N, k: k }
      };
    },
    check: function (q) { var d = q.data; return eqAns(q, Fr(d.k * d.N, d.n)); }
  });

  // ================================================================ Evaluating statistical claims
  var STUDY = [
    { pop: "students at a large high school", popAll: "students at the school", subj: "students", one: "student", rel: "who", treat: "using a study app for 30 minutes a day", assignTo: "use a study app for 30 minutes a day",
      did: "used the app", each: "used a study app for 30 minutes a day", outcome: "earned higher test scores", eff: "higher test scores" },
    { pop: "adults in a city", popAll: "adults in the city", subj: "adults", one: "adult", rel: "who", treat: "taking a vitamin D supplement daily", assignTo: "take a vitamin D supplement daily",
      did: "took the supplement", each: "took a vitamin D supplement daily", outcome: "had fewer colds over the winter", eff: "fewer colds" },
    { pop: "tomato plants on a large farm", popAll: "tomato plants on the farm", subj: "plants", one: "plant", rel: "that", treat: "receiving a new organic fertilizer", assignTo: "receive a new organic fertilizer",
      did: "received the fertilizer", each: "had been given a new organic fertilizer", outcome: "grew taller", eff: "taller plants" },
    { pop: "employees at a large company", popAll: "employees at the company", subj: "employees", one: "employee", rel: "who", treat: "taking a 10-minute walk at lunch", assignTo: "take a 10-minute walk at lunch",
      did: "took the walk", each: "took a 10-minute walk at lunch", outcome: "reported lower stress", eff: "lower stress" }
  ];
  add({
    id: "claims.study", skill: "psda.claims", levels: [2, 3], title: "What can a study conclude?",
    gen: function (R) {
      var c = R.pick(STUDY), sample = R.chance(0.5), assign = R.chance(0.5), n = R.pick([100, 200, 300, 400]);
      var s1 = sample ? "A researcher selected a random sample of " + n + " " + c.pop + "." : "A researcher recruited " + n + " " + c.pop + " who volunteered for a study.";
      var s2 = assign ? "Half of the " + c.subj + " were randomly assigned to " + c.assignTo + ", and the other half were not." :
                        "The researcher recorded whether each " + c.one + " " + c.each + ".";
      var s3 = "The " + c.subj + " " + c.rel + " " + (assign ? c.did : c.each) + " " + c.outcome + ", on average, than the others, and the difference was large enough that it is unlikely to be due to chance.";
      function claim(cause, general) {
        var who = general ? "all " + c.popAll : c.subj + " like those in the study";
        return cause ? cap(c.treat) + " causes " + c.eff + " for " + who + "." : cap(c.treat) + " is associated with " + c.eff + " for " + who + ", but the study can't show that it causes " + c.eff + ".";
      }
      var combos = [[true, true], [true, false], [false, true], [false, false]];
      var choices = combos.map(function (cb) {
        var reasons = [];
        if (cb[0] && !assign) reasons.push("Only random assignment to groups shows cause and effect. Here the " + c.subj + " weren't randomly assigned, so the study shows only an association.");
        if (!cb[0] && assign) reasons.push("The " + c.subj + " were randomly assigned to groups, so the study can show cause and effect.");
        if (cb[1] && !sample) reasons.push("The " + c.subj + " volunteered instead of being randomly selected, so the results can't be extended to all " + c.popAll + ".");
        if (!cb[1] && sample) reasons.push("The " + c.subj + " were a random sample of " + c.pop + ", so the results can be extended to all " + c.popAll + ".");
        return { t: claim(cb[0], cb[1]), ok: cb[0] === assign && cb[1] === sample, why: reasons.join(" "), key: cb.join(",") };
      });
      return {
        type: "mc", order: "fixed",
        stem: "<p>" + s1 + " " + s2 + " " + s3 + "</p><p>Which of the following is the most appropriate conclusion?</p>",
        choices: choices,
        explain: [(assign ? "The " + c.subj + " were randomly assigned to groups, so a cause-and-effect conclusion is allowed." : "Nobody was randomly assigned to a group, so the study can only show an association, not cause and effect."),
                  (sample ? "They were a random sample of " + c.pop + ", so the conclusion can apply to all " + c.popAll + "." : "They were volunteers, not a random sample, so the conclusion applies only to " + c.subj + " like those in the study."),
                  "Random assignment → cause and effect. Random sampling → generalize to the population."],
        desmos: null,
        data: { sample: sample, assign: assign }
      };
    },
    check: function (q) { var d = q.data; if (q.choices[q.answer].key !== [d.assign, d.sample].join(",")) fail("study conclusion"); return true; }
  });
})(typeof window !== "undefined" ? window : globalThis);
