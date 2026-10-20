"use strict";
// UI languages: Traditional Chinese / English / Simplified Chinese
(() => {
  const D = {
    "zh-Hant": {
      appTitle: "每日測驗", navQuiz: "測驗", navNotes: "筆記", navStats: "成績", navSettings: "設定",
      chooseCourse: "選擇課程", perCourse: "每個課程題數", startQuiz: "開始測驗", fillBank: "下載題庫(離線用)",
      bankHint: "「下載題庫」會用上面的題數,為每個勾選的課程預先出題並存在手機,之後沒有網絡也能作答選擇題。",
      addNote: "新增筆記", courseName: "課程名稱(資料夾)", coursePh: "例如 ge2340_ai",
      chooseFile: "選擇檔案(.md / .txt 可多選;.pdf 一次一個)", fileName: "檔名",
      contentLabel: "內容(可編輯,確認沒問題再儲存)", saveNote: "儲存筆記", cancel: "取消",
      courseScores: "各課程成績", noteScores: "各筆記(權重越高越常出現)", pendingTitle: "待批改的簡答題", gradeNow: "現在批改",
      backupTitle: "備份與還原", exportBtn: "匯出備份(.json)", importLabel: "匯入備份(會覆蓋目前資料)", backupNoKey: "備份不含 API Key。",
      apiKeyLabel: "DeepSeek API Key(只存在這支手機)", modelLabel: "模型", ocrLabel: "OCR 語言(掃描 PDF 用)",
      ocrEng: "英文", ocrTra: "繁體中文 + 英文", saveSettings: "儲存設定", persistBtn: "要求持久儲存",
      settingsWarn: "提醒:Key 存在瀏覽器儲存空間,請在 DeepSeek 帳號設定較低的儲值上限。筆記內容會經 Worker 送到 DeepSeek 處理。",
      needKey: "請先到「設定」輸入 API Key", noWorker: "config.js 沒有設定 WORKER_URL", apiError: "API 錯誤 {0}:{1}",
      truncated: "輸出多次被截斷,請降低題數", noNotes: "{0} 沒有筆記", parseFail: "無法解析模型輸出,請重試",
      genProgress: "出題中:{0} {1}/{2}", noteItem: "{0}({1} 字)", del: "刪除", delConfirm: "刪除 {0}?",
      readPage: "讀取文字層 {0}/{1}", ocrConfirm: "第 {0} 頁沒有文字層(可能是掃描或圖片)。要用 OCR 辨識嗎?較慢且耗電。",
      ocrProgress: "OCR 第 {0} 頁({1}/{2})", pageMark: "[第 {0} 頁]", loadFail: "載入失敗:{0}",
      bankLeft: "{0}:題庫剩 {1} 題", pickCourse: "請先勾選課程", genFail: "{0} 出題失敗:{1}",
      bankShort: "{0} 題庫只有 {1} 題(離線或出題失敗)", typeMcq: "選擇題", typeShort: "簡答題", submit: "交卷",
      noAnswer: "沒有作答", grading: "批改第 {0} 題...", offlinePending: "⏳ 離線,連上網絡後到「成績」頁批改",
      correct: "✅ 正確", wrongAns: "❌ 標準答案:", feedback: "回饋:", explain: "解釋:",
      score: "得分:{0} / {1}", scorePending: "(另有 {0} 題待批改)",
      colCourse: "課程", colRight: "對", colWrong: "錯", colAcc: "正確率", noRecords: "還沒有紀錄",
      colNote: "筆記", colRW: "對/錯", colWeight: "權重", pendingCount: "待批改:{0} 題",
      gradingPending: "批改待處理題目 {0}/{1}", offlineNow: "目前沒有網絡", gradeAbort: "批改中斷:{0}",
      gradeDone: "完成:答對 {0} 題,答錯 {1} 題", badBackup: "檔案不是有效的備份", badFormat: "備份格式不符",
      importConfirm: "匯入會覆蓋目前所有筆記、題庫與成績,確定嗎?", importDone: "匯入完成",
      persistLabel: "持久儲存:{0}", enabled: "已啟用", disabled: "未啟用", usedMB: " | 已用 {0} MB",
      online: "● 線上", offline: "○ 離線", saved: "已儲存", persistOk: "已啟用持久儲存",
      persistNo: "瀏覽器未批准(把網頁加到主畫面比較容易通過)", needNet: "需要網絡才能下載題庫",
      bankUpdated: "題庫已更新", failed: "失敗:{0}", needCourseName: "請先填課程名稱", pdfOne: "PDF 請一次選一個",
      savedNotes: "已儲存 {0} 份筆記", procFail: "處理失敗:{0}", needBoth: "課程與檔名都要填",
      noteGone: "找不到這份筆記(可能已被刪除)", hintNone: "找不到相關段落", hintExact: "已標出筆記中的相關原文",
      hintFuzzy: "找不到逐字相同的原文,已標出最相近的段落(可能不完全準確)", close: "關閉", viewNotes: "查看筆記"
    },
    en: {
      appTitle: "Daily Quiz", navQuiz: "Quiz", navNotes: "Notes", navStats: "Scores", navSettings: "Settings",
      chooseCourse: "Choose courses", perCourse: "Questions per course", startQuiz: "Start quiz", fillBank: "Download question bank (offline)",
      bankHint: "\"Download question bank\" uses the number above to pre-generate questions for each selected course and stores them on your phone, so you can answer multiple-choice questions without a network.",
      addNote: "Add notes", courseName: "Course name (folder)", coursePh: "e.g. ge2340_ai",
      chooseFile: "Choose files (.md / .txt allow multiple; .pdf one at a time)", fileName: "File name",
      contentLabel: "Content (editable; save once it looks right)", saveNote: "Save notes", cancel: "Cancel",
      courseScores: "Scores by course", noteScores: "Notes (higher weight appears more often)", pendingTitle: "Short answers waiting to be graded", gradeNow: "Grade now",
      backupTitle: "Backup and restore", exportBtn: "Export backup (.json)", importLabel: "Import backup (overwrites current data)", backupNoKey: "Backups do not include the API key.",
      apiKeyLabel: "DeepSeek API Key (stored only on this device)", modelLabel: "Model", ocrLabel: "OCR language (for scanned PDFs)",
      ocrEng: "English", ocrTra: "Traditional Chinese + English", saveSettings: "Save settings", persistBtn: "Request persistent storage",
      settingsWarn: "Reminder: the key is kept in browser storage, so set a low top-up limit on your DeepSeek account. Note contents are sent to DeepSeek through the Worker for processing.",
      needKey: "Enter your API key in Settings first", noWorker: "WORKER_URL is not set in config.js", apiError: "API error {0}: {1}",
      truncated: "Output was truncated several times; lower the number of questions", noNotes: "{0} has no notes", parseFail: "Could not parse the model output; please retry",
      genProgress: "Generating: {0} {1}/{2}", noteItem: "{0} ({1} chars)", del: "Delete", delConfirm: "Delete {0}?",
      readPage: "Reading text layer {0}/{1}", ocrConfirm: "Page(s) {0} have no text layer (probably scanned or images). Use OCR? It is slower and uses more battery.",
      ocrProgress: "OCR page {0} ({1}/{2})", pageMark: "[Page {0}]", loadFail: "Failed to load: {0}",
      bankLeft: "{0}: {1} questions left in bank", pickCourse: "Select at least one course", genFail: "{0}: question generation failed: {1}",
      bankShort: "{0}: only {1} questions available (offline or generation failed)", typeMcq: "Multiple choice", typeShort: "Short answer", submit: "Submit",
      noAnswer: "No answer", grading: "Grading question {0}...", offlinePending: "⏳ Offline. Grade it from the Scores tab when you are online",
      correct: "✅ Correct", wrongAns: "❌ Correct answer: ", feedback: "Feedback: ", explain: "Explanation: ",
      score: "Score: {0} / {1}", scorePending: " ({0} more waiting to be graded)",
      colCourse: "Course", colRight: "Right", colWrong: "Wrong", colAcc: "Accuracy", noRecords: "No records yet",
      colNote: "Notes", colRW: "Right/Wrong", colWeight: "Weight", pendingCount: "Waiting to be graded: {0}",
      gradingPending: "Grading pending questions {0}/{1}", offlineNow: "No network right now", gradeAbort: "Grading stopped: {0}",
      gradeDone: "Done: {0} correct, {1} wrong", badBackup: "This file is not a valid backup", badFormat: "Backup format does not match",
      importConfirm: "Importing overwrites all current notes, question bank and scores. Continue?", importDone: "Import complete",
      persistLabel: "Persistent storage: {0}", enabled: "enabled", disabled: "not enabled", usedMB: " | {0} MB used",
      online: "● Online", offline: "○ Offline", saved: "Saved", persistOk: "Persistent storage enabled",
      persistNo: "The browser did not grant it (adding the page to your home screen helps)", needNet: "A network connection is needed to download the question bank",
      bankUpdated: "Question bank updated", failed: "Failed: {0}", needCourseName: "Enter a course name first", pdfOne: "Select one PDF at a time",
      savedNotes: "Saved {0} note file(s)", procFail: "Processing failed: {0}", needBoth: "Course and file name are both required",
      noteGone: "Cannot find this note (it may have been deleted)", hintNone: "No related passage found", hintExact: "The related passage in your notes is highlighted",
      hintFuzzy: "No word-for-word match found; the closest passage is highlighted (may not be exact)", close: "Close", viewNotes: "View notes"
    },
    "zh-Hans": {
      appTitle: "每日测验", navQuiz: "测验", navNotes: "笔记", navStats: "成绩", navSettings: "设置",
      chooseCourse: "选择课程", perCourse: "每个课程题数", startQuiz: "开始测验", fillBank: "下载题库(离线用)",
      bankHint: "“下载题库”会用上面的题数,为每个勾选的课程预先出题并保存在手机上,之后没有网络也能作答选择题。",
      addNote: "新增笔记", courseName: "课程名称(文件夹)", coursePh: "例如 ge2340_ai",
      chooseFile: "选择文件(.md / .txt 可多选;.pdf 一次一个)", fileName: "文件名",
      contentLabel: "内容(可编辑,确认没问题再保存)", saveNote: "保存笔记", cancel: "取消",
      courseScores: "各课程成绩", noteScores: "各笔记(权重越高越常出现)", pendingTitle: "待批改的简答题", gradeNow: "现在批改",
      backupTitle: "备份与还原", exportBtn: "导出备份(.json)", importLabel: "导入备份(会覆盖当前数据)", backupNoKey: "备份不含 API Key。",
      apiKeyLabel: "DeepSeek API Key(只保存在这台手机)", modelLabel: "模型", ocrLabel: "OCR 语言(扫描 PDF 用)",
      ocrEng: "英文", ocrTra: "繁体中文 + 英文", saveSettings: "保存设置", persistBtn: "请求持久存储",
      settingsWarn: "提醒:Key 保存在浏览器存储空间,请在 DeepSeek 账号设置较低的充值上限。笔记内容会经 Worker 发送到 DeepSeek 处理。",
      needKey: "请先到“设置”输入 API Key", noWorker: "config.js 没有设置 WORKER_URL", apiError: "API 错误 {0}:{1}",
      truncated: "输出多次被截断,请减少题数", noNotes: "{0} 没有笔记", parseFail: "无法解析模型输出,请重试",
      genProgress: "出题中:{0} {1}/{2}", noteItem: "{0}({1} 字)", del: "删除", delConfirm: "删除 {0}?",
      readPage: "读取文字层 {0}/{1}", ocrConfirm: "第 {0} 页没有文字层(可能是扫描件或图片)。要用 OCR 识别吗?较慢且耗电。",
      ocrProgress: "OCR 第 {0} 页({1}/{2})", pageMark: "[第 {0} 页]", loadFail: "加载失败:{0}",
      bankLeft: "{0}:题库剩 {1} 题", pickCourse: "请先勾选课程", genFail: "{0} 出题失败:{1}",
      bankShort: "{0} 题库只有 {1} 题(离线或出题失败)", typeMcq: "选择题", typeShort: "简答题", submit: "交卷",
      noAnswer: "没有作答", grading: "批改第 {0} 题...", offlinePending: "⏳ 离线,联网后到“成绩”页批改",
      correct: "✅ 正确", wrongAns: "❌ 标准答案:", feedback: "反馈:", explain: "解释:",
      score: "得分:{0} / {1}", scorePending: "(另有 {0} 题待批改)",
      colCourse: "课程", colRight: "对", colWrong: "错", colAcc: "正确率", noRecords: "还没有记录",
      colNote: "笔记", colRW: "对/错", colWeight: "权重", pendingCount: "待批改:{0} 题",
      gradingPending: "批改待处理题目 {0}/{1}", offlineNow: "当前没有网络", gradeAbort: "批改中断:{0}",
      gradeDone: "完成:答对 {0} 题,答错 {1} 题", badBackup: "文件不是有效的备份", badFormat: "备份格式不符",
      importConfirm: "导入会覆盖当前所有笔记、题库与成绩,确定吗?", importDone: "导入完成",
      persistLabel: "持久存储:{0}", enabled: "已启用", disabled: "未启用", usedMB: " | 已用 {0} MB",
      online: "● 在线", offline: "○ 离线", saved: "已保存", persistOk: "已启用持久存储",
      persistNo: "浏览器未批准(把网页添加到主屏幕比较容易通过)", needNet: "需要网络才能下载题库",
      bankUpdated: "题库已更新", failed: "失败:{0}", needCourseName: "请先填课程名称", pdfOne: "PDF 请一次选一个",
      savedNotes: "已保存 {0} 份笔记", procFail: "处理失败:{0}", needBoth: "课程与文件名都要填",
      noteGone: "找不到这份笔记(可能已被删除)", hintNone: "找不到相关段落", hintExact: "已标出笔记中的相关原文",
      hintFuzzy: "找不到逐字相同的原文,已标出最相近的段落(可能不完全准确)", close: "关闭", viewNotes: "查看笔记"
    }
  };
  const NAMES = { "zh-Hant": "Traditional Chinese (繁體中文)", en: "English", "zh-Hans": "Simplified Chinese (简体中文)" };
  const valid = l => Object.prototype.hasOwnProperty.call(D, l);

  window.detectLang = () => {
    const n = (navigator.language || "").toLowerCase();
    if (n.startsWith("zh")) return /(tw|hk|mo|hant)/.test(n) ? "zh-Hant" : "zh-Hans";
    return n ? "en" : "zh-Hant";
  };

  let cur;
  try { cur = JSON.parse(localStorage.getItem("settings") || "{}").uiLang; } catch (e) { cur = null; }
  if (!valid(cur)) cur = window.detectLang();

  window.getLang = () => cur;
  window.langName = () => NAMES[cur];
  window.tr = (k, ...a) => {
    const s = (D[cur] && D[cur][k] != null) ? D[cur][k] : (D["zh-Hant"][k] != null ? D["zh-Hant"][k] : k);
    return s.replace(/\{(\d+)\}/g, (m, i) => (a[i] != null ? a[i] : ""));
  };
  window.applyI18n = () => {
    document.documentElement.lang = cur;
    document.title = window.tr("appTitle");
    document.querySelectorAll("[data-i18n]").forEach(e => { e.textContent = window.tr(e.dataset.i18n); });
    document.querySelectorAll("[data-i18n-ph]").forEach(e => { e.setAttribute("placeholder", window.tr(e.dataset.i18nPh)); });
  };
  window.setLang = l => { if (!valid(l)) return; cur = l; window.applyI18n(); };
  window.applyI18n();
})();
