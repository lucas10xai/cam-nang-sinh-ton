import { issue } from '../lib/result.mjs';

export const name = 'sections';
export const description = 'Thân có đủ H2 bắt buộc, đúng thứ tự, không H2 lạ/lặp';

export function run({ entries, config }) {
  const out = [];
  const required = config.requiredSections;
  const order = config.sectionOrder;
  for (const e of entries) {
    const titles = e.sections.map((s) => s.title);
    for (const r of required) {
      if (!titles.includes(r)) out.push(issue('error', name, e, `Thiếu H2 bắt buộc "## ${r}"`));
    }
    const seen = new Set();
    for (const t of titles) {
      if (seen.has(t)) out.push(issue('warn', name, e, `H2 "## ${t}" xuất hiện nhiều lần`));
      seen.add(t);
      if (!order.includes(t)) out.push(issue('warn', name, e, `H2 "## ${t}" không thuộc danh sách quy định`));
    }
    const idx = titles.filter((t) => order.includes(t)).map((t) => order.indexOf(t));
    if (idx.some((v, i) => i > 0 && v < idx[i - 1])) {
      out.push(issue('warn', name, e, `Thứ tự H2 sai; đúng: ${order.join(' → ')}`));
    }
    for (const s of e.sections) {
      if (required.includes(s.title) && s.text === '') out.push(issue('warn', name, e, `Phần "## ${s.title}" rỗng`));
    }
  }
  return out;
}
