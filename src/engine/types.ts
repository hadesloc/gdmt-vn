/**
 * GDMT-VN Engine Core Types
 * Phân quyền: Agent B
 */

import type { Citation, Source, DrugEntry, RenalBand, GateRule, ReviewStatus } from '../kb-types';
import type {
  StandardConditionKey,
  ConditionSynonymKey,
  ConditionKey,
  ConditionMetadata
} from './conditions';
import {
  STANDARD_CONDITIONS,
  CONDITION_SYNONYM_GROUPS,
  resetWarnedConditionsForTest,
  hasCondition
} from './conditions';

export type {
  Citation,
  Source,
  DrugEntry,
  RenalBand,
  GateRule,
  ReviewStatus,
  StandardConditionKey,
  ConditionSynonymKey,
  ConditionKey,
  ConditionMetadata
};

export {
  STANDARD_CONDITIONS,
  CONDITION_SYNONYM_GROUPS,
  resetWarnedConditionsForTest,
  hasCondition
};

export type ModuleId =
  | 'ckd'
  | 'dm2'
  | 'htn'
  | 'copd'
  | 'asthma'
  | 'gout'
  | 'hf'
  | 'lipid'
  | 'af'
  | '_demo';

export type Setting = 'outpatient' | 'inpatient';
export type Profile = 'INTL' | 'VN' | 'US';

export type Action =
  | 'START'
  | 'UPTITRATE'
  | 'CONTINUE'
  | 'REDUCE'
  | 'SWITCH'
  | 'HOLD'
  | 'STOP'
  | 'AVOID'
  | 'CONSIDER'
  | 'DEFER'
  | 'MONITOR'
  | 'REFER';

export interface CurrentMed {
  drugId: string;
  name?: string;
  dose?: string | number;
  unit?: string;
  freq?: string;
  route?: string;
}

export type PatientConditions = {
  [K in StandardConditionKey]?: boolean;
} & {
  [key: string]: boolean | undefined;
};

export interface Patient {
  id?: string;
  name?: string;
  age?: number;
  sex?: 'male' | 'female';
  weight?: number; // kg
  height?: number; // cm
  sbp?: number; // mmHg
  dbp?: number; // mmHg
  hr?: number; // bpm
  qtc?: number; // ms
  spo2?: number; // %
  pefPct?: number; // % predicted/personal best
  rhythm?: 'sinus' | 'afib' | 'paced' | 'other';
  scr?: number; // µmol/L (or mg/dL according to units setting)
  cystatinC?: number; // mg/L
  egfr?: number; // mL/min/1.73m² (fallback trực tiếp khi thiếu SCr & Cystatin C)
  k?: number; // mmol/L
  na?: number; // mmol/L
  hco3?: number; // mmol/L
  hb?: number; // g/dL
  hba1c?: number; // % (or mmol/mol)
  glucose?: number; // mmol/L (or mg/dL)
  uacr?: number; // mg/mmol (or mg/g)
  tc?: number; // Total cholesterol mmol/L (or mg/dL)
  hdl?: number; // HDL-C mmol/L
  ldl?: number; // LDL-C mmol/L
  nonHdl?: number; // Non-HDL-C mmol/L (or mg/dL)
  tg?: number; // Triglycerides mmol/L
  uricAcid?: number; // µmol/L (or mg/dL)
  eos?: number; // Eosinophils /µL
  fev1?: number; // L
  fev1Pct?: number; // % predicted
  fvc?: number; // L
  mmrc?: number; // 0-4
  cat?: number; // 0-40
  copdExacerbations?: number;
  asthmaExacerbations?: number;
  goutFlaresYear?: number;
  tophi?: boolean;
  lvef?: number; // %
  nyha?: 1 | 2 | 3 | 4;
  allergies?: string[];
  currentMeds: CurrentMed[];
  selectedModules: ModuleId[];
  conditions: PatientConditions;
  customInputs?: Record<string, string | number | boolean | undefined>;
}

export interface UnitSettings {
  cr: 'umol_L' | 'mg_dL';
  glucose: 'mmol_L' | 'mg_dL';
  lipid: 'mmol_L' | 'mg_dL';
  urat: 'umol_L' | 'mg_dL';
  uacr: 'mg_mmol' | 'mg_g';
  hba1c: 'pct' | 'mmol_mol';
}

export interface Settings {
  setting: Setting;
  profile: Profile;
  units: UnitSettings;
  score2Region: 'low' | 'moderate' | 'high' | 'very_high';
  fontScale: 'normal' | 'large' | 'xlarge';
  theme: 'light' | 'dark' | 'high_contrast';
  onlyReviewed: boolean;
}

export interface Derived {
  egfr?: number;
  egfrCr?: number;
  egfrCys?: number;
  crcl?: number;
  crclAbw?: number;
  crclWarning?: string;
  bmi?: number;
  bsa?: number;
  map?: number;
  kdigoG?: 'G1' | 'G2' | 'G3a' | 'G3b' | 'G4' | 'G5';
  ckdGStage?: 'G1' | 'G2' | 'G3a' | 'G3b' | 'G4' | 'G5';
  kdigoA?: 'A1' | 'A2' | 'A3';
  kdigoColor?: 'green' | 'yellow' | 'orange' | 'red';
  ldlTarget?: number;
  cha2ds2va?: number;
  goldGrade?: 'GOLD 1' | 'GOLD 2' | 'GOLD 3' | 'GOLD 4';
  goldGroup?: 'A' | 'B' | 'E';
  [key: string]: unknown;
}

export interface GateResult {
  parameter: string;
  passed: boolean;
  action?: string;
  messageVi: string;
  value?: number | string;
  threshold?: number | string;
}

export interface Recommendation {
  id: string;
  module: ModuleId;
  tier: string;
  tierOrder?: number;
  action: Action;
  drugId?: string;
  drugNameVi?: string;
  switchFrom?: string;
  dose?: string;
  title: string;
  rationale: string;
  gates: GateResult[];
  citationIds: string[];
  benefitsAlso?: ModuleId[];
  warnings?: string[];
  priority: number;
  profileDiff?: { INTL?: string; VN?: string; US?: string };
  reviewStatus?: ReviewStatus;
}

export interface RuleContext {
  patient: Patient;
  normalized: Patient;
  derived: Derived;
  settings: Settings;
}

export type EvaluationContext = RuleContext;

export interface Rule {
  id: string;
  module: ModuleId;
  nameVi: string;
  setting: Setting | 'both';
  profiles: Profile[];
  when(ctx: RuleContext): boolean;
  produce(ctx: RuleContext): Recommendation | null;
  citationIds: string[];
}

export type SafetyAlertProvenance = 'current_current' | 'current_proposed' | 'proposed_proposed';

export interface SafetyAlert {
  id: string;
  type: 'interaction' | 'duplicate' | 'contraindication' | 'warning';
  title: string;
  messageVi: string;
  severity: 'critical' | 'warning' | 'info';
  drugIds: string[];
  citationIds?: string[];
  provenance?: SafetyAlertProvenance;
  provenanceLabelVi?: string;
  baselineDrugs?: string[];
  proposedDrugs?: string[];
}

export interface PlanSummary {
  total: number;
  byAction: Record<Action, number>;
  activeModules: ModuleId[];
}

export interface Plan {
  recommendations: Recommendation[];
  alerts: SafetyAlert[];
  summary: PlanSummary;
  noteText: string;
}

export interface MatrixColumn {
  id: string;
  label: string;
  subLabel?: string;
}

export interface MatrixCellData {
  initiate: 'rec' | 'ok' | 'caution' | 'not_rec' | 'contra' | 'no_data';
  continue: 'rec' | 'ok' | 'caution' | 'not_rec' | 'contra' | 'no_data';
  citationIds: string[];
  note?: string;
  dose?: string;
}

export interface MatrixRowData {
  drugId: string;
  nameVi: string;
  cells: Record<string, MatrixCellData>;
}

export interface MatrixDefinition {
  title: string;
  columns: MatrixColumn[];
  rows: MatrixRowData[];
}

export interface PathwayStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  status: 'completed' | 'active' | 'upcoming';
  citationIds?: string[];
}

export interface PathwayDefinition {
  title: string;
  steps: PathwayStep[];
}

export interface PresetPatient {
  id: string;
  nameVi: string;
  description: string;
  setting?: Setting;
  patient: Partial<Patient>;
}

export interface ModuleInputOption {
  value: string | number;
  label: string;
  subLabel?: string;
}

export type ModuleInputType = 'number' | 'select' | 'boolean' | 'range' | 'text';

export interface ModuleInputField {
  id: string; // Tên trường: trực tiếp ('lvef', 'nyha', 'cat') hoặc 'conditions.xxx' hoặc 'customInputs.xxx'
  labelVi: string;
  type: ModuleInputType;
  unit?: string;
  unitKey?: keyof UnitSettings; // Tự động lấy đơn vị theo cài đặt của người dùng
  placeholder?: string;
  helpVi?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: ModuleInputOption[];
  defaultValue?: string | number | boolean;
  required?: boolean;
  visibleIf?: (patient: Patient) => boolean;
}

export interface ModuleInputGroup {
  id: string;
  titleVi: string;
  descriptionVi?: string;
  fields: ModuleInputField[];
}

export interface ModuleInputSchema {
  groups: ModuleInputGroup[];
}

export interface ModuleDefinition {
  id: ModuleId;
  nameVi: string;
  shortName: string;
  icon?: string;
  rules: Rule[];
  inputs?: ModuleInputSchema;
  matrix?: MatrixDefinition;
  matrices?: MatrixDefinition[];
  pathway?: PathwayDefinition;
  pathways?: PathwayDefinition[];
  presets?: PresetPatient[];
}
