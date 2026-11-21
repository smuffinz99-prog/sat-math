/* SAT Math: figures drawn as SVG (graphs, scatterplots, triangles, parallel lines) and simple tables.
   Colors come from CSS classes so figures follow the light/dark theme. */
(function (G) {
  "use strict";
  var S = G.SATM, fig = S.fig = {};

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function r(x) { return Math.round(x * 10) / 10; }
  function ln(x1, y1, x2, y2, cls) { return '<line class="' + cls + '" x1="' + r(x1) + '" y1="' + r(y1) + '" x2="' + r(x2) + '" y2="' + r(y2) + '"/>'; }
  function txt(x, y, s, cls, anchor) {
    return '<text class="' + (cls || "t") + '" x="' + r(x) + '" y="' + r(y) + '" text-anchor="' + (anchor || "middle") + '">' + esc(s) + "</text>";
  }
  function dot(x, y, cls, rad) { return '<circle class="' + (cls || "pt") + '" cx="' + r(x) + '" cy="' + r(y) + '" r="' + (rad || 3.6) + '"/>'; }
  function wrap(w, h, body, alt) {
    return '<svg class="fig" viewBox="0 0 ' + w + " " + h + '" width="' + w + '" role="img" aria-label="' + esc(alt || "Figure") + '">' + body + "</svg>";
  }
  fig.esc = esc;

  // Coordinate plane with a grid. o: {xmin,xmax,ymin,ymax, grid, labelEvery, curves:[{f, dash}], points:[[x,y]], alt}
  fig.plane = function (o) {
    var W = o.size || 300, H = Math.round(W * (o.ymax - o.ymin) / (o.xmax - o.xmin)), pad = 20;
    H = Math.max(200, Math.min(380, H));
    var sx = (W - 2 * pad) / (o.xmax - o.xmin), sy = (H - 2 * pad) / (o.ymax - o.ymin);
    function X(x) { return pad + (x - o.xmin) * sx; }
    function Y(y) { return H - pad - (y - o.ymin) * sy; }
    var g = o.grid || 1, every = o.labelEvery || 2, out = [];
    for (var x = Math.ceil(o.xmin / g) * g; x <= o.xmax + 1e-9; x += g) out.push(ln(X(x), Y(o.ymin), X(x), Y(o.ymax), "grid"));
    for (var y = Math.ceil(o.ymin / g) * g; y <= o.ymax + 1e-9; y += g) out.push(ln(X(o.xmin), Y(y), X(o.xmax), Y(y), "grid"));
    var ax0 = Math.min(Math.max(0, o.ymin), o.ymax), ay0 = Math.min(Math.max(0, o.xmin), o.xmax);
    out.push(ln(X(o.xmin), Y(ax0), X(o.xmax), Y(ax0), "axis"));
    out.push(ln(X(ay0), Y(o.ymin), X(ay0), Y(o.ymax), "axis"));
    out.push(txt(X(o.xmax) - 2, Y(ax0) - 6, "x", "t ital", "end"));
    out.push(txt(X(ay0) + 7, Y(o.ymax) + 11, "y", "t ital", "start"));
    for (x = Math.ceil(o.xmin / every) * every; x <= o.xmax; x += every) if (x !== 0 && x > o.xmin && x < o.xmax) out.push(txt(X(x), Y(ax0) + 13, String(x).replace("-", "−"), "t num"));
    for (y = Math.ceil(o.ymin / every) * every; y <= o.ymax; y += every) if (y !== 0 && y > o.ymin && y < o.ymax) out.push(txt(X(ay0) - 5, Y(y) + 4, String(y).replace("-", "−"), "t num", "end"));
    out.push(txt(X(ay0) - 5, Y(ax0) + 13, "O", "t ital", "end"));
    // Curves are clipped to the grid (not squashed onto its edge).
    var clip = "plotclip-" + W + "x" + H;                        // same size, same rectangle, so the id can repeat safely
    out.push('<clipPath id="' + clip + '"><rect x="' + r(X(o.xmin)) + '" y="' + r(Y(o.ymax)) + '" width="' + r(X(o.xmax) - X(o.xmin)) + '" height="' + r(Y(o.ymin) - Y(o.ymax)) + '"/></clipPath>');
    (o.curves || []).forEach(function (c) {
      var d = "", pen = false, N = 240, span = o.ymax - o.ymin;
      for (var i = 0; i <= N; i++) {
        var xv = o.xmin + (o.xmax - o.xmin) * i / N, yv = c.f(xv);
        if (!isFinite(yv) || yv < o.ymin - span || yv > o.ymax + span) { pen = false; continue; }
        d += (pen ? "L" : "M") + r(X(xv)) + " " + r(Y(yv));
        pen = true;
      }
      out.push('<path class="curve' + (c.dash ? " dash" : "") + '" clip-path="url(#' + clip + ')" d="' + d + '"/>');
    });
    (o.points || []).forEach(function (p) { out.push(dot(X(p[0]), Y(p[1]), "pt")); });
    return wrap(W, H, out.join(""), o.alt);
  };

  // Scatterplot with labeled axes. o: {xmin,xmax,xstep,ymin,ymax,ystep,xlabel,ylabel,pts,line:{m,b},alt}
  fig.scatter = function (o) {
    var W = 360, H = 270, L = 54, B = 44, T = 14, Rr = 14;
    var sx = (W - L - Rr) / (o.xmax - o.xmin), sy = (H - B - T) / (o.ymax - o.ymin);
    function X(x) { return L + (x - o.xmin) * sx; }
    function Y(y) { return H - B - (y - o.ymin) * sy; }
    var out = [];
    for (var x = o.xmin; x <= o.xmax + 1e-9; x += o.xstep) { out.push(ln(X(x), Y(o.ymin), X(x), Y(o.ymax), "grid")); out.push(txt(X(x), Y(o.ymin) + 15, S.fmt.num(Math.round(x * 100) / 100), "t num")); }
    for (var y = o.ymin; y <= o.ymax + 1e-9; y += o.ystep) { out.push(ln(X(o.xmin), Y(y), X(o.xmax), Y(y), "grid")); out.push(txt(X(o.xmin) - 6, Y(y) + 4, S.fmt.num(Math.round(y * 100) / 100), "t num", "end")); }
    out.push(ln(X(o.xmin), Y(o.ymin), X(o.xmax), Y(o.ymin), "axis"));
    out.push(ln(X(o.xmin), Y(o.ymin), X(o.xmin), Y(o.ymax), "axis"));
    out.push(txt((X(o.xmin) + X(o.xmax)) / 2, H - 8, o.xlabel, "t lab"));
    out.push('<text class="t lab" transform="translate(13 ' + r((Y(o.ymin) + Y(o.ymax)) / 2) + ') rotate(-90)" text-anchor="middle">' + esc(o.ylabel) + "</text>");
    if (o.line) {
      var x1 = o.xmin, x2 = o.xmax, f = function (xv) { return o.line.m * xv + o.line.b; };
      // clip the line to the plot box
      var seg = [];
      [[x1, f(x1)], [x2, f(x2)]].forEach(function (p) { seg.push(p); });
      if (f(x1) < o.ymin || f(x1) > o.ymax) { var yc = f(x1) < o.ymin ? o.ymin : o.ymax; seg[0] = [(yc - o.line.b) / o.line.m, yc]; }
      if (f(x2) < o.ymin || f(x2) > o.ymax) { var yd = f(x2) < o.ymin ? o.ymin : o.ymax; seg[1] = [(yd - o.line.b) / o.line.m, yd]; }
      out.push(ln(X(seg[0][0]), Y(seg[0][1]), X(seg[1][0]), Y(seg[1][1]), "curve"));
    }
    o.pts.forEach(function (p) { out.push(dot(X(p[0]), Y(p[1]), "pt", 3.4)); });
    return wrap(W, H, out.join(""), o.alt);
  };

  // Right triangle with the right angle at the lower-left vertex.
  // o: {v: [right-angle vertex, vertex on the vertical leg, vertex on the horizontal leg], legV, legH (numbers for shape),
  //     labV, labH, labHyp (side labels or ""), alt}
  fig.rightTri = function (o) {
    var maxW = 230, maxH = 150, ratio = o.legV / o.legH;
    var w = maxW, h = w * ratio;
    if (h > maxH) { h = maxH; w = h / ratio; }
    if (w < 60) w = 60;
    if (h < 50) h = 50;
    var ox = 60, oy = 30 + h, W = Math.max(300, ox + w + 60), H = oy + 44;
    var C = [ox, oy], A = [ox, oy - h], B = [ox + w, oy], out = [];
    out.push('<path class="shape" d="M' + r(A[0]) + " " + r(A[1]) + "L" + r(C[0]) + " " + r(C[1]) + "L" + r(B[0]) + " " + r(B[1]) + 'Z"/>');
    out.push('<path class="thin" d="M' + (ox + 12) + " " + oy + "V" + (oy - 12) + "H" + ox + '"/>');
    out.push(txt(C[0] - 10, C[1] + 16, o.v[0], "t ital"));
    out.push(txt(A[0] - 10, A[1] + 4, o.v[1], "t ital"));
    out.push(txt(B[0] + 10, B[1] + 16, o.v[2], "t ital"));
    if (o.labV) out.push(txt(ox - 9, oy - h / 2 + 4, o.labV, "t num", "end"));
    if (o.labH) out.push(txt(ox + w / 2, oy + 18, o.labH, "t num"));
    if (o.labHyp) out.push(txt(ox + w / 2 + 12, oy - h / 2 - 6, o.labHyp, "t num", "start"));
    if (o.angleAt) {   // mark an acute angle with an arc: "top" (at the vertical leg's end) or "right"
      var P = o.angleAt === "top" ? A : B, a1, a2;
      if (o.angleAt === "top") { a1 = -90; a2 = -90 + Math.atan2(w, h) * 180 / Math.PI; }
      else { a1 = 180 - Math.atan2(h, w) * 180 / Math.PI; a2 = 180; }
      out.push(arc(P[0], P[1], 20, a1, a2));
      if (o.angleLabel) { var mid = (a1 + a2) / 2 * Math.PI / 180; out.push(txt(P[0] + 36 * Math.cos(mid), P[1] - 36 * Math.sin(mid) + 4, o.angleLabel, "t num")); }
    }
    return wrap(W, H, out.join(""), o.alt);
  };
  // Arc around (cx, cy) from angle a1 to a2 in degrees (math convention: counterclockwise, y up).
  function arc(cx, cy, rad, a1, a2) {
    var p1 = [cx + rad * Math.cos(a1 * Math.PI / 180), cy - rad * Math.sin(a1 * Math.PI / 180)];
    var p2 = [cx + rad * Math.cos(a2 * Math.PI / 180), cy - rad * Math.sin(a2 * Math.PI / 180)];
    var large = Math.abs(a2 - a1) > 180 ? 1 : 0;
    return '<path class="thin" d="M' + r(p1[0]) + " " + r(p1[1]) + "A" + rad + " " + rad + " 0 " + large + " 0 " + r(p2[0]) + " " + r(p2[1]) + '"/>';
  }

  // Two parallel lines cut by a transversal. Angle positions at each crossing: TR, TL, BL, BR.
  // o: {theta (degrees, angle of the transversal with the lines), marks: [{at: 1|2, pos, label}], alt}
  fig.transversal = function (o) {
    var W = 340, H = 250, y1 = 80, y2 = 180, th = o.theta * Math.PI / 180;
    var x1 = 190, x2 = x1 - (y2 - y1) / Math.tan(th);
    var out = [];
    out.push(ln(20, y1, W - 20, y1, "shape"));
    out.push(ln(20, y2, W - 20, y2, "shape"));
    out.push(txt(W - 14, y1 - 8, "ℓ", "t ital", "end"));
    out.push(txt(W - 14, y2 - 8, "m", "t ital", "end"));
    var ext = 70, dx = Math.cos(th), dy = Math.sin(th);
    out.push(ln(x1 + dx * ext, y1 - dy * ext, x2 - dx * ext, y2 + dy * ext, "shape"));
    var deg = o.theta, ranges = { TR: [0, deg], TL: [deg, 180], BL: [180, 180 + deg], BR: [180 + deg, 360] };
    (o.marks || []).forEach(function (mk) {
      var cx = mk.at === 1 ? x1 : x2, cy = mk.at === 1 ? y1 : y2, rg = ranges[mk.pos];
      out.push(arc(cx, cy, 16, rg[0], rg[1]));
      var mid = (rg[0] + rg[1]) / 2 * Math.PI / 180, rad = 34 + (rg[1] - rg[0] < 50 ? 10 : 0);
      out.push(txt(cx + rad * Math.cos(mid), cy - rad * Math.sin(mid) + 5, mk.label, "t num"));
    });
    return wrap(W, H, out.join(""), o.alt);
  };

  // Triangle ABC (A on top) with segment DE parallel to BC (D on AB, E on AC). t = AD/AB.
  fig.triParallel = function (o) {
    var W = 320, H = 230, A = [150, 24], B = [30, 200], C = [290, 200], t = o.t;
    var D = [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t], E = [A[0] + (C[0] - A[0]) * t, A[1] + (C[1] - A[1]) * t];
    var out = ['<path class="shape" d="M' + A.join(" ") + "L" + B.join(" ") + "L" + C.join(" ") + 'Z"/>', ln(D[0], D[1], E[0], E[1], "shape")];
    out.push(txt(A[0], A[1] - 8, "A", "t ital"));
    out.push(txt(B[0] - 10, B[1] + 14, "B", "t ital"));
    out.push(txt(C[0] + 10, C[1] + 14, "C", "t ital"));
    out.push(txt(D[0] - 12, D[1] + 4, "D", "t ital"));
    out.push(txt(E[0] + 12, E[1] + 4, "E", "t ital"));
    if (o.labAD) out.push(txt((A[0] + D[0]) / 2 - 14, (A[1] + D[1]) / 2 + 2, o.labAD, "t num", "end"));
    if (o.labDB) out.push(txt((D[0] + B[0]) / 2 - 14, (D[1] + B[1]) / 2 + 2, o.labDB, "t num", "end"));
    if (o.labDE) out.push(txt((D[0] + E[0]) / 2, D[1] - 7, o.labDE, "t num"));
    if (o.labBC) out.push(txt((B[0] + C[0]) / 2, B[1] + 18, o.labBC, "t num"));
    return wrap(W, H, out.join(""), o.alt);
  };

  // Simple HTML table. head: [cells], rows: [[cells]], opts.firstCol makes the first column a header.
  S.table = function (head, rows, opts) {
    opts = opts || {};
    var h = "<table class=\"dtab\"><thead><tr>" + head.map(function (c) { return "<th>" + c + "</th>"; }).join("") + "</tr></thead><tbody>";
    rows.forEach(function (row) {
      h += "<tr>" + row.map(function (c, i) { return (i === 0 && opts.firstCol ? "<th>" : "<td>") + c + (i === 0 && opts.firstCol ? "</th>" : "</td>"); }).join("") + "</tr>";
    });
    return h + "</tbody></table>";
  };
})(typeof window !== "undefined" ? window : globalThis);
