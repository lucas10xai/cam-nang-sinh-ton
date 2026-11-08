# Cổng chất lượng (`tools/gate`)

Chỉ dùng Node built-in + `zod` + `yaml`. Không gọi mạng trừ khi có `--links`.

## Cách dùng

```bash
node tools/gate/run.mjs                      # kiểm tra content/ (hoặc $CONTENT_DIR)
node tools/gate/run.mjs --chapter 19         # chỉ báo cáo chương 19 (kiểm tra liên mục vẫn chạy trên toàn bộ)
node tools/gate/run.mjs --json               # kết quả JSON cho máy đọc
node tools/gate/run.mjs --out data/status.json   # ghi thống kê cho trang Phương pháp
node tools/gate/run.mjs --strict             # cảnh báo cũng làm exit ≠ 0
node tools/gate/run.mjs --links              # thêm kiểm tra link (chậm, cần mạng)
node tools/gate/run.mjs --content tools/gate/fixtures   # chạy trên bộ fixtures
```

Exit code: `0` nếu không có `error` (và không có `warn` khi `--strict`), `1` nếu ngược lại, `2` nếu sai tham số.

Test: `node --test tools/gate/test/*.test.mjs` (Node 22 không nhận tên thư mục trần, cần glob; shell tự bung `*`).

## Danh sách kiểm tra

Mỗi kết quả có dạng `{ level: 'error'|'warn', check, id, file, message }`.

| Check | Mức | Nội dung |
|---|---|---|
| `schema` | error | Frontmatter parse được và đúng `schema/entry.mjs`; `chapter` khớp số thư mục `NN-…` |
| `unique` | error | `id` duy nhất; `(chapter, number)` duy nhất |
| `sections` | error / warn | Thiếu H2 bắt buộc = error; H2 lặp, lạ, sai thứ tự, phần bắt buộc rỗng = warn |
| `related` | error / warn | `related` trỏ id không tồn tại = error; tự trỏ vào mình = warn |
| `legal-refs` | warn | Có H2 "Pháp luật Việt Nam" mà `legal_refs` rỗng; `legal_refs[].url` ngoài miền chính thống hoặc không hợp lệ |
| `verification` | error | `source-checked`/`cross-checked`/`expert-reviewed` thiếu `checked_at` hoặc `sources`; `expert-reviewed` thiếu `checker` |
| `keywords` | error | `[chưa kiểm chứng]`, `TODO`, `XXX`, `lorem` ở bất kỳ đâu trong file (kể cả frontmatter) |
| `numbers` | warn | Số trong "Nói dễ hiểu" không có trong "Lợi ích"/"Pháp luật Việt Nam"/"Chi phí" |
| `links` | warn | (chỉ với `--links`) URL trong Nguồn, `legal_refs`, `verification.sources` chết/lỗi |

### Heuristic kiểm tra số (`numbers`)

Mục tiêu: ít dương tính giả. Cảnh báo chỉ nghĩa "người soạn cần xem lại", không phải lỗi.

1. **Chuẩn hóa**: `1.500.000` → 1500000 (dấu chấm ngăn nghìn); `2,5` → 2.5 (dấu phẩy thập phân); `1,5 triệu` → 1500000; `300 nghìn/ngàn` → 300000; `tỷ/tỉ` → 10⁹; `%`, `đồng`, `đ`, `VND` chỉ là đơn vị. Chuỗi mơ hồ (`1.500`, `1,500`) sinh nhiều giá trị ứng viên; chỉ cần **một** ứng viên khớp là coi như có.
2. **So sánh theo giá trị đã quy đổi, không theo cách viết**: "1,5 triệu" ở Nói dễ hiểu khớp "1.500.000 đồng" ở Lợi ích. Đơn vị được bỏ qua khi so (150% khớp 150).
3. **Bỏ qua phía Nói dễ hiểu (không coi là khẳng định số liệu)**: số sau `Điều/Khoản/Điểm/Mục/Chương/Phần/Bước/Phụ lục` (kể cả danh sách "khoản 1, 2 và 3"); số hiệu văn bản (`45/2019/QH14`, `145/2020/NĐ-CP`, `Nghị định 145`, `Luật số 45`); ngày `dd/mm/yyyy`; URL và HTML; số điện thoại và đầu số `1900 xxxx`; số bắt đầu bằng 0; năm 1900–2100 viết trơn; hotline trong `numbers.ignoreNumbers` (111–115); **số nguyên nhỏ không đơn vị** (< `minSignificantInteger` = 11), vì "3 bước", "2 người" là số đếm, không phải số liệu cần dẫn nguồn.
4. **Không bỏ qua** số nhỏ có đơn vị (`5%`, `3 triệu`).
5. Phía tham chiếu (Lợi ích/Pháp luật/Chi phí) **không** bỏ gì ngoài URL/HTML, để khoan dung tối đa.
6. Mỗi số chỉ báo một lần mỗi mục. Giới hạn đã biết: số viết bằng chữ ("ba trăm nghìn"), phép tính suy ra (150% × 2 = 300%) sẽ bị báo; hãy dẫn con số đó trong Chi phí/Lợi ích hoặc chấp nhận cảnh báo.

Cấu hình ở `tools/gate/config.json` (`numbers`).

### Kiểm tra link (`--links`)

- Mỗi URL duy nhất kiểm tra một lần: `HEAD`, nếu không OK thì `GET` dự phòng (nhiều máy chủ xử lý HEAD sai), tự theo chuyển hướng, timeout theo `links.timeoutMs`.
- **Chết thật** (cảnh báo "Link chết"): 404, 410, DNS không phân giải (ENOTFOUND), URL hỏng, các 4xx khác. Cache 24h.
- **Tạm thời** ("chưa kết luận"): 429, 408, 5xx, timeout, lỗi mạng. Thử lại tối đa `retries` lần với backoff mũ (tôn trọng `Retry-After`, chặn trên `maxRetryAfterMs`). Không cache.
- **Bị chặn**: 401/403/405/406/999 và lỗi chứng chỉ TLS: nhiều trang `.gov.vn` chặn bot hoặc cấu hình TLS lỗi, nên không kết luận là chết. Không cache.
- Link sống cache 7 ngày. Cache ở `.cache/gate-links.json` (cần có trong `.gitignore`); `--no-cache` để bỏ qua.
- Lịch sự: tối đa `globalConcurrency` yêu cầu đồng thời, `perHostConcurrency` mỗi host, cách nhau ≥ `perHostMinIntervalMs` mỗi host.
- Mọi kết quả link ở mức `warn`.

## `data/status.json`

Sinh bởi `--out data/status.json` (từ **toàn bộ** mục, không bị `--chapter` thu hẹp):

```json
{
  "generated_at": "2026-11-08T10:00:00.000Z",
  "total": 767,
  "totals": { "by_status": {"unverified": 760}, "by_vn_class": {}, "by_rewrite_status": {} },
  "chapters": { "1": { "total": 20, "by_status": {}, "by_vn_class": {}, "by_rewrite_status": {} } },
  "cells": [ { "chapter": 1, "status": "unverified", "vn_class": "unclassified", "rewrite_status": "imported", "count": 20 } ]
}
```

`cells` là ma trận chương × trạng thái × loại × rewrite, sắp xếp ổn định. Mục có frontmatter hỏng tính vào `"unknown"`.

## Thêm kiểm tra mới

1. Tạo `tools/gate/checks/<ten>.mjs` xuất `name`, `description`, `run(ctx)` (có thể async). `ctx = { entries, config, schema }`; mỗi `entry` có `file`, `data` (frontmatter), `body`, `sections` (`[{title, text}]`), `raw`.
2. Trả mảng `issue(level, name, entry, message)` từ `lib/result.mjs`.
3. Đăng ký trong `checks/index.mjs`. Kiểm tra cần mạng/chậm: đặt `export const needsFlag = 'links'`-kiểu cờ và xử lý trong `lib/gate.mjs`.
4. Thêm fixture lỗi vào `fixtures/entries/02-loi/` (mỗi fixture chỉ vi phạm đúng một kiểm tra) và một ca trong `test/gate.test.mjs`; chạy test.
5. Ngưỡng/danh sách đưa vào `config.json`, đừng cứng trong code.

Kiểm tra liên mục (cần toàn bộ mục) luôn nhận `entries` đầy đủ; `--chapter` chỉ lọc kết quả sau cùng.
