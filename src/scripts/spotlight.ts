// Hộp tìm kiếm nhanh (phím / hoặc Ctrl/⌘+K). Pagefind chỉ được nạp khi người dùng mở hộp lần đầu.
import { url } from '../lib/url';

const dlg = document.getElementById('spot') as HTMLDialogElement | null;
const input = document.getElementById('spot-q') as HTMLInputElement | null;
const list = document.getElementById('spot-list') as HTMLUListElement | null;
const status = document.getElementById('spot-status');
const all = document.getElementById('spot-all') as HTMLAnchorElement | null;
const MAX = 8;
const HINT = 'Gõ để tìm. Gõ không dấu cũng được: “lam them gio” ra “làm thêm giờ”.';

if (dlg && input && list && status && all && typeof dlg.showModal === 'function') {
  let pf: Promise<any> | null = null;
  let seq = 0;
  let timer = 0;
  let active = -1;

  // Một lời hứa duy nhất: mở hộp (nạp trước) và gõ phím đầu tiên không được khởi tạo Pagefind hai lần.
  const ensure = () => (pf ??= (async () => {
    const path = url('/pagefind/pagefind.js');
    const mod = await import(/* @vite-ignore */ path);
    await mod.options({ baseUrl: url('/') });
    await mod.init();
    return mod;
  })().catch((err) => { pf = null; throw err; }));
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
  const items = () => [...list.querySelectorAll<HTMLElement>('.spot__item')];
  const setActive = (i: number) => {
    const els = items();
    if (!els.length) { active = -1; input.removeAttribute('aria-activedescendant'); return; }
    active = (i + els.length) % els.length;
    els.forEach((el, k) => el.setAttribute('aria-selected', String(k === active)));
    input.setAttribute('aria-activedescendant', els[active].id);
    els[active].scrollIntoView({ block: 'nearest' });
  };
  const clear = (msg: string) => {
    list.replaceChildren();
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    active = -1;
    status.textContent = msg;
    status.hidden = false;
  };
  const link = (q: string) => (all.href = q ? `${url('/tim-kiem/')}?q=${encodeURIComponent(q)}` : url('/tim-kiem/'));

  async function run(q: string) {
    const my = ++seq;
    link(q.trim());
    if (!q.trim()) { clear(HINT); return; }
    status.textContent = 'Đang tìm…';
    status.hidden = false;
    try {
      const p = await ensure();
      const res = await p.search(q);
      if (my !== seq) return;
      const data = await Promise.all(res.results.slice(0, MAX).map((r: any) => r.data()));
      if (my !== seq) return;
      if (!data.length) { clear(`Không thấy mục nào khớp với “${q.trim()}”. Thử từ ngắn hơn.`); return; }
      list.innerHTML = data.map((d: any, i: number) =>
        `<li class="spot__item" id="spot-i${i}" role="option" aria-selected="false"><a href="${esc(d.url)}">${d.meta?.chuong ? `<div class="spot__meta">${esc(d.meta.chuong)}</div>` : ''}<div class="spot__title">${esc(d.meta?.title ?? d.url)}</div><div class="spot__ex">${d.excerpt}</div></a></li>`).join('');
      list.hidden = false;
      status.hidden = true;
      input.setAttribute('aria-expanded', 'true');
      setActive(0);
    } catch (err) {
      clear('Chưa tải được chỉ mục tìm kiếm. Chỉ mục được tạo sau khi build (pnpm build); ở chế độ dev thì chưa có.');
      console.error(err);
    }
  }

  const open = () => {
    if (dlg.open) return;
    dlg.showModal();
    input.select();
    void ensure().catch(() => {});
  };
  document.getElementById('spot-open')?.addEventListener('click', (e) => {
    if ((e as MouseEvent).ctrlKey || (e as MouseEvent).metaKey || (e as MouseEvent).shiftKey) return;
    e.preventDefault();
    open();
  });
  document.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey) && !e.altKey) { e.preventDefault(); open(); return; }
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !typing && !dlg.open) { e.preventDefault(); open(); }
  });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); }); // bấm vào vùng mờ ngoài hộp
  dlg.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('a[href]')) dlg.close(); });
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = window.setTimeout(() => void run(input.value), 110);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const el = items()[active];
      const a = el?.querySelector<HTMLAnchorElement>('a');
      if (a && !list.hidden) location.href = a.href;
      else if (input.value.trim()) location.href = all.href;
    }
  });
  list.addEventListener('mousemove', (e) => {
    const li = (e.target as HTMLElement).closest<HTMLElement>('.spot__item');
    if (li) { const i = items().indexOf(li); if (i !== active) setActive(i); }
  });
}
