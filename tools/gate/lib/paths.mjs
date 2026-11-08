import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

export const GATE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const ROOT = resolve(GATE_DIR, '..', '..');
