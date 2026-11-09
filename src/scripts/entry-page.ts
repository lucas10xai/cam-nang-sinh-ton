import { initEntry } from './entry-init';
initEntry(document);

// "Trên trang này": tô đậm mục đang đọc.
const links = [...document.querySelectorAll<HTMLAnchorElement>('.side-toc a[href^="#"]')];
if (links.length && 'IntersectionObserver' in window) {
  const map = new Map<string, HTMLAnchorElement>();
  for (const a of links) map.set(decodeURIComponent(a.hash.slice(1)), a);
  const targets = [...map.keys()].map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
  const visible = new Set<string>();
  const paint = () => {
    const first = targets.find((t) => visible.has(t.id));
    links.forEach((a) => a.toggleAttribute('aria-current', !!first && map.get(first.id) === a));
  };
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) (en.isIntersecting ? visible.add(en.target.id) : visible.delete(en.target.id));
    paint();
  }, { rootMargin: '-60px 0px -65% 0px' });
  targets.forEach((t) => io.observe(t));
}

// Mở căn cứ pháp luật khi liên kết neo trỏ vào bên trong.
function openLegalFromHash() {
  const el = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (el instanceof HTMLDetailsElement) el.open = true;
}
openLegalFromHash();
addEventListener('hashchange', openLegalFromHash);
