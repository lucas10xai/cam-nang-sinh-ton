# Triển khai (GitHub Pages)

Repo: <https://github.com/lucas10xai/cam-nang-sinh-ton>. Site tự dựng và triển khai bằng `.github/workflows/ci.yml` mỗi lần push vào `main` (test → cổng chất lượng → build → kiểm link → deploy).

Địa chỉ hiện tại: <https://lucas10xai.github.io/cam-nang-sinh-ton/>

## Ba biến cấu hình

Đặt ở **Settings → Secrets and variables → Actions → Variables** (không phải Secrets). Không đặt thì dùng mặc định trong workflow.

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `SITE_URL` | `https://lucas10xai.github.io` | Gốc URL tuyệt đối (canonical, sitemap) |
| `BASE_PATH` | `/cam-nang-sinh-ton` | Đường dẫn con. Dùng tên miền riêng thì đặt `/` |
| `SITE_INDEXABLE` | `false` | `false` = `noindex` mọi trang, `robots.txt` chặn, không sinh sitemap |

## Chuyển sang tên miền riêng `2k.io.vn`

Thứ tự này quan trọng. Làm sai thứ tự thì người khác có thể chiếm tên miền của bạn (theo tài liệu GitHub: phải thêm domain vào GitHub **trước** khi trỏ DNS).

1. **Trên GitHub:** Settings → Pages → *Custom domain* → nhập `2k.io.vn` → Save. (Triển khai bằng Actions nên không cần file CNAME.) Nên bật thêm *Verify domain* (Settings của tài khoản → Pages) để tránh bị chiếm.
2. **Ở nhà cung cấp DNS của `2k.io.vn`** (hiện dùng `a.dns-servers.vn`, `b.dns-servers.vn`), tạo 4 bản ghi `A` cho tên miền gốc (`@`):
   ```
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```
   Tùy chọn IPv6 (`AAAA`, `@`): `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`. Xóa bản ghi mặc định cũ (nếu có). Không dùng wildcard `*`.
   Tùy chọn: `CNAME` cho `www` trỏ về `lucas10xai.github.io`.
3. Đợi DNS cập nhật (đến 24 giờ), kiểm tra: `dig 2k.io.vn +noall +answer -t A` phải ra 4 IP trên.
4. **Trên GitHub:** Settings → Pages → bật *Enforce HTTPS* (có thể phải đợi cấp chứng chỉ).
5. **Đặt biến Actions:** `SITE_URL=https://2k.io.vn`, `BASE_PATH=/`. Chạy lại workflow (Actions → ci → Run workflow). Kiểm tra canonical và link trong trang.
6. Từ lúc này địa chỉ `lucas10xai.github.io/cam-nang-sinh-ton` tự chuyển hướng sang tên miền riêng.

Lưu ý: `localStorage` (mục đã đọc, bước đã tick) gắn với từng origin, nên người dùng đã dùng bản github.io sẽ không thấy dữ liệu đó ở `2k.io.vn`.

## Khi nào được bật `SITE_INDEXABLE=true`

Mặc định tắt để nội dung chưa kiểm chứng không bị công cụ tìm kiếm lập chỉ mục và trích dẫn như nguồn đáng tin. Chỉ bật khi đồng thời đạt:

1. Chương cấp cứu (13) và lao động (19) không còn mục `potential_harm` chưa xử lý.
2. Mọi mục chưa kiểm chứng đều hiển thị nhãn "Chưa kiểm chứng" (đã có).
3. Người chịu trách nhiệm dự án đã đọc lại trang Giới thiệu và Phương pháp và đồng ý.

Bật: đặt biến `SITE_INDEXABLE=true`, chạy lại workflow. Kiểm tra `/robots.txt` và `/sitemap-index.xml`.

## Kiểm tra sau triển khai

```bash
curl -sI https://lucas10xai.github.io/cam-nang-sinh-ton/ | head -3
curl -s https://lucas10xai.github.io/cam-nang-sinh-ton/robots.txt   # phải là Disallow: / khi noindex
```
