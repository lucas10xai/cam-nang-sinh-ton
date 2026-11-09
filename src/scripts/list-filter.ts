// Lọc nhanh danh sách mục của một chương: theo tiêu đề (không dấu cũng được) và pill "Đáng làm cao", "Không tốn tiền".
const input = document.getElementById('c-q') as HTMLInputElement | null;
const rows = [...document.querySelectorAll<HTMLElement>('#c-list > .entry-row')];
const count = document.getElementById('c-count');
const empty = document.getElementById('c-empty');
const pills = [...document.querySelectorAll<HTMLButtonElement>('[data-quick]')];
const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
if (input && count && empty) {
  let quick = '';
  const apply = () => {
    const q = fold(input.value.trim());
    let n = 0;
    for (const r of rows) {
      const ok = (!q || (r.dataset.t ?? '').includes(q)) && (!quick || r.dataset[quick] === '1');
      r.hidden = !ok;
      if (ok) n++;
    }
    count.textContent = n === rows.length ? `${n} mục` : `Đang hiện ${n} / ${rows.length} mục`;
    empty.hidden = n !== 0;
  };
  input.addEventListener('input', apply);
  pills.forEach((b) => b.addEventListener('click', () => {
    quick = b.dataset.quick ?? '';
    pills.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    apply();
  }));
}
