// Trích và chuẩn hóa số kiểu Việt Nam. Xem docs/gate.md để biết heuristic.

const UNIT_RE = '(%|triệu|tr(?![\\p{L}])|tỷ|tỉ|nghìn|ngàn|k(?![\\p{L}])|đồng|đ(?![\\p{L}])|vnđ|vnd)';
const MULT = { triệu: 1e6, tr: 1e6, tỷ: 1e9, tỉ: 1e9, nghìn: 1e3, ngàn: 1e3, k: 1e3 };

// Các mẫu cần xóa khỏi văn bản trước khi tìm số (không phải khẳng định số liệu).
const STRIP = [
  /https?:\/\/\S+/giu, // URL
  /<[^>\n]*>/gu, // thẻ HTML / chú thích
  /\]\([^)]*\)/gu, // đích link markdown
  /(?<![\p{L}\d_])\d+\/\d{4}\/[\p{L}\d\-]+/gu, // số hiệu văn bản 45/2019/QH14
  /(?<![\p{L}\d_])\d+\/\p{Lu}[\p{L}\d\-]*/gu, // 15/NĐ-CP
  /(?<![\p{L}\d_])\d{1,2}[\/-]\d{1,2}[\/-]\d{4}\b/gu, // ngày dd/mm/yyyy
  /(?<![\p{L}\d_])(?:Điều|Khoản|Điểm|Mục|Chương|Phần|Phụ lục|Bước|Mẫu|điều|khoản|điểm|mục|chương|phần|bước)\s+\d+\p{L}?(?:\s*(?:,|và|hoặc)\s*\d{1,3}\p{L}?(?!\d|[.,]\d|%|\s*(?:%|triệu|nghìn|ngàn|tỷ|tỉ|đồng)))*/gu, // Điều 98, khoản 2
  /(?<![\p{L}\d_])(?:Bộ luật|Luật|Nghị định|Thông tư|Nghị quyết|Quyết định|Pháp lệnh|Chỉ thị|Công văn|NĐ|TT|QĐ)\s+(?:số\s+)?\d+/gu, // Nghị định 145
  /(?<![\p{L}\d_])0\d{6,}\b/gu, // số điện thoại
  /(?<![\p{L}\d_])1[89]00\s?\d{3,4}\b/gu, // tổng đài 1900 xxxx
];

export function stripNonClaims(text) {
  let t = text;
  for (const re of STRIP) t = t.replace(re, ' ');
  return t;
}

// Trả về các giá trị ứng viên (nhiều khi một chuỗi mơ hồ: "1.500" = 1500 hoặc 1,5).
export function candidates(tok) {
  const out = new Set();
  const add = (n) => Number.isFinite(n) && out.add(Math.round(n * 1e6) / 1e6);
  if (/^\d+$/.test(tok)) add(Number(tok));
  else if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(tok)) {
    add(Number(tok.replace(/\./g, '').replace(',', '.')));
    if (/^\d{1,3}\.\d{3}$/.test(tok)) add(Number(tok)); // 1.500 có thể là 1,5
  } else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(tok)) {
    add(Number(tok.replace(/,/g, '')));
    if (/^\d{1,3},\d{3}$/.test(tok)) add(Number(tok.replace(',', '.')));
  } else if (/^\d+[.,]\d+$/.test(tok)) add(Number(tok.replace(',', '.')));
  return [...out];
}

/** Trích mọi số: [{ raw, unit, values: number[], line, hasUnit, plainInt }] */
export function extractNumbers(text) {
  const stripped = stripNonClaims(text);
  const re = new RegExp(`(?<![\\p{L}\\d_])(\\d+(?:[.,]\\d+)*)(?:\\s*${UNIT_RE}(?![\\p{L}]))?`, 'giu');
  const out = [];
  const lines = stripped.split('\n');
  lines.forEach((ln, i) => {
    for (const m of ln.matchAll(re)) {
      const tok = m[1];
      const unit = m[2] ? m[2].toLowerCase() : null;
      const base = candidates(tok);
      if (!base.length) continue;
      const mult = unit && MULT[unit] ? MULT[unit] : 1;
      out.push({
        raw: m[0].trim(),
        tok,
        unit,
        values: base.map((v) => Math.round(v * mult * 1e6) / 1e6),
        line: i + 1,
        hasUnit: Boolean(unit),
        plainInt: /^\d+$/.test(tok),
      });
    }
  });
  return out;
}
