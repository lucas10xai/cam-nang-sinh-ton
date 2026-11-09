// Phần tương tác của một mục: nút đánh dấu đã đọc/đã làm, ô tick từng bước. Gọi cho trang tĩnh (document) và cho bảng đọc (nội dung chèn bằng fetch).
import { load, toggle, setStep, type Kind } from './state';

const labels: Record<Kind, [string, string]> = {
  read: ['Đánh dấu đã đọc', 'Đã đọc (bấm để bỏ)'],
  done: ['Đánh dấu đã làm', 'Đã làm (bấm để bỏ)'],
};
function paint(btn: HTMLButtonElement, kind: Kind, on: boolean) {
  btn.setAttribute('aria-pressed', String(on));
  const span = btn.querySelector('span');
  if (span) span.textContent = labels[kind][on ? 1 : 0];
}

export function initEntry(root: ParentNode) {
  const id = root.querySelector<HTMLElement>('[data-entry-id]')?.dataset.entryId;
  if (!id) return;
  const s = load();
  root.querySelectorAll<HTMLButtonElement>('[data-mark]').forEach((btn) => {
    const kind = btn.dataset.mark as Kind;
    paint(btn, kind, id in s[kind]);
    btn.addEventListener('click', () => {
      paint(btn, kind, toggle(kind, id));
      document.dispatchEvent(new CustomEvent('cnst:state'));
    });
  });
  const boxes = root.querySelectorAll<HTMLInputElement>('input[data-step]');
  if (boxes.length) {
    const done = new Set(s.steps[id] ?? []);
    const count = root.querySelector<HTMLElement>('#steps-count');
    const repaint = () => {
      boxes.forEach((b) => b.closest('li')?.classList.toggle('is-done', b.checked));
      if (count) count.textContent = `Đã làm ${[...boxes].filter((b) => b.checked).length}/${boxes.length} bước`;
    };
    boxes.forEach((b) => {
      const i = Number(b.dataset.step);
      b.checked = done.has(i);
      b.addEventListener('change', () => { setStep(id, i, b.checked); repaint(); });
    });
    repaint();
  }
}
