import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { ROOT } from '../../gate/lib/paths.mjs';

export const VERDICTS = ['match', 'match-secondary', 'partial', 'inference', 'mismatch', 'not-found', 'unreachable'];
export const RESULTS = ['pass', 'pass-with-edits', 'fail'];
export const IN_FORCE = [true, false, 'unconfirmed'];
export const SEVERITIES = ['error', 'warn'];
export const REPORT_KEYS = ['id', 'checker', 'checked_at', 'content_sha256', 'result', 'claims', 'internal_checks', 'validity', 'deliberate_vn_deviation', 'potential_harm', 'suggested_edits'];

async function walk(dir) {
  let out = [];
  let items;
  try {
    items = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const it of items.sort((a, b) => a.name.localeCompare(b.name))) {
    const p = join(dir, it.name);
    if (it.isDirectory()) out = out.concat(await walk(p));
    else if (/\.ya?ml$/.test(it.name)) out.push(p);
  }
  return out;
}

/** Đọc mọi báo cáo: [{ file, abs, data, parseError }] */
export async function loadReports(dir) {
  const files = await walk(dir);
  const reports = [];
  for (const abs of files) {
    let data = null;
    let parseError = null;
    try {
      data = parseYaml(await readFile(abs, 'utf8'));
      if (data === null || typeof data !== 'object' || Array.isArray(data)) {
        parseError = 'Báo cáo không phải đối tượng YAML';
        data = null;
      }
    } catch (e) {
      parseError = `YAML lỗi: ${e.message.split('\n')[0]}`;
    }
    reports.push({ file: relative(ROOT, abs), abs, data, parseError });
  }
  return reports;
}
