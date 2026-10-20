"use strict";
// Extension: show note name on questions + "View notes" button that highlights the related passage.
// Also adds a per-course "delete scores" button to the Scores table.
// Must be loaded after app.js and i18n.js.
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

  // 1. Show the note name in the question tag
  const _renderQuiz = renderQuiz;
  renderQuiz = function () {
    _renderQuiz();
    document.querySelectorAll("#quizArea .card > .tag").forEach((el, i) => {
      const q = session.items[i];
      if (!q) return;
      el.textContent = "Q" + (i + 1) + "  [" + q.course + "]" +
        (q.source ? "{" + stem(q.source) + "}" : "") + "  " +
        (q.type === "mcq" ? tr("typeMcq") : tr("typeShort"));
    });
  };

  // 2. Ask the model for a verbatim evidence quote from the notes
  const _buildPrompt = buildPrompt;
  buildPrompt = function (course, n, text) {
    return _buildPrompt(course, n, text).replace(
      "</question>",
      "<evidence>one sentence or short passage from the notes that supports the answer; it must be copied VERBATIM from the excerpt (no paraphrasing), at most 150 characters</evidence>\n</question>");
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

  // 3. "View notes" button and viewer
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
    const hint = !loc.end ? tr("hintNone") :
      loc.exact ? tr("hintExact") : tr("hintFuzzy");
    const box = h("div", { class: "nv-box" },
      h("div", { class: "nv-head" },
        h("b", {}, q.course + " / " + note.name),
        h("button", { class: "btn sec", onclick: closeModal }, tr("close"))),
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
    if (!cands.length) return alert(tr("noteGone"));
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
        r.append(h("button", { class: "btn sec nv-btn", onclick: () => showNote(q) }, "📖 " + tr("viewNotes")));
    });
  };

  // 4. Delete the score records of one course (button on each row of the course score table)
  const SC = {
    "zh-Hant": { del: "刪除成績", confirm: "刪除「{0}」的所有成績紀錄?(不會刪除筆記)" },
    en: { del: "Delete scores", confirm: "Delete all score records for \"{0}\"? (Notes are not deleted.)" },
    "zh-Hans": { del: "删除成绩", confirm: "删除“{0}”的所有成绩记录?(不会删除笔记)" },
  };
  const sc = (k, v) => (SC[getLang()] || SC["zh-Hant"])[k].replace("{0}", () => v);
  const _refreshStats = refreshStats;
  refreshStats = async function () {
    await _refreshStats();
    const rows = [...document.querySelectorAll("#courseStats table tr")];
    rows.forEach((row, i) => {
      if (i === 0) { row.append(h("th", {})); return; }
      const course = row.cells[0].textContent;
      row.append(h("td", {}, h("button", { class: "btn danger", onclick: async () => {
        if (!confirm(sc("confirm", course))) return;
        delete stats.courses[course];
        for (const k of Object.keys(stats.files)) if (k.startsWith(course + "/")) delete stats.files[k];
        await saveStats();
        refreshAll();
      } }, sc("del"))));
    });
  };
})();
