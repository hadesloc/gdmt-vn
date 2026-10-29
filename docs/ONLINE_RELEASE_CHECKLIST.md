# Các việc còn lại trước khi đưa GDMT-VN online

Cập nhật29/10/2026 sau KB-HASH-01. Đọc cùng [plan](REMEDIATION_PLAN_20261028.md), [status](PROJECT_STATUS.md), [ledger](FINDINGS_LEDGER.md). Checklist này không phải bằng chứng đã triển khai host hoặc đã đạt nghiệm thu lâm sàng.

## Hai mốc khác nhau

**Bản thử nghiệm nội bộ với hồ sơ giả lập:** có thể tách thành mốc sớm để kiểm trải nghiệm. Cần build production, luồng chính trên desktop/điện thoại, giới hạn phạm vi hiển thị rõ, chia sẻ/reload/nguồn hoạt động đúng, hostHTTPS và khả năng quay lui. Không xem mốc này là sản phẩm đã được kiểm định khuyến cáo cho bệnh nhân thực.

**Bản1.0 hoàn chỉnh theo plan:** phải đạt các cổng dưới đây. Test/build xanh không thay thế review nguồn/ngữ nghĩa lâm sàng.

| Việc | Hiện trạng | Bằng chứng còn cần |
|---|---|---|
| SRC-01/SRC-02 nguồn | Ozempic và metformin đã sửa định danh/citation trong task con; còn GOLD/UKKA/Kerendia,83 nguồn chưa storedhash/30 chưaURL và audit rộng | Version/route/page/hash, nguồn chính thức phù hợp claim, impact review các thay đổi; chưa tuyên bố179nhãn đều mới nhất |
| CL-02/03/04, HF-01/02 | Hai Critical CKD CL-01, FDC R5 R1-03 và RASi–finerenone R1-04 và GLP-1 R1-05 và citation gan R1-06 đã TESTED; còn các finding CKD khác, THA PartB, Hen và tối ưuFMT/bước liều suy tim | Từng input tái hiện, regression fail trước/pass sau, đầu ra/note/gate nhất quán; reviewer xác nhận disposition |
| ENG-01/DATA-01/A11Y/UX | Còn nguồn phát sinh tương tác, dữ kiện lặp, nhãn accessible, mật độ form/khuyến cáo | State/URL không xung đột, tương tác phân biệt đang dùng/đề xuất, keyboard/focus/label và ảnh desktop/mobile |
| QA-01/REVIEW-01 | Có ledger; chưa chứng minh hai vòng sạch đủ9module; CKD R5 còn thiếuR2/R3;9ca import on-call skipped | Hai vòng liên tiếp0Critical/0Major đủR1/R2/R3 trên snapshot chốt, dispositionQA-1..10 và từngskip; không tự nâng badge |
| E2E-01 | Đã có một số smoke UI/mobile/offline; chưa nghiệm thu toàn ma trận | Production online/offline, nâng cấpserviceworker, hồ sơ→thuốc→plan→nguồn→note/link/reload/in,3profile/2bối cảnh, đa bệnh/missing inputs, LAN/thiết bị và accessibility |
| Hiệu năng/REL-01 | Build đạt; chunk>500KB vẫn còn, chưa có benchmark đủ | Đo production theo cùng điều kiện; Lighthouse3lần/median theo plan, xử lý vấn đề thực tế; đóng ledger và release evidence cùng snapshot |
| Host/domain/HTTPS | Chưa chọn hoặc triển khai trong lượt này | Cấu hình host/domainHTTPS, phục vụ asset/URL đúng, kiểm bản public thực tế, cache/update đúng và lưu bản trước để quay lui |

## Bằng chứng kỹ thuật hiện có

Sau KB-HASH-01: **104/104 file PASS; 2,309 test PASS, 9 skipped (2,318 tổng), 204.24 giây**, TypeScript/KB/build/PWA đạt; [log và báo cáo](../reports/kb-hash-01-20261029/README.md). Đây là nghiệm thu kỹ thuật của snapshot hiện tại, không phải toàn bộ các cổng ở bảng đã đạt.

Thứ tự tiếp tục: nguồn liên quan phải được xác minh trước mỗi sửa lâm sàng → CL-02 theo từng finding → các task an toàn/shared/UI theo dependency → review sạch và E2E/performance → chuẩn bị bản release và kiểm host thực tế. Không cần đợi sửa mỹ thuật xong mới xử lý finding an toàn.

CL-DM2-GLP1-RENAL còn cần rà trước release: source CrCl/eGFR và dạng ER trong DM2-only; CKD/shared-merge fix không chứng minh toàn bộ DM2 đã đúng.

**KB-HASH-01 đã CLOSED kỹ thuật:** hash v2 phủ trường lồng, UI/bộ lọc chặn trạng thái stale/legacy/caller tự gán. Migration1373state về draft, giữ1621report; reviewed độc lập, full3016fileSHA không đổi. Không cấp clinical approval. Cần review lại trên version/hash hiện tại và đủ source/QA/E2E/performance trước release; CLI review hiện sample-only, coverage citation không phải toàn1522. Tiếp CL-02e/R1-07.
