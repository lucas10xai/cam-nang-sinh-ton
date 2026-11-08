// Tìm kiếm bằng Pagefind (chỉ mục sinh sau build, xem package.json "build"). Pagefind tự bỏ dấu khi lập chỉ mục và khi truy vấn.
const form = document.getElementById('search-form') as HTMLFormElement;
const input = document.getElementById('q') as HTMLInputElement;
const status = document.getElementById('search-status')!;
const list = document.getElementById('search-results')!;
const more = document.getElementById('more') as HTMLButtonElement;
const PAGE = 20;

let pf: any = null;
let results: any[] = [];
let shown = 0;
let seq = 0;

async function ensure() {
  if (pf) return pf;
  const path = '/pagefind/pagefind.js';
  pf = await import(/* @vite-ignore */ path);
  await pf.init();
  return pf;
}

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

async function renderMore(mySeq: number) {
  const slice = results.slice(shown, shown + PAGE);
  const data = await Promise.all(slice.map((r) => r.data()));
  if (mySeq !== seq) return;
  for (const d of data) {
    const li = document.createElement('li');
    li.className = 'search-hit';
    const ch = d.meta?.chuong ? `<div class="search-hit__meta">${esc(d.meta.chuong)}</div>` : '';
    li.innerHTML = `${ch}<h3><a href="${esc(d.url)}">${esc(d.meta?.title ?? d.url)}</a></h3><p>${d.excerpt}</p>`;
    list.appendChild(li);
  }
  shown += slice.length;
  more.hidden = shown >= results.length;
}

async function run(q: string) {
  const mySeq = ++seq;
  list.innerHTML = '';
  more.hidden = true;
  shown = 0;
  if (!q.trim()) { status.textContent = ''; return; }
  status.textContent = 'Đang tìm…';
  try {
    const p = await ensure();
    const res = await p.search(q);
    if (mySeq !== seq) return;
    results = res.results;
    status.textContent = results.length
      ? `${results.length} mục khớp với “${q}”.`
      : `Không thấy mục nào khớp với “${q}”. Thử từ ngắn hơn hoặc từ đồng nghĩa.`;
    await renderMore(mySeq);
  } catch (err) {
    status.textContent = 'Chưa tải được chỉ mục tìm kiếm. Chỉ mục được tạo sau khi build (pnpm build); ở chế độ dev thì chưa có.';
    console.error(err);
  }
}

form.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const q = input.value;
  history.replaceState(null, '', q ? `?q=${encodeURIComponent(q)}` : location.pathname);
  run(q);
});
more.addEventListener('click', () => renderMore(seq));
const q0 = new URLSearchParams(location.search).get('q');
if (q0) { input.value = q0; run(q0); }
