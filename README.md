# Cẩm nang sinh tồn

Trang đọc tiếng Việt về cách sống lâu hơn, ít bệnh hơn, ít tốn tiền oan hơn và tránh những rủi ro pháp lý trong đời thường, theo bối cảnh luật pháp và xã hội Việt Nam. Mỗi lời khuyên ghi rõ **bỏ ra gì, nhận lại gì, bằng chứng mạnh đến đâu, đã được đối chiếu với nguồn nào**.

Sản phẩm công ích, mã nguồn mở. Domain tạm: <http://2k.io.vn/>.

> **Chưa có chuyên gia duyệt.** Nội dung chỉ để tham khảo, không thay lời khuyên của luật sư hoặc bác sĩ. Mỗi mục hiển thị trạng thái kiểm chứng riêng. Thấy sai, vui lòng mở issue.

## Nguồn gốc và ghi công

Dựa trên *高性价比人生指南* (HowToLiveBetter) của eternity4719, giấy phép CC BY 4.0. Bản nháp tiếng Việt lấy từ [quangpao/HowToLiveBetter](https://github.com/quangpao/HowToLiveBetter) (nhánh `vi`), đối chiếu thêm với [luonglb/song-dang-tien](https://github.com/luonglb/song-dang-tien). Dự án này **đã sửa và biên soạn lại**, không phải bản chính thức của bất kỳ bản nào ở trên. Chi tiết trong [GHI-CONG.md](GHI-CONG.md).

## Cấu trúc

| Đường dẫn | Nội dung |
|---|---|
| `content/` | Nội dung: `chapters/` (36 chương), `entries/` (từng mục, frontmatter + Markdown) |
| `schema/` | Schema dữ liệu dùng chung (zod) |
| `data/` | Dữ liệu dùng chung (số khẩn cấp, trạng thái kiểm chứng…) |
| `tools/import/` | Nhập bản nháp từ nguồn tham chiếu |
| `tools/gate/` | Cổng kiểm tra chất lượng nội dung |
| `src/` | Site Astro (tĩnh) |
| `docs/` | [SPEC](docs/SPEC.md), [quy trình biên tập](docs/EDITORIAL.md), tài liệu cổng |

## Chạy thử

```bash
pnpm install
pnpm gate      # kiểm tra nội dung
pnpm build     # dựng site + chỉ mục tìm kiếm
pnpm preview
```

## Giấy phép

Nội dung: CC BY 4.0. Mã nguồn: MIT. Xem `LICENSE`, `LICENSE-CODE`.
