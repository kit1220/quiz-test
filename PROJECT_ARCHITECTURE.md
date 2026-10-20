# Daily Quiz PWA (quiz-test) — Architecture & Handover Notes

> Purpose of this file: give it to an AI assistant (or a new developer) at the start of a conversation so it can understand the whole project without prior memory.
> Snapshot taken from `main` at commit `3abf937` (2026-10-20). If the code has moved on, trust the code over this file and update this file.

## 1. What this is

A phone-installable, offline-capable quiz web app (PWA).

- The user uploads course notes (`.md`, `.txt`, or `.pdf`), grouped by **course name**.
- The app asks DeepSeek (through a tiny Cloudflare Worker proxy) to generate multiple-choice (`mcq`) and short-answer (`short`) questions from random excerpts of the notes.
- Questions are stored in a local question bank so MCQs work offline. Short answers are graded by the LLM (queued if offline).
- Scores per course and per note file are kept; notes with more mistakes get a higher weight and appear more often.
- After answering, a "View notes" button opens the note and highlights the passage the question was based on.
- UI languages: English, Traditional Chinese (繁體中文), Simplified Chinese (简体中文).

Everything user-specific (API key, notes, bank, scores) lives only in the browser of the user's own device (localStorage + IndexedDB). There is no backend database.

## 2. Hosting and accounts

| Part | Where | Notes |
|---|---|---|
| Front-end | GitHub Pages, repo `kit1220/quiz-test`, branch `main` | Site URL: `https://kit1220.github.io/quiz-test/` |
| Proxy | Cloudflare Worker `quiz-proxy` | URL is in `config.js`: `https://quiz-proxy.ckit3410.workers.dev` |
| LLM | DeepSeek API (`https://api.deepseek.com/chat/completions`) | Each user enters their own API key in Settings; default model name `deepseek-flash` |
| Third-party libs | Self-hosted in `lib/` (no CDN) | Populated by the GitHub Action `Fetch libs` |

Costs: pdf.js and Tesseract.js are free (Apache 2.0, run in the browser). Cloudflare Workers free plan allows 100,000 requests/day. Only DeepSeek tokens cost money.

## 3. Repository map

```
.github/workflows/fetch-libs.yml   manual workflow: downloads third-party libs into lib/ and commits them
README.md                          short original readme (Chinese)
index.html                         page shell, CSP, all static UI text with data-i18n attributes
i18n.js                            3-language dictionary + helpers (tr, setLang, getLang, langName, detectLang, applyI18n)
app.js                             main application logic (settings, DB, quiz, PDF/OCR, stats, backup)
patch.js                           extensions layered on app.js (note-name tag, evidence prompt, "View notes" viewer, delete-scores button)
style.css                          styles
sw.js                              service worker (offline cache), cache name quiz-v3
manifest.webmanifest               PWA manifest
config.js                          sets window.QUIZ_CFG.WORKER_URL
worker/worker.js, wrangler.toml    Cloudflare Worker source and config
lib/                               pdf.min.mjs, pdf.worker.min.mjs, katex/, tesseract.min.js, worker.min.js,
                                   tesseract-core*.js/.wasm/.wasm.js, tessdata/{eng,chi_tra}.traineddata.gz
```

Script load order in `index.html` (bottom of body): `config.js` -> `lib/katex/katex.min.js` -> `lib/katex/auto-render.min.js` -> `i18n.js` -> `app.js` -> `patch.js`. Order matters.

## 4. Runtime architecture

```
Phone browser (PWA)
 ├─ index.html + i18n.js + app.js + patch.js
 ├─ localStorage "settings"  -> {apiKey, model, perCourse, ocrLang, uiLang}
 ├─ IndexedDB "quizapp" v1   -> stores: notes, bank, pending, meta("stats")
 ├─ Service worker           -> offline cache
 └─ fetch POST ──► Cloudflare Worker (quiz-proxy) ──► DeepSeek API
        headers: X-Api-Key (user's key), body: {model,max_tokens,thinking:{type:"disabled"},messages}
```

### 4.1 Data model

- `settings` (localStorage JSON): `apiKey`, `model`, `perCourse`, `ocrLang` (`eng` or `chi_tra+eng`), `uiLang` (`en` | `zh-Hant` | `zh-Hans`).
- IndexedDB store `notes`: `{id, course, name, text}`. `name` is the file name (PDF uploads become `.md`). Saving a note with the same course+name replaces the old one.
- IndexedDB store `bank`: generated questions `{id, course, type: "mcq"|"short", q, options[], answer, explain, source, evidence, used}`. `source` = note file name (validated against the excerpt names, else empty). `evidence` = verbatim sentence from the note (added by `patch.js`).
- IndexedDB store `pending`: short answers not yet graded because the device was offline `{course, source, q, answer, explain, user, created}`.
- IndexedDB store `meta`, key `stats`: `{courses: {course: {right, wrong}}, files: {"course/noteName": {right, wrong}}}`.
- Backup JSON (export/import): `{version:1, notes, bank, pending, stats, settings (apiKey blanked)}`. Import overwrites everything but keeps the current API key.

### 4.2 Question generation flow (`app.js`)

1. `startQuiz()` picks checked courses and `perCourse` count. For each course it takes unused questions from `bank` (weighted by note weight); if short and online, calls `fillBank()`.
2. `fillBank()` -> `genBatch()` -> splits each note into ~3000-char chunks (`chunkNote`, splitting on `#`/`##`/`###` headings), samples up to 3 chunks weighted by note weight (`weightedSample`), builds the prompt (`buildPrompt`), calls `llm()`.
3. `fileWeight = (wrong+1)/(right+wrong+2) + 0.1`: more mistakes -> appears more.
4. The prompt is written in English and ends with an instruction to answer in `langName()` (the UI language). Model output uses a strict XML-like format: `<question><type>…</type><text>…</text><option>…</option><source>…</source><answer>…</answer><explain>…</explain></question>`. `patch.js` appends an `<evidence>` field to the format.
5. `parseQuestions()` parses with regexes. A question needs `<text>` and `<answer>`; type is `mcq` only if there are ≥2 options.
6. `llm()` retries up to 3 times, doubling `max_tokens` (cap 8000) when `finish_reason === "length"`.
7. Excerpts are marked as data: the prompt says to ignore instructions inside the notes (prompt-injection mitigation). Student answers during grading are treated the same way.

### 4.3 Quiz, grading, scoring

- `renderQuiz()` renders cards with `textContent` only (no `innerHTML`); `rich()` handles code fences/inline code; `typeset()` renders KaTeX (`\( … \)` and `\[ … \]`).
- `submitQuiz()`: MCQ is graded locally by the first letter; short answers go to `gradeShort()` (LLM returns `<correct>yes|no</correct><feedback>…</feedback>`). Offline -> saved to `pending`; graded later from the Scores page (`gradePending`).
- Scores page: per-course table (right / wrong / accuracy, plus a **Delete scores** button per row added by `patch.js`) and per-note table with weights.

### 4.4 PDF to text and OCR (`app.js`: `pdfToMd`)

- Uses pdf.js `getTextContent()`; groups text items into lines by rounded Y (tolerance 2), sorts by X, joins CJK without spaces. Lines whose font size ≥ 1.35 × median and < 80 chars become `## ` headings. Each page starts with a marker (`[第 N 頁]` / `[Page N]` / `[第 N 页]`).
- Pages with < 20 characters are treated as scanned; the user is asked whether to OCR them with Tesseract.js (`createWorker(ocrLang, 1, {workerPath:"./lib/worker.min.js", corePath:"./lib/", langPath:"./lib/tessdata"})`, page rendered at scale 2.5).
- The extracted text is shown in an editable box; the user confirms and saves.
- Known weakness: formulas, sub/superscripts, fractions, tables and figures come out as fragments. Recommended workaround for math-heavy slides: convert on a PC with a better tool (e.g. Docling, Marker, MinerU) and upload the `.md`.

### 4.5 `patch.js` (extension layer)

It reassigns app.js function declarations (works because top-level function declarations are global bindings): `renderQuiz`, `buildPrompt`, `parseQuestions`, `submitQuiz`, `refreshStats`.

1. Question tag shows the note name: `Q1 [course]{note} type`.
2. Appends an `<evidence>` instruction to the prompt (verbatim quote ≤ 150 chars) and stores `q.evidence`.
3. "📖 View notes" button after submit -> overlay showing the note with the relevant passage highlighted. `locate()` tries exact (whitespace/case-insensitive) match of the evidence, else the most similar window (token overlap).
4. Delete-scores button per course row (removes `stats.courses[course]` and all `stats.files` keys starting with `course/`; does not touch notes, bank or pending).

### 4.6 i18n (`i18n.js`)

- `window.tr(key, ...args)` returns a string with `{0}`, `{1}` placeholders replaced; falls back to Traditional Chinese, then to the key.
- Static HTML uses `data-i18n="key"` (text) and `data-i18n-ph="key"` (placeholder); `applyI18n()` fills them.
- `window.setLang(l)` switches language and re-applies static text; app code then calls `netBadge()` and `refreshAll()` to redraw dynamic parts.
- Current language is read from `localStorage.settings.uiLang`, else detected from `navigator.language` (zh-TW/HK/MO -> zh-Hant, other zh -> zh-Hans, otherwise en).
- Terminology: Traditional uses 「筆記」 (not 「講義」) and the button 「查看筆記」; Simplified 「笔记」/「查看笔记」; English "Notes"/"View notes".
- `patch.js` has its own tiny dictionary (`SC`) for the delete-scores strings.
- Do NOT name a local variable `tr` (it shadows the translator). Avoid shadowing `t` is fine now because the translator is `tr`.

### 4.7 Cloudflare Worker (`worker/worker.js`)

- Only accepts `POST` from origins listed in env var `ALLOWED_ORIGIN` (comma separated, must match the Pages origin, no trailing slash). Handles CORS/OPTIONS.
- Requires header `X-Api-Key` (10–200 chars), forwards it as `Authorization: Bearer` to DeepSeek. Never stores or logs content.
- Whitelists body fields: `model, messages, max_tokens, temperature, thinking`; ≤ 4 messages; total content ≤ 60,000 chars; `Content-Length` ≤ 200,000; `max_tokens` capped at 8000; `stream` forced to false.
- Optional rate limit via `RATE_LIMITER` binding (skipped if not configured).
- `wrangler.toml` still has the placeholder `ALLOWED_ORIGIN = "https://YOUR-NAME.github.io"`; the real value is set in the Cloudflare dashboard/deployment.

### 4.8 Service worker (`sw.js`) and caching

- Cache name `quiz-v3`. App shell is pre-cached: `./, index.html, app.js, patch.js, i18n.js, style.css, config.js, manifest.webmanifest`.
- Strategy: anything under `/lib/` is **cache-first**; everything else is **network-first** with a 4 s timeout and cache fallback.
- Gotcha: because `lib/` is cache-first, replacing a lib file does not reach users until the cache name is bumped (or site data is cleared). Bump `CACHE` whenever lib files or the shell structure change.

### 4.9 Security design

- CSP in `index.html`: scripts only from same origin (`'self'`, plus `'wasm-unsafe-eval'` for Tesseract WASM); `connect-src 'self' https://*.workers.dev`; `worker-src 'self' blob:`; no inline scripts.
- All model-generated text is shown with `textContent`, never `innerHTML`.
- API key stored only in the user's localStorage; excluded from backups.
- Because `connect-src` is limited to `*.workers.dev`, a custom proxy domain would require editing the CSP.

## 5. Third-party libraries and the `Fetch libs` workflow

`.github/workflows/fetch-libs.yml` (manual `workflow_dispatch`, needs `contents: write`):

1. `npm pack` + extract: `pdfjs-dist`, `katex`, `tesseract.js`, `@tesseract.js-data/eng`, `@tesseract.js-data/chi_tra`.
2. **`tesseract.js-core` is pinned** to the version range that `tesseract.js` declares in its own `package.json` (previous bug: latest core did not match latest tesseract.js, so the browser requested `tesseract-core-relaxedsimd-lstm.wasm.js` which did not exist -> OCR failed with `undefined` error).
3. Copies pdf.js, KaTeX (js/css/fonts), Tesseract (`tesseract.min.js`, `worker.min.js`, `tesseract-core*`) into `lib/`. If `relaxedsimd` core files are missing, the step copies the `simd` builds under the `relaxedsimd` names as a fallback.
4. Copies language data (`eng`, `chi_tra`; prefers `best_int` variants) into `lib/tessdata/`.
5. Commits and pushes to `main`. The Tesseract step has `continue-on-error: true`, so check that step for a red cross.

Only English and Traditional Chinese OCR data exist. Simplified Chinese OCR (`chi_sim`) is not installed; adding it means extending the workflow with `@tesseract.js-data/chi_sim` and a new `<option>` in the OCR language select.

## 6. How to change things safely

- GitHub tools available to the assistant: `get_file_contents`, `create_or_update_file` (needs the current blob SHA), `push_files` (multi-file single commit, no SHA needed). Repo `kit1220/quiz-test`, branch `main`.
- Working agreement with the user: analyse first when asked, **always get explicit confirmation before committing**, then commit exactly what was shown. Reply in the language the user writes in (Chinese when asked).
- Editing rules/gotchas:
  - `app.js` and `patch.js` are classic scripts in strict mode. Top-level `function` declarations can be reassigned from `patch.js`; `const` arrows (e.g. `loadScript`, `getSettings`, `saveStats`) cannot.
  - `stats` and `session` are top-level `let` and are readable/writable from `patch.js`.
  - When writing file contents through tool arguments, backslashes in regexes (`\s`, `\n`, `\u…`) must be escaped correctly in JSON.
  - New UI text: add the key to all three dictionaries in `i18n.js` (zh-Hant, en, zh-Hans), use `tr("key", args)` in JS or `data-i18n` in HTML.
  - New static script files: add them to `index.html` (correct order) and to `SHELL` in `sw.js`, then bump `CACHE`.
  - If you change the question output format, update both `buildPrompt` (app.js, plus the evidence injection in patch.js) and `parseQuestions`.

## 7. Change history (high level)

1. Initial PWA: notes upload, question bank, quiz, scores, backup, OCR, Worker proxy.
2. `patch.js` added: note name on questions, evidence quote, "notes" viewer with highlight.
3. OCR fix: `fetch-libs.yml` pins `tesseract.js-core` and aliases `relaxedsimd` builds.
4. Multi-language UI (en / zh-Hant / zh-Hans): `i18n.js` added, `index.html`/`app.js`/`patch.js` refactored to `tr()`, `sw.js` bumped to `quiz-v3`; "講義" renamed to "筆記", button "查看筆記"; prompts now English + "answer in <language>"; PDF error messages show the real message.
5. Per-course "Delete scores" button on the Scores page (`patch.js`).

## 8. Known limitations and ideas

- PDF formulas/figures/tables convert poorly. Ideas discussed: (a) deterministic cleanup of obvious extraction damage (`<sup>`, stray `�`, page footers), flagging damaged lines at upload; (b) LLM repair of only the damaged lines with a visible "[reconstructed]" marker and user review; (c) optional separate AI-enriched note while keeping the original note as the evidence source. Not implemented yet.
- Questions already in the bank keep the language they were generated in.
- Removing all notes of a course hides the course from the quiz list but leaves its bank questions and pending answers in IndexedDB.
- Not tested on every device; clearing browser data loses notes and scores, so export backups regularly.
- Short answers use LLM grading, which can be inconsistent.
