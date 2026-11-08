---
id: crawler-chi-cao-trang-cong-khai-khong-can-dang-nhap-khong-vuot
legacy: "11-4"
chapter: 11
number: 4
title: Crawler chỉ cào trang công khai không cần đăng nhập, không vượt chặn bot, không lấy dữ liệu cá nhân, không bán dữ liệu cào được
cost:
  money: "0"
  time: low
  will: mid
benefit: large
metric: money
evidence: B
contested: false
vn_class: unclassified
rewrite_status: imported
tldr: null
steps: []
legal_refs: []
verification:
  status: unverified
  checked_at: null
  checker: null
  scope: null
  sources: []
origin:
  zh: null
  quangpao: "11-4"
  luonglb: null
related:
  - khong-kiem-thu-he-thong-cua-nguoi-khac-khi-chua-co-van
situations: []
tags: []
---

## Nói dễ hiểu

Trang công khai, không cần đăng nhập thì cào được, miễn là không lấy dữ liệu cá nhân. Vượt cảnh báo hoặc mã truy cập để lấy dữ liệu nằm sau lớp đăng nhập là xâm nhập trái phép, tù 1 năm đến 5 năm. Bán dữ liệu cá nhân bị phạt tới 10 lần khoản thu, cá nhân chịu nửa mức của tổ chức.

## Chi phí

Không mất tiền, mất thời gian đọc trước khi viết dòng đầu: tệp robots của trang, điều khoản sử dụng, và danh sách trường bạn định lấy. Khó ở chỗ bỏ hẳn nhóm trường cá nhân nghĩa là mất phần dữ liệu có giá nhất.

## Lợi ích

Thu thập dữ liệu công khai không đồng nghĩa có quyền vượt chặn, lấy thông tin cá nhân hay tái phân phối. Xác định mục đích, phạm vi và quyền được cấp trước khi chạy crawler.

## Pháp luật Việt Nam

Điều 289 khoản 1 Bộ luật Hình sự, như ở [mục 9](11-nhung-vach-do-nguoi-lam-ky-thuat-hay-vap.md#entry-khong-kiem-thu-he-thong-cua-nguoi-khac-khi-chua-co-van) (kiểm thử hệ thống người khác khi chưa có văn bản), phạt tù từ 1 năm đến 5 năm với người vượt qua cảnh báo, mã truy cập, tường lửa hoặc dùng quyền quản trị của người khác để xâm nhập; điều luật không nhắc tới robots, tốc độ gửi yêu cầu hay số lượt tải, nên cái quyết định là bạn có đi qua lớp bảo vệ hay không. Với dữ liệu cá nhân, Luật Bảo vệ dữ liệu cá nhân, Điều 7 khoản 6, ghi thẳng vào danh sách hành vi bị nghiêm cấm việc mua, bán dữ liệu cá nhân, trừ trường hợp luật có quy định khác; Điều 8 khoản 3 đặt mức phạt tiền tối đa cho hành vi mua, bán dữ liệu cá nhân bằng 10 lần khoản thu có được từ hành vi vi phạm, khoản 5 đặt mức chung 3 tỷ đồng cho các hành vi khác, và khoản 6 hạ mức của cá nhân xuống một phần hai mức của tổ chức. Luật có hiệu lực từ ngày 1/1/2026.

## Ghi chú

Cả hai văn bản đều có mức phạt đọc được nguyên văn và Luật 91/2025 đã có hiệu lực từ 1/1/2026, nhưng chưa có bản án công bố nào ở Việt Nam về crawler bán dữ liệu để lên hạng A. Ba cái bẫy hay gặp. Một: đọc robots.txt rồi coi như đã xin phép — robots là tuyên bố của chủ trang, không phải giấy phép, và việc đi tiếp qua ô đăng nhập hay mã xác nhận vẫn là chuyện của Điều 289 khoản 1 chứ không phải chuyện của robots. Hai: để crawler tự đăng nhập bằng tài khoản dùng thử rồi cào phần sau đăng nhập, vì "tôi có tài khoản hợp pháp" — cái bạn có là quyền dùng, không phải quyền tải toàn bộ dữ liệu về máy mình; dùng quyền truy cập hợp lệ cho mục đích khác là chỗ dễ bị xếp vào xâm nhập. Ba: bán lại tập dữ liệu đã cào, kể cả khi mỗi trường đều công khai — Điều 7 khoản 6 Luật 91/2025 cấm mua, bán dữ liệu cá nhân, và dữ liệu công khai vẫn là dữ liệu cá nhân; mức phạt tính theo khoản thu, không theo số bản ghi. Mục này không có nghĩa là cấm crawler, hay mọi tập dữ liệu công khai đều không dùng được: nó nói rằng đừng đi qua lớp bảo vệ, đừng lấy trường định danh được người, và đừng bán thứ mình cào được.

## Nguồn

Bộ luật Hình sự, bản hợp nhất 135/VBHN-VPQH (Điều 289 khoản 1) — https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/9/135-vbhn-vpqh.pdf ; Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15, Công báo 971+972 ngày 24/7/2025 (Điều 7 khoản 6, Điều 8 khoản 3, 5, 6) — https://congbao.chinhphu.vn/van-ban/luat-so-91-2025-qh15-45578.htm . Tra ngày 3/11/2026.
