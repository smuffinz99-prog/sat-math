// Visual QA: drives headless Edge over the DevTools protocol (no npm). Usage: node tools/cdp.js jobs.json
// jobs.json: { "jobs": [ { "w":1280, "h":800, "dark":false, "url":"http://localhost:8014/#/", "wait":2500, "eval":"async js returning a value", "shot":"out.png" } ] }  (steps without w/h keep the previous viewport)
"use strict";
const { spawn } = require("child_process"), fs = require("fs"), path = require("path"), os = require("os");
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const cfg = JSON.parse(fs.readFileSync(process.argv[2], "utf8")), PORT = cfg.port || 9339;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "edge-cdp-"));
const edge = spawn(EDGE, ["--headless=new", "--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--remote-debugging-port=" + PORT,
  "--user-data-dir=" + profile, "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  let target;
  for (let i = 0; i < 60 && !target; i++) {
    try { const list = await (await fetch("http://127.0.0.1:" + PORT + "/json/list")).json(); target = list.find((t) => t.type === "page"); } catch (e) { }
    if (!target) await sleep(250);
  }
  if (!target) throw new Error("Edge didn't start");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const waiting = {};
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && waiting[d.id]) { waiting[d.id](d); delete waiting[d.id]; } };
  const send = (method, params) => new Promise((r) => { const i = ++id; waiting[i] = r; ws.send(JSON.stringify({ id: i, method, params: params || {} })); });
  await send("Page.enable"); await send("Runtime.enable");
  let last = { w: 1280, h: 800, dark: false };
  for (const job of cfg.jobs) {
    if (job.w === undefined) { job.w = last.w; job.h = last.h; if (job.dark === undefined) job.dark = last.dark; }
    last = { w: job.w, h: job.h, dark: !!job.dark };
    const w = job.w || 1280, h = job.h || 800, mobile = w < 700;
    await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: job.dpr || 1, mobile });
    await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: job.dark ? "dark" : "light" }] });
    if (job.url) { await send("Page.navigate", { url: job.url }); await sleep(job.wait || 2500); }
    else if (job.wait) await sleep(job.wait);
    if (job.eval) {
      const r = await send("Runtime.evaluate", { expression: "(async () => { " + job.eval + " })()", awaitPromise: true, returnByValue: true, timeout: job.timeout || 120000 });
      const v = r.result && r.result.result;
      if (r.result && r.result.exceptionDetails) console.log("[" + (job.name || "eval") + "] EXCEPTION:", JSON.stringify(r.result.exceptionDetails).slice(0, 600));
      else if (v && v.value !== undefined) console.log("[" + (job.name || "eval") + "]", typeof v.value === "string" ? v.value : JSON.stringify(v.value, null, 1));
      if (job.after) await sleep(job.after);
    }
    if (job.shot) {
      const s = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      fs.writeFileSync(job.shot, Buffer.from(s.result.data, "base64"));
      console.log("saved " + job.shot);
    }
  }
  try { await send("Browser.close"); } catch (e) { }
  ws.close();
})().catch((e) => { console.error("ERROR", e.message); }).finally(() => { setTimeout(() => { try { edge.kill(); } catch (e) { } try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { } process.exit(0); }, 800); });
