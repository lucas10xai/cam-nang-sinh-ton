import { issue } from '../lib/result.mjs';

export const name = 'schema';
export const description = 'Frontmatter hợp lệ theo schema; chapter khớp thư mục chứa file';

export function run({ entries, schema }) {
  const out = [];
  for (const e of entries) {
    if (e.parseError) {
      out.push(issue('error', name, e, e.parseError));
      continue;
    }
    const res = schema.safeParse(e.data);
    if (!res.success) {
      for (const iss of res.error.issues) {
        const path = iss.path.join('.') || '(gốc)';
        out.push(issue('error', name, e, `Frontmatter sai tại "${path}": ${iss.message}`));
      }
    }
    if (Number.isInteger(e.data.chapter) && e.chapterDir !== null && e.data.chapter !== e.chapterDir) {
      out.push(issue('error', name, e, `chapter=${e.data.chapter} không khớp thư mục chương (${e.chapterDir})`));
    }
  }
  return out;
}
