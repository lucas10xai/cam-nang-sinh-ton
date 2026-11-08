import { issue } from '../lib/result.mjs';
import { entryUrls, checkUrls } from '../lib/links.mjs';

export const name = 'links';
export const description = 'URL trong Nguồn/legal_refs/verification.sources còn sống (chỉ chạy với --links)';
export const needsFlag = 'links';

export async function run({ entries, config, linkOptions }) {
  const opt = { ...config.links, ...linkOptions };
  const perEntry = entries.map((e) => ({ e, urls: entryUrls(e) }));
  const results = await checkUrls(perEntry.flatMap((x) => x.urls), opt);
  const out = [];
  for (const { e, urls } of perEntry) {
    for (const u of urls) {
      const r = results.get(u);
      if (!r || r.kind === 'ok') continue;
      const label = r.kind === 'dead' ? 'Link chết' : r.kind === 'temp' ? 'Link lỗi tạm thời (chưa kết luận)' : 'Link bị chặn/không xác minh được';
      out.push(issue('warn', name, e, `${label}: ${u} — ${r.detail}${r.cached ? ' [cache]' : ''}`));
    }
  }
  return out;
}
