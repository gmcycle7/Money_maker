const ntd = new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 0 });
const ntd2 = new Intl.NumberFormat('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 以千分位格式化新台幣（整數） */
export function money(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return `NT$${ntd.format(Math.round(n))}`;
}

/** 純數字千分位 */
export function num(n: number, decimals = 0): string {
  if (!Number.isFinite(n)) return '—';
  return decimals ? ntd2.format(n) : ntd.format(Math.round(n));
}

/** 百分比 */
export function pct(n: number, decimals = 2): string {
  if (!Number.isFinite(n)) return '—';
  return `${(n * 100).toFixed(decimals)}%`;
}

/** 以「萬」為單位顯示，例：12,345,678 → 1,234.6 萬 */
export function wan(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const w = n / 10_000;
  return `${new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 1 }).format(w)} 萬`;
}

/** 安全讀取 input 數值 */
export function readNumber(el: HTMLInputElement | HTMLSelectElement | null, fallback = 0): number {
  if (!el) return fallback;
  const v = parseFloat(String(el.value).replace(/[,\s]/g, ''));
  return Number.isFinite(v) ? v : fallback;
}
