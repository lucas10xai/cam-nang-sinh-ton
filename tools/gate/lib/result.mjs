// Kết quả thống nhất của mọi kiểm tra: { level, check, id, file, message }
export function issue(level, check, entry, message) {
  return { level, check, id: entry?.data?.id ?? entry?.idGuess ?? null, file: entry?.file ?? null, message };
}
