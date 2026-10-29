# GDMT-VN – Hợp đồng Định nghĩa Module Lâm sàng (MODULE_CONTRACT.md)

Tài liệu chuẩn dành cho các Agent phát triển module chuyên khoa:
- **Agent E:** Module CKD (`src/modules/ckd/`)
- **Agent F:** Module ĐTĐ2 (`src/modules/dm2/`)
- **Agent G:** Module Suy tim (`src/modules/hf/`)
- Cùng các module tiếp theo (THA, COPD, Hen, Gút, Lipid, AF).

---

## 1. Nguyên tắc cốt lõi

1. **Vị trí tệp tin:** Mỗi module bắt buộc phải có tệp entry-point tại `src/modules/<moduleId>/index.ts`.
2. **Cơ chế nạp tự động (Dynamic Registry):** Hệ thống tại `src/modules/registry.ts` sử dụng `import.meta.glob` để tự động phát hiện và nạp mọi module hợp lệ. **Không cần sửa `AppShell.tsx` hay `evaluate.ts` khi thêm module mới.**
3. **Không hardcode số mồ côi (No Orphan Numbers):** Mọi ngưỡng số trong luật, bảng thận, chỉnh liều phải tồn tại trong ≥ 1 `Citation` liên kết (kiểm chứng bởi `npm run verify:kb`).
4. **Nhập liệu động (Dynamic Inputs):** Module tự khai báo trường nhập đặc thù qua `inputs.groups`. Giao diện `PatientForm` sẽ tự động hiển thị các trường này khi người dùng chọn bệnh tương ứng.

---

## 1.1 Dữ liệu thiếu = Fail-Closed (Bắt buộc)

> **CẢNH BÁO QUAN TRỌNG:**
> **TUYỆT ĐỐI CẤM** dùng toán tử fallback số dạng `ctx.derived.egfr ?? 100`, `ctx.patient.k ?? 0`, `lvef ?? 55`, `bmi ?? 32` trong các luật lâm sàng.
> Việc tự gán số lạc quan khi người dùng chưa nhập dữ liệu sẽ dẫn tới chỉ định sai nguy hiểm (vd: K⁺ thiếu bị coi là 0 -> lọt qua cổng tăng kali; eGFR thiếu bị coi là 100 -> khởi trị thuốc chống chỉ định).

### Quy định thực thi:
1. **Dùng helper chuẩn từ `src/engine/require`:**
   ```ts
   import { need, missingInputRec, hasCondition } from '../../engine/require';
   ```
2. **Trong hàm `when(ctx)` hoặc `produce(ctx)`:**
   - Lấy giá trị qua `need(ctx, 'egfr')`, `need(ctx, 'k')`, `need(ctx, 'lvef')`, `need(ctx, 'sbp')`, hoặc trường mở rộng `need(ctx, 'customInputs.xyz')` / `need(ctx, 'xyz')`.
   - Kiểm tra bệnh đồng mắc qua `hasCondition(ctx, key)` (hỗ trợ đồng nghĩa hai chiều an toàn: `pregnant` ↔ `pregnancy`, `ascvd` ↔ `vascularDisease`/`cad`/`pad`, `strokeOrTia` ↔ `stroke`/`tia`/`stroke_tia`, `af` ↔ `afib` + `rhythm`, `liverDisease` ↔ `liver_disease` ↔ `cirrhosis`, `dm` ↔ `diabetes`, `hf` ↔ `heartFailure`, `htn` ↔ `hypertension`, và chỉ cảnh báo khóa lạ tối đa 1 lần qua `Set` khử trùng).
   - Nếu giá trị trả về `undefined` (thiếu dữ liệu):
     - **KHÔNG ĐƯỢC** sinh khuyến cáo hành động điều trị (`START`, `UPTITRATE`, `CONTINUE`...).
     - Thay vào đó, nếu thông số này là điều kiện tiên quyết bắt buộc để đánh giá, sinh dòng `CONSIDER`:
       ```ts
       return missingInputRec('hf', 'k', 'chỉ định thuốc đối kháng thụ thể mineralocorticoid (MRA)');
       ```
   - Hệ thống `mergeRecommendations()` trong `merge.ts` sẽ **tự động khử trùng** các dòng thiếu thông số cùng loại (vd: cả CKD và HF cùng cần K⁺ sẽ chỉ hiển thị 1 dòng nhắc duy nhất: `"Cần nhập Kali máu (K⁺) để đánh giá: chỉ định MRA · chỉ định Finerenone"`).

---

## 1.2 Truy xuất Ngưỡng & Liều qua Accessor KB (Chính sách QA-8)

> [!IMPORTANT]
> **CẤM HARDCODE SỐ LÂM SÀNG & CẤM TẠO FILE HẰNG SỐ CỤC BỘ TRONG MODULE.**
> Toàn bộ các giá trị ngưỡng (ngưỡng eGFR, K⁺, SBP, LVEF, HbA1c...), liều lượng thuốc (khởi đầu, đích, chuẩn độ) và dải chỉnh liều thận **bắt buộc phải được truy xuất qua bộ Accessor API trung tâm** (`@/kb-types`):
> 
> ```ts
> import { th, thr, drug, dose, renalBand, fmtDose } from '@/kb-types';
> ```
> Xem cẩm nang chi tiết tại [`docs/KB_ACCESS.md`](./KB_ACCESS.md).

### Quy định thực thi QA-8:
1. **Lấy giá trị số để so sánh:** Dùng `th('threshold_id')` (throw Error nếu ID không tồn tại trong KB).
2. **Lấy Threshold để gắn trích dẫn & đơn vị:** Dùng `thr('threshold_id')`.
3. **Lấy thông tin thuốc & liều lượng:** Dùng `drug('drug_id')`, `dose('drug_id', 'start'|'target')`, `fmtDose()`.
4. **Quy định nghiêm ngặt về `// qa-allow:`**:
   - Chỉ chấp nhận 3 loại: `// qa-allow: ui-step - <lý do>`, `// qa-allow: index - <lý do>`, `// qa-allow: unit-conversion - <lý do>`.
   - **CẤM TUYỆT ĐỐI** dùng `qa-allow` trên các dòng chứa ngưỡng lâm sàng, liều dùng thuốc, ô ma trận hoặc luật. Mọi `qa-allow` sai loại sẽ bị linter báo **LỖI**.

---

## 2. Cấu trúc `ModuleDefinition`

```ts
import type {
  ModuleDefinition,
  Rule,
  ModuleInputSchema,
  MatrixDefinition,
  PathwayDefinition,
  PresetPatient
} from '../../engine/types';
```

### 2.1 Khai báo Đầu vào động (`inputs`)

Nếu module cần các thông số chuyên biệt ngoài các trường dùng chung (Tuổi, Giới, Cân nặng, Chiều cao, HA, Mạch, Cr, K⁺, Glucose, UACR, HbA1c, Acid Uric):

```ts
export const ckdInputs: ModuleInputSchema = {
  groups: [
    {
      id: 'ckd_specific_group',
      titleVi: 'Thông số chuyên sâu Bệnh thận mạn',
      descriptionVi: 'Đánh giá nguyên nhân và biến chứng thận',
      fields: [
        {
          id: 'cystatinC', // Nếu trùng key trong Patient -> tự map vào patient.cystatinC
          labelVi: 'Cystatin C huyết thanh',
          type: 'number',
          unit: 'mg/L',
          step: 0.01,
          placeholder: 'vd: 1.15',
          helpVi: 'Dùng khi nghi ngờ sai lệch Creatinin do khối cơ bất thường'
        },
        {
          id: 'customInputs.ckdEtiology', // Lưu vào patient.customInputs.ckdEtiology
          labelVi: 'Nguyên nhân bệnh thận',
          type: 'select',
          options: [
            { value: 'diabetic', label: 'Bệnh thận đái tháo đường' },
            { value: 'hypertensive', label: 'Xơ hóa thận do tăng huyết áp' },
            { value: 'glomerular', label: 'Bệnh cầu thận nguyên phát' },
            { value: 'other', label: 'Nguyên nhân khác / Chưa rõ' }
          ]
        },
        {
          id: 'conditions.onDialysis', // Lưu vào patient.conditions.onDialysis
          labelVi: 'Đang lọc máu chu kỳ (chạy thận nhân tạo / thẩm phân phúc mạc)',
          type: 'boolean',
          defaultValue: false
        }
      ]
    }
  ]
};
```

#### Các kiểu trường (`type`):
- `'number'`: Nhập số thập phân hoặc nguyên (`step`, `min`, `max`, `unit`, `unitKey`).
- `'range'`: Thanh trượt (vd: LVEF 10–75%).
- `'select'`: Danh sách chọn có `options: { value, label }[]`.
- `'boolean'`: Hộp chọn bật/tắt (checkbox).
- `'text'`: Nhập chuỗi tự do.

#### Thuộc tính `unitKey`:
Nếu trường phụ thuộc vào cài đặt đơn vị người dùng (`settings.units`), sử dụng `unitKey`:
- `'cr'` (µmol/L ↔ mg/dL)
- `'glucose'` (mmol/L ↔ mg/dL)
- `'lipid'` (mmol/L ↔ mg/dL)
- `'urat'` (µmol/L ↔ mg/dL)
- `'uacr'` (mg/mmol ↔ mg/g)
- `'hba1c'` (% ↔ mmol/mol)

---

### 2.2 Định nghĩa Luật lâm sàng (`rules`)

Mỗi luật là một đối tượng `Rule`:
- `id`: `<module>.<chủ_đề>.<tên_luật>` (duy nhất).
- `nameVi`: Tên luật tiếng Việt có ý nghĩa.
- `setting`: `'outpatient'` (ngoại trú), `'inpatient'` (nội viện), hoặc `'both'`.
- `profiles`: `['INTL', 'VN', 'US']` (các profile guideline mà luật áp dụng).
- `when(ctx: RuleContext): boolean`: Điều kiện kích hoạt luật.
- `produce(ctx: RuleContext): Recommendation | null`: Sinh khuyến cáo.
- `citationIds: string[]`: Danh sách ID trích dẫn bắt buộc.

```ts
export const ckdRules: Rule[] = [
  {
    id: 'ckd.sglt2i.initiate',
    module: 'ckd',
    nameVi: 'Khởi trị SGLT2i làm chậm tiến triển CKD',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      // eGFR >= 20 và có albumin niệu (UACR >= 20 mg/g hoặc >= 2.26 mg/mmol) hoặc có ĐTĐ
      const egfr = ctx.derived.egfr ?? 0;
      const uacr = ctx.normalized.uacr ?? 0; // mg/mmol
      const hasAlbuminuria = uacr >= 2.26;
      const hasDm = Boolean(ctx.patient.conditions?.dm);
      return egfr >= 20 && (hasAlbuminuria || hasDm);
    },
    produce: (ctx) => {
      const egfr = ctx.derived.egfr!;
      return {
        id: 'rec_ckd_sglt2i_init',
        module: 'ckd',
        tier: 'Bảo vệ tim - thận nền tảng',
        tierOrder: 1,
        action: 'START',
        drugId: 'dapagliflozin', // Quy ước id trùng khớp với kb/drugs/<drugId>.json
        drugNameVi: 'Dapagliflozin (Ức chế SGLT2)',
        dose: '10 mg x 1 lần/ngày (uống buổi sáng)',
        title: 'Khởi trị Dapagliflozin 10 mg',
        rationale: 'Khuyến cáo nhóm 1A (KDIGO 2024) nhằm giảm tiến triển bệnh thận mạn và tử vong tim mạch.',
        gates: [
          {
            parameter: 'eGFR',
            passed: egfr >= 20,
            value: egfr,
            threshold: 20,
            messageVi: `eGFR ${egfr.toFixed(0)} mL/phút/1.73m² ≥ 20: Đủ điều kiện an toàn khởi trị`
          }
        ],
        citationIds: ['kdigo2024_rec_1_3_sglt2i'],
        priority: 90
      };
    },
    citationIds: ['kdigo2024_rec_1_3_sglt2i']
  }
];
```

#### Các hành động (`Action`):
- `'START'`: Khởi trị mới thuốc (xanh lá).
- `'UPTITRATE'`: Chuẩn độ tăng liều (xanh dương).
- `'CONTINUE'`: Duy trì liều hiện tại (xám xanh).
- `'REDUCE'`: Giảm liều do suy thận hoặc tác dụng phụ (cam nhạt).
- `'SWITCH'`: Chuyển đổi sang thuốc khác cùng nhóm/khác nhóm (tím xanh).
- `'HOLD'`: Tạm hoãn/ngưng tạm thời (vd: ngày ốm, tụt HA, tăng kali) (cam).
- `'STOP'`: Ngừng vĩnh viễn thuốc đang dùng (đỏ).
- `'AVOID'`: Chống chỉ định / Tránh dùng (đỏ đậm).
- `'CONSIDER'`: Cân nhắc chỉ định khi đủ dữ kiện (vàng).
- `'DEFER'`: Trì hoãn đợi đánh giá thêm (cam).
- `'MONITOR'`: Yêu cầu theo dõi sinh hóa/lâm sàng định kỳ (tím).
- `'REFER'`: Chuyển khám chuyên khoa (navy).

---

### 2.3 Ma trận An toàn Thuốc (`matrix` hoặc `matrices`)

Bảng hiển thị tương tác giữa nhóm thuốc và dải lọc thận hoặc phân tầng:

```ts
export const ckdMatrix: MatrixDefinition = {
  title: 'Ma trận an toàn thuốc theo dải chức năng thận (KDIGO 2024)',
  columns: [
    { id: 'g1', label: 'G1', subLabel: '≥ 90' },
    { id: 'g2', label: 'G2', subLabel: '60–89' },
    { id: 'g3a', label: 'G3a', subLabel: '45–59' },
    { id: 'g3b', label: 'G3b', subLabel: '30–44' },
    { id: 'g4', label: 'G4', subLabel: '15–29' },
    { id: 'g5', label: 'G5', subLabel: '< 15' },
    { id: 'dialysis', label: 'Lọc máu', subLabel: 'HD/PD' }
  ],
  rows: [
    {
      drugId: 'dapagliflozin',
      nameVi: 'Dapagliflozin (10 mg)',
      cells: {
        g1: { initiate: 'rec', continue: 'rec', citationIds: ['kdigo2024_rec_1_3_sglt2i'] },
        g2: { initiate: 'rec', continue: 'rec', citationIds: ['kdigo2024_rec_1_3_sglt2i'] },
        g3a: { initiate: 'rec', continue: 'rec', citationIds: ['kdigo2024_rec_1_3_sglt2i'] },
        g3b: { initiate: 'rec', continue: 'rec', citationIds: ['kdigo2024_rec_1_3_sglt2i'] },
        g4: {
          initiate: 'rec',
          continue: 'rec',
          note: 'Khởi trị khi eGFR ≥ 20; tiếp tục cho đến khi lọc máu',
          citationIds: ['kdigo2024_rec_1_3_sglt2i']
        },
        g5: {
          initiate: 'not_rec',
          continue: 'ok',
          note: 'Không khởi trị mới khi eGFR < 20; nếu đã dùng từ trước tiếp tục đến khi bắt đầu lọc máu',
          citationIds: ['kdigo2024_rec_1_3_sglt2i']
        },
        dialysis: {
          initiate: 'contra',
          continue: 'contra',
          citationIds: ['kdigo2024_rec_1_3_sglt2i']
        }
      }
    }
  ]
};
```

Trạng thái ô (`initiate` / `continue`):
`'rec'` (Khuyến cáo) · `'ok'` (Cho phép) · `'caution'` (Thận trọng) · `'not_rec'` (Không khuyến cáo) · `'contra'` (Chống chỉ định) · `'no_data'` (Chưa có dữ liệu).

---

### 2.4 Lộ trình Điều trị (`pathway` hoặc `pathways`)

```ts
export const ckdPathway: PathwayDefinition = {
  title: 'Lộ trình tối ưu hóa phác đồ CKD theo KDIGO 2024',
  steps: [
    {
      id: 'step_1',
      stepNumber: 1,
      title: 'Đánh giá G/A & Nguyên nhân',
      description: 'Định lượng eGFR CKD-EPI 2021 và tỷ lệ UACR nước tiểu. Phân tầng nguy cơ tiến triển.',
      status: 'completed'
    },
    {
      id: 'step_2',
      stepNumber: 2,
      title: 'Khởi trị trụ cột bảo vệ tim - thận',
      description: 'Bắt đầu RASi (nếu THA/albumin niệu) + SGLT2i (eGFR ≥ 20). Phối hợp finerenone nếu có ĐTĐ2.',
      status: 'active'
    },
    {
      id: 'step_3',
      stepNumber: 3,
      title: 'Theo dõi an toàn 2–4 tuần',
      description: 'Kiểm tra Creatinin và K⁺ máu. Chấp nhận eGFR giảm ≤ 30% so với ban đầu.',
      status: 'upcoming'
    },
    {
      id: 'step_4',
      stepNumber: 4,
      title: 'Chuẩn độ & Chuyển chuyên khoa',
      description: 'Tăng đến liều tối đa dung nạp. Chuyển khám thận khi eGFR < 30 hoặc KFRE 5 năm > 5%.',
      status: 'upcoming'
    }
  ]
};
```

---

### 2.5 Ca Bệnh nhân Mẫu (`presets`)

Mỗi module cần cung cấp ≥ 2 ca chuẩn để test nhanh giao diện và kiểm thử:

```ts
export const ckdPresets: PresetPatient[] = [
  {
    id: 'ckd_preset_stage3b_a3',
    nameVi: 'CKD G3bA3: ĐTĐ típ 2 + Albumin niệu nặng',
    description: 'Nam 62 tuổi, ĐTĐ 8 năm, eGFR 38 mL/min, UACR 45 mg/mmol, K+ 4.4 mmol/L, HA 138/84.',
    patient: {
      age: 62,
      sex: 'male',
      weight: 70,
      height: 168,
      sbp: 138,
      dbp: 84,
      hr: 76,
      rhythm: 'sinus',
      scr: 160,
      k: 4.4,
      glucose: 8.6,
      hba1c: 7.6,
      uacr: 45,
      selectedModules: ['ckd', 'dm2'],
      conditions: {
        ckd: true,
        dm: true,
        htn: true
      },
      currentMeds: []
    }
  }
];
```

---

### 2.6 Xuất Module Hoàn chỉnh (`index.ts`)

Tại `src/modules/<moduleId>/index.ts`:

```ts
export const ckdModule: ModuleDefinition = {
  id: 'ckd',
  nameVi: 'Bệnh thận mạn (CKD)',
  shortName: 'CKD',
  icon: '🫘',
  rules: ckdRules,
  inputs: ckdInputs,
  matrix: ckdMatrix,
  pathway: ckdPathway,
  presets: ckdPresets
};

export default ckdModule;
```

Hệ thống `src/modules/registry.ts` sẽ tự động phát hiện `export default ckdModule` hoặc `export const ckdModule` và kích hoạt trên toàn bộ ứng dụng!
