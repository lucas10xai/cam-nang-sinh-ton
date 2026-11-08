# PHA 1: soạn lại 5 chương (5, 13, 14, 19, 36)

141 mục. Mỗi mục đi qua: **Soạn lại → Kiểm chứng độc lập → Sửa → Cổng**. Tài liệu này là hợp đồng cho bước **Soạn lại**. Giao thức kiểm chứng ở `docs/EDITORIAL.md`.

## Mục tiêu của bước Soạn lại

Biến mỗi mục từ bản nháp dày đặc (đoạn dài 600-1700 chữ) thành mục **đọc được trên điện thoại trong 30 giây**, mà **không thêm, không bớt, không đổi nghĩa bất kỳ khẳng định thực tế nào**. Đây là việc *tái cấu trúc và viết lại cho dễ đọc*, không phải nghiên cứu mới.

## Quy tắc cứng (vi phạm = trả lại)

1. **Không bịa.** Mọi con số, điều khoản, mức phạt, thời hạn, tên cơ quan, số điện thoại trong mục sau khi soạn lại PHẢI có trong bản nháp (hoặc trong báo cáo kiểm chứng của mục đó, nếu có, xem §4). Không dùng trí nhớ để "bổ sung cho đủ". Không thêm lời khuyên y tế/pháp lý mới.
2. **Không bớt khẳng định.** Mỗi khẳng định, điều kiện, ngoại lệ, "trừ khi", "chỉ khi" trong bản nháp phải còn lại. Được phép bỏ *lặp ý*, *giải thích dài dòng*, *giọng điệu*, không được bỏ điều kiện. Điều kiện đi kèm lời khuyên y tế là bắt buộc giữ.
3. **Không đổi `id`, `legacy`, `chapter`, `number`, `title`, `evidence`, `cost`, `benefit`, `metric`, `contested`.** Title chỉ sửa nếu báo cáo kiểm chứng (§4) buộc sửa; khi đó giữ `id`.
4. **Không tự nâng `verification.status`.** Để nguyên khối `verification` như đang có. Không điền `checker`, `sources` mới.
5. Không mở web, không dùng `_ref/`. Nguồn duy nhất là file mục hiện tại (và báo cáo kiểm chứng nếu có).
6. Không thêm emoji. Tiếng Việt đời thường, câu ngắn (≤ 25 chữ/câu khi có thể), chủ động, gọi "bạn". Giải nghĩa thuật ngữ pháp lý lần đầu xuất hiện bằng ngoặc đơn ngắn.

## Định dạng sau khi soạn lại

Frontmatter (sửa các trường sau, giữ nguyên trường còn lại):

```yaml
rewrite_status: rewritten
vn_class: universal | adapted | vn_native      # xem §2
tldr: "1-2 câu, ≤ 280 ký tự. Việc cần làm hoặc kết luận + con số quan trọng nhất."
steps:                                           # 2-6 bước, mỗi bước ≤ 200 ký tự, câu mệnh lệnh
  - "..."
situations: []                                   # chỉ slug trong data/situations.json, 0-2 slug
legal_refs:                                      # §3. Rỗng chỉ khi mục KHÔNG có điều luật nào
  - { doc: "...", article: "...", url: "...", effective_from: null, checked_at: "2026-11-03", quote: null }
```

Thân (H2 theo đúng thứ tự, giống schema/entry.mjs; bỏ H2 nào không có nội dung ngoại trừ các H2 bắt buộc):
`## Nói dễ hiểu` · `## Chi phí` · `## Lợi ích` · `## Pháp luật Việt Nam` (nếu mục có) · `## Ghi chú` · `## Nguồn`

- **Không đoạn nào > 110 chữ.** Đoạn dài phải tách thành nhiều đoạn ngắn hoặc gạch đầu dòng. Một ý một đoạn.
- **`## Pháp luật Việt Nam`: danh sách gạch đầu dòng**, mỗi gạch MỘT khẳng định (≤ 70 chữ) kết thúc bằng trích dẫn dạng `(Điều 98 khoản 1, BLLĐ 45/2019/QH14)` lấy từ bản nháp. Số tiền/ngày/tỷ lệ/mức phạt luôn nằm trong gạch có trích dẫn điều khoản. Nhóm gạch bằng in đậm ngắn nếu dài. Đây là chỗ ai cũng sẽ kiểm chứng, nên mỗi gạch phải tự đứng được.
- **`## Ghi chú`: tách thành gạch/đoạn ngắn.** Những "cái bẫy" nên là gạch riêng, mở đầu bằng cụm in đậm ngắn (ví dụ `**Bẫy 1: …**`). Giữ nguyên mọi điều kiện.
- **`## Nguồn`**: giữ nguyên toàn bộ nguồn của bản nháp, mỗi nguồn một gạch (tên văn bản, các điều khoản đã dẫn, URL, "Tra ngày …" nếu có). Không rút gọn URL.
- `## Nói dễ hiểu`: tối đa 3 câu. `tldr` không lặp nguyên văn câu đầu "Nói dễ hiểu"; nó là kết luận ngắn hơn.
- Liên kết nội bộ dạng `](NN-slug.md#entry-<id>)` giữ nguyên.

### `tldr` và `steps`
- Chỉ chứa thông tin có trong thân mục. Mọi con số xuất hiện trong `tldr`/`steps` phải xuất hiện trong thân.
- `steps` là *hành động người đọc làm*, theo thứ tự. Nếu bản nháp không có hành động (mục thuần thông tin), để `steps: []`, không bịa bước.
- Mục y tế/cấp cứu: `steps` chỉ gồm các bước đã có trong bản nháp, đúng thứ tự an toàn, giữ điều kiện đi kèm.

## §2 Phân loại `vn_class`
- `universal`: khoa học/sức khỏe phổ quát, ít phụ thuộc luật (vd ngưỡng huyết áp, kỹ thuật ép tim).
- `adapted`: kết hợp bằng chứng quốc tế và bối cảnh/số điện thoại/dịch vụ Việt Nam.
- `vn_native`: chủ yếu là luật, thủ tục, giá, thể chế Việt Nam.
Chọn một. Không chắc thì chọn `adapted`.

## §3 `legal_refs`
Rút từ chính bản nháp, mỗi cặp (văn bản, điều khoản) một phần tử. `doc` = tên + số hiệu văn bản (vd "Bộ luật Lao động 45/2019/QH14"). `article` = "Điều X khoản Y …". `url` = URL của văn bản có trong phần Nguồn của bản nháp (chọn URL khớp văn bản đó; không có thì để `url` bằng URL nguồn gần nhất và nói rõ trong báo cáo). `effective_from` chỉ điền nếu bản nháp ghi rõ ngày hiệu lực của chính văn bản đó, nếu không `null`. `checked_at` = ngày "Tra ngày …" trong bản nháp (YYYY-MM-DD), nếu không có thì `null`. `quote` luôn `null` ở bước này. Không có điều luật nào trong mục → `legal_refs: []` (và không có H2 Pháp luật Việt Nam).

## §4 Mục đã có báo cáo kiểm chứng (bắt buộc đọc và áp dụng)
Nếu `docs/verification/<chương>/<id>.yml` tồn tại cho mục của bạn, đọc nó. Áp dụng mọi `suggested_edits`, sửa `partial`/`inference`/`mismatch`/`not-found`/`internal_checks`/`potential_harm` theo đúng báo cáo; khẳng định nào bản nháp có nhưng báo cáo xác nhận là *không có trong nguồn* thì bỏ hoặc đổi thành "suy ra từ …" kèm điều khoản cơ sở. Nội dung bổ sung chỉ được lấy từ **`quote` nguyên văn trong báo cáo**. Ghi trong báo cáo cuối của bạn mỗi sửa đổi đã làm.

## §5 Báo cáo cuối (≤ 25 dòng)
Số mục đã làm; danh sách mục gặp khó (id + lý do một dòng): khẳng định không rõ nguồn, điều khoản không xác định được, bản nháp tự mâu thuẫn, mục nên cắt hoặc hợp nhất; các chỗ bạn buộc phải diễn giải (liệt kê). Trung thực hơn là gọn: báo mọi chỗ chưa chắc. Không chạy build/test/gate; chỉ sửa đúng các file mục được giao.
