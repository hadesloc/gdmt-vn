# Cẩm Nang Sử Dụng Bộ Truy Xuất Knowledge Base (`KB_ACCESS.md`)

Tài liệu quy chuẩn dành cho các kỹ sư phát triển Module lâm sàng (Agents B, E, F, G) về cách truy xuất giá trị ngưỡng, liều lượng và trích dẫn y học chứng cứ từ Knowledge Base (`@/kb-types`).

---

## 1. Triết Lý Cốt Lõi: Đơn Nguồn Chân Lý (Single Source of Truth)

> [!IMPORTANT]
> **Tuyệt đối KHÔNG hardcode số lâm sàng trong mã nguồn module.**
> Toàn bộ các giá trị ngưỡng (ngưỡng eGFR, K⁺, SBP, HbA1c...), liều lượng thuốc (khởi đầu, liều đích, chuẩn độ, liều tối đa) và dải chỉnh liều thận **bắt buộc phải được truy xuất qua bộ Accessor API trung tâm** (`src/kb-types/access.ts`).

### Các Lợi Ích Trực Tiếp:
1. **Kiểm chứng máy 100%**: Tránh lỗi "số mồ côi" – mọi con số đều gắn liền với Citation và số trang PDF trong `Medical_Library_2026`.
2. **Fail-Fast tại Build/Test**: Nếu bạn gõ sai một ký tự trong ID Threshold hoặc Drug ID, hệ thống sẽ **ném lỗi ngay lập tức** trong lúc chạy test/build thay vì để lọt lỗi lâm sàng ra giao diện.
3. **Đồng bộ đa bệnh**: Khi guideline cập nhật một ngưỡng mới (ví dụ KDIGO đổi ngưỡng SGLT2i từ 20 xuống 15), kỹ sư KB chỉ cần sửa 1 file JSON duy nhất, toàn bộ 9 module sẽ tự động cập nhật đồng bộ.

---

## 2. Danh Mục API Truy Xuất (`src/kb-types/access.ts`)

Import trực tiếp từ `@/kb-types` (hoặc `../../kb-types`):

```ts
import { th, thFor, thr, drug, dose, renalBand, fmtDose } from '@/kb-types';
```

### 2.1 `thFor(quantity, id): number` – Lấy Ngưỡng Kiểm Tra Chặt Chẽ Đại Lượng (KHUYẾN CÁO QA-10)
Phương thức an toàn tuyệt đối giúp ngăn chặn lỗi nhầm lẫn giữa các ngưỡng trùng giá trị số (ví dụ: lấy nhầm ngưỡng eGFR so với % LDL hoặc số đợt cấp):
- **Tham số 1 (`quantity`)**: Đại lượng lâm sàng bắt buộc (`'egfr'`, `'crcl'`, `'k'`, `'sbp'`, `'lvef'`, `'uacr'`, `'hba1c'`, `'bmi'`, `'exacerbation_count'`, `'ldl_reduction_pct'`...).
- **Tham số 2 (`id`)**: Định danh Threshold trong KB.
- **Cơ chế an toàn**: Ném `Error` ngay lập tức nếu ID không tồn tại **HOẶC** nếu Threshold có trường `quantity` khác với đại lượng kỳ vọng!

```ts
// AN TOÀN TUYỆT ĐỐI (QA-10):
const egfr = need(ctx, 'egfr');
if (egfr !== undefined && egfr < thFor('egfr', 'ckd.metformin.egfr_contra')) {
  action = 'STOP';
}

// NẾU VÔ TÌNH LẤY NHẦM NGƯỠNG TRÙNG SỐ:
// thFor('egfr', 'lipid.reduction.pcsk9_alone'); 
// => NÉM LỖI: [QA-10 Quantity Mismatch] Kỳ vọng 'egfr' nhưng threshold mang 'ldl_reduction_pct'!
```

### 2.2 `th(id: string): number` – Lấy Giá Trị Số Đơn Thuần
Dùng khi lấy giá trị số không ràng buộc kiểm tra đại lượng:
- Ném `Error` nếu `id` không tồn tại trong KB.

```ts
if (k >= th('ckd.mra.k_hold_threshold')) {
  action = 'HOLD';
}
```

---

### 2.3 `thr(id: string): Threshold` – Lấy Đầy Đủ Thuộc Tính & Citation
Dùng khi bạn cần tạo `Recommendation` hoặc cổng an toàn cần:
- Giá trị số (`value`)
- Đơn vị đo (`unit`)
- Danh sách trích dẫn chứng cứ (`citationIds`)
- Giải thích tiếng Việt (`descriptionVi`)

```ts
const egfrThreshold = thr('ckd.sglt2i.egfr_initiate_min');

return {
  id: 'rec_ckd_sglt2i',
  action: 'START',
  drugId: 'dapagliflozin',
  gates: [
    {
      parameter: 'eGFR',
      passed: egfr >= egfrThreshold.value,
      value: egfr,
      threshold: egfrThreshold.value,
      messageVi: `eGFR ${egfr} ${egfrThreshold.unit} ≥ ${egfrThreshold.value}: Đạt tiêu chuẩn khởi trị`
    }
  ],
  // Gắn trích dẫn tự động từ Threshold:
  citationIds: [...egfrThreshold.citationIds]
};
```

---

### 2.3 `drug(drugId: string): DrugEntry` – Lấy Toàn Bộ Hồ Sơ Thuốc
Truy xuất hồ sơ thuốc từ `kb/drugs/*.json` (chứa tên tiếng Việt, dạng bào chế, biệt dược VN, liều dùng, tương tác, dải thận).
- Ném `Error` nếu `drugId` không tồn tại.

```ts
const dapa = drug('dapagliflozin');
console.log(dapa.nameVi);   // "Dapagliflozin"
console.log(dapa.vnBrands); // ["Forxiga"]
console.log(dapa.forms);    // ["Viên nén bao phim 10 mg", ...]
```

---

### 2.4 `dose(drugId, kind)` & `fmtDose()` – Lấy & Định Dạng Liều Dùng
Lấy liều lượng cụ thể từ từ điển thuốc mà không hardcode chuỗi chữ:
- `kind`: `'start'` (khởi đầu) | `'target'` (liều đích) | `'step'` (bước chỉnh) | `'max'` (tối đa).
- `fmtDose()`: chuyển object `Dose` sang văn bản tiếng Việt chuẩn mực.

```ts
// Lấy liều khởi đầu:
const startDoseObj = dose('dapagliflozin', 'start');
const startDoseText = fmtDose(startDoseObj); 
// => "10 mg x 1 lần/ngày (uống)"

// Hiển thị trong Recommendation:
return {
  drugId: 'dapagliflozin',
  dose: fmtDose(dose('dapagliflozin', 'start')), // KHÔNG hardcode '10 mg x 1 lần/ngày'
  title: `Khởi trị ${drug('dapagliflozin').nameVi} (${fmtDose(dose('dapagliflozin', 'start'))})`,
  ...
};
```

---

### 2.5 `renalBand(drugId, val, kind)` – Truy Vấn Dải Thận Tự Động
Lấy thông tin khuyến nghị (`initiate`, `continue`, `dose`, `citationIds`, `note`) theo mức lọc cầu thận eGFR hoặc CrCl hiện tại của bệnh nhân:

```ts
const egfr = need(ctx, 'egfr');
if (egfr !== undefined) {
  const band = renalBand('dapagliflozin', egfr);
  if (band) {
    console.log(band.initiate);    // 'rec' | 'caution' | 'not_rec' | 'contra'
    console.log(band.dose);        // Liều theo dải thận này
    console.log(band.citationIds); // Trích dẫn chứng cứ cho dải này
  }
}
```

---

## 3. Chính Sách QA-8: Nghiêm Cấm Lách Linter & Quy Định `qa-allow`

### 3.1 Cấm Khai Báo File / Const Hằng Số Lâm Sàng Cục Bộ
- **LỖI `MODULE_CONST_CLINICAL_NUMBERS`**: Cấm tạo các file dạng `src/modules/<module>/thresholds.ts` hoặc khai báo `const *_THRESHOLDS = { ... }` chứa số lâm sàng trong module.
- Mọi ngưỡng số phải được kỹ sư KB khai báo trong `kb/thresholds/` và đọc qua hàm `th('...')`.

### 3.2 Quy Định Duy Nhất Về Chú Thích `// qa-allow:`
Hệ thống CI/CD và `rulesLint` **CHỈ CHẤP NHẬN 3 LOẠI** chú thích sau (kèm lý do giải thích cụ thể):
1. `// qa-allow: ui-step - <lý do>`: Dùng cho số thứ tự bước giao diện (ví dụ `step: 1`, `step: 2`).
2. `// qa-allow: index - <lý do>`: Dùng cho chỉ số mảng, offset hiển thị (ví dụ `idx + 1`, `slice(0, 10)`).
3. `// qa-allow: unit-conversion - <lý do>`: Dùng cho các hệ số toán học chuyển đổi đơn vị cố định (ví dụ `* 10`, `/ 18.0`).

> [!CAUTION]
> **CẤM TUYỆT ĐỐI** dùng `// qa-allow:` trên các dòng chứa ngưỡng lâm sàng, liều dùng thuốc, ô ma trận hoặc biểu thức điều kiện của luật. Mọi `qa-allow` sai loại sẽ bị hệ thống báo **LỖI**.

---

## 4. Bảng Tra Cứu Nhanh Chuyển Đổi Mã Nguồn

| Cách viết cũ (Bị Linter cảnh báo/lỗi) | Cách viết mới chuẩn mực (QA-1, QA-7, QA-8) |
|---|---|
| `const egfr = ctx.derived.egfr ?? 60;` | `const egfr = need(ctx, 'egfr');` *(fail-closed an toàn)* |
| `if (egfr < 30)` | `if (egfr < th('ckd.metformin.egfr_contra'))` |
| `if (k >= 5.5)` | `if (k >= th('ckd.k.hyperkalemia_threshold'))` |
| `dose: '10 mg x 1 lần/ngày'` | `dose: fmtDose(dose('dapagliflozin', 'start'))` |
| `title: 'Khởi trị Dapagliflozin 10 mg'` | `title: \`Khởi trị \${drug('dapagliflozin').nameVi} \${fmtDose(dose('dapagliflozin', 'start'))}\`` |
| `const DM2_THRESHOLDS = { hba1c: 7.0 };` | *Xóa bỏ file, dùng trực tiếp:* `th('dm2.glycemic.hba1c_target_general')` |
