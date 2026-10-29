# CKD-R5-R1-05 — CL-02c, 29/10/2026

Trạng thái: **TESTED / awaiting_independent_review**. Chưa clinical CLOSED; CL-02 tổng và CKD R5 R2/R3 còn mở.

Đã tái hiện hai lỗi đầu ra ở CKD-only: thiếu cảnh báo thận exenatide và mất đề xuất thay lixisenatide khi có chỉ định GLP-1. Đã sửa việc thoát sớm theo cả nhóm; bổ sung đánh giá renal riêng đúng hoạt chất/dạng/đại lượng. Đã tái hiện thêm xung đột CKD+DM2 vẫn CONTINUE thuốc đã được thay và trường hợp thiếu liều/lịch dùng vẫn SWITCH; có regression fail trước/pass sau.

Không áp nguyên xi đề xuất reviewer: Byetta dùng CrCl; Bydureon BCise dùng eGFR<45; lixisenatide dùng ADA≤30 thận trọng hơn nhãn<15. Chưa có CrCl hoặc dạng thuốc chưa rõ → DEFER, không suy từ eGFR. Lọc máu → STOP. Bút phối hợp insulin cần phác đồ insulin thay thế, không tự đổi liều.

Giữ phân biệt bằng chứng FLOW semaglutide SC, tín hiệu CVOT/albumin niệu dulaglutide/liraglutide, semaglutide uống và tirzepatide. Không tự chuyển các thuốc này chỉ vì cùng nhóm. Đề xuất thay exenatide/lixisenatide giữ các cổng an toàn hiện hành; ghi rõ không phối hợp hai GLP-1, xác minh liều cuối/thời điểm/dung nạp/khả năng tiếp cận với bác sĩ.

Nguồn, trang, hash và quyết định: [source-check](../../../reports/cl02c-glp1-agents-20261029/source-check.md). Ba snapshot nhãn mới, bảy citation và ba threshold draft; không nâng badge review.

Nghiệm thu kỹ thuật: **96/96 file PASS; 2,224 test PASS, 9 skipped (2,233 tổng), 196.41 giây**; build/TypeScript/KB/PWA PASS, KB0lỗi/0cảnhbáo. [Báo cáo](../../../reports/cl02c-glp1-agents-20261029/README.md). Review độc lập kỹ thuật được ghi riêng; không thay hai vòng R1/R2/R3 sạch.

Phạm vi còn mở: DM2-only vẫn có logic gộp eGFR/CrCl và chưa phân biệt exenatide ER; đã ghi follow-up trong ledger/plan. Các cổng MTC/viêm tụy/cho bú/dị ứng được giữ và kiểm không bị bypass; ngữ nghĩa riêng của chúng còn thuộc finding tiếp theo, chưa đóng bằng task này.
