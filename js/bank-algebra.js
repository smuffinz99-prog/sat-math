/* SAT Math question templates: Algebra.
   Each template builds a new question from a seed: the answer comes from the numbers it chose, wrong choices
   come from real mistakes (each says which mistake), and there's a worked solution plus a Desmos method.
   check() re-verifies the answer a different way; tests/verify.js runs it on thousands of seeds. */
(function (G) {
  "use strict";
  var S = G.SATM, Fr = S.Fr, fm = S.fmt, tx = fm.tex, td = fm.texd, A = S.alg, m = S.m, dm = S.dm, M = S.M;
  var add = S.addTemplate;

  // ---------------------------------------------------------------- helpers shared by every bank
  var REL = { lt: "\\lt ", le: "\\le ", gt: "\\gt ", ge: "\\ge " };  // for display (safe inside HTML); the space stops "\gt x" becoming "\gtx"
  var DREL = { lt: "<", le: "\\le ", gt: ">", ge: "\\ge " };       // for Desmos
  var FLIP = { lt: "gt", le: "ge", gt: "lt", ge: "le" };
  function holds(rel, a, b) { var c = Fr.cmp(a, b); return rel === "lt" ? c < 0 : rel === "le" ? c <= 0 : rel === "gt" ? c > 0 : c >= 0; }
  function fail(msg) { throw new Error(msg); }
  function pr(v) { v = Fr.of(v); return v.n < 0 ? "(" + tx(v) + ")" : tx(v); }          // parenthesize negatives
  function approx(v) {                                                               // how Desmos shows a number
    var d = S.decStr(v);
    if (d !== null && (d.split(".")[1] || "").length <= 3) return d.replace("-", "−");
    return String(Math.round(Fr.val(v) * 1000) / 1000).replace("-", "−");
  }
  function numChoices(ans, cands, R, show, fallback, defWhy) {
    show = show || function (v) { return m(tx(v)); };
    var ds = S.distinct(ans, cands, 3, R, fallback);
    defWhy = defWhy || "This value doesn't work. Put it back into the problem and check: it doesn't give what the question describes.";
    return [{ t: show(Fr.of(ans)), v: Fr.of(ans), ok: true }].concat(ds.map(function (d) { return { t: show(d.v), v: d.v, why: d.why || defWhy }; }));
  }
  // The answer must make diff(x) zero; for multiple choice, no wrong choice may.
  function rootCheck(q, diff) {
    var ans = q.type === "mc" ? q.choices[q.answer].v : q.answer;
    if (Fr.of(diff(ans)).n !== 0) fail("the answer doesn't satisfy the equation");
    if (q.type === "mc") q.choices.forEach(function (c, i) { if (i !== q.answer && Fr.of(diff(c.v)).n === 0) fail("a wrong choice also satisfies the equation"); });
    return true;
  }
  function eqAns(q, v) { var a = q.type === "mc" ? q.choices[q.answer].v : q.answer; if (!Fr.eq(a, v)) fail("expected " + S.decStr(v) + " got " + JSON.stringify(a)); return true; }
  // "Graph both sides" Desmos method.
  function both(lhs, rhs, xs, ys, extra) {
    var st = ["Type the left side as " + m("y=" + lhs) + " and the right side as " + m("y=" + rhs) + ", each on its own line.",
              "Click the point where the two graphs cross. Its x-coordinate is the solution" + (Fr.isInt(xs) ? ": " + m("x=" + tx(xs)) + "." : ". Desmos shows it as a decimal, about " + approx(xs) + ".")];
    if (extra) st.push(extra);
    return { steps: st, exprs: ["y=" + lhs, "y=" + rhs], bounds: S.bounds([[xs, ys]]) };
  }
  function gridTip(v) {
    v = Fr.of(v);
    if (Fr.isInt(v)) return "";
    var f = S.answerForms(v);
    if (f.length < 2) return f.length ? "Enter it as " + f[0] + "." : "";
    return "To enter it, type " + f[0] + (Fr.places(v) >= 0 ? " or " + f.slice(1).join(" or ") : " or a decimal that fills the answer box, like " + f.slice(1).join(" or ")) + ".";
  }
  function sysTex(a, b) { return "\\begin{aligned}" + a.replace(" = ", " &= ").replace(" " + "\\le" + " ", " &\\le ") + "\\\\" + b.replace(" = ", " &= ") + "\\end{aligned}"; }
  S.H = { REL: REL, DREL: DREL, FLIP: FLIP, holds: holds, fail: fail, pr: pr, approx: approx, numChoices: numChoices,
          rootCheck: rootCheck, eqAns: eqAns, both: both, gridTip: gridTip };

  // ================================================================ Linear equations in one variable
  add({
    id: "lin1.solve", skill: "alg.lin1", levels: [1, 2, 3], title: "Solve a linear equation",
    gen: function (R, L) {
      var a, b, c, d, x0, lhs, rhs;
      if (L === 1) {
        a = R.sign() * R.int(2, 9); x0 = R.int(-12, 12); b = R.nz(-20, 20); c = a * x0 + b;
        lhs = A.lin(a, b); rhs = tx(c);
        return {
          type: "spr",
          stem: "<p>" + dm(lhs + " = " + rhs) + "</p><p>What value of " + m("x") + " is the solution to the given equation?</p>",
          answer: x0,
          explain: [
            (b > 0 ? "Subtract " + m(tx(b)) + " from" : "Add " + m(tx(-b)) + " to") + " both sides: " + m(A.lin(a, 0) + " = " + tx(c - b)) + ".",
            "Divide both sides by " + m(tx(a)) + ": " + m("x = " + tx(x0)) + "."
          ],
          desmos: both(lhs, rhs, x0, c),
          data: { form: 1, a: a, b: b, c: c }
        };
      }
      if (L === 2) {
        a = R.sign() * R.int(2, 9); b = R.nz(-9, 9); x0 = R.int(-10, 10);
        do { c = R.nz(-9, 9); } while (c === a);
        d = a * (x0 + b) - c * x0;
        lhs = tx(a) + "(" + A.shift("x", b) + ")"; rhs = A.lin(c, d);
        var cands = [
          { v: Fr(d - b, a - c), why: "That's what you get if you multiply only the " + m("x") + " by " + m(tx(a)) + " and forget to multiply the " + m(tx(b)) + " by it too." },
          a + c !== 0 ? { v: Fr(d - a * b, a + c), why: "That's what you get if you move the x-term to the left side without changing its sign." } : null,
          { v: Fr(d + a * b, a - c), why: "That's what you get if you move " + m(tx(a * b)) + " to the right side without changing its sign." }
        ];
        return {
          type: "mc",
          stem: "<p>" + dm(lhs + " = " + rhs) + "</p><p>What value of " + m("x") + " satisfies the equation?</p>",
          choices: numChoices(x0, cands, R, null, null, "Substitute this value into the original equation: the two sides don't come out equal."),
          explain: [
            "Distribute on the left: " + m(A.lin(a, a * b) + " = " + rhs) + ".",
            "Collect the x-terms on the left and the numbers on the right: " + m(A.lin(a - c, 0) + " = " + tx(d - a * b)) + ".",
            "Divide by " + m(tx(a - c)) + ": " + m("x = " + tx(x0)) + "."
          ],
          desmos: both(lhs, rhs, x0, a * (x0 + b)),
          data: { form: 2, a: a, b: b, c: c, d: d }
        };
      }
      var p, k, g, e;
      for (var tries = 0; tries < 80; tries++) {
        a = R.int(2, 5); p = R.int(1, 4); b = R.nz(-7, 7); k = R.int(1, 4); g = R.nz(-7, 7); e = R.int(-10, 10);
        x0 = Fr(e + k * g - a * b, a * p + k);
        if (!Fr.isInt(x0) && S.fitsGrid(x0)) break;
      }
      lhs = tx(a) + "(" + A.lin(p, b) + ")";
      rhs = (e !== 0 ? tx(e) + " - " : "-") + (k === 1 ? "" : tx(k)) + "(" + A.shift("x", -g) + ")";
      return {
        type: "spr",
        stem: "<p>" + dm(lhs + " = " + rhs) + "</p><p>What is the solution to the given equation?</p>",
        answer: x0,
        explain: [
          "Distribute on both sides: " + m(A.lin(a * p, a * b) + " = " + A.lin(-k, e + k * g)) + ".",
          "Move the x-terms to the left and the numbers to the right: " + m(A.lin(a * p + k, 0) + " = " + tx(e + k * g - a * b)) + ".",
          "Divide by " + m(tx(a * p + k)) + ": " + m("x = " + tx(x0)) + ". " + gridTip(x0)
        ],
        desmos: both(lhs, rhs, x0, Fr.mul(a, Fr.add(Fr.mul(p, x0), b)), gridTip(x0)),
        data: { form: 3, a: a, p: p, b: b, k: k, g: g, e: e }
      };
    },
    check: function (q) {
      var d = q.data;
      return rootCheck(q, function (x) {
        if (d.form === 1) return Fr.sub(Fr.add(Fr.mul(d.a, x), d.b), d.c);
        if (d.form === 2) return Fr.sub(Fr.mul(d.a, Fr.add(x, d.b)), Fr.add(Fr.mul(d.c, x), d.d));
        return Fr.sub(Fr.mul(d.a, Fr.add(Fr.mul(d.p, x), d.b)), Fr.sub(d.e, Fr.mul(d.k, Fr.sub(x, d.g))));
      });
    }
  });

  var RATE_CTX = [
    { s: "A plumber charges a one-time fee of {F} plus {r} per hour of work. The total cost of a repair job was {T}. For how many hours did the plumber work?",
      money: true, x: "hours of work", F: function (R) { return R.step(40, 95, 5); }, r: function (R, L) { return L === 1 ? R.int(25, 60) : R.pick([32.5, 37.5, 42.5, 47.5]); }, h: [2, 9] },
    { s: "A gym charges a {F} sign-up fee plus {r} per month. Alex has paid the gym a total of {T}. For how many months has Alex been a member?",
      money: true, x: "months", F: function (R) { return R.step(20, 75, 5); }, r: function (R, L) { return L === 1 ? R.int(15, 45) : R.pick([19.5, 24.5, 29.5, 34.5]); }, h: [3, 14] },
    { s: "Priya has {F} in a savings account. At the end of each week, she adds {r} to the account. After how many weeks will the account contain {T}?",
      money: true, x: "weeks", F: function (R) { return R.step(100, 400, 25); }, r: function (R, L) { return L === 1 ? R.int(15, 40) : R.pick([12.5, 17.5, 22.5, 27.5]); }, h: [4, 20] },
    { s: "A tank contains {F} gallons of water. Water is pumped into the tank at a constant rate of {r} gallons per minute. After how many minutes will the tank contain {T} gallons?",
      x: "minutes", F: function (R) { return R.int(20, 150); }, r: function (R, L) { return L === 1 ? R.int(3, 15) : R.pick([2.5, 3.5, 4.5, 7.5]); }, h: [4, 30] },
    { s: "A candle is {F} centimeters tall. As it burns, its height decreases at a constant rate of {r} centimeters per hour. After how many hours will the candle be {T} centimeters tall?",
      down: true, x: "hours", F: function (R) { return R.int(24, 36); }, r: function (R, L) { return L === 1 ? R.pick([1, 2, 3]) : R.pick([1.5, 2.5, 0.5]); }, h: [2, 10] },
    { s: "An elevator is {F} feet above the ground. It descends at a constant rate of {r} feet per second. After how many seconds will it be {T} feet above the ground?",
      down: true, x: "seconds", F: function (R) { return R.step(150, 400, 10); }, r: function (R, L) { return L === 1 ? R.int(5, 15) : R.pick([7.5, 12.5, 2.5]); }, h: [4, 20] }
  ];
  add({
    id: "lin1.context", skill: "alg.lin1", levels: [1, 2], title: "Linear equation word problem",
    gen: function (R, L) {
      var c = R.pick(RATE_CTX), F = c.F(R), r = c.r(R, L), h, T;
      for (var i = 0; i < 50; i++) {
        h = R.int(c.h[0], c.h[1]);
        T = c.down ? Fr.sub(F, Fr.mul(r, h)) : Fr.add(F, Fr.mul(r, h));
        if (!c.down || Fr.val(T) >= 3) break;
      }
      var show = c.money ? fm.money : fm.num;
      var stem = c.s.replace("{F}", show(F)).replace("{r}", show(r)).replace("{T}", show(T));
      var model = A.expr([[F, ""], [c.down ? Fr.neg(r) : r, "x"]], true);
      return {
        type: "spr",
        stem: "<p>" + stem + "</p>",
        answer: h,
        explain: [
          "Let " + m("x") + " be the number of " + c.x + ". The amount after " + m("x") + " " + c.x.split(" ")[0] + " is " + m(model) + ".",
          "Set it equal to " + m(td(T)) + ": " + m(model + " = " + td(T)) + ".",
          (c.down ? "Subtract " + m(td(F)) + " and divide by " + m("-" + td(r)) : "Subtract " + m(td(F)) + " and divide by " + m(td(r))) + ": " + m("x = " + tx(h)) + "."
        ],
        desmos: {
          steps: ["Let x be the number of " + c.x + ". Type " + m("y=" + model) + " for the amount after x " + c.x.split(" ")[0] + ", and " + m("y=" + td(T)) + ".",
                  "Click where the line crosses " + m("y=" + td(T)) + ": the x-coordinate is " + m(tx(h)) + "."],
          exprs: ["y=" + model, "y=" + td(T)],
          bounds: S.bounds([[0, F], [h, T], [h * 1.4, T]])
        },
        data: { F: F, r: r, T: T, down: !!c.down }
      };
    },
    check: function (q) {
      var d = q.data, h = q.answer;
      var v = d.down ? Fr.sub(d.F, Fr.mul(d.r, h)) : Fr.add(d.F, Fr.mul(d.r, h));
      if (!Fr.eq(v, d.T)) fail("total doesn't match");
      if (Fr.val(h) <= 0) fail("non-positive count");
      return true;
    }
  });

  add({
    id: "lin1.nsol", skill: "alg.lin1", levels: [2, 3], title: "Number of solutions",
    gen: function (R, L) {
      if (L === 2 || R.chance(0.35)) {
        var p = R.int(2, 6), q = R.nz(-5, 5), r = R.nz(-9, 9), s = R.nz(-9, 9);
        var slope = p * q, icpt = p * r + s, kind = R.pick(["one", "none", "inf"]), t, u;
        if (kind === "one") { do { t = R.nz(-12, 12); } while (t === slope); u = R.int(-20, 20); }
        else { t = slope; if (kind === "inf") u = icpt; else { do { u = R.int(-20, 20); } while (u === icpt); } }
        var lhs = tx(p) + "(" + A.lin(q, r) + ")" + (s > 0 ? " + " + s : " - " + (-s));
        var rhs = A.lin(t, u), disguised = false, g = S.gcd(t, u);
        if (u !== 0 && g > 1 && R.chance(0.6)) { rhs = tx(g) + "(" + A.lin(t / g, u / g) + ")"; disguised = true; }
        var truth = {
          inf: "Both sides simplify to the same expression, so every value of " + m("x") + " makes the equation true.",
          none: "The x-terms are the same on both sides but the constants are different, so the two sides are never equal.",
          one: "The x-coefficients are different, so exactly one value of " + m("x") + " makes the sides equal."
        };
        var labels = { one: "Exactly one solution", two: "Exactly two solutions", inf: "Infinitely many solutions", none: "No solution" };
        var choices = ["one", "two", "inf", "none"].map(function (key) {
          return { t: labels[key], key: key, ok: key === kind, why: key === "two" ? "A linear equation can't have exactly two solutions. It has none, one, or infinitely many." : truth[kind] };
        });
        var ex = ["Simplify the left side: " + m(lhs + " = " + A.lin(slope, icpt)) + "."];
        if (disguised) ex.push("Simplify the right side: " + m(rhs + " = " + A.lin(t, u)) + ".");
        if (kind === "inf") ex.push("Both sides are " + m(A.lin(slope, icpt)) + ", so the equation is true for every " + m("x") + ": infinitely many solutions.");
        else if (kind === "none") ex.push("Both sides have " + m(A.lin(slope, 0)) + ", but the constants differ. Subtracting " + m(A.lin(slope, 0)) + " from both sides leaves " + m(tx(icpt) + " = " + tx(u)) + ", which is false: no solution.");
        else ex.push("The x-coefficients " + m(tx(slope)) + " and " + m(tx(t)) + " are different, so there's exactly one solution (it's " + m("x = " + tx(Fr(u - icpt, slope - t))) + ").");
        var look = { inf: "You'll see only one line: the two graphs are the same line, so there are infinitely many solutions.",
                     none: "The lines are parallel and never meet, so there's no solution.",
                     one: "The lines cross at exactly one point, so there's exactly one solution." };
        return {
          type: "mc", order: "fixed",
          stem: "<p>" + dm(lhs + " = " + rhs) + "</p><p>How many solutions does the given equation have?</p>",
          choices: choices, explain: ex,
          desmos: { steps: ["Graph each side as its own line: " + m("y=" + lhs) + " and " + m("y=" + rhs) + ".", look[kind]], exprs: ["y=" + lhs, "y=" + rhs], bounds: S.bounds([[0, icpt], [3, slope * 3 + icpt]]) },
          data: { mode: "count", slope: slope, icpt: icpt, t: t, u: u, kind: kind }
        };
      }
      var a = R.sign() * R.int(2, 7), b = R.nz(-6, 6), c = R.nz(-6, 6), dd = R.nz(-9, 9), slope2, const2;
      for (var i = 0; i < 40; i++) { slope2 = a * b + dd; if (slope2 !== 0) break; dd = R.nz(-9, 9); }
      const2 = a * c;
      var lhs2 = tx(a) + "(" + A.lin(b, c) + ")" + A.term(dd, "x", false);
      var simp = A.lin(slope2, const2);
      if (R.chance(0.5)) {
        var e; do { e = R.int(-15, 15); } while (e === const2);
        var rhsN = A.expr([["k", "x"], [e, ""]]);
        return {
          type: "spr",
          stem: "<p>" + dm(lhs2 + " = " + rhsN) + "</p><p>In the given equation, " + m("k") + " is a constant. If the equation has no solution, what is the value of " + m("k") + "?</p>",
          answer: slope2,
          explain: [
            "Simplify the left side: " + m(lhs2 + " = " + simp) + ".",
            "A linear equation has no solution when the x-coefficients match but the constants don't. The constants are " + m(tx(const2)) + " and " + m(tx(e)) + ", which already differ.",
            "So the x-coefficients must match: " + m("k = " + tx(slope2)) + "."
          ],
          desmos: {
            steps: ["Type both sides as lines, with a slider for " + m("k") + ": " + m("y=" + lhs2) + ", " + m("y=" + rhsN) + " and " + m("k=1") + ".",
                    "Drag the slider. At " + m("k=" + tx(slope2)) + " the lines are parallel and never meet: that's no solution."],
            exprs: ["y=" + lhs2, "y=" + rhsN, "k=1"], bounds: S.bounds([[0, const2], [0, e]])
          },
          data: { mode: "none", slope2: slope2, const2: const2, e: e, a: a, b: b, c: c, dd: dd }
        };
      }
      var rhsJ = A.expr([[slope2, "x"], ["j", ""]]);
      return {
        type: "spr",
        stem: "<p>" + dm(lhs2 + " = " + rhsJ) + "</p><p>In the given equation, " + m("j") + " is a constant. If the equation has infinitely many solutions, what is the value of " + m("j") + "?</p>",
        answer: const2,
        explain: [
          "Simplify the left side: " + m(lhs2 + " = " + simp) + ".",
          "An equation has infinitely many solutions when both sides are identical. The x-coefficients already match (" + m(tx(slope2)) + "), so the constants must match too.",
          "So " + m("j = " + tx(const2)) + "."
        ],
        desmos: {
          steps: ["Type both sides with a slider for " + m("j") + ": " + m("y=" + lhs2) + ", " + m("y=" + rhsJ) + " and " + m("j=0") + ".",
                  "Drag the slider until the two lines lie on top of each other. That happens at " + m("j=" + tx(const2)) + "."],
          exprs: ["y=" + lhs2, "y=" + rhsJ, "j=0"], bounds: S.bounds([[0, const2]])
        },
        data: { mode: "inf", slope2: slope2, const2: const2, a: a, b: b, c: c, dd: dd }
      };
    },
    check: function (q) {
      var d = q.data;
      if (d.mode === "count") {
        var kind = d.t !== d.slope ? "one" : d.u === d.icpt ? "inf" : "none";
        if (kind !== d.kind || q.choices[q.answer].key !== kind) fail("wrong solution count");
        return true;
      }
      if (d.a * d.b + d.dd !== d.slope2 || d.a * d.c !== d.const2) fail("simplification");
      if (d.mode === "none") { if (d.e === d.const2) fail("constants match"); return eqAns(q, Fr(d.slope2)); }
      return eqAns(q, Fr(d.const2));
    }
  });

  // ================================================================ Linear functions
  add({
    id: "linfn.eval", skill: "alg.linfn", levels: [1, 2], title: "Evaluate a linear function",
    gen: function (R, L) {
      var den = L === 1 ? 1 : R.pick([2, 3, 4]), num = R.nz(-6, 6);
      while (S.gcd(num, den) !== 1) num = R.nz(-7, 7);
      var sl = Fr(num, den), b = R.int(-15, 15), fx = "f(x) = " + A.lin(sl, b), fxD = "f(x)=" + A.lin(sl, b);
      if (R.chance(0.5)) {
        var p = den * R.nz(-6, 6), val = Fr.add(Fr.mul(sl, p), b);
        return {
          type: "spr",
          stem: "<p>The function " + m("f") + " is defined by " + m(fx) + ". What is the value of " + m("f(" + tx(p) + ")") + "?</p>",
          answer: val,
          explain: ["Substitute " + m("x = " + tx(p)) + ": " + m("f(" + tx(p) + ") = " + tx(sl) + pr(p).replace(/^(?!\()/, "(").replace(/([^)])$/, "$1)") + A.term(b, "", false) + " = " + tx(val)) + "."],
          desmos: { steps: ["Type " + m(fx) + ".", "On the next line, type " + m("f(" + tx(p) + ")") + ". Desmos shows the value: " + m(tx(val)) + "."], exprs: [fxD, "f(" + tx(p) + ")"] },
          data: { mode: "eval", sl: sl, b: b, p: p }
        };
      }
      var x0 = den * R.nz(-6, 6), Y = Fr.add(Fr.mul(sl, x0), b);
      return {
        type: "spr",
        stem: "<p>The function " + m("f") + " is defined by " + m(fx) + ". For what value of " + m("x") + " does " + m("f(x) = " + tx(Y)) + "?</p>",
        answer: x0,
        explain: [
          "Set the function equal to " + m(tx(Y)) + ": " + m(A.lin(sl, b) + " = " + tx(Y)) + ".",
          "Subtract " + m(pr(b)) + ": " + m(A.lin(sl, 0) + " = " + tx(Fr.sub(Y, b))) + ". Divide by " + m(tx(sl)) + ": " + m("x = " + tx(x0)) + "."
        ],
        desmos: { steps: ["Type " + m("y=" + A.lin(sl, b)) + " and " + m("y=" + tx(Y)) + ".", "Click where they cross: " + m("x = " + tx(x0)) + "."],
                  exprs: ["y=" + A.lin(sl, b), "y=" + tx(Y)], bounds: S.bounds([[x0, Y]]) },
        data: { mode: "solve", sl: sl, b: b, Y: Y }
      };
    },
    check: function (q) {
      var d = q.data;
      if (d.mode === "eval") return eqAns(q, Fr.add(Fr.mul(d.sl, d.p), d.b));
      return rootCheck(q, function (x) { return Fr.sub(Fr.add(Fr.mul(d.sl, x), d.b), d.Y); });
    }
  });

  var SLOPES3 = [[1, 2], [3, 2], [2, 3], [3, 4], [5, 2], [4, 3], [-1, 2], [-3, 2], [-2, 3], [-3, 4], [-5, 2], [-4, 3]];
  function lineTex(l) { return m("f(x) = " + A.lin(l.m, l.b)); }
  function sameLine(a, b) { return Fr.eq(a.m, b.m) && Fr.eq(a.b, b.b); }
  function lineChoices(right, cands) {
    var out = [Object.assign({ ok: true }, right)], k = 1;
    cands.forEach(function (c) { if (c && out.length < 4 && !out.some(function (o) { return sameLine(o, c); })) out.push(c); });
    while (out.length < 4) {
      var f = { m: right.m, b: Fr.add(right.b, k % 2 ? Math.ceil(k / 2) : -Math.ceil(k / 2)), why: "This has the right slope but the wrong y-intercept." };
      k++;
      if (!out.some(function (o) { return sameLine(o, f); })) out.push(f);
    }
    return out.map(function (l) { return { t: lineTex(l), ok: !!l.ok, why: l.why, line: { m: l.m, b: l.b } }; });
  }
  add({
    id: "linfn.twopoints", skill: "alg.linfn", levels: [2, 3], title: "Linear function from two values",
    gen: function (R, L) {
      var sl = L === 2 ? Fr(R.nz(-6, 6)) : Fr(R.pick(SLOPES3)[0], 1), x1, x2;
      if (L === 3) { var pick = R.pick(SLOPES3); sl = Fr(pick[0], pick[1]); }
      var den = sl.d, b = Fr(R.int(-10, 10));
      do { x1 = den * R.nz(-5, 5); x2 = den * R.nz(-5, 5); } while (x1 === x2);
      var y1 = Fr.add(Fr.mul(sl, x1), b), y2 = Fr.add(Fr.mul(sl, x2), b);
      var given = "<p>For the linear function " + m("f") + ", " + m("f(" + tx(x1) + ") = " + tx(y1)) + " and " + m("f(" + tx(x2) + ") = " + tx(y2)) + ".";
      var ex = [
        "Slope: " + m("m = \\frac{" + tx(y2) + " - " + pr(y1) + "}{" + tx(x2) + " - " + pr(x1) + "} = " + tx(sl)) + ".",
        "Use a point to find the y-intercept: " + m(tx(y1) + " = " + tx(sl) + "(" + tx(x1) + ") + b") + ", so " + m("b = " + tx(b)) + ".",
        "So " + m("f(x) = " + A.lin(sl, b)) + "."
      ];
      var desmos = {
        steps: ["Enter the two points as lists: " + m("x_1=[" + tx(x1) + "," + tx(x2) + "]") + " and " + m("y_1=[" + tx(y1) + "," + tx(y2) + "]") + ".",
                "Type " + m("y_1\\sim mx_1+b") + ". Desmos fits the line and shows " + m("m=" + approx(sl)) + " and " + m("b=" + approx(b)) + "."],
        exprs: ["x_1=[" + tx(x1) + "," + tx(x2) + "]", "y_1=[" + tx(y1) + "," + tx(y2) + "]", "(x_1,y_1)", "y_1\\sim mx_1+b"],
        bounds: S.bounds([[x1, y1], [x2, y2]])
      };
      if (R.chance(0.6)) {
        function through(mm, why) { return { m: mm, b: Fr.sub(y1, Fr.mul(mm, x1)), why: why }; }
        var cands = [];
        if (!Fr.eq(Fr.abs(sl), 1)) cands.push(through(Fr.div(1, sl), "This uses the change in x divided by the change in y. Slope is the change in y divided by the change in x."));
        cands.push({ m: sl, b: Fr.add(y1, Fr.mul(sl, x1)), why: "This has the right slope, but the y-intercept has a sign error: " + m("b = f(x) - mx") + ", not " + m("f(x) + mx") + "." });
        cands.push(through(Fr.neg(sl), "This line passes through one of the points but slopes the wrong way."));
        return { type: "mc", stem: given + " Which equation defines " + m("f") + "?</p>", choices: lineChoices({ m: sl, b: b }, cands), explain: ex, desmos: desmos,
                 data: { mode: "which", x1: x1, y1: y1, x2: x2, y2: y2 } };
      }
      var x3; do { x3 = den * R.nz(-6, 6); } while (x3 === x1 || x3 === x2);
      var y3 = Fr.add(Fr.mul(sl, x3), b);
      ex.push("Then " + m("f(" + tx(x3) + ") = " + tx(sl) + "(" + tx(x3) + ")" + A.term(b, "", false) + " = " + tx(y3)) + ".");
      desmos.steps.push("Type " + m("mx+b") + " with " + m("x") + " replaced: " + m("m\\cdot " + pr(x3) + "+b") + ". Desmos shows " + m(tx(y3)) + ".");
      desmos.exprs.push("m\\cdot " + pr(x3) + "+b");
      return { type: "spr", stem: given + " What is the value of " + m("f(" + tx(x3) + ")") + "?</p>", answer: y3, explain: ex, desmos: desmos,
               data: { mode: "value", x1: x1, y1: y1, x2: x2, y2: y2, x3: x3 } };
    },
    check: function (q) {
      var d = q.data;
      function on(l, x, y) { return Fr.eq(Fr.add(Fr.mul(l.m, x), l.b), y); }
      var sl = Fr.div(Fr.sub(d.y2, d.y1), Fr.sub(d.x2, d.x1)), b = Fr.sub(d.y1, Fr.mul(sl, d.x1));
      if (d.mode === "value") return eqAns(q, Fr.add(Fr.mul(sl, d.x3), b));
      q.choices.forEach(function (c, i) {
        var fits = on(c.line, d.x1, d.y1) && on(c.line, d.x2, d.y2);
        if ((i === q.answer) !== fits) fail("line choice " + i + " wrong");
      });
      return true;
    }
  });

  var INTERP = [
    { v: "C", x: "h", down: false, desc: "gives the total cost " + m("C") + ", in dollars, to rent a kayak for " + m("h") + " hours",
      F: function (R) { return R.step(15, 60, 5); }, r: function (R) { return R.int(8, 25); },
      rate: "The cost, in dollars, for each hour the kayak is rented", init: "The fee, in dollars, charged no matter how many hours the kayak is rented",
      total: "The total cost, in dollars, to rent the kayak", input: "The number of hours the kayak is rented" },
    { v: "W", x: "t", down: true, desc: "gives the amount of water " + m("W") + ", in liters, left in a tank " + m("t") + " minutes after the tank starts to drain",
      F: function (R) { return R.step(200, 900, 50); }, r: function (R) { return R.int(5, 30); },
      rate: "The number of liters of water that drain from the tank each minute", init: "The amount of water, in liters, in the tank before it starts to drain",
      total: "The amount of water, in liters, left in the tank after " + m("t") + " minutes", input: "The number of minutes since the tank started to drain" },
    { v: "H", x: "w", down: false, desc: "gives the height " + m("H") + ", in centimeters, of a plant " + m("w") + " weeks after it was planted",
      F: function (R) { return R.int(2, 12); }, r: function (R) { return R.pick([1.5, 2, 2.5, 3, 3.5]); },
      rate: "The number of centimeters the plant grows each week", init: "The height, in centimeters, of the plant when it was planted",
      total: "The height, in centimeters, of the plant " + m("w") + " weeks after it was planted", input: "The number of weeks since the plant was planted" },
    { v: "P", x: "d", down: false, desc: "gives the price " + m("P") + ", in dollars, of a taxi ride that is " + m("d") + " miles long",
      F: function (R) { return R.pick([2.5, 3, 3.25, 3.75, 4.5]); }, r: function (R) { return R.pick([1.75, 2, 2.25, 2.75, 3.25]); },
      rate: "The price, in dollars, for each mile of the ride", init: "The price, in dollars, charged before the ride covers any distance",
      total: "The total price, in dollars, of a " + m("d") + "-mile ride", input: "The number of miles the ride covers" },
    { v: "B", x: "d", down: true, desc: "gives the balance " + m("B") + ", in dollars, left on a transit card after " + m("d") + " days of commuting",
      F: function (R) { return R.step(60, 150, 10); }, r: function (R) { return R.pick([3, 4, 4.5, 5, 6.5]); },
      rate: "The amount, in dollars, spent on commuting each day", init: "The balance, in dollars, on the card before any commuting",
      total: "The balance, in dollars, left on the card after " + m("d") + " days", input: "The number of days of commuting" }
  ];
  add({
    id: "linfn.interpret", skill: "alg.linfn", levels: [1, 2], title: "Interpret slope and intercept",
    gen: function (R) {
      var c = R.pick(INTERP), F = c.F(R), r = c.r(R), ask = R.pick(["rate", "init"]);
      var eq = c.v + " = " + td(F) + (c.down ? " - " : " + ") + td(r) + c.x;
      var num = ask === "rate" ? r : F;
      var why = {
        rate: "That describes " + m(td(r)) + ", the number multiplied by " + m(c.x) + ".",
        init: "That describes " + m(td(F)) + ", the value when " + m(c.x + " = 0") + ".",
        total: "That's " + m(c.v) + ", the value of the whole right side, not one number in it.",
        input: "That's " + m(c.x) + ", the variable itself."
      };
      var choices = ["rate", "init", "total", "input"].map(function (k) { return { t: c[k], key: k, ok: k === ask, why: why[k] }; });
      var dz = "y=" + td(F) + (c.down ? "-" : "+") + td(r) + "x";
      return {
        type: "mc",
        stem: "<p>The equation " + m(eq) + " " + c.desc + ". What is the best interpretation of " + m(td(num)) + " in this context?</p>",
        choices: choices,
        explain: [
          "In " + m(c.v + " = " + (c.down ? "a - b" : "a + b") + c.x) + ", the number on its own (" + m(td(F)) + ") is the starting value, when " + m(c.x + " = 0") + ".",
          "The number multiplied by " + m(c.x) + " (" + m(td(r)) + ") is the rate: how much " + m(c.v) + " " + (c.down ? "decreases" : "increases") + " for each 1 unit of " + m(c.x) + ".",
          "So " + m(td(num)) + " is: " + c[ask].charAt(0).toLowerCase() + c[ask].slice(1) + "."
        ],
        desmos: {
          steps: ["Graph " + m(dz) + ". The y-intercept, " + m("(0, " + td(F) + ")") + ", is the starting value.",
                  "Move 1 unit to the right along the line: " + m("y") + " changes by " + m(td(r)) + ". That's the rate."],
          exprs: [dz], bounds: { left: -1, right: 12, bottom: Math.min(0, Fr.val(F) - 12 * Fr.val(r)) - 2, top: Math.max(Fr.val(F) + 12 * Fr.val(r), Fr.val(F)) + 4 }
        },
        data: { ask: ask }
      };
    },
    check: function (q) { if (q.choices[q.answer].key !== q.data.ask) fail("interpretation mismatch"); return true; }
  });

  var GSLOPES = [[1, 1], [2, 1], [3, 1], [1, 2], [1, 3], [2, 3], [3, 2], [-1, 1], [-2, 1], [-3, 1], [-1, 2], [-1, 3], [-2, 3], [-3, 2]];
  add({
    id: "linfn.graph", skill: "alg.linfn", levels: [1, 2], title: "Read a line from its graph",
    gen: function (R, L) {
      var s, b, px, py, sl;
      for (var i = 0; i < 100; i++) {
        s = R.pick(GSLOPES); sl = Fr(s[0], s[1]); b = R.int(-5, 5);
        px = s[1] * R.pick([1, 2, -1, -2]); py = b + s[0] * px / s[1];
        if (Math.abs(py) <= 7 && px !== 0) break;
      }
      var fval = Fr.val(sl), alt = "A line in the xy-plane that passes through the points (0, " + b + ") and (" + px + ", " + py + ").";
      var figure = S.fig.plane({ xmin: -8, xmax: 8, ymin: -8, ymax: 8, curves: [{ f: function (x) { return fval * x + b; } }], points: [[0, b], [px, py]], alt: alt });
      var ex = ["The line passes through " + m("(0, " + tx(b) + ")") + " and " + m("(" + tx(px) + ", " + tx(py) + ")") + ".",
                "Slope: " + m("\\frac{" + tx(py) + " - " + pr(b) + "}{" + tx(px) + " - 0} = " + tx(sl)) + ". The y-intercept is " + m(tx(b)) + "."];
      var desmos = {
        steps: ["Read two points from the graph: " + m("(0, " + tx(b) + ")") + " and " + m("(" + tx(px) + ", " + tx(py) + ")") + ".",
                "Enter them as lists and fit a line: " + m("x_1=[0," + tx(px) + "]") + ", " + m("y_1=[" + tx(b) + "," + tx(py) + "]") + ", " + m("y_1\\sim mx_1+b") + "."],
        exprs: ["x_1=[0," + tx(px) + "]", "y_1=[" + tx(b) + "," + tx(py) + "]", "(x_1,y_1)", "y_1\\sim mx_1+b"],
        bounds: { left: -8, right: 8, bottom: -8, top: 8 }
      };
      var data = { pts: [[0, b], [px, py]] };
      if (L === 1 || R.chance(0.5)) {
        var cands = [{ m: Fr.neg(sl), b: Fr(b), why: "This line slopes the wrong way. The graph " + (fval > 0 ? "rises" : "falls") + " from left to right." }];
        if (Math.abs(fval) !== 1) cands.push({ m: Fr.div(1, sl), b: Fr(b), why: "This uses the run over the rise. Slope is the rise over the run." });
        if (b !== 0) cands.push({ m: sl, b: Fr(-b), why: "The y-intercept has the wrong sign: the graph crosses the y-axis at " + m(tx(b)) + "." });
        cands.push({ m: Fr.mul(sl, 2), b: Fr(b), why: "This line is twice as steep as the graph." });
        ex.push("So " + m("f(x) = " + A.lin(sl, b)) + ".");
        data.mode = "which";
        return { type: "mc", stem: figure + "<p>The graph of the linear function " + m("f") + " is shown. Which equation defines " + m("f") + "?</p>",
                 choices: lineChoices({ m: sl, b: Fr(b) }, cands), explain: ex, desmos: desmos, data: data, alt: alt };
      }
      data.mode = "slope"; data.sl = sl;
      return { type: "spr", stem: figure + "<p>The graph of the linear function " + m("f") + " is shown. What is the slope of the graph of " + m("y = f(x)") + "?</p>",
               answer: sl, explain: ex, desmos: desmos, data: data, alt: alt };
    },
    check: function (q) {
      var d = q.data, p = d.pts, sl = Fr.div(Fr.sub(p[1][1], p[0][1]), Fr.sub(p[1][0], p[0][0]));
      if (d.mode === "slope") return eqAns(q, sl);
      q.choices.forEach(function (c, i) {
        var fits = p.every(function (pt) { return Fr.eq(Fr.add(Fr.mul(c.line.m, pt[0]), c.line.b), pt[1]); });
        if ((i === q.answer) !== fits) fail("graph choice " + i);
      });
      return true;
    }
  });

  // ================================================================ Linear equations in two variables
  var COMBO = [
    { money: true, a: function (R) { return R.pick([2.5, 3, 3.5, 4, 4.5]); }, b: function (R) { return R.pick([0.75, 1, 1.25, 1.5]); },
      intro: function (a, b, T) { return "A store sells notebooks for " + fm.money(a) + " each and pens for " + fm.money(b) + " each. Sam spent exactly " + fm.money(T) + " on notebooks and pens."; },
      vars: "where " + m("x") + " is the number of notebooks and " + m("y") + " is the number of pens Sam bought", ask: function (n) { return "If Sam bought " + n + " notebooks, how many pens did Sam buy?"; } },
    { a: function (R) { return R.pick([3, 3.5, 4, 4.5]); }, b: function (R) { return R.pick([1.5, 2, 2.5]); },
      intro: function (a, b, T) { return "A bakery uses " + fm.num(a) + " cups of flour for each loaf of bread and " + fm.num(b) + " cups of flour for each batch of muffins. Yesterday it used " + fm.num(T) + " cups of flour making bread and muffins."; },
      vars: "where " + m("x") + " is the number of loaves and " + m("y") + " is the number of batches of muffins", ask: function (n) { return "If the bakery made " + n + " loaves of bread, how many batches of muffins did it make?"; } },
    { money: true, a: function (R) { return R.int(12, 20); }, b: function (R) { return R.int(6, 11); },
      intro: function (a, b, T) { return "A theater charges " + fm.money(a) + " for an adult ticket and " + fm.money(b) + " for a student ticket. One evening it collected " + fm.money(T) + " from ticket sales."; },
      vars: "where " + m("x") + " is the number of adult tickets and " + m("y") + " is the number of student tickets sold", ask: function (n) { return "If the theater sold " + n + " adult tickets, how many student tickets did it sell?"; } },
    { a: function (R) { return R.pick([3, 3.5, 4]); }, b: function (R) { return R.pick([1.5, 2, 2.5]); },
      intro: function (a, b, T) { return "On a hike, Dana walked at " + fm.num(a) + " miles per hour on flat ground and " + fm.num(b) + " miles per hour uphill. She covered a total of " + fm.num(T) + " miles."; },
      vars: "where " + m("x") + " is the number of hours she walked on flat ground and " + m("y") + " is the number of hours she walked uphill", ask: function (n) { return "If Dana walked on flat ground for " + n + " hours, for how many hours did she walk uphill?"; } }
  ];
  add({
    id: "lin2.combo", skill: "alg.lin2", levels: [1, 2], title: "Model with ax + by = c",
    gen: function (R) {
      var c = R.pick(COMBO), a = c.a(R), b = c.b(R), x0 = R.int(2, 12), y0 = R.int(2, 12);
      var T = Fr.add(Fr.mul(a, x0), Fr.mul(b, y0)), eq = td(a) + "x + " + td(b) + "y = " + td(T), eqD = td(a) + "x+" + td(b) + "y=" + td(T);
      if (R.chance(0.5)) {
        var choices = [
          { t: m(eq), ok: true },
          { t: m(td(b) + "x + " + td(a) + "y = " + td(T)), why: "This swaps the two amounts, so each " + m("x") + " gets the other item's value." },
          { t: m("(" + td(a) + " + " + td(b) + ")(x + y) = " + td(T)), why: "This counts both amounts for every item." },
          { t: m("\\frac{x}{" + td(a) + "} + \\frac{y}{" + td(b) + "} = " + td(T)), why: "Dividing by the amount per item doesn't give the total. Multiply the number of items by the amount per item." }
        ];
        return {
          type: "mc",
          stem: "<p>" + c.intro(a, b, T) + " Which equation represents this situation, " + c.vars + "?</p>",
          choices: choices,
          explain: ["Each of the " + m("x") + " items contributes " + m(td(a)) + ", so they contribute " + m(td(a) + "x") + " in total. The " + m("y") + " items contribute " + m(td(b) + "y") + ".",
                    "The two parts add up to " + m(td(T)) + ": " + m(eq) + "."],
          desmos: { steps: ["Graph " + m(eqD) + ". Every point on the line with whole-number coordinates is a combination that matches the story, such as " + m("(" + x0 + ", " + y0 + ")") + "."],
                    exprs: [eqD, "(" + x0 + "," + y0 + ")"], bounds: { left: -1, right: Fr.val(T) / Fr.val(a) + 2, bottom: -1, top: Fr.val(T) / Fr.val(b) + 2 } },
          data: { mode: "model" }
        };
      }
      return {
        type: "spr",
        stem: "<p>" + c.intro(a, b, T) + " " + c.ask(x0) + "</p>",
        answer: y0,
        explain: ["Write the equation: " + m(eq) + ", " + c.vars + ".",
                  "Substitute " + m("x = " + x0) + ": " + m(td(Fr.mul(a, x0)) + " + " + td(b) + "y = " + td(T)) + ", so " + m(td(b) + "y = " + td(Fr.sub(T, Fr.mul(a, x0)))) + " and " + m("y = " + y0) + "."],
        desmos: { steps: ["Type " + m(eqD) + " and " + m("x=" + x0) + ".", "Click where they cross: " + m("(" + x0 + ", " + y0 + ")") + ". The answer is the y-coordinate."],
                  exprs: [eqD, "x=" + x0], bounds: { left: -1, right: Fr.val(T) / Fr.val(a) + 2, bottom: -1, top: Fr.val(T) / Fr.val(b) + 2 } },
        data: { mode: "solve", a: a, b: b, T: T, x0: x0 }
      };
    },
    check: function (q) {
      var d = q.data;
      if (d.mode === "model") { if (!q.choices[q.answer].ok) fail("model"); return true; }
      if (!Fr.eq(Fr.add(Fr.mul(d.a, d.x0), Fr.mul(d.b, q.answer)), d.T)) fail("combo total");
      return true;
    }
  });

  add({
    id: "lin2.slopeint", skill: "alg.lin2", levels: [2], title: "Slope and intercepts from standard form",
    gen: function (R) {
      var a, b, c, ask, ans;
      for (var i = 0; i < 80; i++) {
        a = R.nz(-9, 9); b = R.nz(-9, 9); c = R.nz(-30, 30); ask = R.pick(["slope", "yint", "xint"]);
        ans = ask === "slope" ? Fr(-a, b) : ask === "yint" ? Fr(c, b) : Fr(c, a);
        if (S.fitsGrid(ans) && Math.abs(a) !== Math.abs(b)) break;
      }
      var eq = A.expr([[a, "x"], [b, "y"]]) + " = " + tx(c), eqD = A.expr([[a, "x"], [b, "y"]]) + "=" + tx(c);
      var what = { slope: "slope of the graph of", yint: "y-coordinate of the y-intercept of the graph of", xint: "x-coordinate of the x-intercept of the graph of" }[ask];
      var ex = ask === "xint"
        ? ["At the x-intercept, " + m("y = 0") + ": " + m(A.lin(a, 0) + " = " + tx(c)) + ".", "So " + m("x = " + tx(ans)) + "."]
        : ["Solve for " + m("y") + ": " + m(A.lin(b, 0, "y") + " = " + A.lin(-a, c)) + ", so " + m("y = " + A.lin(Fr(-a, b), Fr(c, b))) + ".",
           ask === "slope" ? "In " + m("y = mx + b") + " form, the slope is the coefficient of " + m("x") + ": " + m(tx(ans)) + "." : "The y-intercept is the constant: " + m(tx(ans)) + "."];
      return {
        type: "spr",
        stem: "<p>In the xy-plane, what is the " + what + " " + m(eq) + "?</p>",
        answer: ans, explain: ex,
        desmos: {
          steps: ["Type " + m(eqD) + ". Click the line: Desmos marks its x- and y-intercepts with gray points.",
                  ask === "slope" ? "Use the two intercepts " + m("(" + tx(Fr(c, a)) + ", 0)") + " and " + m("(0, " + tx(Fr(c, b)) + ")") + ": slope = rise ÷ run = " + m(tx(ans)) + "."
                                  : "Read the intercept: " + m(ask === "yint" ? "(0, " + tx(ans) + ")" : "(" + tx(ans) + ", 0)") + " (Desmos shows it as about " + approx(ans) + ")."],
          exprs: [eqD], bounds: S.bounds([[Fr(c, a), 0], [0, Fr(c, b)]])
        },
        data: { a: a, b: b, c: c, ask: ask }
      };
    },
    check: function (q) {
      var d = q.data, a = q.answer;
      if (d.ask === "slope") { // two points on the line, rise over run
        var p1 = [0, Fr(d.c, d.b)], p2 = [d.b, Fr(d.c - d.a * d.b, d.b)];
        return eqAns(q, Fr.div(Fr.sub(p2[1], p1[1]), Fr.sub(p2[0], p1[0])));
      }
      if (d.ask === "yint") { if (!Fr.eq(Fr.mul(d.b, a), Fr(d.c))) fail("y-intercept"); return true; }
      if (!Fr.eq(Fr.mul(d.a, a), Fr(d.c))) fail("x-intercept");
      return true;
    }
  });

  var PSLOPES = [Fr(2), Fr(3), Fr(-2), Fr(-3), Fr(1, 2), Fr(-1, 2), Fr(2, 3), Fr(-2, 3), Fr(3, 4), Fr(-3, 4), Fr(4), Fr(-4)];
  add({
    id: "lin2.parallel", skill: "alg.lin2", levels: [2, 3], title: "Parallel and perpendicular lines",
    gen: function (R, L) {
      var mm, b0, p, q, mk, ans, perp = L === 3;
      for (var i = 0; i < 80; i++) {
        mm = R.pick(PSLOPES); b0 = R.int(-8, 8); p = R.nz(-6, 6); q = R.int(-9, 9);
        mk = perp ? Fr.div(-1, mm) : mm; ans = Fr.sub(q, Fr.mul(mk, p));
        if (S.fitsGrid(ans) && !Fr.eq(ans, b0)) break;
      }
      var lk = "y=" + tx(mk) + "(" + A.shift("x", -p) + ")" + A.term(q, "", false);
      return {
        type: "spr",
        stem: "<p>In the xy-plane, line " + m("\\ell") + " has the equation " + m("y = " + A.lin(mm, b0)) + ". Line " + m("k") + " is " + (perp ? "perpendicular" : "parallel") +
              " to line " + m("\\ell") + " and passes through the point " + m("(" + tx(p) + ", " + tx(q) + ")") + ". What is the y-coordinate of the y-intercept of line " + m("k") + "?</p>",
        answer: ans,
        explain: [
          perp ? "Perpendicular slopes multiply to " + m("-1") + ", so line " + m("k") + " has slope " + m("-\\frac{1}{" + tx(mm) + "} = " + tx(mk)) + "."
               : "Parallel lines have the same slope, so line " + m("k") + " has slope " + m(tx(mk)) + ".",
          "Point-slope form through " + m("(" + tx(p) + ", " + tx(q) + ")") + ": " + m(lk.replace("y=", "y = ")) + ".",
          "Set " + m("x = 0") + ": " + m("y = " + tx(mk) + "(" + tx(-p) + ")" + A.term(q, "", false) + " = " + tx(ans)) + "."
        ],
        desmos: {
          steps: ["Type line " + m("k") + " in point-slope form: " + m(lk) + ". Desmos graphs it right away.",
                  "Click where it crosses the y-axis: " + m("(0, " + approx(ans) + ")") + ". (Line " + m("\\ell") + " is there for comparison.)"],
          exprs: [lk, "y=" + A.lin(mm, b0)], bounds: S.bounds([[p, q], [0, ans]])
        },
        data: { mm: mm, p: p, q: q, perp: perp }
      };
    },
    check: function (q) {
      var d = q.data, mk = d.perp ? Fr.div(-1, d.mm) : d.mm;
      if (d.perp && !Fr.eq(Fr.mul(mk, d.mm), -1)) fail("not perpendicular");
      // the line through (p, q) with slope mk must hit (0, answer)
      if (!Fr.eq(Fr.div(Fr.sub(d.q, q.answer), Fr(d.p)), mk)) fail("intercept");
      return true;
    }
  });

  // ================================================================ Systems of linear equations
  add({
    id: "sys.solve", skill: "alg.sys", levels: [1, 2], title: "Solve a system of equations",
    gen: function (R, L) {
      var x0 = R.int(-8, 8), y0 = R.int(-8, 8), eq1, eq2, d1, d2, ex, A1, B1, C1, A2, B2, C2;
      if (L === 1) {
        var mm = R.nz(-5, 5), bb = y0 - mm * x0;
        do { A2 = R.nz(-6, 6); B2 = R.nz(-6, 6); } while (A2 * 1 === -mm * B2);
        C2 = A2 * x0 + B2 * y0;
        A1 = -mm; B1 = 1; C1 = bb;
        eq1 = "y = " + A.lin(mm, bb); eq2 = A.expr([[A2, "x"], [B2, "y"]]) + " = " + tx(C2);
        ex = ["Substitute " + m(A.lin(mm, bb)) + " for " + m("y") + " in the second equation: " + m(A.term(A2, "x", true) + (B2 > 0 ? " + " : " - ") + (Math.abs(B2) === 1 ? "" : Math.abs(B2)) + "(" + A.lin(mm, bb) + ") = " + tx(C2)) + ".",
              "Simplify: " + m(A.lin(A2 + B2 * mm, B2 * bb) + " = " + tx(C2)) + ", so " + m("x = " + tx(x0)) + ".",
              "Then " + m("y = " + tx(mm) + "(" + tx(x0) + ")" + A.term(bb, "", false) + " = " + tx(y0)) + "."];
      } else {
        do { A1 = R.nz(-7, 7); B1 = R.nz(-7, 7); A2 = R.nz(-7, 7); B2 = R.nz(-7, 7); } while (A1 * B2 - A2 * B1 === 0 || (Math.abs(A1) === Math.abs(A2) && Math.abs(B1) === Math.abs(B2)));
        C1 = A1 * x0 + B1 * y0; C2 = A2 * x0 + B2 * y0;
        eq1 = A.expr([[A1, "x"], [B1, "y"]]) + " = " + tx(C1); eq2 = A.expr([[A2, "x"], [B2, "y"]]) + " = " + tx(C2);
        ex = ["Eliminate " + m("y") + ": multiply the first equation by " + m(tx(B2)) + " and the second by " + m(tx(B1)) + ", then subtract.",
              "That leaves " + m(A.lin(A1 * B2 - A2 * B1, 0) + " = " + tx(C1 * B2 - C2 * B1)) + ", so " + m("x = " + tx(x0)) + ".",
              "Substitute into the first equation: " + m(tx(A1) + "(" + tx(x0) + ")" + A.term(B1, "y", false) + " = " + tx(C1)) + ", so " + m("y = " + tx(y0)) + "."];
      }
      var asks = L === 1 ? ["x", "y", "x + y"] : ["x", "y", "x + y", "x - y"], ask = R.pick(asks);
      var ans = ask === "x" ? x0 : ask === "y" ? y0 : ask === "x + y" ? x0 + y0 : x0 - y0;
      if (ask.length > 1) ex.push("So " + m(ask + " = " + tx(x0) + (ask === "x + y" ? " + " : " - ") + pr(y0) + " = " + tx(ans)) + ".");
      d1 = eq1.replace(/ /g, ""); d2 = eq2.replace(/ /g, "");
      return {
        type: "spr",
        stem: "<p>" + dm(sysTex(eq1, eq2)) + "</p><p>The solution to the given system of equations is " + m("(x, y)") + ". What is the value of " + m(ask) + "?</p>",
        answer: ans, explain: ex,
        desmos: { steps: ["Type each equation on its own line.", "Click the point where the lines cross: " + m("(" + tx(x0) + ", " + tx(y0) + ")") + "." + (ask.length > 1 ? " Then work out " + m(ask) + "." : "")],
                  exprs: [d1, d2], bounds: S.bounds([[x0, y0]]) },
        data: { A1: A1, B1: B1, C1: C1, A2: A2, B2: B2, C2: C2, ask: ask }
      };
    },
    check: function (q) {
      var d = q.data, det = d.A1 * d.B2 - d.A2 * d.B1;
      if (det === 0) fail("singular");
      var x = Fr(d.C1 * d.B2 - d.C2 * d.B1, det), y = Fr(d.A1 * d.C2 - d.A2 * d.C1, det);
      var want = d.ask === "x" ? x : d.ask === "y" ? y : d.ask === "x + y" ? Fr.add(x, y) : Fr.sub(x, y);
      return eqAns(q, want);
    }
  });

  var LAMS = [Fr(2), Fr(3), Fr(-2), Fr(4), Fr(-3), Fr(1, 2), Fr(3, 2), Fr(-1, 2)];
  add({
    id: "sys.nsol", skill: "alg.sys", levels: [2, 3], title: "Systems with no or infinitely many solutions",
    gen: function (R, L) {
      var a, b, c, lam;
      for (var i = 0; i < 100; i++) {
        a = R.nz(-6, 6); b = R.nz(-6, 6); c = R.nz(-12, 12); lam = R.pick(LAMS);
        if (Fr.isInt(Fr.mul(lam, a)) && Fr.isInt(Fr.mul(lam, b)) && Fr.isInt(Fr.mul(lam, c)) && !(a === b)) break;
      }
      var k = Fr.mul(lam, a), e = Fr.mul(lam, b), g0 = Fr.mul(lam, c);
      var eq1 = A.expr([[a, "x"], [b, "y"]]) + " = " + tx(c);
      var variant = L === 2 ? R.pick(["none-k", "inf-k", "count"]) : R.pick(["none-k", "inf-k", "inf-g", "count"]);
      var why = "The coefficients in the second equation are " + m(tx(lam)) + " times the coefficients in the first";
      if (variant === "count") {
        var kind = R.pick(["one", "none", "inf"]), A2 = k, B2 = e, C2 = g0;
        if (kind === "none") { do { C2 = Fr(R.int(-20, 20)); } while (Fr.eq(C2, g0)); }
        if (kind === "one") { do { B2 = Fr(R.nz(-9, 9)); } while (Fr.eq(B2, e)); }
        var eq2 = A.expr([[A2, "x"], [B2, "y"]]) + " = " + tx(C2);
        var labels = { one: "Exactly one solution", two: "Exactly two solutions", inf: "Infinitely many solutions", none: "No solution" };
        var truth = { one: "The lines have different slopes, so they cross at exactly one point.",
                      none: "The second equation's left side is " + m(tx(lam)) + " times the first's, but its constant isn't, so the lines are parallel.",
                      inf: "The second equation is exactly " + m(tx(lam)) + " times the first, so both describe the same line." };
        return {
          type: "mc", order: "fixed",
          stem: "<p>" + dm(sysTex(eq1, eq2)) + "</p><p>How many solutions does the given system of equations have?</p>",
          choices: ["one", "two", "inf", "none"].map(function (key) { return { t: labels[key], key: key, ok: key === kind, why: key === "two" ? "Two lines can't meet at exactly two points." : truth[kind] }; }),
          explain: [kind === "one" ? "Compare the ratios of the coefficients: " + m("\\frac{" + tx(A2) + "}{" + tx(a) + "}") + " and " + m("\\frac{" + tx(B2) + "}{" + tx(b) + "}") + " aren't equal, so the lines have different slopes."
                                   : why + " (" + m(tx(A2) + " = " + tx(lam) + "\\cdot " + pr(a)) + " and " + m(tx(B2) + " = " + tx(lam) + "\\cdot " + pr(b)) + "), so the lines are parallel or the same.",
                    truth[kind]],
          desmos: { steps: ["Graph both equations.", kind === "one" ? "The lines cross once: exactly one solution." : kind === "none" ? "The lines are parallel and never meet: no solution." : "You see only one line, because both equations draw the same line: infinitely many solutions."],
                    exprs: [eq1.replace(/ /g, ""), eq2.replace(/ /g, "")], bounds: { left: -10, right: 10, bottom: -10, top: 10 } },
          data: { mode: "count", a: a, b: b, c: c, A2: A2, B2: B2, C2: C2, kind: kind }
        };
      }
      var g, eqU, ans, ask, slider, look;
      if (variant === "none-k") { do { g = Fr(R.int(-20, 20)); } while (Fr.eq(g, g0)); eqU = A.expr([["k", "x"], [e, "y"]]) + " = " + tx(g); ans = k; ask = "no solution"; slider = "k=1"; look = "parallel and never meet"; }
      else if (variant === "inf-k") { g = g0; eqU = A.expr([["k", "x"], [e, "y"]]) + " = " + tx(g); ans = k; ask = "infinitely many solutions"; slider = "k=1"; look = "on top of each other"; }
      else { eqU = A.expr([[k, "x"], [e, "y"]]) + " = r"; ans = g0; ask = "infinitely many solutions"; slider = "r=0"; look = "on top of each other"; }
      var unk = variant === "inf-g" ? "r" : "k";
      var ex = variant === "none-k"
        ? ["Two lines have no point in common when they're parallel: the x- and y-coefficients are in the same ratio, but the constants aren't.",
           "The y-coefficient " + m(tx(e)) + " is " + m(tx(lam)) + " times " + m(pr(b)) + ", so " + m("k") + " must be " + m(tx(lam)) + " times " + m(pr(a)) + ": " + m("k = " + tx(k)) + ".",
           "Check: the constant " + m(tx(g)) + " isn't " + m(tx(lam) + "\\cdot " + pr(c) + " = " + tx(g0)) + ", so the lines are parallel, not the same line."]
        : variant === "inf-k"
          ? ["A system has infinitely many solutions when one equation is a multiple of the other.",
             "The y-coefficient " + m(tx(e)) + " and the constant " + m(tx(g)) + " are both " + m(tx(lam)) + " times the first equation's, so " + m("k = " + tx(lam) + "\\cdot " + pr(a) + " = " + tx(k)) + "."]
          : ["A system has infinitely many solutions when one equation is a multiple of the other.",
             "The coefficients " + m(tx(k)) + " and " + m(tx(e)) + " are " + m(tx(lam)) + " times " + m(pr(a)) + " and " + m(pr(b)) + ", so " + m("r = " + tx(lam) + "\\cdot " + pr(c) + " = " + tx(g0)) + "."];
      return {
        type: "spr",
        stem: "<p>" + dm(sysTex(eq1, eqU)) + "</p><p>In the given system of equations, " + m(unk) + " is a constant. If the system has " + ask + ", what is the value of " + m(unk) + "?</p>",
        answer: ans, explain: ex,
        desmos: { steps: ["Type both equations, then " + m(slider) + " to get a slider for " + m(unk) + ".", "Drag the slider until the lines are " + look + ". That happens at " + m(unk + "=" + tx(ans)) + "."],
                  exprs: [eq1.replace(/ /g, ""), eqU.replace(/ /g, ""), slider], bounds: { left: -10, right: 10, bottom: -10, top: 10 } },
        data: { mode: variant, a: a, b: b, c: c, e: e, g: g, k: k }
      };
    },
    check: function (q) {
      var d = q.data;
      if (d.mode === "count") {
        var det = Fr.sub(Fr.mul(d.a, d.B2), Fr.mul(d.A2, d.b));
        var kind = det.n !== 0 ? "one" : Fr.eq(Fr.mul(d.a, d.C2), Fr.mul(d.A2, d.c)) && Fr.eq(Fr.mul(d.b, d.C2), Fr.mul(d.B2, d.c)) ? "inf" : "none";
        if (kind !== d.kind || q.choices[q.answer].key !== kind) fail("count");
        return true;
      }
      var lam = Fr.div(d.e, d.b);
      if (d.mode === "inf-g") return eqAns(q, Fr.mul(lam, d.c));
      if (!Fr.eq(q.answer, Fr.mul(lam, d.a))) fail("k");
      var same = Fr.eq(d.g, Fr.mul(lam, d.c));
      if ((d.mode === "inf-k") !== same) fail("constant");
      return true;
    }
  });

  var SYSCTX = [
    function (R) {
      var a = R.int(12, 20), c = R.int(6, a - 3), x = R.int(40, 200), y = R.int(30, 200), ask = R.pick(["x", "y"]);
      return { stem: "A school theater sold " + fm.num(x + y) + " tickets to its spring play. Adult tickets cost " + fm.money(a) + " each and student tickets cost " + fm.money(c) + " each. The theater collected a total of " + fm.money(a * x + c * y) + ". How many " + (ask === "x" ? "adult" : "student") + " tickets did the theater sell?",
               vx: "the number of adult tickets", vy: "the number of student tickets", a: a, c: c, x: x, y: y, ask: ask };
    },
    function (R) {
      var x = R.int(8, 40), y = R.int(5, 30), ask = R.pick(["x", "y"]);
      return { stem: "A farm has only chickens and goats. Together the animals have " + (x + y) + " heads and " + (2 * x + 4 * y) + " legs. Each chicken has 2 legs and each goat has 4 legs. How many " + (ask === "x" ? "chickens" : "goats") + " are on the farm?",
               vx: "the number of chickens", vy: "the number of goats", a: 2, c: 4, x: x, y: y, ask: ask };
    },
    function (R) {
      var x = R.int(5, 40), y = R.int(5, 40), ask = R.pick(["x", "y"]);
      return { stem: "A jar contains only nickels and quarters: " + (x + y) + " coins worth a total of " + fm.money(Fr.add(Fr.mul(0.05, x), Fr.mul(0.25, y))) + ". Each nickel is worth " + fm.money(0.05) + " and each quarter is worth " + fm.money(0.25) + ". How many " + (ask === "x" ? "nickels" : "quarters") + " are in the jar?",
               vx: "the number of nickels", vy: "the number of quarters", a: 0.05, c: 0.25, x: x, y: y, ask: ask };
    },
    function (R) {
      var p1 = R.pick([6, 7, 8]), p2 = R.pick([12, 13, 14, 15]), x = R.int(5, 25), y = R.int(5, 25);
      return { stem: "A coffee shop mixes beans that cost " + fm.money(p1) + " per pound with beans that cost " + fm.money(p2) + " per pound to make " + (x + y) + " pounds of a blend. The beans in the blend cost a total of " + fm.money(p1 * x + p2 * y) + ". How many pounds of the " + fm.money(p2) + "-per-pound beans are in the blend?",
               vx: "the pounds of " + fm.money(p1) + " beans", vy: "the pounds of " + fm.money(p2) + " beans", a: p1, c: p2, x: x, y: y, ask: "y" };
    }
  ];
  add({
    id: "sys.context", skill: "alg.sys", levels: [2], title: "System of equations word problem",
    gen: function (R) {
      var s = R.pick(SYSCTX)(R), N = s.x + s.y, T = Fr.add(Fr.mul(s.a, s.x), Fr.mul(s.c, s.y)), ans = s.ask === "x" ? s.x : s.y;
      var e2 = td(s.a) + "x + " + td(s.c) + "y = " + td(T);
      return {
        type: "spr",
        stem: "<p>" + s.stem + "</p>",
        answer: ans,
        explain: [
          "Let " + m("x") + " be " + s.vx + " and " + m("y") + " be " + s.vy + ". Then " + m("x + y = " + tx(N)) + " and " + m(e2) + ".",
          "Multiply the first equation by " + m(td(s.c)) + " and subtract it from the second: " + m(td(Fr.sub(s.a, s.c)) + "x = " + td(Fr.sub(T, Fr.mul(s.c, N)))) + ", so " + m("x = " + s.x) + ".",
          "Then " + m("y = " + N + " - " + s.x + " = " + s.y) + ". The question asks for " + (s.ask === "x" ? s.vx : s.vy) + ": " + m(tx(ans)) + "."
        ],
        desmos: {
          steps: ["Let x be " + s.vx + " and y be " + s.vy + ". Type " + m("x+y=" + N) + " and " + m(e2.replace(/ /g, "")) + ".",
                  "Zoom out if you need to, then click where the lines cross: " + m("(" + s.x + ", " + s.y + ")") + "."],
          exprs: ["x+y=" + N, e2.replace(/ /g, "")], bounds: { left: -N * 0.1, right: N * 1.15, bottom: -N * 0.1, top: N * 1.15 }
        },
        data: { a: s.a, c: s.c, N: N, T: T, ask: s.ask }
      };
    },
    check: function (q) {
      var d = q.data, det = Fr.sub(d.c, d.a);                // x + y = N, ax + cy = T
      var x = Fr.div(Fr.sub(Fr.mul(d.c, d.N), d.T), det), y = Fr.sub(d.N, x);
      return eqAns(q, d.ask === "x" ? x : y);
    }
  });

  // ================================================================ Linear inequalities
  add({
    id: "ineq.solve", skill: "alg.ineq", levels: [1, 2], title: "Solve a linear inequality",
    gen: function (R, L) {
      var rel = R.pick(["lt", "le", "gt", "ge"]), K, v, lhs, rhs, ex, lhsD, rhsD, orig;
      if (L === 1) {
        K = R.chance(0.7) ? -R.int(2, 9) : R.int(2, 9); v = Fr(R.nz(-9, 9));
        var b = R.nz(-15, 15), c = Fr.add(Fr.mul(K, v), b);
        lhs = A.lin(K, b); rhs = tx(c);
        orig = { a1: K, b1: b, a2: 0, b2: c };
        ex = [(b > 0 ? "Subtract " + m(tx(b)) + " from" : "Add " + m(tx(-b)) + " to") + " both sides: " + m(A.lin(K, 0) + " " + REL[rel] + " " + tx(Fr.sub(c, b))) + "."];
      } else {
        var k1 = R.nz(-9, 9), k2, b1 = R.int(-12, 12), b2 = R.int(-12, 12);
        do { k2 = R.nz(-9, 9); K = k1 - k2; } while (K === 0 || (R.chance(0.4) && K > 0));
        v = Fr(b2 - b1, K);
        if (v.n === 0) { b2 += 1; v = Fr(b2 - b1, K); }
        lhs = A.lin(k1, b1); rhs = A.lin(k2, b2);
        orig = { a1: k1, b1: b1, a2: k2, b2: b2 };
        ex = ["Move the x-terms to the left and the numbers to the right: " + m(A.lin(K, 0) + " " + REL[rel] + " " + tx(b2 - b1)) + "."];
      }
      var relS = K < 0 ? FLIP[rel] : rel;
      ex.push("Divide both sides by " + m(tx(K)) + (K < 0 ? ". It's negative, so flip the inequality symbol" : "") + ": " + m("x " + REL[relS] + " " + tx(v)) + ".");
      lhsD = lhs.replace(/ /g, ""); rhsD = rhs.replace(/ /g, "");
      var choices = [
        { t: m("x " + REL[relS] + " " + tx(v)), rel: relS, v: v, ok: true },
        { t: m("x " + REL[FLIP[relS]] + " " + tx(v)), rel: FLIP[relS], v: v, why: K < 0 ? "When you divide both sides by a negative number, the inequality symbol has to flip." : "You only flip the inequality symbol when you multiply or divide by a negative number. Here you divide by a positive number." },
        { t: m("x " + REL[relS] + " " + tx(Fr.neg(v))), rel: relS, v: Fr.neg(v), why: "The boundary has the wrong sign. Check the step where you moved the constant." },
        { t: m("x " + REL[FLIP[relS]] + " " + tx(Fr.neg(v))), rel: FLIP[relS], v: Fr.neg(v), why: "Both the direction and the sign of the boundary are off." }
      ];
      var side = relS === "lt" || relS === "le" ? "left" : "right";
      return {
        type: "mc", order: "shuffle",
        stem: "<p>" + dm(lhs + " " + REL[rel] + " " + rhs) + "</p><p>Which of the following describes all values of " + m("x") + " that satisfy the given inequality?</p>",
        choices: choices, explain: ex,
        desmos: { steps: ["Type the inequality exactly as given: " + m(lhsD + REL[rel] + rhsD) + ". Desmos shades every x-value that works.",
                          "The shading is to the " + side + " of " + m("x=" + approx(v)) + (relS === "le" || relS === "ge" ? ", with a solid boundary (the boundary is included)." : ", with a dashed boundary (the boundary isn't included).")],
                  exprs: [lhsD + DREL[rel] + rhsD], bounds: { left: Fr.val(v) - 10, right: Fr.val(v) + 10, bottom: -6, top: 6 } },
        data: { rel: rel, orig: orig, v: v }
      };
    },
    check: function (q) {
      var d = q.data, o = d.orig, eps = Fr(1, 1000), pts = [Fr.add(d.v, -100), Fr.add(d.v, 100)];
      q.choices.forEach(function (c) { pts.push(Fr.sub(c.v, eps), Fr.of(c.v), Fr.add(c.v, eps)); });   // both sides of every boundary
      // the inequality exactly as printed: a1·x + b1 (rel) a2·x + b2
      function orig(x) { return holds(d.rel, Fr.add(Fr.mul(o.a1, x), o.b1), Fr.add(Fr.mul(o.a2, x), o.b2)); }
      q.choices.forEach(function (c, i) {
        var agree = pts.every(function (x) { return holds(c.rel, x, c.v) === orig(x); });
        if ((i === q.answer) !== agree) fail("inequality choice " + i);
      });
      return true;
    }
  });

  var INEQCTX = [
    function (R, L) {
      var D = R.int(150, 220), w = R.int(25, 80), n = R.int(10, 40), extra = L === 1 ? 0 : R.int(1, w - 1), M = D + w * n + extra;
      return { kind: "max", base: D, per: w, limit: M, ans: n,
               stem: "A delivery van can carry at most " + fm.num(M) + " pounds, including the driver. The driver weighs " + D + " pounds, and each box weighs " + w + " pounds. What is the greatest number of boxes the van can carry on one trip?",
               x: "boxes", rel: "le" };
    },
    function (R, L) {
      var c = R.pick([1.25, 1.5, 0.75, 2]), P = R.pick([12, 15, 18, 20]), n = R.int(6, 30), extra = L === 1 ? 0 : R.pick([0.25, 0.5]);
      if (extra >= c) extra = 0.25;
      var B = Fr.add(Fr.add(P, Fr.mul(c, n)), extra);
      return { kind: "max", base: P, per: c, limit: B, ans: n,
               stem: "Lena has " + fm.money(B) + " to spend. She buys a phone case for " + fm.money(P) + " and spends the rest on songs that cost " + fm.money(c) + " each. What is the greatest number of songs she can buy?",
               x: "songs", rel: "le" };
    },
    function (R) {
      var target = R.pick([80, 85, 88, 90]), s = [R.int(70, 98), R.int(70, 98), R.int(70, 98), R.int(70, 98)], sum = s[0] + s[1] + s[2] + s[3];
      var need = 5 * target - sum;
      if (need > 100 || need < 40) { s = [target - 2, target + 1, target - 3, target + 2]; sum = s[0] + s[1] + s[2] + s[3]; need = 5 * target - sum; }
      return { kind: "min", base: sum, per: 1, limit: 5 * target, ans: need,
               stem: "A student's scores on the first four tests in a class were " + s.join(", ") + ". What is the minimum score the student needs on the fifth test to have a mean score of at least " + target + " on the five tests?",
               x: "points", rel: "ge", mean: true };
    },
    function (R, L) {
      var c = R.pick([4, 5, 6, 8]), H = R.step(100, 300, 25), n = R.int(15, 60), short = L === 1 ? 0 : R.int(1, c - 1), G0 = H + c * n - short;
      return { kind: "min", base: H, per: c, limit: G0, ans: n,
               stem: "A club needs to raise at least " + fm.money(G0) + " for a trip. It has already raised " + fm.money(H) + ". It earns " + fm.money(c) + " for each candle it sells. What is the least number of candles the club must sell to reach its goal?",
               x: "candles", rel: "ge" };
    }
  ];
  add({
    id: "ineq.context", skill: "alg.ineq", levels: [1, 2], title: "Inequality word problem",
    gen: function (R, L) {
      var c = R.pick(INEQCTX)(R, L), q = Fr.div(Fr.sub(c.limit, c.base), c.per);
      var exact = Fr.isInt(q);
      var model = c.mean ? "\\frac{" + c.base + " + x}{5} \\ge " + Fr.val(Fr.div(c.limit, 5)) : A.expr([[c.base, ""], [c.per, "x"]], true) + " " + REL[c.rel] + " " + td(c.limit);
      var ex = ["Let " + m("x") + " be the number of " + c.x + ". The condition is " + m(model) + "."];
      if (c.mean) ex.push("Multiply both sides by 5: " + m(c.base + " + x \\ge " + c.limit) + ", so " + m("x \\ge " + c.ans) + ". The minimum score is " + m(c.ans) + ".");
      else {
        ex.push("Solve: " + m("x " + REL[c.rel] + " \\frac{" + td(c.limit) + " - " + td(c.base) + "}{" + td(c.per) + "}" + (exact ? " = " + tx(q) : " \\approx " + approx(q))) + ".");
        ex.push(exact ? "So the " + (c.kind === "max" ? "greatest" : "least") + " whole number is " + m(c.ans) + "." :
          (c.kind === "max" ? "You can't use part of one, and going up would break the limit, so round down: " : "A smaller number wouldn't reach the goal, so round up: ") + m(c.ans) + ".");
      }
      var lineD = "y=" + A.expr([[c.base, ""], [c.per, "x"]], true);
      return {
        type: "spr",
        stem: "<p>" + c.stem + "</p>",
        answer: c.ans, explain: ex,
        desmos: { steps: ["Type " + m(lineD) + " (the total for x " + c.x + ") and " + m("y=" + td(c.limit)) + " (the " + (c.kind === "max" ? "limit" : "goal") + ").",
                          "Click where they cross: " + m("x \\approx " + approx(q)) + ". " + (exact ? "That's a whole number, so it's the answer." : (c.kind === "max" ? "Round down" : "Round up") + " to the nearest whole number: " + c.ans + ".")],
                  exprs: [lineD, "y=" + td(c.limit)], bounds: S.bounds([[0, c.base], [Fr.val(q) * 1.3, c.limit]]) },
        data: { kind: c.kind, base: c.base, per: c.per, limit: c.limit }
      };
    },
    check: function (q) {
      var d = q.data, n = Fr.val(q.answer);
      function ok(k) { var tot = Fr.add(d.base, Fr.mul(d.per, k)); return d.kind === "max" ? Fr.cmp(tot, d.limit) <= 0 : Fr.cmp(tot, d.limit) >= 0; }
      if (!Fr.isInt(q.answer) || !ok(n)) fail("answer breaks the condition");
      if (d.kind === "max" && ok(n + 1)) fail("not the greatest");
      if (d.kind === "min" && ok(n - 1)) fail("not the least");
      return true;
    }
  });

  add({
    id: "ineq.region", skill: "alg.ineq", levels: [2, 3], title: "Points that satisfy a system of inequalities",
    gen: function (R, L) {
      var ineqs, good, bad, f1, f2, both2;
      for (var t = 0; t < 200; t++) {
        if (L === 2) {
          var m1 = R.int(-3, 3), m2, b1 = R.int(-5, 5), b2 = R.int(-3, 6);
          do { m2 = R.int(-3, 3); } while (m2 === m1);
          ineqs = [{ a: Fr(-m1), b: Fr(1), c: Fr(b1), rel: R.pick(["gt", "ge"]), tex: "y " + "{R} " + A.lin(m1, b1), dz: "y{R}" + A.lin(m1, b1).replace(/ /g, "") },
                   { a: Fr(-m2), b: Fr(1), c: Fr(b2), rel: R.pick(["lt", "le"]), tex: "y " + "{R} " + A.lin(m2, b2), dz: "y{R}" + A.lin(m2, b2).replace(/ /g, "") }];
        } else {
          ineqs = [0, 1].map(function () {
            var a = R.nz(-4, 4), b = R.nz(-4, 4), c = R.int(-8, 8), rel = R.pick(["lt", "le", "gt", "ge"]), lhs = A.expr([[a, "x"], [b, "y"]]);
            return { a: Fr(a), b: Fr(b), c: Fr(c), rel: rel, tex: lhs + " {R} " + tx(c), dz: lhs.replace(/ /g, "") + "{R}" + tx(c) };
          });
          if (Fr.eq(Fr.mul(ineqs[0].a, ineqs[1].b), Fr.mul(ineqs[1].a, ineqs[0].b))) continue;
        }
        good = []; f1 = []; f2 = []; both2 = [];
        for (var x = -6; x <= 6; x++) for (var y = -6; y <= 6; y++) {
          var onEdge = false, sat = ineqs.map(function (q) {
            var lhs = Fr.add(Fr.mul(q.a, x), Fr.mul(q.b, y));
            if (Fr.eq(lhs, q.c)) onEdge = true;
            return holds(q.rel, lhs, q.c);
          });
          if (onEdge) continue;
          if (sat[0] && sat[1]) good.push([x, y]); else if (!sat[0] && sat[1]) f1.push([x, y]); else if (sat[0] && !sat[1]) f2.push([x, y]); else both2.push([x, y]);
        }
        if (good.length && f1.length && f2.length && f1.length + f2.length + both2.length >= 3) break;
      }
      bad = [R.pick(f1), R.pick(f2), both2.length ? R.pick(both2) : R.pick(f1.concat(f2))];
      while (bad[2][0] === bad[0][0] && bad[2][1] === bad[0][1] || bad[2][0] === bad[1][0] && bad[2][1] === bad[1][1]) bad[2] = R.pick(f1.concat(f2).concat(both2));
      var right = R.pick(good);
      function show(i) { return ineqs[i].tex.replace("{R}", REL[ineqs[i].rel]); }
      function pt(p) { return m("(" + tx(p[0]) + ", " + tx(p[1]) + ")"); }
      var choices = [{ t: pt(right), pt: right, ok: true }].concat(bad.map(function (p, i) {
        var fails = [];
        ineqs.forEach(function (q, j) { if (!holds(q.rel, Fr.add(Fr.mul(q.a, p[0]), Fr.mul(q.b, p[1])), q.c)) fails.push(m(show(j))); });
        return { t: pt(p), pt: p, why: "This point doesn't satisfy " + fails.join(" or ") + "." };
      }));
      var sysT = "\\begin{aligned}" + show(0).replace(/ (\\lt|\\le|\\gt|\\ge) /, " &$1 ") + "\\\\" + show(1).replace(/ (\\lt|\\le|\\gt|\\ge) /, " &$1 ") + "\\end{aligned}";
      var dz = ineqs.map(function (q) { return q.dz.replace("{R}", DREL[q.rel]); });
      return {
        type: "mc",
        stem: "<p>" + dm(sysT) + "</p><p>Which point " + m("(x, y)") + " is a solution to the given system of inequalities?</p>",
        choices: choices,
        explain: ["Test each point in both inequalities. A solution has to make both true.",
                  "For " + pt(right) + ": both inequalities hold, so it's a solution.",
                  "Each other point breaks at least one of the inequalities."],
        desmos: { steps: ["Type both inequalities. Desmos shades each one; the solutions are where the shadings overlap.",
                          "Type the four points from the choices. Only " + pt(right) + " lands in the overlap. A point on a dashed boundary wouldn't count."],
                  exprs: dz.concat(choices.map(function (c) { return "(" + c.pt[0] + "," + c.pt[1] + ")"; })), bounds: { left: -8, right: 8, bottom: -8, top: 8 } },
        data: { ineqs: ineqs.map(function (q) { return { a: q.a, b: q.b, c: q.c, rel: q.rel }; }) }
      };
    },
    check: function (q) {
      var ins = q.data.ineqs;
      q.choices.forEach(function (c, i) {
        var ok = ins.every(function (s) { return holds(s.rel, Fr.add(Fr.mul(s.a, c.pt[0]), Fr.mul(s.b, c.pt[1])), s.c); });
        if ((i === q.answer) !== ok) fail("region choice " + i);
      });
      return true;
    }
  });
})(typeof window !== "undefined" ? window : globalThis);
