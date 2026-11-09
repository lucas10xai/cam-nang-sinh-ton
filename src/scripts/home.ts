// Trang chủ: bản đồ tri thức (canvas) + bảng thông tin / bảng đọc trượt từ phải, đồng bộ với URL thật bằng History API.
// Không có JS hoặc không có bản đồ: trang vẫn là trang tĩnh đầy đủ (xem index.astro); mọi đường dẫn mở được độc lập.
import { url } from '../lib/url';
import {
  loadGraph, esc, costOf, isReview, isVerified, statusOf, worthOf, entryUrl, chapterUrl, sitUrl, groupUrl,
  type GraphData, type MapBridge,
} from './map/graph';
import { MapView, type Hit } from './map/view';
import { initEntry } from './entry-init';
import { load } from './state';

type Route =
  | { t: 'entry'; i: number } | { t: 'chapter'; i: number } | { t: 'sit'; i: number } | { t: 'group'; i: number }
  | { t: 'coll'; key: 'tinh-huong' | 'nhom' | 'lam-ngay' };

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null;
const stage = $('stage'), host = $('map-host'), intro = $('stage-intro'), panel = $('map-panel'), tip = $('map-tip');
if (!stage || !host || !panel) throw new Error('thiếu khung bản đồ');
const body = panel.querySelector<HTMLElement>('.mpanel__body')!;
const kindEl = panel.querySelector<HTMLElement>('.mpanel__kind')!;
const fullEl = panel.querySelector<HTMLAnchorElement>('.mpanel__full')!;
const root = document.documentElement;
const wide = matchMedia('(min-width: 761px)');
const baseTitle = document.title;
const homePath = url('/');

let g: GraphData | null = null;
let view: MapView | null = null;
let creating: Promise<void> | null = null;
let depth = 0; // số trạng thái đã đẩy vào lịch sử kể từ trang chủ
let opener: HTMLElement | null = null;
let mapBase = 0; // 1 nếu màn hình bản đồ (điện thoại) đã đẩy một trạng thái #ban-do
let current: Route | null = null;
let mapScreenOpen = false;
const pageCache = new Map<string, { article: string; nav: string; title: string }>();

/* Bảng nằm ngay dưới các viên kính của thanh trên, kể cả khi thanh nổi ở đầu trang (còn thanh thông báo phía trên). */
const topbar = $('site-header');
function placePanel() {
  if (topbar) root.style.setProperty('--panel-top', `${Math.max(0, Math.round(topbar.getBoundingClientRect().bottom - 4))}px`);
}
addEventListener('scroll', placePanel, { passive: true });
addEventListener('resize', placePanel);
placePanel();

/* ---------- Dựng bản đồ ---------- */
function insets() {
  if (wide.matches) {
    const open = panel!.classList.contains('is-open');
    const pw = open ? panel!.getBoundingClientRect().width : 0;
    const iw = !open && intro ? intro.getBoundingClientRect().width : 0;
    return { l: iw, r: pw, t: 56, b: 0 };
  }
  const sheet = panel!.classList.contains('is-open') && panel!.dataset.mode === 'info' ? window.innerHeight * 0.55 : 0;
  return { l: 0, r: 0, t: 56, b: sheet };
}

function marks() {
  const s = load();
  return { read: new Set(Object.keys(s.read)), done: new Set(Object.keys(s.done)) };
}

function ensureMap(): Promise<void> {
  return (creating ??= (async () => {
    g = await loadGraph();
    const canvas = document.createElement('canvas');
    canvas.className = 'map__canvas';
    canvas.tabIndex = 0;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', `Bản đồ tri thức: ${g.st.chapters} chương, ${g.st.entries} mục và ${g.st.situations} tình huống nối với nhau. Bản đồ chỉ để xem bằng chuột hoặc cảm ứng; dùng nút Mục lục để duyệt bằng bàn phím. Phím + và - phóng thu, 0 về giữa.`);
    host.append(canvas);
    view = new MapView(canvas, g, {
      insets,
      onSelect: (h) => { if (h) openHit(h); },
      onHover: (h, x, y) => showTip(h, x, y),
    });
    view.setMarks(marks());
    stage.classList.add('is-ready');
    buildLegend();
    syncRoute();
  })().catch((err) => { console.error(err); creating = null; stage.classList.add('is-failed'); }));
}

function showTip(h: Hit, x: number, y: number) {
  if (!tip || !g) return;
  if (!h) { tip.hidden = true; return; }
  let t = '', s = '';
  if (h.k === 'e') { const e = g.e[h.i]; t = e[1]; s = `Chương ${g.c[e[2]].n}, mục ${e[3]}`; }
  else if (h.k === 'c') { const c = g.c[h.i]; t = c.t; s = `Chương ${c.n}`; }
  else { const sit = g.s[h.i]; t = sit.t; s = `Tình huống, ${sit.e.length} mục`; }
  tip.innerHTML = `<small>${esc(s)}</small>${esc(t)}`;
  tip.hidden = false;
  const r = host!.getBoundingClientRect();
  const tw = tip.offsetWidth;
  tip.style.left = `${Math.min(x + 16, r.width - tw - 8)}px`;
  tip.style.top = `${y + 18}px`;
}

function buildLegend() {
  const el = $('map-legend');
  if (!el || !g) return;
  const counts = g.g.map((_, gi) => g!.e.filter((e) => g!.c[e[2]].g === gi).length);
  el.innerHTML = g.g.map((grp, gi) => `<button type="button" class="lg" data-g="${gi}" aria-pressed="false" title="${esc(grp.t)}" style="--tone:var(--tone-${grp.k})"><i class="lg__dot"></i><span class="lg__t">${esc(grp.t)}</span><b>${counts[gi]}</b></button>`).join('')
    + `<span class="lg lg--static" title="Tình huống"><i class="lg__hex"></i><span class="lg__t">Tình huống</span><b>${g.s.length}</b></span>`
    + `<span class="lg lg--static" title="Đang rà soát"><i class="lg__ring"></i><span class="lg__t">Đang rà soát</span><b>${g.st.review}</b></span>`;
  new ResizeObserver(() => stage!.style.setProperty('--legend-h', `${el.offsetHeight}px`)).observe(el);
  el.addEventListener('click', (ev) => {
    const b = (ev.target as HTMLElement).closest<HTMLButtonElement>('button[data-g]');
    if (!b || !view) return;
    const gi = Number(b.dataset.g);
    const on = b.getAttribute('aria-pressed') !== 'true';
    el.querySelectorAll('button[data-g]').forEach((x) => x.setAttribute('aria-pressed', 'false'));
    b.setAttribute('aria-pressed', String(on));
    view.setDim(on ? gi : null);
    if (on) view.focusGroup(gi); else view.fit();
  });
}

/* ---------- Định tuyến ---------- */
function parse(href: string): Route | null {
  if (!g) return null;
  const u = new URL(href, location.href);
  if (u.origin !== location.origin || !u.pathname.startsWith(homePath.replace(/\/$/, ''))) return null;
  const rel = u.pathname.slice(homePath.length - 1) || '/';
  let m: RegExpExecArray | null;
  if ((m = /^\/muc\/([^/]+)\/$/.exec(rel))) { const i = g.e.findIndex((e) => e[0] === m![1]); return i < 0 ? null : { t: 'entry', i }; }
  if ((m = /^\/chuong\/(\d+)\/$/.exec(rel))) { const i = g.c.findIndex((c) => c.n === Number(m![1])); return i < 0 ? null : { t: 'chapter', i }; }
  if (rel === '/tinh-huong/' && u.hash) { const i = g.s.findIndex((s) => `#${s.s}` === u.hash); return i < 0 ? null : { t: 'sit', i }; }
  if (rel === '/chuong/' && u.hash.startsWith('#nhom-')) { const i = g.g.findIndex((x) => `#nhom-${x.s}` === u.hash); return i < 0 ? null : { t: 'group', i }; }
  if (rel === '/' && /^#(tinh-huong|nhom|lam-ngay)$/.test(u.hash)) return { t: 'coll', key: u.hash.slice(1) as 'tinh-huong' | 'nhom' | 'lam-ngay' };
  return null;
}
function hrefOf(r: Route): string {
  if (!g) return homePath;
  switch (r.t) {
    case 'entry': return entryUrl(g.e[r.i][0]);
    case 'chapter': return chapterUrl(g.c[r.i].n);
    case 'sit': return sitUrl(g.s[r.i].s);
    case 'group': return groupUrl(g.g[r.i].s);
    case 'coll': return `${homePath}#${r.key}`;
  }
}
function nodeOf(r: Route): Hit {
  switch (r.t) {
    case 'entry': return { k: 'e', i: r.i };
    case 'chapter': return { k: 'c', i: r.i };
    case 'sit': return { k: 's', i: r.i };
    default: return null;
  }
}

function openHit(h: NonNullable<Hit>) {
  const r: Route = h.k === 'e' ? { t: 'entry', i: h.i } : h.k === 'c' ? { t: 'chapter', i: h.i } : { t: 'sit', i: h.i };
  void go(r, true);
}

async function go(r: Route, push: boolean) {
  await ensureMap();
  if (!g) return;
  const href = hrefOf(r);
  if (push) {
    if (!panel!.classList.contains('is-open')) opener = (document.activeElement as HTMLElement) ?? null;
    depth++;
    history.pushState({ cnst: 1, n: depth }, '', href);
  }
  current = r;
  render(r);
}

/** Bảng thông tin / bảng đọc theo tuyến hiện tại, kèm camera và nút được chọn. */
function render(r: Route) {
  if (!g || !view) return;
  const h = nodeOf(r);
  view.select(h);
  stage.classList.add('has-panel');
  panel!.classList.add('is-open');
  panel!.setAttribute('aria-hidden', 'false');
  panel!.removeAttribute('inert');
  panel!.dataset.mode = r.t === 'entry' ? 'read' : 'info';
  stage!.dataset.pmode = panel!.dataset.mode;
  if (r.t === 'entry') void renderEntry(r.i);
  else renderInfo(r);
  fullEl.href = hrefOf(r);
  // Camera sau khi bảng bắt đầu trượt (khung nhìn đổi theo bề rộng bảng).
  requestAnimationFrame(() => {
    if (h) view!.focus(h);
    else if (r.t === 'group') view!.focusGroup(r.i);
  });
  body.scrollTop = 0;
}

function hidePanel(restoreFocus: boolean) {
  panel!.classList.remove('is-open');
  panel!.setAttribute('aria-hidden', 'true');
  panel!.setAttribute('inert', '');
  stage.classList.remove('has-panel');
  current = null;
  document.title = baseTitle;
  view?.select(null);
  document.querySelectorAll<HTMLButtonElement>('#map-legend button[aria-pressed="true"]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
  view?.setDim(null);
  requestAnimationFrame(() => view?.fit());
  if (restoreFocus) {
    const el = opener && document.contains(opener) ? opener : view ? (host!.querySelector('canvas') as HTMLElement) : null;
    el?.focus({ preventScroll: true });
  }
}

function closePanel() {
  if (!panel!.classList.contains('is-open')) return;
  hidePanel(true);
  const back = depth - mapBase;
  if (back > 0) history.go(-back);
  else if (!mapScreenOpen) history.replaceState({ cnst: 0, n: 0 }, '', homePath);
}

function syncRoute() {
  const r = parse(location.href);
  if (r) { current = r; render(r); } else if (panel!.classList.contains('is-open')) hidePanel(false);
}

/* ---------- Nội dung bảng ---------- */
function kind(text: string, tone?: number) {
  kindEl.textContent = text;
  panel!.style.setProperty('--tone', tone ? `var(--tone-${tone})` : 'var(--accent)');
}
function chips(cost: number) {
  const c = costOf(cost);
  return `<span class="chip">${esc(g!.L.money[c.money])}</span><span class="chip">${esc(g!.L.time[c.time])}</span><span class="chip">${esc(g!.L.will[c.will])}</span>`;
}
function status(flags: number) {
  const s = statusOf(flags);
  const label = esc(g!.L.status[s]);
  if (isReview(flags)) return `<span class="badge badge--review">${label}</span>`;
  return `<span class="vstat vstat--${isVerified(flags) ? 'good' : 'none'}"><i class="vstat__dot" aria-hidden="true"></i>${label}</span>`;
}
function row(i: number) {
  const e = g!.e[i];
  return `<li class="prow"><a class="prow__a" href="${entryUrl(e[0])}"><span class="prow__n">${g!.c[e[2]].n}.${e[3]}</span><span class="prow__t">${esc(e[1])}</span></a><div class="prow__m">${chips(e[7])}${status(e[6])}</div></li>`;
}

function renderInfo(r: Route) {
  if (!g) return;
  const G = g;
  let html = '';
  let doc = '';
  if (r.t === 'chapter') {
    const c = G.c[r.i], grp = G.g[c.g];
    const list = G.e.map((e, i) => (e[2] === r.i ? i : -1)).filter((i) => i >= 0);
    const ok = list.filter((i) => isVerified(G.e[i][6])).length, rv = list.filter((i) => isReview(G.e[i][6])).length;
    kind(`CHƯƠNG ${c.n} · ${grp.t}`, grp.k);
    doc = `Chương ${c.n}: ${c.t}`;
    html = `<h2 class="mpanel__h">${esc(c.t)}</h2><p class="mpanel__d">${esc(c.d)}</p>
      <dl class="mstats"><div><dt>mục</dt><dd>${list.length}</dd></div><div><dt>đối chiếu nguồn</dt><dd>${ok}/${list.length}</dd></div>${rv ? `<div class="mstats--rv"><dt>đang rà soát</dt><dd>${rv}</dd></div>` : ''}</dl>
      <p class="mpanel__act"><a class="btn" href="${entryUrl(G.e[list[0]][0])}">Bắt đầu từ đầu</a><a class="btn btn--ghost" href="${chapterUrl(c.n)}" data-full>Trang chương</a></p>
      <ul class="plist">${list.map(row).join('')}</ul>`;
  } else if (r.t === 'sit') {
    const s = G.s[r.i];
    kind('TÌNH HUỐNG');
    doc = s.t;
    html = `<h2 class="mpanel__h">${esc(s.t)}</h2><p class="mpanel__d">${s.e.length} mục liên quan, xếp theo chương. Bấm một mục để đọc ngay trên bản đồ.</p>
      <p class="mpanel__act"><a class="btn" href="${entryUrl(G.e[s.e[0]][0])}">Bắt đầu từ đầu</a><a class="btn btn--ghost" href="${sitUrl(s.s)}" data-full>Trang tình huống</a></p>
      <ul class="plist">${s.e.map(row).join('')}</ul>`;
  } else if (r.t === 'group') {
    const grp = G.g[r.i];
    kind('NHÓM CHỦ ĐỀ', grp.k);
    doc = grp.t;
    html = `<h2 class="mpanel__h">${esc(grp.t)}</h2><p class="mpanel__d">${esc(grp.d)}</p>
      <ul class="plist plist--ch">${grp.c.map((ci) => {
        const c = G.c[ci];
        const n = G.e.filter((e) => e[2] === ci).length;
        return `<li class="prow"><a class="prow__a" href="${chapterUrl(c.n)}"><span class="prow__n">${c.n}</span><span class="prow__t">${esc(c.t)}</span></a><div class="prow__m"><span class="chip">${n} mục</span></div></li>`;
      }).join('')}</ul>`;
  } else if (r.t === 'coll') {
    if (r.key === 'tinh-huong') {
      kind('BẠN ĐANG GẶP CHUYỆN GÌ?');
      doc = 'Tình huống';
      html = `<h2 class="mpanel__h">Bạn đang gặp chuyện gì?</h2><p class="mpanel__d">Chọn tình huống gần nhất, chúng tôi gom sẵn các mục nên đọc.</p>
        <ul class="plist plist--ch">${G.s.map((s) => `<li class="prow"><a class="prow__a" href="${sitUrl(s.s)}"><span class="prow__n prow__n--hex"></span><span class="prow__t">${esc(s.t)}</span></a><div class="prow__m"><span class="chip">${s.e.length} mục</span></div></li>`).join('')}</ul>`;
    } else if (r.key === 'nhom') {
      kind('THEO NHÓM CHỦ ĐỀ');
      doc = 'Nhóm chủ đề';
      html = `<h2 class="mpanel__h">Theo nhóm chủ đề</h2><p class="mpanel__d">${G.g.length} nhóm, ${G.c.length} chương. Mỗi màu trên bản đồ là một nhóm.</p>
        <ul class="plist plist--ch">${G.g.map((x) => `<li class="prow prow--tone" style="--tone:var(--tone-${x.k})"><a class="prow__a" href="${groupUrl(x.s)}"><span class="prow__t">${esc(x.t)}</span></a><p class="prow__d">${esc(x.d)}</p><div class="prow__m"><span class="chip">${x.c.length} chương</span></div></li>`).join('')}</ul>`;
    } else {
      const list = G.e.map((e, i) => (worthOf(e[6]) === 2 ? i : -1)).filter((i) => i >= 0);
      kind('VIỆC LÀM NGAY');
      doc = 'Việc làm ngay';
      html = `<h2 class="mpanel__h">Việc làm ngay, không cần đọc dài</h2><p class="mpanel__d">${list.length} mục có lợi ích lớn mà gần như không tốn tiền, thời gian hay ý chí (phán đoán của người biên soạn, không phải bằng chứng). Xem huy hiệu kiểm chứng của từng mục trước khi làm theo.</p>
        <ul class="plist">${list.map(row).join('')}</ul>`;
    }
  }
  document.title = `${doc} · ${baseTitle.split(':')[0]}`;
  body.innerHTML = html;
  panel!.setAttribute('aria-label', doc);
}

async function renderEntry(i: number) {
  if (!g) return;
  const e = g.e[i], c = g.c[e[2]], grp = g.g[c.g];
  const total = g.e.filter((x) => x[2] === e[2]).length;
  kind(`CHƯƠNG ${c.n} · MỤC ${e[3]}/${total}`, grp.k);
  panel!.setAttribute('aria-label', e[1]);
  document.title = `${e[1]} · ${baseTitle.split(':')[0]}`;
  const href = entryUrl(e[0]);
  body.innerHTML = '<p class="mpanel__loading" role="status">Đang mở mục…</p>';
  try {
    let page = pageCache.get(href);
    if (!page) {
      const res = await fetch(href);
      if (!res.ok) throw new Error(String(res.status));
      const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
      const art = doc.querySelector('article.entry'), nav = doc.querySelector('nav.entry-nav');
      if (!art) throw new Error('không có article');
      page = { article: art.outerHTML, nav: nav?.outerHTML ?? '', title: doc.title };
      pageCache.set(href, page);
    }
    if (current?.t !== 'entry' || current.i !== i) return; // người đọc đã chuyển sang mục khác
    body.innerHTML = `<div class="mpanel__read">${page.article}${page.nav}</div>`;
    initEntry(body);
    body.scrollTop = 0;
    body.querySelector<HTMLElement>('h1')?.setAttribute('tabindex', '-1');
    body.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
  } catch {
    location.href = href; // lỗi mạng: mở trang tĩnh như bình thường
  }
}

/* ---------- Sự kiện ---------- */
panel.addEventListener('click', (ev) => {
  const t = ev.target as HTMLElement;
  if (t.closest('.mpanel__x')) { closePanel(); return; }
  const a = t.closest<HTMLAnchorElement>('a[href]');
  if (!a || a.hasAttribute('data-full') || a.classList.contains('mpanel__full')) return;
  if (ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey || (ev as MouseEvent).button !== 0) return;
  const hash = a.getAttribute('href')!;
  if (hash.startsWith('#')) { // mục lục nội bộ của bài: cuộn trong bảng, không đổi URL
    ev.preventDefault();
    body.querySelector(`#${CSS.escape(decodeURIComponent(hash.slice(1)))}`)?.scrollIntoView({ block: 'start' });
    return;
  }
  const r = parse(a.href);
  if (r) { ev.preventDefault(); void go(r, true); }
});
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' && panel.classList.contains('is-open')) {
    if (document.querySelector('details[data-pop][open], .drawer.is-open, .tb--nav[data-open]')) return;
    ev.preventDefault(); closePanel();
  }
});
addEventListener('popstate', () => {
  depth = (history.state && history.state.n) || 0;
  const r = parse(location.href);
  if (location.hash === '#ban-do') {
    if (!wide.matches) openMapScreen(false);
    if (panel.classList.contains('is-open')) hidePanel(false);
  } else if (r) {
    if (!wide.matches) { mapScreenOpen = true; root.classList.add('map-open'); }
    void ensureMap().then(() => { current = r; render(r); });
  } else {
    if (panel.classList.contains('is-open')) hidePanel(false);
    if (mapScreenOpen) { mapScreenOpen = false; root.classList.remove('map-open'); }
  }
});
document.addEventListener('cnst:state', () => view?.setMarks(marks()));
addEventListener('storage', (e) => { if (e.key === 'cnst:state:v1') view?.setMarks(marks()); });

// Thẻ bộ sưu tập ở cột trái, liên kết thật tới các mục tĩnh bên dưới trang.
document.querySelectorAll<HTMLAnchorElement>('a[data-coll]').forEach((a) => a.addEventListener('click', (ev) => {
  if (!wide.matches || ev.ctrlKey || ev.metaKey || ev.shiftKey) return;
  ev.preventDefault();
  void go({ t: 'coll', key: a.dataset.coll as 'tinh-huong' | 'nhom' | 'lam-ngay' }, true);
}));
// Các thẻ tình huống tĩnh cũng mở bảng khi bản đồ đang chạy (màn hình rộng).
document.querySelectorAll<HTMLAnchorElement>('a[data-sit]').forEach((a) => a.addEventListener('click', (ev) => {
  if (!wide.matches || !creating || ev.ctrlKey || ev.metaKey || ev.shiftKey) return;
  void ensureMap().then(() => { const r = parse(a.href); if (r) { ev.preventDefault(); void go(r, true); } });
}));

$('zoom-in')?.addEventListener('click', () => view?.zoomBy(1.4));
$('zoom-out')?.addEventListener('click', () => view?.zoomBy(1 / 1.4));
$('zoom-fit')?.addEventListener('click', () => view?.fit());

/* ---------- Màn hình bản đồ trên điện thoại ---------- */
function openMapScreen(push: boolean) {
  mapScreenOpen = true;
  root.classList.add('map-open');
  if (push) { mapBase = 1; depth++; history.pushState({ cnst: 2, n: depth }, '', `${homePath}#ban-do`); }
  void ensureMap().then(() => { view?.resize(); view?.fit(false); });
  $('map-close')?.focus({ preventScroll: true });
}
function closeMapScreen() {
  if (panel!.classList.contains('is-open')) hidePanel(false);
  mapScreenOpen = false;
  root.classList.remove('map-open');
  if (depth > 0) history.go(-depth); else history.replaceState({ cnst: 0, n: 0 }, '', homePath);
  mapBase = 0;
  $('open-map')?.focus({ preventScroll: true });
}
$('open-map')?.addEventListener('click', () => openMapScreen(true));
$('map-close')?.addEventListener('click', () => closeMapScreen());
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' && mapScreenOpen && !panel.classList.contains('is-open')) closeMapScreen();
});
wide.addEventListener('change', () => {
  mapScreenOpen = false; root.classList.remove('map-open');
  if (wide.matches) void ensureMap().then(() => { view?.resize(); view?.fit(false); });
});

/* ---------- Cầu nối với ngăn kéo Mục lục ---------- */
const bridge: MapBridge = {
  open(href: string) {
    if (!g) { // chưa tải bản đồ: nhờ tải rồi mở; trả true nếu đường dẫn là mục/chương
      const m = /\/(muc|chuong)\/[^/]+\/?$/.test(new URL(href, location.href).pathname);
      if (m) void ensureMap().then(() => { const r = parse(href); if (r) { if (!wide.matches) openMapScreen(true); void go(r, true); } else location.href = href; });
      return m;
    }
    const r = parse(href);
    if (!r) return false;
    if (!wide.matches && !mapScreenOpen) openMapScreen(true);
    void go(r, true);
    return true;
  },
};
window.cnstMap = bridge;

/* ---------- Khởi động ---------- */
const onIdle = (fn: () => void) => ('requestIdleCallback' in window ? window.requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 400));
if (location.hash === '#ban-do' && !wide.matches) openMapScreen(false);
else if (wide.matches) onIdle(() => void ensureMap().then(() => {
  const n = new URLSearchParams(location.search).get('n');
  if (n && g) { const i = g.e.findIndex((e) => e[0] === n); if (i >= 0) { view?.select({ k: 'e', i }); view?.focus({ k: 'e', i }); } }
}));
