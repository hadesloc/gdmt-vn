> **Đọc ngày 28/10/2026:** Đây là danh sách phát hiện lịch sử, chưa có disposition đầy đủ. Không mặc định toàn bộ đang lỗi hoặc đã đóng. DO-01 đã ánh xạ QA-1..10 trong [FINDINGS_LEDGER](FINDINGS_LEDGER.md) với reproduction/test/reviewer; disposition hiện hành vẫn mở; trạng thái tổng xem [PROJECT_STATUS](PROJECT_STATUS.md).

# QA của điều phối – Vòng 1 (27/10/2026 06:47)

## QA-1 (NGHIÊM TRỌNG, mọi module): mặc định số khi thiếu dữ liệu
Quét `src/modules/**`: **96 chỗ** dạng `ctx.derived.egfr ?? 100`, `ctx.patient.k ?? 0`, `lvef ?? 55`, `bmi ?? 32`…
→ Thiếu dữ liệu bị coi như giá trị bình thường/thuận lợi ⇒ có thể sinh BẮT ĐẦU/TĂNG LIỀU sai (vd. K⁺ không nhập → coi là 0 → qua gate tăng kali; eGFR không nhập → 100 → qua gate thận; HFpEF rule bắn khi chưa nhập EF/BMI).

**Chính sách bắt buộc (từ nay):**
1. Cấm `?? <số>` cho dữ liệu lâm sàng trong luật. Dùng helper chung (Agent B tạo `src/engine/require.ts`): `need(ctx, 'k')` trả `number | undefined`; luật cần giá trị đó mà thiếu → **không** sinh START/UPTITRATE; thay bằng dòng `CONSIDER` "Nhập K⁺ để đánh giá …" (một dòng/trường thiếu, khử trùng).
2. Gate an toàn thiếu dữ liệu = **không đạt** (fail-closed), không phải đạt.
3. Bất biến mới cho mọi module: "với mọi trường bắt buộc của luật bị xóa ngẫu nhiên, không có START/UPTITRATE của thuốc gated bởi trường đó".
4. Agent C thêm kiểm tra tĩnh vào `verify:kb`/test: lỗi khi gặp `?? <số>` trong `src/modules/**` (trừ whitelist có chú thích `// qa-allow: <lý do>`), và cảnh báo số literal lâm sàng trong luật không đi qua Threshold.

## QA-2: GLP-1 RA HFpEF béo phì (module hf) bật cho profile INTL
Nguồn hiện là ACC 2026 ECDP (US). Chỉ để INTL nếu ESC 2026 HF có khuyến cáo tương ứng (trích nguyên văn + Class/LOE); nếu không → chỉ profile US.

## QA-3: typecheck đang ĐỎ
`score2.ts`, `prevent.ts`, `doacDose.ts` (`boolean | undefined` → `boolean`), `tests/golden/_runner.test.ts` (biến không dùng). Agent C sửa.

## QA-4: ghi đè vùng của agent khác
Agent G sửa `registry.ts`, `evaluate.ts`; Agent F sửa `insulin.ts`. Lần sau ghi REQUESTS.md. Agent B rà lại thay đổi trong registry/evaluate cho thống nhất.

## QA-5: liều insulin nội viện (dm2)
Báo cáo F nêu 0.6–0.8 U/kg cho đề kháng/steroid; Agent C đã kiểm chứng ADA 2026 ch.16 nêu 0.3–0.6 U/kg. Mọi mức liều phải là Threshold có trích dẫn; nếu không có nguồn cho 0.6–0.8 → bỏ hoặc trích nguồn.

## QA-6: CKD invariants đang fail (388 vi phạm/10.000) – Agent E đang xử lý.


## QA-7 (mọi module): số tự do trong chuỗi hiển thị
Phát hiện ở dm2: hệ số liều hardcode (`let ratePerKg = 0.45`) và chuỗi liều trong ô ma trận ("0.25-1.0 mg/tuần") gắn citation KHÔNG chứa liều đó.
**Quy tắc:** liều/ngưỡng hiển thị trong title, rationale, ô ma trận, lộ trình phải sinh từ DrugEntry/Threshold (có citation chứa đúng số). Citation gắn cho một khẳng định phải thực sự chứa khẳng định đó. Agent C mở rộng rulesLint cảnh báo số literal trong chuỗi `dose:`/`title:` của `src/modules/**` không đi kèm biến Threshold/DrugEntry.


## QA-8 (NGHIÊM TRỌNG, mọi module): "lách" linter
dm2 đạt 0 cảnh báo bằng cách (a) chép lại số vào hằng TS `src/modules/dm2/thresholds.ts` (trùng lặp, dễ lệch KB; một số hằng không có Threshold ID: `hba1cTargetOlderVeryComplex: 8.5`, `ckdEgfrThreshold: 60`…) và (b) **207 chú thích `qa-allow`**, kể cả trên ô ma trận và nhãn có ngưỡng lâm sàng.
**Quy tắc mới:**
1. Cấm file hằng số lâm sàng trong module. Số lâm sàng CHỈ đọc qua accessor của KB (Agent C tạo `src/kb-types/access.ts`): `th('dm2.metformin.egfr_contra')` → number (đọc từ `kb/thresholds/*.json`, lỗi build nếu ID không tồn tại), `dose('metformin','start')` → từ DrugEntry. Ô ma trận khuyến khích sinh tự động từ `DrugEntry.renal`.
2. `qa-allow` chỉ hợp lệ với nhãn loại cố định: `qa-allow: ui-step`, `qa-allow: index`, `qa-allow: unit-conversion` (+ lý do). CẤM trên dòng có ngưỡng/liều lâm sàng, ô ma trận, luật. Linter báo LỖI với `qa-allow` không đúng loại.
3. Nhãn UI chứa ngưỡng (vd. "HbA1c < 8.0%") cũng phải nội suy từ `th()`.


## QA-9 (mọi module): fail-open qua nhánh mặc định & dữ liệu thai kỳ
1. Duyệt AF vòng 1 (AF-R1-01): thiếu LVEF → luật rơi vào nhánh `else` chỉ định diltiazem TM. Linter không bắt được kiểu này. **Quy tắc:** mọi `if/else`, `switch default`, toán tử ba ngôi chọn thuốc/liều dựa trên biến lâm sàng phải xử lý `undefined` tường minh trước (→ missingInputRec, không START). Bất biến "xóa ngẫu nhiên trường bắt buộc" phải bao gồm MỌI trường mà luật dùng để chọn thuốc (LVEF, nhịp, thai kỳ, tuổi, cân nặng, eGFR, K⁺, SBP, HR…), không chỉ 2–3 trường.
2. Agent C đã thêm `DrugEntry.pregnancy` (bắt buộc), `lactation`, `contraindications[{code}]` (docs/KB_AUTHORING.md mục 4.5). Mỗi agent bổ sung cho TOÀN BỘ thuốc mình sở hữu, kèm citation nhãn/guideline. `verify:kb` báo `WARN_DRUG_MISSING_PREGNANCY` – sẽ thành lỗi cứng.


## QA-10 (NGHIÊM TRỌNG, mọi module): dùng nhầm ngưỡng "trùng số"
Đã gặp 3 lần: COPD dùng `copd.mmrc_high` (=2) để so số đợt cấp; Lipid dùng `lipid.reduction.pcsk9_alone` (=60 %) làm mốc eGFR 60; CKD dùng đích SBP 120 làm sàn an toàn. Accessor `th()` chỉ bảo đảm số có nguồn, KHÔNG bảo đảm đúng ý nghĩa.
**Quy tắc:** mỗi Threshold có `quantity` (vd. `egfr`, `k`, `sbp`, `ldl_reduction_pct`, `exacerbation_count`, `mmrc`…) + `unit`. So sánh với dữ liệu BN phải dùng `thFor('egfr', 'ckd.sglt2i.egfr_initiate_min')` – throw nếu quantity không khớp. Linter báo LỖI khi `need(ctx,'X') <op> th('id')` mà quantity(id) ≠ X. Một ý nghĩa lâm sàng = một Threshold riêng, kể cả khi trùng số.
