// Nút đổi giao diện: sáng <-> tối (mặc định theo hệ thống). Chỉ lưu localStorage.
const root = document.documentElement;
const buttons = document.querySelectorAll<HTMLElement>('[data-theme-toggle]');
const KEY = 'cnst:theme';

function effective(): 'light' | 'dark' {
  const t = root.dataset.theme;
  if (t === 'light' || t === 'dark') return t;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
buttons.forEach((btn) => btn.addEventListener('click', () => {
  const next = effective() === 'dark' ? 'light' : 'dark';
  // Chuyển màu êm trong chốc lát, không để hiệu ứng chạy mãi (CSS tôn trọng prefers-reduced-motion).
  root.classList.add('theme-anim');
  root.dataset.theme = next;
  try { localStorage.setItem(KEY, next); } catch {}
  setTimeout(() => root.classList.remove('theme-anim'), 400);
  document.dispatchEvent(new CustomEvent('cnst:theme'));
}));

// Mở các <details> khi in để căn cứ pháp luật có mặt trên giấy.
addEventListener('beforeprint', () => {
  document.querySelectorAll<HTMLDetailsElement>('details.legal-fold').forEach((d) => {
    if (!d.open) { d.dataset.wasClosed = '1'; d.open = true; }
  });
});
addEventListener('afterprint', () => {
  document.querySelectorAll<HTMLDetailsElement>('details.legal-fold[data-was-closed]').forEach((d) => {
    d.open = false; delete d.dataset.wasClosed;
  });
});
