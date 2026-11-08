import { issue } from '../lib/result.mjs';
import { extractNumbers } from '../lib/numbers.mjs';
import { sectionText } from '../lib/load.mjs';

export const name = 'numbers';
export const description = 'Số trong "Nói dễ hiểu" phải xuất hiện trong "Lợi ích"/"Pháp luật Việt Nam"/"Chi phí"';

const REF_SECTIONS = ['Lợi ích', 'Pháp luật Việt Nam', 'Chi phí'];

function isIgnorable(n, cfg) {
  if (n.plainInt) {
    if (n.tok.length > 1 && n.tok.startsWith('0')) return true; // 0xxx: mã/điện thoại
    const v = n.values[0];
    if (!n.hasUnit && v < cfg.minSignificantInteger) return true; // số đếm nhỏ
    if (!n.hasUnit && v >= 1900 && v <= 2100) return true; // năm
    if (!n.hasUnit && cfg.ignoreNumbers.includes(v)) return true; // 113, 114, 115 ...
  }
  return false;
}

export function run({ entries, config }) {
  const out = [];
  const cfg = config.numbers;
  for (const e of entries) {
    const easy = sectionText(e, 'Nói dễ hiểu');
    if (!easy) continue;
    const refText = REF_SECTIONS.map((t) => sectionText(e, t) ?? '').join('\n');
    // Phía tham chiếu: không xóa "Điều 98"... để khoan dung hơn, chỉ bỏ URL/HTML.
    const refVals = new Set();
    for (const n of extractNumbers(refText.replace(/https?:\/\/\S+/g, ' '))) n.values.forEach((v) => refVals.add(v));
    const reported = new Set();
    for (const n of extractNumbers(easy)) {
      if (isIgnorable(n, cfg)) continue;
      if (n.values.some((v) => refVals.has(v))) continue;
      if (reported.has(n.raw)) continue;
      reported.add(n.raw);
      out.push(issue('warn', name, e, `Số "${n.raw}" trong "Nói dễ hiểu" không thấy trong Lợi ích/Pháp luật/Chi phí`));
    }
  }
  return out;
}
