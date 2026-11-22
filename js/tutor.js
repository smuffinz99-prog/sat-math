/* SAT Math: the AI tutor. It calls Google's Gemini API straight from the browser with the student's own key.
   The key stays in this browser (localStorage) and goes only to Google. SAT Reading & Writing (same site)
   saves its key under "sat.gemini"; this app can reuse it. */
(function (G) {
  "use strict";
  var S = G.SATM, esc = S.fig.esc;
  var GEMINI = "https://generativelanguage.googleapis.com/v1beta";
  var MODELS = [{ id: "gemini-3.8-flash", label: "Gemini 3.8 Flash (free tier, recommended)" },
                { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite (fastest, free tier)" }];
  var FALLBACK = ["gemini-flash-latest", "gemini-flash-lite-latest"];   // if Google retires the chosen model

  var SYSTEM = [
    "You are the AI tutor inside \"SAT Math\", a practice app for the digital SAT. The app shows one SAT-style math question at a time next to a Desmos graphing calculator, the same calculator students get in Bluebook on test day.",
    "",
    "How to help:",
    "- Teach the fastest Desmos method when there is one, and the math behind it. Common Desmos moves: graph both sides of an equation and click the intersection; type a system exactly as given and click the crossing point; click a graph to read zeros, the vertex and intercepts; add a slider for an unknown constant and drag it; regression with lists (y_1 ~ mx_1 + b, y_1 ~ ab^{x_1}); graph an expression and each answer choice to see which one is equivalent; mean(), median() and stdev() on a list; degree mode for trig.",
    "- Keep replies short: usually 2 to 6 sentences or a short numbered list. No headings. Be friendly and direct, for a high-school student.",
    "- The answer key and official solution in the context are correct. Never contradict them. If your own work disagrees, recheck it.",
    "- If the student hasn't submitted an answer yet, don't reveal the correct choice, its letter or the final value unless they explicitly ask for the answer. Give a hint or the next step instead.",
    "- When the student should type something into Desmos, put it in a fenced code block labeled desmos, one expression per line, in Desmos LaTeX (for example: y=3x-5, y=x^{2}-4x+1, \\sqrt{x+3}, \\frac{1}{2}, \\le, \\ge, x_1=[1,2,3], y_1\\sim mx_1+b, k=1 for a slider). At most 6 lines. The app turns the block into a button that loads it into the calculator. Then say exactly what to click or look at.",
    "- Write math in LaTeX inside \\( ... \\) for inline math and \\[ ... \\] for display math. Never use dollar signs for math: a $ means money.",
    "- If you're given the student's Desmos expressions or a screenshot of their graph, refer to them specifically: point out typos (missing parentheses, wrong signs, a missing multiplication) and explain what the graph shows.",
    "- If the student asks about something unrelated to the SAT, answer briefly and steer back to the question."
  ].join("\n");

  function satAcademyKey() { try { var s = JSON.parse(localStorage.getItem("sat.gemini") || "{}") || {}; return s.key ? s : null; } catch (e) { return null; } }
  function keyInfo() {
    var st = S.Store.settings(), own = st.gemini || {};
    if (own.key) return { key: own.key, model: own.model || MODELS[0].id, source: "own" };
    if (st.borrow !== false) { var sa = satAcademyKey(); if (sa) return { key: sa.key, model: own.model || (MODELS.some(function (m) { return m.id === sa.model; }) ? sa.model : MODELS[0].id), source: "sat" }; }
    return null;
  }
  function friendly(code, detail) {
    var d = String(detail || "").toLowerCase();
    if (code === 401 || code === 403 || d.indexOf("api_key_invalid") >= 0 || d.indexOf("api key not valid") >= 0) return "That API key was rejected. Check it in Settings (no spaces, the whole key).";
    if (d.indexOf("referer") >= 0 || d.indexOf("referrer") >= 0) return "Your key is restricted to other websites. In Google AI Studio, allow this site or remove the website restriction.";
    if (code === 429 || d.indexOf("resource_exhausted") >= 0 || d.indexOf("quota") >= 0) return "You've hit the tutor's rate limit. Wait a minute and try again.";
    if (code === 404) return "That model isn't available for your key. Pick another model in Settings.";
    return "The AI service returned an error (HTTP " + code + ").";
  }
  async function call(k, body) {
    var models = [k.model].concat(FALLBACK.filter(function (m) { return m !== k.model; }));
    for (var i = 0; i < models.length; i++) {
      var r;
      try {
        r = await fetch(GEMINI + "/models/" + models[i] + ":generateContent", { method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": k.key }, body: body });
      } catch (e) { return { ok: false, error: "network", detail: "Couldn't reach the AI service. Check your internet connection." }; }
      if (r.status === 404 && i < models.length - 1) continue;
      var text = await r.text(), data = {};
      try { data = JSON.parse(text); } catch (e) { }
      if (!r.ok) return { ok: false, error: "api_error", detail: friendly(r.status, text) };
      var cands = data.candidates || [];
      if (!cands.length) return { ok: false, error: "api_error", detail: "The tutor couldn't answer that (" + ((data.promptFeedback || {}).blockReason || "no answer") + "). Try rephrasing." };
      var reply = ((cands[0].content || {}).parts || []).filter(function (p) { return !p.thought; }).map(function (p) { return p.text || ""; }).join("").trim();
      if (!reply) return { ok: false, error: "api_error", detail: "The tutor returned an empty answer. Try again." };
      return { ok: true, reply: reply, model: models[i] };
    }
  }

  var Tutor = S.Tutor = { MODELS: MODELS, keyInfo: keyInfo, satAcademyKey: satAcademyKey, threads: {} };
  Tutor.thread = function (id) { return Tutor.threads[id] || (Tutor.threads[id] = []); };
  Tutor.reset = function (id) { delete Tutor.threads[id]; };
  // image: base64 PNG string (a Desmos screenshot) or {data, mime}. opts: {system, imageNote}
  Tutor.ask = async function (threadId, message, context, image, opts) {
    opts = opts || {};
    var k = keyInfo();
    if (!k) return { ok: false, error: "not_configured" };
    var th = Tutor.thread(threadId);
    var contents = th.slice(-12).map(function (x) { return { role: x.role, parts: [{ text: x.text }] }; });
    var parts = [{ text: (context ? context + "\n\n" : "") + "Student: " + message }];
    if (image) parts.push({ inlineData: typeof image === "string" ? { mimeType: "image/png", data: image } : { mimeType: image.mime || "image/jpeg", data: image.data } });
    contents.push({ role: "user", parts: parts });
    var gen = opts.system ? {} : { temperature: 0.4 };
    var r = await call(k, JSON.stringify({ systemInstruction: { parts: [{ text: opts.system || SYSTEM }] }, contents: contents, generationConfig: gen }));
    if (r.ok) { th.push({ role: "user", text: message + (image ? " " + (opts.imageNote || "[The student shared a screenshot of their graph.]") : "") }); th.push({ role: "model", text: r.reply }); }
    return r;
  };

  // ---------------------------------------------------------------- the screenshot solver
  var SOLVER = [
    "You are the AI tutor in \"SAT Math\", an app for the digital SAT. A student sends a screenshot or photo of one SAT math question (or types it). Solve it and teach the fastest way, using the Desmos graphing calculator that students get in Bluebook on test day.",
    "Work carefully: read every number, sign, exponent and answer choice in the image; solve the question fully; then double-check by plugging your answer back in. Only then write the JSON. If the image shows more than one question, solve the first complete one.",
    "",
    "Fields:",
    "- readable: false if there's no math question you can read (blurry, cut off, not math). Then put a short, friendly explanation in \"problem\" and leave the other fields empty.",
    "- question: the question as written, in plain text with math in LaTeX inside \\( ... \\). No answer choices here.",
    "- choices: the answer choices in order, each without its letter, math in \\( ... \\). An empty list for a fill-in (student-produced response) question.",
    "- figure: one sentence describing any graph, table or figure, or \"\".",
    "- skill: the SAT skill, e.g. \"Linear equations in one variable\", \"Systems of two linear equations\", \"Nonlinear functions\", \"Circles\", \"Percentages\".",
    "- answer: the final answer. Multiple choice: the letter, \") \", then the choice, e.g. \"B) \\(12\\)\". Fill-in: a value the student can type in Bluebook, like 7/2 or 3.5 (give both forms if they differ, e.g. \"7/2 (or 3.5)\").",
    "- best: \"desmos\" if Desmos is the fastest reliable way, otherwise \"by hand\". bestWhy: one short sentence saying why.",
    "- desmosSteps: the Desmos way, 2 to 5 steps. Each step has \"say\" (what to do, one or two sentences, math in \\( \\)), \"add\" (the expressions to type in this step, each with optional \"label\" text shown on the graph) and \"look\" (exactly what to click or read on the graph and what it means, e.g. \"Click where the lines cross: (5, 20). So x = 5.\"). Add each key point as an expression too, like (5,20) with label \"x = 5\", so the graph shows it. Even if best is \"by hand\", give a Desmos way to check the answer.",
    "- bounds: a graph window (left, right, bottom, top) that shows every key point and feature with some margin.",
    "- degrees: true only if the question uses degrees in trigonometry.",
    "- handSteps: the by-hand solution, 2 to 6 short steps, math in \\( \\).",
    "- defs and checks: numeric spot-checks Desmos will run to confirm your answer (rules below).",
    "- trap: the most common mistake on this question, in one sentence (e.g. which wrong choice it leads to).",
    "",
    "Desmos LaTeX (for add, defs and checks): y=3x-5, y=x^{2}-4x+1, f(x)=2^{x}, \\frac{1}{2}, \\sqrt{x+3}, \\le, \\ge, \\pi, x_{1}=[1,2,3], y_{1}\\sim mx_{1}+b, a=1 (a slider). Braces for exponents and subscripts. Use parentheses or \\cdot for multiplication, never *. No unicode symbols like ≤ or √. Points are (a,b). No \\( \\) or $ in these fields.",
    "checks: 1 to 4 checks, each with \"left\" and \"right\": Desmos expressions that contain only numbers and functions or constants defined in defs, so each side is a single number. They must be equal exactly when your answer is right. Use exact values (fractions, \\sqrt{}, \\pi), not rounded decimals. Examples: x = 5 in 3x+5=20 → left \"3(5)+5\", right \"20\". With defs [\"f(x)=x^{2}-4x+1\"] → left \"f(2)\", right \"-3\". For \"which expression is equivalent\", evaluate both at x = 1.7 → left \"(1.7+2)^{2}\", right \"1.7^{2}+4(1.7)+4\". For multiple choice, check the chosen choice itself.",
    "",
    "Math in text fields goes in LaTeX inside \\( ... \\). Never use $ for math ($ means money). Write for a high-school student: short, friendly and clear."
  ].join("\n");
  var STR = { type: "STRING" }, NUM = { type: "NUMBER" };
  var SCHEMA = { type: "OBJECT", properties: {
    readable: { type: "BOOLEAN" }, problem: STR, question: STR, choices: { type: "ARRAY", items: STR }, figure: STR, skill: STR, answer: STR,
    best: { type: "STRING", enum: ["desmos", "by hand"] }, bestWhy: STR,
    desmosSteps: { type: "ARRAY", items: { type: "OBJECT", properties: { say: STR, add: { type: "ARRAY", items: { type: "OBJECT", properties: { latex: STR, label: STR }, required: ["latex"] } }, look: STR }, required: ["say"] } },
    bounds: { type: "OBJECT", properties: { left: NUM, right: NUM, bottom: NUM, top: NUM } }, degrees: { type: "BOOLEAN" },
    handSteps: { type: "ARRAY", items: STR }, defs: { type: "ARRAY", items: STR },
    checks: { type: "ARRAY", items: { type: "OBJECT", properties: { left: STR, right: STR }, required: ["left", "right"] } }, trap: STR
  }, required: ["readable", "question", "answer", "best", "desmosSteps", "handSteps", "checks"] };

  // Models sometimes write LaTeX backslashes unescaped inside JSON ("\frac" reads as a form feed + "rac"). Repair before parsing.
  var CMD = { b: /^(eta|inom|ar|ig|egin|oxed|ullet|ackslash)/, f: /^(rac|orall)/, n: /^(eq|abla|ot|u\b|eg\b|ewline|i\b)/, r: /^(ight|ho|angle|m\b)/, t: /^(ext|imes|heta|an|frac|riangle|o\b|ilde|au\b)/ };
  function repairJSON(raw) {
    var s = String(raw || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
    var a = s.indexOf("{"), z = s.lastIndexOf("}");
    if (a >= 0 && z > a) s = s.slice(a, z + 1);
    var out = "", inStr = false;
    for (var i = 0; i < s.length; i++) {
      var ch = s[i];
      if (!inStr) { out += ch; if (ch === '"') inStr = true; continue; }
      if (ch === '"') { out += ch; inStr = false; continue; }
      if (ch === "\n") { out += "\\n"; continue; }
      if (ch !== "\\") { out += ch; continue; }
      var nx = s[i + 1] || "", rest = s.slice(i + 2, i + 12);
      if (nx === "\\" || nx === '"' || nx === "/") { out += ch + nx; i++; }
      else if (CMD[nx] && CMD[nx].test(rest)) { out += "\\\\" + nx; i++; }
      else if ("bfnrt".indexOf(nx) >= 0 && nx) { out += ch + nx; i++; }
      else if (nx === "u" && /^[0-9a-fA-F]{4}/.test(rest)) { out += ch + nx; i++; }
      else { out += "\\\\"; }
    }
    return JSON.parse(out);
  }
  Tutor.repairJSON = repairJSON;
  function arr(v) { return Array.isArray(v) ? v : []; }
  function normalize(d) {
    d = d && typeof d === "object" ? d : {};
    var o = { readable: d.readable !== false, problem: String(d.problem || ""), question: String(d.question || ""), choices: arr(d.choices).map(String).filter(Boolean),
              figure: String(d.figure || ""), skill: String(d.skill || ""), answer: String(d.answer || ""), best: d.best === "by hand" ? "by hand" : "desmos", bestWhy: String(d.bestWhy || ""),
              desmosSteps: arr(d.desmosSteps).map(function (s) {
                s = s || {};
                return { say: String(s.say || ""), look: String(s.look || ""), add: arr(s.add).map(function (e) { return typeof e === "string" ? { latex: e } : { latex: String((e || {}).latex || ""), label: (e || {}).label ? String(e.label) : "" }; }).filter(function (e) { return e.latex.trim(); }) };
              }).filter(function (s) { return s.say || s.add.length; }),
              bounds: d.bounds || null, degrees: !!d.degrees, handSteps: arr(d.handSteps).map(String).filter(Boolean), defs: arr(d.defs).map(String).filter(Boolean),
              checks: arr(d.checks).filter(function (c) { return c && c.left && c.right; }).slice(0, 4).map(function (c) { return { left: String(c.left), right: String(c.right) }; }), trap: String(d.trap || "") };
    if (o.readable && !o.answer && !o.question) o.readable = false;
    return o;
  }
  // One solve request. history: earlier [{role, parts}] turns (for a retry). Falls back to looser JSON modes if the API rejects the schema.
  async function solveCall(k, contents) {
    var modes = [{ responseMimeType: "application/json", responseSchema: SCHEMA }, { responseMimeType: "application/json" }, {}];
    var r;
    for (var i = 0; i < modes.length; i++) {
      var sys = SOLVER + (i > 0 ? "\n\nReply with only a JSON object with these keys: readable, problem, question, choices, figure, skill, answer, best, bestWhy, desmosSteps [{say, add [{latex, label}], look}], bounds {left, right, bottom, top}, degrees, handSteps, defs, checks [{left, right}], trap." : "");
      r = await call(k, JSON.stringify({ systemInstruction: { parts: [{ text: sys }] }, contents: contents, generationConfig: modes[i] }));
      if (r.ok || !/HTTP 400\b/.test(r.detail || "")) break;
    }
    if (!r.ok) return r;
    try { return { ok: true, raw: r.reply, data: normalize(repairJSON(r.reply)), model: r.model }; }
    catch (e) { return { ok: false, error: "parse", detail: "The tutor's answer came back garbled. Try again." }; }
  }
  // image: {data, mime} or null. note: the student's text. Returns {ok, data, contents} where contents can be extended for a retry.
  Tutor.solve = async function (image, note) {
    var k = keyInfo();
    if (!k) return { ok: false, error: "not_configured" };
    var parts = [];
    if (image) parts.push({ inlineData: { mimeType: image.mime || "image/jpeg", data: image.data } });
    parts.push({ text: (image ? "Here's the question." : "Here's the question:\n" + note) + (image && note ? "\nStudent's note: " + note : "") });
    var contents = [{ role: "user", parts: parts }];
    var r = await solveCall(k, contents);
    if (r.ok) r.contents = contents.concat([{ role: "model", parts: [{ text: r.raw }] }]);
    return r;
  };
  Tutor.resolve = async function (contents, message) {
    var k = keyInfo();
    if (!k) return { ok: false, error: "not_configured" };
    var c = contents.concat([{ role: "user", parts: [{ text: message }] }]);
    var r = await solveCall(k, c);
    if (r.ok) r.contents = c.concat([{ role: "model", parts: [{ text: r.raw }] }]);
    return r;
  };
  Tutor.SNAP_SYSTEM = [
    "You are the AI tutor inside \"SAT Math\". The student uploaded an SAT math question; you already solved it and showed the Desmos way and the by-hand way (see the context). Now answer their follow-up messages.",
    "- Keep replies short: 2 to 6 sentences or a short numbered list. Friendly and direct, for a high-school student. No headings.",
    "- Your earlier solution might be wrong. If the student got something different or questions a step, recheck from scratch. If you were wrong, say so plainly and give the corrected answer.",
    "- When the student should type something into Desmos, put it in a fenced code block labeled desmos, one expression per line, in Desmos LaTeX (for example y=3x-5, (2,3), x_{1}=[1,2,3], y_{1}\\sim mx_{1}+b). At most 6 lines. Include the key point (an intersection, vertex or zero) as a point like (5,20) so the graph frames it. The app draws the graph and adds a button that loads it into the calculator. Then say exactly what to click or look at.",
    "- If the student shares an image (their own work, their Desmos graph or another question), look at it closely and refer to it specifically: point out the exact step or expression that's off.",
    "- If asked for a similar question, write a new SAT-style question with different numbers (and four choices if it's multiple choice). Don't give its answer until they try.",
    "- Write math in LaTeX inside \\( ... \\) or \\[ ... \\]. Never use dollar signs for math: a $ means money."
  ].join("\n");
  Tutor.test = function () {
    var k = keyInfo();
    if (!k) return Promise.resolve({ ok: false, error: "not_configured" });
    return call(k, JSON.stringify({ systemInstruction: { parts: [{ text: "You are a helpful assistant." }] }, contents: [{ role: "user", parts: [{ text: "Reply with exactly: Tutor connected." }] }], generationConfig: { maxOutputTokens: 1024 } }));
  };

  // ---------------------------------------------------------------- turning a reply into safe HTML
  function cleanLine(l) {
    var s = String(l).trim().replace(/^[-*•]\s+/, "").replace(/^\d+[.)]\s+/, "");
    s = s.replace(/^\$+|\$+$/g, "").replace(/^\\\(|\\\)$/g, "").replace(/^\\\[|\\\]$/g, "").trim();
    s = s.replace(/<=/g, "\\le ").replace(/>=/g, "\\ge ").replace(/~/g, "\\sim ").replace(/\*/g, "\\cdot ").replace(/\bpi\b/g, "\\pi ");
    s = s.replace(/\bsqrt\(([^()]*)\)/g, "\\sqrt{$1}");
    return s;
  }
  function looksDesmos(l) { return /[=<>]|\\sim|\\le|\\ge|^\(.+\)$/.test(l); }
  function mathy(inner) { return !/^\s|\s$/.test(inner) && !/^\d[\d,.]*$/.test(inner) && /[\\^_=+\-*/()a-zA-Z]/.test(inner); }
  function lines(t) {
    var out = [], para = [], list = null;
    function fp() { if (para.length) { out.push("<p>" + para.join("<br>") + "</p>"); para = []; } }
    function fl() { if (list) { out.push("<" + list.tag + ">" + list.items.map(function (i) { return "<li>" + i + "</li>"; }).join("") + "</" + list.tag + ">"); list = null; } }
    t.split("\n").forEach(function (ln) {
      var s = ln.trim(), mu = s.match(/^[-*•]\s+(.*)$/), mo = s.match(/^\d+[.)]\s+(.*)$/), hd = s.match(/^#{1,6}\s+(.*)$/);
      if (!s) { fp(); fl(); return; }
      if (/^\u0000[DB]\d+\u0000$/.test(s)) { fp(); fl(); out.push(s); return; }
      if (hd) { fp(); fl(); out.push("<p><strong>" + hd[1] + "</strong></p>"); return; }
      if (mu || mo) { fp(); var tag = mo ? "ol" : "ul"; if (!list || list.tag !== tag) { fl(); list = { tag: tag, items: [] }; } list.items.push((mu || mo)[1]); return; }
      fl(); para.push(s);
    });
    fp(); fl();
    return out.join("");
  }
  Tutor.render = function (text) {
    var blocks = [], keep = [], t = String(text || "").replace(/\r/g, "");
    t = t.replace(/```([A-Za-z]*)[ \t]*\n?([\s\S]*?)```/g, function (all, lang, body) {
      var ls = body.split("\n").map(cleanLine).filter(Boolean);
      if (/desmos/i.test(lang) || (!lang && ls.length && ls.every(looksDesmos))) { blocks.push(ls.slice(0, 8)); return "\n\u0000D" + (blocks.length - 1) + "\u0000\n"; }
      keep.push("<pre><code>" + esc(body) + "</code></pre>"); return "\n\u0000B" + (keep.length - 1) + "\u0000\n";
    });
    function hold(s) { keep.push(esc(s)); return "\u0000K" + (keep.length - 1) + "\u0000"; }
    t = t.replace(/\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)/g, hold);
    t = t.replace(/\$\$([\s\S]+?)\$\$/g, function (a, inner) { return hold("\\[" + inner + "\\]"); });
    t = t.replace(/\$([^$\n]+?)\$/g, function (a, inner) { return mathy(inner) ? hold("\\(" + inner + "\\)") : a; });
    t = esc(t).replace(/`([^`\n]+)`/g, "<code>$1</code>").replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, "$1<em>$2</em>");
    var html = lines(t);
    html = html.replace(/\u0000[KB](\d+)\u0000/g, function (a, i) { return keep[+i]; });
    html = html.replace(/\u0000D(\d+)\u0000/g, function (a, i) {
      var b = blocks[+i];
      return '<div class="dzcard"><div class="dzcard-h">For Desmos</div><ol>' + b.map(function (l) { return "<li>\\(" + esc(l) + "\\)</li>"; }).join("") +
             '</ol><button class="btn small" type="button" data-load-block="' + i + '">Load into Desmos</button></div>';
    });
    return { html: html, blocks: blocks };
  };
})(typeof window !== "undefined" ? window : globalThis);
