// Menu thu gọn trên màn hình hẹp: nút mở/đóng, Esc đóng và trả focus, rời khỏi đầu trang cũng đóng.
const btn = document.getElementById('nav-toggle') as HTMLButtonElement | null;
const nav = document.getElementById('site-nav');
const header = document.getElementById('site-header');
if (btn && nav && header) {
  const isOpen = () => nav.hasAttribute('data-open');
  const set = (open: boolean) => {
    nav.toggleAttribute('data-open', open);
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
  matchMedia('(min-width: 60rem)').addEventListener('change', () => set(false));
}
