// Helper duy nhất dựng đường dẫn nội bộ theo base (BASE_PATH). Dùng được cả ở server lẫn script trình duyệt.
// Ví dụ base "/cam-nang-sinh-ton": url('/muc/x/') -> "/cam-nang-sinh-ton/muc/x/"; base "/": giữ nguyên.
const base = (import.meta.env.BASE_URL ?? '/').replace(/\/+$/, '');

export function url(path: string): string {
  if (/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(path)) return path;
  return base + (path.startsWith('/') ? path : '/' + path);
}
