/** 工具清單：新增計算機時在這裡登記，首頁、工具總覽、相關工具、sitemap 會自動更新 */
import type { OfferCategory } from '../config/site.ts';

export type Tool = {
  slug: string;
  title: string;
  /** 用於 <title>，含關鍵字 */
  seoTitle: string;
  description: string;
  icon: string;
  category: '貸款' | '稅務' | '薪資' | '投資' | '退休';
  /** 側欄要推薦哪一類聯盟商品 */
  offers: OfferCategory;
  keywords: string[];
};

export const TOOLS: Tool[] = [
  {
    slug: 'mortgage',
    title: '房貸試算',
    seoTitle: '房貸試算｜每月還款、利息總額、寬限期、新青安一次算清楚',
    description: '輸入貸款金額、利率、年限，立即算出每月房貸月付金、總利息，支援寬限期、本金／本息攤還與新青安多段利率。',
    icon: '🏠',
    category: '貸款',
    offers: 'loans',
    keywords: ['房貸試算', '房貸計算機', '新青安試算', '寬限期'],
  },
  {
    slug: 'loan',
    title: '信貸／車貸試算',
    seoTitle: '信貸試算、車貸試算｜月付金與總費用年百分率（APR）計算機',
    description: '信用貸款、汽車貸款每月還款試算，把開辦費算進去，看清楚真正的總費用年百分率。',
    icon: '💳',
    category: '貸款',
    offers: 'loans',
    keywords: ['信貸試算', '車貸試算', '總費用年百分率', '貸款計算機'],
  },
  {
    slug: 'income-tax',
    title: '綜合所得稅試算',
    seoTitle: '2026 綜合所得稅試算｜免稅額、扣除額、級距自動計算',
    description: '依 114 年度最新免稅額、標準扣除額、特別扣除額與基本生活費差額，試算你 2026 年 5 月要繳多少所得稅。',
    icon: '🧾',
    category: '稅務',
    offers: 'creditCards',
    keywords: ['所得稅試算', '綜所稅試算', '所得稅級距', '免稅額'],
  },
  {
    slug: 'overtime',
    title: '加班費計算',
    seoTitle: '加班費計算機｜平日、休息日、國定假日加班費怎麼算（勞基法）',
    description: '依勞基法第 24、39 條倍率，輸入月薪與加班時數，立即算出平日、休息日、國定假日的加班費。',
    icon: '⏰',
    category: '薪資',
    offers: 'creditCards',
    keywords: ['加班費計算', '加班費怎麼算', '休息日加班費', '國定假日加班費'],
  },
  {
    slug: 'compound',
    title: '定期定額複利試算',
    seoTitle: '定期定額複利計算機｜每月投資多少、幾年後會變多少？',
    description: '輸入每月投入金額與預期年化報酬，算出 N 年後資產、本金與獲利，也能反推達成目標每月要投入多少。',
    icon: '📈',
    category: '投資',
    offers: 'brokers',
    keywords: ['定期定額試算', '複利計算機', '複利試算', 'ETF 定期定額'],
  },
  {
    slug: 'pension',
    title: '勞退新制試算',
    seoTitle: '勞退新制試算｜雇主 6%＋自提 6% 退休金有多少？節稅多少？',
    description: '估算勞退新制退休時可累積的退休金、每月可領金額，以及自提 6% 的節稅效果。',
    icon: '🧓',
    category: '退休',
    offers: 'brokers',
    keywords: ['勞退試算', '勞退新制', '勞退自提', '退休金試算'],
  },
];

export function getTool(slug: string): Tool {
  const t = TOOLS.find((x) => x.slug === slug);
  if (!t) throw new Error(`Unknown tool: ${slug}`);
  return t;
}

export function relatedTools(slug: string, n = 3): Tool[] {
  const me = getTool(slug);
  const same = TOOLS.filter((t) => t.slug !== slug && t.category === me.category);
  const others = TOOLS.filter((t) => t.slug !== slug && t.category !== me.category);
  return [...same, ...others].slice(0, n);
}
