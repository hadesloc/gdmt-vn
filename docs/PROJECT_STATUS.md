# Trạng thái hiện hành GDMT-VN — 29/10/2026

**Đã có bản triển khai 9 module; chưa hoàn tất nghiệm thu sản phẩm hoặc kiểm định lâm sàng.** Đây là trang tóm tắt hiện hành. Các dashboard đầu progress cũ là lịch sử và không phải bằng chứng hoàn thành hiện tại.

Kế hoạch đang áp dụng: [REMEDIATION_PLAN_20261028](REMEDIATION_PLAN_20261028.md). Nguồn: [SOURCE_AUDIT_20261028](SOURCE_AUDIT_20261028.md). UX: [audit gdmt.org](../reports/product-audit-20261028/README.md).

Sau lập plan, đã triển khai SRC-01a (nguồn semaglutide) và UI-MED-01 (nhóm thuốc 8 module/lọc bệnh); báo cáo ở mục7 của plan. Đây là task con, không đóng SRC-01 hoặc nghiệm thu lâm sàng toàn dự án.

## Đã kiểm chứng

| Phạm vi | Bằng chứng mới nhất | Giới hạn |
|---|---|---|
| Kỹ thuật | **104/104 file PASS; 2,309 test PASS, 9 skipped (2,318 tổng), 204.24 giây**; TypeScript/KB/build/PWA PASS. [Test](../reports/kb-hash-01-20261029/vitest-release.log), [build](../reports/kb-hash-01-20261029/build-release.log) | Snapshot KB-HASH-01: 3016 file không đổi; không thay clinical review. |
| KB | 136 nguồn,1522 citation,955 ngưỡng,179 thuốc,125 interaction,1373 review; verification 0 lỗi/0 cảnh báo | KB-HASH-01 đã CLOSED kỹ thuật: hash v2 phủ trường lồng; 1373 review về draft, giữ nguyên 1621 báo cáo trong history. Chưa clinical review. |
| Thuốc đang dùng | Nhóm theo loại thuốc đủ 9 module, lọc bệnh giữ state, editor/liều/tìm kiếm/URL; test và ảnh desktop/mobile trong [UI-MED-01](../reports/medication-groups-20261028/README.md) | Chưa nghiệm thu toàn bộ9 module/E2E/accessibility. |
| Tài liệu local | Sau CL-02d: 136/136 file; 53 stored hash khớp; 106 URL. [Kiểm chứng](../reports/cl02d-rasi-hepatic-20261029/source-validation.json) | 83 thiếu hash/30 thiếu URL; source audit rộng còn mở. |
| Plan và audit | DO-00 và DO-01 hoàn tất trong phạm vi tài liệu; [ledger](FINDINGS_LEDGER.md) nhập đủ review/QA/audit, có hash và reviewer gap | Finding chưa tái hiện vẫn needs_reproduction; không tự đóng từ response DONE. |

## Các vùng còn mở

| Module / vùng | Trạng thái triển khai và hàng đợi | Review sạch |
|---|---|---|
| CKD | R5 R1-01..06 đã TESTED/chờ review; còn R1-07..10 và reviewer khác; R5 R2/R3 chưa có. | Chưa đủ hai vòng sạch |
| THA | `docs/reviews/htn/round2_RESPONSE.md` PartB còn rule logic; CL-03. | Chưa đủ |
| Hen | Đã triển khai các sửaMgSO4/CYP3A4/tuổi/thiết bị/actionplan; citationDPI và findingR4 chưa đóng toàn bộ; CL-04. | Triển khai/test không thay closure review |
| Suy tim | Audit thêmHF-01/02: tối ưuFMT và bước liều; ràDigoxin theo chỉ định; phối hợpENG-01. | Chưa đủ |
| DM2 | Đã triển khai; thêm source-form audit Ozempic→citation/rule và các finding hiện hành cần lập ledger. | Chưa đủ |
| COPD | Đã triển khai; GOLD report localv1.2 so với publisherv1.3 cần impactreview. | Chưa đủ |
| Gút | Đã triển khai; nguồn nềnACR 2020/EULAR 2016, nhãn thuốc cần reviewcurrentness. | Chưa đủ |
| Lipid | Đã triển khai; bộ quốc tế mới, nguồnVNHA2024 còn thiếu bằng inventory; kiểm scopeprofile. | Chưa đủ |
| AF | Đã triển khai; nguồnVNHA/VNHRS2022 còn thiếu bằng inventory, kiểm nhãnDOAC. | Chưa đủ |
| Shared engine/UI | Provenance tương tác; dữ kiện lặp; accessible-name; form/plan density; QA-1..10 đã có ledger; disposition hiện hành còn mở | Chưa đủ |
| Nghiệm thu | Performance/chunk, browserE2E, offline/update, mobile/desktop/LAN, keyboard/screenreader | Chưa đủ |

## Cổng duyệt và tiến độ

- App tối đa `ai_multi_reviewed`, cần2 vòng liên tiếp0 Critical/0 Major đủR1/R2/R3 cho phạm vi đã khóa và cóhash. Không giả danh bác sĩ đã duyệt; review cũ mất hiệu lực khi thay đổi material phần liên quan.
- Tách trạng thái `IMPLEMENTED`, `TESTED`, `REVIEWED`, `CLOSED`. Không lấy test xanh hoặc phản hồi writer làm nghiệm thu độc lập.
- Ước lượng tổng khoảng70% từng trao đổi là ước lượng quản lý, không phải số liệu nghiệm thu. Không tăng tỷ lệ vì thêm plan; chỉ báo gate/task có bằng chứng.
- Việc tiếp theo: CL-02 theo từng finding CKD còn mở, nguồn được xác minh trước sửa; THA PartB/Hen/HF/ENG/DATA theo dependency; SRC-01 tiếp GOLD/UKKA/Kerendia. SRC-01b/CL-01 chờ review phạm vi đã đổi.
- DO-01 chỉ thay tài liệu: không sửa engine/KB/UI, không chạy lại test lâm sàng. Nguồn online trong audit vẫn là snapshot ngày 28/10/2026; chưa kiểm mới nhất mọi nhãn. SRC-01a/UI-MED-01 có log nghiệm thu riêng như trên.

## DO-01 — ledger đã lập

Đã nhập 1.279 finding lịch sử từ 79 artifact review; số chính xác theo inventory trong [ledger](FINDINGS_LEDGER.md). Tách vòng mới nhất từng reviewer khỏi lịch sử, giữ tất cả ID/index/hash; gắn QA-1..10, audit UX, nguồn và 9 ca skipped. CKD thiếu R5 R2/R3, Hen có finding mới TESTED/partial chờ reviewer, THA Part B có mapping từng ID. [Báo cáo DO-01](../reports/do01-ledger-20261028/README.md) ghi kiểm coverage/link/hash và giới hạn. Không nâng clinical review hoặc tỷ lệ tiến độ.

## CL-01 — đã kiểm thử, chờ review

Hai finding Critical được tái hiện3/3fail trước sửa; thêm43ca pipeline và7ca nguồn. Phần kiểm liều dùng chung xử lý tổng hoạt chất/đề xuất thay đổi/FDC và đồng bộ khuyến cáo; không tự đoán liều thiếu hoặc ngoại lệ UGT. [Giải trình](reviews/ckd/round5_R1_01_02_RESPONSE_20261028.md). Clinical closure chưa có; nguồn metformin phát hiện trong task đã được xử lý tiếp ở SRC-01b.

## SRC-01b và mốc online

Đã hòa giải nguồn metformin đơn chất/phối hợp, migrate5citation và thêm1contraindication; sửa routing renal/acidosis/contrast. Năm review thuốc/ngưỡng ởdraft, interaction chỉ technical auto_checked. [Báo cáo](../reports/src01b-metformin-20261028/README.md). Phần metformin của CKD-R5-R1-08 đã xử lý, phần RAS stenosis còn mở.

[Checklist trước online](ONLINE_RELEASE_CHECKLIST.md) tách bản thử nghiệm nội bộ bằng hồ sơ giả lập với bản1.0 hoàn chỉnh. Chưa chọn host/domain hoặc triển khai public; source/clinical review/E2E/accessibility/performance/update/LAN còn theo plan.

## CL-02a — FDC sang SGLT2i đơn chất

Đã sửa mất đường tiếp tục dưới20 và xung đột START/AVOID/SWITCH khi đa bệnh; 44ca mới, cùng **92/92 file PASS; 2.126 test PASS. 9 skipped (2.135 tổng). 132.92 giây**. Thiếu liều/tần suất, dị ứng FDC chưa rõ thành phần, nhiều SGLT2i hoặc canagliflozin cần xác minh → DEFER không liều. [Báo cáo](../reports/cl02-ckd-fdc-continuation-20261028/README.md). Không nới cổng khởi trị mới dưới20; TESTED, chưa clinical CLOSED. Nguồn local/nhãn chính thức đã đối chiếu trong scope; metadata năm và citation trang tiếp tục của empag/dapa còn cần SRC-01. Tiếp CKD-R5-R1-04.

## CL-02b — RASi và finerenone

Đã sửa hai đường bế tắc R5 R1-04 và đính chính mô tả candesartan tự khởi trị trong tài liệu hiện hành. Không suy hạ huyết áp tư thế thành liều tối đa dung nạp; dùng bước đánh giá/xác nhận đã có. Thêm nguồn Atacand đúng PDF4 và kiểm hash. 30 ca hành vi + 6 ca nguồn mới; **94/94 file PASS; 2,162 test PASS, 9 skipped (2,171 tổng), 154.79 giây**. [Báo cáo](../reports/cl02b-rasi-finerenone-20261028/README.md). TESTED/chờ review lâm sàng; CL-02 tổng, citation gan R1-06 và source audit còn mở. Tiếp R5 R1-05 (GLP-1 RA).

## CL-02c — GLP-1 theo hoạt chất/dạng thuốc, 29/10/2026

Đã thêm an toàn thận CKD-only, hướng thay exenatide/lixisenatide khi có chỉ định và đủ dữ kiện, phân biệt bằng chứng kết cục và ngăn CONTINUE thuốc đã thay khi đa bệnh. Ba nhãn snapshot/bảy citation/ba threshold draft. **96/96 file PASS; 2,224 test PASS, 9 skipped (2,233 tổng), 196.41 giây**. [Báo cáo](../reports/cl02c-glp1-agents-20261029/README.md). Chờ clinical review; DM2-only renal/ER follow-up còn mở. Tiếp R1-06/citation gan theo plan.

## CL-02d — nguồn cho an toàn gan RASi

Đã sửa citation/metadata telmisartan và candesartan theo nhãn cùng thuốc, phân biệt FDA với EMA/SmPC Anh và nêu rõ chính sách thận trọng cả ba profile. Không sinh chuẩn độ ARB khi cổng gan yêu cầu STOP. Thêm39ca; **98/98 file PASS; 2,263 test PASS, 9 skipped (2,272 tổng), 202.76 giây**. [Báo cáo](../reports/cl02d-rasi-hepatic-20261029/README.md). Chưa clinical CLOSED.

**Ưu tiên kế tiếp: CL-02e / CKD-R5-R1-07** — kiểm claim/citation cho bú, dị ứng/phù mạch bằng tài liệu local trước sửa. KB-HASH-01 đã hoàn tất kỹ thuật và review độc lập; các hồ sơ clinical vẫn draft. DM2-only renal/ER, source audit, QA/E2E và cổng online vẫn mở.

## KB-HASH-01 — 29/10/2026

Đã sửa serializer sâu dùng chung browser/CLI, hashVersion sha256-json-v2, giữ thứ tự array/khóa metadata lồng; chặn stale/legacy và caller tự truyền nhãn duyệt ở UI/bộ lọc. Migration 1373 hồ sơ về draft, giữ nguyên 1621 báo cáo; dry-run không ghi state/cấp duyệt. Thêm46ca; final test/build theo bảng trên; reviewer độc lập kiểm history và tất cả review JSON không mismatch. [Báo cáo](../reports/kb-hash-01-20261029/README.md). CLOSED kỹ thuật; REVIEW-01 còn mở, không tăng % từ số test. Citation chưa có state vẫn draft; CLI review hiện sample-only.
