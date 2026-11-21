// Checks every question template on thousands of seeds.
// Run from the sat-math folder:  node tests/verify.js [seedsPerLevel]
"use strict";
const path = require("path"), fs = require("fs");
const js = path.join(__dirname, "..", "js");
["core.js", "figures.js", "skills.js", "bank-algebra.js", "bank-advanced.js", "bank-psda.js", "bank-geometry.js", "playbook.js"].forEach((f) => {
  const p = path.join(js, f);
  if (fs.existsSync(p)) require(p);
});
const S = globalThis.SATM, Fr = S.Fr;
const N = parseInt(process.argv[2] || "400", 10);
let failures = 0, made = 0;
const problems = {};
function bad(id, msg) {
  failures++;
  problems[id] = problems[id] || [];
  if (problems[id].length < 4) problems[id].push(msg);
}

// ---------------------------------------------------------------- the typed-answer rules
function expect(entry, ans, want) {
  const got = S.checkEntry(entry, ans).ok;
  if (got !== want) bad("checkEntry", JSON.stringify(entry) + " for " + ans.n + "/" + ans.d + " should be " + want);
}
const two3 = Fr(2, 3);
["2/3", ".6666", ".6667", "0.666", "0.667", "4/6"].forEach((e) => expect(e, two3, true));
["0.66", ".66", "0.67", ".67", "0.6", "2 / 3", "1 2/3"].forEach((e) => expect(e, two3, false));
const neg = Fr(-7, 3);
["-7/3", "-2.333", "-2.334"].forEach((e) => expect(e, neg, e !== "-2.334"));
expect("1.75", Fr(7, 4), true); expect("7/4", Fr(7, 4), true); expect("1.7", Fr(7, 4), false); expect("1.750", Fr(7, 4), true);
expect("12", Fr(12), true); expect("12.0", Fr(12), true); expect("-12", Fr(12), false);
[Fr(2, 3), Fr(-7, 3), Fr(7, 4), Fr(15), Fr(-1, 8), Fr(1, 7), Fr(250, 3)].forEach((a) => {
  S.answerForms(a).forEach((f) => { if (!S.checkEntry(f, a).ok) bad("answerForms", f + " rejected for " + a.n + "/" + a.d); });
});

// ---------------------------------------------------------------- every template
const textOf = (q) => [q.stem].concat((q.choices || []).map((c) => c.t + " " + (c.why || ""))).concat(q.explain)
  .concat(q.desmos ? q.desmos.steps : []).join(" \n ");
function mathSegments(s) {
  const out = []; const re = /\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g; let m;
  while ((m = re.exec(s))) out.push(m[1] !== undefined ? m[1] : m[2]);
  return out;
}
function balanced(s) {
  const opens = (s.match(/\\\(/g) || []).length, closes = (s.match(/\\\)/g) || []).length;
  const o2 = (s.match(/\\\[/g) || []).length, c2 = (s.match(/\\\]/g) || []).length;
  return opens === closes && o2 === c2;
}
function braces(s) { let d = 0; for (const ch of s.replace(/\\[{}]/g, "")) { if (ch === "{") d++; if (ch === "}") d--; if (d < 0) return false; } return d === 0; }

const bySkill = {};
const stats = [];
for (const id of S.tplOrder) {
  const t = S.templates[id];
  if (!S.skills[t.skill]) bad(id, "unknown skill " + t.skill);
  bySkill[t.skill] = (bySkill[t.skill] || 0) + 1;
  const stems = new Set(); let mc = 0, spr = 0;
  for (const L of t.levels) {
    for (let i = 0; i < N; i++) {
      const seed = (i * 2654435761 + L * 97 + 13) >>> 0;
      let q;
      try { q = S.make(id, L, seed); made++; } catch (e) { bad(id, "L" + L + " seed " + seed + ": make threw " + e.message); continue; }
      stems.add(q.stem);
      const where = id + " L" + L + " seed " + seed;
      try {
        const all = textOf(q);
        if (/NaN|undefined|Infinity|\[object|null/.test(all)) bad(id, where + ": bad token in text: " + (all.match(/.{0,40}(NaN|undefined|Infinity|\[object|null).{0,40}/) || [""])[0]);
        if (!balanced(q.stem) || !q.explain.every(balanced) || !(q.choices || []).every((c) => balanced(c.t))) bad(id, where + ": unbalanced math delimiters");
        mathSegments(all).forEach((seg) => {
          if (/[<>]/.test(seg)) bad(id, where + ": raw < or > inside math: " + seg);
          if (!braces(seg)) bad(id, where + ": unbalanced braces: " + seg);
          if (/\$/.test(seg)) bad(id, where + ": dollar sign inside math: " + seg);
        });
        if (/<script|onerror|javascript:/i.test(all)) bad(id, where + ": unsafe html");
        if (!q.explain.length) bad(id, where + ": no explanation");
        if (q.desmos) {
          if (!q.desmos.steps || !q.desmos.steps.length) bad(id, where + ": desmos without steps");
          (q.desmos.exprs || []).forEach((e) => {
            if (typeof e !== "string" || !e.length) bad(id, where + ": empty desmos expression");
            else if (/\\\(|\\\)|<|>(?!=)|NaN|undefined/.test(e.replace(/[<>]/g, (c, i, s) => (/[xy0-9)}\s]/.test(s[i - 1] || "") ? "" : c)))) bad(id, where + ": suspicious desmos expression " + e);
            if (!braces(e)) bad(id, where + ": unbalanced desmos braces " + e);
          });
          const bd = q.desmos.bounds;
          if (bd && !(bd.left < bd.right && bd.bottom < bd.top && [bd.left, bd.right, bd.bottom, bd.top].every(isFinite))) bad(id, where + ": bad desmos bounds " + JSON.stringify(bd));
        }
        if (q.type === "mc") {
          mc++;
          const texts = q.choices.map((c) => c.t);
          if (new Set(texts).size !== 4) bad(id, where + ": duplicate choices " + texts.join(" | "));
          if (q.choices.some((c) => !c.t)) bad(id, where + ": empty choice");
          if (q.choices.some((c, i) => i !== q.answer && !c.why)) bad(id, where + ": wrong choice without an explanation");
        } else {
          spr++;
          if (!S.fitsGrid(q.answer)) bad(id, where + ": answer doesn't fit the answer box: " + q.answer.n + "/" + q.answer.d);
          const forms = S.answerForms(q.answer);
          if (!forms.length) bad(id, where + ": no answer forms");
          forms.forEach((f) => { if (!S.checkEntry(f, q.answer).ok) bad(id, where + ": own answer form rejected " + f); });
        }
        if (t.check && t.check(q) !== true) bad(id, where + ": check returned false");
        const again = S.make(id, L, seed);
        if (again.stem !== q.stem || again.answer !== q.answer && !(q.type === "spr" && Fr.eq(again.answer, q.answer))) bad(id, where + ": not deterministic");
      } catch (e) { bad(id, where + ": " + e.message); }
    }
  }
  stats.push([id, t.levels.join(""), stems.size, mc, spr]);
}

console.log("Templates: " + S.tplOrder.length + "   questions made: " + made);
stats.forEach((r) => console.log("  " + r[0].padEnd(20) + " levels " + r[1].padEnd(4) + " distinct stems " + String(r[2]).padStart(5) + "   mc " + String(r[3]).padStart(5) + "  spr " + String(r[4]).padStart(5)));
const missing = Object.keys(S.skills).filter((k) => !bySkill[k]);
if (missing.length) console.log("Skills without templates: " + missing.join(", "));
if (S.playbook) {
  S.playbook.forEach((p) => (p.practice || []).forEach((tid) => { if (!S.templates[tid]) bad("playbook", p.id + " points at missing template " + tid); }));
}
if (failures) {
  console.log("\nFAILURES: " + failures);
  Object.keys(problems).forEach((k) => { console.log("- " + k); problems[k].forEach((p) => console.log("    " + p)); });
  process.exit(1);
}
console.log("\nAll checks passed.");
