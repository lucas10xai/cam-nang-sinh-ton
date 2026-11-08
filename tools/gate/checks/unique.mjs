import { issue } from '../lib/result.mjs';

export const name = 'unique';
export const description = 'id duy nhất; cặp (chapter, number) duy nhất';

export function run({ entries }) {
  const out = [];
  const ids = new Map();
  const nums = new Map();
  for (const e of entries) {
    if (!e.data) continue;
    const { id, chapter, number } = e.data;
    if (typeof id === 'string') {
      if (ids.has(id)) out.push(issue('error', name, e, `id "${id}" trùng với ${ids.get(id)}`));
      else ids.set(id, e.file);
    }
    if (Number.isInteger(chapter) && Number.isInteger(number)) {
      const k = `${chapter}/${number}`;
      if (nums.has(k)) out.push(issue('error', name, e, `(chapter, number) = (${chapter}, ${number}) trùng với ${nums.get(k)}`));
      else nums.set(k, e.file);
    }
  }
  return out;
}
