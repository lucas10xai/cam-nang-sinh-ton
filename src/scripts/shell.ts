// Khung trang: drawer sidebar trên màn hình hẹp, số mục "Việc của tôi", đưa chương đang xem vào vùng nhìn của sidebar.
import { load } from './state';

const body = document.body;
const btn = document.getElementById('menu-toggle') as HTMLButtonElement | null;
const sidebar = document.getElementById('sidebar');
const scrim = document.getElementById('scrim');
const narrow = matchMedia('(max-width: 63.99rem)');

function setNav(open: boolean, restoreFocus = false) {
  body.classList.toggle('nav-open', open);
  btn?.setAttribute('aria-expanded', String(open));
  btn?.setAttribute('aria-label', open ? 'Đóng danh mục' : 'Mở danh mục');
  if (open) sidebar?.querySelector<HTMLElement>('a')?.focus();
  else if (restoreFocus) btn?.focus();
}
btn?.addEventListener('click', () => setNav(!body.classList.contains('nav-open')));
scrim?.addEventListener('click', () => setNav(false, true));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && body.classList.contains('nav-open')) { setNav(false, true); }
});
sidebar?.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('a')) setNav(false); });
narrow.addEventListener('change', () => setNav(false));

// Đưa chương đang xem vào giữa vùng nhìn của sidebar (chỉ cuộn sidebar, không cuộn trang).
function revealCurrent() {
  const cur = sidebar?.querySelector<HTMLElement>('.sch a[aria-current]');
  if (!sidebar || !cur) return;
  const top = cur.getBoundingClientRect().top - sidebar.getBoundingClientRect().top + sidebar.scrollTop;
  sidebar.scrollTop = Math.max(0, top - sidebar.clientHeight / 2 + cur.offsetHeight / 2);
}
revealCurrent();

// Số mục đã lưu ở "Việc của tôi".
function paintCount() {
  const el = document.getElementById('todo-count');
  if (!el) return;
  const s = load();
  const n = Object.keys(s.done).length + Object.keys(s.read).length;
  el.textContent = String(n);
  el.hidden = n === 0;
}
paintCount();
document.addEventListener('cnst:state', paintCount);
