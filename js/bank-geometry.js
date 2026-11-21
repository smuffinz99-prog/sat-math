/* SAT Math question templates: Geometry and Trigonometry. */
(function (G) {
  "use strict";
  var S = G.SATM, Fr = S.Fr, fm = S.fmt, tx = fm.tex, td = fm.texd, m = S.m, H = S.H;
  var add = S.addTemplate, fail = H.fail, eqAns = H.eqAns, approx = H.approx;

  function calc(expr, result, deg) { return { steps: ["Type " + m(expr) + ". Desmos shows " + m(result) + "."], exprs: [expr], degree: !!deg }; }
  function piTex(c) { c = Fr.of(c); return (Fr.eq(c, 1) ? "" : tx(c)) + "\\pi"; }
  function simpRoot(N) { var out = 1, inn = N; for (var f = 2; f * f <= inn; f++) while (inn % (f * f) === 0) { inn /= f * f; out *= f; } return { out: out, inn: inn }; }
  function rootTex(N, coef) {
    var s = simpRoot(N), o = Fr.mul(s.out, coef === undefined ? 1 : coef);
    if (s.inn === 1) return tx(o);
    return (Fr.eq(o, 1) ? "" : tx(o)) + "\\sqrt{" + s.inn + "}";
  }
  function key(v) { return Fr.of(v.toFixed(6)); }                  // sort key for irrational choices
  var TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]];

  // ================================================================ Area and volume
  var SOLIDS = {
    cyl: { name: "right circular cylinder", f: function (r, h) { return Fr(r * r * h); }, formula: "V = \\pi r^{2}h",
      wrong: function (r, h) { return [{ c: Fr(2 * r * h), why: "That's the area of the curved side, " + m("2\\pi rh") + ", not the volume." },
                                       { c: Fr(r * h), why: "The radius has to be squared: " + m("V = \\pi r^{2}h") + "." },
                                       { c: Fr(4 * r * r * h), why: "That uses the diameter, " + m(2 * r) + ", in place of the radius." }]; } },
    cone: { name: "right circular cone", f: function (r, h) { return Fr(r * r * h, 3); }, formula: "V = \\frac{1}{3}\\pi r^{2}h",
      wrong: function (r, h) { return [{ c: Fr(r * r * h), why: "That's a cylinder's volume. A cone holds a third as much: " + m("\\frac{1}{3}\\pi r^{2}h") + "." },
                                       { c: Fr(4 * r * r * h, 3), why: "That uses the diameter, " + m(2 * r) + ", in place of the radius." },
                                       { c: Fr(r * h * h, 3), why: "That squares the height instead of the radius." }]; } },
    sph: { name: "sphere", f: function (r) { return Fr(4 * r * r * r, 3); }, formula: "V = \\frac{4}{3}\\pi r^{3}",
      wrong: function (r) { return [{ c: Fr(4 * r * r), why: "That's the surface area, " + m("4\\pi r^{2}") + ", not the volume." },
                                    { c: Fr(4 * r * r, 3), why: "The radius has to be cubed: " + m("\\frac{4}{3}\\pi r^{3}") + "." },
                                    { c: Fr(32 * r * r * r, 3), why: "That uses the diameter, " + m(2 * r) + ", in place of the radius." }]; } }
  };
  add({
    id: "area.volume", skill: "geo.area", levels: [1, 2], title: "Volume",
    gen: function (R, L) {
      var variant = L === 1 ? R.pick(["prism", "pi"]) : R.pick(["pi", "pyramid", "cube", "height"]);
      if (variant === "pi") {
        var kind = R.pick(["cyl", "cone", "sph"]), sol = SOLIDS[kind], r = R.int(2, 6), h = R.int(3, 12);
        if (kind === "cone") while ((r * r * h) % 3) h++;
        var v = sol.f(r, h), w = sol.wrong(r, h);
        var dims = kind === "sph" ? "a radius of " + r + " centimeters" : "a radius of " + r + " centimeters and a height of " + h + " centimeters";
        return {
          type: "mc",
          stem: "<p>A " + sol.name + " has " + dims + ". What is the volume, in cubic centimeters, of the " + sol.name.replace("right circular ", "") + "?</p>",
          choices: H.numChoices(v, w.map(function (x) { return { v: x.c, why: x.why }; }), R, function (c) { return m(piTex(c)); }, null,
                                "That doesn't match " + m(sol.formula) + " with these measurements. Substitute carefully."),
          explain: ["The reference sheet gives " + m(sol.formula) + ".", "Substitute: " + m(sol.formula.replace("V = ", "V = ").replace("r^{2}", "(" + r + ")^{2}").replace("r^{3}", "(" + r + ")^{3}").replace("h", "(" + h + ")") + " = " + piTex(v)) + "."],
          desmos: { steps: ["Type the formula with the numbers in it: " + m(sol.formula.replace("V = ", "").replace("r^{2}", r + "^{2}").replace("r^{3}", r + "^{3}").replace("h", "\\cdot " + h)) + ". Desmos gives a decimal, about " + approx(Fr.of((Fr.val(v) * Math.PI).toFixed(3))) + ".",
                            "Divide that by " + m("\\pi") + " (type " + m("\\frac{\\text{ans}}{\\pi}") + ") to match a choice written as a number times " + m("\\pi") + ": " + m(tx(v)) + "."],
                    exprs: [sol.formula.replace("V = ", "").replace("r^{2}", r + "^{2}").replace("r^{3}", r + "^{3}").replace("h", "\\cdot " + h)] },
          data: { kind: kind, r: r, h: h }
        };
      }
      if (variant === "prism") {
        var l = R.int(3, 15), wd = R.int(2, 12), hh = R.int(2, 10);
        return { type: "spr", stem: "<p>A rectangular box has a length of " + l + " inches, a width of " + wd + " inches, and a height of " + hh + " inches. What is the volume, in cubic inches, of the box?</p>",
                 answer: l * wd * hh, explain: ["Volume of a rectangular prism: " + m("V = \\ell wh = " + l + "\\cdot " + wd + "\\cdot " + hh + " = " + l * wd * hh) + "."],
                 desmos: calc(l + "\\cdot " + wd + "\\cdot " + hh, String(l * wd * hh)), data: { kind: "prism", dims: [l, wd, hh] } };
      }
      if (variant === "height") {
        var l2 = R.int(3, 12), w2 = R.int(2, 10), h2 = R.int(2, 15), V2 = l2 * w2 * h2;
        return { type: "spr", stem: "<p>A rectangular prism has a volume of " + fm.num(V2) + " cubic meters, a length of " + l2 + " meters, and a width of " + w2 + " meters. What is the height, in meters, of the prism?</p>",
                 answer: h2, explain: [m("V = \\ell wh") + ", so " + m(tx(V2) + " = " + l2 + "\\cdot " + w2 + "\\cdot h = " + l2 * w2 + "h") + ".", "So " + m("h = \\frac{" + tx(V2) + "}{" + l2 * w2 + "} = " + h2) + "."],
                 desmos: calc("\\frac{" + V2 + "}{" + l2 + "\\cdot " + w2 + "}", String(h2)), data: { kind: "height", V: V2, l: l2, w: w2 } };
      }
      if (variant === "pyramid") {
        var s = R.int(3, 12), ph = R.int(3, 15);
        while ((s * s * ph) % 3) ph++;
        var pv = s * s * ph / 3;
        return { type: "spr", stem: "<p>A pyramid has a square base with sides of length " + s + " feet and a height of " + ph + " feet. What is the volume, in cubic feet, of the pyramid?</p>",
                 answer: pv, explain: ["The reference sheet gives " + m("V = \\frac{1}{3}\\ell wh") + " for a rectangular pyramid.", m("V = \\frac{1}{3}(" + s + ")(" + s + ")(" + ph + ") = " + tx(pv)) + "."],
                 desmos: calc("\\frac{1}{3}\\cdot " + s + "^{2}\\cdot " + ph, tx(pv)), data: { kind: "pyramid", s: s, h: ph } };
      }
      var e = R.int(2, 9), SA = 6 * e * e;
      return { type: "spr", stem: "<p>The surface area of a cube is " + SA + " square centimeters. What is the volume, in cubic centimeters, of the cube?</p>",
               answer: e * e * e, explain: ["A cube has 6 square faces, so each face has area " + m("\\frac{" + SA + "}{6} = " + e * e) + " and each edge is " + m("\\sqrt{" + e * e + "} = " + e) + ".", "Volume: " + m(e + "^{3} = " + e * e * e) + "."],
               desmos: calc("\\left(\\sqrt{\\frac{" + SA + "}{6}}\\right)^{3}", String(e * e * e)), data: { kind: "cube", SA: SA } };
    },
    check: function (q) {
      var d = q.data;
      if (SOLIDS[d.kind]) {
        var want = d.kind === "cyl" ? Fr(d.r * d.r * d.h) : d.kind === "cone" ? Fr(d.r * d.r * d.h, 3) : Fr(4 * d.r * d.r * d.r, 3);
        q.choices.forEach(function (c, i) { if ((i === q.answer) !== Fr.eq(c.v, want)) fail("volume choice " + i); });
        return true;
      }
      if (d.kind === "prism") return eqAns(q, Fr(d.dims[0] * d.dims[1] * d.dims[2]));
      if (d.kind === "height") { if (!Fr.eq(Fr.mul(q.answer, d.l * d.w), d.V)) fail("height"); return true; }
      if (d.kind === "pyramid") return eqAns(q, Fr(d.s * d.s * d.h, 3));
      var edge = Math.sqrt(d.SA / 6);
      return eqAns(q, Fr(Math.round(edge * edge * edge)));
    }
  });

  add({
    id: "area.scale", skill: "geo.area", levels: [2, 3], title: "Scaling area and volume",
    gen: function (R, L) {
      var variant = L === 2 ? R.pick(["cube", "similar"]) : R.pick(["similar", "percent"]);
      if (variant === "cube") {
        var k = R.int(2, 5), what = R.pick(["volume", "surface area"]), f = what === "volume" ? k * k * k : k * k;
        return {
          type: "spr",
          stem: "<p>The edge length of a cube is multiplied by " + k + ". The " + what + " of the new cube is how many times the " + what + " of the original cube?</p>",
          answer: f,
          explain: ["Lengths scale by " + k + ". Areas scale by " + m(k + "^{2} = " + k * k) + ", and volumes by " + m(k + "^{3} = " + k * k * k) + ".", "So the " + what + " is multiplied by " + m(f) + "."],
          desmos: calc(k + "^{" + (what === "volume" ? 3 : 2) + "}", String(f)),
          data: { kind: "cube", k: k, what: what }
        };
      }
      if (variant === "similar") {
        var p, q;
        do { p = R.int(1, 5); q = R.int(2, 7); } while (p >= q || S.gcd(p, q) !== 1);
        var A1 = p * p * R.int(2, 12), A2 = Fr(A1 * q * q, p * p);
        return {
          type: "spr",
          stem: "<p>Triangles " + m("PQR") + " and " + m("STU") + " are similar, and the ratio of their corresponding side lengths is " + p + " to " + q + ". The area of triangle " + m("PQR") + " is " + A1 + " square units. What is the area, in square units, of triangle " + m("STU") + "?</p>",
          answer: A2,
          explain: ["When side lengths are in the ratio " + p + " to " + q + ", areas are in the ratio " + m(p + "^{2}") + " to " + m(q + "^{2}") + ", which is " + p * p + " to " + q * q + ".",
                    "So the area of " + m("STU") + " is " + m(A1 + "\\cdot\\frac{" + q * q + "}{" + p * p + "} = " + tx(A2)) + "."],
          desmos: calc(A1 + "\\cdot\\left(\\frac{" + q + "}{" + p + "}\\right)^{2}", tx(A2)),
          data: { kind: "similar", p: p, q: q, A1: A1 }
        };
      }
      var a = R.pick([10, 20, 25, 30, 40, 50]), b = R.pick([10, 20, 25, 30, 40, 50]);
      var c = Fr.sub(Fr.div(Fr.mul(100 + a, 100 - b), 100), 100);
      function say(pct) { pct = Fr.of(pct); return pct.n > 0 ? "The area increases by " + td(pct) + "%." : pct.n < 0 ? "The area decreases by " + td(Fr.neg(pct)) + "%." : "The area doesn't change."; }
      var cands = [{ v: Fr(a - b), why: "Percent changes don't simply add or subtract. Multiply the factors: " + m(td(Fr(100 + a, 100)) + "\\cdot " + td(Fr(100 - b, 100)) + " = " + td(Fr.div(Fr.mul(100 + a, 100 - b), 10000))) + "." },
                   { v: Fr.neg(c), why: "The direction is reversed. The new area is " + td(Fr.div(Fr.mul(100 + a, 100 - b), 100)) + "% of the original." },
                   { v: Fr(a + b), why: "A decrease in width can't add to the increase in length. Multiply the factors instead." }];
      return {
        type: "mc",
        stem: "<p>The length of a rectangle is increased by " + a + "%, and the width of the rectangle is decreased by " + b + "%. Which statement describes how the area of the rectangle changes?</p>",
        choices: H.numChoices(c, cands, R, say),
        explain: ["Area is length times width, so the new area is " + m("(" + td(Fr(100 + a, 100)) + "\\ell)(" + td(Fr(100 - b, 100)) + "w) = " + td(Fr.div(Fr.mul(100 + a, 100 - b), 10000)) + "\\ell w") + ".", say(c).replace("The area", "That means the area")],
        desmos: calc(S.decStr(Fr(100 + a, 100)) + "\\cdot " + S.decStr(Fr(100 - b, 100)), td(Fr.div(Fr.mul(100 + a, 100 - b), 10000))),
        data: { kind: "percent", a: a, b: b }
      };
    },
    check: function (q) {
      var d = q.data;
      if (d.kind === "cube") return eqAns(q, Fr(d.what === "volume" ? d.k * d.k * d.k : d.k * d.k));
      if (d.kind === "similar") return eqAns(q, Fr(d.A1 * d.q * d.q, d.p * d.p));
      var c = Fr.sub(Fr.div(Fr.mul(100 + d.a, 100 - d.b), 100), 100);
      q.choices.forEach(function (ch, i) { if ((i === q.answer) !== Fr.eq(ch.v, c)) fail("percent area " + i); });
      return true;
    }
  });

  add({
    id: "area.triangle", skill: "geo.area", levels: [2, 3], title: "Area using the Pythagorean theorem",
    gen: function (R) {
      var t = R.pick(TRIPLES), k = R.int(1, 3), half = t[0] * k, h = t[1] * k, side = t[2] * k;
      if (R.chance(0.5)) { var tmp = half; half = h; h = tmp; }
      if (R.chance(0.5)) {
        var area = half * h;
        return {
          type: "spr",
          stem: "<p>An isosceles triangle has two sides of length " + side + " and a third side of length " + 2 * half + ". What is the area of the triangle?</p>",
          answer: area,
          explain: ["Draw the height from the top vertex to the base. It splits the base into two segments of length " + half + " and makes two right triangles with hypotenuse " + side + ".",
                    "Height: " + m("\\sqrt{" + side + "^{2} - " + half + "^{2}} = \\sqrt{" + (side * side - half * half) + "} = " + h) + ".",
                    "Area: " + m("\\frac{1}{2}\\cdot " + 2 * half + "\\cdot " + h + " = " + area) + "."],
          desmos: calc("\\frac{1}{2}\\cdot " + 2 * half + "\\cdot\\sqrt{" + side + "^{2}-" + half + "^{2}}", String(area)),
          data: { kind: "iso", side: side, base: 2 * half }
        };
      }
      return {
        type: "spr",
        stem: "<p>A rectangle has a diagonal of length " + side + " and one side of length " + half + ". What is the area of the rectangle?</p>",
        answer: half * h,
        explain: ["The diagonal splits the rectangle into two right triangles with hypotenuse " + side + ".",
                  "The other side is " + m("\\sqrt{" + side + "^{2} - " + half + "^{2}} = " + h) + ", so the area is " + m(half + "\\cdot " + h + " = " + half * h) + "."],
        desmos: calc(half + "\\cdot\\sqrt{" + side + "^{2}-" + half + "^{2}}", String(half * h)),
        data: { kind: "rect", side: side, a: half }
      };
    },
    check: function (q) {
      var d = q.data;
      if (d.kind === "iso") { var hh = Math.sqrt(d.side * d.side - d.base * d.base / 4); return eqAns(q, Fr(Math.round(d.base * hh / 2))); }
      var b = Math.sqrt(d.side * d.side - d.a * d.a);
      if (Math.abs(b - Math.round(b)) > 1e-9) fail("not a triple");
      return eqAns(q, Fr(d.a * Math.round(b)));
    }
  });

  // ================================================================ Lines, angles and triangles
  var POS = ["TR", "TL", "BL", "BR"], CLASS = { TR: 0, BL: 0, TL: 1, BR: 1 };
  var WHERE = { TR: "above the line and to the right of the transversal", TL: "above the line and to the left of the transversal",
                BL: "below the line and to the left of the transversal", BR: "below the line and to the right of the transversal" };
  add({
    id: "lines.angles", skill: "geo.lines", levels: [1, 2], title: "Angles: parallel lines and triangles",
    gen: function (R, L) {
      if (L === 2 || R.chance(0.5)) {
        var th = R.chance(0.5) ? R.int(35, 75) : R.int(105, 145), p1 = R.pick(POS), p2 = R.pick(POS), knownAt = R.pick([1, 2]), askAt = 3 - knownAt;
        var meas = function (p) { return CLASS[p] === 0 ? th : 180 - th; }, x = meas(p1), y = meas(p2);
        var figure = S.fig.transversal({ theta: th, marks: [{ at: knownAt, pos: p1, label: x + "°" }, { at: askAt, pos: p2, label: "y°" }],
                                         alt: "Parallel lines ℓ and m cut by a transversal. One angle is marked " + x + " degrees and another is marked y degrees." });
        var top = function (at) { return at === 1 ? "top" : "bottom"; };
        var alt = "Parallel lines ℓ (top) and m (bottom) are cut by a transversal. At the " + top(knownAt) + " crossing, the angle " + WHERE[p1] + " measures " + x + "°. At the " + top(askAt) + " crossing, the angle " + WHERE[p2] + " is labeled y°.";
        var diag = (p1 === "TR" && p2 === "BL") || (p1 === "BL" && p2 === "TR") || (p1 === "TL" && p2 === "BR") || (p1 === "BR" && p2 === "TL");
        var step2 = p1 === p2 ? "That angle is the one marked " + x + "°, so " + m("y = " + x) + "." :
                    diag ? "That angle and the " + x + "° angle are vertical angles, so they're equal: " + m("y = " + x) + "." :
                           "That angle and the " + x + "° angle form a straight line (a linear pair), so they add up to 180°: " + m("y = 180 - " + x + " = " + y) + ".";
        return {
          type: "spr",
          stem: figure + "<p>In the figure, line " + m("\\ell") + " is parallel to line " + m("m") + ". What is the value of " + m("y") + "?</p>",
          answer: y, alt: alt,
          explain: ["Because " + m("\\ell \\parallel m") + ", the angles at the two crossings match. The angle in the same position as " + m("y°") + " at the other crossing (a corresponding angle) also measures " + m("y°") + ".", step2],
          desmos: calc(y === x ? String(x) : "180-" + x, String(y)),
          data: { kind: "par", th: th, p1: p1, p2: p2, x: x }
        };
      }
      if (R.chance(0.5)) {
        var a = R.int(25, 80), b = R.int(25, 80), e = a + b;
        return {
          type: "spr",
          stem: "<p>In triangle " + m("ABC") + ", the measure of angle " + m("A") + " is " + a + "°. The exterior angle at vertex " + m("C") + " measures " + e + "°. What is the measure, in degrees, of angle " + m("B") + "?</p>",
          answer: b,
          explain: ["An exterior angle of a triangle equals the sum of the two interior angles that aren't next to it: " + m(e + " = " + a + " + B") + ".", "So " + m("B = " + e + " - " + a + " = " + b) + " degrees."],
          desmos: calc(e + "-" + a, String(b)),
          data: { kind: "ext", a: a, e: e }
        };
      }
      var top2 = 2 * R.int(10, 70), base = (180 - top2) / 2;
      return {
        type: "spr",
        stem: "<p>In triangle " + m("ABC") + ", " + m("AB = AC") + " and the measure of angle " + m("A") + " is " + top2 + "°. What is the measure, in degrees, of angle " + m("B") + "?</p>",
        answer: base,
        explain: ["Because " + m("AB = AC") + ", the angles opposite those sides, " + m("B") + " and " + m("C") + ", are equal.", "The angles add to 180°: " + m(top2 + " + 2B = 180") + ", so " + m("B = " + base) + "."],
        desmos: calc("\\frac{180-" + top2 + "}{2}", String(base)),
        data: { kind: "iso", a: top2 }
      };
    },
    check: function (q) {
      var d = q.data;
      if (d.kind === "par") {
        // angle measure from geometry: direction angles of the rays bounding each position
        var bounds = { TR: [0, d.th], TL: [d.th, 180], BL: [180, 180 + d.th], BR: [180 + d.th, 360] };
        var size = function (p) { return bounds[p][1] - bounds[p][0]; };
        if (size(d.p1) !== d.x) fail("known angle");
        return eqAns(q, Fr(size(d.p2)));
      }
      if (d.kind === "ext") return eqAns(q, Fr(d.e - d.a));
      if (Fr.val(q.answer) * 2 + d.a !== 180) fail("isosceles");
      return true;
    }
  });

  add({
    id: "lines.similar", skill: "geo.lines", levels: [2, 3], title: "Similar triangles",
    gen: function (R, L) {
      if (L === 2 && R.chance(0.6)) {
        var p, qv, r, ans;
        for (var t = 0; t < 80; t++) { p = R.int(2, 12); qv = R.int(2, 15); r = R.int(3, 20); ans = Fr(qv * r, p); if (r !== p && S.fitsGrid(ans)) break; }
        return {
          type: "spr",
          stem: "<p>Triangle " + m("ABC") + " is similar to triangle " + m("DEF") + ", where " + m("A") + ", " + m("B") + " and " + m("C") + " correspond to " + m("D") + ", " + m("E") + " and " + m("F") + ". If " + m("AB = " + p) + ", " + m("BC = " + qv) + " and " + m("DE = " + r) + ", what is the length of " + m("EF") + "?</p>",
          answer: ans,
          explain: ["Corresponding sides of similar triangles are proportional: " + m("\\frac{EF}{BC} = \\frac{DE}{AB}") + ".",
                    "So " + m("EF = " + qv + "\\cdot\\frac{" + r + "}{" + p + "} = " + tx(ans)) + ". " + H.gridTip(ans)],
          desmos: calc(qv + "\\cdot\\frac{" + r + "}{" + p + "}", approx(ans)),
          data: { kind: "sim", p: p, q: qv, r: r }
        };
      }
      var a, b, c, BC;
      for (var u = 0; u < 80; u++) { a = R.int(2, 9); b = R.int(2, 9); c = R.int(3, 12); BC = Fr(c * (a + b), a); if (S.fitsGrid(BC)) break; }
      var figure = S.fig.triParallel({ t: a / (a + b), labAD: String(a), labDB: String(b), labDE: String(c), labBC: "?", alt: "Triangle ABC with segment DE parallel to BC." });
      var alt = "Triangle ABC with point D on side AB and point E on side AC, so that segment DE is parallel to BC. AD = " + a + ", DB = " + b + ", DE = " + c + ".";
      return {
        type: "spr",
        stem: figure + "<p>In the figure, " + m("\\overline{DE}") + " is parallel to " + m("\\overline{BC}") + ", " + m("AD = " + a) + ", " + m("DB = " + b) + " and " + m("DE = " + c) + ". What is the length of " + m("\\overline{BC}") + "?</p>",
        answer: BC, alt: alt,
        explain: ["Because " + m("DE \\parallel BC") + ", triangle " + m("ADE") + " is similar to triangle " + m("ABC") + " (they share angle " + m("A") + ", and the corresponding angles at the parallel lines are equal).",
                  m("AB = " + a + " + " + b + " = " + (a + b)) + ", so " + m("\\frac{BC}{DE} = \\frac{AB}{AD}") + " gives " + m("BC = " + c + "\\cdot\\frac{" + (a + b) + "}{" + a + "} = " + tx(BC)) + ". " + H.gridTip(BC)],
        desmos: calc(c + "\\cdot\\frac{" + (a + b) + "}{" + a + "}", approx(BC)),
        data: { kind: "par", a: a, b: b, c: c }
      };
    },
    check: function (q) {
      var d = q.data;
      if (d.kind === "sim") { if (!Fr.eq(Fr.div(q.answer, d.q), Fr(d.r, d.p))) fail("ratio"); return true; }
      if (!Fr.eq(Fr.div(q.answer, d.c), Fr(d.a + d.b, d.a))) fail("parallel ratio");
      return true;
    }
  });

  // ================================================================ Right triangles and trigonometry
  add({
    id: "trig.pyth", skill: "geo.trig", levels: [1, 2], title: "Pythagorean theorem",
    gen: function (R, L) {
      if (L === 1 || R.chance(0.4)) {
        var t = R.pick(TRIPLES), k = R.int(1, 4), a = t[0] * k, b = t[1] * k, c = t[2] * k, askHyp = R.chance(0.5);
        return {
          type: "spr",
          stem: "<p>A right triangle has " + (askHyp ? "legs of lengths " + a + " and " + b : "a hypotenuse of length " + c + " and one leg of length " + a) + ". What is the length of the " + (askHyp ? "hypotenuse" : "other leg") + "?</p>",
          answer: askHyp ? c : b,
          explain: askHyp ? ["Pythagorean theorem: " + m("c^{2} = " + a + "^{2} + " + b + "^{2} = " + (a * a + b * b)) + ".", "So " + m("c = \\sqrt{" + (a * a + b * b) + "} = " + c) + "."]
                          : ["Pythagorean theorem: " + m(a + "^{2} + b^{2} = " + c + "^{2}") + ", so " + m("b^{2} = " + (c * c - a * a)) + ".", "So " + m("b = " + b) + "."],
          desmos: calc(askHyp ? "\\sqrt{" + a + "^{2}+" + b + "^{2}}" : "\\sqrt{" + c + "^{2}-" + a + "^{2}}", String(askHyp ? c : b)),
          data: { kind: "triple", a: a, other: askHyp ? b : c, askHyp: askHyp }
        };
      }
      var x, y, N;
      for (var u = 0; u < 100; u++) { x = R.int(2, 9); y = R.int(2, 9); N = x * x + y * y; if (x !== y && simpRoot(N).inn !== 1 && simpRoot(N).out > 1 || (x !== y && simpRoot(N).inn !== 1 && R.chance(0.3))) break; }
      var hyp = Math.sqrt(N);
      var pool = [
        { t: m(String(x + y)), val: x + y, why: "The legs don't add up to the hypotenuse. Square them, add, then take the square root." },
        { t: m("\\sqrt{" + (x + y) + "}"), val: Math.sqrt(x + y), why: "Square each leg before adding: " + m(x + "^{2} + " + y + "^{2} = " + N) + "." },
        { t: m(rootTex(Math.abs(x * x - y * y))), val: Math.sqrt(Math.abs(x * x - y * y)), why: "To find a hypotenuse, add the squares of the legs. Subtracting is for finding a leg." },
        { t: m(String(N)), val: N, why: "That's " + m("c^{2}") + ". Take the square root to get " + m("c") + "." }
      ], taken = [hyp], cands = [];
      pool.forEach(function (c) { if (cands.length < 3 && !taken.some(function (v) { return Math.abs(v - c.val) < 1e-9; })) { taken.push(c.val); cands.push(c); } });
      return {
        type: "mc",
        stem: "<p>A right triangle has legs of lengths " + x + " and " + y + ". What is the length of the hypotenuse?</p>",
        choices: [{ t: m(rootTex(N)), val: hyp, ok: true, v: key(hyp) }].concat(cands.map(function (c) { return { t: c.t, val: c.val, why: c.why, v: key(c.val) }; })),
        explain: ["Pythagorean theorem: " + m("c^{2} = " + x + "^{2} + " + y + "^{2} = " + N) + ", so " + m("c = \\sqrt{" + N + "}") + ".",
                  simpRoot(N).out > 1 ? "Simplify: " + m("\\sqrt{" + N + "} = \\sqrt{" + simpRoot(N).out * simpRoot(N).out + "\\cdot " + simpRoot(N).inn + "} = " + rootTex(N)) + "." : "That doesn't simplify further."],
        desmos: { steps: ["Type " + m("\\sqrt{" + x + "^{2}+" + y + "^{2}}") + ". Desmos shows about " + m(approx(Fr.of(hyp.toFixed(3)))) + ".", "Type each choice too (for example " + m(rootTex(N)) + ") and see which one gives the same decimal."],
                  exprs: ["\\sqrt{" + x + "^{2}+" + y + "^{2}}", rootTex(N)] },
        data: { kind: "root", x: x, y: y }
      };
    },
    check: function (q) {
      var d = q.data;
      if (d.kind === "triple") {
        var a = d.a, o = Fr.val(q.answer);
        if (d.askHyp ? a * a + d.other * d.other !== o * o : a * a + o * o !== d.other * d.other) fail("pythagoras");
        return true;
      }
      var h = Math.sqrt(d.x * d.x + d.y * d.y);
      q.choices.forEach(function (c, i) { if ((i === q.answer) !== (Math.abs(c.val - h) < 1e-9)) fail("root choice " + i); });
      return true;
    }
  });

  add({
    id: "trig.ratio", skill: "geo.trig", levels: [2, 3], title: "Sine, cosine and tangent",
    gen: function (R, L) {
      var t = R.pick(TRIPLES), k = R.int(1, 3), sw = R.chance(0.5);
      var AC = (sw ? t[1] : t[0]) * k, BC = (sw ? t[0] : t[1]) * k, AB = t[2] * k;
      var fn = R.pick(["sin", "cos", "tan"]), ang = R.pick(["A", "B"]);
      var val = { sinA: Fr(BC, AB), cosA: Fr(AC, AB), tanA: Fr(BC, AC), sinB: Fr(AC, AB), cosB: Fr(BC, AB), tanB: Fr(AC, BC) }[fn + ang];
      var opp = ang === "A" ? "BC" : "AC", adj = ang === "A" ? "AC" : "BC";
      if (L === 3 && R.chance(0.6)) {
        var given = R.pick(["sin", "cos"]), gv = { sinA: Fr(BC, AB), cosA: Fr(AC, AB) }[given + "A"];
        var ask = R.pick(["comp", "tan"]), ans = ask === "comp" ? (given === "sin" ? Fr(BC, AB) : Fr(AC, AB)) : Fr(BC, AC);
        var askName = ask === "comp" ? (given === "sin" ? "\\cos B" : "\\sin B") : "\\tan A";
        return {
          type: "spr",
          stem: "<p>In right triangle " + m("ABC") + ", angle " + m("C") + " is a right angle and " + m("\\" + given + " A = " + tx(gv)) + ". What is the value of " + m(askName) + "?</p>",
          answer: ans,
          explain: ask === "comp"
            ? ["Angles " + m("A") + " and " + m("B") + " add to 90°, so the side opposite " + m("A") + " is the side adjacent to " + m("B") + ".",
               "That makes " + m("\\" + given + " A = " + (given === "sin" ? "\\cos B" : "\\sin B")) + ", so " + m(askName + " = " + tx(ans)) + "."]
            : ["Draw the triangle with sides that fit " + m("\\" + given + " A = " + tx(gv)) + ": " + (given === "sin" ? "opposite " + BC / k + ", hypotenuse " + AB / k : "adjacent " + AC / k + ", hypotenuse " + AB / k) + ".",
               "The third side is " + m("\\sqrt{" + (AB / k) + "^{2} - " + (given === "sin" ? BC / k : AC / k) + "^{2}} = " + (given === "sin" ? AC / k : BC / k)) + ".",
               "So " + m("\\tan A = \\frac{\\text{opposite}}{\\text{adjacent}} = \\frac{" + BC / k + "}{" + AC / k + "} = " + tx(ans)) + "."],
          desmos: { steps: ["Desmos can check it in degree mode: type " + m("\\tan(\\arcsin(" + tx(gv) + "))") .replace("\\arcsin", given === "sin" ? "\\arcsin" : "\\arccos") + (ask === "comp" ? " — or just use the complement rule." : "") + "."],
                    exprs: [ask === "comp" ? (given === "sin" ? "\\cos(90-\\arcsin(" : "\\sin(90-\\arccos(") + tx(gv) + "))" : "\\tan(" + (given === "sin" ? "\\arcsin" : "\\arccos") + "(" + tx(gv) + "))"], degree: true },
          data: { kind: "given", AC: AC, BC: BC, AB: AB, ask: ask, given: given }
        };
      }
      var hide = L === 3 ? R.pick(["AC", "BC", "AB", ""]) : "";
      var figure = S.fig.rightTri({ v: ["C", "A", "B"], legV: AC, legH: BC, labV: hide === "AC" ? "" : String(AC), labH: hide === "BC" ? "" : String(BC), labHyp: hide === "AB" ? "" : String(AB),
                                    alt: "Right triangle ABC with the right angle at C." });
      var alt = "Right triangle ABC with the right angle at C. A is at the top, B at the right. " + (hide !== "AC" ? "AC = " + AC + ". " : "") + (hide !== "BC" ? "BC = " + BC + ". " : "") + (hide !== "AB" ? "AB = " + AB + "." : "");
      var sideVal = { AC: AC, BC: BC, AB: AB };
      var ex = [];
      if (hide) ex.push("First find " + m(hide) + " with the Pythagorean theorem: " + m(hide + " = " + sideVal[hide]) + ".");
      ex.push("For angle " + m(ang) + ": the opposite side is " + m(opp) + ", the adjacent side is " + m(adj) + ", and the hypotenuse is " + m("AB") + ".");
      ex.push(m("\\" + fn + " " + ang + " = " + (fn === "sin" ? "\\frac{" + opp + "}{AB}" : fn === "cos" ? "\\frac{" + adj + "}{AB}" : "\\frac{" + opp + "}{" + adj + "}") + " = " + tx(val)) + " (SOH-CAH-TOA).");
      return {
        type: "spr",
        stem: figure + "<p>In the right triangle shown, what is the value of " + m("\\" + fn + " " + ang) + "?</p>",
        answer: val, alt: alt, explain: ex,
        desmos: calc("\\frac{" + (fn === "sin" ? sideVal[opp] + "}{" + AB : fn === "cos" ? sideVal[adj] + "}{" + AB : sideVal[opp] + "}{" + sideVal[adj]) + "}", approx(val)),
        data: { kind: "fig", AC: AC, BC: BC, AB: AB, fn: fn, ang: ang }
      };
    },
    check: function (q) {
      var d = q.data;
      if (d.AC * d.AC + d.BC * d.BC !== d.AB * d.AB) fail("not right");
      var A = Math.atan2(d.BC, d.AC), B = Math.PI / 2 - A, v = Fr.val(q.answer);
      var want;
      if (d.kind === "fig") want = { sin: Math.sin, cos: Math.cos, tan: Math.tan }[d.fn](d.ang === "A" ? A : B);
      else want = d.ask === "comp" ? (d.given === "sin" ? Math.cos(B) : Math.sin(B)) : Math.tan(A);
      if (Math.abs(v - want) > 1e-9) fail("trig value");
      return true;
    }
  });

  add({
    id: "trig.special", skill: "geo.trig", levels: [2, 3], title: "Special right triangles and radians",
    gen: function (R, L) {
      var variant = L === 2 ? R.pick(["306090", "454590", "rad2deg"]) : R.pick(["306090", "454590", "deg2rad"]);
      if (variant === "rad2deg") {
        var num, den;
        do { den = R.pick([2, 3, 4, 6, 12]); num = R.int(1, 2 * den - 1); } while (S.gcd(num, den) !== 1);
        var deg = num * 180 / den;
        return {
          type: "spr",
          stem: "<p>What is the measure, in degrees, of an angle of " + m("\\frac{" + (num === 1 ? "" : num) + "\\pi}{" + den + "}") + " radians?</p>",
          answer: deg,
          explain: ["Since " + m("\\pi") + " radians = 180°, multiply by " + m("\\frac{180}{\\pi}") + ".", m("\\frac{" + (num === 1 ? "" : num) + "\\pi}{" + den + "}\\cdot\\frac{180}{\\pi} = \\frac{" + num + "\\cdot 180}{" + den + "} = " + deg) + "°."],
          desmos: calc("\\frac{" + num + "\\pi}{" + den + "}\\cdot\\frac{180}{\\pi}", String(deg)),
          data: { kind: "r2d", num: num, den: den }
        };
      }
      if (variant === "deg2rad") {
        var d2 = R.pick([210, 225, 240, 270, 300, 315, 330, 135, 150, 120]);
        var c = Fr(d2, 180);
        var show = function (f) { f = Fr.of(f); return m("\\frac{" + (f.n === 1 ? "" : f.n) + "\\pi}{" + f.d + "}").replace("\\frac{\\pi}{1}", "\\pi").replace(/\\frac\{(\d+)\\pi\}\{1\}/, "$1\\pi"); };
        var cands = [{ v: Fr(180, d2), why: "To change degrees to radians, multiply by " + m("\\frac{\\pi}{180}") + ", not " + m("\\frac{180}{\\pi}") + "." },
                     { v: Fr(d2, 360), why: "360° is " + m("2\\pi") + " radians, so divide by 180, not 360." },
                     { v: Fr(d2, 90), why: "90° is " + m("\\frac{\\pi}{2}") + " radians, not " + m("\\pi") + "." }];
        return {
          type: "mc",
          stem: "<p>Which of the following is equal to " + d2 + "° in radians?</p>",
          choices: H.numChoices(c, cands, R, show),
          explain: ["Multiply by " + m("\\frac{\\pi}{180}") + ": " + m(d2 + "\\cdot\\frac{\\pi}{180} = ") + show(c) + "."],
          desmos: calc(d2 + "\\cdot\\frac{\\pi}{180}", approx(Fr.of((Fr.val(c) * Math.PI).toFixed(3)))),
          data: { kind: "d2r", d: d2 }
        };
      }
      if (variant === "306090") {
        var s = R.int(2, 12), askLong = R.chance(0.6), hyp = 2 * s;
        var cands2 = askLong
          ? [{ t: m(String(s)), val: s, why: "That's the side opposite the 30° angle, half the hypotenuse." },
             { t: m(s + "\\sqrt{2}"), val: s * Math.SQRT2, why: "The " + m("\\sqrt{2}") + " ratio is for 45°-45°-90° triangles." },
             { t: m(hyp + "\\sqrt{3}"), val: hyp * Math.sqrt(3), why: "The legs are shorter than the hypotenuse, " + hyp + ". The longer leg is the shorter leg times " + m("\\sqrt{3}") + "." }]
          : [{ t: m(s + "\\sqrt{3}"), val: s * Math.sqrt(3), why: "That's the side opposite the 60° angle." },
             { t: m(s + "\\sqrt{2}"), val: s * Math.SQRT2, why: "The " + m("\\sqrt{2}") + " ratio is for 45°-45°-90° triangles." },
             { t: m(String(hyp)), val: hyp, why: "That's the hypotenuse. The side opposite 30° is half of it." }];
        var right = askLong ? { t: m(s + "\\sqrt{3}"), val: s * Math.sqrt(3) } : { t: m(String(s)), val: s };
        return {
          type: "mc",
          stem: "<p>In right triangle " + m("PQR") + ", angle " + m("Q") + " is a right angle, the measure of angle " + m("P") + " is 30°, and " + m("PR = " + hyp) + ". What is the length of " + m(askLong ? "\\overline{PQ}" : "\\overline{QR}") + "?</p>",
          choices: [Object.assign({ ok: true, v: key(right.val) }, right)].concat(cands2.map(function (c) { return Object.assign({ v: key(c.val) }, c); })),
          explain: ["Angle " + m("R") + " is 60°, so this is a 30°-60°-90° triangle with hypotenuse " + m("PR = " + hyp) + ".",
                    "The side opposite 30° (" + m("QR") + ") is half the hypotenuse: " + s + ". The side opposite 60° (" + m("PQ") + ") is that times " + m("\\sqrt{3}") + ": " + m(s + "\\sqrt{3}") + "."],
          desmos: { steps: ["Switch Desmos to degrees (wrench icon). Then " + m(askLong ? "PQ = PR\\cos 30°" : "QR = PR\\sin 30°") + ": type " + m(hyp + "\\" + (askLong ? "cos" : "sin") + "(30)") + " and compare its decimal with the choices."],
                    exprs: [hyp + "\\" + (askLong ? "cos" : "sin") + "(30)"], degree: true },
          data: { kind: "3060", s: s, askLong: askLong }
        };
      }
      var leg = R.int(2, 12), askLeg = R.chance(0.5);
      var choices4 = askLeg
        ? [{ t: m(String(leg)), val: leg, ok: true }, { t: m(leg + "\\sqrt{2}"), val: leg * Math.SQRT2, why: "That's the hypotenuse itself. Each leg is the hypotenuse divided by " + m("\\sqrt{2}") + "." },
           { t: m(String(2 * leg)), val: 2 * leg, why: "Each leg is shorter than the hypotenuse." }, { t: m(leg + "\\sqrt{3}"), val: leg * Math.sqrt(3), why: "The " + m("\\sqrt{3}") + " ratio is for 30°-60°-90° triangles." }]
        : [{ t: m(leg + "\\sqrt{2}"), val: leg * Math.SQRT2, ok: true }, { t: m(String(2 * leg)), val: 2 * leg, why: "The hypotenuse is a leg times " + m("\\sqrt{2}") + ", not times 2." },
           { t: m(leg + "\\sqrt{3}"), val: leg * Math.sqrt(3), why: "The " + m("\\sqrt{3}") + " ratio is for 30°-60°-90° triangles." }, { t: m(String(leg)), val: leg, why: "The hypotenuse is longer than each leg." }];
      return {
        type: "mc",
        stem: askLeg ? "<p>An isosceles right triangle has a hypotenuse of length " + m(leg + "\\sqrt{2}") + ". What is the length of each leg?</p>"
                     : "<p>Each leg of an isosceles right triangle has length " + leg + ". What is the length of the hypotenuse?</p>",
        choices: choices4.map(function (c) { return Object.assign({ v: key(c.val) }, c); }),
        explain: ["An isosceles right triangle is a 45°-45°-90° triangle: the hypotenuse is a leg times " + m("\\sqrt{2}") + ".",
                  askLeg ? "So each leg is " + m("\\frac{" + leg + "\\sqrt{2}}{\\sqrt{2}} = " + leg) + "." : "So the hypotenuse is " + m(leg + "\\sqrt{2}") + "."],
        desmos: calc(askLeg ? "\\frac{" + leg + "\\sqrt{2}}{\\sqrt{2}}" : "\\sqrt{" + leg + "^{2}+" + leg + "^{2}}", askLeg ? String(leg) : approx(Fr.of((leg * Math.SQRT2).toFixed(3)))),
        data: { kind: "4545", leg: leg, askLeg: askLeg }
      };
    },
    check: function (q) {
      var d = q.data;
      if (d.kind === "r2d") return eqAns(q, Fr(d.num * 180, d.den));
      if (d.kind === "d2r") { q.choices.forEach(function (c, i) { if ((i === q.answer) !== Fr.eq(c.v, Fr(d.d, 180))) fail("radians " + i); }); return true; }
      var want = d.kind === "3060" ? (d.askLong ? 2 * d.s * Math.cos(Math.PI / 6) : 2 * d.s * Math.sin(Math.PI / 6)) : (d.askLeg ? d.leg : Math.hypot(d.leg, d.leg));
      q.choices.forEach(function (c, i) { if ((i === q.answer) !== (Math.abs(c.val - want) < 1e-9)) fail("special " + i); });
      return true;
    }
  });

  // ================================================================ Circles
  add({
    id: "circle.equation", skill: "geo.circle", levels: [2, 3], title: "Equation of a circle",
    gen: function (R, L) {
      var h = R.nz(-8, 8), k = R.nz(-8, 8), r = R.int(2, 9);
      while (Math.abs(h) === Math.abs(k)) k = R.nz(-8, 8);
      var D = -2 * h, E = -2 * k, F = h * h + k * k - r * r, std = "(" + S.alg.shift("x", -h) + ")^{2} + (" + S.alg.shift("y", -k) + ")^{2} = " + r * r;
      var gen2 = "x^{2} + y^{2}" + S.alg.term(D, "x", false) + S.alg.term(E, "y", false) + S.alg.term(F, "", false) + " = 0";
      var eq = L === 2 ? std : gen2, ask = R.pick(["r", "c"]);
      var ex = L === 2 ? ["The standard form is " + m("(x - h)^{2} + (y - k)^{2} = r^{2}") + ", with center " + m("(h, k)") + " and radius " + m("r") + "."]
                       : ["Complete the square for " + m("x") + " and " + m("y") + ": " + m("(x^{2}" + S.alg.term(D, "x", false) + " + " + h * h + ") + (y^{2}" + S.alg.term(E, "y", false) + " + " + k * k + ") = " + (-F) + " + " + h * h + " + " + k * k) + ".",
                          "That's " + m(std) + "."];
      ex.push("So the center is " + m("(" + h + ", " + k + ")") + " and " + m("r^{2} = " + r * r) + ", which makes the radius " + m(r) + ".");
      var desmos = { steps: ["Type the equation exactly as given. Desmos draws the circle.", "Its center is at " + m("(" + h + ", " + k + ")") + " (type that point to check it sits in the middle) and it reaches " + r + " units out in every direction."],
                     exprs: [eq.replace(/ /g, ""), "(" + h + "," + k + ")"], bounds: { left: h - r - 3, right: h + r + 3, bottom: k - r - 3, top: k + r + 3 } };
      if (ask === "r") return { type: "spr", stem: "<p>The equation " + m(eq) + " defines a circle in the xy-plane. What is the radius of the circle?</p>", answer: r, explain: ex, desmos: desmos, data: { D: D, E: E, F: F, ask: "r" } };
      var pt = function (a, b) { return m("(" + tx(a) + ", " + tx(b) + ")"); };
      var cands = L === 2
        ? [{ t: pt(-h, -k), x: -h, y: -k, why: "In " + m("(x - h)^{2}") + ", the center's x-coordinate is " + m("h") + ": " + m("(x " + (h > 0 ? "- " + h : "+ " + -h) + ")^{2}") + " means " + m("h = " + h) + ". The signs flip." },
           { t: pt(h, -k), x: h, y: -k, why: "The y-coordinate has the wrong sign: " + m("(y " + (k > 0 ? "- " + k : "+ " + -k) + ")^{2}") + " means " + m("k = " + k) + "." },
           { t: pt(-h, k), x: -h, y: k, why: "The x-coordinate has the wrong sign: " + m("(x " + (h > 0 ? "- " + h : "+ " + -h) + ")^{2}") + " means " + m("h = " + h) + "." }]
        : [{ t: pt(-h, -k), x: -h, y: -k, why: "Completing the square gives " + m("(x " + (h > 0 ? "- " + h : "+ " + -h) + ")^{2}") + ", so the center's x-coordinate is " + m(h) + ". The signs are flipped." },
           { t: pt(D, E), x: D, y: E, why: "The coefficients of " + m("x") + " and " + m("y") + " aren't the center. Halve them and change the signs." },
           { t: pt(-D, -E), x: -D, y: -E, why: "You also need to halve the coefficients: the center is " + m("(-\\frac{" + D + "}{2}, -\\frac{" + E + "}{2})") + "." }];
      return { type: "mc", stem: "<p>The equation " + m(eq) + " defines a circle in the xy-plane. What are the coordinates of the center of the circle?</p>",
               choices: [{ t: pt(h, k), x: h, y: k, ok: true }].concat(cands), explain: ex, desmos: desmos, data: { D: D, E: E, F: F, ask: "c" } };
    },
    check: function (q) {
      var d = q.data, h = -d.D / 2, k = -d.E / 2, r2 = h * h + k * k - d.F;
      if (d.ask === "r") return eqAns(q, Fr(Math.round(Math.sqrt(r2))));
      q.choices.forEach(function (c, i) { if ((i === q.answer) !== (c.x === h && c.y === k)) fail("center " + i); });
      return true;
    }
  });

  add({
    id: "circle.arc", skill: "geo.circle", levels: [2, 3], title: "Arc length and sector area",
    gen: function (R, L) {
      var r = R.int(2, 12), useRad = L === 3 && R.chance(0.5), deg, radTex;
      if (useRad) { var pick = R.pick([[1, 6], [1, 4], [1, 3], [1, 2], [2, 3], [3, 4], [5, 6], [5, 4], [4, 3], [3, 2]]); deg = pick[0] * 180 / pick[1]; radTex = "\\frac{" + (pick[0] === 1 ? "" : pick[0]) + "\\pi}{" + pick[1] + "}"; }
      else deg = R.pick([30, 40, 45, 60, 72, 90, 120, 135, 150, 210, 240, 270]);
      var ask = R.pick(["arc", "sector"]);
      for (var t = 0; ask === "sector" && t < 60 && !S.fitsGrid(Fr(r * r * deg, 360)); t++) r = R.int(2, 12);
      var arcC = Fr(r * deg, 180), secC = Fr(r * r * deg, 360);
      var angText = useRad ? m(radTex) + " radians" : deg + "°";
      if (ask === "arc") {
        var cands = [{ v: secC, why: "That's the area of the sector, " + m("\\frac{\\theta}{360}\\pi r^{2}") + ", not the arc length." },
                     { v: Fr(2 * r), why: "That's the whole circumference. The arc is only " + m("\\frac{" + deg + "}{360}") + " of it." },
                     { v: Fr(r * deg, 360), why: "The circumference is " + m("2\\pi r") + ", not " + m("\\pi r") + "." }];
        return {
          type: "mc",
          stem: "<p>A circle has a radius of " + r + " centimeters. What is the length, in centimeters, of an arc of the circle with a central angle of " + angText + "?</p>",
          choices: H.numChoices(arcC, cands, R, function (v) { return m(piTex(v)); }),
          explain: [useRad ? "In radians, arc length is " + m("s = r\\theta = " + r + "\\cdot " + radTex + " = " + piTex(arcC)) + "."
                           : "The arc is " + m("\\frac{" + deg + "}{360}") + " of the circumference " + m("2\\pi(" + r + ") = " + 2 * r + "\\pi") + ".",
                    useRad ? "" : m("\\frac{" + deg + "}{360}\\cdot " + 2 * r + "\\pi = " + piTex(arcC)) + "."].filter(Boolean),
          desmos: { steps: ["Type " + m(useRad ? r + "\\cdot " + radTex : "\\frac{" + deg + "}{360}\\cdot2\\pi\\cdot " + r) + " for a decimal (about " + approx(Fr.of((Fr.val(arcC) * Math.PI).toFixed(3))) + "), then divide by " + m("\\pi") + " to compare with the choices: " + m(tx(arcC)) + "."],
                    exprs: [useRad ? r + "\\cdot " + radTex : "\\frac{" + deg + "}{360}\\cdot2\\pi\\cdot " + r] },
          data: { kind: "arc", r: r, deg: deg }
        };
      }
      return {
        type: "spr",
        stem: "<p>A circle has a radius of " + r + " inches. The area of a sector of the circle with a central angle of " + angText + " is " + m("k\\pi") + " square inches. What is the value of " + m("k") + "?</p>",
        answer: secC,
        explain: ["The sector is " + m("\\frac{" + deg + "}{360}") + " of the circle's area " + m("\\pi(" + r + ")^{2} = " + r * r + "\\pi") + (useRad ? " (" + m(radTex) + " radians is " + deg + "°)" : "") + ".",
                  m("\\frac{" + deg + "}{360}\\cdot " + r * r + "\\pi = " + piTex(secC)) + ", so " + m("k = " + tx(secC)) + ". " + H.gridTip(secC)],
        desmos: calc("\\frac{" + deg + "}{360}\\cdot " + r + "^{2}", approx(secC)),
        data: { kind: "sector", r: r, deg: deg }
      };
    },
    check: function (q) {
      var d = q.data;
      if (d.kind === "sector") return eqAns(q, Fr(d.r * d.r * d.deg, 360));
      q.choices.forEach(function (c, i) { if ((i === q.answer) !== Fr.eq(c.v, Fr(2 * d.r * d.deg, 360))) fail("arc " + i); });
      return true;
    }
  });

  add({
    id: "circle.angles", skill: "geo.circle", levels: [2, 3], title: "Inscribed angles and tangents",
    gen: function (R) {
      if (R.chance(0.5)) {
        var cen = 2 * R.int(20, 85), askIns = R.chance(0.5);
        return {
          type: "spr",
          stem: askIns
            ? "<p>Points " + m("A") + ", " + m("B") + " and " + m("C") + " lie on a circle with center " + m("O") + ", and " + m("C") + " is not on the shorter arc " + m("AB") + ". The measure of central angle " + m("AOB") + " is " + cen + "°. What is the measure, in degrees, of angle " + m("ACB") + "?</p>"
            : "<p>Points " + m("A") + ", " + m("B") + " and " + m("C") + " lie on a circle with center " + m("O") + ", and " + m("C") + " is not on the shorter arc " + m("AB") + ". The measure of angle " + m("ACB") + " is " + cen / 2 + "°. What is the measure, in degrees, of central angle " + m("AOB") + "?</p>",
          answer: askIns ? cen / 2 : cen,
          explain: ["An inscribed angle is half the central angle that cuts off the same arc.", askIns ? m("\\angle ACB = \\frac{" + cen + "}{2} = " + cen / 2) + " degrees." : m("\\angle AOB = 2\\cdot " + cen / 2 + " = " + cen) + " degrees."],
          desmos: calc(askIns ? "\\frac{" + cen + "}{2}" : "2\\cdot " + cen / 2, String(askIns ? cen / 2 : cen)),
          data: { kind: "ins", cen: cen, askIns: askIns }
        };
      }
      var t = R.pick(TRIPLES), k = R.int(1, 3), rr = t[0] * k, tan = t[1] * k, oq = t[2] * k;
      if (R.chance(0.5)) { var tmp = rr; rr = tan; tan = tmp; }
      return {
        type: "spr",
        stem: "<p>A circle has center " + m("O") + " and radius " + rr + ". Line " + m("\\ell") + " is tangent to the circle at point " + m("P") + ". Point " + m("Q") + " lies on line " + m("\\ell") + ", and " + m("OQ = " + oq) + ". What is the length of " + m("\\overline{PQ}") + "?</p>",
        answer: tan,
        explain: ["A tangent line is perpendicular to the radius at the point of tangency, so triangle " + m("OPQ") + " has a right angle at " + m("P") + ".",
                  "Its hypotenuse is " + m("OQ = " + oq) + " and one leg is the radius " + m("OP = " + rr) + ". So " + m("PQ = \\sqrt{" + oq + "^{2} - " + rr + "^{2}} = " + tan) + "."],
        desmos: calc("\\sqrt{" + oq + "^{2}-" + rr + "^{2}}", String(tan)),
        data: { kind: "tan", r: rr, oq: oq }
      };
    },
    check: function (q) {
      var d = q.data;
      if (d.kind === "ins") return eqAns(q, Fr(d.askIns ? d.cen / 2 : d.cen));
      var a = Fr.val(q.answer);
      if (a * a + d.r * d.r !== d.oq * d.oq) fail("tangent");
      return true;
    }
  });
})(typeof window !== "undefined" ? window : globalThis);
