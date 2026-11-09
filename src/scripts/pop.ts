// Hộp giải thích (details.pop): mở một cái thì đóng cái khác; Esc hoặc bấm ra ngoài thì đóng.
const pops = [...document.querySelectorAll<HTMLDetailsElement>('details.pop')];
pops.forEach((d) => d.addEventListener('toggle', () => {
  if (d.open) pops.forEach((o) => { if (o !== d) o.open = false; });
}));
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const open = pops.find((d) => d.open);
  if (open) { open.open = false; open.querySelector('summary')?.focus(); }
});
document.addEventListener('click', (e) => {
  pops.forEach((d) => { if (d.open && !d.contains(e.target as Node)) d.open = false; });
});
