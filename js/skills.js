/* SAT Math: the four content domains and their skills, as the College Board lists them for the digital SAT. */
(function (G) {
  "use strict";
  var S = G.SATM = G.SATM || {};

  S.domains = [
    { id: "alg", name: "Algebra", weight: 0.35, blurb: "Linear equations, functions, systems and inequalities. About 13 to 15 questions per test.",
      skills: ["alg.lin1", "alg.linfn", "alg.lin2", "alg.sys", "alg.ineq"] },
    { id: "adv", name: "Advanced Math", weight: 0.35, blurb: "Quadratics, exponentials, polynomials and equivalent expressions. About 13 to 15 questions.",
      skills: ["adv.equiv", "adv.nleq", "adv.nlfn"] },
    { id: "psda", name: "Problem-Solving and Data Analysis", short: "Problem-Solving & Data", weight: 0.15, blurb: "Ratios, percentages, statistics, probability and studies. About 5 to 7 questions.",
      skills: ["psda.ratio", "psda.pct", "psda.stats1", "psda.stats2", "psda.prob", "psda.infer", "psda.claims"] },
    { id: "geo", name: "Geometry and Trigonometry", short: "Geometry & Trig", weight: 0.15, blurb: "Area and volume, angles, triangles, trigonometry and circles. About 5 to 7 questions.",
      skills: ["geo.area", "geo.lines", "geo.trig", "geo.circle"] }
  ];

  S.skills = {
    "alg.lin1": { name: "Linear equations in one variable", blurb: "Solve equations like 3(x − 4) = 5x + 2, build them from word problems, and spot when there's no solution or infinitely many." },
    "alg.linfn": { name: "Linear functions", blurb: "Evaluate f(x), find the line through two points, read a line from its graph, and interpret slope and intercept." },
    "alg.lin2": { name: "Linear equations in two variables", blurb: "Write ax + by = c from a situation, find slopes and intercepts, and work with parallel and perpendicular lines." },
    "alg.sys": { name: "Systems of two linear equations", blurb: "Solve systems, set up systems from word problems, and find when a system has no solution or infinitely many." },
    "alg.ineq": { name: "Linear inequalities", blurb: "Solve inequalities (and flip the sign when you should), answer \"at most / at least\" word problems, and test points." },
    "adv.equiv": { name: "Equivalent expressions", blurb: "Expand, factor, combine rational expressions and use exponent rules to find which expression is equivalent." },
    "adv.nleq": { name: "Nonlinear equations and systems", blurb: "Solve quadratics, use the discriminant, solve line-and-parabola systems and catch extraneous solutions." },
    "adv.nlfn": { name: "Nonlinear functions", blurb: "Vertices, exponential growth and decay, function notation, transformations and x-intercepts." },
    "psda.ratio": { name: "Ratios, rates and units", blurb: "Unit conversions, rates, proportions and splitting a total in a given ratio." },
    "psda.pct": { name: "Percentages", blurb: "Percent change, successive changes, and working backward from a discounted or increased price." },
    "psda.stats1": { name: "One-variable data", blurb: "Mean, median and spread, and how changing one value affects them." },
    "psda.stats2": { name: "Two-variable data and models", blurb: "Lines of best fit, predictions, interpreting slope, and linear versus exponential models." },
    "psda.prob": { name: "Probability", blurb: "Probability from two-way tables, conditional probability and simple chance." },
    "psda.infer": { name: "Inference and margin of error", blurb: "Estimate a population from a random sample and interpret a margin of error." },
    "psda.claims": { name: "Studies and experiments", blurb: "Decide what a study can conclude: cause and effect, and who the results apply to." },
    "geo.area": { name: "Area and volume", blurb: "Volumes of prisms, cylinders, cones, spheres and pyramids, and how scaling changes area and volume." },
    "geo.lines": { name: "Lines, angles and triangles", blurb: "Parallel lines and transversals, triangle angle facts and similar triangles." },
    "geo.trig": { name: "Right triangles and trigonometry", blurb: "Pythagorean theorem, sine, cosine and tangent, special right triangles and radians." },
    "geo.circle": { name: "Circles", blurb: "Circle equations (completing the square), arc length and sector area." }
  };
  S.domainOf = function (skill) { return skill.split(".")[0]; };
  S.domainById = function (id) { return S.domains.filter(function (d) { return d.id === id; })[0]; };
})(typeof window !== "undefined" ? window : globalThis);
