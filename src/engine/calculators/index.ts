/**
 * GDMT-VN Clinical Calculators Registry & Entrypoint
 * Phân quyền: Agent D
 *
 * Xuất bản tất cả các máy tính lâm sàng và bộ đăng ký `calculatorRegistry` phục vụ UI
 */

export * from './types';

// 1. eGFR
export * as egfr from './egfr';
export { calculateEgfrCr, calculateEgfrCrCys, calculateEgfrCys, computeEgfr } from './egfr';

// 2. CrCl
export * as crcl from './crcl';
export { calculateIbw, calculateAbw, calculateRawCrcl, computeCrcl } from './crcl';

// 3. KDIGO
export * as kdigo from './kdigo';
export { classifyKdigoGStage, classifyKdigoAStage, computeKdigo } from './kdigo';

// 4. KFRE
export * as kfre from './kfre';
export { calculateKfreLinearPredictor, computeKfre } from './kfre';

// 5. SCORE2
export * as score2 from './score2';
export {
  calculateScore2LinearPredictor,
  classifyScore2RiskCategory,
  computeScore2,
} from './score2';

// 6. AHA PREVENT
export * as prevent from './prevent';
export { calculatePreventLinearPredictor, computePrevent } from './prevent';

// 7. CHA2DS2-VA
export * as cha2ds2va from './cha2ds2va';
export { computeCha2ds2va } from './cha2ds2va';

// 8. DOAC Dose
export * as doacDose from './doacDose';
export { computeDoacDose } from './doacDose';

// 9. GOLD 2026
export * as gold from './gold';
export { classifyGoldGrade, computeGold } from './gold';

// 10. GINA
export * as gina from './gina';
export { computeGina } from './gina';

// 11. LDL Target
export * as ldlTarget from './ldlTarget';
export { determineEscRiskTier, computeLdlTarget } from './ldlTarget';

// 12. Blood Pressure
export * as bp from './bp';
export { computeBp } from './bp';

// 13. BMI & BSA
export * as bmi from './bmi';
export { computeBmi } from './bmi';

// 14. Insulin
export * as insulin from './insulin';
export { computeInsulin } from './insulin';

// 15. Urate & ACR 2020
export * as urate from './urate';
export { convertUrateToUmolL, computeUrate } from './urate';

import type { CalculatorRegistryItem } from './types';
import { computeEgfr, COEFFICIENTS as EGFR_COEFF } from './egfr';
import { computeCrcl, COEFFICIENTS as CRCL_COEFF } from './crcl';
import { computeKdigo, COEFFICIENTS as KDIGO_COEFF } from './kdigo';
import { computeKfre, COEFFICIENTS as KFRE_COEFF } from './kfre';
import { computeScore2, COEFFICIENTS as SCORE2_COEFF } from './score2';
import { computePrevent, COEFFICIENTS as PREVENT_COEFF } from './prevent';
import { computeCha2ds2va, COEFFICIENTS as CHA_COEFF } from './cha2ds2va';
import { computeDoacDose, COEFFICIENTS as DOAC_COEFF } from './doacDose';
import { computeGold, COEFFICIENTS as GOLD_COEFF } from './gold';
import { computeGina, COEFFICIENTS as GINA_COEFF } from './gina';
import { computeLdlTarget, COEFFICIENTS as LDL_COEFF } from './ldlTarget';
import { computeBp, COEFFICIENTS as BP_COEFF } from './bp';
import { computeBmi, COEFFICIENTS as BMI_COEFF } from './bmi';
import { computeInsulin, COEFFICIENTS as INSULIN_COEFF } from './insulin';
import { computeUrate, COEFFICIENTS as URATE_COEFF } from './urate';

/**
 * Danh mục máy tính lâm sàng chuẩn hóa cho giao diện UI
 */
export const calculatorRegistry: CalculatorRegistryItem[] = [
  {
    id: 'egfr',
    nameVi: 'eGFR CKD-EPI 2021 (Không hệ số chủng tộc)',
    shortDescriptionVi: 'Ước tính độ lọc cầu thận bằng creatinin huyết thanh và cystatin C chuẩn hóa theo KDIGO 2024.',
    module: 'ckd',
    inputs: [
      { id: 'scr', labelVi: 'Creatinin huyết thanh', type: 'number', unit: 'µmol/L', defaultValue: 90, min: 10, max: 2000, required: true },
      { id: 'age', labelVi: 'Tuổi', type: 'number', unit: 'năm', defaultValue: 60, min: 18, max: 120, required: true },
      { id: 'sex', labelVi: 'Giới tính', type: 'select', defaultValue: 'male', options: [{ value: 'male', labelVi: 'Nam' }, { value: 'female', labelVi: 'Nữ' }], required: true },
      { id: 'cystatinC', labelVi: 'Cystatin C (tùy chọn)', type: 'number', unit: 'mg/L', min: 0.1, max: 10 },
    ],
    compute: (inputs) => computeEgfr({
      scr: Number(inputs.scr),
      age: Number(inputs.age),
      sex: inputs.sex,
      cystatinC: inputs.cystatinC ? Number(inputs.cystatinC) : undefined,
    }),
    source: EGFR_COEFF.source,
  },
  {
    id: 'crcl',
    nameVi: 'Độ thanh thải Creatinin Cockcroft-Gault (CrCl)',
    shortDescriptionVi: 'Tính CrCl theo cân nặng thực, lý tưởng (IBW Devine) và hiệu chỉnh (ABW) cho chỉnh liều DOAC và kháng sinh.',
    module: 'ckd',
    inputs: [
      { id: 'scr', labelVi: 'Creatinin huyết thanh', type: 'number', unit: 'µmol/L', defaultValue: 90, min: 10, max: 2000, required: true },
      { id: 'age', labelVi: 'Tuổi', type: 'number', unit: 'năm', defaultValue: 65, min: 18, max: 120, required: true },
      { id: 'weight', labelVi: 'Cân nặng', type: 'number', unit: 'kg', defaultValue: 60, min: 20, max: 300, required: true },
      { id: 'height', labelVi: 'Chiều cao', type: 'number', unit: 'cm', defaultValue: 165, min: 100, max: 250, required: true },
      { id: 'sex', labelVi: 'Giới tính', type: 'select', defaultValue: 'male', options: [{ value: 'male', labelVi: 'Nam' }, { value: 'female', labelVi: 'Nữ' }], required: true },
    ],
    compute: (inputs) => computeCrcl({
      scr: Number(inputs.scr),
      age: Number(inputs.age),
      weight: Number(inputs.weight),
      height: Number(inputs.height),
      sex: inputs.sex,
    }),
    source: CRCL_COEFF.source,
  },
  {
    id: 'kdigo',
    nameVi: 'Phân loại Bệnh thận mạn KDIGO 2024 (Heatmap G1-G5 × A1-A3)',
    shortDescriptionVi: 'Xác định giai đoạn CGA, tầng nguy cơ tiến triển và tần suất theo dõi/năm.',
    module: 'ckd',
    inputs: [
      { id: 'egfr', labelVi: 'eGFR', type: 'number', unit: 'mL/min/1.73m²', defaultValue: 45, min: 1, max: 150, required: true },
      { id: 'uacr', labelVi: 'UACR (Albumin/Creatinin niệu)', type: 'number', unit: 'mg/mmol', defaultValue: 15, min: 0, max: 1000, required: true },
    ],
    compute: (inputs) => computeKdigo({
      egfr: Number(inputs.egfr),
      uacr: Number(inputs.uacr),
      uacrUnit: 'mg/mmol',
    }),
    source: KDIGO_COEFF.source,
  },
  {
    id: 'kfre',
    nameVi: 'Kidney Failure Risk Equation (KFRE) 4 biến',
    shortDescriptionVi: 'Dự báo xác suất suy thận cần lọc máu/ghép thận trong 2 năm và 5 năm chuẩn KDIGO 2024.',
    module: 'ckd',
    inputs: [
      { id: 'age', labelVi: 'Tuổi', type: 'number', unit: 'năm', defaultValue: 62, min: 18, max: 100, required: true },
      { id: 'sex', labelVi: 'Giới tính', type: 'select', defaultValue: 'male', options: [{ value: 'male', labelVi: 'Nam' }, { value: 'female', labelVi: 'Nữ' }], required: true },
      { id: 'egfr', labelVi: 'eGFR', type: 'number', unit: 'mL/min/1.73m²', defaultValue: 35, min: 5, max: 60, required: true },
      { id: 'uacr', labelVi: 'UACR', type: 'number', unit: 'mg/mmol', defaultValue: 35, min: 0.1, max: 1000, required: true },
    ],
    compute: (inputs) => computeKfre({
      age: Number(inputs.age),
      sex: inputs.sex,
      egfr: Number(inputs.egfr),
      uacr: Number(inputs.uacr),
      uacrUnit: 'mg/mmol',
      region: 'non_north_america',
    }),
    source: KFRE_COEFF.source,
  },
  {
    id: 'score2',
    nameVi: 'Dự báo Nguy cơ Tim mạch 10 năm SCORE2 / SCORE2-OP (ESC)',
    shortDescriptionVi: 'Đánh giá nguy cơ biến cố tim mạch tử vong và không tử vong ở người 40-89 tuổi (vùng nguy cơ cao mặc định cho VN).',
    module: 'lipid',
    inputs: [
      { id: 'age', labelVi: 'Tuổi', type: 'number', unit: 'năm', defaultValue: 58, min: 40, max: 89, required: true },
      { id: 'sex', labelVi: 'Giới tính', type: 'select', defaultValue: 'male', options: [{ value: 'male', labelVi: 'Nam' }, { value: 'female', labelVi: 'Nữ' }], required: true },
      { id: 'smoker', labelVi: 'Hút thuốc lá hiện tại', type: 'boolean', defaultValue: true },
      { id: 'sbp', labelVi: 'Huyết áp tâm thu', type: 'number', unit: 'mmHg', defaultValue: 145, min: 90, max: 220, required: true },
      { id: 'tc', labelVi: 'Cholesterol toàn phần', type: 'number', unit: 'mmol/L', defaultValue: 5.8, min: 2, max: 15, required: true },
      { id: 'hdl', labelVi: 'HDL-Cholesterol', type: 'number', unit: 'mmol/L', defaultValue: 1.1, min: 0.5, max: 3.5, required: true },
      { id: 'hasDiabetes', labelVi: 'Mắc Đái tháo đường týp 2', type: 'boolean', defaultValue: false },
    ],
    compute: (inputs) => computeScore2({
      age: Number(inputs.age),
      sex: inputs.sex,
      smoker: Boolean(inputs.smoker),
      sbp: Number(inputs.sbp),
      tc: Number(inputs.tc),
      hdl: Number(inputs.hdl),
      cholUnit: 'mmol/L',
      hasDiabetes: Boolean(inputs.hasDiabetes),
      riskRegion: 'high',
    }),
    source: SCORE2_COEFF.source,
  },
  {
    id: 'prevent',
    nameVi: 'AHA PREVENT 2024 10-Year Cardiovascular Risk',
    shortDescriptionVi: 'Phương trình AHA mới nhất dự báo đồng thời Total CVD, ASCVD và Heart Failure không dùng biến chủng tộc.',
    module: 'lipid',
    inputs: [
      { id: 'age', labelVi: 'Tuổi', type: 'number', unit: 'năm', defaultValue: 55, min: 30, max: 79, required: true },
      { id: 'sex', labelVi: 'Giới tính', type: 'select', defaultValue: 'female', options: [{ value: 'female', labelVi: 'Nữ' }, { value: 'male', labelVi: 'Nam' }], required: true },
      { id: 'sbp', labelVi: 'Huyết áp tâm thu', type: 'number', unit: 'mmHg', defaultValue: 135, min: 90, max: 220, required: true },
      { id: 'tc', labelVi: 'Cholesterol toàn phần', type: 'number', unit: 'mmol/L', defaultValue: 5.2, min: 2, max: 15, required: true },
      { id: 'hdl', labelVi: 'HDL-Cholesterol', type: 'number', unit: 'mmol/L', defaultValue: 1.2, min: 0.5, max: 3.5, required: true },
      { id: 'egfr', labelVi: 'eGFR', type: 'number', unit: 'mL/min/1.73m²', defaultValue: 75, min: 10, max: 150, required: true },
      { id: 'bmi', labelVi: 'BMI', type: 'number', unit: 'kg/m²', defaultValue: 26.5, min: 15, max: 60, required: true },
      { id: 'hasDiabetes', labelVi: 'Đái tháo đường', type: 'boolean', defaultValue: false },
      { id: 'smoker', labelVi: 'Hút thuốc hiện tại', type: 'boolean', defaultValue: false },
      { id: 'onHtnMeds', labelVi: 'Đang dùng thuốc hạ áp', type: 'boolean', defaultValue: true },
      { id: 'onStatin', labelVi: 'Đang dùng statin', type: 'boolean', defaultValue: false },
    ],
    compute: (inputs) => computePrevent({
      age: Number(inputs.age),
      sex: inputs.sex,
      sbp: Number(inputs.sbp),
      tc: Number(inputs.tc),
      hdl: Number(inputs.hdl),
      cholUnit: 'mmol/L',
      egfr: Number(inputs.egfr),
      bmi: Number(inputs.bmi),
      hasDiabetes: Boolean(inputs.hasDiabetes),
      smoker: Boolean(inputs.smoker),
      onHtnMeds: Boolean(inputs.onHtnMeds),
      onStatin: Boolean(inputs.onStatin),
    }),
    source: PREVENT_COEFF.source,
  },
  {
    id: 'cha2ds2va',
    nameVi: 'Thang điểm Nguy cơ Đột quỵ CHA₂DS₂-VA (ESC 2024)',
    shortDescriptionVi: 'Quyết định chỉ định chống đông đường uống (OAC) trong rung nhĩ không van tim theo khuyến cáo mới nhất.',
    module: 'af',
    inputs: [
      { id: 'chf', labelVi: 'Suy tim sung huyết (CHF)', type: 'boolean', defaultValue: false },
      { id: 'hypertension', labelVi: 'Tăng huyết áp', type: 'boolean', defaultValue: true },
      { id: 'age', labelVi: 'Tuổi', type: 'number', unit: 'năm', defaultValue: 72, min: 18, max: 120, required: true },
      { id: 'diabetes', labelVi: 'Đái tháo đường', type: 'boolean', defaultValue: false },
      { id: 'strokeOrTia', labelVi: 'Tiền sử đột quỵ / TIA / thuyên tắc', type: 'boolean', defaultValue: false },
      { id: 'vascularDisease', labelVi: 'Bệnh mạch máu (NMCT cũ, ĐM ngoại biên, mảng xơ vữa ĐMC)', type: 'boolean', defaultValue: false },
      { id: 'sex', labelVi: 'Giới tính (cho điểm VASc cũ)', type: 'select', defaultValue: 'male', options: [{ value: 'male', labelVi: 'Nam' }, { value: 'female', labelVi: 'Nữ' }] },
    ],
    compute: (inputs) => computeCha2ds2va({
      chf: Boolean(inputs.chf),
      hypertension: Boolean(inputs.hypertension),
      age: Number(inputs.age),
      diabetes: Boolean(inputs.diabetes),
      strokeOrTia: Boolean(inputs.strokeOrTia),
      vascularDisease: Boolean(inputs.vascularDisease),
      sex: inputs.sex,
    }),
    source: CHA_COEFF.source,
  },
  {
    id: 'doacDose',
    nameVi: 'Tiêu chuẩn Giảm liều Thuốc Chống Đông DOAC',
    shortDescriptionVi: 'Kiểm tra liều chỉ định và tiêu chí giảm liều chính thức theo nhãn cho Apixaban, Rivaroxaban, Dabigatran, Edoxaban.',
    module: 'af',
    inputs: [
      { id: 'drug', labelVi: 'Thuốc DOAC', type: 'select', defaultValue: 'apixaban', options: [{ value: 'apixaban', labelVi: 'Apixaban (Eliquis)' }, { value: 'rivaroxaban', labelVi: 'Rivaroxaban (Xarelto)' }, { value: 'dabigatran', labelVi: 'Dabigatran (Pradaxa)' }, { value: 'edoxaban', labelVi: 'Edoxaban (Lixiana)' }], required: true },
      { id: 'age', labelVi: 'Tuổi', type: 'number', unit: 'năm', defaultValue: 81, min: 18, max: 120, required: true },
      { id: 'weight', labelVi: 'Cân nặng', type: 'number', unit: 'kg', defaultValue: 58, min: 20, max: 250, required: true },
      { id: 'scr', labelVi: 'Creatinin huyết thanh', type: 'number', unit: 'µmol/L', defaultValue: 140, min: 10, max: 1500, required: true },
      { id: 'crcl', labelVi: 'CrCl Cockcroft-Gault', type: 'number', unit: 'mL/min', defaultValue: 32, min: 5, max: 200, required: true },
      { id: 'verapamil', labelVi: 'Dùng cùng verapamil', type: 'boolean', defaultValue: false },
      { id: 'potentPgpInhibitor', labelVi: 'Dùng cùng ức chế P-gp mạnh', type: 'boolean', defaultValue: false },
    ],
    compute: (inputs) => computeDoacDose({
      drug: inputs.drug,
      age: Number(inputs.age),
      weight: Number(inputs.weight),
      scr: Number(inputs.scr),
      scrUnit: 'umol/L',
      crcl: Number(inputs.crcl),
      verapamil: Boolean(inputs.verapamil),
      potentPgpInhibitor: Boolean(inputs.potentPgpInhibitor),
    }),
    source: DOAC_COEFF.source,
  },
  {
    id: 'gold',
    nameVi: 'Phân loại GOLD 2026 COPD (Mức độ tắc nghẽn 1-4 & Nhóm A/B/E)',
    shortDescriptionVi: 'Phân độ FEV1 và phân nhóm triệu chứng/đợt cấp ABE theo chiến lược GOLD 2026 mới nhất.',
    module: 'copd',
    inputs: [
      { id: 'fev1PredPct', labelVi: 'FEV1 % dự đoán sau giãn phế quản', type: 'number', unit: '%', defaultValue: 55, min: 10, max: 150, required: true },
      { id: 'fev1FvcRatio', labelVi: 'Tỷ lệ FEV1/FVC sau giãn phế quản', type: 'number', defaultValue: 0.62, min: 0.1, max: 1.0 },
      { id: 'exacerbationsPastYear', labelVi: 'Số đợt cấp vừa trong 12 tháng qua', type: 'number', defaultValue: 1, min: 0, max: 20, required: true },
      { id: 'hospitalizationsPastYear', labelVi: 'Số đợt cấp phải nhập viện trong 12 tháng', type: 'number', defaultValue: 0, min: 0, max: 10, required: true },
      { id: 'mmrc', labelVi: 'Điểm khó thở mMRC', type: 'number', defaultValue: 2, min: 0, max: 4 },
      { id: 'cat', labelVi: 'Điểm triệu chứng CAT (tùy chọn)', type: 'number', defaultValue: 14, min: 0, max: 40 },
    ],
    compute: (inputs) => computeGold({
      fev1PredPct: Number(inputs.fev1PredPct),
      fev1FvcRatio: inputs.fev1FvcRatio !== undefined && inputs.fev1FvcRatio !== '' ? Number(inputs.fev1FvcRatio) : undefined,
      exacerbationsPastYear: inputs.exacerbationsPastYear !== undefined && inputs.exacerbationsPastYear !== '' ? Number(inputs.exacerbationsPastYear) : undefined,
      hospitalizationsPastYear: inputs.hospitalizationsPastYear !== undefined && inputs.hospitalizationsPastYear !== '' ? Number(inputs.hospitalizationsPastYear) : undefined,
      mmrc: inputs.mmrc !== undefined && inputs.mmrc !== '' ? Number(inputs.mmrc) : undefined,
      cat: inputs.cat !== undefined && inputs.cat !== '' ? Number(inputs.cat) : undefined,
    }),
    source: GOLD_COEFF.source,
  },
  {
    id: 'gina',
    nameVi: 'Mức độ Kiểm soát Triệu chứng Hen theo GINA',
    shortDescriptionVi: 'Đánh giá 4 câu hỏi triệu chứng hen trong 4 tuần qua: Kiểm soát tốt, một phần hay không kiểm soát.',
    module: 'asthma',
    inputs: [
      { id: 'daytimeSymptomsMoreThanTwiceWeek', labelVi: 'Triệu chứng ban ngày > 2 lần/tuần', type: 'boolean', defaultValue: true },
      { id: 'nightWakingDueToAsthma', labelVi: 'Thức giấc ban đêm do hen', type: 'boolean', defaultValue: false },
      { id: 'relieverNeededMoreThanTwiceWeek', labelVi: 'Cần dùng thuốc cắt cơn > 2 lần/tuần', type: 'boolean', defaultValue: true },
      { id: 'activityLimitationDueToAsthma', labelVi: 'Giới hạn hoạt động thể lực do hen', type: 'boolean', defaultValue: false },
    ],
    compute: (inputs) => {
      const toOptBool = (v: unknown): boolean | undefined =>
        typeof v === 'boolean' ? v : v === 'true' ? true : v === 'false' ? false : undefined;
      return computeGina({
        daytimeSymptomsMoreThanTwiceWeek: toOptBool(inputs.daytimeSymptomsMoreThanTwiceWeek),
        nightWakingDueToAsthma: toOptBool(inputs.nightWakingDueToAsthma),
        relieverNeededMoreThanTwiceWeek: toOptBool(inputs.relieverNeededMoreThanTwiceWeek),
        activityLimitationDueToAsthma: toOptBool(inputs.activityLimitationDueToAsthma),
      });
    },
    source: GINA_COEFF.source,
  },
  {
    id: 'ldlTarget',
    nameVi: 'Phân tầng Nguy cơ Tim mạch & Đích LDL-C (ESC 2025)',
    shortDescriptionVi: 'Xác định đích LDL-C, phần trăm cần giảm và ước lượng hiệu lực hạ mỡ máu theo phác đồ statin/ezetimibe/PCSK9i.',
    module: 'lipid',
    inputs: [
      { id: 'currentLdl', labelVi: 'LDL-C hiện tại', type: 'number', unit: 'mmol/L', defaultValue: 3.2, min: 0.5, max: 15, required: true },
      { id: 'baselineLdl', labelVi: 'LDL-C nền ban đầu (chưa dùng thuốc)', type: 'number', unit: 'mmol/L', defaultValue: 4.5, min: 0.5, max: 15 },
      { id: 'hasAscvd', labelVi: 'Đã có bệnh tim mạch xơ vữa lâm sàng (ASCVD)', type: 'boolean', defaultValue: true },
      { id: 'hasFamilialHypercholesterolemia', labelVi: 'Tăng cholesterol máu gia đình (FH)', type: 'boolean', defaultValue: false },
      { id: 'hasDiabetes', labelVi: 'Mắc Đái tháo đường', type: 'boolean', defaultValue: false },
      { id: 'egfr', labelVi: 'eGFR', type: 'number', unit: 'mL/min/1.73m²', defaultValue: 65, min: 5, max: 150 },
      { id: 'currentTherapy', labelVi: 'Phác đồ hạ lipid hiện tại', type: 'select', defaultValue: 'moderate_intensity_statin', options: [{ value: 'none', labelVi: 'Chưa dùng thuốc' }, { value: 'moderate_intensity_statin', labelVi: 'Statin cường độ trung bình' }, { value: 'high_intensity_statin', labelVi: 'Statin cường độ cao' }, { value: 'high_statin_plus_ezetimibe', labelVi: 'Statin cao + Ezetimibe' }, { value: 'high_statin_plus_ezetimibe_plus_pcsk9i', labelVi: 'Statin cao + Ezetimibe + PCSK9i' }] },
    ],
    compute: (inputs) => computeLdlTarget({
      currentLdl: Number(inputs.currentLdl),
      baselineLdl: inputs.baselineLdl ? Number(inputs.baselineLdl) : undefined,
      hasAscvd: Boolean(inputs.hasAscvd),
      hasFamilialHypercholesterolemia: Boolean(inputs.hasFamilialHypercholesterolemia),
      hasDiabetes: Boolean(inputs.hasDiabetes),
      egfr: inputs.egfr ? Number(inputs.egfr) : undefined,
      currentTherapy: inputs.currentTherapy,
      ldlUnit: 'mmol/L',
    }),
    source: LDL_COEFF.source,
  },
  {
    id: 'bp',
    nameVi: 'Phân loại Huyết áp (ESC 2024 & ACC/AHA)',
    shortDescriptionVi: 'Phân loại Non-elevated, Elevated và Hypertension theo ESC 2024 kết hợp phân độ giai đoạn ACC/AHA.',
    module: 'htn',
    inputs: [
      { id: 'sbp', labelVi: 'Huyết áp tâm thu (SBP)', type: 'number', unit: 'mmHg', defaultValue: 148, min: 70, max: 260, required: true },
      { id: 'dbp', labelVi: 'Huyết áp tâm trương (DBP)', type: 'number', unit: 'mmHg', defaultValue: 88, min: 40, max: 160, required: true },
    ],
    compute: (inputs) => computeBp({
      sbp: Number(inputs.sbp),
      dbp: Number(inputs.dbp),
    }),
    source: BP_COEFF.source,
  },
  {
    id: 'bmi',
    nameVi: 'BMI, Diện tích Da & Thể trạng Châu Á - Thái Bình Dương',
    shortDescriptionVi: 'Đánh giá BMI theo tiêu chuẩn WHO WPRO cho người Việt Nam (bình thường 18.5-22.9, béo phì ≥ 25 kg/m²).',
    module: '_demo',
    inputs: [
      { id: 'weight', labelVi: 'Cân nặng', type: 'number', unit: 'kg', defaultValue: 68, min: 20, max: 300, required: true },
      { id: 'height', labelVi: 'Chiều cao', type: 'number', unit: 'cm', defaultValue: 165, min: 80, max: 250, required: true },
    ],
    compute: (inputs) => computeBmi({
      weight: Number(inputs.weight),
      height: Number(inputs.height),
    }),
    source: BMI_COEFF.source,
  },
  {
    id: 'insulin',
    nameVi: 'Khung Khởi đầu Insulin Ngoại trú & Nội viện (ADA 2026)',
    shortDescriptionVi: 'Gợi ý liều insulin nền khởi đầu theo kg và phác đồ basal-bolus theo cân nặng theo ADA 2026.',
    module: 'dm2',
    inputs: [
      { id: 'weight', labelVi: 'Cân nặng', type: 'number', unit: 'kg', defaultValue: 65, min: 30, max: 250, required: true },
      { id: 'setting', labelVi: 'Bối cảnh điều trị', type: 'select', defaultValue: 'outpatient', options: [{ value: 'outpatient', labelVi: 'Ngoại trú (Khởi đầu insulin nền)' }, { value: 'inpatient', labelVi: 'Nội viện (Phác đồ Basal-Bolus)' }], required: true },
      { id: 'clinicalContext', labelVi: 'Phân nhóm lâm sàng nội viện', type: 'select', defaultValue: 'standard', options: [{ value: 'standard', labelVi: 'Bệnh nhân thông thường (0.4-0.5 U/kg)' }, { value: 'sensitive', labelVi: 'Nhạy cảm (cao tuổi, suy thận, ăn kém: 0.2-0.3 U/kg)' }, { value: 'resistant', labelVi: 'Đề kháng (béo phì, dùng steroid liều cao: 0.6-0.8 U/kg)' }] },
    ],
    compute: (inputs) => computeInsulin({
      weight: Number(inputs.weight),
      setting: inputs.setting,
      clinicalContext: inputs.clinicalContext,
    }),
    source: INSULIN_COEFF.source,
  },
  {
    id: 'urate',
    nameVi: 'Chỉ định Hạ Urat Máu & Đích Axit Uric (ACR 2020)',
    shortDescriptionVi: 'Đánh giá chỉ định điều trị hạ urat (Mạnh / Có điều kiện) và mục tiêu điều trị đích theo ACR 2020.',
    module: 'gout',
    inputs: [
      { id: 'serumUrate', labelVi: 'Axit uric huyết thanh', type: 'number', unit: 'µmol/L', defaultValue: 520, min: 100, max: 1200, required: true },
      { id: 'hasTophi', labelVi: 'Có hạt tophi dưới da', type: 'boolean', defaultValue: false },
      { id: 'radiographicDamage', labelVi: 'Tổn thương hủy khớp trên X-quang', type: 'boolean', defaultValue: false },
      { id: 'flaresPastYear', labelVi: 'Số đợt cấp gút trong 1 năm qua', type: 'number', defaultValue: 2, min: 0, max: 20, required: true },
      { id: 'priorFlaresLifetime', labelVi: 'Tổng số đợt cấp gút trong đời', type: 'number', defaultValue: 3, min: 0, max: 50, required: true },
      { id: 'ckdStage', labelVi: 'Giai đoạn bệnh thận mạn (nếu có)', type: 'number', defaultValue: 3, min: 1, max: 5 },
      { id: 'urolithiasis', labelVi: 'Tiền sử sỏi thận tiết niệu', type: 'boolean', defaultValue: false },
    ],
    compute: (inputs) => computeUrate({
      serumUrate: Number(inputs.serumUrate),
      urateUnit: 'umol/L',
      hasTophi: Boolean(inputs.hasTophi),
      radiographicDamage: Boolean(inputs.radiographicDamage),
      flaresPastYear: Number(inputs.flaresPastYear),
      priorFlaresLifetime: Number(inputs.priorFlaresLifetime),
      ckdStage: inputs.ckdStage ? Number(inputs.ckdStage) : undefined,
      urolithiasis: Boolean(inputs.urolithiasis),
    }),
    source: URATE_COEFF.source,
  },
];
