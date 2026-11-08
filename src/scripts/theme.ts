// Nút đổi giao diện: chu kỳ hệ thống -> sáng -> tối. Chỉ lưu localStorage.
const root = document.documentElement;
const btn = document.getElementById('theme-toggle');
const KEY = 'cnst:theme';

function effective(): 'light' | 'dark' {
  const t = root.dataset.theme;
  if (t === 'light' || t === 'dark') return t;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
btn?.addEventListener('click', () => {
  const next = effective() === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  try { localStorage.setItem(KEY, next); } catch {}
});

// Mở các <details> khi in để căn cứ pháp luật có mặt trên giấy.
addEventListener('beforeprint', () => {
  document.querySelectorAll<HTMLDetailsElement>('details.accordion').forEach((d) => {
    if (!d.open) { d.dataset.wasClosed = '1'; d.open = true; }
  });
});
addEventListener('afterprint', () => {
  document.querySelectorAll<HTMLDetailsElement>('details.accordion[data-was-closed]').forEach((d) => {
    d.open = false; delete d.dataset.wasClosed;
  });
});
