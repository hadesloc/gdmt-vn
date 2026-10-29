/**
 * GDMT-VN Clinical Calculators Types
 * Phân quyền: Agent D
 * 
 * Các định nghĩa kiểu độc lập, thuần túy dành riêng cho hệ thống máy tính lâm sàng GDMT-VN.
 */

export interface SourceCitationInfo {
  organization: string;
  guideline: string;
  year: number;
  locator: string; // Vd: "Table 14, p. 74", "Figure 6, p. 25"
  doiOrUrl?: string;
  notesVi?: string;
  needsSourceVerification: boolean;
}

export interface CoefficientMetadata {
  name: string;
  source: SourceCitationInfo;
  descriptionVi: string;
}

// ==========================================
// 1. eGFR (CKD-EPI 2021 race-free & cr-cys)
// ==========================================
export type CreatinineUnit = 'umol/L' | 'mg/dL';
export type Sex = 'male' | 'female';

export interface EgfrInput {
  scr: number;
  scrUnit?: CreatinineUnit;
  age: number;
  sex: Sex;
  cystatinC?: number; // mg/L
}

export interface EgfrResult {
  egfrCr: number | null;
  egfrCrCys: number | null;
  egfrCys: number | null;
  recommendedEgfr: number | null;
  formula: 'CKD-EPI 2021 Creatinine' | 'CKD-EPI 2021 Creatinine-Cystatin C' | 'CKD-EPI 2012 Cystatin C';
  isRaceFree: boolean;
  unit: 'mL/min/1.73m²';
  warning?: string;
}

// ==========================================
// 2. CrCl (Cockcroft-Gault & Devine IBW/ABW)
// ==========================================
export interface CrclInput {
  scr: number;
  scrUnit?: CreatinineUnit;
  age: number;
  weight: number; // kg
  height?: number; // cm (tùy chọn; chỉ bắt buộc khi tính IBW/ABW/BMI)
  sex: Sex;
}

export interface CrclResult {
  crclActual: number | null;
  crclIdeal: number | null;
  crclAdjusted: number | null;
  recommendedCrCl: number | null;
  weightUsedForRecommended: 'actual' | 'ideal' | 'adjusted';
  ibw: number | null;
  abw: number | null;
  bmi: number | null;
  isObese: boolean; // BMI >= 30 hoặc cân nặng thực > 120% IBW
  warning?: string;
}

// ==========================================
// 3. KDIGO 2024 Heatmap & Staging
// ==========================================
export type UacrUnit = 'mg/mmol' | 'mg/g';
export type KdigoGStage = 'G1' | 'G2' | 'G3a' | 'G3b' | 'G4' | 'G5';
export type KdigoAStage = 'A1' | 'A2' | 'A3';
export type KdigoHeatmapColor = 'green' | 'yellow' | 'orange' | 'red';

export interface KdigoInput {
  egfr: number;
  uacr: number;
  uacrUnit?: UacrUnit; // Mặc định mg/mmol (chuẩn VN)
}

export interface KdigoResult {
  gStage: KdigoGStage;
  gDescriptionVi: string;
  aStage: KdigoAStage;
  aDescriptionVi: string;
  compositeStage: string; // Vd: "G3aA2"
  heatmapColor: KdigoHeatmapColor;
  riskTierVi: 'Nguy cơ thấp' | 'Nguy cơ tăng vừa' | 'Nguy cơ cao' | 'Nguy cơ rất cao';
  monitoringFrequencyPerYear: number | string; // 1, 2, 3 hoặc "≥ 4"
  monitoringAdviceVi: string;
}

// ==========================================
// 4. KFRE (Kidney Failure Risk Equation)
// ==========================================
export type KfreRegion = 'non_north_america' | 'north_america';

export interface KfreInput {
  age: number;
  sex: Sex;
  egfr: number;
  uacr: number;
  uacrUnit?: UacrUnit;
  region?: KfreRegion; // Mặc định: 'non_north_america' cho Việt Nam
}

export interface KfreResult {
  risk2Year: number | null; // % nguy cơ suy thận trong 2 năm
  risk5Year: number | null; // % nguy cơ suy thận trong 5 năm
  regionUsed: KfreRegion;
  referralRecommended: boolean; // Khuyến cáo chuyển chuyên khoa thận nếu nguy cơ 5 năm > 3-5% theo KDIGO
  interpretationVi: string;
  warning?: string;
}

// ==========================================
// 5. SCORE2 / SCORE2-OP / SCORE2-Diabetes
// ==========================================
export type Score2RiskRegion = 'low' | 'moderate' | 'high' | 'very_high';
export type CholesterolUnit = 'mmol/L' | 'mg/dL';

export interface Score2Input {
  age: number; // 40-89
  sex: Sex;
  smoker: boolean;
  sbp: number; // mmHg
  tc: number; // Total cholesterol
  hdl: number; // HDL cholesterol
  cholUnit?: CholesterolUnit; // Mặc định: mmol/L
  riskRegion?: Score2RiskRegion; // Mặc định: 'high' cho VN
  hasDiabetes?: boolean;
  ageAtDmDiagnosis?: number;
  hba1c?: number; // % hoặc mmol/mol
  egfr?: number; // mL/min/1.73m²
}

export interface Score2Result {
  riskPercent: number | null;
  modelUsed: 'SCORE2' | 'SCORE2-OP' | 'SCORE2-Diabetes';
  riskRegion: Score2RiskRegion;
  riskCategory: 'low' | 'moderate' | 'high' | 'very_high';
  riskCategoryVi: string;
  thresholdsForAgeGroup: {
    moderateThreshold: number;
    highThreshold: number;
    veryHighThreshold: number;
  };
  interpretationVi: string;
  needsSourceVerification: boolean;
  warning?: string;
}

// ==========================================
// 6. AHA PREVENT 2024
// ==========================================
export interface PreventInput {
  age: number; // 30-79
  sex: Sex;
  sbp: number; // mmHg
  tc: number; // mmol/L hoặc mg/dL
  hdl: number; // mmol/L hoặc mg/dL
  cholUnit?: CholesterolUnit;
  egfr: number; // mL/min/1.73m²
  hasDiabetes: boolean;
  smoker: boolean;
  bmi: number;
  onHtnMeds: boolean;
  onStatin: boolean;
}

export type PreventAscvdRiskCategory = 'low' | 'borderline' | 'intermediate' | 'high';

export interface PreventResult {
  totalCvdRisk10Yr: number | null; // % (Total CVD: ASCVD + HF)
  ascvdRisk10Yr: number | null; // %
  hfRisk10Yr: number | null; // %
  ascvdRiskCategory?: PreventAscvdRiskCategory | null;
  ascvdRiskCategoryVi?: string;
  model: 'AHA_PREVENT_BASE_2024';
  interpretationVi: string;
  needsSourceVerification: boolean;
  warning?: string;
}

// ==========================================
// 7. CHA₂DS₂-VA (ESC 2024) & CHA₂DS₂-VASc
// ==========================================
export interface Cha2ds2vaInput {
  chf: boolean;
  hypertension: boolean;
  age: number;
  diabetes: boolean;
  strokeOrTia: boolean;
  vascularDisease: boolean;
  sex?: Sex; // Dùng cho bảng tính cổ điển CHA2DS2-VASc
}

export interface Cha2ds2vaResult {
  scoreVa: number; // ESC 2024 (0-9)
  scoreVasc?: number; // Cổ điển (0-9)
  recommendationEsc2024: {
    class: 'I' | 'IIa' | 'III';
    actionVi: string;
    descriptionVi: string;
  };
  recommendationAccAha?: {
    class: 'I' | 'IIa' | 'III';
    actionVi: string;
  };
}

// ==========================================
// 8. DOAC Dose Criteria
// ==========================================
export type DoacDrug = 'apixaban' | 'rivaroxaban' | 'dabigatran' | 'edoxaban';
export type CalculatorProfile = 'INTL' | 'VN' | 'US';

export interface DoacDoseInput {
  drug: DoacDrug;
  age: number;
  weight: number; // kg
  scr: number; // µmol/L hoặc mg/dL
  scrUnit?: CreatinineUnit;
  crcl: number; // mL/min
  onDialysis?: boolean; // Đang lọc máu chu kỳ (kiểm tra trước CrCl!)
  profile?: CalculatorProfile; // Mặc định: 'INTL' (ESC/EMA) vs 'US' (ACC/AHA/FDA)
  potentPgpInhibitor?: boolean; // cyclosporine, dronedarone, erythromycin, ketoconazole
  verapamil?: boolean;
  highBleedingRisk?: boolean;
}

export interface DoacDoseResult {
  drug: DoacDrug;
  standardDose: string;
  recommendedDose: string;
  isDoseReduced: boolean;
  reductionCriteriaMet: string[];
  contraindicated: boolean;
  warning?: string;
  profileDiff?: string;
  source: string;
  needsSourceVerification: boolean;
}

export type DoacInput = DoacDoseInput;
export type DoacResult = DoacDoseResult;

// ==========================================
// 9. GOLD 2026 (COPD)
// ==========================================
export interface GoldInput {
  fev1PredPct: number; // % predicted sau test giãn PQ
  fev1FvcRatio?: number; // Thường < 0.70 sau test
  exacerbationsPastYear?: number; // Số đợt cấp mức độ trung bình trong 12 tháng qua
  hospitalizationsPastYear?: number; // Số đợt cấp nặng / nhập viện trong 12 tháng qua
  moderateExacerbations?: number; // Alias cho exacerbationsPastYear
  severeExacerbations?: number; // Alias cho hospitalizationsPastYear
  mmrc?: number; // 0-4
  cat?: number; // 0-40
  catScore?: number; // Alias cho cat (0-40)
  guidelineVersion?: 'GOLD_2026' | 'GOLD_2023'; // Mặc định 'GOLD_2026' (≥ 1 đợt vừa/nặng -> Nhóm E)
}

export interface GoldResult {
  isAirflowObstructionConfirmed: boolean;
  grade: 'GOLD 1' | 'GOLD 2' | 'GOLD 3' | 'GOLD 4' | null;
  gradeSeverityVi: string;
  group: 'A' | 'B' | 'E' | null;
  groupDescriptionVi: string;
  initialTherapyVi: string;
  warning?: string;
}

// ==========================================
// 10. GINA Asthma Control
// ==========================================
export interface GinaInput {
  daytimeSymptomsMoreThanTwiceWeek?: boolean;
  nightWakingDueToAsthma?: boolean;
  relieverNeededMoreThanTwiceWeek?: boolean;
  activityLimitationDueToAsthma?: boolean;
}

export type GinaControlLevel = 'well_controlled' | 'partly_controlled' | 'uncontrolled';

export interface GinaResult {
  positiveCriteriaCount: number;
  answeredCriteriaCount: number;
  missingCriteria: string[];
  controlLevel: GinaControlLevel | null;
  controlLevelVi: 'Kiểm soát tốt' | 'Kiểm soát một phần' | 'Không kiểm soát' | 'Chưa đủ dữ liệu đánh giá';
  managementAdviceVi: string;
  warning?: string;
}

// ==========================================
// 11. ESC LDL Targets & Regimen Estimation
// ==========================================
export type EscRiskTier = 'low' | 'moderate' | 'high' | 'very_high' | 'extreme';
export type LipidTherapyType =
  | 'none'
  | 'moderate_intensity_statin'
  | 'high_intensity_statin'
  | 'high_statin_plus_ezetimibe'
  | 'high_statin_plus_ezetimibe_plus_pcsk9i';

export interface LdlTargetInput {
  currentLdl: number; // mmol/L
  baselineLdl?: number; // mmol/L (chưa điều trị)
  untreatedLdl?: number; // mmol/L (bí danh cho LDL-C nền chưa điều trị)
  ldlUnit?: CholesterolUnit;
  riskTier?: EscRiskTier;
  // Hoặc các tiêu chí tự động xác định tầng nguy cơ:
  hasAscvd?: boolean;
  hasFamilialHypercholesterolemia?: boolean;
  hasMajorRiskFactor?: boolean;
  majorRiskFactorsCount?: number;
  smoker?: boolean;
  hasHypertension?: boolean;
  hasDiabetes?: boolean;
  dmTargetOrganDamage?: boolean;
  dmDurationYears?: number;
  egfr?: number;
  uacr?: number; // mg/mmol (mặc định) hoặc mg/g
  uacrUnit?: UacrUnit;
  tc?: number; // mmol/L
  score2RiskPercent?: number;
  recurrentAcsWithin2Years?: boolean;
  currentTherapy?: LipidTherapyType;
}

export interface LdlTargetResult {
  riskTier: EscRiskTier;
  riskTierVi: string;
  targetLdlMmol: number;
  targetLdlMgDl: number;
  requiresFiftyPercentReduction: boolean;
  percentReductionNeededFromBaseline?: number | null;
  achievedReductionPercent?: number | null;
  currentTherapyProjectedReductionPercent?: number;
  achievableLdlMmol?: number;
  isTargetAchieved?: boolean;
  stepUpAdviceVi: string[];
}

// ==========================================
// 12. Blood Pressure (ESC 2024 & ACC/AHA 2025)
// ==========================================
export type BpMeasurementSetting = 'office' | 'home' | 'abpm_24h' | 'abpm_day' | 'abpm_night';

export interface BpInput {
  sbp: number; // mmHg
  dbp: number; // mmHg
  setting?: BpMeasurementSetting;
}

export interface BpResult {
  esc2024: {
    category: 'non_elevated' | 'elevated' | 'hypertension';
    subClassification?: 'Grade 1' | 'Grade 2' | 'Hypertensive Urgency/Emergency' | 'Isolated Systolic Hypertension';
    categoryVi: string;
    clinicalActionVi: string;
  };
  accAha2025: {
    stage: 'normal' | 'elevated' | 'stage_1' | 'stage_2' | 'crisis';
    stageVi: string;
  };
  isolatedSystolicHypertension: boolean;
  pulsePressure: number;
  meanArterialPressure: number;
}

// ==========================================
// 13. BMI, BSA & Asia-Pacific Categories
// ==========================================
export interface BmiInput {
  weight: number; // kg
  height: number; // cm
}

export interface BmiResult {
  bmi: number;
  bsa: number; // m² (Mosteller)
  whoCategoryVi: string;
  asiaPacificCategoryVi: string;
  asiaPacificClassification: 'underweight' | 'normal' | 'overweight' | 'obese_1' | 'obese_2';
  idealWeightRangeDevine: [number, number]; // [Nữ, Nam] tương ứng
}

// ==========================================
// 14. Insulin Dosing (ADA 2026 Ch. 9 & 16)
// ==========================================
export interface InsulinInput {
  weight: number; // kg
  setting: 'outpatient' | 'inpatient';
  clinicalContext?: 'standard' | 'sensitive' | 'resistant'; // Nhạy cảm: tuổi cao, suy thận; Đề kháng: béo phì, corticoid
  currentFpg?: number; // mmol/L
}

export interface InsulinResult {
  setting: 'outpatient' | 'inpatient';
  outpatientStart?: {
    fixedDoseUnits: number; // 10 đơn vị
    weightBasedDoseRangeUnits: [number, number]; // 0.1 - 0.2 U/kg
    titrationAdviceVi: string;
  };
  inpatientBasalBolus?: {
    totalDailyDoseUnits: number;
    dosePerKg: number;
    basalUnits: number;
    bolusEachMealUnits: number; // 3 bữa
    scaleAdviceVi: string;
  };
  warningVi: string;
  needsSourceVerification: boolean;
}

// ==========================================
// 15. Serum Urate & ACR 2020 ULT Indications
// ==========================================
export type UrateUnit = 'umol/L' | 'mg/dL';

export interface UrateInput {
  serumUrate: number;
  urateUnit?: UrateUnit; // Mặc định: µmol/L
  hasTophi: boolean;
  radiographicDamage: boolean;
  flaresPastYear: number;
  priorFlaresLifetime: number;
  ckdStage?: number; // Giai đoạn CKD (1-5)
  urolithiasis?: boolean; // Sỏi thận
}

export interface UrateResult {
  ultIndication: 'strong' | 'conditional' | 'not_indicated';
  ultIndicationVi: 'Chỉ định mạnh' | 'Chỉ định có điều kiện' | 'Chưa có chỉ định';
  reasonsVi: string[];
  targetUrateUmolL: number;
  targetUrateMgDl: number;
  targetDescriptionVi: string;
}

// ==========================================
// Calculator Registry (để UI tra cứu và render)
// ==========================================
export interface CalculatorInputDefinition {
  id: string;
  labelVi: string;
  type: 'number' | 'boolean' | 'select';
  unit?: string;
  options?: { value: string; labelVi: string }[];
  defaultValue?: number | boolean | string;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
}

export interface CalculatorRegistryItem {
  id: string;
  nameVi: string;
  shortDescriptionVi: string;
  module: string;
  inputs: CalculatorInputDefinition[];
  compute: (inputs: Record<string, any>) => any;
  source: SourceCitationInfo;
}
