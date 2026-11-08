// Trạng thái cá nhân (đã đọc / đã làm): chỉ ở localStorage của trình duyệt này, không gửi đi đâu.
export type Kind = 'read' | 'done';
export type State = { read: Record<string, string>; done: Record<string, string>; steps: Record<string, number[]> };
const KEY = 'cnst:state:v1';

export function load(): State {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return { read: raw.read ?? {}, done: raw.done ?? {}, steps: raw.steps ?? {} };
  } catch {
    return { read: {}, done: {}, steps: {} };
  }
}
export function save(s: State): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(s)); return true; } catch { return false; }
}
export function toggle(kind: Kind, id: string): boolean {
  const s = load();
  const on = !(id in s[kind]);
  if (on) s[kind][id] = new Date().toISOString().slice(0, 10);
  else delete s[kind][id];
  save(s);
  return on;
}

/** Đặt hoặc bỏ tick một bước của một mục (chỉ số tính từ 0). */
export function setStep(id: string, index: number, on: boolean): void {
  const s = load();
  const set = new Set(s.steps[id] ?? []);
  if (on) set.add(index); else set.delete(index);
  if (set.size) s.steps[id] = [...set].sort((a, b) => a - b); else delete s.steps[id];
  save(s);
}
