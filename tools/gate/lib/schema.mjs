import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { ROOT } from './paths.mjs';

// Schema duy nhất là `schema/entry.mjs` (dùng chung với Importer và Site).
export async function loadSchema(sharedPath = resolve(ROOT, 'schema/entry.mjs')) {
  if (!existsSync(sharedPath)) {
    throw new Error(`Thiếu ${sharedPath}. Chạy \`pnpm import\` hoặc khôi phục schema/entry.mjs.`);
  }
  const mod = await import(pathToFileURL(sharedPath).href);
  for (const key of ['entrySchema', 'EntrySchema', 'entry', 'default']) {
    if (mod[key] && typeof mod[key].safeParse === 'function') {
      return { schema: mod[key], source: 'schema/entry.mjs' };
    }
  }
  throw new Error(`schema/entry.mjs không xuất schema zod (tìm entrySchema/EntrySchema/entry/default)`);
}
