/* SAT Math: the screenshot tutor. Upload or paste a screenshot of any SAT math question; the tutor reads it, solves it,
   checks the answer itself in a hidden Desmos calculator, draws the graph, and walks you through the Desmos way step by step
   in the real calculator. Follow-up questions (and images of your own work) go to the same tutor. */
(function () {
  "use strict";
  var S = window.SATM, Calc = S.Calc, Tutor = S.Tutor;
  var LET = "ABCDEFGH", HKEY = "satm.snaps";
  var ST = { items: [], problem: null, busy: false, phase: "", pending: null, mode: "new", draft: "", walk: null };
  var CAM = '<svg class="ico" viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>';
  var PLAY = '<svg class="ico" viewBox="0 0 24 24"><path d="M8 5.5v13l10-6.5z"/></svg>';

  // ---------------------------------------------------------------- history (this browser only)
  function hist() { try { var v = JSON.parse(localStorage.getItem(HKEY) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function saveHist(list) {
    for (var n = Math.min(list.length, 12); n >= 0; n--) { try { localStorage.setItem(HKEY, JSON.stringify(list.slice(0, n))); return; } catch (e) { } }
  }
  function remember(it) {
    var list = hist().filter(function (x) { return x.id !== it.id; });
    list.unshift({ id: it.id, t: Date.now(), thumb: it.thumb || null, note: it.note || "", data: it.data, checks: it.checks || [] });
    saveHist(list);
  }

  // ---------------------------------------------------------------- images: shrink big photos, keep a small thumbnail
  function readImage(file) {
    return new Promise(function (res, rej) {
      if (!file || !/^image\//.test(file.type || "")) return rej(new Error("That isn't an image. Use a screenshot or a photo."));
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        function draw(max, q) {
          var sc = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement("canvas");
          c.width = Math.max(1, Math.round(img.naturalWidth * sc)); c.height = Math.max(1, Math.round(img.naturalHeight * sc));
          var x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
          return c.toDataURL("image/jpeg", q);
        }
        var full = draw(1800, 0.9), thumb = draw(420, 0.72);
        URL.revokeObjectURL(url);
        res({ mime: "image/jpeg", data: full.split(",")[1], url: full, thumb: thumb });
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error("Couldn't open that image. Try a PNG or JPG screenshot.")); };
      img.src = url;
    });
  }

  // ---------------------------------------------------------------- the solution's graph
  function allExprs(d, upto) {
    var out = [];
    d.desmosSteps.forEach(function (s, j) { if (upto == null || j <= upto) out = out.concat(s.add); });
    return out;
  }
  function spec(d, upto) { var all = allExprs(d); return { exprs: allExprs(d, upto), bounds: Calc.fit(all, d.bounds), degree: d.degrees }; }
  function checkState(cks) {
    if (!cks || !cks.length) return "none";
    if (cks.some(function (c) { return c.status === "bad"; })) return "bad";
    return cks.some(function (c) { return c.status === "ok"; }) ? "ok" : "none";
  }
  function fmtNum(v) { return isFinite(v) ? String(Math.round(v * 1e6) / 1e6) : "?"; }

  S.Snap = {
    view: function () {
      var U = S.ui, $ = U.$, $$ = U.$$, h = U.h, app = document.getElementById("app");
      document.body.classList.add("wide");
      app.innerHTML = '<div class="work snapwork" id="work" data-pane="q"><section class="qside">' +
        '<div class="sbar"><b class="sb-title">AI Tutor</b><span class="muted small sb-sub">Screenshot a question, get the Desmos way</span><span class="spacer"></span>' +
        '<button type="button" class="chipbtn" id="snapNew">New question</button></div>' +
        '<div class="qscroll snapscroll" id="snapScroll"></div><div class="snapcomp" id="snapComp"></div></section>' +
        '<section class="cside" aria-label="Desmos graphing calculator"><div class="calc-host" id="calcHost"></div><div class="dzcap" id="dzcap" hidden></div></section>' +
        '<nav class="ptabs" aria-label="Panels"><button type="button" data-pane="q" class="on">Tutor</button><button type="button" data-pane="calc">Desmos</button></nav>' +
        '<div class="dropveil" id="dropveil" hidden><div>' + CAM + "<b>Drop the screenshot to solve it</b></div></div></div>";
      Calc.mount($("#calcHost"));
      U.bindPanes();
      var scroll = $("#snapScroll"), comp = $("#snapComp"), cap = $("#dzcap"), work = $("#work");
      function calcVisible() { return getComputedStyle($(".ptabs")).display === "none"; }
      function fmt(s) { return h(s || "").replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>"); }
      function xchips(add) {
        return add.length ? '<div class="xchips">' + add.map(function (e) { return '<span class="xchip">\\(' + h(Calc.clean(e.latex)) + "\\)" + (e.label ? '<i>' + h(e.label) + "</i>" : "") + "</span>"; }).join("") + "</div>" : "";
      }

      // ------------------------------------------------------------ rendering
      function badge(it) {
        var s = checkState(it.checks);
        if (s === "ok") return '<span class="badge good">' + U.ICON.check + "Checked in Desmos</span>";
        if (s === "bad") return '<span class="badge warn">Desmos couldn\'t confirm this. Double-check it.</span>';
        return '<span class="badge">Not double-checked</span>';
      }
      function solveHTML(it, i) {
        var d = it.data;
        if (!d.readable) return '<article class="solve" data-i="' + i + '"><p><b>I couldn\'t read a math question in that image.</b></p><p>' + fmt(d.problem) + '</p><p class="muted small">Try a sharper screenshot that shows the whole question and all the answer choices, or type the question below.</p></article>';
        var tab = it.tab || (d.best === "by hand" ? "hand" : "desmos");
        var read = '<details class="read"><summary>What I read <span class="muted small">(make sure it matches)</span></summary><div class="readq">' + fmt(d.question) + "</div>" +
          (d.figure ? '<p class="small muted">Figure: ' + fmt(d.figure) + "</p>" : "") +
          (d.choices.length ? '<ol class="readc">' + d.choices.map(function (c, j) { return "<li><b>" + LET[j] + ")</b> " + fmt(c) + "</li>"; }).join("") + "</ol>" : "") + "</details>";
        var steps = '<ol class="dsteps">' + d.desmosSteps.map(function (s, j) {
          var on = ST.walk && ST.walk.it === it && ST.walk.j === j;
          return '<li data-step="' + j + '"' + (on ? ' class="on"' : "") + "><p>" + fmt(s.say) + "</p>" + xchips(s.add) + (s.look ? '<p class="look">' + fmt(s.look) + "</p>" : "") + "</li>";
        }).join("") + "</ol>";
        var fig = it.snap ? '<button type="button" class="snapfig" data-act="walk" title="Open this graph in Desmos"><img src="' + it.snap + '" alt="Graph of the Desmos solution"><span>Open in Desmos</span></button>'
                          : it.snap === null ? "" : '<div class="snapfig wait">Drawing the graph…</div>';
        var cks = (it.checks || []).length ? '<details class="checks"><summary>How the tutor checked it in Desmos</summary><ul>' + it.checks.map(function (c) {
          return '<li class="' + c.status + '">\\(' + h(Calc.clean(c.left)) + "\\) = " + fmtNum(c.lv) + " and \\(" + h(Calc.clean(c.right)) + "\\) = " + fmtNum(c.rv) + " " + (c.status === "ok" ? "✓" : c.status === "bad" ? "✗" : "(couldn't evaluate)") + "</li>";
        }).join("") + "</ul></details>" : "";
        return '<article class="solve" data-i="' + i + '">' + read +
          '<div class="ansbox"><div><span class="label">Answer</span><div class="ans">' + fmt(d.answer) + "</div></div>" + badge(it) + "</div>" +
          (d.skill ? '<p class="small muted skillline">' + h(d.skill) + "</p>" : "") +
          '<p class="bestline"><b>Fastest way: ' + (d.best === "by hand" ? "by hand" : "Desmos") + ".</b> " + fmt(d.bestWhy) + "</p>" +
          '<div class="seg" role="tablist"><button type="button" role="tab" data-tab="desmos" class="' + (tab === "desmos" ? "on" : "") + '">The Desmos way</button><button type="button" role="tab" data-tab="hand" class="' + (tab === "hand" ? "on" : "") + '">By hand</button></div>' +
          '<div class="tabpane" data-pane="desmos"' + (tab === "desmos" ? "" : " hidden") + ">" + steps +
          (d.desmosSteps.length ? '<div class="row"><button type="button" class="btn primary small" data-act="walk">' + PLAY + "Show me in Desmos</button></div>" : "") + fig + "</div>" +
          '<div class="tabpane" data-pane="hand"' + (tab === "hand" ? "" : " hidden") + '><ol class="steps">' + d.handSteps.map(function (s) { return "<li>" + fmt(s) + "</li>"; }).join("") + "</ol></div>" +
          (d.trap ? '<p class="trap"><b>Watch out:</b> ' + fmt(d.trap) + "</p>" : "") + cks +
          (it === ST.problem ? '<div class="tquick">' + [["simple", "Explain it more simply"], ["why", "Why does the Desmos way work?"], ["diff", "I got a different answer"], ["similar", "Give me a similar question"]].map(function (q) {
            return '<button type="button" class="chipbtn" data-quick="' + q[0] + '"' + (ST.busy ? " disabled" : "") + ">" + q[1] + "</button>"; }).join("") + "</div>" : "") + "</article>";
      }
      function itemHTML(it, i) {
        if (it.role === "user") return '<div class="tmsg me snapme">' + (it.img ? '<img class="snapimg" src="' + it.img + '" alt="Your screenshot">' : "") + (it.text ? "<div>" + h(it.text) + "</div>" : "") + "</div>";
        if (it.role === "solve") return solveHTML(it, i);
        if (it.role === "ai") return '<div class="tmsg ai" data-i="' + i + '">' + Tutor.render(it.text).html + "</div>";
        return '<div class="tmsg err">' + h(it.text) + "</div>";
      }
      function emptyHTML() {
        var hs = hist();
        return '<div class="snap-empty"><p class="eyebrow">Your SAT Math tutor</p><h1>Stuck on a question? Send a screenshot.</h1>' +
          '<p class="lead">The tutor reads it, solves it, checks the answer in Desmos, and shows you the fastest way, step by step, right in the calculator.</p>' +
          '<label class="drop" id="drop">' + CAM + '<b>Choose a screenshot or photo</b><span>or drag it here, or paste it with Ctrl+V</span><input type="file" accept="image/*" id="dropFile" hidden></label>' +
          '<p class="small muted">Works with Bluebook screenshots, practice tests and photos of a worksheet. You can also type a question below.</p>' +
          (hs.length ? '<div class="recent"><div class="recent-h"><b>Recent</b><button type="button" class="linkbtn small" data-act="clearhist">Clear</button></div><div class="recent-l">' + hs.map(function (x) {
            return '<button type="button" class="recent-i" data-open="' + x.id + '">' + (x.thumb ? '<img src="' + x.thumb + '" alt="">' : '<span class="noimg">' + CAM + "</span>") +
                   '<span class="rt">' + h(String((x.data && (x.data.skill || x.data.question)) || "Question").replace(/\\\(|\\\)/g, "").slice(0, 70)) + '</span><span class="small muted">' + new Date(x.t).toLocaleDateString() + "</span></button>";
          }).join("") + "</div></div>" : "") + "</div>";
      }
      function render(scrollTo) {
        if (!Tutor.keyInfo()) {
          scroll.innerHTML = '<div class="snap-empty"><h1>Turn on the AI tutor</h1></div><div class="tsetup" id="keyBox"></div>';
          U.keySetup($("#keyBox"), function () { render(); renderComp(); });
          comp.innerHTML = "";
          return;
        }
        var html = ST.items.length ? ST.items.map(itemHTML).join("") : emptyHTML();
        if (ST.busy) html += '<div class="tmsg ai busyrow"><span class="thinking"><span></span><span></span><span></span></span> ' + h(ST.phase) + "</div>";
        scroll.innerHTML = html;
        U.typeset(scroll);
        drawBlockSnaps();
        if (scrollTo === "end") scroll.scrollTop = scroll.scrollHeight;
        else if (scrollTo != null) { var el = $('[data-i="' + scrollTo + '"]', scroll); if (el) scroll.scrollTop = el.offsetTop - 12; }
      }
      function renderComp() {
        if (!Tutor.keyInfo()) { comp.innerHTML = ""; return; }
        var p = ST.pending, has = !!ST.problem;
        comp.innerHTML = (p ? '<div class="snapatt"><img src="' + p.thumb + '" alt="Attached image"><div class="att-m"><b>Image attached</b>' +
            (has ? '<div class="seg mini"><button type="button" data-mode="new" class="' + (ST.mode === "new" ? "on" : "") + '">Solve as a new question</button><button type="button" data-mode="about" class="' + (ST.mode === "about" ? "on" : "") + '">Ask about this question</button></div>' : "") +
            '</div><button type="button" class="iconbtn" data-act="unattach" aria-label="Remove image">&times;</button></div>' : "") +
          '<form class="tform" id="snapForm"><label class="attach" title="Add a screenshot or photo">' + CAM + '<input type="file" accept="image/*" id="snapFile" hidden><span class="sr">Add an image</span></label>' +
          '<textarea id="snapIn" rows="1" placeholder="' + (has ? "Ask a follow-up, or attach your work…" : "Paste a screenshot, or type a question…") + '" aria-label="Message the tutor"' + (ST.busy ? " disabled" : "") + ">" + h(ST.draft) + "</textarea>" +
          '<button class="btn primary small" type="submit"' + (ST.busy ? " disabled" : "") + ">" + (has && !(p && ST.mode === "new") ? "Send" : "Solve") + "</button></form>" +
          '<p class="tnote small muted">' + (Tutor.keyInfo().source === "sat" ? "Using your Gemini key from SAT Reading &amp; Writing. " : "") + 'Gemini can make mistakes. Answers marked ✓ were checked in Desmos. <a href="#/settings">Settings</a></p>';
        var tin = $("#snapIn");
        tin.oninput = function () { ST.draft = tin.value; tin.style.height = "auto"; tin.style.height = Math.min(tin.scrollHeight, 140) + "px"; };
        tin.onkeydown = function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } };
        $("#snapForm").onsubmit = function (e) { e.preventDefault(); submit(); };
        $("#snapFile").onchange = function () { var f = this.files && this.files[0]; this.value = ""; if (f) takeFile(f); };
      }

      // ------------------------------------------------------------ input
      function takeFile(file) {
        if (ST.busy) { U.toast("Wait for the tutor to finish first."); return; }
        readImage(file).then(function (img) {
          if (!ST.problem) { var note = ST.draft.trim(); ST.draft = ""; renderComp(); solve(img, note); }
          else { ST.pending = img; ST.mode = "new"; renderComp(); var t = $("#snapIn"); if (t) t.focus(); }
        }).catch(function (e) { U.toast(h(e.message)); });
      }
      function submit() {
        if (ST.busy) return;
        var text = ST.draft.trim(), img = ST.pending;
        if (!text && !img) { var t = $("#snapIn"); if (t) t.focus(); return; }
        ST.draft = ""; ST.pending = null;
        if (!ST.problem || (img && ST.mode === "new")) solve(img, text);
        else followUp(text || "Here's my work. Where did I go wrong?", img);
        renderComp();
      }
      function onPaste(e) {
        if (!document.body.contains(work)) return;
        var items = (e.clipboardData && e.clipboardData.items) || [];
        for (var i = 0; i < items.length; i++) {
          if (items[i].kind === "file" && /^image\//.test(items[i].type)) { var f = items[i].getAsFile(); if (f) { e.preventDefault(); takeFile(f); return; } }
        }
      }
      var dragDepth = 0;
      function hasFiles(e) { return e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], "Files") >= 0; }
      function onDragEnter(e) { if (!hasFiles(e)) return; e.preventDefault(); dragDepth++; $("#dropveil").hidden = false; }
      function onDragOver(e) { if (hasFiles(e)) e.preventDefault(); }
      function onDragLeave(e) { if (!hasFiles(e)) return; dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) $("#dropveil").hidden = true; }
      function onDrop(e) {
        if (!hasFiles(e)) return;
        e.preventDefault(); dragDepth = 0; $("#dropveil").hidden = true;
        var f = e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) takeFile(f);
      }
      document.addEventListener("paste", onPaste);
      work.addEventListener("dragenter", onDragEnter); work.addEventListener("dragover", onDragOver);
      work.addEventListener("dragleave", onDragLeave); work.addEventListener("drop", onDrop);

      // ------------------------------------------------------------ solving
      function busy(phase) { ST.busy = !!phase; ST.phase = phase || ""; render("end"); renderComp(); }
      async function safeCheck(d) { try { return d.checks.length ? await Calc.check(d.defs, d.checks) : []; } catch (e) { return []; } }
      async function solve(img, note) {
        stopWalk();
        ST.problem = null;
        ST.items.push({ role: "user", text: note, img: img && img.url });
        busy(img ? "Reading your screenshot and solving it…" : "Solving it…");
        var r = await Tutor.solve(img ? { data: img.data, mime: img.mime } : null, note);
        if (!r.ok) { ST.items.push({ role: "err", text: r.error === "not_configured" ? "Add a Gemini key in Settings to use the tutor." : r.detail }); busy(null); return; }
        var d = r.data, cks = [];
        if (d.readable) {
          busy("Checking the answer in Desmos…");
          cks = await safeCheck(d);
          if (checkState(cks) === "bad") {
            busy("Desmos disagreed with that answer. Solving it again…");
            var msg = "I ran your checks in Desmos and they don't agree:\n" + cks.map(function (c, j) {
              return "- check " + (j + 1) + ": " + c.left + " = " + fmtNum(c.lv) + ", but " + c.right + " = " + fmtNum(c.rv) + (c.status === "ok" ? " (fine)" : c.status === "error" ? " (Desmos couldn't evaluate this one)" : " (NOT equal)");
            }).join("\n") + "\nYour answer (or a check) is wrong. Re-read the question carefully, solve it again from scratch, and return the complete corrected JSON.";
            var r2 = await Tutor.resolve(r.contents, msg);
            if (r2.ok && r2.data.readable) { d = r2.data; r = r2; cks = await safeCheck(d); }
          }
          busy("Drawing the graph…");
          try {
            var v = await Calc.validate(allExprs(d));
            if (v.bad.length) { var badL = v.bad.map(function (b) { return b.latex; }); d.desmosSteps.forEach(function (s) { s.add = s.add.filter(function (e) { return badL.indexOf(Calc.clean(e.latex)) < 0; }); }); }
          } catch (e) { }
        }
        var it = { role: "solve", id: Date.now(), data: d, checks: cks, contents: r.contents, thumb: img && img.thumb, note: note };
        ST.items.push(it);
        if (d.readable) { ST.problem = it; Tutor.reset("snap:" + it.id); }
        ST.busy = false; ST.phase = "";
        render(ST.items.length - 1); renderComp();
        if (!d.readable) return;
        remember(it);
        if (calcVisible() && d.desmosSteps.length) startWalk(it, 0, true);
        drawSnap(it);
      }
      function drawSnap(it) {
        if (!allExprs(it.data).length) { it.snap = null; return; }
        Calc.snap(spec(it.data)).then(function (uri) { it.snap = uri || null; }).catch(function () { it.snap = null; }).then(function () {
          var i = ST.items.indexOf(it), el = i >= 0 && $('[data-i="' + i + '"] .snapfig', scroll);
          if (!el) return;
          if (it.snap) { el.outerHTML = '<button type="button" class="snapfig" data-act="walk" title="Open this graph in Desmos"><img src="' + it.snap + '" alt="Graph of the Desmos solution"><span>Open in Desmos</span></button>'; }
          else el.remove();
        });
      }
      function context() {
        var it = ST.problem, d = it.data, out = ["[Context: the SAT question the student uploaded and your solution]", "Question: " + d.question];
        if (d.figure) out.push("Figure: " + d.figure);
        if (d.choices.length) out.push("Choices: " + d.choices.map(function (c, i) { return LET[i] + ") " + c; }).join("   "));
        var cs = checkState(it.checks);
        out.push("Your answer: " + d.answer + " (Desmos check: " + (cs === "ok" ? "passed" : cs === "bad" ? "FAILED, so this answer may be wrong" : "not checked") + ")");
        out.push("Desmos way you showed:");
        d.desmosSteps.forEach(function (s, i) { out.push((i + 1) + ". " + s.say + (s.add.length ? " Type: " + s.add.map(function (e) { return e.latex; }).join(" ; ") : "") + (s.look ? " Then: " + s.look : "")); });
        out.push("By hand:");
        d.handSteps.forEach(function (s, i) { out.push((i + 1) + ". " + s); });
        if (d.trap) out.push("Common trap: " + d.trap);
        var ex = Calc.expressions();
        out.push("Student's Desmos expressions right now: " + (ex.length ? ex.join(" ; ") : "(the calculator is empty)"));
        return out.join("\n");
      }
      async function followUp(text, img) {
        var it = ST.problem;
        ST.items.push({ role: "user", text: text, img: img && img.url });
        busy("Thinking…");
        var r = await Tutor.ask("snap:" + it.id, text, context(), img ? { data: img.data, mime: img.mime } : null, { system: Tutor.SNAP_SYSTEM, imageNote: "[The student shared an image.]" });
        ST.items.push(r.ok ? { role: "ai", text: r.reply } : { role: "err", text: r.detail || "Something went wrong. Try again." });
        busy(null);
        render("end");
      }
      // Graphs for the Desmos blocks in follow-up replies
      function drawBlockSnaps() {
        $$(".tmsg.ai[data-i]", scroll).forEach(function (el) {
          var it = ST.items[+el.getAttribute("data-i")];
          if (!it) return;
          var blocks = Tutor.render(it.text).blocks;
          it.snaps = it.snaps || {};
          $$(".dzcard", el).forEach(function (card, b) {
            var lines = blocks[b];
            if (!lines) return;
            if (typeof it.snaps[b] === "string") { card.insertAdjacentHTML("beforeend", '<button type="button" class="dzsnap" data-load-block="' + b + '" title="Open in Desmos"><img src="' + it.snaps[b] + '" alt="Graph"></button>'); return; }
            if (it.snaps[b] !== undefined) return;
            it.snaps[b] = "pending";
            Calc.snap({ exprs: lines, bounds: Calc.fit(lines) }).then(function (u) { it.snaps[b] = u || null; if (u && !ST.busy) render(); }).catch(function () { it.snaps[b] = null; });
          });
        });
      }

      // ------------------------------------------------------------ the walkthrough in the real calculator
      function startWalk(it, j, quiet) {
        ST.walk = { it: it, j: j };
        if (!quiet) U.showPane("calc");
        showStep();
      }
      function showStep() {
        var w = ST.walk;
        if (!w) return;
        var d = w.it.data, n = d.desmosSteps.length, s = d.desmosSteps[w.j];
        Calc.show(spec(d, w.j), w.j > 0).then(function () {
          cap.hidden = false;
          cap.innerHTML = '<div class="cap-h"><b>Step ' + (w.j + 1) + " of " + n + '</b><span class="spacer"></span><button type="button" class="iconbtn" data-cap="close" aria-label="Close the walkthrough">&times;</button></div>' +
            "<p>" + fmt(s.say) + "</p>" + (s.look ? '<p class="look">' + fmt(s.look) + "</p>" : "") +
            '<div class="row"><button type="button" class="btn small" data-cap="back"' + (w.j ? "" : " disabled") + ">" + U.ICON.back + "Back</button>" +
            (w.j < n - 1 ? '<button type="button" class="btn primary small" data-cap="next">Next step' + U.ICON.next + "</button>" : '<button type="button" class="btn primary small" data-cap="close">Done</button>') + "</div>";
          U.typeset(cap);
          $$(".dsteps li", scroll).forEach(function (li) { li.classList.remove("on"); });
          var i = ST.items.indexOf(w.it), li = $('[data-i="' + i + '"] [data-step="' + w.j + '"]', scroll);
          if (li) li.classList.add("on");
        }).catch(function (e) { U.toast(h(e.message)); });
      }
      function stopWalk() { ST.walk = null; cap.hidden = true; $$(".dsteps li.on", scroll).forEach(function (li) { li.classList.remove("on"); }); }
      cap.addEventListener("click", function (e) {
        var b = e.target.closest("[data-cap]");
        if (!b || !ST.walk) return;
        var a = b.getAttribute("data-cap"), n = ST.walk.it.data.desmosSteps.length;
        if (a === "next" && ST.walk.j < n - 1) { ST.walk.j++; showStep(); }
        else if (a === "back" && ST.walk.j > 0) { ST.walk.j--; showStep(); }
        else if (a === "close") { stopWalk(); if (!calcVisible()) U.showPane("q"); }
      });

      // ------------------------------------------------------------ clicks in the chat
      scroll.addEventListener("click", function (e) {
        var b = e.target.closest("button, [data-step]");
        if (!b) return;
        var card = b.closest("[data-i]"), it = card ? ST.items[+card.getAttribute("data-i")] : null;
        if (b.hasAttribute("data-tab") && it) { it.tab = b.getAttribute("data-tab"); render(); return; }
        if (b.hasAttribute("data-quick")) {
          var q = b.getAttribute("data-quick");
          if (q === "diff") { ST.draft = "I got "; renderComp(); var t = $("#snapIn"); t.focus(); t.setSelectionRange(t.value.length, t.value.length); return; }
          followUp({ simple: "Explain the solution more simply, like I'm seeing this topic for the first time.", why: "Why does the Desmos way work? What is the graph actually showing?",
                     similar: "Give me a similar SAT question to try (different numbers). Don't tell me the answer yet." }[q]);
          return;
        }
        if (b.hasAttribute("data-load-block") && it) {
          var lines = Tutor.render(it.text).blocks[+b.getAttribute("data-load-block")];
          stopWalk();
          Calc.show({ exprs: lines, bounds: Calc.fit(lines) }).then(function () { U.showPane("calc"); U.toast("Loaded into Desmos.", { label: "Undo", run: function () { Calc.undo(); } }); }).catch(function (er) { U.toast(h(er.message)); });
          return;
        }
        if (b.hasAttribute("data-open")) {
          var x = hist().filter(function (y) { return String(y.id) === b.getAttribute("data-open"); })[0];
          if (!x) return;
          var old = { role: "solve", id: x.id, data: x.data, checks: x.checks, thumb: x.thumb, note: x.note };
          ST.items = [{ role: "user", img: x.thumb, text: x.note }, old]; ST.problem = old; Tutor.reset("snap:" + old.id);
          render(1); renderComp(); drawSnap(old);
          if (calcVisible() && old.data.desmosSteps.length) startWalk(old, 0, true);
          return;
        }
        var a = b.getAttribute("data-act");
        if (a === "clearhist") { if (confirm("Clear your recent questions?")) { saveHist([]); render(); } return; }
        if (a === "walk" && it) { startWalk(it, 0); return; }
        if (b.hasAttribute("data-step") && it && it.role === "solve" && e.target.closest(".dsteps")) { startWalk(it, +b.getAttribute("data-step")); }
      });
      scroll.addEventListener("change", function (e) { if (e.target.id === "dropFile") { var f = e.target.files && e.target.files[0]; e.target.value = ""; if (f) takeFile(f); } });
      comp.addEventListener("click", function (e) {
        var b = e.target.closest("button");
        if (!b) return;
        if (b.hasAttribute("data-mode")) { ST.mode = b.getAttribute("data-mode"); renderComp(); }
        else if (b.getAttribute("data-act") === "unattach") { ST.pending = null; renderComp(); }
      });
      $("#snapNew").onclick = function () {
        if (ST.busy) return;
        stopWalk(); ST.items = []; ST.problem = null; ST.pending = null; ST.draft = "";
        render(); renderComp(); U.showPane("q"); scroll.scrollTop = 0;
      };

      render(ST.items.length ? "end" : null);
      renderComp();
      if (ST.walk) { var w0 = ST.walk; ST.walk = null; if (calcVisible()) startWalk(w0.it, w0.j, true); }
      return {
        destroy: function () {
          document.removeEventListener("paste", onPaste);
          ST.walk = null;
        }
      };
    }
  };
})();
