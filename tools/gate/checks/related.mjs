import { issue } from '../lib/result.mjs';

export const name = 'related';
export const description = '`related` trỏ tới id tồn tại (và không tự trỏ vào mình)';

export function run({ entries }) {
  const out = [];
  const ids = new Set(entries.map((e) => e.data?.id).filter(Boolean));
  for (const e of entries) {
    if (!e.data || !Array.isArray(e.data.related)) continue;
    for (const r of e.data.related) {
      if (r === e.data.id) out.push(issue('warn', name, e, `related tự trỏ vào chính mục này ("${r}")`));
      else if (!ids.has(r)) out.push(issue('error', name, e, `related trỏ tới id không tồn tại: "${r}"`));
    }
  }
  return out;
}
