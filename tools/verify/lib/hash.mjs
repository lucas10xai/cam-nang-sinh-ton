import { createHash } from 'node:crypto';
import { splitFrontmatter } from '../../gate/lib/load.mjs';

// Sắp khóa đệ quy để băm không phụ thuộc thứ tự khóa trong frontmatter.
function canonical(v) {
  if (Array.isArray(v)) return v.map(canonical);
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.keys(v).sort().map((k) => [k, canonical(v[k])]));
  }
  return v;
}

/**
 * content_sha256 của một mục: sha256( JSON chuẩn hóa của frontmatter trừ `verification` + "\n---\n" + thân ).
 * Thân đã chuẩn hóa xuống dòng (CRLF → LF), không cắt khoảng trắng.
 * Ném lỗi nếu frontmatter hỏng.
 */
export function entryHash(raw) {
  const fm = splitFrontmatter(raw);
  if (!fm.data) throw new Error(fm.error);
  const { verification: _omit, ...rest } = fm.data;
  const payload = JSON.stringify(canonical(rest)) + '\n---\n' + fm.body;
  return createHash('sha256').update(payload, 'utf8').digest('hex');
}
