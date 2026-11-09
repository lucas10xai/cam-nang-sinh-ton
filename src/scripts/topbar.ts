// Thanh trên: menu thu gọn trên màn hình hẹp, phím tắt "/" để tìm, hộp khẩn cấp đóng bằng Esc/bấm ra ngoài (xem pop.ts).
const btn = document.getElementById('menu-toggle') as HTMLButtonElement | null;
const panel = document.getElementById('tb-nav');
const header = document.getElementById('site-header');
if (btn && panel && header) {
  const isOpen = () => panel.hasAttribute('data-open');
  const set = (open: boolean) => {
    panel.toggleAttribute('data-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
  };
  btn.addEventListener('click', () => set(!isOpen()));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) { set(false); btn.focus(); }
  });
  header.addEventListener('focusout', (e) => {
    if (isOpen() && e.relatedTarget && !header.contains(e.relatedTarget as Node)) set(false);
  });
  document.addEventListener('click', (e) => {
    if (isOpen() && !header.contains(e.target as Node)) set(false);
  });
  panel.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('a[data-toc-open], button[data-theme-toggle]')) set(false); });
  matchMedia('(min-width: 64rem)').addEventListener('change', () => set(false));
}
// "/" đưa con trỏ vào ô tìm (trừ khi đang gõ ở ô khác).
document.addEventListener('keydown', (e) => {
  if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
  const t = e.target as HTMLElement;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
  const input = (document.getElementById('tb-q') as HTMLInputElement | null);
  if (input && input.offsetParent !== null) { e.preventDefault(); input.focus(); }
});
