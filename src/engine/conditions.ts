/**
 * GDMT-VN Clinical Condition Metadata & Directional Synonym Resolution
 * Phân quyền: Agent B
 */

import type { RuleContext } from './types';

export type StandardConditionKey =
  | 'ascvd'
  | 'strokeOrTia'
  | 'hf'
  | 'dm'
  | 'ckd'
  | 'htn'
  | 'gout'
  | 'asthma'
  | 'copd'
  | 'af'
  | 'liverDisease'
  | 'bleedingHistory'
  | 'priorAngioedema'
  | 'pregnant'
  | 'breastfeeding'
  | 'smoker'
  | 'onDialysis'
  | 'recentAcs'
  | 'statinIntolerance'
  | 'unprovokedHypokalemia'
  | 'suspectedSecondaryHtn'
  | 'dmTargetOrganDamage'
  | 'familialHypercholesterolemia'
  | 'recurrentAcsWithin2Years'
  | 'mechanicalValve'
  | 'mitralStenosis'
  | 'obesity'
  | 'frailty'
  | 'limitedLifespan'
  | 'orthostaticHypotension'
  | 'pepticUlcer'
  | 'depression'
  | 'allergicRhinitis'
  | 'gerd'
  | 'priorAsthma'
  | 'aerd'
  | 'snoringOsa'
  | 'cardiacAmyloidosis'
  | 'hypertrophicCardiomyopathy'
  | 'renalBruit'
  | 'allergyAceiArb'
  | 'onAnticoagulant'
  | 'acuteAcsWithin24h'
  | 'acuteIntracerebralHemorrhage'
  | 'acuteIschemicStroke'
  | 'acutePulmonaryEdema'
  | 'aorticDissection'
  | 'hypertensiveEncephalopathy'
  | 'malignantHypertension'
  | 'perioperativeHypertension'
  | 'severePreeclampsiaEclampsia'
  | 'thrombolysisEligible'
  | 'plannedSurgery';

export type ConditionSynonymKey =
  | 'pregnancy'
  | 'lactation'
  | 'nursing'
  | 'vascularDisease'
  | 'cad'
  | 'ccs'
  | 'acs'
  | 'mi'
  | 'stemi'
  | 'nstemi'
  | 'pci'
  | 'cabg'
  | 'pad'
  | 'carotidPlaque'
  | 'aorticPlaque'
  | 'stroke'
  | 'tia'
  | 'stroke_tia'
  | 'afib'
  | 'liver_disease'
  | 'cirrhosis'
  | 'decompensatedCirrhosis'
  | 'activeLiverDisease'
  | 'diabetes'
  | 'heartFailure'
  | 'hypertension'
  | 'angioedemaHistory'
  | 'aceiAngioedema'
  | 'historyOfAngioedema'
  | 'hereditaryAngioedema'
  | 'wpw'
  | 'preExcitedAf'
  | 'avBlock2Or3'
  | 'secondOrThirdDegreeAvBlock'
  | 'sickSinusSyndrome'
  | 'pacemaker'
  | 'cardiogenicShock'
  | 'activeBleeding'
  | 'dkaSuspected';

export type ConditionKey = StandardConditionKey | ConditionSynonymKey;

export interface ConditionMetadata {
  key: StandardConditionKey;
  labelVi: string;
  descriptionVi: string;
}

export const STANDARD_CONDITIONS: Record<StandardConditionKey, ConditionMetadata> = {
  ascvd: {
    key: 'ascvd',
    labelVi: 'Bệnh tim mạch do xơ vữa',
    descriptionVi: 'Bao gồm bệnh mạch vành (CAD), nhồi máu cơ tim (MI), can thiệp mạch vành (PCI/CABG), bệnh động mạch ngoại biên (PAD)'
  },
  strokeOrTia: {
    key: 'strokeOrTia',
    labelVi: 'Đột quỵ não / TIA',
    descriptionVi: 'Tiền sử đột quỵ nhồi máu não, xuất huyết não hoặc cơn thiếu máu não thoáng qua'
  },
  hf: {
    key: 'hf',
    labelVi: 'Suy tim',
    descriptionVi: 'Suy tim có triệu chứng hoặc giảm phân suất tống máu (HFrEF, HFmrEF, HFpEF)'
  },
  dm: {
    key: 'dm',
    labelVi: 'Đái tháo đường',
    descriptionVi: 'Đái tháo đường típ 1 hoặc típ 2'
  },
  ckd: {
    key: 'ckd',
    labelVi: 'Bệnh thận mạn',
    descriptionVi: 'Bệnh thận mạn tính eGFR < 60 mL/min/1.73m² hoặc UACR ≥ 3 mg/mmol kéo dài > 3 tháng'
  },
  htn: {
    key: 'htn',
    labelVi: 'Tăng huyết áp',
    descriptionVi: 'Tiền sử tăng huyết áp đang điều trị hoặc huyết áp phòng khám ≥ 140/90 mmHg'
  },
  gout: {
    key: 'gout',
    labelVi: 'Bệnh Gút',
    descriptionVi: 'Tiền sử cơn viêm khớp gút cấp hoặc có hạt tophi'
  },
  asthma: {
    key: 'asthma',
    labelVi: 'Hen phế quản',
    descriptionVi: 'Chẩn đoán hen phế quản có tiền sử tắc nghẽn đường thở dao động'
  },
  copd: {
    key: 'copd',
    labelVi: 'Bệnh phổi tắc nghẽn mạn tính (COPD)',
    descriptionVi: 'Chẩn đoán COPD có tắc nghẽn đường thở cố định sau giãn phế quản (FEV1/FVC < 0.70)'
  },
  af: {
    key: 'af',
    labelVi: 'Rung nhĩ / Cuồng nhĩ',
    descriptionVi: 'Rung nhĩ cơn, dai dẳng hoặc mạn tính được xác nhận trên điện tâm đồ'
  },
  liverDisease: {
    key: 'liverDisease',
    labelVi: 'Bệnh gan mạn tính',
    descriptionVi: 'Xơ gan Child-Pugh A/B/C, viêm gan mạn tiến triển hoặc men gan tăng cao > 3 lần ULN'
  },
  bleedingHistory: {
    key: 'bleedingHistory',
    labelVi: 'Tiền sử chảy máu nặng',
    descriptionVi: 'Tiền sử xuất huyết tiêu hóa, xuất huyết nội sọ hoặc cơ địa chảy máu cao'
  },
  priorAngioedema: {
    key: 'priorAngioedema',
    labelVi: 'Tiền sử phù mạch',
    descriptionVi: 'Tiền sử phù mạch liên quan ức chế men chuyển hoặc phù mạch vô căn / di truyền'
  },
  pregnant: {
    key: 'pregnant',
    labelVi: 'Đang mang thai',
    descriptionVi: 'Phụ nữ xác nhận đang mang thai'
  },
  breastfeeding: {
    key: 'breastfeeding',
    labelVi: 'Đang cho con bú',
    descriptionVi: 'Phụ nữ đang trong thời kỳ nuôi con bằng sữa mẹ'
  },
  smoker: {
    key: 'smoker',
    labelVi: 'Hút thuốc lá',
    descriptionVi: 'Đang hút thuốc lá hoặc có tiền sử hút thuốc lá đáng kể (≥ 10 gói-năm)'
  },
  onDialysis: {
    key: 'onDialysis',
    labelVi: 'Lọc máu chu kỳ',
    descriptionVi: 'Bệnh thận giai đoạn cuối đang chạy thận nhân tạo định kỳ hoặc thẩm phân phúc mạc'
  },
  recentAcs: {
    key: 'recentAcs',
    labelVi: 'Hội chứng vành cấp gần đây',
    descriptionVi: 'Nhồi máu cơ tim cấp hoặc đau thắt ngực không ổn định trong vòng 12 tháng qua'
  },
  statinIntolerance: {
    key: 'statinIntolerance',
    labelVi: 'Không dung nạp statin',
    descriptionVi: 'Tiền sử đau cơ, viêm cơ hoặc tăng men gan không dung nạp với ≥ 2 statin ở liều tối thiểu'
  },
  unprovokedHypokalemia: {
    key: 'unprovokedHypokalemia',
    labelVi: 'Hạ kali máu tự phát',
    descriptionVi: 'Hạ kali máu không do dùng lợi tiểu, gợi ý cường aldosteron nguyên phát'
  },
  suspectedSecondaryHtn: {
    key: 'suspectedSecondaryHtn',
    labelVi: 'Nghi ngờ THA thứ phát',
    descriptionVi: 'Tăng huyết áp khởi phát sớm (<30 tuổi), THA kháng trị hoặc hạ kali máu kèm theo'
  },
  dmTargetOrganDamage: {
    key: 'dmTargetOrganDamage',
    labelVi: 'ĐTĐ có tổn thương cơ quan đích',
    descriptionVi: 'Đái tháo đường kèm bệnh võng mạc, bệnh thần kinh hoặc vi đạm niệu'
  },
  familialHypercholesterolemia: {
    key: 'familialHypercholesterolemia',
    labelVi: 'Tăng cholesterol máu gia đình (FH)',
    descriptionVi: 'Tăng cholesterol máu gia đình dị hợp tử hoặc đồng hợp tử'
  },
  recurrentAcsWithin2Years: {
    key: 'recurrentAcsWithin2Years',
    labelVi: 'Tái phát biến cố mạch vành trong 2 năm',
    descriptionVi: 'Biến cố mạch máu xơ vữa lần 2 trong vòng 2 năm dù đã dùng statin tối đa dung nạp'
  },
  mechanicalValve: {
    key: 'mechanicalValve',
    labelVi: 'Van tim cơ học',
    descriptionVi: 'Bệnh nhân mang van tim nhân tạo cơ học (bắt buộc kháng vitamin K, chống chỉ định DOAC)'
  },
  mitralStenosis: {
    key: 'mitralStenosis',
    labelVi: 'Hẹp van hai lá vừa – khít',
    descriptionVi: 'Rung nhĩ có bệnh van tim (hẹp van hai lá mức độ vừa đến khít)'
  },
  obesity: {
    key: 'obesity',
    labelVi: 'Béo phì',
    descriptionVi: 'Béo phì lâm sàng (BMI ≥ 25 kg/m² chuẩn châu Á hoặc ≥ 30 kg/m² chuẩn quốc tế)'
  },
  frailty: {
    key: 'frailty',
    labelVi: 'Hội chứng suy yếu (Frailty)',
    descriptionVi: 'Suy yếu lâm sàng mức độ vừa – nặng ở người cao tuổi'
  },
  limitedLifespan: {
    key: 'limitedLifespan',
    labelVi: 'Kỳ vọng sống hạn chế',
    descriptionVi: 'Bệnh lý giai đoạn cuối hoặc kỳ vọng sống ngắn cần nới lỏng đích điều trị'
  },
  orthostaticHypotension: {
    key: 'orthostaticHypotension',
    labelVi: 'Hạ huyết áp tư thế',
    descriptionVi: 'Giảm SBP ≥ 20 mmHg hoặc DBP ≥ 10 mmHg khi đứng dậy'
  },
  pepticUlcer: {
    key: 'pepticUlcer',
    labelVi: 'Loét dạ dày – tá tràng',
    descriptionVi: 'Tiền sử hoặc đang có loét dạ dày – tá tràng tiến triển'
  },
  depression: {
    key: 'depression',
    labelVi: 'Rối loạn trầm cảm',
    descriptionVi: 'Bệnh đồng mắc trầm cảm / lo âu lâm sàng'
  },
  allergicRhinitis: {
    key: 'allergicRhinitis',
    labelVi: 'Viêm mũi dị ứng / Viêm mũi xoang mạn',
    descriptionVi: 'Bệnh lý đường hô hấp trên đồng mắc làm nặng kiểm soát hen'
  },
  gerd: {
    key: 'gerd',
    labelVi: 'Trào ngược dạ dày – thực quản (GERD)',
    descriptionVi: 'Trào ngược dạ dày – thực quản có triệu chứng'
  },
  priorAsthma: {
    key: 'priorAsthma',
    labelVi: 'Tiền sử hen phế quản',
    descriptionVi: 'Tiền sử hen phế quản đồng mắc trên bệnh nhân COPD'
  },
  aerd: {
    key: 'aerd',
    labelVi: 'Bệnh hô hấp kịch phát do aspirin/NSAID (AERD)',
    descriptionVi: 'Tam chứng Samter / hen nhạy cảm với aspirin và các NSAID ức chế COX-1'
  },
  snoringOsa: {
    key: 'snoringOsa',
    labelVi: 'Ngưng thở khi ngủ tắc nghẽn (OSA)',
    descriptionVi: 'Hội chứng ngưng thở khi ngủ do tắc nghẽn hoặc ngủ ngáy kèm buồn ngủ ban ngày'
  },
  cardiacAmyloidosis: {
    key: 'cardiacAmyloidosis',
    labelVi: 'Bệnh cơ tim nhiễm bột (Amyloidosis)',
    descriptionVi: 'Bệnh cơ tim thâm nhiễm amyloid (ATTR hoặc AL)'
  },
  hypertrophicCardiomyopathy: {
    key: 'hypertrophicCardiomyopathy',
    labelVi: 'Bệnh cơ tim phì đại (HCM)',
    descriptionVi: 'Bệnh cơ tim phì đại tắc nghẽn hoặc không tắc nghẽn'
  },
  renalBruit: {
    key: 'renalBruit',
    labelVi: 'Tiếng thổi động mạch thận / Hẹp ĐM thận',
    descriptionVi: 'Dấu hiệu gợi ý hẹp động mạch thận hai bên hoặc trên thận độc nhất'
  },
  allergyAceiArb: {
    key: 'allergyAceiArb',
    labelVi: 'Dị ứng / Không dung nạp ACEi/ARB',
    descriptionVi: 'Tiền sử phản ứng quá mẫn hoặc không dung nạp nhóm ức chế hệ RAS'
  },
  onAnticoagulant: {
    key: 'onAnticoagulant',
    labelVi: 'Đang dùng thuốc chống đông',
    descriptionVi: 'Đang điều trị kháng đông đường uống hoặc đường tiêm'
  },
  acuteAcsWithin24h: {
    key: 'acuteAcsWithin24h',
    labelVi: 'Hội chứng vành cấp trong 24 giờ',
    descriptionVi: 'Cấp cứu hội chứng mạch vành cấp kèm tăng huyết áp cấp cứu'
  },
  acuteIntracerebralHemorrhage: {
    key: 'acuteIntracerebralHemorrhage',
    labelVi: 'Xuất huyết nội sọ cấp',
    descriptionVi: 'Đột quỵ xuất huyết não cấp tính'
  },
  acuteIschemicStroke: {
    key: 'acuteIschemicStroke',
    labelVi: 'Đột quỵ nhồi máu não cấp',
    descriptionVi: 'Đột quỵ thiếu máu não cục bộ cấp tính'
  },
  acutePulmonaryEdema: {
    key: 'acutePulmonaryEdema',
    labelVi: 'Phù phổi cấp huyết động',
    descriptionVi: 'Suy tim cấp phù phổi cấp kèm tăng huyết áp cấp cứu'
  },
  aorticDissection: {
    key: 'aorticDissection',
    labelVi: 'Bóc tách động mạch chủ cấp',
    descriptionVi: 'Hội chứng động mạch chủ cấp tính cần hạ áp và tần số tim tích cực'
  },
  hypertensiveEncephalopathy: {
    key: 'hypertensiveEncephalopathy',
    labelVi: 'Bệnh não do tăng huyết áp',
    descriptionVi: 'Tăng huyết áp cấp cứu có triệu chứng thần kinh trung ương cấp'
  },
  malignantHypertension: {
    key: 'malignantHypertension',
    labelVi: 'Tăng huyết áp ác tính',
    descriptionVi: 'Tăng huyết áp nặng kèm tổn thương đáy mắt độ III/IV hoặc vi mạch huyết khối'
  },
  perioperativeHypertension: {
    key: 'perioperativeHypertension',
    labelVi: 'Tăng huyết áp chu phẫu',
    descriptionVi: 'Tăng huyết áp cấp tính trước, trong hoặc ngay sau phẫu thuật'
  },
  severePreeclampsiaEclampsia: {
    key: 'severePreeclampsiaEclampsia',
    labelVi: 'Tiền sản giật nặng / Sản giật',
    descriptionVi: 'Tăng huyết áp thai kỳ nặng có dấu hiệu tiền sản giật nặng hoặc sản giật'
  },
  thrombolysisEligible: {
    key: 'thrombolysisEligible',
    labelVi: 'Có chỉ định tiêu sợi huyết đường tĩnh mạch',
    descriptionVi: 'Đột quỵ nhồi máu não cấp trong cửa sổ tiêu sợi huyết (cần kiểm soát HA chặt hơn)'
  },
  plannedSurgery: {
    key: 'plannedSurgery',
    labelVi: 'Chuẩn bị phẫu thuật / Thủ thuật xâm lấn',
    descriptionVi: 'Có lịch phẫu thuật chương trình hoặc thủ thuật cần nhịn ăn / gây mê (cần ngưng SGLT2i 3–4 ngày trước mổ)'
  }
};

const CRITICAL_SAFETY_CUSTOM_INPUT_FLAGS = new Set<string>([
  'pregnant',
  'pregnancy',
  'breastfeeding',
  'lactation',
  'nursing',
  'severePreeclampsiaEclampsia',
  'onDialysis',
  'priorAngioedema',
  'angioedemaHistory',
  'aceiAngioedema',
  'historyOfAngioedema',
  'hereditaryAngioedema',
  'frailty',
  'limitedLifespan',
  'plannedSurgery',
  'aki',
  'akiSuspected',
  'mtc',
  'men2',
  'medullary_thyroid_carcinoma',
  'mtcMen2History',
  'historyMtcOrMen2',
  'pancreatitis',
  'historyPancreatitis',
  'acutePancreatitis',
  'acute_pancreatitis',
  'decompensatedCirrhosis',
  'activeLiverDisease',
  'wpw',
  'preExcitedAf',
  'avBlock2Or3',
  'secondOrThirdDegreeAvBlock',
  'sickSinusSyndrome',
  'pacemaker',
  'hasPacemaker',
  'cardiogenicShock',
  'activeBleeding',
  'dkaSuspected'
]);

/**
 * Từ điển đồng nghĩa lâm sàng có hướng (directional roll-up):
 * - `ascvd` tổng hợp toàn bộ mạch vành + mạch não + mạch ngoại biên.
 * - `vascularDisease` tổng hợp mạch vành + PAD + mảng xơ vữa ĐM chủ/cảnh (KHÔNG gộp `strokeOrTia` để tránh cộng đôi CHA2DS2-VA).
 * - `cad` CHỈ gồm bệnh lý động mạch vành (KHÔNG gộp `strokeOrTia`, `pad` hay `ascvd` chung để tránh chặn nhầm thuốc nhóm IC ở BN chỉ có tiền sử TIA/PAD).
 */
export const CONDITION_SYNONYM_GROUPS: Record<string, string[]> = {
  pregnant: ['pregnant', 'pregnancy', 'severePreeclampsiaEclampsia'],
  pregnancy: ['pregnant', 'pregnancy', 'severePreeclampsiaEclampsia'],
  breastfeeding: ['breastfeeding', 'lactation', 'nursing'],
  lactation: ['breastfeeding', 'lactation', 'nursing'],
  nursing: ['breastfeeding', 'lactation', 'nursing'],
  priorAngioedema: ['priorAngioedema', 'angioedemaHistory', 'aceiAngioedema', 'historyOfAngioedema', 'hereditaryAngioedema'],
  angioedemaHistory: ['priorAngioedema', 'angioedemaHistory', 'aceiAngioedema', 'historyOfAngioedema', 'hereditaryAngioedema'],
  aceiAngioedema: ['priorAngioedema', 'angioedemaHistory', 'aceiAngioedema', 'historyOfAngioedema', 'hereditaryAngioedema'],
  historyOfAngioedema: ['priorAngioedema', 'angioedemaHistory', 'aceiAngioedema', 'historyOfAngioedema', 'hereditaryAngioedema'],
  hereditaryAngioedema: ['hereditaryAngioedema', 'priorAngioedema'],
  ascvd: [
    'ascvd',
    'vascularDisease',
    'cad',
    'ccs',
    'acs',
    'mi',
    'priorMi',
    'stemi',
    'nstemi',
    'pci',
    'cabg',
    'strokeOrTia',
    'stroke',
    'tia',
    'stroke_tia',
    'pad',
    'aorticPlaque',
    'carotidPlaque',
    'recentAcs',
    'recurrentAcsWithin2Years'
  ],
  vascularDisease: [
    'vascularDisease',
    'ascvd',
    'cad',
    'ccs',
    'acs',
    'mi',
    'priorMi',
    'stemi',
    'nstemi',
    'pci',
    'cabg',
    'pad',
    'aorticPlaque',
    'carotidPlaque',
    'recentAcs',
    'recurrentAcsWithin2Years'
  ],
  cad: ['cad', 'ccs', 'acs', 'mi', 'priorMi', 'stemi', 'nstemi', 'pci', 'cabg', 'recentAcs', 'recurrentAcsWithin2Years'],
  ccs: ['ccs', 'cad'],
  acs: ['acs', 'stemi', 'nstemi', 'recentAcs'],
  mi: ['mi', 'stemi', 'nstemi', 'recentAcs'],
  stemi: ['stemi'],
  nstemi: ['nstemi'],
  pci: ['pci'],
  cabg: ['cabg'],
  pad: ['pad', 'peripheralArteryDisease'],
  carotidPlaque: ['carotidPlaque'],
  aorticPlaque: ['aorticPlaque'],
  strokeOrTia: ['strokeOrTia', 'stroke', 'tia', 'stroke_tia', 'acuteIschemicStroke'],
  stroke: ['strokeOrTia', 'stroke', 'tia', 'stroke_tia', 'acuteIschemicStroke'],
  tia: ['strokeOrTia', 'stroke', 'tia', 'stroke_tia'],
  stroke_tia: ['strokeOrTia', 'stroke', 'tia', 'stroke_tia'],
  af: ['af', 'afib'],
  afib: ['af', 'afib'],
  liverDisease: ['liverDisease', 'liver_disease', 'cirrhosis', 'decompensatedCirrhosis', 'activeLiverDisease'],
  liver_disease: ['liverDisease', 'liver_disease', 'cirrhosis', 'decompensatedCirrhosis', 'activeLiverDisease'],
  cirrhosis: ['cirrhosis', 'liverDisease', 'liver_disease', 'decompensatedCirrhosis'],
  decompensatedCirrhosis: ['decompensatedCirrhosis'],
  activeLiverDisease: ['activeLiverDisease'],
  aki: ['aki', 'akiSuspected'],
  mtc: ['mtc', 'men2', 'medullary_thyroid_carcinoma', 'mtcMen2History', 'historyMtcOrMen2'],
  men2: ['mtc', 'men2', 'medullary_thyroid_carcinoma', 'mtcMen2History', 'historyMtcOrMen2'],
  medullary_thyroid_carcinoma: ['mtc', 'men2', 'medullary_thyroid_carcinoma', 'mtcMen2History', 'historyMtcOrMen2'],
  mtcMen2History: ['mtc', 'men2', 'medullary_thyroid_carcinoma', 'mtcMen2History', 'historyMtcOrMen2'],
  pancreatitis: ['pancreatitis', 'historyPancreatitis', 'acutePancreatitis', 'acute_pancreatitis'],
  acutePancreatitis: ['acutePancreatitis', 'acute_pancreatitis'],
  dm: ['dm', 'diabetes', 'dmTargetOrganDamage'],
  diabetes: ['dm', 'diabetes', 'dmTargetOrganDamage'],
  hf: ['hf', 'heartFailure'],
  heartFailure: ['hf', 'heartFailure'],
  htn: ['htn', 'hypertension'],
  hypertension: ['htn', 'hypertension'],
  wpw: ['wpw', 'preExcitedAf', 'wpwAfib'],
  preExcitedAf: ['preExcitedAf', 'wpw', 'wpwAfib'],
  avBlock2Or3: ['avBlock2Or3', 'secondOrThirdDegreeAvBlock', 'av_block_2_3'],
  secondOrThirdDegreeAvBlock: ['avBlock2Or3', 'secondOrThirdDegreeAvBlock', 'av_block_2_3'],
  sickSinusSyndrome: ['sickSinusSyndrome', 'sick_sinus_syndrome', 'sss'],
  pacemaker: ['pacemaker', 'hasPacemaker'],
  cardiogenicShock: ['cardiogenicShock', 'cardiogenic_shock'],
  activeBleeding: ['activeBleeding', 'active_bleeding', 'acuteIntracerebralHemorrhage'],
  dkaSuspected: ['dkaSuspected', 'dka', 'eudka']
};

const warnedConditionKeys = new Set<string>();

export function resetWarnedConditionsForTest(): void {
  warnedConditionKeys.clear();
}

/**
 * Kiểm tra điều kiện bệnh lý từ RuleContext hoặc đối tượng chứa conditions,
 * xử lý đồng nghĩa lâm sàng an toàn và dự phòng trên `customInputs` cho các cờ sống còn.
 */
export function hasCondition(
  ctx: Pick<RuleContext, 'normalized'> & Partial<Pick<RuleContext, 'patient'>>,
  key: ConditionKey | string
): boolean {
  const isKnown = key in STANDARD_CONDITIONS || key in CONDITION_SYNONYM_GROUPS;
  if (process.env.NODE_ENV !== 'production' && !isKnown && !warnedConditionKeys.has(key)) {
    warnedConditionKeys.add(key);
    console.warn(
      `[require.ts] hasCondition(): Khóa điều kiện '${key}' không thuộc STANDARD_CONDITIONS. Xem docs/MODULE_CONTRACT.md`
    );
  }

  const normConds = ctx.normalized?.conditions || {};
  const rawConds = ctx.patient?.conditions || {};
  const normCustom = ctx.normalized?.customInputs || {};
  const rawCustom = ctx.patient?.customInputs || {};

  if (key === 'af' || key === 'afib') {
    if (ctx.normalized?.rhythm === 'afib' || ctx.patient?.rhythm === 'afib') {
      return true;
    }
  }
  if (key === 'pacemaker') {
    if (ctx.normalized?.rhythm === 'paced' || ctx.patient?.rhythm === 'paced') {
      return true;
    }
  }

  const keysToCheck = CONDITION_SYNONYM_GROUPS[key] || [key];
  for (const k of keysToCheck) {
    if (Boolean(normConds[k]) || Boolean(rawConds[k])) {
      return true;
    }
    if (
      CRITICAL_SAFETY_CUSTOM_INPUT_FLAGS.has(k) &&
      (normCustom[k] === true || rawCustom[k] === true)
    ) {
      return true;
    }
  }

  return false;
}
