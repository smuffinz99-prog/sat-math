/* SAT Math: screens and navigation. */
(function () {
  "use strict";
  var S = window.SATM, Store = S.Store, Calc = S.Calc, Tutor = S.Tutor;
  var LETTERS = S.LETTERS, LEVEL = { 1: "Easier", 2: "Medium", 3: "Harder" };
  var app = document.getElementById("app"), view = null;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function h(s) { return S.fig.esc(s); }
  function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }
  var KOPTS = { delimiters: [{ left: "\\[", right: "\\]", display: true }, { left: "\\(", right: "\\)", display: false }], throwOnError: false,
                ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "option"] };
  var pendingMath = [];
  function typeset(el) {
    if (!el) return;
    if (window.renderMathInElement) { try { window.renderMathInElement(el, KOPTS); } catch (e) { } }
    else pendingMath.push(el);
  }
  window.addEventListener("load", function () { var p = pendingMath; pendingMath = []; p.forEach(typeset); });
  function plain(html) {
    var d = document.createElement("div");
    d.innerHTML = html;
    $$("svg", d).forEach(function (s) { s.replaceWith(document.createTextNode("[figure]")); });
    $$("table", d).forEach(function (tb) {
      var rows = Array.prototype.map.call(tb.rows, function (r) { return Array.prototype.map.call(r.cells, function (c) { return c.textContent.trim(); }).join(" | "); });
      tb.replaceWith(document.createTextNode("\n" + rows.join("\n") + "\n"));
    });
    $$("br", d).forEach(function (b) { b.replaceWith(document.createTextNode("\n")); });
    $$("p,li", d).forEach(function (p) { p.appendChild(document.createTextNode("\n")); });
    return d.textContent.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  }
  function toast(msg, action) {
    var t = $("#toast");
    t.innerHTML = "<span>" + msg + "</span>" + (action ? '<button type="button" class="linkbtn" id="toastAct">' + h(action.label) + "</button>" : "");
    t.hidden = false;
    if (action) $("#toastAct").onclick = function () { action.run(); t.hidden = true; };
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { t.hidden = true; }, action ? 6000 : 3200);
  }
  function clock(sec) { sec = Math.max(0, Math.round(sec)); return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0"); }
  var ICON = {
    check: '<svg class="ico" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    x: '<svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    chat: '<svg class="ico" viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z"/></svg>',
    flag: '<svg class="ico" viewBox="0 0 24 24"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>',
    back: '<svg class="ico" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
    next: '<svg class="ico" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>'
  };
  function domOf(skill) { return S.domainById(S.domainOf(skill)); }
  function meter(v, label) { return '<span class="meter" role="img" aria-label="' + h(label || v + "% mastery") + '"><span style="width:' + Math.max(0, Math.min(100, v)) + '%"></span></span>'; }

  // ================================================================ shared question pieces
  function qHead(q, extra) {
    var d = domOf(q.skill);
    return '<div class="qhead"><span class="chip dom d-' + d.id + '">' + h(d.short || d.name) + '</span><span class="chip">' + h(S.skills[q.skill].name) +
           '</span><span class="chip lvl">' + LEVEL[q.level] + "</span>" + (extra || "") + "</div>";
  }
  function preview(entry) {
    var e = String(entry || "").trim();
    if (!e) return '<span class="muted">Answer preview</span>';
    var p = S.parseEntry(e);
    if (!p) return '<span class="bad-t">Not a valid entry yet</span>';
    var neg = e[0] === "-", body = neg ? e.slice(1) : e;
    var tex = p.kind === "frac" ? (neg ? "-" : "") + "\\frac{" + body.split("/")[0] + "}{" + body.split("/")[1] + "}" : e;
    return "Answer preview: \\(" + tex + "\\)";
  }
  function qBody(q, st, locked) {
    var out = '<div class="qstem">' + q.stem + "</div>";
    if (q.type === "mc") {
      out += '<ol class="choices">' + q.choices.map(function (c, i) {
        var cls = ["choice"];
        if (st.sel === i) cls.push("sel");
        if (st.struck[i]) cls.push("struck");
        if (st.checked) { if (i === q.answer) cls.push("right"); else if (st.sel === i) cls.push("wrong"); }
        var off = st.checked || locked;
        return '<li class="' + cls.join(" ") + '"><button type="button" class="pick" data-i="' + i + '"' + (off ? " disabled" : "") + ' aria-pressed="' + (st.sel === i) + '">' +
               '<span class="letter">' + LETTERS[i] + '</span><span class="ctext">' + c.t + "</span>" +
               (st.checked && i === q.answer ? '<span class="tag good-t">' + ICON.check + "Correct</span>" : st.checked && st.sel === i ? '<span class="tag bad-t">Your answer</span>' : "") + "</button>" +
               (off ? "" : '<button type="button" class="strike" data-strike="' + i + '" title="' + (st.struck[i] ? "Undo cross-out" : "Cross out this choice") + '" aria-label="' + (st.struck[i] ? "Undo cross-out of choice " : "Cross out choice ") + LETTERS[i] + '">' + (st.struck[i] ? "Undo" : "<s>" + LETTERS[i] + "</s>") + "</button>") + "</li>";
      }).join("") + "</ol>";
    } else {
      var off2 = st.checked || locked;
      out += '<div class="spr"><label for="sprIn">Your answer</label><div class="spr-row"><input id="sprIn" class="spr-in" inputmode="decimal" autocomplete="off" spellcheck="false" maxlength="6" value="' + h(st.entry || "") + '"' + (off2 ? " disabled" : "") + ">" +
             '<div class="spr-prev" id="sprPrev" aria-live="polite">' + preview(st.entry) + "</div></div>" +
             (off2 ? "" : '<p class="small muted">Type a whole number, a fraction like 3/4 or a decimal like .75. Up to 5 characters (6 with a minus sign). No commas, units or % signs.</p>') + "</div>";
    }
    return out;
  }
  function li(s) { return "<li>" + s + "</li>"; }
  function feedback(q, st) {
    var ok = st.ok, html = '<section class="feedback ' + (ok ? "good" : "bad") + '" id="feedback" tabindex="-1" aria-live="polite">';
    html += '<div class="fb-head"><span class="fb-mark">' + (ok ? ICON.check : ICON.x) + "</span><div><b>" + (ok ? "Correct!" : "Not quite.") + "</b> " +
            (q.type === "mc" ? "The answer is <b>" + LETTERS[q.answer] + "</b>." : "Correct answer" + (S.answerForms(q.answer).length > 1 ? "s" : "") + ": <b>" + h(q.answerText) + "</b>.") + "</div></div>";
    if (!ok && q.type === "mc" && st.sel != null && q.choices[st.sel].why) html += '<p class="fb-why"><b>About choice ' + LETTERS[st.sel] + ":</b> " + q.choices[st.sel].why + "</p>";
    if (!ok && q.type === "spr" && st.entry) html += '<p class="fb-why">You entered <b>' + h(st.entry) + "</b>.</p>";
    if (st.ms) html += '<p class="small muted">Time: ' + clock(st.ms / 1000) + " (the real test allows about 1:35 per question).</p>";
    html += '<div class="seg" role="tablist"><button type="button" role="tab" data-tab="solve" class="on" aria-selected="true">Step by step</button>' + (q.desmos ? '<button type="button" role="tab" data-tab="desmos" aria-selected="false">The Desmos way</button>' : "") + "</div>";
    html += '<div class="tabpane" data-pane="solve"><ol class="steps">' + q.explain.map(li).join("") + "</ol></div>";
    if (q.desmos) html += '<div class="tabpane" data-pane="desmos" hidden><ol class="steps">' + q.desmos.steps.map(li).join("") + "</ol>" +
                          (q.desmos.exprs && q.desmos.exprs.length ? '<button type="button" class="btn small" data-act="show">Show me in Desmos</button>' : "") + "</div>";
    return html + "</section>";
  }
  function switchTab(root, name) {
    $$(".seg [data-tab]", root).forEach(function (b) { var on = b.getAttribute("data-tab") === name; b.classList.toggle("on", on); b.setAttribute("aria-selected", String(on)); });
    $$(".tabpane", root).forEach(function (p) { p.hidden = p.getAttribute("data-pane") !== name; });
  }
  function filterEntry(input) {
    var v = input.value.replace(/\u2212/g, "-").replace(/[^0-9./-]/g, "");
    v = v.replace(/(?!^)-/g, "");
    var max = v[0] === "-" ? 6 : 5;
    if (v.length > max) v = v.slice(0, max);
    if (v !== input.value) input.value = v;
    return v;
  }
  function qContext(q, st) {
    var sk = S.skills[q.skill], d = domOf(q.skill), out = ["[Context: the SAT Math question the student is working on]",
      "Skill: " + sk.name + " (" + d.name + "). Difficulty: " + LEVEL[q.level].toLowerCase() + ".",
      "Question type: " + (q.type === "mc" ? "multiple choice" : "student-produced response (the student types the answer)"),
      "Question:", plain(q.stem)];
    if (q.alt) out.push("Figure description: " + q.alt);
    if (q.type === "mc") {
      out.push("Choices:");
      q.choices.forEach(function (c, i) { out.push(LETTERS[i] + ") " + plain(c.t)); });
      out.push("Answer key: " + LETTERS[q.answer] + ") " + plain(q.choices[q.answer].t));
    } else out.push("Answer key: " + q.answerText);
    out.push("Official solution:");
    q.explain.forEach(function (e, i) { out.push((i + 1) + ". " + plain(e)); });
    if (q.desmos) {
      out.push("Desmos method:");
      q.desmos.steps.forEach(function (s, i) { out.push((i + 1) + ". " + plain(s)); });
      if (q.desmos.exprs && q.desmos.exprs.length) out.push("Desmos expressions for that method: " + q.desmos.exprs.map(Calc.clean).join(" ; "));
    }
    if (!st.checked) {
      var cur = q.type === "mc" ? (st.sel != null ? "choice " + LETTERS[st.sel] : "nothing yet") : (st.entry ? "\"" + st.entry + "\"" : "nothing yet");
      out.push("Student status: has NOT submitted an answer yet (currently selected: " + cur + "). Don't give away the answer unless they ask for it.");
    } else {
      var ans = q.type === "mc" ? "choice " + LETTERS[st.sel] + ") " + plain(q.choices[st.sel].t) : "\"" + st.entry + "\"";
      out.push("Student status: submitted " + ans + ", which is " + (st.ok ? "correct." : "incorrect.") +
               (!st.ok && q.type === "mc" && q.choices[st.sel].why ? " That choice usually comes from this mistake: " + plain(q.choices[st.sel].why) : ""));
    }
    var ex = Calc.expressions();
    out.push("Student's Desmos expressions right now: " + (ex.length ? ex.map(function (e, i) { return (i + 1) + ") " + e; }).join("   ") : "(the calculator is empty)"));
    return out.join("\n");
  }

  // ================================================================ layout pieces
  function workLayout(o) {
    return '<div class="work" id="work" data-pane="q"><section class="qside"><div class="sbar">' + o.bar + '</div><div class="qscroll" id="qscroll"></div>' + (o.tutor ? tutorShell() : "") + "</section>" +
           '<section class="cside" aria-label="Desmos graphing calculator"><div class="calc-host" id="calcHost"></div></section>' +
           '<nav class="ptabs" aria-label="Panels"><button type="button" data-pane="q" class="on">' + (o.qLabel || "Question") + '</button><button type="button" data-pane="calc">Desmos</button>' +
           (o.tutor ? '<button type="button" data-pane="tutor">Tutor</button>' : "") + "</nav></div>";
  }
  function bindPanes() {
    var work = $("#work");
    $$(".ptabs [data-pane]", work).forEach(function (b) {
      b.onclick = function () {
        var p = b.getAttribute("data-pane");
        work.setAttribute("data-pane", p);
        $$(".ptabs button", work).forEach(function (x) { x.classList.toggle("on", x === b); });
        if (p === "calc" && Calc.calc && Calc.calc.resize) setTimeout(function () { Calc.calc.resize(); }, 30);
        if (p === "tutor") { var t = $("#tutor"); if (t) t.setAttribute("data-open", "true"); }
      };
    });
  }
  function showPane(p) { var b = $('.ptabs [data-pane="' + p + '"]'); if (b && getComputedStyle($(".ptabs")).display !== "none") b.click(); }
  function tutorShell() {
    return '<div class="tutor" id="tutor" data-open="false"><button type="button" class="tutor-head" id="tutorToggle" aria-expanded="false">' + ICON.chat +
           '<b>AI Tutor</b><span class="muted small tutor-sub">Hints, explanations and Desmos help</span><span class="chev" aria-hidden="true"></span></button><div class="tutor-body" id="tutorBody"></div></div>';
  }

  // The "paste your Gemini key" form, shared by the tutor panel and the screenshot tutor.
  function keySetup(box, onSaved) {
    box.innerHTML = '<p><b>Turn on the AI tutor</b> with your own free Gemini API key.</p><ol><li>Open <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">Google AI Studio</a> and create an API key.</li>' +
      "<li>Paste it here. It stays in this browser and is only sent to Google.</li></ol>" +
      '<form class="keyform"><input type="password" placeholder="Paste your Gemini API key" autocomplete="off" aria-label="Gemini API key"><button class="btn primary small" type="submit">Save</button></form>';
    $("form", box).onsubmit = function (e) {
      e.preventDefault();
      var v = $("input", box).value.trim();
      if (!v) return;
      Store.setSettings({ gemini: Object.assign({}, Store.settings().gemini || {}, { key: v }) });
      toast("Key saved. The tutor is on.");
      onSaved();
    };
  }

  // The tutor panel. o: {thread(), context(), quick(), onLoaded()}
  function TutorPanel(o) {
    var root = $("#tutor"), body = $("#tutorBody"), busy = false, pending = null, errorMsg = null;
    $("#tutorToggle").onclick = function () { var open = root.getAttribute("data-open") !== "true"; root.setAttribute("data-open", String(open)); this.setAttribute("aria-expanded", String(open)); if (open) render(); };
    function msgHTML(m, i) {
      if (m.role === "user") return '<div class="tmsg me">' + h(m.text.replace(/ \[The student shared a screenshot of their graph\.\]$/, "")) + (/screenshot/.test(m.text) ? ' <span class="small muted">(with your graph)</span>' : "") + "</div>";
      return '<div class="tmsg ai" data-msg="' + i + '">' + Tutor.render(m.text).html + "</div>";
    }
    function render() {
      var k = Tutor.keyInfo();
      if (!k) { body.innerHTML = '<div class="tsetup" id="keyBox"></div>'; keySetup($("#keyBox"), render); return; }
      var th = Tutor.thread(o.thread());
      body.innerHTML = '<div class="tmsgs" id="tmsgs">' + (th.length ? th.map(msgHTML).join("") : '<p class="tempty">Ask for a hint, a full explanation, or the Desmos way to solve it. The tutor can see the question and what you\'ve typed in Desmos.</p>') +
        (pending ? '<div class="tmsg me">' + h(pending) + '</div><div class="tmsg ai thinking"><span></span><span></span><span></span></div>' : "") +
        (errorMsg ? '<div class="tmsg err">' + h(errorMsg) + "</div>" : "") + "</div>" +
        '<div class="tquick">' + o.quick().map(function (q) { return '<button type="button" class="chipbtn" data-quick="' + q.key + '"' + (busy ? " disabled" : "") + ">" + q.label + "</button>"; }).join("") + "</div>" +
        '<form class="tform" id="tform"><textarea id="tin" rows="1" placeholder="Ask about this question…" aria-label="Message the tutor"' + (busy ? " disabled" : "") + '></textarea><button class="btn primary small" type="submit"' + (busy ? " disabled" : "") + ">Send</button></form>" +
        '<p class="tnote small muted">' + (k.source === "sat" ? "Using your Gemini key from SAT Reading &amp; Writing. " : "") + 'Gemini can make mistakes; the step-by-step solution is always right. <a href="#/settings">Tutor settings</a></p>';
      var box = $("#tmsgs");
      typeset(box);
      box.scrollTop = box.scrollHeight;
      $$("[data-quick]", body).forEach(function (b) { b.onclick = function () { quick(b.getAttribute("data-quick")); }; });
      $$("[data-load-block]", body).forEach(function (b) {
        b.onclick = function () {
          var msg = b.closest("[data-msg]"), m = Tutor.thread(o.thread())[+msg.getAttribute("data-msg")];
          loadLines(Tutor.render(m.text).blocks[+b.getAttribute("data-load-block")]);
        };
      });
      var tin = $("#tin");
      tin.oninput = function () { tin.style.height = "auto"; tin.style.height = Math.min(tin.scrollHeight, 120) + "px"; };
      tin.onkeydown = function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(tin.value); } };
      $("#tform").onsubmit = function (e) { e.preventDefault(); send(tin.value); };
    }
    function loadLines(lines) {
      Calc.show({ exprs: lines }).then(function () {
        showPane("calc");
        toast("Loaded into Desmos.", { label: "Undo", run: function () { Calc.undo(); } });
      }).catch(function (e) { toast(h(e.message)); });
    }
    async function send(text, opts) {
      opts = opts || {};
      text = String(text || "").trim();
      if (busy || !text) return;
      busy = true; pending = text; errorMsg = null;
      open();
      render();
      var image = null;
      if (opts.image) image = await Calc.screenshot();
      var r = await Tutor.ask(o.thread(), text, o.context(), image);
      busy = false; pending = null;
      if (!r.ok) { errorMsg = r.error === "not_configured" ? null : r.detail; render(); return; }
      render();
      if (opts.autoLoad) { var b = Tutor.render(r.reply).blocks; if (b.length) loadLines(b[0]); }
    }
    function quick(key) {
      var q = o.quick().filter(function (x) { return x.key === key; })[0];
      if (q) send(q.prompt, { image: q.image, autoLoad: q.autoLoad });
    }
    function open() { root.setAttribute("data-open", "true"); $("#tutorToggle").setAttribute("aria-expanded", "true"); }
    render();
    return { render: render, open: open, send: send, ask: quick };
  }

  // ================================================================ home
  function skillList(d) {
    return '<ul class="skills">' + d.skills.map(function (s) {
      var v = Store.mastery(s), sk = Store.skill(s);
      return '<li><a class="skill" href="#/practice/skill/' + s + '"><span class="skill-name">' + h(S.skills[s].name) + '</span><span class="skill-sub">' + h(S.skills[s].blurb) + "</span>" +
             '<span class="skill-meta">' + meter(v) + '<span class="small muted">' + Store.masteryLabel(v, sk.n) + (sk.n ? " · " + sk.c + "/" + sk.n : "") + "</span></span></a></li>";
    }).join("") + "</ul>";
  }
  function domainsHTML() {
    return S.domains.map(function (d) {
      return '<section class="domain d-' + d.id + '"><div class="domain-h"><span class="dot"></span><h2>' + h(d.name) + '</h2><span class="muted small">' + Math.round(d.weight * 100) + "% of the test</span></div>" +
             '<p class="muted">' + h(d.blurb) + "</p>" + skillList(d) + "</section>";
    }).join("");
  }
  function home() {
    var t = Store.totals(), weak = Store.weakest(), ls = Store.nextLesson(), mist = Store.data().mistakes.length, md = Store.data().module;
    app.innerHTML =
      '<section class="hero"><p class="eyebrow">Digital SAT · Math</p><h1>Practice SAT Math with Desmos open, like on test day.</h1>' +
      '<p class="lead">Every question comes with a step-by-step solution and the fastest Desmos method. The AI tutor can see the question and your graph.</p>' +
      '<div class="row"><a class="btn primary big" href="#/practice/mix">Start a 10-question set</a><a class="btn big" href="#/tutor">Solve a screenshot</a></div>' +
      (t.n ? '<div class="stats"><div class="stat"><b>' + t.n + '</b><span>questions</span></div><div class="stat"><b>' + t.acc + '%</b><span>correct</span></div><div class="stat"><b>' + Store.streak() + "</b><span>day streak</span></div></div>" : "") +
      "</section>" +
      '<section class="tiles">' +
      '<a class="tile hot" href="#/tutor"><span class="t">Stuck on a question? Send a screenshot</span><span class="s">The AI tutor solves it, checks the answer in Desmos and shows you the Desmos way step by step</span></a>' +
      (md ? '<a class="tile hot" href="#/test/run"><span class="t">Finish your timed module</span><span class="s">' + md.answers.filter(function (a) { return a != null; }).length + " of " + md.ids.length + " answered</span></a>" : "") +
      '<a class="tile" href="#/practice/skill/' + weak + '"><span class="t">Focus: ' + h(S.skills[weak].name) + '</span><span class="s">' + (Store.skill(weak).n ? "Your weakest skill right now" : "A good place to start") + "</span></a>" +
      '<a class="tile" href="#/playbook/' + ls.id + '"><span class="t">Desmos move: ' + h(ls.title) + '</span><span class="s">' + h(ls.tag) + " · a 3-minute lesson</span></a>" +
      '<a class="tile" href="#/test"><span class="t">Timed module</span><span class="s">22 questions in 35 minutes, like the real test</span></a>' +
      (mist ? '<a class="tile" href="#/practice/review"><span class="t">Review mistakes</span><span class="s">' + mist + " question" + (mist === 1 ? "" : "s") + " to redo</span></a>" : "") +
      "</section>" +
      '<h2 class="section-h">Practice by skill</h2><div class="domains">' + domainsHTML() + "</div>" +
      '<p class="foot muted small">Also studying Reading and Writing? <a href="../sat-academy/">Open SAT Reading &amp; Writing</a>.</p>';
  }
  function practiceIndex() {
    var mist = Store.data().mistakes.length;
    app.innerHTML = '<h1 class="page-h">Practice</h1><section class="tiles">' +
      '<a class="tile" href="#/practice/mix"><span class="t">Mixed set · 10 questions</span><span class="s">All four areas, weighted like the test, with more of your weaker skills</span></a>' +
      '<a class="tile" href="#/practice/mix/20"><span class="t">Mixed set · 20 questions</span><span class="s">A longer session</span></a>' +
      '<a class="tile" href="#/practice/review"><span class="t">Review mistakes</span><span class="s">' + (mist ? mist + " to redo" : "Nothing to review yet") + "</span></a>" +
      '<a class="tile" href="#/test"><span class="t">Timed module</span><span class="s">22 questions · 35 minutes</span></a></section>' +
      '<h2 class="section-h">By skill</h2><div class="domains">' + domainsHTML() + "</div>";
  }

  // ================================================================ practice sessions
  function session(kind, arg) {
    var title, total = null, queue = null, lesson = null;
    if (kind === "skill") { if (!S.skills[arg]) { go("#/practice"); return null; } title = S.skills[arg].name; }
    else if (kind === "mix") { total = arg === "20" ? 20 : 10; title = "Mixed practice"; }
    else if (kind === "review") {
      queue = Store.data().mistakes.map(function (x) { return x.id; }).filter(function (id) { try { S.fromId(id); return true; } catch (e) { return false; } });
      total = queue.length; title = "Review mistakes";
      if (!total) { app.innerHTML = '<h1 class="page-h">Review mistakes</h1><div class="empty"><p>No mistakes to review. Questions you miss show up here so you can redo them.</p><a class="btn primary" href="#/practice/mix">Start a mixed set</a></div>'; return null; }
    } else if (kind === "move") { lesson = S.lesson(arg); if (!lesson) { go("#/playbook"); return null; } title = "Practice: " + lesson.title; total = 5; }
    else if (kind === "q") {                              // one exact question (a shareable link), then more of the same skill
      try { queue = [S.fromId(decodeURIComponent(arg || "")).id]; } catch (e) { go("#/practice"); return null; }
      title = S.skills[S.fromId(queue[0]).skill].name;
    }
    else { go("#/practice"); return null; }

    document.body.classList.add("wide");
    var ses = { n: 0, right: 0, results: [], recent: [], q: null, st: null, last: null, done: false };
    app.innerHTML = workLayout({ tutor: true, bar: '<a class="sb-back" href="' + (kind === "move" ? "#/playbook/" + arg : "#/") + '" aria-label="Leave">' + ICON.back + '</a><b class="sb-title">' + h(title) +
                                                     '</b><span class="spacer"></span><span class="sb-meta" id="sbMeta"></span><span class="sb-time" id="sbTime" title="Time on this question"></span>' });
    Calc.mount($("#calcHost"));
    bindPanes();
    var scroll = $("#qscroll");
    var tutor = TutorPanel({
      thread: function () { return ses.q ? ses.q.id : "none"; },
      context: function () { return ses.q ? qContext(ses.q, ses.st) : ""; },
      quick: function () {
        var list = [{ key: "hint", label: "Give me a hint", prompt: "Give me one hint for the next step. Don't tell me the answer." },
                    { key: "explain", label: "Explain it", prompt: "Walk me through how to solve this, step by step." },
                    { key: "desmos", label: "Desmos way", prompt: "Show me how to solve this with Desmos, step by step.", autoLoad: true },
                    { key: "graph", label: "Check my graph", prompt: "Look at my Desmos graph. Am I on the right track? What should I do next?", image: true }];
        if (ses.st && ses.st.checked && !ses.st.ok) list.unshift({ key: "why", label: "Why was I wrong?", prompt: "Why is my answer wrong, and what mistake did I probably make?" });
        return list;
      }
    });
    function nextQuestion(sameTpl) {
      var q;
      try {
        if (sameTpl) q = S.make(ses.q.tpl, ses.q.level, S.newSeed());
        else if (kind === "skill") q = Store.questionFor(arg, ses.recent.slice(-2));
        else if (kind === "mix") { var sk = Store.pickSkill(ses.last); q = Store.questionFor(sk, ses.recent.slice(-3)); }
        else if (kind === "review") q = S.fromId(queue[ses.n]);
        else if (kind === "q") q = ses.n === 0 && !ses.q ? S.fromId(queue[0]) : Store.questionFor(S.fromId(queue[0]).skill, ses.recent.slice(-2));
        else q = Store.questionFromTemplates(lesson.practice, ses.recent.slice(-2));
      } catch (e) { console.error(e); q = Store.questionFor("alg.lin1", []); }
      ses.q = q; ses.last = q.skill; ses.recent.push(q.tpl);
      ses.st = { sel: null, entry: "", struck: {}, checked: false, ok: null, t0: Date.now(), hint: false };
      Calc.load().then(function () { Calc.setState(null); }).catch(function () { });
      render();
      tutor.render();
      scroll.scrollTop = 0;
      showPane("q");
    }
    function finished() { return total && ses.n >= total; }
    function meta() {
      $("#sbMeta").textContent = (total ? "Question " + Math.min(ses.n + (ses.st && ses.st.checked ? 0 : 1), total) + " of " + total : "Question " + (ses.n + (ses.st && ses.st.checked ? 0 : 1))) + " · " + ses.right + " correct";
    }
    function render() {
      var q = ses.q, st = ses.st;
      if (ses.done) {
        scroll.innerHTML = '<div class="summary"><h2>Set complete</h2><p class="bignum">' + ses.right + " of " + ses.n + ' correct</p><ol class="reslist">' + ses.results.map(function (r) {
          return '<li class="' + (r.ok ? "good" : "bad") + '"><span class="rmark">' + (r.ok ? ICON.check : ICON.x) + "</span>" + h(S.skills[r.skill].name) + "</li>";
        }).join("") + '</ol><div class="row">' + (kind === "move" ? '<a class="btn primary" href="#/practice/move/' + arg + '">Practice again</a><a class="btn" href="#/playbook">More Desmos moves</a>' :
          kind === "review" ? '<a class="btn primary" href="#/practice/review">Keep reviewing</a><a class="btn" href="#/">Home</a>' : '<a class="btn primary" href="#/practice/mix' + (total === 20 ? "/20" : "") + '">Another set</a><a class="btn" href="#/progress">See progress</a>') + "</div></div>";
        $("#sbTime").textContent = "";
        meta();
        return;
      }
      var actions;
      if (st.checked) actions = '<div class="qactions"><button type="button" class="btn primary" data-act="next">' + (finished() ? "See results" : "Next question") + ICON.next + "</button>" +
                                '<button type="button" class="btn" data-act="another">Another like this</button>' + (!st.ok ? '<button type="button" class="btn" data-act="askwhy">' + ICON.chat + "Ask the tutor why</button>" : "") + "</div>";
      else {
        var can = q.type === "mc" ? st.sel != null : !!S.parseEntry(st.entry);
        actions = '<div class="qactions"><button type="button" class="btn primary" data-act="check"' + (can ? "" : " disabled") + '>Check answer</button><button type="button" class="btn" data-act="hint">Hint</button>' +
                  '<button type="button" class="linkbtn" data-act="skip">Skip</button></div>' +
                  (st.hint ? '<div class="hintbox"><b>Hint:</b> ' + (q.desmos ? q.desmos.steps[0] : q.explain[0]) + ' <button type="button" class="linkbtn" data-act="morehint">Ask the tutor for more</button></div>' : "");
      }
      scroll.innerHTML = '<article class="qcard" data-qid="' + h(q.id) + '">' + qHead(q) + qBody(q, st, false) + "</article>" + actions + (st.checked ? feedback(q, st) : "");
      typeset(scroll);
      meta();
      if (st.checked) { var fb = $("#feedback"); if (fb) fb.focus({ preventScroll: false }); }
    }
    function check() {
      var q = ses.q, st = ses.st, ok;
      if (st.checked) return;
      if (q.type === "mc") { if (st.sel == null) return; ok = st.sel === q.answer; }
      else { var r = S.checkEntry(st.entry, q.answer, q.alts); if (r.invalid) { toast("Enter a number like 3/4, .75 or -2."); return; } ok = r.ok; }
      st.checked = true; st.ok = ok; st.ms = Date.now() - st.t0;
      Store.record(q, ok, st.ms, kind === "review" ? "review" : "practice");
      ses.n++; if (ok) ses.right++;
      ses.results.push({ id: q.id, ok: ok, skill: q.skill });
      render();
      tutor.render();
    }
    scroll.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b || b.disabled) return;
      var st = ses.st;
      if (b.hasAttribute("data-i")) { var i = +b.getAttribute("data-i"); st.sel = st.sel === i ? null : i; if (st.struck[i]) delete st.struck[i]; render(); }
      else if (b.hasAttribute("data-strike")) { var k = +b.getAttribute("data-strike"); if (st.struck[k]) delete st.struck[k]; else { st.struck[k] = true; if (st.sel === k) st.sel = null; } render(); }
      else if (b.hasAttribute("data-tab")) switchTab(scroll, b.getAttribute("data-tab"));
      else {
        var a = b.getAttribute("data-act");
        if (a === "check") check();
        else if (a === "hint") { st.hint = true; render(); }
        else if (a === "morehint") tutor.ask("hint");
        else if (a === "askwhy") { tutor.ask("why"); showPane("tutor"); }
        else if (a === "skip") nextQuestion(false);
        else if (a === "next") { if (finished()) { ses.done = true; render(); } else nextQuestion(false); }
        else if (a === "another") { if (finished()) total++; nextQuestion(true); }
        else if (a === "show") Calc.show(ses.q.desmos).then(function () { showPane("calc"); toast("Loaded the Desmos method.", { label: "Undo", run: function () { Calc.undo(); } }); }).catch(function (er) { toast(h(er.message)); });
      }
    });
    scroll.addEventListener("input", function (e) {
      if (e.target.id !== "sprIn") return;
      ses.st.entry = filterEntry(e.target);
      var p = $("#sprPrev"); p.innerHTML = preview(ses.st.entry); typeset(p);
      var c = $('[data-act="check"]', scroll); if (c) c.disabled = !S.parseEntry(ses.st.entry);
    });
    scroll.addEventListener("keydown", function (e) { if (e.target.id === "sprIn" && e.key === "Enter") { e.preventDefault(); check(); } });
    function keys(e) {
      if (e.target.closest("input, textarea, select") || e.ctrlKey || e.metaKey || e.altKey || ses.done || !ses.q) return;
      if (e.target.closest("#calcWrap")) return;
      var st = ses.st, k = e.key.toLowerCase();
      if (!st.checked && ses.q.type === "mc" && "abcd".indexOf(k) >= 0 && k.length === 1) { st.sel = "abcd".indexOf(k); render(); }
      else if (e.key === "Enter" && !e.target.closest("button, a")) { if (!st.checked) check(); else if (finished()) { ses.done = true; render(); } else nextQuestion(false); }
    }
    document.addEventListener("keydown", keys);
    var timer = setInterval(function () { if (ses.st && !ses.st.checked && !ses.done) $("#sbTime").textContent = clock((Date.now() - ses.st.t0) / 1000); }, 1000);
    nextQuestion(false);
    return { destroy: function () { clearInterval(timer); document.removeEventListener("keydown", keys); } };
  }

  // ================================================================ timed module
  function moduleStart() {
    var md = Store.data().module, hist = Store.data().modules;
    app.innerHTML = '<h1 class="page-h">Timed module</h1><div class="panel narrow"><p>This works like one module of the digital SAT Math section:</p><ul class="bullets">' +
      "<li><b>22 questions in 35 minutes</b>, getting harder as you go.</li><li>About 35% Algebra, 35% Advanced Math, and 15% each Problem-Solving and Data Analysis and Geometry and Trigonometry.</li>" +
      "<li>Desmos and the reference sheet are available the whole time. The AI tutor isn't, just like on the real test.</li>" +
      "<li>You can move between questions and mark them for review. You'll see your score and every solution at the end.</li></ul>" +
      '<div class="row">' + (md ? '<a class="btn primary big" href="#/test/run">Continue your module</a><button type="button" class="btn" id="newMod">Start over</button>' : '<button type="button" class="btn primary big" id="newMod">Start the module</button>') + "</div></div>" +
      (hist.length ? '<h2 class="section-h">Past modules</h2><table class="hist"><thead><tr><th>Date</th><th>Score</th><th>Time</th></tr></thead><tbody>' + hist.map(function (x, i) {
        return "<tr><td>" + new Date(x.t).toLocaleDateString() + "</td><td><b>" + x.score + "</b> / " + x.total + "</td><td>" + clock(x.secs) + (i === 0 && Store.data().lastModule ? ' · <a href="#/test/results">Review</a>' : "") + "</td></tr>";
      }).join("") + "</tbody></table>" : "");
    $("#newMod").onclick = function () {
      if (md && !confirm("Start a new module? Your current one will be discarded.")) return;
      Store.newModule(); go("#/test/run");
    };
    return null;
  }
  function moduleRun() {
    var md = Store.data().module;
    if (!md) { go("#/test"); return null; }
    document.body.classList.add("wide");
    var qs = md.ids.map(function (id) { return S.fromId(id); }), calcStates = {}, struck = {}, hideTime = false;
    app.innerHTML = workLayout({ tutor: false, bar: '<b class="sb-title">Timed module</b><span class="spacer"></span><button type="button" class="chipbtn" id="tToggle">Hide timer</button><span class="sb-clock" id="tClock"></span>' +
                                                      '<button type="button" class="chipbtn" id="tMark">' + ICON.flag + "Mark for review</button>" });
    Calc.mount($("#calcHost"));
    bindPanes();
    var scroll = $("#qscroll"), gridOpen = false;
    function left() { return md.limit - (Date.now() - md.started) / 1000; }
    function answered(i) { return md.answers[i] != null && md.answers[i] !== ""; }
    function go2(i) {
      if (Calc.calc) calcStates[md.cur] = Calc.getState();
      md.cur = Math.max(0, Math.min(qs.length - 1, i)); Store.save();
      if (Calc.calc) Calc.setState(calcStates[md.cur] || null);
      gridOpen = false; render(); scroll.scrollTop = 0; showPane("q");
    }
    function render() {
      var i = md.cur, q = qs[i], st = { sel: q.type === "mc" ? md.answers[i] : null, entry: q.type === "spr" ? md.answers[i] || "" : "", struck: struck[i] || (struck[i] = {}), checked: false };
      $("#tMark").classList.toggle("on", !!md.marks[i]);
      var grid = '<div class="qgrid"' + (gridOpen ? "" : " hidden") + '><div class="qgrid-h"><b>Questions</b><span class="small muted"><i class="lg ans"></i>Answered <i class="lg"></i>Unanswered <i class="lg mk"></i>Marked</span></div><div class="qgrid-b">' +
        qs.map(function (x, j) { return '<button type="button" class="qn' + (answered(j) ? " ans" : "") + (md.marks[j] ? " mk" : "") + (j === i ? " cur" : "") + '" data-go="' + j + '">' + (j + 1) + "</button>"; }).join("") +
        '</div><button type="button" class="btn primary" data-act="submit">Submit module</button></div>';
      scroll.innerHTML = '<article class="qcard" data-qid="' + h(q.id) + '">' + qHead(q, '<span class="spacer"></span><b class="qnum">Question ' + (i + 1) + " of " + qs.length + "</b>") + qBody(q, st, false) + "</article>" +
        '<div class="qactions modnav"><button type="button" class="btn" data-act="back"' + (i === 0 ? " disabled" : "") + ">" + ICON.back + 'Back</button><button type="button" class="btn" data-act="grid">Question ' + (i + 1) + " of " + qs.length + " ▾</button>" +
        (i < qs.length - 1 ? '<button type="button" class="btn primary" data-act="next">Next' + ICON.next + "</button>" : '<button type="button" class="btn primary" data-act="grid">Review &amp; submit</button>') + "</div>" + grid;
      typeset(scroll);
    }
    function submit() {
      var un = md.answers.filter(function (a) { return a == null || a === ""; }).length;
      if (un && left() > 0 && !confirm("You have " + un + " unanswered question" + (un === 1 ? "" : "s") + ". Submit anyway?")) return;
      clearInterval(timer);
      Store.finishModule();
      go("#/test/results");
    }
    scroll.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b || b.disabled) return;
      var i = md.cur, q = qs[i];
      if (b.hasAttribute("data-i")) { var c = +b.getAttribute("data-i"); md.answers[i] = md.answers[i] === c ? null : c; delete struck[i][c]; Store.save(); render(); }
      else if (b.hasAttribute("data-strike")) { var k = +b.getAttribute("data-strike"); if (struck[i][k]) delete struck[i][k]; else { struck[i][k] = true; if (md.answers[i] === k) md.answers[i] = null; } Store.save(); render(); }
      else if (b.hasAttribute("data-go")) go2(+b.getAttribute("data-go"));
      else {
        var a = b.getAttribute("data-act");
        if (a === "back") go2(i - 1);
        else if (a === "next") go2(i + 1);
        else if (a === "grid") { gridOpen = !gridOpen; render(); if (gridOpen) $(".qgrid", scroll).scrollIntoView({ block: "nearest" }); }
        else if (a === "submit") submit();
      }
      void q;
    });
    scroll.addEventListener("input", function (e) {
      if (e.target.id !== "sprIn") return;
      var v = filterEntry(e.target);
      md.answers[md.cur] = v || null; Store.save();
      var p = $("#sprPrev"); p.innerHTML = preview(v); typeset(p);
    });
    $("#tMark").onclick = function () { md.marks[md.cur] = !md.marks[md.cur]; Store.save(); render(); };
    $("#tToggle").onclick = function () { hideTime = !hideTime; this.textContent = hideTime ? "Show timer" : "Hide timer"; tick(); };
    function tick() {
      var l = left(), el = $("#tClock");
      if (!el) return;
      el.textContent = hideTime ? "" : clock(l);
      el.classList.toggle("low", l < 300);
      if (l <= 0) { clearInterval(timer); toast("Time's up. Your module was submitted."); Store.finishModule(); go("#/test/results"); }
    }
    var timer = setInterval(tick, 1000);
    tick();
    render();
    Calc.load().then(function () { Calc.setState(calcStates[md.cur] || null); }).catch(function () { });   // start from a blank calculator
    return { destroy: function () { clearInterval(timer); if (Calc.calc) calcStates[md.cur] = Calc.getState(); } };
  }
  function moduleResults() {
    var res = Store.data().lastModule;
    if (!res) { go("#/test"); return null; }
    var qs = res.ids.map(function (id) { return S.fromId(id); });
    app.innerHTML = '<h1 class="page-h">Module results</h1><div class="result-top"><div class="bignum">' + res.score + " <span>/ " + res.ids.length + '</span></div><div class="muted">Time used: ' + clock(res.secs) + " of 35:00</div></div>" +
      '<div class="dombars">' + S.domains.map(function (d) {
        var x = res.byDomain[d.id] || [0, 0];
        return '<div class="dombar d-' + d.id + '"><span class="dot"></span><b>' + h(d.short || d.name) + '</b><span class="spacer"></span>' + x[0] + " / " + x[1] + meter(x[1] ? Math.round(100 * x[0] / x[1]) : 0) + "</div>";
      }).join("") + "</div>" +
      '<h2 class="section-h">Every question</h2><ol class="reslist big">' + qs.map(function (q, i) {
        var a = res.answers[i], your = a == null || a === "" ? "No answer" : q.type === "mc" ? LETTERS[a] : a;
        return '<li class="' + (res.ok[i] ? "good" : "bad") + '"><a href="#/test/review/' + i + '"><span class="rmark">' + (res.ok[i] ? ICON.check : ICON.x) + '</span><span class="rq">' + (i + 1) + ". " + h(S.skills[q.skill].name) +
               '</span><span class="small muted">You: ' + h(your) + " · Answer: " + h(q.type === "mc" ? LETTERS[q.answer] : S.answerForms(q.answer)[0]) + "</span></a></li>";
      }).join("") + '</ol><div class="row"><a class="btn primary" href="#/test">Take another module</a><a class="btn" href="#/practice/review">Review mistakes</a></div>';
    return null;
  }
  function moduleReview(i) {
    var res = Store.data().lastModule;
    if (!res || !(i >= 0 && i < res.ids.length)) { go("#/test/results"); return null; }
    document.body.classList.add("wide");
    var q = S.fromId(res.ids[i]), a = res.answers[i];
    var st = { sel: q.type === "mc" ? a : null, entry: q.type === "spr" ? a || "" : "", struck: {}, checked: true, ok: !!res.ok[i] };
    if (q.type === "mc" && a == null) st.sel = -1;
    app.innerHTML = workLayout({ tutor: true, bar: '<a class="sb-back" href="#/test/results" aria-label="Back to results">' + ICON.back + '</a><b class="sb-title">Review: question ' + (i + 1) + " of " + res.ids.length + "</b>" });
    Calc.mount($("#calcHost"));
    bindPanes();
    Calc.load().then(function () { Calc.setState(null); }).catch(function () { });
    var scroll = $("#qscroll");
    scroll.innerHTML = '<article class="qcard" data-qid="' + h(q.id) + '">' + qHead(q) + qBody(q, st, true) + "</article>" + (a == null || a === "" ? '<p class="fb-why">You didn\'t answer this one.</p>' : "") + feedback(q, Object.assign({}, st, { sel: st.sel < 0 ? null : st.sel })) +
      '<div class="qactions">' + (i > 0 ? '<a class="btn" href="#/test/review/' + (i - 1) + '">' + ICON.back + "Previous</a>" : "") + (i < res.ids.length - 1 ? '<a class="btn primary" href="#/test/review/' + (i + 1) + '">Next' + ICON.next + "</a>" : '<a class="btn primary" href="#/test/results">Back to results</a>') + "</div>";
    typeset(scroll);
    scroll.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.hasAttribute("data-tab")) switchTab(scroll, b.getAttribute("data-tab"));
      else if (b.getAttribute("data-act") === "show") Calc.show(q.desmos).then(function () { showPane("calc"); }).catch(function (er) { toast(h(er.message)); });
    });
    var tstate = { sel: st.sel < 0 ? null : st.sel, entry: st.entry, checked: st.sel !== -1 && !(a == null || a === ""), ok: st.ok };
    if (!tstate.checked) tstate.checked = false;
    TutorPanel({
      thread: function () { return "review:" + q.id; },
      context: function () { return qContext(q, tstate.checked ? tstate : { sel: null, entry: "", checked: false }) + "\nThe student is reviewing this question after a timed module, so you may explain the full solution."; },
      quick: function () {
        return [{ key: "why", label: res.ok[i] ? "Is there a faster way?" : "Why was I wrong?", prompt: res.ok[i] ? "I got this right. Is there a faster way to solve it, maybe with Desmos?" : "Why is my answer wrong, and what mistake did I probably make?" },
                { key: "desmos", label: "Desmos way", prompt: "Show me how to solve this with Desmos, step by step.", autoLoad: true },
                { key: "similar", label: "Give me a similar one", prompt: "Make up one similar practice question (different numbers) for me to try, without the answer." }];
      }
    });
    return null;
  }

  // ================================================================ Desmos Playbook
  function playbookList() {
    var done = Store.data().lessons;
    app.innerHTML = '<h1 class="page-h">Desmos Playbook</h1><p class="lead narrow">On the digital SAT you can use Desmos on every math question. These are the moves that save the most time. Each one takes a few minutes: read it, load the example, then practice it on real questions.</p>' +
      '<div class="lessons">' + S.playbook.map(function (l, i) {
        return '<a class="lesson-card" href="#/playbook/' + l.id + '"><span class="ln">' + (i + 1) + '</span><span class="lt">' + h(l.title) + (done[l.id] ? ' <span class="chip good">' + ICON.check + "Learned</span>" : "") +
               '</span><span class="ls">' + l.when + '</span><span class="chip">' + h(l.tag) + "</span></a>";
      }).join("") + "</div>";
    typeset(app);
    return null;
  }
  function lessonView(id) {
    var L = S.lesson(id);
    if (!L) { go("#/playbook"); return null; }
    document.body.classList.add("wide");
    var idx = S.playbook.indexOf(L), prev = S.playbook[idx - 1], next = S.playbook[idx + 1];
    app.innerHTML = workLayout({ tutor: true, qLabel: "Lesson", bar: '<a class="sb-back" href="#/playbook" aria-label="All Desmos moves">' + ICON.back + '</a><b class="sb-title">Desmos move ' + (idx + 1) + " of " + S.playbook.length + "</b>" });
    Calc.mount($("#calcHost"));
    bindPanes();
    var scroll = $("#qscroll"), learned = !!Store.data().lessons[id];
    function render() {
      scroll.innerHTML = '<article class="lesson"><span class="chip">' + h(L.tag) + "</span><h1>" + h(L.title) + '</h1><p class="lead">' + L.when + "</p>" +
        '<h3>How to do it</h3><ol class="steps">' + L.steps.map(li).join("") + "</ol>" +
        '<div class="example"><div class="label">Try it</div><p>' + L.example.prompt + '</p><button type="button" class="btn primary" data-act="load">Load the example into Desmos</button><p class="look" hidden>' + L.example.look + "</p></div>" +
        '<h3>Good to know</h3><ul class="bullets">' + L.tips.map(li).join("") + "</ul>" +
        '<div class="qactions"><a class="btn primary" href="#/practice/move/' + id + '">Practice this move (5 questions)</a><button type="button" class="btn" data-act="learned">' + (learned ? ICON.check + "Learned" : "Mark as learned") + "</button></div>" +
        '<div class="lesson-nav">' + (prev ? '<a href="#/playbook/' + prev.id + '">' + ICON.back + h(prev.title) + "</a>" : "<span></span>") + (next ? '<a href="#/playbook/' + next.id + '">' + h(next.title) + ICON.next + "</a>" : "") + "</div></article>";
      typeset(scroll);
    }
    scroll.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      var a = b.getAttribute("data-act");
      if (a === "load") Calc.show(L.example).then(function () { var lk = $(".look", scroll); lk.hidden = false; showPane("calc"); }).catch(function (er) { toast(h(er.message)); });
      else if (a === "learned") { learned = !learned; if (learned) Store.data().lessons[id] = 1; else delete Store.data().lessons[id]; Store.save(); render(); }
    });
    render();
    TutorPanel({
      thread: function () { return "lesson:" + id; },
      context: function () {
        return ["[Context: the student is reading the Desmos Playbook lesson \"" + L.title + "\".]", "When to use it: " + plain(L.when), "Steps:"].concat(L.steps.map(function (s, i) { return (i + 1) + ". " + plain(s); }))
          .concat(["Example: " + plain(L.example.prompt) + " Desmos input: " + L.example.exprs.join(" ; ") + ". What to see: " + plain(L.example.look),
                   "Student's Desmos expressions right now: " + (Calc.expressions().join(" ; ") || "(empty)")]).join("\n");
      },
      quick: function () {
        return [{ key: "explain", label: "Explain this move", prompt: "Explain this Desmos move in simple terms. When is it the best choice on the SAT?" },
                { key: "example", label: "New example", prompt: "Give me a new SAT-style example where this move is the fastest way, and show the Desmos input.", autoLoad: true },
                { key: "graph", label: "Check my graph", prompt: "Look at my Desmos graph. Did I do this move right?", image: true }];
      }
    });
    return null;
  }

  // ================================================================ progress
  function progress() {
    var t = Store.totals(), d = Store.data(), days = [], now = new Date();
    for (var i = 27; i >= 0; i--) { var x = new Date(now); x.setDate(now.getDate() - i); var k = x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); days.push([k, d.days[k] || 0, x]); }
    var maxDay = Math.max.apply(null, days.map(function (x) { return x[1]; }).concat([1]));
    app.innerHTML = '<h1 class="page-h">Progress</h1>' +
      '<div class="stats big"><div class="stat"><b>' + t.n + '</b><span>questions answered</span></div><div class="stat"><b>' + t.acc + '%</b><span>correct</span></div><div class="stat"><b>' + Store.streak() + '</b><span>day streak</span></div><div class="stat"><b>' + d.mistakes.length + "</b><span>mistakes to review</span></div></div>" +
      '<h2 class="section-h">Last 4 weeks</h2><div class="days" role="img" aria-label="Questions answered per day for the last 28 days">' + days.map(function (x) {
        return '<span class="day" title="' + x[2].toLocaleDateString() + ": " + x[1] + ' questions"><i style="height:' + Math.round(100 * x[1] / maxDay) + '%"></i></span>';
      }).join("") + "</div>" +
      '<h2 class="section-h">Skills</h2><table class="skilltab"><thead><tr><th>Skill</th><th>Answered</th><th>Correct</th><th>Mastery</th><th></th></tr></thead><tbody>' +
      S.domains.map(function (dm) {
        return '<tr class="dom-row d-' + dm.id + '"><th colspan="5"><span class="dot"></span>' + h(dm.name) + "</th></tr>" + dm.skills.map(function (s) {
          var sk = Store.skill(s), v = Store.mastery(s);
          return "<tr><td>" + h(S.skills[s].name) + "</td><td>" + sk.n + "</td><td>" + (sk.n ? Math.round(100 * sk.c / sk.n) + "%" : "–") + "</td><td>" + meter(v) + ' <span class="small muted">' + Store.masteryLabel(v, sk.n) + '</span></td><td><a href="#/practice/skill/' + s + '">Practice</a></td></tr>';
        }).join("");
      }).join("") + "</tbody></table>" +
      (d.modules.length ? '<h2 class="section-h">Timed modules</h2><table class="hist"><thead><tr><th>Date</th><th>Score</th><th>Time</th></tr></thead><tbody>' + d.modules.map(function (x) {
        return "<tr><td>" + new Date(x.t).toLocaleDateString() + "</td><td><b>" + x.score + "</b> / " + x.total + "</td><td>" + clock(x.secs) + "</td></tr>";
      }).join("") + "</tbody></table>" : "") +
      '<p class="muted small">Progress is saved in this browser only. Use <a href="#/settings">Settings</a> to back it up or move it to another device.</p>';
    return null;
  }

  // ================================================================ settings
  function settingsView() {
    var st = Store.settings(), k = Tutor.keyInfo(), sa = Tutor.satAcademyKey(), own = st.gemini || {};
    var model = own.model || (k && k.model) || Tutor.MODELS[0].id;
    app.innerHTML = '<h1 class="page-h">Settings</h1>' +
      '<section class="panel narrow"><h2>AI tutor</h2>' +
      '<p class="muted">The tutor uses Google\'s Gemini with your own API key. It stays in this browser and is only sent to Google. <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">Get a free key in Google AI Studio</a>.</p>' +
      '<p id="keyStatus">' + (k ? (k.source === "sat" ? "Using your key from SAT Reading &amp; Writing (ending in …" + h(k.key.slice(-4)) + ")." : "Using your saved key (ending in …" + h(k.key.slice(-4)) + ").") : "No key yet. The tutor is off.") + "</p>" +
      '<form id="keyForm2" class="keyform"><input type="password" id="keyIn2" placeholder="' + (own.key ? "Paste a new key to replace it" : "Paste a Gemini API key") + '" autocomplete="off" aria-label="Gemini API key"><button class="btn primary small" type="submit">Save key</button></form>' +
      '<div class="row">' + (own.key ? '<button type="button" class="btn small" id="keyDel">Remove saved key</button>' : "") + '<button type="button" class="btn small" id="keyTest"' + (k ? "" : " disabled") + '>Test the tutor</button><span id="testOut" class="small"></span></div>' +
      (sa ? '<label class="check"><input type="checkbox" id="borrow"' + (st.borrow !== false ? " checked" : "") + "> Use the key saved in SAT Reading &amp; Writing when this app has no key of its own</label>" : "") +
      '<label class="field">Model<select id="modelSel">' + Tutor.MODELS.map(function (m) { return '<option value="' + m.id + '"' + (m.id === model ? " selected" : "") + ">" + h(m.label) + "</option>"; }).join("") + "</select></label></section>" +
      '<section class="panel narrow"><h2>Desmos</h2><p class="muted">The calculator uses Desmos\'s public trial key, which Desmos offers for prototyping and non-commercial use. If you get your own key at <a href="https://www.desmos.com/my-api" target="_blank" rel="noopener">desmos.com/my-api</a>, paste it here.</p>' +
      '<form id="dzForm" class="keyform"><input type="text" id="dzIn" placeholder="Your Desmos API key (optional)" value="' + h(st.desmosKey || "") + '" autocomplete="off" aria-label="Desmos API key"><button class="btn small" type="submit">Save</button></form></section>' +
      '<section class="panel narrow"><h2>Appearance</h2><div class="seg" id="themeSeg">' + [["", "Match my device"], ["light", "Light"], ["dark", "Dark"]].map(function (o) {
        return '<button type="button" data-theme-set="' + o[0] + '" class="' + ((st.theme || "") === o[0] ? "on" : "") + '">' + o[1] + "</button>";
      }).join("") + "</div></section>" +
      '<section class="panel narrow"><h2>Your data</h2><p class="muted">Progress lives in this browser. Back it up to move it to another device or browser.</p><div class="row">' +
      '<button type="button" class="btn small" id="exp">Download a backup</button><label class="btn small file">Restore a backup<input type="file" id="imp" accept="application/json,.json" hidden></label><button type="button" class="btn small danger" id="rst">Reset all progress</button></div></section>';
    $("#keyForm2").onsubmit = function (e) {
      e.preventDefault();
      var v = $("#keyIn2").value.trim();
      if (!v) return;
      Store.setSettings({ gemini: Object.assign({}, own, { key: v }) }); toast("Key saved."); settingsView();
    };
    if ($("#keyDel")) $("#keyDel").onclick = function () { var g = Object.assign({}, own); delete g.key; Store.setSettings({ gemini: g }); toast("Key removed."); settingsView(); };
    $("#keyTest").onclick = function () {
      var out = $("#testOut"); out.textContent = "Testing…";
      Tutor.test().then(function (r) { out.textContent = r.ok ? "Connected (" + r.model + ")." : r.detail || "Not connected."; out.className = "small " + (r.ok ? "good-t" : "bad-t"); });
    };
    if ($("#borrow")) $("#borrow").onchange = function () { Store.setSettings({ borrow: this.checked }); settingsView(); };
    $("#modelSel").onchange = function () { Store.setSettings({ gemini: Object.assign({}, Store.settings().gemini || {}, { model: this.value }) }); toast("Model saved."); };
    $("#dzForm").onsubmit = function (e) {
      e.preventDefault();
      Store.setSettings({ desmosKey: $("#dzIn").value.trim() || undefined });
      toast("Saved. Reload the page to use the new key.", { label: "Reload", run: function () { location.reload(); } });
    };
    $$("[data-theme-set]").forEach(function (b) { b.onclick = function () { setTheme(b.getAttribute("data-theme-set")); settingsView(); }; });
    $("#exp").onclick = function () {
      var blob = new Blob([Store.exportJSON()], { type: "application/json" }), a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "sat-math-backup-" + Store.today() + ".json";
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    };
    $("#imp").onchange = function () {
      var f = this.files && this.files[0];
      if (!f) return;
      f.text().then(function (txt) { Store.importJSON(txt); toast("Backup restored."); }).catch(function (e) { toast(h(e.message || "Couldn't read that file.")); });
    };
    $("#rst").onclick = function () { if (confirm("Reset all progress? This can't be undone. Download a backup first if you might want it.")) { Store.reset(); toast("Progress reset."); } };
    return null;
  }
  function setTheme(t) {
    Store.setSettings({ theme: t || undefined });
    if (t) document.documentElement.setAttribute("data-theme", t); else document.documentElement.removeAttribute("data-theme");
    Calc.theme();
  }
  if (window.matchMedia) { try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () { Calc.theme(); }); } catch (e) { } }

  // ================================================================ reference sheet and calculator bar
  var REF = [
    ["Circle", "A = \\pi r^{2}", "C = 2\\pi r"], ["Rectangle", "A = \\ell w"], ["Triangle", "A = \\frac{1}{2}bh"], ["Pythagorean theorem", "c^{2} = a^{2} + b^{2}"],
    ["Special right triangles", "30°\\text{-}60°\\text{-}90°:\\ x,\\ x\\sqrt{3},\\ 2x", "45°\\text{-}45°\\text{-}90°:\\ s,\\ s,\\ s\\sqrt{2}"],
    ["Rectangular prism", "V = \\ell wh"], ["Cylinder", "V = \\pi r^{2}h"], ["Sphere", "V = \\frac{4}{3}\\pi r^{3}"], ["Cone", "V = \\frac{1}{3}\\pi r^{2}h"], ["Rectangular pyramid", "V = \\frac{1}{3}\\ell wh"]
  ];
  function refHTML() {
    return '<div class="ref">' + REF.map(function (r) { return '<div class="ref-i"><b>' + r[0] + "</b>" + r.slice(1).map(function (f) { return "<span>\\(" + f + "\\)</span>"; }).join("") + "</div>"; }).join("") +
           '</div><p class="small">A circle has 360° of arc, which is \\(2\\pi\\) radians. The angles of a triangle add up to 180°.</p>';
  }
  $("#calcRef").onclick = function () {
    var dlg = $("#refDlg");
    $("#refBody").innerHTML = refHTML(); typeset($("#refBody"));
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
  };
  $("#refClose").onclick = function () { var dlg = $("#refDlg"); if (dlg.close) dlg.close(); else dlg.removeAttribute("open"); };
  $("#calcClear").onclick = function () { Calc.clear(); toast("Calculator cleared.", { label: "Undo", run: function () { Calc.undo(); } }); };

  // ================================================================ router
  function route() {
    if (view && view.destroy) { try { view.destroy(); } catch (e) { } }
    view = null;
    Calc.park();
    document.body.classList.remove("wide");
    var p = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean), top = p[0] || "";
    $$(".mainnav a").forEach(function (a) { a.classList.toggle("active", a.getAttribute("data-nav") === (top || "home")); });
    try {
      if (!top) view = home();
      else if (top === "practice") view = p[1] ? session(p[1], p[2]) : practiceIndex();
      else if (top === "test") view = p[1] === "run" ? moduleRun() : p[1] === "results" ? moduleResults() : p[1] === "review" ? moduleReview(parseInt(p[2], 10)) : moduleStart();
      else if (top === "playbook") view = p[1] ? lessonView(p[1]) : playbookList();
      else if (top === "tutor") view = S.Snap.view();
      else if (top === "progress") view = progress();
      else if (top === "settings") view = settingsView();
      else { go("#/"); return; }
    } catch (e) {
      console.error(e);
      app.innerHTML = '<div class="empty"><p>Something went wrong on this page.</p><p class="small muted">' + h(e.message) + '</p><a class="btn" href="#/">Go home</a></div>';
    }
    if (!document.body.classList.contains("wide")) window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  }
  S.ui = { $: $, $$: $$, h: h, typeset: typeset, toast: toast, go: go, ICON: ICON, bindPanes: bindPanes, showPane: showPane, keySetup: keySetup };
  window.addEventListener("hashchange", route);
  window.SATM.App = { route: route, go: go };
  route();
})();
