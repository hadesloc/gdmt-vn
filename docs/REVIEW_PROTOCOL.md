# Quy trình duyệt AI đa chuyên khoa (Review Board)

> **Hiệu lực bằng chứng, cập nhật 29/10/2026:** KB-HASH-01 đã sửa hash sâu dùng chung browser/CLI, version `sha256-json-v2`. 1.373 review state đã về draft và giữ 1.621 báo cáo cũ trong history. Báo cáo legacy hoặc khác hash không được cộng vào round hiện tại. Dry-run không cấp duyệt. Đây là sửa tính toàn vẹn kỹ thuật, chưa đạt cổng lâm sàng bên dưới. Item hash không bao phủ bắc cầu source/citation/rule phụ thuộc; mỗi vòng vẫn khóa full-file snapshot và xác nhận impact trước tái dùng bằng chứng. CLI AI hiện sample-only và cấu hình provider lịch sử chưa được phê duyệt để chạy thật; task này không gọi provider. [Bằng chứng](../reports/kb-hash-01-20261029/README.md).

Mỗi module qua ≥2 vòng. Mỗi vòng có 3 reviewer ĐỘC LẬP (không xem báo cáo của nhau trong cùng vòng):

| Vai | Trọng tâm |
|---|---|
| **R1 – Chuyên gia chuyên khoa / guideline checker** | Mỗi luật & khuyến cáo có đúng nội dung, ngưỡng, Class/LOE của guideline gốc không; có bỏ sót khuyến cáo quan trọng (Class I) không; profileDiff INTL/VN/US đúng không; trích dẫn có thật sự hỗ trợ khẳng định (không chỉ "chứa số") không; locator/trang đúng không. Phải mở text trang PDF để đối chiếu. |
| **R2 – Dược lâm sàng** | DrugEntry: liều khởi/đích/tối đa/chuẩn độ, chỉnh liều thận/gan, chống chỉ định, tương tác, dạng & biệt dược tại VN; ô ma trận; liều trong khuyến cáo khớp nhãn/guideline; đơn vị. |
| **R3 – Phản biện an toàn (adversarial)** | Tự viết ≥40 BN đối nghịch (giá trị biên, thiếu dữ liệu, bệnh đồng mắc mâu thuẫn, thuốc đang dùng chồng chéo, nội viện vs ngoại trú, đổi profile) và chạy `evaluate()` thật (script tsx trong `docs/reviews/<module>/scratch/`); tìm khuyến cáo nguy hiểm, mâu thuẫn, thiếu cảnh báo, sai hành động (START khi nên HOLD…), chữ tiếng Việt sai/khó hiểu trên UI. |

## Quy tắc
- Reviewer **KHÔNG sửa** code/KB của module. Chỉ ghi: `docs/reviews/<module>/round<N>_<R1|R2|R3>.md` + `docs/reviews/<module>/round<N>_<R1|R2|R3>.json` và script trong `docs/reviews/<module>/scratch/`.
- JSON findings: `[{id, severity: "critical"|"major"|"minor"|"suggestion", itemType: "rule"|"drug"|"threshold"|"citation"|"matrix"|"ui"|"missing", itemId, finding, evidence (trích nguyên văn + nguồn + trang, hoặc input BN + output engine), suggestedFix}]`.
- `critical` = có thể gây hại BN nếu làm theo. `major` = sai guideline/liều nhưng ít nguy hiểm tức thì, hoặc thiếu khuyến cáo Class I.
- Mọi finding phải có bằng chứng kiểm chứng được; không phát biểu chung chung.
- Kết luận cuối file: PASS (0 critical, 0 major) / FAIL.
- Sau vòng: điều phối gộp → module owner sửa → vòng tiếp theo (reviewer mới, cũng độc lập) kiểm cả fix lẫn toàn module. Module đạt `ai_multi_reviewed` khi 2 vòng liên tiếp cả 3 vai PASS.
- Nguồn: `docs/SOURCES_STATUS.md`; text PDF: `Medical_Library_2026/00_INDEX/_text_cache/*.json`, `on-call/tools/m12/.cache/*.json`, `gdmt-vn/tools/kb/.cache`; tra: `npm run kb:search -- --pdf "<rel>" --query "<text>"` hoặc `--all`.
