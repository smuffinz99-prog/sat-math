/* SAT Math: the Desmos Playbook. Each lesson teaches one calculator move, with an example that loads into
   the calculator and a practice set drawn from the question templates that suit the move. */
(function (G) {
  "use strict";
  var S = G.SATM = G.SATM || {};
  S.playbook = [
    {
      id: "both-sides", title: "Graph both sides", tag: "Equations",
      when: "Any equation with one variable: linear, quadratic, absolute value, radical or exponential. It's the single most useful Desmos move on the test.",
      steps: ["Type the left side of the equation as \\(y=\\) …", "Type the right side as \\(y=\\) … on the next line.", "Click each point where the two graphs cross. The x-coordinate of each crossing is a solution."],
      example: { prompt: "Solve \\(3(x - 4) + 2 = 5x - 18\\).", exprs: ["y=3(x-4)+2", "y=5x-18"], bounds: { left: -4, right: 10, bottom: -14, top: 14 },
                 look: "Click the gray point where the lines cross: \\((4, 2)\\). The solution is \\(x = 4\\)." },
      tips: ["If the graphs never meet, there's no solution. If you only see one line, both sides are the same line, so there are infinitely many solutions.",
             "Desmos shows decimals. \\(0.857\\) might really be \\(\\frac{6}{7}\\). For a typed answer, enter a fraction or a decimal that fills all 5 spaces (.8571)."],
      practice: ["lin1.solve", "lin1.nsol", "nleq.radical", "nleq.abs"]
    },
    {
      id: "systems", title: "Click the intersection", tag: "Systems",
      when: "Systems of equations: two lines, or a line and a parabola. You don't need to rearrange anything first.",
      steps: ["Type each equation exactly as it's written, one per line. Desmos graphs \\(2x + 3y = 12\\) without solving for \\(y\\).", "Click where the graphs cross. Desmos shows the coordinates \\((x, y)\\).", "If the question asks for something like \\(x + y\\), add the coordinates you read off."],
      example: { prompt: "Solve the system \\(2x + 3y = 12\\) and \\(x - y = 1\\).", exprs: ["2x+3y=12", "x-y=1"], bounds: { left: -3, right: 8, bottom: -4, top: 7 },
                 look: "The lines cross at \\((3, 2)\\), so \\(x = 3\\) and \\(y = 2\\)." },
      tips: ["Word problem? Name the variables first (x = adult tickets, y = student tickets), then type both equations. Zoom out if the crossing is off screen.",
             "A line and a parabola can cross twice. Click both points."],
      practice: ["sys.solve", "sys.context", "nleq.system"]
    },
    {
      id: "zeros-vertex", title: "Zeros, vertex and intercepts", tag: "Quadratics",
      when: "Finding solutions of a quadratic, the vertex (maximum or minimum), or x- and y-intercepts of any function.",
      steps: ["Graph the function as \\(y=\\) …", "Click the curve once. Desmos marks special points in gray: x-intercepts, the vertex, and the y-intercept.", "Click a gray point to see its coordinates."],
      example: { prompt: "Find the zeros and the vertex of \\(y = x^{2} - 6x + 5\\).", exprs: ["y=x^{2}-6x+5"], bounds: { left: -2, right: 8, bottom: -6, top: 8 },
                 look: "The zeros are \\((1, 0)\\) and \\((5, 0)\\), and the vertex (the minimum) is \\((3, -4)\\)." },
      tips: ["A zero at \\(x = 5\\) means the expression has a factor \\((x - 5)\\). That's a fast way to check factoring choices.",
             "The vertex is halfway between the zeros. If Desmos shows \\(x = 2.5\\), that's \\(\\frac{5}{2}\\)."],
      practice: ["nleq.quadratic", "nlfn.vertex", "nlfn.zeros", "equiv.factor"]
    },
    {
      id: "sliders", title: "Sliders for unknown constants", tag: "Constants",
      when: "\"For what value of \\(k\\)…\" questions: no solution, infinitely many solutions, exactly one solution, or a graph that just touches the x-axis.",
      steps: ["Type the equation with the letter in it, like \\(y = x^{2} + 8x + c\\).", "Click \"add slider\" for the letter (or type \\(c = 1\\) on its own line).", "Drag the slider until the picture matches the condition: parallel lines (no solution), the same line (infinitely many), or the parabola touching the x-axis (exactly one solution)."],
      example: { prompt: "For what value of \\(c\\) does \\(x^{2} + 8x + c = 0\\) have exactly one real solution?", exprs: ["y=x^{2}+8x+c", "c=1"], bounds: { left: -10, right: 3, bottom: -18, top: 10 },
                 look: "Drag \\(c\\) up. At \\(c = 16\\) the parabola's vertex just touches the x-axis: exactly one solution." },
      tips: ["Click the slider's ends to set its range and step. A step of 1 makes it easy to land exactly on whole numbers.",
             "Use the slider to find the answer, then check it with algebra (here: the discriminant \\(8^{2} - 4c = 0\\))."],
      practice: ["nleq.discriminant", "sys.nsol", "lin1.nsol"]
    },
    {
      id: "regression", title: "Regression from points", tag: "Models",
      when: "Finding a linear or exponential equation from points or a table, and lines of best fit for data.",
      steps: ["Enter the x-values and y-values as lists: \\(x_1 = [\\ldots]\\) and \\(y_1 = [\\ldots]\\). (Type x then _ then 1 for the subscript.)", "For a line, type \\(y_1 \\sim mx_1 + b\\). For exponential growth, type \\(y_1 \\sim ab^{x_1}\\).", "Desmos shows the constants (\\(m\\) and \\(b\\), or \\(a\\) and \\(b\\)). With exact data, \\(R^{2} = 1\\)."],
      example: { prompt: "A linear function has \\(f(2) = 7\\) and \\(f(6) = 19\\). Find \\(f(x)\\).", exprs: ["x_1=[2,6]", "y_1=[7,19]", "(x_1,y_1)", "y_1\\sim mx_1+b"], bounds: { left: -2, right: 9, bottom: -3, top: 24 },
                 look: "Desmos finds \\(m = 3\\) and \\(b = 1\\), so \\(f(x) = 3x + 1\\)." },
      tips: ["Use \\(\\sim\\) (the key next to 1 on a keyboard, or the keypad), not \\(=\\). With \\(=\\), Desmos tries to graph an equation instead of fitting one.",
             "Comparing linear and exponential? Run both regressions. The one with \\(R^{2}\\) closer to 1 fits better."],
      practice: ["linfn.twopoints", "linfn.graph", "nlfn.eval", "stats2.model", "stats2.lobf"]
    },
    {
      id: "overlay", title: "Overlay test for equivalent expressions", tag: "Expressions",
      when: "\"Which expression is equivalent to…?\" questions: expanding, factoring, rational expressions and exponents.",
      steps: ["Graph the given expression as \\(y=\\) …", "Graph each answer choice as \\(y=\\) … too.", "The equivalent choice lands exactly on top of the original everywhere. Hide the original (click its colored circle) to double-check."],
      example: { prompt: "Which is equivalent to \\((2x + 3)(x - 4)\\): \\(2x^{2} - 12\\), \\(2x^{2} - 5x - 12\\), or \\(2x^{2} + 11x - 12\\)?", exprs: ["y=(2x+3)(x-4)", "y=2x^{2}-12", "y=2x^{2}-5x-12", "y=2x^{2}+11x-12"], bounds: { left: -6, right: 7, bottom: -20, top: 20 },
                 look: "Only \\(y = 2x^{2} - 5x - 12\\) sits exactly on the original parabola." },
      tips: ["Two graphs can cross at a point without being equivalent. Equivalent means they match everywhere.",
             "Rational expressions can have a hole where the original is undefined. That's fine; the rest of the graph still matches."],
      practice: ["equiv.expand", "equiv.factor", "equiv.rational", "equiv.exponent"]
    },
    {
      id: "inequalities", title: "Shade inequalities and test points", tag: "Inequalities",
      when: "Systems of inequalities, \"which point is a solution\" questions, and one-variable inequalities.",
      steps: ["Type each inequality as written. Desmos shades the solutions to each one.", "The solutions to the system are where the shadings overlap.", "Type the answer choices as points. The right one lands in the overlap. A point on a dashed boundary doesn't count; a solid boundary is included."],
      example: { prompt: "Which point is a solution to \\(y \\gt 2x - 3\\) and \\(y \\le -x + 6\\): \\((4, 1)\\), \\((1, 2)\\), \\((-2, 9)\\) or \\((0, -4)\\)?", exprs: ["y>2x-3", "y\\le-x+6", "(4,1)", "(1,2)", "(-2,9)", "(0,-4)"], bounds: { left: -6, right: 8, bottom: -7, top: 11 },
                 look: "Only \\((1, 2)\\) is inside both shaded regions." },
      tips: ["One variable works too: type \\(-3x + 7 \\ge 22\\) and Desmos shades \\(x \\le -5\\) (the flipped direction you'd get by hand).",
             "Word problem with \"at most\" or \"at least\"? Graph the total as a line and the limit as \\(y=\\) …, then round in the direction the question allows."],
      practice: ["ineq.region", "ineq.solve", "ineq.context"]
    },
    {
      id: "functions", title: "Function notation", tag: "Functions",
      when: "Evaluating functions, compositions like \\(f(g(2))\\), and transformations like \\(f(x - 2) + 3\\).",
      steps: ["Define the function on its own line: \\(f(x) = 2x^{2} - 3x + 1\\).", "Type expressions that use it, like \\(f(3)\\) or \\(f(g(-2))\\). Desmos shows the value.", "To see a transformation, graph \\(y = f(x - 2) + 3\\) next to \\(y = f(x)\\)."],
      example: { prompt: "\\(f(x) = 2x^{2} - 3x + 1\\) and \\(g(x) = x + 4\\). What is \\(f(g(-2))\\)?", exprs: ["f(x)=2x^{2}-3x+1", "g(x)=x+4", "f(g(-2))"], bounds: { left: -6, right: 6, bottom: -4, top: 12 },
                 look: "Desmos shows \\(f(g(-2)) = 3\\): first \\(g(-2) = 2\\), then \\(f(2) = 3\\)." },
      tips: ["Use a letter other than \\(x\\) or \\(y\\) for constants, and define it as a slider if the question gives one.",
             "\\(f(x - 2)\\) moves the graph 2 units right; \\(f(x) + 3\\) moves it 3 units up."],
      practice: ["linfn.eval", "nlfn.eval", "nlfn.transform"]
    },
    {
      id: "stats", title: "Statistics on lists", tag: "Data",
      when: "Mean, median, standard deviation and comparing data sets.",
      steps: ["Type the data as a list: \\(L = [12, 15, 15, 18, 21, 22, 60]\\).", "Type \\(\\operatorname{mean}(L)\\), \\(\\operatorname{median}(L)\\) or \\(\\operatorname{stdev}(L)\\).", "For two data sets, name them \\(A\\) and \\(B\\) and compare the results."],
      example: { prompt: "Find the mean and median of 12, 15, 15, 18, 21, 22, 60.", exprs: ["L=[12,15,15,18,21,22,60]", "\\operatorname{mean}(L)", "\\operatorname{median}(L)"],
                 look: "The mean is about 23.29 and the median is 18. The outlier, 60, pulls the mean up but barely affects the median." },
      tips: ["For a frequency table, repeat each value as many times as its frequency.",
             "The SAT rarely asks you to calculate a standard deviation. It asks which set is more spread out."],
      practice: ["stats1.mean", "stats1.median", "stats1.compare"]
    },
    {
      id: "circles-trig", title: "Circles and trig", tag: "Geometry",
      when: "Circle equations (center and radius), and trig values in degrees.",
      steps: ["Type a circle's equation exactly as given, even the expanded form. Desmos draws the circle.", "Read the center and radius from the picture, or type a guessed center as a point to check it.", "For trig in degrees, open the wrench (graph settings) and switch to Degrees. Then \\(\\sin(30)\\) means sin 30°."],
      example: { prompt: "Find the center and radius of \\(x^{2} + y^{2} - 6x + 8y - 11 = 0\\).", exprs: ["x^{2}+y^{2}-6x+8y-11=0", "(3,-4)"], bounds: { left: -6, right: 12, bottom: -12, top: 4 },
                 look: "The circle is centered at \\((3, -4)\\) and reaches 6 units in every direction, so the radius is 6." },
      tips: ["By hand, complete the square: \\((x - 3)^{2} + (y + 4)^{2} = 36\\), so \\(r = 6\\), not 36.",
             "Radians to degrees: multiply by \\(\\frac{180}{\\pi}\\). Desmos can do it: \\(\\frac{5\\pi}{6}\\cdot\\frac{180}{\\pi} = 150\\)."],
      practice: ["circle.equation", "trig.special", "trig.ratio"]
    },
    {
      id: "calculator", title: "Desmos as a calculator", tag: "Arithmetic",
      when: "Percents, ratios, unit conversions and probability, where the hard part is the setup and the rest is arithmetic.",
      steps: ["Set up the calculation on paper or in your head first.", "Type it on one line. Use \\(\\frac{a}{b}\\) for fractions (type /) and \\(\\cdot\\) for multiplication (type *).", "Check that the result makes sense: a price after a discount should be smaller, and a probability is between 0 and 1."],
      example: { prompt: "A $80 jacket goes up 15%, then down 20%. What's the final price?", exprs: ["80\\cdot1.15\\cdot0.8"],
                 look: "Desmos shows 73.6, so the final price is $73.60. The two changes don't cancel out." },
      tips: ["Percent increase of 15% means multiply by 1.15. A 20% decrease means multiply by 0.8.",
             "For a typed answer, don't type units, percent signs or commas."],
      practice: ["pct.change", "pct.reverse", "ratio.convert", "prob.twoway"]
    }
  ];
  S.lesson = function (id) { return S.playbook.filter(function (l) { return l.id === id; })[0]; };
})(typeof window !== "undefined" ? window : globalThis);
