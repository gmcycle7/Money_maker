/**
 * 網站全域設定 —— 這是你最需要修改的檔案。
 * 上線前請逐一填寫：網址、AdSense、GA4、聯盟連結。
 */

export const SITE = {
  /** 品牌名稱（可自行更換） */
  name: '錢算算',
  /** 英文副名（用於 <title> 與 OG） */
  nameEn: 'MoneyCalc TW',
  tagline: '台灣人最好用的免費理財試算工具',
  description:
    '房貸試算、信貸試算、綜合所得稅試算、加班費計算、勞退新制試算、定期定額複利計算。免費、免登入、手機也好用，數字一輸入馬上算給你看。',
  /** 正式網址，部署後請改成你的網域（不要加結尾斜線） */
  url: 'https://moneycalc-tw.example.com',
  locale: 'zh-TW',
  /** 聯絡信箱（AdSense 審核需要有聯絡方式） */
  contactEmail: 'hello@your-domain.com',
  /** 社群（沒有就留空字串） */
  social: {
    facebook: '',
    instagram: '',
    threads: '',
  },
  /** 版權起始年 */
  foundedYear: 2026,
} as const;

/**
 * 變現相關 ID —— 留空字串 = 停用（不會輸出任何程式碼）。
 */
export const MONETIZATION = {
  adsense: {
    /** 例：'ca-pub-1234567890123456'。AdSense 審核通過後填入。 */
    client: '',
    /** 各版位 slot id（可先全部留空，使用自動廣告） */
    slots: {
      headerBanner: '',
      inArticle: '',
      sidebar: '',
      footer: '',
    },
    /** 啟用 Google 自動廣告（審核後建議開啟，最省事） */
    autoAds: true,
  },
  analytics: {
    /** Google Analytics 4，例：'G-XXXXXXXXXX' */
    ga4Id: '',
    /** Cloudflare Web Analytics token（可選，隱私友善、免費） */
    cloudflareToken: '',
  },
  /** 贊助連結（Buy Me a Coffee / 歐付寶 等），留空則不顯示 */
  donateUrl: '',
} as const;

/**
 * 聯盟行銷連結 —— 這是主要收入來源。
 * 到「聯盟網 Affiliates.One」或「通路王 iChannels」申請後，
 * 把各活動的推廣連結貼在這裡。url 留空的項目不會在正式站顯示。
 */
export type Offer = {
  /** 內部代號 */
  id: string;
  /** 顯示名稱，例：「○○銀行 現金回饋卡」 */
  name: string;
  /** 一句話賣點 */
  pitch: string;
  /** 3 個以內的重點 */
  highlights: string[];
  /** 聯盟推廣連結（必須填才會顯示） */
  url: string;
  /** 角落標籤，例：'新戶首選' */
  badge?: string;
  /** 小字備註，例：'活動至 2026/12/31' */
  note?: string;
};

export type OfferCategory = 'creditCards' | 'brokers' | 'loans' | 'insurance' | 'savings';

export const OFFERS: Record<OfferCategory, Offer[]> = {
  creditCards: [
    {
      id: 'cc-example-1',
      name: '範例：○○銀行 現金回饋卡',
      pitch: '一般消費 1%、指定通路 3% 無上限',
      highlights: ['新戶核卡送 NT$500', '免年費', '行動支付加碼'],
      url: '', // ← 貼上聯盟網「信用卡辦卡」活動連結
      badge: '範例',
      note: '此為版型範例，請替換為實際活動',
    },
  ],
  brokers: [
    {
      id: 'broker-example-1',
      name: '範例：○○證券 數位帳戶',
      pitch: '線上開戶 10 分鐘，定期定額 100 元起',
      highlights: ['電子下單手續費 2.8 折', '美股 0 手續費方案', '開戶禮'],
      url: '',
      badge: '範例',
    },
  ],
  loans: [
    {
      id: 'loan-example-1',
      name: '範例：○○銀行 信用貸款',
      pitch: '利率 2.5% 起，最快當日撥款',
      highlights: ['線上申辦', '開辦費優惠', '可提前清償'],
      url: '',
      badge: '範例',
    },
  ],
  insurance: [],
  savings: [],
};

/** 導覽列 */
export const NAV = [
  { href: '/tools', label: '所有工具' },
  { href: '/tools/mortgage', label: '房貸試算' },
  { href: '/tools/income-tax', label: '所得稅試算' },
  { href: '/tools/overtime', label: '加班費' },
  { href: '/guides', label: '理財指南' },
  { href: '/recommend/credit-cards', label: '信用卡推薦' },
] as const;
