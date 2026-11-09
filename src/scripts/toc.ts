// Ngăn kéo Mục lục: cây Nhóm → Chương → Mục, dựng bằng JS từ graph.json (không nhúng 785 liên kết vào mỗi trang).
// Không có JS: nút "Mục lục" là liên kết tới /chuong/ (cũng gom theo nhóm).
import { loadGraph, entryUrl, esc, fold, isReview, isVerified, type GraphData } from './map/graph';

let drawer: HTMLElement | null = null;
let scrim: HTMLElement | null = null;
let trigger: HTMLElement | null = null;
let data: GraphData | null = null;

const dot = (flags: number) => `<i class="toc-dot ${isReview(flags) ? 'toc-dot--rv' : isVerified(flags) ? 'toc-dot--ok' : ''}" title="${isReview(flags) ? 'Đang rà soát' : isVerified(flags) ? 'Đã đối chiếu nguồn' : 'Chưa kiểm chứng'}"></i>`;

function entryLink(g: GraphData, i: number) {
  const e = g.e[i];
  const code = `${g.c[e[2]].n}.${e[3]}`;
  return `<li><a href="${entryUrl(e[0])}" data-toc-link><span class="toc-n">${code}</span><span>${esc(e[1])}</span>${dot(e[6])}</a></li>`;
}

function renderTree(g: GraphData, body: HTMLElement) {
  body.innerHTML = g.g.map((grp) => {
    const chapters = grp.c.map((ci) => {
      const c = g.c[ci];
      const n = g.e.filter((e) => e[2] === ci).length;
      return `<details class="toc-ch" data-ch="${ci}"><summary><span class="toc-n">${c.n}</span><span>${esc(c.t)}</span><span class="toc-c">${n}</span></summary><ul class="toc-entries"></ul></details>`;
    }).join('');
    return `<details class="toc-group" style="--tone:var(--tone-${grp.k})"><summary><span>${esc(grp.t)}</span><span class="toc-c">${grp.c.length} chương</span></summary>${chapters}</details>`;
  }).join('');
}

function renderSearch(g: GraphData, body: HTMLElement, q: string) {
  const f = fold(q.trim());
  const hits: number[] = [];
  for (let i = 0; i < g.e.length && hits.length < 80; i++) if (fold(g.e[i][1]).includes(f)) hits.push(i);
  body.innerHTML = hits.length ? `<ul class="toc-entries" style="border:0;margin-left:0">${hits.map((i) => entryLink(g, i)).join('')}</ul>` : '<p class="toc-empty">Không có mục nào khớp.</p>';
}

function build(g: GraphData) {
  scrim = document.createElement('div');
  scrim.className = 'drawer__scrim';
  drawer = document.createElement('aside');
  drawer.id = 'toc-drawer';
  drawer.className = 'drawer';
  drawer.setAttribute('aria-label', 'Mục lục');
  drawer.setAttribute('inert', '');
  drawer.innerHTML = `<div class="drawer__bar"><span>Mục lục · nhóm, chương, mục</span><button type="button" class="drawer__x" aria-label="Đóng mục lục"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
    <div class="drawer__find"><label class="visually-hidden" for="toc-q">Lọc mục theo tiêu đề</label><input id="toc-q" type="search" placeholder="lọc theo tiêu đề (không dấu cũng được)" autocomplete="off" /></div>
    <div class="drawer__body"></div>`;
  document.body.append(scrim, drawer);
  const body = drawer.querySelector<HTMLElement>('.drawer__body')!;
  const q = drawer.querySelector<HTMLInputElement>('#toc-q')!;
  renderTree(g, body);
  body.addEventListener('toggle', (e) => {
    const d = e.target as HTMLDetailsElement;
    if (d.classList.contains('toc-ch') && d.open) {
      const ul = d.querySelector('ul')!;
      if (!ul.children.length) {
        const ci = Number(d.dataset.ch);
        ul.innerHTML = g.e.map((en, i) => (en[2] === ci ? entryLink(g, i) : '')).join('');
      }
    }
  }, true);
  q.addEventListener('input', () => (q.value.trim() ? renderSearch(g, body, q.value) : renderTree(g, body)));
  drawer.addEventListener('click', (ev) => {
    const a = (ev.target as HTMLElement).closest<HTMLAnchorElement>('a[data-toc-link]');
    if (a && !ev.ctrlKey && !ev.metaKey && !ev.shiftKey && window.cnstMap?.open(a.getAttribute('href')!)) { ev.preventDefault(); close(false); }
  });
  drawer.querySelector('.drawer__x')!.addEventListener('click', () => close(true));
  scrim.addEventListener('click', () => close(true));
  drawer.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); close(true); }
  });
}

async function open(from: HTMLElement) {
  trigger = from;
  try { data ??= await loadGraph(); } catch { location.href = from.getAttribute('href') ?? '/'; return; }
  if (!drawer) build(data);
  drawer!.removeAttribute('inert');
  drawer!.classList.add('is-open');
  scrim!.classList.add('is-open');
  document.querySelectorAll('[data-toc-open]').forEach((b) => b.setAttribute('aria-expanded', 'true'));
  drawer!.setAttribute('aria-modal', 'false');
  drawer!.querySelector<HTMLInputElement>('#toc-q')!.focus();
}
function close(restore: boolean) {
  if (!drawer) return;
  drawer.classList.remove('is-open');
  scrim!.classList.remove('is-open');
  drawer.setAttribute('inert', '');
  document.querySelectorAll('[data-toc-open]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  if (restore) (trigger && trigger.offsetParent !== null ? trigger : document.getElementById('menu-toggle'))?.focus();
}

document.addEventListener('click', (e) => {
  const t = (e.target as HTMLElement).closest<HTMLElement>('[data-toc-open]');
  if (!t || (e as MouseEvent).ctrlKey || (e as MouseEvent).metaKey || (e as MouseEvent).shiftKey || (e as MouseEvent).button !== 0) return;
  e.preventDefault();
  if (drawer?.classList.contains('is-open')) close(true); else void open(t);
});
document.addEventListener('cnst:toc-open', () => void open(document.getElementById('toc-open') ?? document.body));
