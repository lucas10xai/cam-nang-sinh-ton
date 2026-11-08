import { loadEntries, entryChapter } from './load.mjs';
import { loadSchema } from './schema.mjs';
import { checks } from '../checks/index.mjs';
import { GATE_DIR } from './paths.mjs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function loadConfig() {
  return JSON.parse(await readFile(join(GATE_DIR, 'config.json'), 'utf8'));
}

/**
 * Chạy cổng. opts: { contentDir, chapter?, links?, linkOptions?, config?, schema? }
 * Kiểm tra liên mục (id/related/trùng số) luôn chạy trên TOÀN BỘ mục; `chapter` chỉ lọc kết quả.
 */
export async function runGate(opts) {
  const config = opts.config ?? (await loadConfig());
  const { schema, source: schemaSource } = opts.schema ? { schema: opts.schema, source: 'inject' } : await loadSchema();
  const entries = await loadEntries(opts.contentDir);
  const inScope = (e) => opts.chapter == null || entryChapter(e) === opts.chapter;
  const scoped = entries.filter(inScope);
  const fileOf = new Map(entries.map((e) => [e.file, e]));
  const issues = [];
  const skipped = [];
  for (const c of checks) {
    if (c.needsFlag === 'links' && !opts.links) {
      skipped.push(c.name);
      continue;
    }
    const ctx = { entries: c.needsFlag === 'links' ? scoped : entries, config, schema, linkOptions: opts.linkOptions };
    const res = await c.run(ctx);
    for (const r of res) {
      const e = fileOf.get(r.file);
      if (e && !inScope(e)) continue;
      issues.push(r);
    }
  }
  return { entries, issues, schemaSource, skipped, checks: checks.map((c) => ({ name: c.name, description: c.description })) };
}
