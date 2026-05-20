# WMS Config Explorer

*[English](#english) · [繁體中文](#繁體中文)*

---

## English

A single-file HTML tool for warehouse staff to look up WMS allocation logic by configuration name — without reading stored procedures.

### What it does

- **For warehouse admin users**: Search a config name → see the business flowchart of what the SP actually does
- **For IT admins**: Sign in → add/edit/delete flowcharts, export/import as JSON
- **No backend, no database, no server** — one HTML file, opens anywhere

### Quick start

1. Download `index.html`
2. Open in any modern browser (Chrome / Edge / Firefox / Safari)
3. Default admin password: `admin123` (change it in the source before deploying)

### How IT maintains content

The app intentionally does **not** integrate with any LLM API. Instead, IT admins follow this workflow:

1. Click **"Copy LLM prompt"** in the admin panel → copies a prompt template
2. Paste into your preferred LLM (Claude, ChatGPT, internal tool) along with the SP code
3. The LLM returns Mermaid flowchart syntax
4. Paste that into the editor → live preview → save

This keeps the tool zero-cost and zero-risk (no SP code ever touches a third-party API through this app).

### Persistence model

Because this is a pure static HTML file, changes made in the admin panel live only in the current browser session. To persist:

1. Make your edits in the admin panel
2. Click **"Export JSON"** to download the current dataset
3. Either:
   - Replace the `FLOWCHART_DATA` array in `index.html` with the exported JSON, OR
   - Host `index.html` and a separate `data.json` (requires minor code change)
4. Re-upload the updated file to wherever you host it

For a team of 1–2 IT maintainers and a few dozen configs, this works fine. If you outgrow it, move to a proper backend.

### Deployment options

- **GitHub Pages**: Push to a repo, enable Pages, share the URL
- **Company shared drive**: Drop the file, users open via `file://` path
- **SharePoint / Teams**: Upload as a file, users open in browser
- **Internal web server**: Drop into any static host (IIS, nginx, Apache)

### Tech stack

- Vanilla HTML + CSS + JavaScript (no build step)
- [Mermaid.js](https://mermaid.js.org/) for flowchart rendering (via CDN)
- Google Fonts (Inter + JetBrains Mono)

### Optional Vercel + MongoDB Admin Backend

This repo also includes `vercel-app/`, a Next.js admin/API app for:

- GitHub OAuth admin sign-in
- MongoDB Atlas storage
- Flowchart CRUD
- `updatedBy` / `updatedAt` tracking from the signed-in GitHub user
- Public read API for the GitHub Pages viewer

Deploy notes:

1. Create a Vercel project with root directory set to `vercel-app`.
2. Add environment variables from `vercel-app/.env.example`.
3. In GitHub OAuth App settings, set the callback URL to:

   ```text
   https://YOUR-VERCEL-PROJECT.vercel.app/api/auth/callback/github
   ```

4. After Vercel deploys, edit `config.js`:

   ```js
   window.WMS_API_BASE_URL = 'https://YOUR-VERCEL-PROJECT.vercel.app';
   ```

5. Commit and push `config.js`; GitHub Pages will then load flowcharts from MongoDB.

Do not commit real secrets. Keep MongoDB URI, GitHub OAuth secret, and NextAuth secret in Vercel environment variables only.

### Security notes

⚠️ **This is a lightweight tool, not a security boundary.**

- The admin password is checked in client-side JS — anyone with browser devtools can read it
- Purpose is to prevent accidental edits by non-admin users, not to stop determined attackers
- Do **not** put sensitive customer SP logic into a publicly-hosted version
- For public/open deployments, use abstracted business descriptions only (no real table names, no real client names)

### Sample data

The file ships with 4 demo entries using fictional config names (`STD_ECOM`, `XBORDER_RTL`, `B2B_BULK`) and fictional clients (`DemoClient_A/B/C`). Replace with your own before internal use.

### License

Internal use. Adapt freely.

---

## 繁體中文

一個單檔 HTML 工具，讓倉庫人員能透過配置名稱查詢 WMS 配置邏輯 — 不用再去翻 Stored Procedure。

### 功能說明

- **一般使用者（倉庫行政）**：輸入配置名稱 → 查看該 SP 對應的業務流程圖
- **IT Admin**：登入後可新增 / 編輯 / 刪除流程圖、匯出 / 匯入 JSON
- **無後端、無資料庫、無伺服器** — 一個 HTML 檔，到哪都能開

### 快速開始

1. 下載 `index.html`
2. 用現代瀏覽器打開（Chrome / Edge / Firefox / Safari）
3. 預設管理員密碼：`admin123`（部署前請修改原始碼）

### IT 如何維護內容

本工具刻意**不**整合任何 LLM API，IT Admin 的工作流程如下：

1. 在管理面板點選 **「Copy LLM prompt」** → 複製 prompt 範本
2. 貼到你慣用的 LLM（Claude、ChatGPT、公司內部工具）連同 SP 原始碼一起送出
3. LLM 會回傳 Mermaid 流程圖語法
4. 將結果貼回編輯器 → 即時預覽 → 儲存

這個設計讓工具維持**零成本、零風險**（SP 原始碼永遠不會透過這個應用程式送到第三方 API）。

### 資料持久化機制

由於這是純靜態 HTML 檔，在管理面板做的修改只會存在當前瀏覽器 session。若要永久保存：

1. 在管理面板完成編輯
2. 點選 **「Export JSON」** 下載當前資料集
3. 擇一進行：
   - 將匯出的 JSON 貼回 `index.html` 中的 `FLOWCHART_DATA` 陣列，或
   - 改為 `index.html` + 獨立 `data.json` 的架構（需少量程式碼調整）
4. 將更新後的檔案重新上傳到部署位置

對於 1–2 位 IT 維護者、數十個配置的規模來說這樣就夠用。若規模超過此範圍，建議改用正式後端。

### 部署選項

- **GitHub Pages**：push 到 repo，啟用 Pages，分享網址即可
- **公司共用磁碟**：把檔案放上去，使用者透過 `file://` 路徑打開
- **SharePoint / Teams**：上傳為檔案，使用者在瀏覽器中打開
- **內部 Web Server**：丟到任何靜態檔案伺服器（IIS、nginx、Apache）

### 技術棧

- 純 HTML + CSS + JavaScript（無需編譯步驟）
- [Mermaid.js](https://mermaid.js.org/) 負責流程圖渲染（透過 CDN）
- Google Fonts（Inter + JetBrains Mono）

### 安全性注意事項

⚠️ **這是輕量級工具，不是安全防線。**

- 管理員密碼在前端 JS 驗證 — 任何人打開瀏覽器 DevTools 都看得到
- 目的是防止一般使用者誤觸編輯功能，而非抵擋刻意攻擊
- **不要**把敏感的客戶 SP 邏輯放到公開部署的版本上
- 若要公開部署，請使用抽象化的業務描述（不含真實表名、真實客戶名稱）

### 範例資料

檔案內建 4 筆 DEMO 資料，使用虛構的配置名稱（`STD_ECOM`、`XBORDER_RTL`、`B2B_BULK`）與虛構客戶（`DemoClient_A/B/C`）。內部正式使用前請替換為你自己的資料。

### 授權

內部使用，可自由修改。
