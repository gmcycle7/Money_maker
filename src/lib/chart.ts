/**
 * 極簡 SVG 折線圖（無相依套件），回傳 SVG 字串。
 * 顏色使用 CSS 變數，自動支援深色模式。
 */
export type Series = { name: string; values: number[]; color: string; dashed?: boolean };

export type ChartOptions = {
  width?: number;
  height?: number;
  /** y 軸數值格式化 */
  formatY?: (v: number) => string;
  /** x 軸每隔幾點顯示一個標籤 */
  xStep?: number;
  title?: string;
};

const defaultFormatY = (v: number) =>
  Math.abs(v) >= 10_000 ? `${Math.round(v / 10_000).toLocaleString('zh-TW')}萬` : Math.round(v).toLocaleString('zh-TW');

export function lineChart(labels: string[], series: Series[], opts: ChartOptions = {}): string {
  const W = opts.width ?? 640;
  const H = opts.height ?? 280;
  const pad = { l: 56, r: 16, t: 16, b: 36 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const n = labels.length;
  if (n === 0) return '';

  const all = series.flatMap((s) => s.values).filter((v) => Number.isFinite(v));
  const rawMax = Math.max(0, ...all);
  const max = niceCeil(rawMax || 1);
  const fmt = opts.formatY ?? defaultFormatY;

  const x = (i: number) => pad.l + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v: number) => pad.t + ih - (Math.max(0, v) / max) * ih;

  const gridLines = 4;
  let grid = '';
  for (let g = 0; g <= gridLines; g++) {
    const v = (max / gridLines) * g;
    const yy = y(v);
    grid += `<line x1="${pad.l}" y1="${yy.toFixed(1)}" x2="${W - pad.r}" y2="${yy.toFixed(1)}" stroke="var(--border)" stroke-width="1"/>`;
    grid += `<text x="${pad.l - 8}" y="${(yy + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="var(--muted)">${fmt(v)}</text>`;
  }

  const step = opts.xStep ?? Math.max(1, Math.ceil(n / 8));
  let xlabels = '';
  labels.forEach((lab, i) => {
    if (i % step === 0 || i === n - 1) {
      xlabels += `<text x="${x(i).toFixed(1)}" y="${H - 12}" text-anchor="middle" font-size="11" fill="var(--muted)">${escape(lab)}</text>`;
    }
  });

  const lines = series
    .map((s) => {
      const pts = s.values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
      const dash = s.dashed ? ' stroke-dasharray="6 4"' : '';
      return `<polyline fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"${dash} points="${pts}"><title>${escape(s.name)}</title></polyline>`;
    })
    .join('');

  const legend = series
    .map((s) => `<span><i style="background:${s.color}"></i>${escape(s.name)}</span>`)
    .join('');

  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escape(opts.title ?? '圖表')}" xmlns="http://www.w3.org/2000/svg">${grid}${xlabels}${lines}</svg><div class="legend">${legend}</div>`;
}

function niceCeil(v: number): number {
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * exp;
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
