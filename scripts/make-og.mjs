// 產生 public/og.png（1200×630）社群分享圖。執行：node scripts/make-og.mjs
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b5f46"/>
      <stop offset="1" stop-color="#0f7a5a"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <circle cx="1040" cy="120" r="220" fill="#ffffff" opacity="0.06"/>
  <circle cx="160" cy="560" r="260" fill="#ffffff" opacity="0.05"/>
  <rect x="80" y="80" width="88" height="88" rx="20" fill="#ffffff"/>
  <text x="124" y="144" font-family="WenQuanYi Zen Hei, Noto Sans TC, sans-serif" font-size="56" font-weight="700" fill="#0f7a5a" text-anchor="middle">算</text>
  <text x="190" y="140" font-family="WenQuanYi Zen Hei, Noto Sans TC, sans-serif" font-size="44" font-weight="700" fill="#ffffff">錢算算 <tspan font-size="28" fill="#d9f0e6">MoneyCalc TW</tspan></text>
  <text x="80" y="300" font-family="WenQuanYi Zen Hei, Noto Sans TC, sans-serif" font-size="72" font-weight="700" fill="#ffffff">算清楚每一塊錢，</text>
  <text x="80" y="390" font-family="WenQuanYi Zen Hei, Noto Sans TC, sans-serif" font-size="72" font-weight="700" fill="#ffffff">再做決定。</text>
  <text x="80" y="470" font-family="WenQuanYi Zen Hei, Noto Sans TC, sans-serif" font-size="30" fill="#d9f0e6">房貸 · 信貸 · 所得稅 · 加班費 · 勞退 · 定期定額</text>
  <text x="80" y="560" font-family="WenQuanYi Zen Hei, Noto Sans TC, sans-serif" font-size="26" fill="#a8d8c4">免費 · 免登入 · 依台灣最新法規參數更新</text>
</svg>`;

const png = await sharp(Buffer.from(svg)).png().toBuffer();
writeFileSync(new URL('../public/og.png', import.meta.url), png);
console.log(`og.png written (${png.length} bytes)`);
