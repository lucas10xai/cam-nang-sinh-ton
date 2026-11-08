// Ô tick từng bước của một mục, lưu localStorage theo id mục + chỉ số bước.
import { load, setStep } from './state';

const id = document.querySelector<HTMLElement>('[data-entry-id]')?.dataset.entryId;
if (id && document.querySelector('input[data-step]')) {
  const done = new Set(load().steps[id] ?? []);
  const boxes = document.querySelectorAll<HTMLInputElement>('input[data-step]');
  const count = document.getElementById('steps-count');
  const paint = () => {
    boxes.forEach((b) => b.closest('li')?.classList.toggle('is-done', b.checked));
    if (count) count.textContent = `Đã làm ${[...boxes].filter((b) => b.checked).length}/${boxes.length} bước`;
  };
  boxes.forEach((b) => {
    const i = Number(b.dataset.step);
    b.checked = done.has(i);
    b.addEventListener('change', () => { setStep(id, i, b.checked); paint(); });
  });
  paint();
}
