import { load, toggle, type Kind } from './state';

const id = document.querySelector<HTMLElement>('[data-entry-id]')?.dataset.entryId;
const labels: Record<Kind, [string, string]> = {
  read: ['Đánh dấu đã đọc', 'Đã đọc (bấm để bỏ)'],
  done: ['Đánh dấu đã làm', 'Đã làm (bấm để bỏ)'],
};
function paint(btn: HTMLButtonElement, kind: Kind, on: boolean) {
  btn.setAttribute('aria-pressed', String(on));
  const span = btn.querySelector('span');
  if (span) span.textContent = labels[kind][on ? 1 : 0];
}
if (id) {
  const s = load();
  document.querySelectorAll<HTMLButtonElement>('[data-mark]').forEach((btn) => {
    const kind = btn.dataset.mark as Kind;
    paint(btn, kind, id in s[kind]);
    btn.addEventListener('click', () => paint(btn, kind, toggle(kind, id)));
  });
}
