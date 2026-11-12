/**
 * 把表單狀態同步到網址 query string：
 * - 使用者可以複製網址分享「算好的結果」
 * - 文章內可放預填參數的深層連結（有利 SEO 與轉換）
 */
export function readStateFromUrl(form: HTMLFormElement): void {
  const params = new URLSearchParams(location.search);
  if ([...params.keys()].length === 0) return;
  for (const [k, v] of params) {
    const el = form.elements.namedItem(k);
    if (!el) continue;
    if (el instanceof RadioNodeList) {
      el.value = v;
    } else if (el instanceof HTMLInputElement) {
      if (el.type === 'checkbox') el.checked = v === '1' || v === 'true';
      else el.value = v;
    } else if (el instanceof HTMLSelectElement) {
      el.value = v;
    }
  }
}

export function writeStateToUrl(form: HTMLFormElement): void {
  const data = new FormData(form);
  const params = new URLSearchParams();
  for (const [k, v] of data) if (typeof v === 'string' && v !== '') params.set(k, v);
  const qs = params.toString();
  history.replaceState(null, '', qs ? `${location.pathname}?${qs}` : location.pathname);
}

/** 綁定：載入時還原、輸入時計算＋寫回網址 */
export function bindCalculator(form: HTMLFormElement, compute: () => void): void {
  readStateFromUrl(form);
  const run = () => {
    compute();
    writeStateToUrl(form);
  };
  form.addEventListener('input', run);
  form.addEventListener('change', run);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    run();
  });
  compute();
}

/** 複製目前網址 */
export function setupShareButton(btn: HTMLButtonElement | null): void {
  if (!btn) return;
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      const old = btn.textContent;
      btn.textContent = '已複製連結 ✓';
      setTimeout(() => (btn.textContent = old), 1800);
    } catch {
      prompt('複製這個網址：', location.href);
    }
  });
}
