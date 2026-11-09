// Lọc nhanh danh sách mục của một chương theo tiêu đề (không dấu cũng được).
const input = document.getElementById('c-q') as HTMLInputElement | null;
const rows = [...document.querySelectorAll<HTMLElement>('#c-list > .entry-row')];
const count = document.getElementById('c-count');
const empty = document.getElementById('c-empty');
const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
if (input && count && empty) {
  const apply = () => {
    const q = fold(input.value.trim());
    let n = 0;
    for (const r of rows) {
      const ok = !q || (r.dataset.t ?? '').includes(q);
      r.hidden = !ok;
      if (ok) n++;
    }
    count.textContent = n === rows.length ? `${n} mục` : `${n} trên ${rows.length} mục khớp`;
    empty.hidden = n !== 0;
  };
  input.addEventListener('input', apply);
}
