import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { ROOT } from '../lib/paths.mjs';

function runCli(args) {
  return new Promise((res) => {
    const p = spawn('node', ['tools/gate/run.mjs', ...args], { cwd: ROOT });
    const out = [];
    p.stdout.on('data', (d) => out.push(d));
    p.on('close', (code) => res({ code, stdout: Buffer.concat(out).toString('utf8') }));
  });
}

test('--json qua pipe không bị cắt cụt khi đầu ra > 64 KiB', async () => {
  // Chạy CLI thật trên content/ (đầu ra ~150 KiB); trước khi sửa, process.exit() làm cụt ở 64 KiB.
  const real = await runCli(['--json']);
  const j = JSON.parse(real.stdout);
  assert.equal(typeof j.entries, 'number');
  assert.equal(j.issues.length, j.errors + j.warnings);
  if (j.entries > 400) assert.ok(real.stdout.length > 65536);
});

test('--json trên fixtures: JSON đủ và exit code 1', async () => {
  const r = await runCli(['--json', '--content', 'tools/gate/fixtures']);
  assert.equal(r.code, 1);
  const j = JSON.parse(r.stdout);
  assert.equal(j.entries, 12);
  assert.equal(j.errors, 8);
});

test('bảng tóm tắt in đủ dòng cuối', async () => {
  const r = await runCli(['--content', 'tools/gate/fixtures']);
  assert.match(r.stdout, /Tổng: 8 lỗi, 4 cảnh báo/);
});
