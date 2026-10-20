# 每日測驗 PWA

手機可安裝的離線測驗網頁。每個人使用自己的 DeepSeek API Key、講義與成績,全部存在自己手機的 IndexedDB / localStorage。

## 結構
- `index.html` / `app.js` / `style.css`:前端
- `sw.js` / `manifest.webmanifest`:離線與安裝到主畫面
- `config.js`:填入 Worker 網址(不是 API Key)
- `worker/worker.js` / `wrangler.toml`:Cloudflare Worker,只轉發到 DeepSeek
- `lib/`:第三方函式庫(自行放入,見下)

## lib/ 需要放的檔案(自架,不用 CDN)
- `lib/pdf.min.mjs`、`lib/pdf.worker.min.mjs`(pdfjs-dist)
- `lib/katex/katex.min.js`、`katex.min.css`、`auto-render.min.js`、`fonts/`(KaTeX,選用;沒有時公式顯示原始 LaTeX)
- OCR(選用):`lib/tesseract.min.js`、`lib/worker.min.js`、tesseract-core 的 wasm 檔、`lib/tessdata/` 語言資料
檔名可能因版本不同而略有差異。

## 安全設計
- 題目、解釋一律用 textContent 顯示,不使用 innerHTML。
- CSP 限制只載入同源腳本。
- Worker 只轉發到 DeepSeek、只接受 ALLOWED_ORIGIN 內的網頁、限制請求大小,不記錄內容。
- 匯出備份不含 API Key。

## 已知限制
- 尚未在真機測試。
- PDF 轉文字的公式、表格、圖片品質有限;掃描檔需要 OCR。
- 清除瀏覽器資料會失去講義與成績,請定期匯出備份。
