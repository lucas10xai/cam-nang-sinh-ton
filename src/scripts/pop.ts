// Hộp giải thích dùng <details data-pop> (chip có giải thích, viên khẩn cấp): mở một cái thì đóng cái khác;
// Esc hoặc bấm ra ngoài thì đóng. Nghe ở document nên dùng được cả với nội dung chèn sau bằng JS.
const all = () => [...document.querySelectorAll<HTMLDetailsElement>('details[data-pop]')];
document.addEventListener('toggle', (e) => {
  const d = e.target as HTMLDetailsElement;
  if (d.matches?.('details[data-pop]') && d.open) all().forEach((o) => { if (o !== d) o.open = false; });
}, true);
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const open = all().find((d) => d.open);
  if (open) { open.open = false; open.querySelector('summary')?.focus(); e.stopPropagation(); }
}, true);
document.addEventListener('click', (e) => {
  all().forEach((d) => { if (d.open && !d.contains(e.target as Node)) d.open = false; });
});
