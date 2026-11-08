import { load, save, toggle, type Kind } from './state';

type Item = { id: string; code: string; title: string };
const index: Item[] = JSON.parse(document.getElementById('entry-index')!.textContent ?? '[]');
const byId = new Map(index.map((i) => [i.id, i]));

function fmt(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}
function render(kind: Kind) {
  const s = load();
  const ul = document.getElementById(`${kind}-list`)!;
  const ids = Object.entries(s[kind]).sort((a, b) => b[1].localeCompare(a[1]));
  ul.replaceChildren();
  let n = 0;
  for (const [id, when] of ids) {
    const it = byId.get(id);
    if (!it) continue; // mục đã bị gỡ khỏi nội dung
    n++;
    const li = document.createElement('li');
    li.className = 'todo-item';
    const a = document.createElement('a');
    a.href = `/muc/${id}/`;
    const small = document.createElement('small');
    small.textContent = it.code;
    a.append(small, it.title, ` (${fmt(when)})`);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn--ghost';
    b.textContent = 'Bỏ';
    b.setAttribute('aria-label', `Bỏ đánh dấu: ${it.title}`);
    b.addEventListener('click', () => { toggle(kind, id); renderAll(); });
    li.append(a, b);
    ul.append(li);
  }
  document.getElementById(`${kind}-n`)!.textContent = n ? `(${n})` : '';
  document.getElementById(`${kind}-empty`)!.hidden = n > 0;
}
function renderAll() { render('done'); render('read'); }
document.getElementById('clear-all')!.addEventListener('click', () => {
  if (confirm('Xóa toàn bộ đánh dấu đã đọc và đã làm trên trình duyệt này?')) {
    save({ read: {}, done: {} });
    renderAll();
  }
});
renderAll();
