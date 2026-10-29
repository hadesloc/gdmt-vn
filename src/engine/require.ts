/**
 * GDMT-VN Clinical Requirements & Fail-Closed Helper
 * Phân quyền: Agent B
 *
 * Cấm sử dụng mặc định số lâm sàng (vd: `ctx.derived.egfr ?? 100`, `ctx.patient.k ?? 0`).
 * Cung cấp helper `need(ctx, field)` và `missingInputRec(module, field, reasonVi)`.
 * Cung cấp helper `hasCondition(ctx, key)` chuẩn hóa từ điển bệnh đồng mắc (ConditionKey).
 * Nếu thiếu thông số lâm sàng bắt buộc -> Không sinh START/UPTITRATE; sinh dòng CONSIDER hướng dẫn nhập.
 */

import type { RuleContext, Recommendation, ModuleId, StandardConditionKey, ConditionKey } from './types';
import { hasCondition, resetWarnedConditionsForTest } from './types';

export { hasCondition, resetWarnedConditionsForTest };
export type { StandardConditionKey, ConditionKey };

export const FIELD_LABELS: Record<string, string> = {
  sex: 'giới tính',
  age: 'tuổi',
  weight: 'cân nặng',
  height: 'chiều cao',
  rhythm: 'nhịp tim trên điện tâm đồ',
  k: 'Kali máu (K⁺)',
  na: 'Natri máu (Na⁺)',
  hb: 'Hemoglobin (Hb)',
  egfr: 'Độ lọc cầu thận (eGFR)',
  egfrCr: 'eGFR theo Creatinin',
  egfrCys: 'eGFR theo Cystatin C',
  lvef: 'Phân suất tống máu (LVEF)',
  sbp: 'Huyết áp tâm thu (SBP)',
  dbp: 'Huyết áp tâm trương (DBP)',
  hr: 'Nhịp tim (HR)',
  scr: 'Creatinin huyết thanh',
  baselineScr: 'Creatinin huyết thanh nền',
  cystatinC: 'Cystatin C huyết thanh',
  uacr: 'Tỷ số Albumin/Creatinin niệu (UACR)',
  glucose: 'Đường huyết',
  hba1c: 'HbA1c',
  tc: 'Cholesterol toàn phần (TC)',
  hdl: 'HDL-C',
  ldl: 'LDL-C',
  tg: 'Triglyceride (TG)',
  nonHdl: 'Non-HDL-C',
  apob: 'Apolipoprotein B (ApoB)',
  lpa: 'Lipoprotein(a) [Lp(a)]',
  baselineLdl: 'LDL-C nền trước điều trị',
  alt: 'Men gan ALT',
  ck: 'Men cơ CK',
  altUlnTimes: 'Mức tăng men gan ALT (lần ULN)',
  ckUlnTimes: 'Mức tăng men cơ CK (lần ULN)',
  childPugh: 'Phân độ xơ gan Child-Pugh',
  akiStage: 'Giai đoạn tổn thương thận cấp (AKI)',
  uricAcid: 'Acid uric máu',
  urate: 'Acid uric máu',
  urat: 'Acid uric máu',
  tophi: 'Tình trạng hạt tophi',
  hasTophi: 'Tình trạng hạt tophi',
  bmi: 'Chỉ số khối cơ thể (BMI)',
  bsa: 'Diện tích da cơ thể (BSA)',
  map: 'Huyết áp trung bình (MAP)',
  crcl: 'Độ thanh thải Creatinin (CrCl)',
  nyha: 'Phân độ suy tim NYHA',
  respiratoryRate: 'Nhịp thở (lần/phút)',
  spo2: 'Độ bão hòa oxy máu (SpO₂)',
  restingSpo2: 'Độ bão hòa oxy máu lúc nghỉ (SpO₂)',
  pao2: 'Áp lực riêng phần oxy động mạch (PaO₂)',
  paco2: 'Áp lực riêng phần CO₂ (PaCO₂)',
  abgPaco2: 'PaCO₂ khí máu động mạch',
  ph: 'pH máu',
  abgPh: 'pH khí máu động mạch',
  venousPh: 'pH máu tĩnh mạch',
  hco3: 'Bicarbonat máu (HCO₃⁻)',
  serumBicarb: 'Bicarbonat huyết thanh (HCO₃⁻)',
  fev1: 'FEV₁ (L)',
  fev1Pct: 'FEV₁ % dự đoán',
  fev1PredPct: 'FEV₁ % dự đoán sau giãn phế quản',
  fvc: 'FVC (L)',
  fev1FvcRatio: 'Tỷ số FEV₁/FVC sau giãn phế quản',
  mmrc: 'Thang điểm khó thở mMRC',
  mmrcScore: 'Thang điểm khó thở mMRC',
  cat: 'Điểm đánh giá triệu chứng COPD (CAT)',
  catScore: 'Điểm đánh giá triệu chứng COPD (CAT)',
  bcat: 'Điểm đánh giá triệu chứng COPD (CAT)',
  moderateExacerbations: 'Số đợt cấp vừa trong 12 tháng qua',
  hospitalizations: 'Số đợt cấp nhập viện trong 12 tháng qua',
  copdExacerbations: 'Số đợt cấp COPD trong năm qua',
  asthmaExacerbations: 'Số đợt cấp hen trong năm qua',
  exacerbationsLastYear: 'Số đợt cấp trong 12 tháng qua',
  priorSevereExacerbation: 'Tiền sử đợt cấp nặng trong 12 tháng qua',
  severeExacerbationLastYear: 'Số đợt cấp nặng trong 12 tháng qua',
  icuAdmissionHistory: 'Tiền sử nhập Hồi sức tích cực (ICU) / đặt nội khí quản',
  daytimeSymptomsMoreThanTwiceWeek: 'Triệu chứng hen ban ngày (> 2 lần/tuần)',
  nightWakingDueToAsthma: 'Thức giấc ban đêm do hen',
  relieverNeededMoreThanTwiceWeek: 'Nhu cầu dùng thuốc cắt cơn (> 2 lần/tuần)',
  activityLimitationDueToAsthma: 'Giới hạn hoạt động thể lực do hen',
  inhalerTechniqueChecked: 'Đánh giá kỹ thuật hít ống thuốc',
  inhalerTechniqueCorrect: 'Đánh giá kỹ thuật hít ống thuốc',
  adherenceGood: 'Mức độ tuân thủ điều trị',
  goodAdherence: 'Mức độ tuân thủ điều trị',
  pifLMin: 'Lưu lượng hít vào đỉnh (PIFR)',
  peakInspiratoryFlow: 'Lưu lượng hít vào đỉnh (PIFR)',
  weakInspiratoryFlow: 'Lưu lượng hít vào đỉnh yếu (PIFR thấp)',
  speechAbility: 'Khả năng nói trong cơn cấp',
  mentalStatus: 'Tình trạng tri giác / ý thức',
  alteredMentalStatus: 'Rối loạn ý thức / lơ mơ',
  silentChest: 'Dấu hiệu lồng ngực im lặng',
  respiratoryArrest: 'Ngừng thở / Đe dọa ngừng thở',
  accessoryMuscleUse: 'Co kéo cơ hô hấp phụ',
  currentTrack: 'Phác đồ điều trị hen hiện tại (Track 1/2)',
  currentStep: 'Bậc điều trị hen hiện tại (GINA Step)',
  wellControlledMonths: 'Số tháng kiểm soát hen tốt liên tiếp',
  totalDailyPuffsUsed: 'Tổng số nhát hít sử dụng trong 24 giờ',
  eos: 'Bạch cầu ái toan máu (Eosinophils)',
  bloodEos: 'Bạch cầu ái toan máu (Blood Eosinophils)',
  bloodEosinophils: 'Bạch cầu ái toan máu (Eosinophils)',
  pef: 'Lưu lượng đỉnh thở ra (PEF)',
  pefPct: 'Lưu lượng đỉnh PEF (% dự đoán/tốt nhất)',
  pefBestLMin: 'PEF cá nhân tốt nhất (L/phút)',
  feno: 'FeNO đường thở (ppb)',
  ntProBnp: 'NT-proBNP huyết tương',
  ferritin: 'Ferritin huyết thanh',
  tsat: 'Độ bão hòa Transferrin (TSAT)',
  qrsDuration: 'Độ rộng phức bộ QRS (ms)',
  qrsMorphology: 'Hình thái phức bộ QRS',
  urinarySodium2h: 'Natri niệu sau 2 giờ lợi tiểu (mmol/L)',
  urineOutputRate: 'Lưu lượng nước tiểu',
  urineOutputRate6h: 'Lưu lượng nước tiểu 6 giờ đầu (mL/giờ)',
  vkaTtr: 'Thời gian INR trong khoảng điều trị (TTR %)',
  ehraScore: 'Phân độ triệu chứng rung nhĩ EHRA',
  afOnset: 'Thời gian khởi phát rung nhĩ',
  afType: 'Thể lâm sàng rung nhĩ',
  hemodynamicStability: 'Tình trạng huyết động',
  congestion: 'Tình trạng sung huyết lâm sàng',
  smokingStatus: 'Tình trạng hút thuốc lá',
  packYears: 'Số gói-năm hút thuốc',
  priorFlaresLifetime: 'Tổng số cơn gút cấp trước đây',
  flareCountPerYear: 'Số cơn gút cấp trong 12 tháng qua',
  goutFlaresYear: 'Số cơn gút cấp trong 12 tháng qua',
  hlab5801: 'Xét nghiệm gen HLA-B*5801',
  hlaB5801: 'Xét nghiệm gen HLA-B*5801',
  homeSbp: 'Huyết áp tâm thu đo tại nhà (HBPM)',
  homeDbp: 'Huyết áp tâm trương đo tại nhà (HBPM)',
  abpm24hSbp: 'Huyết áp tâm thu 24 giờ (ABPM)',
  abpm24hDbp: 'Huyết áp tâm trương 24 giờ (ABPM)',
  bloodKetones: 'Ceton máu (β-hydroxybutyrate)',
  effectiveOsmolality: 'Áp lực thẩm thấu máu hiệu dụng',
  dlcnScore: 'Điểm Dutch Lipid Clinic Network (DLCN)',
  ascvdRisk10Yr: 'Nguy cơ tim mạch xơ vữa 10 năm (%)',
  score2RiskPercent: 'Điểm nguy cơ SCORE2 (%)',
  pregnant: 'tình trạng mang thai',
  pregnancy: 'tình trạng mang thai',
  breastfeeding: 'tình trạng đang cho con bú',
  lactation: 'tình trạng đang cho con bú',
  qtc: 'khoảng QTc trên điện tâm đồ (ms)',
  allergies: 'tiền sử dị ứng thuốc',
  wpw: 'hội chứng tiền kích thích (WPW)',
  avBlock2Or3: 'block nhĩ thất độ II–III',
  sickSinusSyndrome: 'hội chứng suy nút xoang',
  pacemaker: 'tình trạng máy tạo nhịp tim',
  cardiogenicShock: 'tình trạng sốc tim',
  hemodynamicProfile: 'phân nhóm huyết động (ấm/lạnh – khô/ẩm)',
  onInotropesOrVasopressors: 'tình trạng dùng thuốc vận mạch / tăng co bóp',
  onDialysis: 'tình trạng lọc máu chu kỳ',
  dialysis: 'tình trạng lọc máu chu kỳ',
  mtcMen2History: 'tiền sử ung thư tuyến giáp thể tủy (MTC) / MEN 2',
  historyMtcOrMen2: 'tiền sử ung thư tuyến giáp thể tủy (MTC) / MEN 2',
  historyPancreatitis: 'tiền sử viêm tụy',
  acutePancreatitis: 'tình trạng viêm tụy cấp',
  cirrhosis: 'tình trạng xơ gan',
  liverDisease: 'tình trạng bệnh gan mạn / suy gan',
  decompensatedCirrhosis: 'tình trạng xơ gan mất bù',
  priorAngioedema: 'tiền sử phù mạch',
  plannedSurgery: 'lịch phẫu thuật chu phẫu',
  hf: 'tiền sử suy tim',
  dm: 'tiền sử đái tháo đường',
  htn: 'tiền sử tăng huyết áp',
  ckd: 'tiền sử bệnh thận mạn',
  ascvd: 'tiền sử bệnh tim mạch do xơ vữa (ASCVD)',
  af: 'tiền sử rung nhĩ',
  asthma: 'tiền sử hen phế quản',
  copd: 'tiền sử bệnh phổi tắc nghẽn mạn tính (COPD)',
  gout: 'tiền sử bệnh gút'
};

export type ClinicalField =
  | 'k'
  | 'egfr'
  | 'lvef'
  | 'sbp'
  | 'dbp'
  | 'hr'
  | 'scr'
  | 'uacr'
  | 'glucose'
  | 'hba1c'
  | 'uricAcid'
  | 'bmi'
  | 'crcl'
  | 'nyha'
  | 'age'
  | 'weight'
  | 'height'
  | string;

const KNOWN_VALID_FIELDS = new Set<string>([
  // Trường chuẩn trên Patient & Derived
  'k', 'na', 'hco3', 'hb', 'egfr', 'egfrCr', 'egfrCys', 'lvef', 'sbp', 'dbp', 'hr', 'qtc', 'rhythm',
  'scr', 'cystatinC', 'uacr', 'glucose', 'hba1c', 'tc', 'hdl', 'ldl', 'nonHdl', 'tg',
  'uricAcid', 'urate', 'urat', 'bmi', 'bsa', 'map', 'crcl', 'nyha', 'age', 'weight', 'height',
  'fev1', 'fev1Pct', 'fvc', 'mmrc', 'cat', 'copdExacerbations', 'asthmaExacerbations',
  'goutFlaresYear', 'tophi', 'eos', 'cha2ds2va', 'goldGrade', 'goldGroup', 'ldlTarget',
  // Trường hô hấp / cấp cứu / khí máu
  'respiratoryRate', 'spo2', 'restingSpo2', 'pao2', 'paco2', 'abgPaco2', 'ph', 'abgPh', 'venousPh',
  'pef', 'pefPct', 'pefBestLMin', 'feno', 'fev1FvcRatio', 'fev1PredPct',
  'bloodEos', 'bloodEosinophils', 'moderateExacerbations', 'hospitalizations', 'exacerbationsLastYear',
  'acuteExacerbation', 'isAcuteExacerbation', 'acuteResponseAfter1h', 'accessoryMuscleUse',
  'activityLimitationDueToAsthma', 'allergicPhenotype', 'alteredMentalStatus', 'chronicBronchitis',
  'corPulmonaleOrPolycythemia', 'currentInhaler', 'currentStep', 'currentTrack',
  'daytimeSymptomsMoreThanTwiceWeek', 'fmtDurationMonths', 'goodAdherence', 'adherenceGood',
  'increasedSputumVolume', 'inhalerTechniqueCorrect', 'inhalerTechniqueChecked', 'mentalStatus', 'nightWakingDueToAsthma',
  'onSteroidTherapy', 'packYears', 'priorPneumonia', 'purulentSputum',
  'relieverNeededMoreThanTwiceWeek', 'sabaOnly', 'silentChest', 'respiratoryArrest', 'smokingStatus',
  'speechAbility', 'totalDailyPuffsUsed', 'weakInspiratoryFlow', 'pifLMin', 'peakInspiratoryFlow', 'wellControlledMonths',
  'mmrcScore', 'catScore', 'bcat', 'priorSevereExacerbation', 'severeExacerbationLastYear', 'icuAdmissionHistory',
  // Trường CKD / DM2 / nội tiết
  'ckdEtiology', 'takingNsaid', 'takingStatin', 'takingAcei', 'takingLowDoseAspirin',
  'takingThiazideOrLoop', 'akiSuspected', 'baselineScr', 'contrastPlanned', 'ecgHyperkalemia',
  'hematuria', 'serumBicarb', 'dmDurationYears', 'dmTargetOrganDamage', 'currentBasalDoseUnits',
  'bedtimeToMorningDiff', 'bloodKetones', 'catabolicSymptoms', 'dkaSuspected',
  'effectiveOsmolality', 'elderlyHealthStatus', 'inpatientEating', 'inpatientUnit', 'icu',
  'plannedSurgery', 'recentHypo',
  // Trường Tim mạch: HTN / HF / AF / Lipid
  'ascvdRisk10Yr', 'score2RiskPercent', 'altUlnTimes', 'ckUlnTimes', 'lpa', 'apob', 'nonHdl',
  'baselineLdl', 'dlcnScore', 'targetLdlMmol', 'familialHypercholesterolemia',
  'recurrentAcsWithin2Years', 'hasCvd', 'homeSbp', 'homeDbp', 'abpm24hSbp', 'abpm24hDbp',
  'afOnset', 'afType', 'ehraScore', 'hemodynamicStability', 'onAnticoagulant',
  'plannedProcedureRisk', 'vkaTtr', 'congestion', 'ferritin', 'tsat', 'ntProBnp',
  'qrsDuration', 'qrsMorphology', 'recentWorseningHf', 'severeSecondaryMr',
  'urinarySodium2h', 'urineOutputRate', 'urineOutputRate6h',
  // Trường Gút & Cơ xương khớp
  'acuteFlare', 'priorFlaresLifetime', 'flareCountPerYear', 'hasTophi',
  'hlab5801', 'hlaB5801', 'cyp3a4PgpInhibitor', 'monoarthritisLargeJoint',
  'pepticUlcer', 'preferFebuxostat', 'preferProbenecid', 'takingAzathioprine',
  'urolithiasis', 'xrayDamage'
]);

const warnedFieldKeys = new Set<string>();

export function resetWarnedFieldsForTest(): void {
  warnedFieldKeys.clear();
}

export function registerValidFields(fields: Iterable<string>): void {
  for (const f of fields) {
    const clean = f.replace(/^customInputs\./, '').replace(/^patient\./, '');
    KNOWN_VALID_FIELDS.add(clean);
    KNOWN_VALID_FIELDS.add(f);
  }
}

function firstDefined(...candidates: unknown[]): unknown {
  for (const c of candidates) {
    if (c !== undefined && c !== null && c !== '') {
      return c;
    }
  }
  return undefined;
}

/**
 * Trích xuất an toàn thông số lâm sàng số học từ context.
 * Chuẩn hóa tên trường: tự động xử lý cả khóa có hoặc không có tiền tố `customInputs.` / `patient.`.
 * Trả về number hợp lệ hoặc undefined nếu người dùng chưa nhập / chưa tính được.
 * Tuyệt đối không tự gán giá trị mặc định lạc quan.
 */
export function need(ctx: RuleContext, field: ClinicalField): number | undefined {
  const isExplicitCustom = field.startsWith('customInputs.');
  const cleanKey = field.replace(/^customInputs\./, '').replace(/^patient\./, '');

  if (
    process.env.NODE_ENV !== 'production' &&
    !KNOWN_VALID_FIELDS.has(cleanKey) &&
    !KNOWN_VALID_FIELDS.has(field) &&
    !warnedFieldKeys.has(field)
  ) {
    warnedFieldKeys.add(field);
    console.warn(`[require.ts] Cảnh báo: Trường '${field}' không nằm trong từ điển KNOWN_VALID_FIELDS chuẩn.`);
  }

  const normRec = ctx.normalized as unknown as Record<string, unknown>;
  const patRec = ctx.patient as unknown as Record<string, unknown>;
  const derRec = ctx.derived as Record<string, unknown>;

  let val: unknown;

  if (isExplicitCustom) {
    val = firstDefined(
      ctx.normalized?.customInputs?.[cleanKey],
      ctx.normalized?.customInputs?.[field],
      ctx.patient?.customInputs?.[cleanKey],
      ctx.patient?.customInputs?.[field],
      normRec?.[cleanKey],
      derRec?.[cleanKey],
      patRec?.[cleanKey]
    );
  } else if (cleanKey === 'egfr') {
    val = firstDefined(
      ctx.derived?.egfr,
      ctx.derived?.egfrCr,
      normRec?.egfr,
      ctx.normalized?.customInputs?.egfr,
      ctx.patient?.customInputs?.egfr
    );
  } else if (cleanKey === 'bmi') {
    val = firstDefined(
      ctx.derived?.bmi,
      normRec?.bmi,
      ctx.normalized?.customInputs?.bmi,
      ctx.patient?.customInputs?.bmi
    );
  } else if (cleanKey === 'crcl') {
    val = firstDefined(
      ctx.derived?.crcl,
      normRec?.crcl,
      ctx.normalized?.customInputs?.crcl,
      ctx.patient?.customInputs?.crcl
    );
  } else if (cleanKey === 'map') {
    val = firstDefined(
      ctx.derived?.map,
      normRec?.map,
      ctx.normalized?.customInputs?.map,
      ctx.patient?.customInputs?.map
    );
  } else if (cleanKey === 'uricAcid' || cleanKey === 'urate' || cleanKey === 'urat') {
    val = firstDefined(
      normRec?.uricAcid,
      normRec?.urate,
      normRec?.urat,
      ctx.normalized?.customInputs?.uricAcid,
      ctx.normalized?.customInputs?.urate,
      ctx.normalized?.customInputs?.urat,
      patRec?.uricAcid,
      ctx.patient?.customInputs?.uricAcid,
      ctx.patient?.customInputs?.urate,
      ctx.patient?.customInputs?.urat
    );
  } else {
    val = firstDefined(
      normRec?.[cleanKey],
      derRec?.[cleanKey],
      ctx.normalized?.customInputs?.[cleanKey],
      ctx.normalized?.customInputs?.[field],
      ctx.patient?.customInputs?.[cleanKey],
      ctx.patient?.customInputs?.[field],
      patRec?.[cleanKey],
      normRec?.[field]
    );
  }

  if (typeof val === 'number' && !Number.isNaN(val)) {
    return val;
  }
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    if (!Number.isNaN(parsed)) return parsed;
  }

  return undefined;
}

/**
 * Tương thích ngược với code cũ
 */
export function needCondition(ctx: RuleContext, condName: string): boolean | undefined {
  return hasCondition(ctx, condName) ? true : undefined;
}

/**
 * Sinh khuyến cáo CONSIDER khi thiếu dữ liệu lâm sàng bắt buộc.
 * Dòng này sẽ được `merge.ts` tự động khử trùng theo trường thiếu (vd: nhiều luật cùng cần K+ sẽ chỉ sinh 1 dòng duy nhất).
 */
export function missingInputRec(
  module: ModuleId,
  field: ClinicalField,
  reasonVi: string,
  citationIds: string[] = []
): Recommendation {
  const cleanKey = field
    .replace(/^customInputs\./, '')
    .replace(/^patient\./, '')
    .replace(/^conditions\./, '');
  const lowerMatch = Object.entries(FIELD_LABELS).find(
    ([k]) => k.toLowerCase() === cleanKey.toLowerCase()
  )?.[1];
  const fieldName = FIELD_LABELS[cleanKey] || FIELD_LABELS[field] || lowerMatch || cleanKey;

  return {
    id: `missing_input_${cleanKey}`,
    module,
    tier: 'Dữ liệu cần bổ sung',
    tierOrder: 99,
    action: 'CONSIDER',
    title: `Cần nhập ${fieldName} để đánh giá`,
    rationale: `Chưa có thông số ${fieldName}. Cần nhập liệu để đánh giá: ${reasonVi}.`,
    gates: [],
    citationIds,
    priority: 25
  };
}
