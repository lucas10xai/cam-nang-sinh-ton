---
id: dung-code-gpl-de-lam-san-pham-thi-phai-theo-giay-phep
legacy: "11-14"
chapter: 11
number: 14
title: 'Dùng code GPL để làm sản phẩm thì phải theo giấy phép: mở mã nguồn hoặc đổi giấy phép, đừng dựa vào "không ai quản"'
cost:
  money: "0"
  time: mid
  will: mid
benefit: medium
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
  quangpao: "11-14"
  luonglb: null
related: []
situations: []
tags: []
---

## Nói dễ hiểu

GPL buộc sản phẩm phát hành có dùng nó cũng phải mở mã nguồn. Bán phần mềm đóng có code GPL bên trong là xâm phạm quyền tác giả: bồi thường theo thiệt hại, và thu lợi từ 50.000.000 đồng thì có thể bị truy cứu hình sự.

## Chi phí

Không mất tiền, mất thời gian rà soát. Bạn cần một buổi liệt kê mọi thư viện trong dự án và ghi giấy phép của từng cái vào một file, rồi đọc ba giấy phép hay gặp nhất: MIT, Apache, GPL. Có thể bạn phải ngừng dùng một thư viện đã quen, nếu nó là GPL và sản phẩm của bạn đóng gói bán. Nếu để tới lúc khách kiểm, bạn sẽ phải mở mã nguồn hoặc viết lại phần phụ thuộc đó.

## Lợi ích

Dùng mã nguồn mở trong sản phẩm phải tuân thủ đúng giấy phép từng thành phần. Với GPL, cần kiểm tra nghĩa vụ phân phối và cung cấp mã nguồn trước khi phát hành.

## Pháp luật Việt Nam

Điều 28 khoản 2 Luật Sở hữu trí tuệ xếp việc xâm phạm quyền tài sản vào nhóm hành vi xâm phạm quyền tác giả, và Điều 20 khoản 1 liệt kê đúng những việc một sản phẩm đóng làm với code GPL: sao chép, phân phối bản sao, truyền đạt đến công chúng. Giấy phép GPL là hợp đồng cho phép làm mấy việc đó với điều kiện mở mã nguồn; làm mà không theo điều kiện thì mất quyền, và Điều 205 khoản 1 cho phép tính bồi thường theo thiệt hại cộng lợi nhuận của bên vi phạm, hoặc theo giá chuyển giao quyền sử dụng, trần 500.000.000 đồng khi không tính được. Điều 205 khoản 2 cho 5.000.000 đồng đến 50.000.000 đồng thiệt hại tinh thần. Điều 225 khoản 1 Bộ luật Hình sự đặt ngưỡng: thu lợi bất chính từ 50.000.000 đồng đến dưới 300.000.000 đồng, hoặc gây thiệt hại từ 100.000.000 đồng đến dưới 500.000.000 đồng, hoặc hàng hóa vi phạm trị giá từ 100.000.000 đồng đến dưới 500.000.000 đồng, với quy mô thương mại, thì phạt tiền 50.000.000 đồng đến 300.000.000 đồng hoặc cải tạo không giam giữ đến 3 năm; khoản 2 nâng lên tù 6 tháng đến 3 năm.

## Ghi chú

Không có điều luật nào nhắc tới GPL, nên chỗ dựa là các điều chung về xâm phạm quyền tác giả, và những điều đó có mức tiền đọc được; nhưng ở Việt Nam chưa tìm được bản án công bố nào về vi phạm giấy phép mã nguồn mở, nên đây là mức chắc của luật chứ không phải chỗ dựa cho một vụ kiện đã có tiền lệ. Ba cái bẫy hay gặp. Một: dùng một thư viện GPL trong phần mềm đóng gói bán cho khách và tin rằng "chỉ gọi qua API nên không lây"; ranh giới giữa gọi qua mạng, liên kết động và liên kết tĩnh là chuyện diễn giải giấy phép, và bên bán là bên phải chứng minh. Hai: lấy dự án AGPL về dựng dịch vụ chạy trên web, không phát hành tệp cài đặt nên tưởng không phải mở gì; AGPL nhắm đúng vào kiểu cung cấp qua mạng đó. Ba: tải code trên GitHub về dùng vì thấy kho không có tệp LICENSE; không có giấy phép nghĩa là tác giả giữ toàn quyền, không phải bỏ quyền, và mặc định đó làm mọi bản sao thành hành vi không được phép. Mục này không có nghĩa là cấm dùng phần mềm mã nguồn mở trong sản phẩm thương mại, không buộc mọi dòng code của bạn phải mở, và không nói GPL là giấy phép xấu: việc phải làm là đọc giấy phép trước khi đưa vào, rồi chọn giấy phép cho sản phẩm của mình.

## Nguồn

Luật Sở hữu trí tuệ, bản hợp nhất 155/VBHN-VPQH ngày 9-9-2025 (Điều 20 khoản 1, Điều 28 khoản 2, Điều 205) — https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/9/155-vbhn-vpqh.pdf ; Bộ luật Hình sự, bản hợp nhất 135/VBHN-VPQH (Điều 225 khoản 1 và khoản 2) — https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/9/135-vbhn-vpqh.pdf . Tra ngày 3/11/2026.
