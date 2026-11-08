import { issue } from '../lib/result.mjs';

export const name = 'verification';
export const description = 'Trạng thái source-checked/cross-checked/expert-reviewed phải có checked_at và sources';

const STRONG = new Set(['source-checked', 'cross-checked', 'expert-reviewed']);

export function run({ entries }) {
  const out = [];
  for (const e of entries) {
    const v = e.data?.verification;
    if (!v || !STRONG.has(v.status)) continue;
    if (!v.checked_at) out.push(issue('error', name, e, `status=${v.status} nhưng thiếu verification.checked_at`));
    if (!Array.isArray(v.sources) || v.sources.length === 0) {
      out.push(issue('error', name, e, `status=${v.status} nhưng verification.sources rỗng`));
    }
    if (v.status === 'expert-reviewed' && !v.checker) {
      out.push(issue('error', name, e, 'status=expert-reviewed nhưng thiếu verification.checker (tên chuyên gia)'));
    }
  }
  return out;
}
