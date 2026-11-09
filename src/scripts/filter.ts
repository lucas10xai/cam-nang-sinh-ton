// Lọc client-side trên danh sách đã render sẵn trong HTML. Trạng thái lọc nằm trong URL (?ev=A&ch=13).
const GROUPS = ['ev', 'worth', 'money', 'time', 'will', 'vs', 'sit'] as const;
const MORE = new Set(['time', 'will', 'vs', 'sit']);
const form = document.getElementById('filters') as HTMLFormElement;
const q = document.getElementById('f-q') as HTMLInputElement;
const ch = document.getElementById('f-ch') as HTMLSelectElement;
const count = document.getElementById('f-count')!;
const empty = document.getElementById('f-empty')!;
const rows = [...document.querySelectorAll<HTMLElement>('#f-list > .entry-row')];

const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

function readUrl() {
  const p = new URLSearchParams(location.search);
  q.value = p.get('q') ?? '';
  ch.value = p.get('ch') ?? '';
  for (const g of GROUPS) {
    const vals = new Set((p.get(g) ?? '').split(',').filter(Boolean));
    form.querySelectorAll<HTMLInputElement>(`input[name="${g}"]`).forEach((i) => (i.checked = vals.has(i.value)));
    if (vals.size && MORE.has(g)) (document.getElementById('f-more') as HTMLDetailsElement).open = true;
  }
}
function selected(g: string) {
  return new Set([...form.querySelectorAll<HTMLInputElement>(`input[name="${g}"]:checked`)].map((i) => i.value));
}
function apply(pushUrl: boolean) {
  const text = fold(q.value.trim());
  const sel = Object.fromEntries(GROUPS.map((g) => [g, selected(g)]));
  let n = 0;
  for (const r of rows) {
    const d = r.dataset;
    let ok = (!ch.value || d.ch === ch.value) && (!text || (d.t ?? '').includes(text));
    for (const g of GROUPS) {
      if (!ok || !sel[g].size) continue;
      const have = (d[g] ?? '').split(' ').filter(Boolean); // data-sit có thể nhiều giá trị
      if (!have.some((v) => sel[g].has(v))) ok = false;
    }
    r.hidden = !ok;
    if (ok) n++;
  }
  count.textContent = `Đang hiện ${n} / ${rows.length} mục`;
  empty.hidden = n !== 0;
  if (pushUrl) {
    const p = new URLSearchParams();
    if (q.value.trim()) p.set('q', q.value.trim());
    if (ch.value) p.set('ch', ch.value);
    for (const g of GROUPS) if (sel[g].size) p.set(g, [...sel[g]].join(','));
    const s = p.toString();
    history.replaceState(null, '', s ? `?${s}` : location.pathname);
  }
}
form.addEventListener('input', () => apply(true));
document.getElementById('f-reset')!.addEventListener('click', () => {
  form.reset();
  apply(true);
});
readUrl();
// Màn hình hẹp: thu bộ lọc lại cho khỏi chiếm chỗ (trừ khi URL đã mang điều kiện lọc); màn hình rộng giữ mở.
const panel = document.getElementById('f-panel') as HTMLDetailsElement | null;
if (panel && matchMedia('(max-width: 47.99rem)').matches) panel.open = location.search.length > 1;
apply(false);
