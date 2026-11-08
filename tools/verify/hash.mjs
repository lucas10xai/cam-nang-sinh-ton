#!/usr/bin/env node
// In content_sha256 của mục: node tools/verify/hash.mjs <file mục> [...]
import { readFile } from 'node:fs/promises';
import { entryHash } from './lib/hash.mjs';

const files = process.argv.slice(2);
if (files.length === 0 || files.includes('-h') || files.includes('--help')) {
  console.log('Dùng: node tools/verify/hash.mjs <file mục .md> [...]\nMột file: in đúng hash. Nhiều file: "<hash>  <file>".');
  process.exit(files.length === 0 ? 2 : 0);
}
let code = 0;
for (const f of files) {
  try {
    const h = entryHash(await readFile(f, 'utf8'));
    console.log(files.length === 1 ? h : `${h}  ${f}`);
  } catch (e) {
    console.error(`${f}: ${e.message}`);
    code = 1;
  }
}
process.exit(code);
