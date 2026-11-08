import { issue } from '../lib/result.mjs';

export const name = 'keywords';
export const description = 'Từ khóa nghi bịa/chưa hoàn thiện: [chưa kiểm chứng], TODO, XXX, lorem';

export function run({ entries, config }) {
  const out = [];
  const rules = config.forbiddenKeywords.map((k) => ({ re: new RegExp(k.pattern, k.flags), label: k.label }));
  for (const e of entries) {
    e.raw.replace(/\r\n?/g, '\n').split('\n').forEach((line, i) => {
      for (const r of rules) {
        if (r.re.test(line)) out.push(issue('error', name, e, `Dòng ${i + 1}: chứa "${r.label}"`));
      }
    });
  }
  return out;
}
