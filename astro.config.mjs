// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE } from './src/config/site.ts';

// 部署網址：優先讀環境變數 PUBLIC_SITE_URL（Vercel / Cloudflare Pages 可設定），
// 否則使用 src/config/site.ts 裡的 SITE.url。
const site = process.env.PUBLIC_SITE_URL || SITE.url;

export default defineConfig({
  site,
  trailingSlash: 'never',
  build: { format: 'file' },
  compressHTML: true,
  integrations: [
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      i18n: { defaultLocale: 'zh-TW', locales: { 'zh-TW': 'zh-TW' } },
    }),
  ],
});
