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
  Tutor.ask = async function (threadId, message, context, image) {
    var k = keyInfo();
    if (!k) return { ok: false, error: "not_configured" };
    var th = Tutor.thread(threadId);
    var contents = th.slice(-12).map(function (x) { return { role: x.role, parts: [{ text: x.text }] }; });
    var parts = [{ text: (context ? context + "\n\n" : "") + "Student: " + message }];
    if (image) parts.push({ inlineData: { mimeType: "image/png", data: image } });
    contents.push({ role: "user", parts: parts });
    var r = await call(k, JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM }] }, contents: contents, generationConfig: { temperature: 0.4 } }));
    if (r.ok) { th.push({ role: "user", text: message + (image ? " [The student shared a screenshot of their graph.]" : "") }); th.push({ role: "model", text: r.reply }); }
    return r;
  };
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
