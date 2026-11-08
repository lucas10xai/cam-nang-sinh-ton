---
id: nghi-viec-thi-ban-giao-quyen-truy-cap-khong-xoa-du-lieu
legacy: "11-6"
chapter: 11
number: 6
title: Nghỉ việc thì bàn giao quyền truy cập, không xóa dữ liệu, không để cửa sau, không đổi mật khẩu khóa hệ thống — dù công ty còn nợ lương
cost:
  money: "0"
  time: low
  will: mid
benefit: large
metric: time
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
  quangpao: "11-6"
  luonglb: null
related: []
situations: []
tags: []
---

## Nói dễ hiểu

Tài khoản và mật khẩu là của công ty, không phải của bạn. Công ty phải tất toán trong 14 ngày làm việc, nên nợ lương thì đòi ở đó. Nghỉ rồi còn đăng nhập, đặt lại mật khẩu thì khung tù 1 năm đến 5 năm; xóa dữ liệu tới mức hệ thống tê liệt là tội khác, khung 6 tháng đến 3 năm.

## Chi phí

Không mất tiền, mất nửa ngày cuối cùng ở công ty: liệt kê tài khoản, gỡ khóa SSH, gỡ token, ghi lại ai nhận. Khó ở chỗ đúng lúc bị nợ lương thì việc gỡ quyền truy cập của mình là việc cuối cùng bạn muốn làm.

## Lợi ích

Bàn giao tài khoản và tài sản công ty theo biên bản khi nghỉ việc. Giữ bản xác nhận đã bàn giao giúp tránh tranh chấp về dữ liệu, mật khẩu và trách nhiệm vận hành.

## Pháp luật Việt Nam

Điều 48 khoản 1 Bộ luật Lao động 2019 buộc hai bên thanh toán đầy đủ các khoản tiền liên quan đến quyền lợi của mỗi bên trong 14 ngày làm việc kể từ ngày chấm dứt hợp đồng, chỉ được kéo dài nhưng không quá 30 ngày trong bốn trường hợp: công ty chấm dứt hoạt động, thay đổi cơ cấu công nghệ hoặc vì lý do kinh tế, chia tách sáp nhập hoặc chuyển nhượng, và thiên tai, hỏa hoạn, địch họa, dịch bệnh nguy hiểm. Điều 129 khoản 1 buộc người lao động bồi thường khi làm hư hỏng dụng cụ, thiết bị hoặc có hành vi khác gây thiệt hại tài sản của công ty. Về hình sự, Điều 289 khoản 1 Bộ luật Hình sự phạt tù từ 1 năm đến 5 năm với người "sử dụng quyền quản trị của người khác" hoặc vượt qua cảnh báo, mã truy cập để xâm nhập trái phép, và việc còn dùng tài khoản quản trị sau khi đã nghỉ nằm đúng ở chữ "của người khác" đó. Nếu bạn xóa hoặc sửa dữ liệu, Điều 287 khoản 1 phạt tiền 30 triệu đồng đến 200 triệu đồng hoặc tù 6 tháng đến 3 năm với người tự ý xóa, làm tổn hại hoặc thay đổi phần mềm, dữ liệu điện tử, khi thu lợi bất chính từ 50 triệu đồng, hoặc gây thiệt hại từ 100 triệu đồng, hoặc làm tê liệt hệ thống từ 30 phút đến dưới 24 giờ, hoặc làm đình trệ hoạt động của cơ quan, tổ chức từ 24 giờ đến dưới 72 giờ; khoản 2 lên tù 3 năm đến 7 năm. Nếu bạn để lại một đoạn mã tự chạy, Điều 286 khoản 1 xử việc cố ý phát tán chương trình tin học gây hại, khung phạt tiền 50 triệu đồng đến 200 triệu đồng, cải tạo không giam giữ đến 3 năm hoặc tù 6 tháng đến 3 năm, với ngưỡng thiệt hại từ 50 triệu đồng hoặc làm lây nhiễm từ 50 phương tiện điện tử.

## Ghi chú

Ba điều đều có khung đọc được nguyên văn và ngưỡng thiệt hại rõ, nhưng không điều nào nói tới quan hệ lao động đã chấm dứt, nên phải ghép với nhau; ở Việt Nam chưa có bản án công bố nào về đúng cảnh nợ lương rồi xóa dữ liệu để lên A. Ba cái bẫy hay gặp. Một: giữ lại một tài khoản có quyền quản trị "để phòng khi cần lấy lại tiền lương" — đây là chỗ nguy hiểm nhất, vì chỉ cần một lần đăng nhập sau ngày nghỉ là đã đủ hành vi, không cần bạn làm gì thêm. Hai: xóa dữ liệu của chính mình tạo ra trong thời gian làm việc, nghĩ rằng đó là tài sản của mình — Điều 287 khoản 1 không hỏi dữ liệu của ai, nó hỏi bạn có quyền xóa hay không; mà quyền đó chấm dứt cùng hợp đồng. Ba: để lại một cron job, một tài khoản ẩn hoặc một khóa SSH dự phòng coi như "đường lui", trong khi Điều 286 khoản 1 tính đúng loại chương trình tự chạy đó, và ngưỡng khởi điểm chỉ là thiệt hại 50 triệu đồng. Mục này không có nghĩa là bạn phải chịu mất lương: đòi lương là việc của trình tự lao động, còn quyền truy cập phải trả lại đúng ngày dù công ty chưa trả lương, và không được lấy việc này để ép việc kia.

## Nguồn

Bộ luật Lao động số 45/2019/QH14, Công báo 993+994 ngày 26/12/2019 (Điều 48 khoản 1, Điều 129 khoản 1) — https://congbao.chinhphu.vn/van-ban/bo-luat-so-45-2019-qh14-30232.htm ; Bộ luật Hình sự, bản hợp nhất 135/VBHN-VPQH (Điều 286 khoản 1, Điều 287 khoản 1 và 2, Điều 289 khoản 1) — https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/9/135-vbhn-vpqh.pdf . Tra ngày 3/11/2026.
