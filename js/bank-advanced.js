/* SAT Math question templates: Advanced Math (equivalent expressions, nonlinear equations, nonlinear functions). */
(function (G) {
  "use strict";
  var S = G.SATM, Fr = S.Fr, fm = S.fmt, tx = fm.tex, td = fm.texd, A = S.alg, m = S.m, dm = S.dm, P = S.P, H = S.H;
  var add = S.addTemplate, fail = H.fail, pr = H.pr, approx = H.approx, eqAns = H.eqAns, numChoices = H.numChoices;

  function fac(f) { return "(" + A.lin(f[0], f[1]) + ")"; }                          // [a, b] -> (ax + b)
  function expand(fs) { return fs.reduce(function (acc, f) { return P.mul(acc, f); }, [Fr(1)]); }
  function polysDistinct(list) {
    for (var i = 0; i < list.length; i++) for (var j = i + 1; j < list.length; j++) if (P.eq(list[i], list[j])) return false;
    return true;
  }
  function polyBounds(coefs, x0, x1) {
    x0 = x0 === undefined ? -6 : x0; x1 = x1 === undefined ? 6 : x1;
    var ys = [];
    for (var x = x0; x <= x1; x++) ys.push(Fr.val(P.eval(coefs, x)));
    var lo = Math.min.apply(null, ys.concat([0])), hi = Math.max.apply(null, ys.concat([0]));
    lo = Math.max(lo, -60); hi = Math.min(hi, 60);
    var pad = Math.max(2, (hi - lo) * 0.15);
    return { left: x0 - 2, right: x1 + 2, bottom: lo - pad, top: hi + pad };
  }
  function overlaySteps(origTex) {
    return ["Graph the given expression as " + m("y=" + origTex) + ".",
            "Graph each answer choice as " + m("y=") + "… too. The equivalent choice lands exactly on top of the original graph everywhere."];
  }

  // ================================================================ Equivalent expressions
  add({
    id: "equiv.expand", skill: "adv.equiv", levels: [1, 2], title: "Expand and simplify",
    gen: function (R, L) {
      var variant = L === 1 ? R.pick(["prod", "square"]) : R.pick(["prod", "combo", "combo"]);
      var origTex, right, cands, ex, data, orig;
      for (var t = 0; t < 200; t++) {
        if (variant === "prod") {
          var a = R.int(1, 5), b = R.nz(-7, 7), c = R.int(1, 5), d = R.nz(-7, 7);
          origTex = fac([a, b]) + fac([c, d]); orig = expand([[a, b], [c, d]]);
          right = [a * c, a * d + b * c, b * d];
          cands = [
            { c: [a * c, 0, b * d], why: "This leaves out the middle term. Multiplying the outer and inner terms gives " + m(A.lin(a * d, 0)) + " and " + m(A.lin(b * c, 0)) + ", which combine to " + m(A.lin(a * d + b * c, 0)) + "." },
            { c: [a * c, b + d, b * d], why: "The x-term comes from the outer and inner products (" + m(A.lin(a * d + b * c, 0)) + "), not from adding the constants." },
            { c: [a * c, a * d + b * c, b + d], why: "The constant term is the product of the constants, " + m(pr(b) + "\\cdot " + pr(d) + " = " + tx(b * d)) + ", not their sum." }
          ];
          ex = ["Multiply every term in the first factor by every term in the second: " + m(A.expr([[a * c, "x^{2}"], [a * d, "x"], [b * c, "x"], [b * d, ""]])) + ".",
                "Combine the x-terms: " + m(A.poly(right)) + "."];
          data = { kind: "prod", f: [[a, b], [c, d]] };
        } else if (variant === "square") {
          var a2 = R.int(1, 4), p = R.nz(-9, 9);
          if (p === 2) continue;
          origTex = fac([a2, p]) + "^{2}"; orig = expand([[a2, p], [a2, p]]);
          right = [a2 * a2, 2 * a2 * p, p * p];
          cands = [
            { c: [a2 * a2, 0, p * p], why: "Squaring a sum isn't the same as squaring each term: " + m("(u + v)^{2} = u^{2} + 2uv + v^{2}") + ", so there's a middle term." },
            { c: [a2 * a2, a2 * p, p * p], why: "The middle term is twice the product of the two terms: " + m("2" + "\\cdot " + A.lin(a2, 0) + "\\cdot " + pr(p) + " = " + A.lin(2 * a2 * p, 0)) + "." },
            { c: [a2 * a2, 2 * a2 * p, 2 * p], why: "The constant term is " + m(pr(p) + "^{2} = " + tx(p * p)) + ", not " + m("2\\cdot " + pr(p)) + "." }
          ];
          ex = ["Write the square as a product: " + m(fac([a2, p]) + fac([a2, p])) + ".",
                "Multiply it out: " + m(A.expr([[a2 * a2, "x^{2}"], [a2 * p, "x"], [a2 * p, "x"], [p * p, ""]]) + " = " + A.poly(right)) + "."];
          data = { kind: "prod", f: [[a2, p], [a2, p]] };
        } else {
          var pp = R.int(2, 5), qq = R.int(1, 4), b1 = R.nz(-6, 6), c1 = R.nz(-9, 9), b2 = R.nz(-6, 6), c2 = R.nz(-9, 9);
          if (pp === qq) continue;
          var p1 = [1, b1, c1], p2 = [1, b2, c2];
          origTex = tx(pp) + "(" + A.poly(p1) + ") - " + (qq === 1 ? "" : tx(qq)) + "(" + A.poly(p2) + ")";
          orig = P.add(P.scale(p1, pp), P.scale(p2, -qq));
          right = [pp - qq, pp * b1 - qq * b2, pp * c1 - qq * c2];
          cands = [
            { c: [pp - qq, pp * b1 + qq * b2, pp * c1 + qq * c2], why: "The minus sign in front of " + m((qq === 1 ? "(" : tx(qq) + "(") + "\\ldots)") + " applies to every term inside, not just the first one." },
            { c: [pp - qq, pp * b1 - b2, pp * c1 - c2], why: "The " + m(tx(qq)) + " multiplies every term in its parentheses, not just " + m("x^{2}") + "." },
            { c: [pp + qq, pp * b1 + qq * b2, pp * c1 + qq * c2], why: "The expression subtracts the second part. This adds it." }
          ];
          if (qq === 1) cands[1] = { c: [pp - qq, pp * b1 + b2, pp * c1 - c2], why: "The minus sign has to change the sign of every term in the second parentheses." };
          ex = ["Distribute " + m(tx(pp)) + " and " + m("-" + (qq === 1 ? "1" : tx(qq))) + ": " + m(A.expr([[pp, "x^{2}"], [pp * b1, "x"], [pp * c1, ""], [-qq, "x^{2}"], [-qq * b2, "x"], [-qq * c2, ""]])) + ".",
                "Combine like terms: " + m(A.poly(right)) + "."];
          data = { kind: "combo", p1: p1, p2: p2, p: pp, q: qq };
        }
        if (polysDistinct([right].concat(cands.map(function (x) { return x.c; })))) break;
      }
      return {
        type: "mc",
        stem: "<p>Which expression is equivalent to " + m(origTex) + "?</p>",
        choices: [{ t: m(A.poly(right)), ok: true, coefs: right, dz: "y=" + A.poly(right) }]
          .concat(cands.map(function (c) { return { t: m(A.poly(c.c)), coefs: c.c, why: c.why, dz: "y=" + A.poly(c.c) }; })),
        explain: ex,
        desmos: { steps: overlaySteps(origTex), exprs: ["y=" + origTex], withChoices: true, bounds: polyBounds(orig) },
        data: data
      };
    },
    check: function (q) {
      var d = q.data, orig = d.kind === "combo" ? P.add(P.scale(d.p1, d.p), P.scale(d.p2, -d.q)) : expand(d.f);
      q.choices.forEach(function (c, i) { if ((i === q.answer) !== P.eq(c.coefs, orig)) fail("expand choice " + i); });
      return true;
    }
  });

  function facChoice(c) {                                  // {f: [[a,b],...], sq, k}
    if (c.sq) return fac(c.f[0]) + "^{2}";
    return (c.k ? tx(c.k) : "") + c.f.map(fac).join("");
  }
  function facPoly(c) { return P.scale(expand(c.f), c.k || 1); }
  add({
    id: "equiv.factor", skill: "adv.equiv", levels: [2, 3], title: "Factor a quadratic",
    gen: function (R, L) {
      var variant = L === 2 ? R.pick(["monic", "monic", "squares"]) : R.pick(["nonmonic", "nonmonic", "squares"]);
      var right, cands, orig, ex, zeros;
      for (var t = 0; t < 300; t++) {
        if (variant === "monic") {
          var r1 = R.nz(-9, 9), r2 = R.nz(-9, 9);
          if (r1 === r2 || r1 === -r2) continue;
          right = { f: [[1, -r1], [1, -r2]] };
          cands = [{ f: [[1, r1], [1, r2]] }, { f: [[1, -r1], [1, r2]] }, { f: [[1, r1], [1, -r2]] }];
          zeros = [Fr(r1), Fr(r2)];
          ex = ["Look for two numbers that multiply to " + m(tx(r1 * r2)) + " and add to " + m(tx(-(r1 + r2))) + ": they're " + m(tx(-r1)) + " and " + m(tx(-r2)) + "."];
        } else if (variant === "squares") {
          var a = R.int(2, 7), b = R.int(1, 9);
          if (S.gcd(a, b) !== 1) continue;
          right = { f: [[a, -b], [a, b]] };
          cands = [{ f: [[a, -b], [a, -b]], sq: true }, { f: [[a, b], [a, b]], sq: true }, { f: [[1, -b], [1, b]], k: a }];
          zeros = [Fr(b, a), Fr(-b, a)];
          ex = ["This is a difference of squares: " + m(tx(a * a) + "x^{2} - " + tx(b * b) + " = (" + A.lin(a, 0) + ")^{2} - " + tx(b) + "^{2}") + ".",
                "Use " + m("u^{2} - v^{2} = (u - v)(u + v)") + "."];
        } else {
          var p = R.int(2, 5), q = R.nz(-7, 7), r = R.nz(-7, 7);
          if (S.gcd(p, Math.abs(q)) !== 1 || q === r || q === -r) continue;
          right = { f: [[p, q], [1, r]] };
          cands = [{ f: [[p, r], [1, q]] }, { f: [[p, -q], [1, -r]] }, { f: [[p, q], [1, -r]] }];
          zeros = [Fr(-q, p), Fr(-r)];
          ex = ["The zeros of " + m(fac([p, q]) + fac([1, r])) + " are " + m("x = " + tx(Fr(-q, p))) + " and " + m("x = " + tx(-r)) + ". Check them against the given expression, or multiply the factors out."];
        }
        orig = facPoly(right);
        if (polysDistinct([orig].concat(cands.map(facPoly)))) break;
      }
      ex.push("So " + m(A.poly(orig) + " = " + facChoice(right)) + ". Multiply back out to check.");
      var origTex = A.poly(orig);
      var choices = [{ t: m(facChoice(right)), ok: true, poly: orig, dz: "y=" + facChoice(right) }].concat(cands.map(function (c) {
        var e = facPoly(c);
        return { t: m(facChoice(c)), poly: e, dz: "y=" + facChoice(c), why: "Multiply it out: " + m(facChoice(c) + " = " + A.poly(e)) + ", which isn't " + m(origTex) + "." };
      }));
      return {
        type: "mc",
        stem: "<p>Which of the following is equivalent to " + m(origTex) + "?</p>",
        choices: choices, explain: ex,
        desmos: {
          steps: ["Graph " + m("y=" + origTex) + " and click its x-intercepts: " + zeros.map(function (z) { return m("x \\approx " + approx(z)); }).join(" and ") + ". A zero at " + m("x = r") + " means the expression has a factor that's 0 there.",
                  "Or graph each choice and see which one lands exactly on the original."],
          exprs: ["y=" + origTex], withChoices: true, bounds: polyBounds(orig)
        },
        data: { orig: orig }
      };
    },
    check: function (q) {
      var orig = q.data.orig;
      q.choices.forEach(function (c, i) {
        var e = c.poly;                                          // re-expand from the printed factors' data
        if ((i === q.answer) !== P.eq(e, orig)) fail("factor choice " + i);
      });
      return true;
    }
  });

  add({
    id: "equiv.rational", skill: "adv.equiv", levels: [3], title: "Rational expressions",
    gen: function (R) {
      if (R.chance(0.45)) {
        var r1, r2;
        do { r1 = R.nz(-8, 8); r2 = R.nz(-8, 8); } while (r1 === r2 || r1 === -r2);
        var num = expand([[1, -r1], [1, -r2]]), den = A.shift("x", -r1);
        var origT = "\\frac{" + A.poly(num) + "}{" + den + "}";
        var opt = function (b, why, ok) { return { t: m(A.shift("x", b)), ok: ok, why: why, num: [Fr(1), Fr(b)], den: [Fr(1)], dz: "y=" + A.shift("x", b) }; };
        return {
          type: "mc",
          stem: "<p>Which expression is equivalent to " + m(origT) + ", for " + m("x \\ne " + tx(r1)) + "?</p>",
          choices: [opt(-r2, "", true),
                    opt(r2, "The numerator factors as " + m(fac([1, -r1]) + fac([1, -r2])) + ". After canceling " + m(fac([1, -r1])) + ", what's left is " + m(A.shift("x", -r2)) + "."),
                    opt(-r1, "That's the factor that cancels with the denominator, not the one that's left."),
                    opt(r1, "Factor the numerator first: " + m(fac([1, -r1]) + fac([1, -r2])) + ". Then cancel " + m(fac([1, -r1])) + ".")],
          explain: ["Factor the numerator: " + m(A.poly(num) + " = " + fac([1, -r1]) + fac([1, -r2])) + ".",
                    "Cancel the common factor " + m(den) + " (allowed because " + m("x \\ne " + tx(r1)) + "): " + m(A.shift("x", -r2)) + "."],
          desmos: { steps: ["Graph " + m("y=" + origT) + ". It's a straight line with a hole at " + m("x=" + tx(r1)) + ".", "Graph the choices: the equivalent one is the same line."],
                    exprs: ["y=" + origT], withChoices: true, bounds: { left: -12, right: 12, bottom: -15, top: 15 } },
          data: { kind: "cancel", r1: r1, r2: r2, poles: [r1] }
        };
      }
      var p, q, a, b;
      do { p = R.int(1, 6); q = R.int(1, 6); a = R.nz(-6, 6); b = R.nz(-6, 6); } while (p === q || a === b);
      var den2 = fac([1, a]) + fac([1, b]);
      var orig2 = "\\frac{" + p + "}{" + A.shift("x", a) + "} + \\frac{" + q + "}{" + A.shift("x", b) + "}";
      var denPoly = expand([[1, a], [1, b]]);
      function rat(numP, denP, denT, why, ok) {
        return { t: m("\\frac{" + A.poly(numP) + "}{" + denT + "}"), num: numP.map(Fr.of), den: denP.map(Fr.of), why: why, ok: ok, dz: "y=\\frac{" + A.poly(numP) + "}{" + denT + "}" };
      }
      return {
        type: "mc",
        stem: "<p>Which expression is equivalent to " + m(orig2) + "?</p>",
        choices: [
          rat([p + q, p * b + q * a], denPoly, den2, "", true),
          rat([p + q], [2, a + b], A.lin(2, a + b), "You can't add fractions by adding the numerators and adding the denominators. Rewrite both over a common denominator first."),
          rat([p + q], denPoly, den2, "Over the common denominator, each numerator gets multiplied by the other fraction's denominator: " + m(tx(p) + fac([1, b]) + " + " + tx(q) + fac([1, a])) + "."),
          rat([p + q, p * a + q * b], denPoly, den2, "Each numerator is multiplied by the other fraction's denominator: " + m(tx(p) + fac([1, b]) + " + " + tx(q) + fac([1, a])) + ", not " + m(tx(p) + fac([1, a]) + " + " + tx(q) + fac([1, b])) + ".")
        ],
        explain: ["Use the common denominator " + m(den2) + ": " + m("\\frac{" + tx(p) + fac([1, b]) + " + " + tx(q) + fac([1, a]) + "}{" + den2 + "}") + ".",
                  "Expand the numerator: " + m(tx(p) + fac([1, b]) + " + " + tx(q) + fac([1, a]) + " = " + A.lin(p + q, p * b + q * a)) + "."],
        desmos: { steps: overlaySteps(orig2), exprs: ["y=" + orig2], withChoices: true, bounds: { left: -12, right: 12, bottom: -8, top: 8 } },
        data: { kind: "sum", p: p, q: q, a: a, b: b, poles: [-a, -b, Fr(-(a + b), 2)] }
      };
    },
    check: function (q) {
      var d = q.data, pts = [Fr(-29, 3), Fr(1, 7), Fr(5, 2), Fr(23, 3), Fr(41, 4)];
      function orig(x) {
        if (d.kind === "cancel") return Fr.div(P.eval(expand([[1, -d.r1], [1, -d.r2]]), x), Fr.sub(x, d.r1));
        return Fr.add(Fr.div(d.p, Fr.add(x, d.a)), Fr.div(d.q, Fr.add(x, d.b)));
      }
      q.choices.forEach(function (c, i) {
        var same = pts.every(function (x) { return Fr.eq(orig(x), Fr.div(P.eval(c.num, x), P.eval(c.den, x))); });
        if ((i === q.answer) !== same) fail("rational choice " + i);
      });
      return true;
    }
  });

  function xpow(e) { e = Fr.of(e); return "x^{" + tx(e) + "}"; }
  add({
    id: "equiv.exponent", skill: "adv.equiv", levels: [2], title: "Exponent rules",
    gen: function (R) {
      var right, cands, origT, ex, data;
      for (var t = 0; t < 200; t++) {
        if (R.chance(0.5)) {
          var n = R.pick([2, 3, 4, 5]), mm = R.int(2, 9);
          if (mm === n || S.gcd(mm, n) !== 1) continue;
          origT = n === 2 ? "\\sqrt{x^{" + mm + "}}" : "\\sqrt[" + n + "]{x^{" + mm + "}}";
          right = Fr(mm, n);
          cands = [{ e: Fr(n, mm), why: "The root's index goes in the denominator: " + m("\\sqrt[n]{x^{m}} = x^{\\frac{m}{n}}") + "." },
                   { e: Fr(mm - n), why: "A root becomes a fractional exponent. You don't subtract the index." },
                   { e: Fr(mm * n), why: "Taking a root divides the exponent by the index. It doesn't multiply it." }];
          ex = ["A root is a fractional power: " + m("\\sqrt[n]{x^{m}} = x^{\\frac{m}{n}}") + ".", "So " + m(origT + " = " + xpow(right)) + "."];
          data = { kind: "root", n: n, m: mm };
        } else {
          var a = R.int(2, 5), b = R.int(2, 4), c = R.int(1, 6);
          origT = "(x^{" + a + "})^{" + b + "} \\cdot x^{" + c + "}";
          right = Fr(a * b + c);
          cands = [{ e: Fr(a + b + c), why: "A power of a power multiplies the exponents: " + m("(x^{" + a + "})^{" + b + "} = x^{" + a * b + "}") + "." },
                   { e: Fr(a * b * c), why: "When you multiply powers with the same base, add the exponents: " + m("x^{" + a * b + "} \\cdot x^{" + c + "} = x^{" + (a * b + c) + "}") + "." },
                   { e: Fr((a + c) * b), why: "The exponent " + m(tx(b)) + " applies only to " + m("x^{" + a + "}") + ", not to " + m("x^{" + c + "}") + "." }];
          ex = ["Power of a power: " + m("(x^{" + a + "})^{" + b + "} = x^{" + a + "\\cdot " + b + "} = x^{" + a * b + "}") + ".",
                "Multiplying powers adds exponents: " + m("x^{" + a * b + "} \\cdot x^{" + c + "} = x^{" + (a * b + c) + "}") + "."];
          data = { kind: "pow", a: a, b: b, c: c };
        }
        var es = [right].concat(cands.map(function (x) { return x.e; }));
        var ok = true;
        for (var i = 0; i < 4; i++) for (var j = i + 1; j < 4; j++) if (Fr.eq(es[i], es[j])) ok = false;
        if (ok) break;
      }
      return {
        type: "mc",
        stem: "<p>Which expression is equivalent to " + m(origT) + (data.kind === "root" ? ", where " + m("x \\gt 0") : "") + "?</p>",
        choices: [{ t: m(xpow(right)), e: right, ok: true, dz: "y=" + xpow(right) }].concat(cands.map(function (c) { return { t: m(xpow(c.e)), e: c.e, why: c.why, dz: "y=" + xpow(c.e) }; })),
        explain: ex,
        desmos: { steps: overlaySteps(origT).concat(["You can also test a number: type the original with " + m("x=2") + " and each choice with " + m("x=2") + "; only the equivalent one gives the same value."]),
                  exprs: ["y=" + origT], withChoices: true, bounds: { left: -0.5, right: 3, bottom: -1, top: 10 } },
        data: data
      };
    },
    check: function (q) {
      var d = q.data, x = 1.7;
      var orig = d.kind === "root" ? Math.pow(Math.pow(x, d.m), 1 / d.n) : Math.pow(Math.pow(x, d.a), d.b) * Math.pow(x, d.c);
      q.choices.forEach(function (c, i) {
        var v = Math.pow(x, Fr.val(c.e)), same = Math.abs(v - orig) <= 1e-9 * Math.max(1, Math.abs(orig));
        if ((i === q.answer) !== same) fail("exponent choice " + i);
      });
      return true;
    }
  });

  // ================================================================ Nonlinear equations and systems
  add({
    id: "nleq.quadratic", skill: "adv.nleq", levels: [1, 2], title: "Solve a quadratic equation",
    gen: function (R, L) {
      var variant = L === 1 ? "pos" : R.pick(["pair", "sum", "pos"]);
      if (variant === "pos") {
        var r1 = R.int(1, 9), r2 = -R.int(1, 9), coefs = [1, -(r1 + r2), r1 * r2];
        return {
          type: "spr",
          stem: "<p>" + dm(A.poly(coefs) + " = 0") + "</p><p>What is the positive solution to the given equation?</p>",
          answer: r1,
          explain: ["Factor: find two numbers that multiply to " + m(tx(r1 * r2)) + " and add to " + m(tx(-(r1 + r2))) + ". They're " + m(tx(-r1)) + " and " + m(tx(-r2)) + ", so " + m(A.poly(coefs) + " = " + fac([1, -r1]) + fac([1, -r2])) + ".",
                    "The solutions are " + m("x = " + tx(r1)) + " and " + m("x = " + tx(r2)) + ". The positive one is " + m(tx(r1)) + "."],
          desmos: { steps: ["Type " + m("y=" + A.poly(coefs)) + ".", "Click the x-intercepts: " + m("(" + tx(r2) + ", 0)") + " and " + m("(" + tx(r1) + ", 0)") + ". The positive solution is " + m(tx(r1)) + "."],
                    exprs: ["y=" + A.poly(coefs)], bounds: polyBounds(coefs, Math.min(r2, -2) - 1, Math.max(r1, 2) + 1) },
          data: { coefs: coefs, mode: "pos" }
        };
      }
      if (variant === "sum") {
        var a = R.int(1, 3), s1 = R.int(-8, 8), s2;
        do { s2 = R.int(-8, 8); } while (s2 === s1);
        var cf = [a, -a * (s1 + s2), a * s1 * s2];
        return {
          type: "spr",
          stem: "<p>" + dm(A.poly(cf) + " = 0") + "</p><p>What is the sum of the solutions to the given equation?</p>",
          answer: s1 + s2,
          explain: [(a > 1 ? "Factor out " + m(tx(a)) + ": " + m(A.poly(cf) + " = " + tx(a) + "(" + A.poly([1, -(s1 + s2), s1 * s2]) + ")") + ". " : "") +
                    "The solutions are " + m("x = " + tx(s1)) + " and " + m("x = " + tx(s2)) + ", so their sum is " + m(tx(s1 + s2)) + ".",
                    "Shortcut: for " + m("ax^{2} + bx + c = 0") + ", the solutions add up to " + m("-\\frac{b}{a} = " + tx(s1 + s2)) + "."],
          desmos: { steps: ["Type " + m("y=" + A.poly(cf)) + " and click both x-intercepts: " + m("x=" + tx(Math.min(s1, s2))) + " and " + m("x=" + tx(Math.max(s1, s2))) + ".", "Add them: " + m(tx(s1 + s2)) + "."],
                    exprs: ["y=" + A.poly(cf)], bounds: polyBounds(cf, Math.min(s1, s2) - 2, Math.max(s1, s2) + 2) },
          data: { coefs: cf, mode: "sum" }
        };
      }
      var p, q, r, x1, x2;
      do { p = R.int(1, 3); q = R.nz(-9, 9); r = R.nz(-7, 7); x1 = Fr(q, p); x2 = Fr(r); } while (Fr.eq(x1, x2) || Fr.eq(x1, Fr.neg(x2)) || S.gcd(p, Math.abs(q)) !== 1);
      var co = expand([[p, -q], [1, -r]]);
      function pair(u, v, why, ok) { return { t: m("x = " + tx(u)) + " and " + m("x = " + tx(v)), roots: [u, v], ok: ok, why: why }; }
      return {
        type: "mc",
        stem: "<p>" + dm(A.poly(co) + " = 0") + "</p><p>What are the solutions to the given equation?</p>",
        choices: [pair(x1, x2, "", true),
                  pair(Fr.neg(x1), Fr.neg(x2), "Those are the opposites of the solutions. A factor like " + m(fac([1, -r])) + " is zero at " + m("x = " + tx(r)) + ", not " + m("x = " + tx(-r)) + "."),
                  pair(x1, Fr.neg(x2), "One of these doesn't work. Substitute " + m("x = " + tx(Fr.neg(x2))) + " into the equation: it doesn't give 0."),
                  pair(Fr.neg(x1), x2, "One of these doesn't work. Substitute " + m("x = " + tx(Fr.neg(x1))) + " into the equation: it doesn't give 0.")],
        explain: ["Factor: " + m(A.poly(co) + " = " + fac([p, -q]) + fac([1, -r])) + ".",
                  "Set each factor to 0: " + m(A.lin(p, -q) + " = 0") + " gives " + m("x = " + tx(x1)) + ", and " + m(A.shift("x", -r) + " = 0") + " gives " + m("x = " + tx(x2)) + "."],
        desmos: { steps: ["Type " + m("y=" + A.poly(co)) + ".", "Click both x-intercepts: about " + m(approx(x1)) + " and " + m(approx(x2)) + ". Match them to a choice (" + m(tx(x1)) + " ≈ " + approx(x1) + ")."],
                  exprs: ["y=" + A.poly(co)], bounds: polyBounds(co, Math.floor(Math.min(Fr.val(x1), Fr.val(x2))) - 2, Math.ceil(Math.max(Fr.val(x1), Fr.val(x2))) + 2) },
        data: { coefs: co, mode: "pair" }
      };
    },
    check: function (q) {
      var c = q.data.coefs;
      function root(x) { return P.eval(c, x).n === 0; }
      if (q.data.mode === "pos") { if (!root(q.answer) || Fr.val(q.answer) <= 0) fail("pos root"); return true; }
      if (q.data.mode === "sum") { return eqAns(q, Fr.div(Fr.neg(c[1]), c[0])); }
      q.choices.forEach(function (ch, i) { var both = root(ch.roots[0]) && root(ch.roots[1]); if ((i === q.answer) !== both) fail("pair " + i); });
      return true;
    }
  });

  add({
    id: "nleq.discriminant", skill: "adv.nleq", levels: [2, 3], title: "Number of real solutions",
    gen: function (R, L) {
      var variant = L === 2 ? R.pick(["count", "count", "onesol"]) : R.pick(["onesol", "nosol", "count"]);
      if (variant === "count") {
        var kind = R.pick(["two", "one", "none"]), a, b, c, D;
        for (var t = 0; t < 500; t++) {
          a = R.pick([1, 2, 3, -1, -2]);
          if (kind === "one") { var h = R.nz(-5, 5); b = -2 * a * h; c = a * h * h; }
          else { b = R.int(-9, 9); c = R.nz(-9, 9); }
          D = b * b - 4 * a * c;
          if ((kind === "two" && D > 0) || (kind === "one" && D === 0) || (kind === "none" && D < 0)) break;
        }
        var co = [a, b, c];
        var labels = { none: "No real solutions", one: "Exactly one real solution", two: "Exactly two real solutions", inf: "Infinitely many real solutions" };
        var said = D > 0 ? "The discriminant is positive, so there are two real solutions." : D === 0 ? "The discriminant is 0, so there's exactly one real solution." : "The discriminant is negative, so there are no real solutions.";
        return {
          type: "mc", order: "fixed",
          stem: "<p>" + dm(A.poly(co) + " = 0") + "</p><p>How many distinct real solutions does the given equation have?</p>",
          choices: ["none", "one", "two", "inf"].map(function (k) { return { t: labels[k], key: k, ok: k === kind, why: k === "inf" ? "A quadratic equation has at most two solutions." : said }; }),
          explain: ["Find the discriminant " + m("b^{2} - 4ac") + ": " + m(pr(b) + "^{2} - 4(" + tx(a) + ")(" + tx(c) + ") = " + tx(D)) + ".", said],
          desmos: { steps: ["Type " + m("y=" + A.poly(co)) + ".", "Count the x-intercepts: " + (D > 0 ? "the parabola crosses the x-axis twice." : D === 0 ? "the vertex just touches the x-axis, once." : "the parabola never reaches the x-axis.")],
                    exprs: ["y=" + A.poly(co)], bounds: polyBounds(co, -7, 7) },
          data: { mode: "count", co: co, kind: kind }
        };
      }
      if (variant === "onesol") {
        if (R.chance(0.5)) {
          var bb = 2 * R.nz(-7, 7);
          return {
            type: "spr",
            stem: "<p>" + dm(A.expr([[1, "x^{2}"], [bb, "x"], ["c", ""]]) + " = 0") + "</p><p>In the given equation, " + m("c") + " is a constant. The equation has exactly one real solution. What is the value of " + m("c") + "?</p>",
            answer: bb * bb / 4,
            explain: ["A quadratic has exactly one real solution when its discriminant is 0: " + m(pr(bb) + "^{2} - 4(1)(c) = 0") + ".",
                      "So " + m(tx(bb * bb) + " = 4c") + " and " + m("c = " + tx(bb * bb / 4)) + ". (Check: " + m(A.poly([1, bb, bb * bb / 4]) + " = (" + A.shift("x", bb / 2) + ")^{2}") + ".)"],
            desmos: { steps: ["Type " + m("y=" + A.expr([[1, "x^{2}"], [bb, "x"], ["c", ""]])) + " and " + m("c=0") + " to make a slider.", "Drag " + m("c") + " until the parabola just touches the x-axis at one point: " + m("c=" + tx(bb * bb / 4)) + "."],
                      exprs: ["y=x^{2}" + A.term(bb, "x", false) + "+c", "c=0"], bounds: { left: -bb / 2 - 8, right: -bb / 2 + 8, bottom: -10, top: 20 } },
            data: { mode: "onesol-c", b: bb }
          };
        }
        var s = R.int(2, 9);
        return {
          type: "spr",
          stem: "<p>" + dm("x^{2} + kx + " + s * s + " = 0") + "</p><p>In the given equation, " + m("k") + " is a positive constant. The equation has exactly one real solution. What is the value of " + m("k") + "?</p>",
          answer: 2 * s,
          explain: ["Exactly one real solution means the discriminant is 0: " + m("k^{2} - 4(1)(" + s * s + ") = 0") + ".",
                    "So " + m("k^{2} = " + 4 * s * s) + " and, since " + m("k \\gt 0") + ", " + m("k = " + 2 * s) + "."],
          desmos: { steps: ["Type " + m("y=x^{2}+kx+" + s * s) + " and " + m("k=1") + " for a slider.", "Drag " + m("k") + " (keep it positive) until the parabola just touches the x-axis: " + m("k=" + 2 * s) + "."],
                    exprs: ["y=x^{2}+kx+" + s * s, "k=1"], bounds: { left: -15, right: 5, bottom: -10, top: 30 } },
          data: { mode: "onesol-k", s: s }
        };
      }
      var b2 = 2 * R.nz(-6, 6), T = b2 * b2 / 4;
      var right = T + R.int(1, 6);
      var cands = [{ v: T, why: "At " + m("k = " + T) + " the discriminant is 0, so there's exactly one real solution." },
                   { v: T - R.int(1, 6), why: "With this value the discriminant " + m("b^{2} - 4k") + " is positive, so there are two real solutions." },
                   { v: -R.int(1, 9), why: "A negative constant makes the discriminant positive: two real solutions." }];
      return {
        type: "mc",
        stem: "<p>" + dm("x^{2}" + A.term(b2, "x", false) + " + k = 0") + "</p><p>In the given equation, " + m("k") + " is a constant. If the equation has no real solutions, which of the following could be the value of " + m("k") + "?</p>",
        choices: numChoices(right, cands, R, null, function (i) { return T - i; }, "With this value the discriminant is positive or zero, so the equation has real solutions."),
        explain: ["No real solutions means the discriminant is negative: " + m(pr(b2) + "^{2} - 4(1)k \\lt 0") + ".",
                  "So " + m(tx(b2 * b2) + " \\lt 4k") + ", which means " + m("k \\gt " + T) + ". Only " + m(tx(right)) + " is greater than " + m(tx(T)) + "."],
        desmos: { steps: ["Type " + m("y=x^{2}" + A.term(b2, "x", false) + "+k") + " and " + m("k=0") + " for a slider.", "Drag " + m("k") + ": the parabola leaves the x-axis once " + m("k") + " goes above " + m(tx(T)) + "."],
                  exprs: ["y=x^{2}" + A.term(b2, "x", false) + "+k", "k=0"], bounds: { left: -b2 / 2 - 8, right: -b2 / 2 + 8, bottom: -10, top: 20 } },
        data: { mode: "nosol", b: b2 }
      };
    },
    check: function (q) {
      var d = q.data;
      if (d.mode === "count") {
        var D = d.co[1] * d.co[1] - 4 * d.co[0] * d.co[2], kind = D > 0 ? "two" : D === 0 ? "one" : "none";
        if (kind !== d.kind || q.choices[q.answer].key !== kind) fail("count");
        return true;
      }
      if (d.mode === "onesol-c") { var c = q.answer; if (!Fr.eq(Fr.sub(Fr(d.b * d.b), Fr.mul(4, c)), 0)) fail("c"); return true; }
      if (d.mode === "onesol-k") { var k = q.answer; if (!Fr.eq(Fr.sub(Fr.mul(k, k), 4 * d.s * d.s), 0) || Fr.val(k) <= 0) fail("k"); return true; }
      q.choices.forEach(function (ch, i) { var none = Fr.val(Fr.sub(Fr(d.b * d.b), Fr.mul(4, ch.v))) < 0; if ((i === q.answer) !== none) fail("nosol " + i); });
      return true;
    }
  });

  add({
    id: "nleq.system", skill: "adv.nleq", levels: [2, 3], title: "Line and parabola system",
    gen: function (R, L) {
      var r1, r2, mm, k;
      do { r1 = R.int(-6, 6); r2 = R.int(-6, 6); } while (r1 === r2);
      mm = R.nz(-4, 4); k = R.int(-8, 8);
      var quad = [1, mm - r1 - r2, r1 * r2 + k];               // (x - r1)(x - r2) + mx + k
      var y1 = mm * r1 + k, y2 = mm * r2 + k;
      var eqs = "\\begin{aligned}y &= " + A.poly(quad) + "\\\\y &= " + A.lin(mm, k) + "\\end{aligned}";
      var ask = L === 2 ? "anyx" : R.pick(["anyx", "ybig"]);
      var big = r1 > r2 ? r1 : r2, ybig = big === r1 ? y1 : y2;
      var ex = ["Set the right sides equal: " + m(A.poly(quad) + " = " + A.lin(mm, k)) + ".",
                "Move everything to one side: " + m(A.poly([1, -r1 - r2, r1 * r2]) + " = 0") + ", which factors as " + m(fac([1, -r1]) + fac([1, -r2]) + " = 0") + ".",
                "So " + m("x = " + tx(r1)) + " or " + m("x = " + tx(r2)) + "."];
      if (ask === "ybig") ex.push("The solution with the greater x-value has " + m("x = " + tx(big)) + ", so " + m("y = " + tx(mm) + "(" + tx(big) + ")" + A.term(k, "", false) + " = " + tx(ybig)) + ".");
      return {
        type: "spr",
        stem: "<p>" + dm(eqs) + "</p><p>" + (ask === "anyx" ? "A solution to the given system of equations is " + m("(x, y)") + ". What is one possible value of " + m("x") + "?"
                                                     : "The given system of equations has two solutions. If " + m("(a, b)") + " is the solution with the greater value of " + m("a") + ", what is the value of " + m("b") + "?") + "</p>",
        answer: ask === "anyx" ? r1 : ybig, alts: ask === "anyx" ? [r2] : undefined,
        explain: ex,
        desmos: { steps: ["Type " + m("y=" + A.poly(quad)) + " and " + m("y=" + A.lin(mm, k)) + ".", "Click the two intersection points: " + m("(" + tx(r1) + ", " + tx(y1) + ")") + " and " + m("(" + tx(r2) + ", " + tx(y2) + ")") + "."],
                  exprs: ["y=" + A.poly(quad), "y=" + A.lin(mm, k)], bounds: S.bounds([[r1, y1], [r2, y2]]) },
        data: { quad: quad, mm: mm, k: k, ask: ask }
      };
    },
    check: function (q) {
      var d = q.data, diff = P.add(d.quad, [0, -d.mm, -d.k]);
      function sol(x) { return P.eval(diff, x).n === 0; }
      if (d.ask === "anyx") { [q.answer].concat(q.alts).forEach(function (x) { if (!sol(x)) fail("not a solution"); }); return true; }
      // the greater root
      var disc = Fr.val(Fr.sub(Fr.mul(diff[1], diff[1]), Fr.mul(4, diff[2]))), big = (-Fr.val(diff[1]) + Math.sqrt(disc)) / 2;
      if (Math.abs(Fr.val(q.answer) - (d.mm * big + d.k)) > 1e-9) fail("y of greater root");
      return true;
    }
  });

  add({
    id: "nleq.radical", skill: "adv.nleq", levels: [3], title: "Radical equation (extraneous solutions)",
    gen: function (R) {
      var b = R.int(-3, 4), s = b + R.int(2, 6), a = (s - b) * (s - b) - s, s2 = 2 * b + 1 - s;
      var lhs = "\\sqrt{" + A.shift("x", a) + "}", rhs = A.shift("x", -b);
      var ex = ["Square both sides: " + m(A.shift("x", a) + " = (" + rhs + ")^{2} = " + A.poly([1, -2 * b, b * b])) + ".",
                "Rearrange: " + m(A.poly([1, -(2 * b + 1), b * b - a]) + " = 0") + ", so " + m(fac([1, -s]) + fac([1, -s2]) + " = 0") + ": " + m("x = " + tx(s)) + " or " + m("x = " + tx(s2)) + ".",
                "Check both in the original equation. " + m("x = " + tx(s)) + ": " + m("\\sqrt{" + tx(s + a) + "} = " + tx(s - b)) + " ✓. " + m("x = " + tx(s2)) + ": " + m("\\sqrt{" + tx(s2 + a) + "} = " + tx(b - s2)) + ", but the right side is " + m(tx(s2 - b)) + " ✗.",
                "Squaring created an extra (extraneous) solution. The only solution is " + m("x = " + tx(s)) + "."];
      var desmos = { steps: ["Graph both sides: " + m("y=" + lhs) + " and " + m("y=" + rhs) + ". They cross only once, at " + m("x=" + tx(s)) + ".",
                             "If you square both sides first, " + m("y=" + A.shift("x", a)) + " and " + m("y=(" + rhs + ")^{2}") + " cross twice. The extra crossing at " + m("x=" + tx(s2)) + " is the extraneous solution."],
                     exprs: ["y=" + lhs, "y=" + rhs], bounds: S.bounds([[s, s - b], [s2, 0], [-a, 0]]) };
      if (R.chance(0.5)) return { type: "spr", stem: "<p>" + dm(lhs + " = " + rhs) + "</p><p>What is the solution to the given equation?</p>", answer: s, explain: ex, desmos: desmos, data: { a: a, b: b, s2: s2 } };
      var labels = [m("x = " + tx(s)) + " only", m("x = " + tx(s2)) + " only", m("x = " + tx(Math.min(s, s2))) + " and " + m("x = " + tx(Math.max(s, s2))), "There are no solutions."];
      var whys = ["", "Check " + m("x = " + tx(s2)) + " in the original: the right side, " + m(tx(s2 - b)) + ", is negative, and a square root can't be negative. And " + m("x = " + tx(s)) + " does work.",
                  "Squaring both sides can create an extra solution. Check each one: " + m("x = " + tx(s2)) + " makes the right side negative, so it doesn't work.",
                  m("x = " + tx(s)) + " works: " + m("\\sqrt{" + tx(s + a) + "} = " + tx(s - b)) + "."];
      return {
        type: "mc", order: "fixed",
        stem: "<p>" + dm(lhs + " = " + rhs) + "</p><p>Which of the following gives all the solutions to the given equation?</p>",
        choices: labels.map(function (t, i) { return { t: t, key: ["s", "s2", "both", "none"][i], ok: i === 0, why: whys[i] }; }),
        explain: ex, desmos: desmos, data: { a: a, b: b, s2: s2, mc: true, s: s }
      };
    },
    check: function (q) {
      var d = q.data, s = q.type === "spr" ? Fr.val(q.answer) : d.s;
      function works(x) { var l = x + d.a, r = x - d.b; return l >= 0 && r >= 0 && r * r === l; }
      if (!works(s)) fail("solution fails");
      if (works(d.s2)) fail("other root also works");
      if ((d.s2 + d.a) !== (d.s2 - d.b) * (d.s2 - d.b)) fail("s2 isn't a root of the squared equation");
      if (q.type === "mc" && q.choices[q.answer].key !== "s") fail("mc key");
      return true;
    }
  });

  add({
    id: "nleq.abs", skill: "adv.nleq", levels: [2], title: "Absolute value equation",
    gen: function (R) {
      var p, a, b, x1, x2, ask, ans;
      for (var t = 0; t < 100; t++) {
        p = R.pick([1, 1, 2, 3]); a = R.int(-9, 9); b = R.int(1, 12);
        x1 = Fr(a + b, p); x2 = Fr(a - b, p); ask = R.pick(["sum", "big", "small"]);
        ans = ask === "sum" ? Fr.add(x1, x2) : ask === "big" ? x1 : x2;
        if (S.fitsGrid(ans)) break;
      }
      var inner = A.lin(p, -a), lhs = "\\left|" + inner + "\\right|";
      var what = ask === "sum" ? "the sum of the solutions" : ask === "big" ? "the greater solution" : "the lesser solution";
      return {
        type: "spr",
        stem: "<p>" + dm(lhs + " = " + b) + "</p><p>What is " + what + " to the given equation?</p>",
        answer: ans,
        explain: ["An absolute value equals " + m(tx(b)) + " when the inside is " + m(tx(b)) + " or " + m(tx(-b)) + ".",
                  m(inner + " = " + b) + " gives " + m("x = " + tx(x1)) + "; " + m(inner + " = " + tx(-b)) + " gives " + m("x = " + tx(x2)) + ".",
                  "So " + what + " is " + m(tx(ans)) + "."],
        desmos: { steps: ["Type " + m("y=" + lhs) + " and " + m("y=" + b) + ".", "Click the two intersections: " + m("x \\approx " + approx(x2)) + " and " + m("x \\approx " + approx(x1)) + "."],
                  exprs: ["y=" + lhs, "y=" + b], bounds: S.bounds([[x1, b], [x2, b]]) },
        data: { p: p, a: a, b: b, ask: ask }
      };
    },
    check: function (q) {
      var d = q.data, x1 = Fr(d.a + d.b, d.p), x2 = Fr(d.a - d.b, d.p);
      [x1, x2].forEach(function (x) { if (!Fr.eq(Fr.abs(Fr.sub(Fr.mul(d.p, x), d.a)), d.b)) fail("abs root"); });
      return eqAns(q, d.ask === "sum" ? Fr.add(x1, x2) : d.ask === "big" ? x1 : x2);
    }
  });

  // ================================================================ Nonlinear functions
  add({
    id: "nlfn.vertex", skill: "adv.nlfn", levels: [2, 3], title: "Vertex, maximum and minimum",
    gen: function (R, L) {
      if (L === 3 && R.chance(0.6)) {
        var p, q;
        do { p = R.int(-8, 8); q = R.int(-8, 8); } while (p === q || Math.abs(p - q) % 2 === 0);
        var co = expand([[1, -p], [1, -q]]), h = Fr(p + q, 2), k = P.eval(co, h);
        var askX = R.chance(0.4);
        return {
          type: "spr",
          stem: "<p>The function " + m("f") + " is defined by " + m("f(x) = " + fac([1, -p]) + fac([1, -q])) + ". " +
                (askX ? "For what value of " + m("x") + " does " + m("f(x)") + " reach its minimum?" : "What is the minimum value of " + m("f(x)") + "?") + "</p>",
          answer: askX ? h : k,
          explain: ["The zeros are " + m("x = " + tx(p)) + " and " + m("x = " + tx(q)) + ". A parabola's vertex is halfway between its zeros: " + m("x = \\frac{" + tx(p) + " + " + pr(q) + "}{2} = " + tx(h)) + ".",
                    askX ? "So the minimum happens at " + m("x = " + tx(h)) + "." : "The minimum value is " + m("f\\left(" + tx(h) + "\\right) = " + tx(k)) + "."],
          desmos: { steps: ["Type " + m("y=" + fac([1, -p]) + fac([1, -q])) + ".", "Click the lowest point of the parabola: Desmos shows " + m("(" + approx(h) + ", " + approx(k) + ")") + "." + (askX ? "" : " " + H.gridTip(k))],
                    exprs: ["y=" + fac([1, -p]) + fac([1, -q])], bounds: S.bounds([[p, 0], [q, 0], [h, k]]) },
          data: { co: co, ask: askX ? "x" : "y" }
        };
      }
      var a = R.pick([1, 2, -1, -2, 3, -3]), h2 = R.int(-6, 6), k2 = R.int(-9, 9);
      var co2 = [a, -2 * a * h2, a * h2 * h2 + k2], word = a > 0 ? "minimum" : "maximum";
      var vform = L === 2 && R.chance(0.35);
      var fx = vform ? tx(a) + "(" + A.shift("x", -h2) + ")^{2}" + A.term(k2, "", false) : A.poly(co2);
      if (vform && a === 1) fx = "(" + A.shift("x", -h2) + ")^{2}" + A.term(k2, "", false);
      if (vform && a === -1) fx = "-(" + A.shift("x", -h2) + ")^{2}" + A.term(k2, "", false);
      var ask = R.pick(["y", "x", "sum"]), ans = ask === "y" ? k2 : ask === "x" ? h2 : h2 + k2;
      var question = ask === "y" ? "What is the " + word + " value of " + m("f(x)") + "?" :
                     ask === "x" ? "For what value of " + m("x") + " does " + m("f(x)") + " reach its " + word + "?" :
                     "The graph of " + m("y = f(x)") + " in the xy-plane has its vertex at " + m("(h, k)") + ". What is the value of " + m("h + k") + "?";
      var ex = vform ? ["In vertex form " + m("a(x - h)^{2} + k") + ", the vertex is " + m("(h, k) = (" + tx(h2) + ", " + tx(k2) + ")") + "."]
                     : ["The vertex's x-coordinate is " + m("x = -\\frac{b}{2a} = -\\frac{" + tx(-2 * a * h2) + "}{2(" + tx(a) + ")} = " + tx(h2)) + ".",
                        "Its y-coordinate is " + m("f(" + tx(h2) + ") = " + tx(k2)) + "."];
      ex.push("Because " + m("a = " + tx(a)) + " is " + (a > 0 ? "positive, the parabola opens up and the vertex is the minimum." : "negative, the parabola opens down and the vertex is the maximum.") +
              (ask === "sum" ? " So " + m("h + k = " + tx(h2) + " + " + pr(k2) + " = " + tx(ans)) + "." : ""));
      return {
        type: "spr",
        stem: "<p>The function " + m("f") + " is defined by " + m("f(x) = " + fx) + ". " + question + "</p>",
        answer: ans, explain: ex,
        desmos: { steps: ["Type " + m("y=" + fx) + ".", "Click the " + (a > 0 ? "lowest" : "highest") + " point: Desmos labels it " + m("(" + tx(h2) + ", " + tx(k2) + ")") + "."],
                  exprs: ["y=" + fx], bounds: S.bounds([[h2, k2], [h2 + 3, k2 + 9 * a]]) },
        data: { co: co2, ask: ask }
      };
    },
    check: function (q) {
      var d = q.data, h = Fr.div(Fr.neg(d.co[1]), Fr.mul(2, d.co[0])), k = P.eval(d.co, h);
      return eqAns(q, d.ask === "x" ? h : d.ask === "y" ? k : Fr.add(h, k));
    }
  });

  var EXPCTX = [
    { f: "P", v: "t", the: "the population of the town", unit: "people", per: "year", desc: "models the population of a town " + m("t") + " years after 2010", grow: true, A: [800, 9000, 50],
      initRight: "The population of the town in 2010", initWrong: ["The increase in the town's population each year", "The town's population one year after 2010", "The greatest population the town will ever reach"] },
    { f: "V", v: "t", the: "the value of the car", unit: "dollars", per: "year", desc: "gives the value, in dollars, of a car " + m("t") + " years after it was bought", grow: false, A: [12000, 40000, 500],
      initRight: "The value of the car, in dollars, when it was bought", initWrong: ["The amount the car's value decreases each year", "The car's value one year after it was bought", "The lowest value the car will ever have"] },
    { f: "N", v: "h", the: "the number of bacteria", unit: "bacteria", per: "hour", desc: "gives the number of bacteria in a sample " + m("h") + " hours after an experiment began", grow: true, A: [100, 900, 50],
      initRight: "The number of bacteria when the experiment began", initWrong: ["The number of bacteria added each hour", "The number of bacteria one hour after the experiment began", "The greatest number of bacteria the sample can hold"] },
    { f: "M", v: "t", the: "the amount of medicine", unit: "milligrams", per: "hour", desc: "gives the amount, in milligrams, of a medicine in a patient's bloodstream " + m("t") + " hours after a dose", grow: false, A: [200, 800, 50],
      initRight: "The amount of medicine, in milligrams, in the bloodstream right after the dose", initWrong: ["The amount of medicine that leaves the bloodstream each hour", "The amount of medicine one hour after the dose", "The smallest amount of medicine that will ever be in the bloodstream"] },
    { f: "F", v: "w", the: "the number of followers", unit: "followers", per: "week", desc: "gives the number of followers of a new account " + m("w") + " weeks after it was created", grow: true, A: [50, 500, 10],
      initRight: "The number of followers when the account was created", initWrong: ["The number of new followers each week", "The number of followers one week after the account was created", "The greatest number of followers the account will ever have"] }
  ];
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  add({
    id: "nlfn.exp", skill: "adv.nlfn", levels: [1, 2], title: "Interpret an exponential model",
    gen: function (R) {
      var c = R.pick(EXPCTX), r = c.grow ? R.pick([2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25]) : R.pick([5, 8, 10, 12, 15, 20, 25, 30]);
      var Aval = R.step(c.A[0], c.A[1], c.A[2]), base = c.grow ? Fr.add(1, Fr(r, 100)) : Fr.sub(1, Fr(r, 100));
      var fx = c.f + "(" + c.v + ") = " + tx(Aval) + "(" + td(base) + ")^{" + c.v + "}";
      var ask = R.pick(["rate", "rate", "init"]), choices, ex;
      if (ask === "rate") {
        var up = c.grow ? "increases" : "decreases";
        choices = [
          { t: cap(c.the) + " " + up + " by " + r + "% each " + c.per + ".", ok: true },
          { t: cap(c.the) + " " + up + " by " + (c.grow ? 100 + r : 100 - r) + "% each " + c.per + ".",
            why: c.grow ? "A factor of " + td(base) + " makes each " + c.per + "'s amount " + (100 + r) + "% of the one before: an increase of " + r + "%, not " + (100 + r) + "%." : "A factor of " + td(base) + " keeps " + (100 - r) + "% each " + c.per + ", so the amount drops by " + r + "%." },
          { t: cap(c.the) + " " + up + " by " + r + " " + c.unit + " each " + c.per + ".", why: "Exponential change is by a percent each " + c.per + ", not by a fixed number of " + c.unit + "." },
          { t: cap(c.the) + " " + (c.grow ? "decreases" : "increases") + " by " + r + "% each " + c.per + ".", why: "The factor " + td(base) + " is " + (c.grow ? "greater" : "less") + " than 1, so the amount " + up + "." }
        ];
        ex = ["In " + m("a(b)^{" + c.v + "}") + ", the base " + m("b") + " is the growth factor: each " + c.per + " the amount is multiplied by " + m(td(base)) + ".",
              "Multiplying by " + m(td(base)) + " means " + (c.grow ? "adding " + r + "%" : "losing " + r + "%") + " (" + m(td(base) + " = 1 " + (c.grow ? "+" : "-") + " " + td(Fr(r, 100))) + "). So " + c.the + " " + up + " by " + r + "% each " + c.per + "."];
      } else {
        var whys = ["That's a rate of change. " + m(tx(Aval)) + " is the starting amount, the value when " + m(c.v + " = 0") + ".",
                    "After one " + c.per + " the amount is " + m(tx(Aval) + "(" + td(base) + ")") + ", not " + m(tx(Aval)) + ".",
                    "Nothing in the model sets a limit like that. " + m(tx(Aval)) + " is the value when " + m(c.v + " = 0") + "."];
        choices = [{ t: c.initRight, ok: true }].concat(c.initWrong.map(function (w, i) { return { t: w, why: whys[i] }; }));
        ex = ["Set " + m(c.v + " = 0") + ": " + m(c.f + "(0) = " + tx(Aval) + "(" + td(base) + ")^{0} = " + tx(Aval)) + ".",
              "So " + m(tx(Aval)) + " is the value at the start: " + c.initRight.charAt(0).toLowerCase() + c.initRight.slice(1) + "."];
      }
      return {
        type: "mc",
        stem: "<p>The function " + m(fx) + " " + c.desc + ". " + (ask === "rate" ? "Which statement is the best interpretation of " + m(td(base)) : "What is the best interpretation of " + m(tx(Aval))) + " in this context?</p>",
        choices: choices, explain: ex,
        desmos: { steps: ["Type " + m("f(x)=" + tx(Aval) + "(" + td(base) + ")^{x}") + ", then " + m("f(0)") + " and " + m("\\frac{f(1)}{f(0)}") + ".",
                          "Desmos shows " + m("f(0)=" + tx(Aval)) + " (the starting value) and " + m("\\frac{f(1)}{f(0)}=" + td(base)) + " (the factor each " + c.per + ")."],
                  exprs: ["f(x)=" + tx(Aval) + "(" + td(base) + ")^{x}", "f(0)", "\\frac{f(1)}{f(0)}"], bounds: { left: -1, right: 15, bottom: -Aval * 0.1, top: Aval * (c.grow ? 3 : 1.3) } },
        data: { ask: ask }
      };
    },
    check: function (q) { if (!q.choices[q.answer].ok) fail("exp interpretation"); return true; }
  });

  add({
    id: "nlfn.expmodel", skill: "adv.nlfn", levels: [2, 3], title: "Write an exponential model",
    gen: function (R, L) {
      var kind = L === 2 ? R.pick(["grow", "decay"]) : R.pick(["double", "half", "grow", "decay"]);
      var A0, r, d, right, cands, stem, ex, expect;
      function expT(base, div, mul) { return { kind: "exp", base: Fr.of(base), div: div || 1, mul: mul || 1 }; }
      function show(c) {
        if (c.kind === "lin") return m(tx(A0) + "(1 + " + td(c.rate) + "t)");
        var e = c.div !== 1 ? "^{\\frac{t}{" + c.div + "}}" : c.mul !== 1 ? "^{" + c.mul + "t}" : "^{t}";
        return m(tx(A0) + "(" + td(c.base) + ")" + e);
      }
      if (kind === "grow" || kind === "decay") {
        r = R.pick([2, 3, 4, 5, 6, 8, 12, 15, 25]); A0 = kind === "grow" ? R.step(2000, 60000, 500) : R.step(600, 2400, 50);
        var f = kind === "grow" ? Fr.add(1, Fr(r, 100)) : Fr.sub(1, Fr(r, 100));
        right = expT(f);
        cands = [Object.assign(expT(Fr(r, 100)), { why: "Raising " + td(Fr(r, 100)) + " to a power makes the amount shrink toward 0 fast. The yearly factor is " + m("1 " + (kind === "grow" ? "+" : "-") + " " + td(Fr(r, 100)) + " = " + td(f)) + "." }),
                 { kind: "lin", rate: kind === "grow" ? Fr(r, 100) : Fr(-r, 100), why: "That's linear: it adds the same amount (" + r + "% of the starting value) every year. A percent change each year multiplies by the same factor." },
                 Object.assign(expT(kind === "grow" ? Fr.add(1, Fr(r, 10)) : Fr.add(1, Fr(r, 100))), { why: kind === "grow" ? r + "% is " + td(Fr(r, 100)) + ", not " + td(Fr(r, 10)) + "." : "A factor greater than 1 means the amount grows." })];
        if (kind === "decay") cands[1].why = "That's linear: it subtracts the same amount (" + r + "% of the starting value) every year. A percent decrease multiplies by the same factor.";
        stem = kind === "grow" ? "A town has a population of " + fm.num(A0) + ". The population is expected to increase by " + r + "% each year. Which function " + m("P") + " gives the expected population " + m("t") + " years from now?"
                               : "A new laptop costs " + fm.money(A0) + ". Its value decreases by " + r + "% each year. Which function " + m("V") + " gives the laptop's value, in dollars, " + m("t") + " years after it's bought?";
        ex = ["Each year the amount is multiplied by " + m("1 " + (kind === "grow" ? "+" : "-") + " " + td(Fr(r, 100)) + " = " + td(f)) + ".",
              "After " + m("t") + " years it has been multiplied " + m("t") + " times: " + show(right) + "."];
        expect = function (t) { return Fr.val(A0) * Math.pow(Fr.val(f), t); };
      } else {
        d = R.pick([2, 3, 4, 5, 6, 8, 10]); A0 = kind === "double" ? R.step(100, 2000, 50) : R.step(40, 400, 20);
        var b = kind === "double" ? Fr(2) : Fr(1, 2);
        right = expT(b, d);
        cands = [Object.assign(expT(b, 1, d), { why: "With " + m("dt") + " in the exponent the amount " + (kind === "double" ? "doubles" : "halves") + " " + d + " times every hour, far too often. The exponent should count how many " + d + "-hour periods have passed: " + m("\\frac{t}{" + d + "}") + "." }),
                 Object.assign(expT(b), { why: "This " + (kind === "double" ? "doubles" : "halves") + " every hour, not every " + d + " hours." }),
                 Object.assign(expT(Fr.mul(b, d)), { why: "The factor for each period is " + td(b) + ". Multiplying it by " + d + " doesn't spread it over " + d + " hours." })];
        var unit = kind === "double" ? "hours" : "years";
        cands.forEach(function (c) { c.why = c.why.replace(/hour/g, unit.slice(0, -1)); });
        stem = kind === "double" ? "A sample contains " + fm.num(A0) + " bacteria, and the number of bacteria doubles every " + d + " hours. Which function gives the number of bacteria " + m("t") + " hours from now?"
                                 : "A radioactive substance has a mass of " + fm.num(A0) + " grams, and its mass is cut in half every " + d + " years. Which function gives its mass, in grams, " + m("t") + " years from now?";
        ex = ["Every " + d + " " + unit + " the amount is multiplied by " + m(td(b)) + ". After " + m("t") + " " + unit + ", " + m("\\frac{t}{" + d + "}") + " of those periods have passed.",
              "So the function is " + show(right) + ". Check: at " + m("t = " + d) + " it gives " + m(tx(A0) + "(" + td(b) + ")^{1} = " + td(Fr.mul(A0, b))) + "."];
        expect = function (t) { return Fr.val(A0) * Math.pow(Fr.val(b), t / d); };
      }
      var choices = [Object.assign({ ok: true }, right)].concat(cands).map(function (c) { return { t: show(c), ok: !!c.ok, why: c.why, fn: c }; });
      return {
        type: "mc", stem: "<p>" + stem + "</p>", choices: choices, explain: ex,
        desmos: { steps: ["Graph each choice. Then check one value you know from the story, for example where it should be after " + (d ? m("t = " + d) : m("t = 1")) + ".",
                          "Only " + show(right) + " gives the right value there and keeps changing by the same factor."],
                  exprs: [], bounds: { left: -1, right: d ? 4 * d : 12, bottom: 0, top: Fr.val(A0) * (kind === "double" ? 10 : kind === "grow" ? 2.5 : 1.2) } },
        data: { A0: A0, kind: kind, d: d || 1, r: r || 0 }
      };
    },
    check: function (q) {
      var d = q.data, A0 = Fr.val(d.A0);
      function expect(t) {
        if (d.kind === "grow") return A0 * Math.pow(1 + d.r / 100, t);
        if (d.kind === "decay") return A0 * Math.pow(1 - d.r / 100, t);
        return A0 * Math.pow(d.kind === "double" ? 2 : 0.5, t / d.d);
      }
      function val(c, t) { return c.kind === "lin" ? A0 * (1 + Fr.val(c.rate) * t) : A0 * Math.pow(Fr.val(c.base), t * c.mul / c.div); }
      q.choices.forEach(function (c, i) {
        var same = [1, 2, d.d, 2 * d.d, 7].every(function (t) { return Math.abs(val(c.fn, t) - expect(t)) <= 1e-6 * Math.max(1, expect(t)); });
        if ((i === q.answer) !== same) fail("model choice " + i);
      });
      return true;
    }
  });

  add({
    id: "nlfn.eval", skill: "adv.nlfn", levels: [1, 2], title: "Function notation and composition",
    gen: function (R, L) {
      var variant = L === 1 ? R.pick(["quad", "comp"]) : R.pick(["quad", "exp", "comp"]);
      if (variant === "quad") {
        var a = R.nz(-4, 4), b = R.int(-9, 9), c = R.int(-9, 9), p = R.nz(-5, 5), co = [a, b, c], v = P.eval(co, p);
        return {
          type: "spr",
          stem: "<p>The function " + m("f") + " is defined by " + m("f(x) = " + A.poly(co)) + ". What is the value of " + m("f(" + tx(p) + ")") + "?</p>",
          answer: v,
          explain: ["Substitute " + m("x = " + tx(p)) + ": " + m("f(" + tx(p) + ") = " + A.expr([[a, pr(p) + "^{2}"], [b, "(" + tx(p) + ")"], [c, ""]]) + " = " + tx(v)) + ".",
                    "Careful with the square: " + m(pr(p) + "^{2} = " + tx(p * p)) + "."],
          desmos: { steps: ["Type " + m("f(x)=" + A.poly(co)) + ", then " + m("f(" + tx(p) + ")") + " on the next line.", "Desmos shows " + m(tx(v)) + "."], exprs: ["f(x)=" + A.poly(co), "f(" + tx(p) + ")"] },
          data: { kind: "quad", co: co, p: p }
        };
      }
      if (variant === "exp") {
        var base = R.pick([Fr(2), Fr(3), Fr(4), Fr(1, 2)]), a0 = Fr.eq(base, Fr(1, 2)) ? R.pick([16, 32, 48, 64]) : R.int(2, 9), n = R.pick([2, 3, 4]);
        if (Fr.eq(base, Fr(4)) && n === 4) n = 3;
        var f1 = Fr.mul(a0, base), fn = Fr.mul(a0, Fr.pow(base, n));
        return {
          type: "spr",
          stem: "<p>For the exponential function " + m("f") + ", " + m("f(0) = " + tx(a0)) + " and " + m("f(1) = " + tx(f1)) + ". The function is defined by " + m("f(x) = a(b)^{x}") + ", where " + m("a") + " and " + m("b") + " are constants. What is the value of " + m("f(" + n + ")") + "?</p>",
          answer: fn,
          explain: [m("f(0) = a(b)^{0} = a") + ", so " + m("a = " + tx(a0)) + ".",
                    m("f(1) = ab") + ", so " + m("b = \\frac{" + tx(f1) + "}{" + tx(a0) + "} = " + tx(base)) + ".",
                    "Then " + m("f(" + n + ") = " + tx(a0) + "(" + tx(base) + ")^{" + n + "} = " + tx(fn)) + "."],
          desmos: { steps: ["Use regression: " + m("x_1=[0,1]") + ", " + m("y_1=[" + tx(a0) + "," + tx(f1) + "]") + ", then " + m("y_1\\sim ab^{x_1}") + ". Desmos finds " + m("a") + " and " + m("b") + ".",
                            "Type " + m("ab^{" + n + "}") + " to get " + m(tx(fn)) + "."],
                    exprs: ["x_1=[0,1]", "y_1=[" + tx(a0) + "," + tx(f1) + "]", "y_1\\sim ab^{x_1}", "ab^{" + n + "}"] },
          data: { kind: "exp", a0: a0, f1: f1, n: n }
        };
      }
      var p2 = R.nz(-5, 5), q2 = R.int(-9, 9), r2 = R.int(-9, 9), k = R.nz(-4, 4), outerF = R.chance(0.5);
      var fdef = "f(x) = " + A.lin(p2, q2), gdef = "g(x) = " + A.poly([1, 0, r2]);
      var inner = outerF ? k * k + r2 : p2 * k + q2, val = outerF ? p2 * inner + q2 : inner * inner + r2;
      var expr = outerF ? "f(g(" + tx(k) + "))" : "g(f(" + tx(k) + "))";
      return {
        type: "spr",
        stem: "<p>The functions " + m("f") + " and " + m("g") + " are defined by " + m(fdef) + " and " + m(gdef) + ". What is the value of " + m(expr) + "?</p>",
        answer: val,
        explain: ["Work from the inside out. " + (outerF ? m("g(" + tx(k) + ") = " + pr(k) + "^{2}" + A.term(r2, "", false) + " = " + tx(inner)) : m("f(" + tx(k) + ") = " + tx(p2) + "(" + tx(k) + ")" + A.term(q2, "", false) + " = " + tx(inner))) + ".",
                  "Then " + (outerF ? m("f(" + tx(inner) + ") = " + tx(p2) + "(" + tx(inner) + ")" + A.term(q2, "", false) + " = " + tx(val)) : m("g(" + tx(inner) + ") = " + pr(inner) + "^{2}" + A.term(r2, "", false) + " = " + tx(val))) + "."],
        desmos: { steps: ["Type " + m(fdef.replace(" = ", "=")) + " and " + m(gdef.replace(" = ", "=")) + ".", "Type " + m(expr) + ". Desmos shows " + m(tx(val)) + "."],
                  exprs: [fdef.replace(/ /g, ""), gdef.replace(/ /g, ""), expr] },
        data: { kind: "comp", p: p2, q: q2, r: r2, k: k, outerF: outerF }
      };
    },
    check: function (q) {
      var d = q.data;
      if (d.kind === "quad") return eqAns(q, P.eval(d.co, d.p));
      if (d.kind === "exp") { var b = Fr.div(d.f1, d.a0); return eqAns(q, Fr.mul(d.a0, Fr.pow(b, d.n))); }
      var f = function (x) { return d.p * x + d.q; }, g = function (x) { return x * x + d.r; };
      return eqAns(q, Fr(d.outerF ? f(g(d.k)) : g(f(d.k))));
    }
  });

  add({
    id: "nlfn.transform", skill: "adv.nlfn", levels: [3], title: "Transformations of functions",
    gen: function (R) {
      if (R.chance(0.5)) {
        var a = R.pick([1, 2, 3]), h = R.int(-5, 5), k = R.int(-8, 8), p = R.nz(-4, 4), q = R.nz(-6, 6);
        var co = [a, -2 * a * h, a * h * h + k], ask = R.pick(["min", "x"]);
        var gdef = "g(x) = f(" + A.shift("x", p) + ")" + A.term(q, "", false);
        var ans = ask === "min" ? k + q : h - p;
        return {
          type: "spr",
          stem: "<p>The function " + m("f") + " is defined by " + m("f(x) = " + A.poly(co)) + ". The function " + m("g") + " is defined by " + m(gdef) + ". " +
                (ask === "min" ? "What is the minimum value of " + m("g(x)") + "?" : "For what value of " + m("x") + " does " + m("g(x)") + " reach its minimum?") + "</p>",
          answer: ans,
          explain: ["The vertex of " + m("f") + " is at " + m("x = -\\frac{b}{2a} = " + tx(h)) + ", and " + m("f(" + tx(h) + ") = " + tx(k)) + ": the point " + m("(" + tx(h) + ", " + tx(k) + ")") + ".",
                    m("f(" + A.shift("x", p) + ")") + " moves the graph " + Math.abs(p) + " unit" + (Math.abs(p) > 1 ? "s" : "") + " to the " + (p > 0 ? "left" : "right") + ", and " + m(A.term(q, "", true)) + " moves it " + Math.abs(q) + " unit" + (Math.abs(q) > 1 ? "s" : "") + " " + (q > 0 ? "up" : "down") + ".",
                    "So the vertex of " + m("g") + " is " + m("(" + tx(h - p) + ", " + tx(k + q) + ")") + ": " + (ask === "min" ? "the minimum value is " + m(tx(k + q)) : "the minimum happens at " + m("x = " + tx(h - p))) + "."],
          desmos: { steps: ["Type " + m("f(x)=" + A.poly(co)) + " and " + m(gdef.replace(" = ", "=")) + ".", "Click the lowest point of " + m("g") + "'s graph: " + m("(" + tx(h - p) + ", " + tx(k + q) + ")") + "."],
                    exprs: ["f(x)=" + A.poly(co), gdef.replace(/ /g, "")], bounds: S.bounds([[h, k], [h - p, k + q]]) },
          data: { kind: "vertex", co: co, p: p, q: q, ask: ask }
        };
      }
      var xs = [0, 1, 2, 3, 4, 5], fs = xs.map(function () { return R.int(-9, 12); }), s = R.int(1, 3), t = R.nz(-6, 6), xStar = R.int(s, 5);
      while (xStar - s < 0 || xStar - s > 5) xStar = R.int(s, 5);
      var fv = fs[xStar - s], ans2 = fv + t;
      var tbl = S.table([m("x")].concat(xs.map(String)), [[m("f(x)")].concat(fs.map(function (v) { return tx(v) === String(v) ? String(v) : m(tx(v)); }))], { firstCol: true });
      var gdef2 = "g(x) = f(" + A.shift("x", -s) + ")" + A.term(t, "", false);
      return {
        type: "spr",
        stem: "<p>The table shows some values of the function " + m("f") + ".</p>" + tbl + "<p>The function " + m("g") + " is defined by " + m(gdef2) + ". What is the value of " + m("g(" + xStar + ")") + "?</p>",
        answer: ans2,
        explain: ["Substitute " + m("x = " + xStar) + ": " + m("g(" + xStar + ") = f(" + xStar + " - " + s + ")" + A.term(t, "", false) + " = f(" + (xStar - s) + ")" + A.term(t, "", false)) + ".",
                  "From the table, " + m("f(" + (xStar - s) + ") = " + tx(fv)) + ", so " + m("g(" + xStar + ") = " + tx(fv) + A.term(t, "", false) + " = " + tx(ans2)) + "."],
        desmos: { steps: ["Work out the input first: " + m(xStar + " - " + s + " = " + (xStar - s)) + ". Read " + m("f(" + (xStar - s) + ") = " + tx(fv)) + " from the table.",
                          "Use Desmos as a calculator for the last step: " + m(tx(fv) + A.term(t, "", false)) + "."],
                  exprs: [tx(fv) + A.term(t, "", false).replace(/ /g, "")] },
        data: { kind: "table", fs: fs, s: s, t: t, x: xStar }
      };
    },
    check: function (q) {
      var d = q.data;
      if (d.kind === "table") return eqAns(q, Fr(d.fs[d.x - d.s] + d.t));
      // g(x) = f(x + p) + q; minimize numerically over a fine grid and compare
      var best = Infinity, bx = 0;
      for (var x = -30; x <= 30; x += 0.5) { var v = Fr.val(P.eval(d.co, x + d.p)) + d.q; if (v < best) { best = v; bx = x; } }
      if (d.ask === "min" && Math.abs(Fr.val(q.answer) - best) > 1e-9) fail("g min");
      if (d.ask === "x" && Math.abs(Fr.val(q.answer) - bx) > 1e-9) fail("g argmin");
      return true;
    }
  });

  add({
    id: "nlfn.zeros", skill: "adv.nlfn", levels: [2, 3], title: "Zeros and x-intercepts",
    gen: function (R) {
      var r1, r2, c, dd, roots;
      for (var t = 0; t < 200; t++) {
        r1 = R.nz(-6, 6); r2 = R.nz(-6, 6); c = R.pick([2, 3]); dd = R.nz(-9, 9);
        if (r1 === r2 || S.gcd(c, Math.abs(dd)) !== 1) continue;
        roots = [Fr(r1), Fr(r2), Fr(dd, c)];
        var isRoot = function (x) { return roots.some(function (z) { return Fr.eq(z, x); }); };
        if (isRoot(Fr(-r1)) || isRoot(Fr(-r2)) || isRoot(Fr(dd))) continue;
        break;
      }
      var fx = fac([1, -r1]) + fac([1, -r2]) + fac([c, -dd]);
      var pick = R.int(0, 2), right = roots[pick];
      var pt = function (x, y) { return m("(" + tx(x) + ", " + tx(y) + ")"); };
      var cands = [
        { x: Fr(-r1), y: Fr(0), why: "The factor " + m(fac([1, -r1])) + " is 0 when " + m("x = " + tx(r1)) + ", so that intercept is " + pt(r1, 0) + ", not " + pt(-r1, 0) + "." },
        { x: Fr(dd), y: Fr(0), why: m(A.lin(c, -dd) + " = 0") + " when " + m("x = " + tx(Fr(dd, c))) + ", not " + m("x = " + tx(dd)) + "." },
        { x: Fr(0), y: right, why: "An x-intercept lies on the x-axis, so its y-coordinate is 0. This point is on the y-axis." },
        { x: Fr(-r2), y: Fr(0), why: "The factor " + m(fac([1, -r2])) + " is 0 when " + m("x = " + tx(r2)) + ", not " + m("x = " + tx(-r2)) + "." },
        { x: Fr(-dd, c), y: Fr(0), why: m(A.lin(c, -dd) + " = 0") + " when " + m("x = " + tx(Fr(dd, c))) + ". The sign is off." }
      ];
      var seen = [[right, Fr(0)]];
      cands = R.shuffle(cands).filter(function (cd) {
        if (seen.some(function (s) { return Fr.eq(s[0], cd.x) && Fr.eq(s[1], cd.y); })) return false;
        seen.push([cd.x, cd.y]);
        return true;
      }).slice(0, 3);
      return {
        type: "mc",
        stem: "<p>The function " + m("p") + " is defined by " + m("p(x) = " + fx) + ". Which of the following is an x-intercept of the graph of " + m("y = p(x)") + " in the xy-plane?</p>",
        choices: [{ t: pt(right, 0), x: right, y: Fr(0), ok: true }].concat(cands.map(function (cd) { return { t: pt(cd.x, cd.y), x: cd.x, y: cd.y, why: cd.why }; })),
        explain: ["The graph crosses the x-axis where " + m("p(x) = 0") + ", which happens when one of the factors is 0.",
                  "The zeros are " + m("x = " + tx(r1)) + ", " + m("x = " + tx(r2)) + " and " + m("x = " + tx(Fr(dd, c))) + ". So the x-intercepts are " + pt(r1, 0) + ", " + pt(r2, 0) + " and " + pt(Fr(dd, c), 0) + ".",
                  "Only " + pt(right, 0) + " appears in the choices."],
        desmos: { steps: ["Type " + m("y=" + fx) + ".", "Click where the graph crosses the x-axis: Desmos marks all three x-intercepts. Compare them with the choices (" + m(tx(Fr(dd, c))) + " ≈ " + approx(Fr(dd, c)) + ")."],
                  exprs: ["y=" + fx], bounds: { left: -8, right: 8, bottom: -60, top: 60 } },
        data: { r1: r1, r2: r2, c: c, d: dd }
      };
    },
    check: function (q) {
      var d = q.data;
      function p(x) { return Fr.mul(Fr.mul(Fr.sub(x, d.r1), Fr.sub(x, d.r2)), Fr.sub(Fr.mul(d.c, x), d.d)); }
      q.choices.forEach(function (ch, i) { var hit = ch.y.n === 0 && p(ch.x).n === 0; if ((i === q.answer) !== hit) fail("zero choice " + i); });
      return true;
    }
  });
})(typeof window !== "undefined" ? window : globalThis);
