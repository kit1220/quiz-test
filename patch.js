"use strict";
// 功能擴充:題目顯示講義名稱 + 「notes」按鈕檢視並標出講義中的相關知識點
// 必須在 app.js 之後載入。
(() => {
  /* ---- pure helpers (start) ---- */
  const stem = s => String(s || "").replace(/\.md$/i, "");

  function normalize(text) {
    let out = "", prevSpace = false;
    const map = [];
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (/\s/.test(c)) {
        if (!prevSpace && out) { out += " "; map.push(i); }
        prevSpace = true;
      } else {
        const lc = c.toLowerCase();
        out += lc;
        for (let k = 0; k < lc.length; k++) map.push(i);
        prevSpace = false;
      }
    }
    return { out, map };
  }

  function findExact(text, evidence) {
    const e = normalize(String(evidence || "").replace(/[`"“”]/g, "")).out.trim();
    if (e.length < 8) return null;
    const n = normalize(text);
    let idx = n.out.indexOf(e);
    if (idx < 0 && e.length > 40) {
      idx = n.out.indexOf(e.slice(0, 40));
      if (idx < 0) {
        const t = n.out.indexOf(e.slice(-40));
        if (t >= 0) idx = Math.max(0, t + 40 - e.length);
      }
    }
    if (idx < 0) return null;
    const last = Math.min(idx + e.length, n.map.length) - 1;
    const start = n.map[idx];
    let end = n.map[last] + 1;
    if (!n.out.includes(e)) {
      const gap = text.indexOf("\n\n", start);
      if (gap >= 0 && gap < end) end = gap;
    }
    return { start, end, score: 1e9, exact: true };
  }

  function tokens(s) {
    const t = new Set();
    for (const w of String(s).toLowerCase().match(/[a-z0-9_]{2,}/g) || []) t.add(w);
    for (const run of String(s).match(/[\u4e00-\u9fff]+/g) || [])
      for (let i = 0; i + 1 < run.length; i++) t.add(run.slice(i, i + 2));
    return t;
  }

  function findSimilar(text, query) {
    const qt = tokens(query);
    if (!qt.size) return { start: 0, end: 0, score: 0, exact: false };
    const lines = [];
    let pos = 0;
    for (const line of text.split("\n")) {
      lines.push([pos, pos + line.length]);
      pos += line.length + 1;
    }
    let best = { start: 0, end: 0, score: 0, exact: false };
    for (let i = 0; i < lines.length; i++) {
      if (!text.slice(lines[i][0], lines[i][1]).trim()) continue;
      let j = i;
      while (j + 1 < lines.length && lines[j][1] - lines[i][0] < 400) {
        const nxt = text.slice(lines[j + 1][0], lines[j + 1][1]);
        if (!nxt.trim() || /^#{1,3} /.test(nxt)) break;
        j++;
      }
      const win = text.slice(lines[i][0], lines[j][1]);
      const wt = tokens(win);
      let hit = 0;
      for (const w of qt) if (wt.has(w)) hit++;
      const score = hit / Math.sqrt(wt.size + 1);
      if (score > best.score) best = { start: lines[i][0], end: lines[j][1], score, exact: false };
    }
    return best;
  }

  function locate(text, q) {
    const ex = findExact(text, q.evidence);
    if (ex) return ex;
    const query = [q.evidence, q.q, (q.options || []).join(" "), q.explain].filter(Boolean).join(" ");
    return findSimilar(text, query);
  }
  /* ---- pure helpers (end) ---- */

  const style = document.createElement("style");
  style.textContent = [
    ".nv-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);z-index:50;display:flex;align-items:center;justify-content:center;padding:.5rem}",
    ".nv-box{background:#fff;border-radius:8px;width:100%;max-width:820px;max-height:92vh;display:flex;flex-direction:column}",
    ".nv-head{display:flex;justify-content:space-between;align-items:center;padding:.6rem 1rem;border-bottom:1px solid #ddd}",
    ".nv-hint{font-size:.85rem;color:#666;padding:.3rem 1rem}",
    ".nv-body{overflow:auto;padding:1rem;white-space:pre-wrap;font-family:Consolas,monospace;font-size:.9rem;line-height:1.6}",
    ".nv-mark{background:#ffe066;outline:2px solid #f6ad00}",
  ].join("\n");
  document.head.append(style);

  // 1. 題目標籤加上講義名稱
  const _renderQuiz = renderQuiz;
  renderQuiz = function () {
    _renderQuiz();
    document.querySelectorAll("#quizArea .card > .tag").forEach((el, i) => {
      const q = session.items[i];
      if (!q) return;
      el.textContent = "Q" + (i + 1) + "  [" + q.course + "]" +
        (q.source ? "{" + stem(q.source) + "}" : "") + "  " +
        (q.type === "mcq" ? "選擇題" : "簡答題");
    });
  };

  // 2. 出題時要求模型附上講義原文出處(evidence)
  const _buildPrompt = buildPrompt;
  buildPrompt = function (course, n, text) {
    return _buildPrompt(course, n, text).replace(
      "</question>",
      "<evidence>講義中支持這題答案的一句或一小段原文,必須逐字複製自講義片段,不要改寫,不超過 150 字</evidence>\n</question>");
  };
  const _parseQuestions = parseQuestions;
  parseQuestions = function (raw) {
    const qs = _parseQuestions(raw);
    const blocks = [...raw.matchAll(/<question>([\s\S]*?)<\/question>/g)].map(m => m[1]);
    qs.forEach(q => {
      const b = blocks.find(x => tag("text", x) === q.q);
      q.evidence = b ? tag("evidence", b) : "";
    });
    return qs;
  };

  // 3. notes 按鈕與檢視視窗
  function closeModal() {
    const o = document.getElementById("nvOverlay");
    if (o) o.remove();
  }
  function openModal(note, loc, q) {
    closeModal();
    const mark = h("mark", { class: "nv-mark" }, note.text.slice(loc.start, loc.end));
    const body = h("div", { class: "nv-body" });
    body.append(document.createTextNode(note.text.slice(0, loc.start)), mark,
      document.createTextNode(note.text.slice(loc.end)));
    const hint = !loc.end ? "找不到相關段落" :
      loc.exact ? "已標出講義中的相關原文" : "找不到逐字相同的原文,已標出最相近的段落(可能不完全準確)";
    const box = h("div", { class: "nv-box" },
      h("div", { class: "nv-head" },
        h("b", {}, q.course + " / " + note.name),
        h("button", { class: "btn sec", onclick: closeModal }, "關閉")),
      h("div", { class: "nv-hint" }, hint),
      body);
    const overlay = h("div", { class: "nv-overlay", id: "nvOverlay",
      onclick: ev => { if (ev.target.id === "nvOverlay") closeModal(); } }, box);
    document.body.append(overlay);
    if (loc.end) mark.scrollIntoView({ block: "center" });
  }
  async function showNote(q) {
    const notes = (await DB.all("notes")).filter(n => n.course === q.course);
    let cands = notes.filter(n => n.name === q.source);
    if (!cands.length) cands = notes;
    if (!cands.length) return alert("找不到這份講義(可能已被刪除)");
    let best = null;
    for (const n of cands) {
      const loc = locate(n.text, q);
      if (!best || loc.score > best.loc.score) best = { n, loc };
    }
    openModal(best.n, best.loc, q);
  }

  const _submitQuiz = submitQuiz;
  submitQuiz = async function () {
    await _submitQuiz();
    if (!session || !session.submitted) return;
    session.items.forEach((q, i) => {
      const r = document.getElementById("r" + i);
      if (r && !r.querySelector(".nv-btn"))
        r.append(h("button", { class: "btn sec nv-btn", onclick: () => showNote(q) }, "📖 notes"));
    });
  };
})();
