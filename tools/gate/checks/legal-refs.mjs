import { issue } from '../lib/result.mjs';

export const name = 'legal-refs';
export const description = 'H2 "Pháp luật Việt Nam" có legal_refs; legal_refs[].url thuộc miền chính thống';

export function hostTrusted(url, domains) {
  let host;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  return domains.some((d) => host === d || host.endsWith('.' + d));
}

export function run({ entries, config }) {
  const out = [];
  for (const e of entries) {
    if (!e.data) continue;
    const refs = Array.isArray(e.data.legal_refs) ? e.data.legal_refs : [];
    const hasSection = e.sections.some((s) => s.title === 'Pháp luật Việt Nam');
    if (hasSection && refs.length === 0) {
      out.push(issue('warn', name, e, 'Có H2 "Pháp luật Việt Nam" nhưng legal_refs rỗng'));
    }
    for (const r of refs) {
      if (!r || !r.url) continue;
      const t = hostTrusted(r.url, config.trustedDomains);
      if (t === null) out.push(issue('warn', name, e, `legal_refs url không hợp lệ: ${r.url}`));
      else if (!t) out.push(issue('warn', name, e, `legal_refs url không thuộc miền chính thống: ${r.url}`));
    }
  }
  return out;
}
