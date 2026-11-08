// Kiểm link nội bộ trong dist/ sau build: href/src/srcset trỏ vào đâu thì file đó phải tồn tại; #fragment phải có id trên trang đích.
// Chạy: node src/lib/check-links.mjs [dist]
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';

const dist = resolve(process.argv[2] ?? 'dist');
const pages = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.html')) pages.push(p);
  }
})(dist);

const idCache = new Map();
const idsOf = (file) => {
  if (!idCache.has(file)) {
    const html = readFileSync(file, 'utf8');
    idCache.set(file, new Set([...html.matchAll(/\s(?:id|name)="([^"]+)"/g)].map((m) => m[1])));
  }
  return idCache.get(file);
};
function resolveTarget(pathname) {
  const clean = decodeURIComponent(pathname);
  const abs = join(dist, clean);
  if (existsSync(abs) && statSync(abs).isFile()) return abs;
  const idx = join(abs, 'index.html');
  return existsSync(idx) ? idx : null;
}

let total = 0;
const bad = [];
for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  const rel = '/' + page.slice(dist.length + 1).replace(/index\.html$/, '');
  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const raw = m[1].replace(/&amp;/g, '&');
    if (/^(https?:|mailto:|tel:|data:|javascript:)/.test(raw) || raw.includes('${')) continue; // '${' = chuỗi mẫu trong script nhúng
    total++;
    const u = new URL(raw, 'http://x' + rel);
    const target = resolveTarget(u.pathname);
    if (!target) { bad.push(`${rel} -> ${raw} (không có file)`); continue; }
    if (u.hash && target.endsWith('.html') && !idsOf(target).has(decodeURIComponent(u.hash.slice(1)))) bad.push(`${rel} -> ${raw} (không có #id)`);
  }
}
console.log(`Đã kiểm ${total} liên kết nội bộ trên ${pages.length} trang.`);
if (bad.length) {
  console.log(`LỖI ${bad.length}:`);
  for (const b of bad.slice(0, 50)) console.log('  ' + b);
  process.exit(1);
}
console.log('Không có liên kết chết.');
