# 錢算算 MoneyCalc TW

台灣理財試算工具站：房貸、信貸、綜合所得稅、加班費、勞退新制、定期定額複利。
靜態網站（Astro 7），免費託管即可上線，變現方式為 **Google AdSense ＋ 金融類聯盟行銷（聯盟網／通路王）**，之後可擴充數位商品與 B2B 付費工具。

> 先讀 **[docs/00-總覽與結論.md](docs/00-總覽與結論.md)**：研究結論、誠實的收入預期、以及只有你能做的 10 件事。

## 文件導覽

| 文件 | 內容 |
|---|---|
| [docs/00-總覽與結論.md](docs/00-總覽與結論.md) | 一頁看懂：做了什麼、為什麼這樣做、合理預期、下一步 |
| [docs/research/01-台灣變現管道研究.md](docs/research/01-台灣變現管道研究.md) | 聯盟網、通路王、蝦皮、AdSense RPM、金流、稅務新制 |
| [docs/research/02-網站商業模式比較與競爭分析.md](docs/research/02-網站商業模式比較與競爭分析.md) | 六種被動收入網站模式比較、Google 2024–2026 更新影響、台灣競爭者地圖 |
| [docs/research/03-稅務法遵與託管研究.md](docs/research/03-稅務法遵與託管研究.md) | 個人所得稅／營業稅規範、公平會揭露、金管會紅線、主機比較、官方參數 |
| [docs/04-執行計畫.md](docs/04-執行計畫.md) | 分四階段的路線圖、每階段 KPI 與每週時間預算 |
| [docs/05-上線部署指南.md](docs/05-上線部署指南.md) | 從買網域到 AdSense、聯盟網申請的逐步操作 |
| [docs/06-維運手冊.md](docs/06-維運手冊.md) | 每週 15 分鐘、每月 1 小時、每年參數更新行事曆 |
| [docs/07-關鍵字與內容計畫.md](docs/07-關鍵字與內容計畫.md) | 40 個目標關鍵字、文章模板、AI 輔助寫作規則 |

## 快速開始

```bash
npm install
npm run dev        # http://localhost:4321
npm test           # 計算核心單元測試（node --test）
npm run check      # Astro / TypeScript 型別檢查
npm run build      # 產出 dist/（靜態檔）
npm run verify     # test + build
```

需要 Node.js 22.18 以上（`.nvmrc` 已指定 22）。

## 你最需要修改的兩個檔案

- **`src/config/site.ts`**：網站名稱、網址、聯絡信箱、AdSense ID、GA4 ID、**聯盟連結（OFFERS）**。
- **`src/config/tw.ts`**：所有台灣法規參數（所得稅免稅額與級距、加班費倍率、勞退、基本工資、青安利率）。每年 1 月與 5 月對照官方公告更新，改這裡所有計算機同步生效。

## 專案結構

```
src/
  config/        site.ts（網站與變現設定）、tw.ts（法規參數）
  lib/           finance.ts（純函式計算核心）、format.ts、chart.ts、tools.ts（工具清單）、urlstate.ts
  layouts/       Base.astro（SEO/GA/AdSense）、CalculatorLayout.astro、ArticleLayout.astro
  components/    AdSlot、OfferList（聯盟卡片）、Faq（含 FAQ 結構化資料）、Breadcrumb…
  pages/         index、tools/*（6 個計算機）、guides/*、recommend/*（信用卡／開戶／貸款）、about、privacy、disclaimer、contact、404
  content/guides 文章（Markdown，含 frontmatter）
tests/           finance.test.ts（23 項測試）
scripts/         make-og.mjs（產生 og.png）
public/          robots.txt、_headers、favicon.svg、og.png
docs/            研究報告與執行文件
```

## 新增一個計算機

1. 在 `src/lib/finance.ts` 寫純函式，並在 `tests/finance.test.ts` 加測試。
2. 在 `src/lib/tools.ts` 的 `TOOLS` 登記 slug、標題、描述、關鍵字、側欄要推薦的聯盟類別。
3. 複製 `src/pages/tools/loan.astro` 為新檔，改表單與 `compute()`。
4. `npm run verify`。首頁、工具總覽、相關工具、sitemap 會自動更新。

## 新增一篇文章

在 `src/content/guides/` 新增 `xxx.md`，frontmatter 需有 `title`、`description`、`pubDate`，可選 `tools`（文末推薦的工具 slug）、`offers`（側欄聯盟類別）、`tags`。

## 部署

推薦 **Cloudflare Pages**（免費方案允許商業用途、流量不計費）。Build command `npm run build`，輸出目錄 `dist`，環境變數 `NODE_VERSION=22`、`PUBLIC_SITE_URL=https://你的網域`。詳見 [docs/05-上線部署指南.md](docs/05-上線部署指南.md)。

> 注意：Vercel Hobby 免費方案條款禁止商業用途（含廣告與聯盟站），不建議使用。

## 授權

程式碼可自由使用於你自己的網站。文章內容與品牌名稱請自行替換。
