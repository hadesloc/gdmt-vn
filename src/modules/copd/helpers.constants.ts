import type { RuleContext, Profile, Recommendation } from '../../engine/types';
import { thFor, dose, fmtDose, hasDrug, drug } from '../../kb-types';

export * from './helpers.drug_sets';

export const COPD_PROFILES: Profile[] = ['INTL', 'VN', 'US'];

export const LAMA_WARNING_VI =
  'Thận trọng ở người có glôcôm góc đóng hoặc tăng sản tuyến tiền liệt/bí tiểu; tránh để sương/bột thuốc tiếp xúc trực tiếp với mắt.';

export const LAMA_CONTROLLED_BPH_WARNING_VI =
  'Bệnh nhân có tăng sản lành tính tuyến tiền liệt (BPH) đã kiểm soát / glôcôm đang điều trị: Bắt buộc ngậm kín ống ngậm miệng (mouthpiece), tuyệt đối tránh xịt sương vào mắt và dặn tái khám ngay nếu xuất hiện tiểu khó, bí tiểu hoặc đau nhức mắt nhìn mờ.';

export type EffectiveInhalerTier =
  | 'none'
  | 'lama_mono'
  | 'laba_mono'
  | 'laba_lama'
  | 'ics_laba'
  | 'triple';

export interface InhalerClassProfile {
  ics: boolean;
  lama: boolean;
  laba: boolean;
  rank: number;
  canonicalId: string;
}

/** Bản đồ phân rã thành phần hoạt chất của các thuốc hít duy trì (INN và biệt dược phổ biến) */
export const INHALER_PROFILES: Record<string, InhalerClassProfile> = {
  // LAMA đơn trị
  tiotropium: { ics: false, lama: true, laba: false, rank: 12, canonicalId: 'tiotropium' },
  spiriva: { ics: false, lama: true, laba: false, rank: 12, canonicalId: 'tiotropium' },
  spiriva_respimat: { ics: false, lama: true, laba: false, rank: 12, canonicalId: 'tiotropium' },
  spiriva_handihaler: { ics: false, lama: true, laba: false, rank: 12, canonicalId: 'tiotropium' },
  umeclidinium: { ics: false, lama: true, laba: false, rank: 12, canonicalId: 'umeclidinium' },
  incruse: { ics: false, lama: true, laba: false, rank: 12, canonicalId: 'umeclidinium' },
  incruse_ellipta: { ics: false, lama: true, laba: false, rank: 12, canonicalId: 'umeclidinium' },
  glycopyrronium: { ics: false, lama: true, laba: false, rank: 12, canonicalId: 'glycopyrronium' },
  glycopyrrolate: { ics: false, lama: true, laba: false, rank: 12, canonicalId: 'glycopyrronium' },
  seebri: { ics: false, lama: true, laba: false, rank: 12, canonicalId: 'glycopyrronium' },
  seebri_breezhaler: { ics: false, lama: true, laba: false, rank: 12, canonicalId: 'glycopyrronium' },
  aclidinium: { ics: false, lama: true, laba: false, rank: 12, canonicalId: 'aclidinium' },
  eklira: { ics: false, lama: true, laba: false, rank: 12, canonicalId: 'aclidinium' },
  tudorza: { ics: false, lama: true, laba: false, rank: 12, canonicalId: 'aclidinium' },
  revefenacin: { ics: false, lama: true, laba: false, rank: 12, canonicalId: 'revefenacin' },
  yupelri: { ics: false, lama: true, laba: false, rank: 12, canonicalId: 'revefenacin' },
  // LABA đơn trị
  indacaterol: { ics: false, lama: false, laba: true, rank: 11, canonicalId: 'indacaterol' },
  onbrez: { ics: false, lama: false, laba: true, rank: 11, canonicalId: 'indacaterol' },
  onbrez_breezhaler: { ics: false, lama: false, laba: true, rank: 11, canonicalId: 'indacaterol' },
  olodaterol: { ics: false, lama: false, laba: true, rank: 11, canonicalId: 'olodaterol' },
  striverdi: { ics: false, lama: false, laba: true, rank: 11, canonicalId: 'olodaterol' },
  striverdi_respimat: { ics: false, lama: false, laba: true, rank: 11, canonicalId: 'olodaterol' },
  salmeterol: { ics: false, lama: false, laba: true, rank: 11, canonicalId: 'salmeterol' },
  serevent: { ics: false, lama: false, laba: true, rank: 11, canonicalId: 'salmeterol' },
  serevent_diskus: { ics: false, lama: false, laba: true, rank: 11, canonicalId: 'salmeterol' },
  serevent_evohaler: { ics: false, lama: false, laba: true, rank: 11, canonicalId: 'salmeterol' },
  vilanterol: { ics: false, lama: false, laba: true, rank: 11, canonicalId: 'vilanterol' },
  formoterol: { ics: false, lama: false, laba: true, rank: 11, canonicalId: 'formoterol' },
  formoterol_fumarate: { ics: false, lama: false, laba: true, rank: 11, canonicalId: 'formoterol' },
  foradil: { ics: false, lama: false, laba: true, rank: 11, canonicalId: 'formoterol' },
  oxis: { ics: false, lama: false, laba: true, rank: 11, canonicalId: 'formoterol' },
  arformoterol: { ics: false, lama: false, laba: true, rank: 11, canonicalId: 'arformoterol' },
  brovana: { ics: false, lama: false, laba: true, rank: 11, canonicalId: 'arformoterol' },
  // ICS đơn trị (cấm dùng đơn độc trong COPD không kèm hen)
  budesonide: { ics: true, lama: false, laba: false, rank: 5, canonicalId: 'budesonide' },
  pulmicort: { ics: true, lama: false, laba: false, rank: 5, canonicalId: 'budesonide' },
  pulmicort_turbuhaler: { ics: true, lama: false, laba: false, rank: 5, canonicalId: 'budesonide' },
  pulmicort_respules: { ics: true, lama: false, laba: false, rank: 5, canonicalId: 'budesonide' },
  fluticasone: { ics: true, lama: false, laba: false, rank: 5, canonicalId: 'fluticasone_propionate' },
  fluticasone_propionate: { ics: true, lama: false, laba: false, rank: 5, canonicalId: 'fluticasone_propionate' },
  flixotide: { ics: true, lama: false, laba: false, rank: 5, canonicalId: 'fluticasone_propionate' },
  fluticasone_furoate: { ics: true, lama: false, laba: false, rank: 5, canonicalId: 'fluticasone_furoate' },
  arnuity: { ics: true, lama: false, laba: false, rank: 5, canonicalId: 'fluticasone_furoate' },
  beclometasone: { ics: true, lama: false, laba: false, rank: 5, canonicalId: 'beclometasone' },
  qvar: { ics: true, lama: false, laba: false, rank: 5, canonicalId: 'beclometasone' },
  mometasone: { ics: true, lama: false, laba: false, rank: 5, canonicalId: 'mometasone' },
  asmanex: { ics: true, lama: false, laba: false, rank: 5, canonicalId: 'mometasone' },
  ciclesonide: { ics: true, lama: false, laba: false, rank: 5, canonicalId: 'ciclesonide' },
  alvesco: { ics: true, lama: false, laba: false, rank: 5, canonicalId: 'ciclesonide' },
  // Phối hợp đôi LAMA + LABA
  tiotropium_olodaterol: { ics: false, lama: true, laba: true, rank: 22, canonicalId: 'tiotropium_olodaterol' },
  olodaterol_tiotropium: { ics: false, lama: true, laba: true, rank: 22, canonicalId: 'tiotropium_olodaterol' },
  tiotropium_olodaterol_respimat: { ics: false, lama: true, laba: true, rank: 22, canonicalId: 'tiotropium_olodaterol' },
  spiolto: { ics: false, lama: true, laba: true, rank: 22, canonicalId: 'tiotropium_olodaterol' },
  spiolto_respimat: { ics: false, lama: true, laba: true, rank: 22, canonicalId: 'tiotropium_olodaterol' },
  stiolto: { ics: false, lama: true, laba: true, rank: 22, canonicalId: 'tiotropium_olodaterol' },
  umeclidinium_vilanterol: { ics: false, lama: true, laba: true, rank: 22, canonicalId: 'umeclidinium_vilanterol' },
  vilanterol_umeclidinium: { ics: false, lama: true, laba: true, rank: 22, canonicalId: 'umeclidinium_vilanterol' },
  anoro: { ics: false, lama: true, laba: true, rank: 22, canonicalId: 'umeclidinium_vilanterol' },
  anoro_ellipta: { ics: false, lama: true, laba: true, rank: 22, canonicalId: 'umeclidinium_vilanterol' },
  glycopyrronium_indacaterol: { ics: false, lama: true, laba: true, rank: 22, canonicalId: 'glycopyrronium_indacaterol' },
  indacaterol_glycopyrronium: { ics: false, lama: true, laba: true, rank: 22, canonicalId: 'glycopyrronium_indacaterol' },
  ultibro: { ics: false, lama: true, laba: true, rank: 22, canonicalId: 'glycopyrronium_indacaterol' },
  ultibro_breezhaler: { ics: false, lama: true, laba: true, rank: 22, canonicalId: 'glycopyrronium_indacaterol' },
  glycopyrrolate_formoterol: { ics: false, lama: true, laba: true, rank: 22, canonicalId: 'glycopyrrolate_formoterol' },
  glycopyrronium_formoterol: { ics: false, lama: true, laba: true, rank: 22, canonicalId: 'glycopyrrolate_formoterol' },
  bevespi: { ics: false, lama: true, laba: true, rank: 22, canonicalId: 'glycopyrrolate_formoterol' },
  bevespi_aerosphere: { ics: false, lama: true, laba: true, rank: 22, canonicalId: 'glycopyrrolate_formoterol' },
  aclidinium_formoterol: { ics: false, lama: true, laba: true, rank: 22, canonicalId: 'aclidinium_formoterol' },
  duaklir: { ics: false, lama: true, laba: true, rank: 22, canonicalId: 'aclidinium_formoterol' },
  duaklir_genuair: { ics: false, lama: true, laba: true, rank: 22, canonicalId: 'aclidinium_formoterol' },
  // Phối hợp đôi ICS + LABA
  budesonide_formoterol: { ics: true, lama: false, laba: true, rank: 21, canonicalId: 'budesonide_formoterol' },
  symbicort: { ics: true, lama: false, laba: true, rank: 21, canonicalId: 'budesonide_formoterol' },
  symbicort_turbuhaler: { ics: true, lama: false, laba: true, rank: 21, canonicalId: 'budesonide_formoterol' },
  symbicort_rapihaler: { ics: true, lama: false, laba: true, rank: 21, canonicalId: 'budesonide_formoterol' },
  fluticasone_salmeterol: { ics: true, lama: false, laba: true, rank: 21, canonicalId: 'fluticasone_salmeterol' },
  seretide: { ics: true, lama: false, laba: true, rank: 21, canonicalId: 'fluticasone_salmeterol' },
  seretide_accuhaler: { ics: true, lama: false, laba: true, rank: 21, canonicalId: 'fluticasone_salmeterol' },
  seretide_evohaler: { ics: true, lama: false, laba: true, rank: 21, canonicalId: 'fluticasone_salmeterol' },
  advair: { ics: true, lama: false, laba: true, rank: 21, canonicalId: 'fluticasone_salmeterol' },
  wixela: { ics: true, lama: false, laba: true, rank: 21, canonicalId: 'fluticasone_salmeterol' },
  wixela_inhub: { ics: true, lama: false, laba: true, rank: 21, canonicalId: 'fluticasone_salmeterol' },
  airduo: { ics: true, lama: false, laba: true, rank: 21, canonicalId: 'fluticasone_salmeterol' },
  fluticasone_vilanterol: { ics: true, lama: false, laba: true, rank: 21, canonicalId: 'fluticasone_vilanterol' },
  fluticasone_furoate_vilanterol: { ics: true, lama: false, laba: true, rank: 21, canonicalId: 'fluticasone_vilanterol' },
  relvar: { ics: true, lama: false, laba: true, rank: 21, canonicalId: 'fluticasone_vilanterol' },
  relvar_ellipta: { ics: true, lama: false, laba: true, rank: 21, canonicalId: 'fluticasone_vilanterol' },
  breo: { ics: true, lama: false, laba: true, rank: 21, canonicalId: 'fluticasone_vilanterol' },
  breo_ellipta: { ics: true, lama: false, laba: true, rank: 21, canonicalId: 'fluticasone_vilanterol' },
  beclometasone_formoterol: { ics: true, lama: false, laba: true, rank: 21, canonicalId: 'beclometasone_formoterol' },
  foster: { ics: true, lama: false, laba: true, rank: 21, canonicalId: 'beclometasone_formoterol' },
  foster_nexthaler: { ics: true, lama: false, laba: true, rank: 21, canonicalId: 'beclometasone_formoterol' },
  mometasone_formoterol: { ics: true, lama: false, laba: true, rank: 21, canonicalId: 'mometasone_formoterol' },
  dulera: { ics: true, lama: false, laba: true, rank: 21, canonicalId: 'mometasone_formoterol' },
  // Phối hợp ba thuốc ICS + LAMA + LABA
  fluticasone_furoate_umeclidinium_vilanterol: {
    ics: true,
    lama: true,
    laba: true,
    rank: 30,
    canonicalId: 'fluticasone_furoate_umeclidinium_vilanterol',
  },
  fluticasone_umeclidinium_vilanterol: {
    ics: true,
    lama: true,
    laba: true,
    rank: 30,
    canonicalId: 'fluticasone_furoate_umeclidinium_vilanterol',
  },
  trelegy: {
    ics: true,
    lama: true,
    laba: true,
    rank: 30,
    canonicalId: 'fluticasone_furoate_umeclidinium_vilanterol',
  },
  trelegy_ellipta: {
    ics: true,
    lama: true,
    laba: true,
    rank: 30,
    canonicalId: 'fluticasone_furoate_umeclidinium_vilanterol',
  },
  budesonide_glycopyrronium_formoterol: {
    ics: true,
    lama: true,
    laba: true,
    rank: 30,
    canonicalId: 'budesonide_glycopyrronium_formoterol',
  },
  breztri: {
    ics: true,
    lama: true,
    laba: true,
    rank: 30,
    canonicalId: 'budesonide_glycopyrronium_formoterol',
  },
  breztri_aerosphere: {
    ics: true,
    lama: true,
    laba: true,
    rank: 30,
    canonicalId: 'budesonide_glycopyrronium_formoterol',
  },
  trixeo: {
    ics: true,
    lama: true,
    laba: true,
    rank: 30,
    canonicalId: 'budesonide_glycopyrronium_formoterol',
  },
  trixeo_aerosphere: {
    ics: true,
    lama: true,
    laba: true,
    rank: 30,
    canonicalId: 'budesonide_glycopyrronium_formoterol',
  },
  beclometasone_glycopyrronium_formoterol: {
    ics: true,
    lama: true,
    laba: true,
    rank: 30,
    canonicalId: 'beclometasone_glycopyrronium_formoterol',
  },
  beclometasone_formoterol_glycopyrronium: {
    ics: true,
    lama: true,
    laba: true,
    rank: 30,
    canonicalId: 'beclometasone_glycopyrronium_formoterol',
  },
  budesonide_formoterol_glycopyrronium: {
    ics: true,
    lama: true,
    laba: true,
    rank: 30,
    canonicalId: 'budesonide_glycopyrronium_formoterol',
  },
  trimbow: {
    ics: true,
    lama: true,
    laba: true,
    rank: 30,
    canonicalId: 'beclometasone_glycopyrronium_formoterol',
  },
  trimbow_nexthaler: {
    ics: true,
    lama: true,
    laba: true,
    rank: 30,
    canonicalId: 'beclometasone_glycopyrronium_formoterol',
  },
  enerzair: {
    ics: true,
    lama: true,
    laba: true,
    rank: 30,
    canonicalId: 'enerzair',
  },
  enerzair_breezhaler: {
    ics: true,
    lama: true,
    laba: true,
    rank: 30,
    canonicalId: 'enerzair',
  },
  mometasone_indacaterol_glycopyrronium: {
    ics: true,
    lama: true,
    laba: true,
    rank: 30,
    canonicalId: 'enerzair',
  },
};

const LAMA_TOKENS = new Set(['tiotropium', 'umeclidinium', 'glycopyrronium', 'glycopyrrolate', 'aclidinium', 'revefenacin']);
const LABA_TOKENS = new Set(['olodaterol', 'indacaterol', 'vilanterol', 'salmeterol', 'formoterol', 'arformoterol']);
const ICS_TOKENS = new Set(['budesonide', 'beclometasone', 'fluticasone', 'mometasone', 'ciclesonide']);

export function getInhalerProfile(drugId: string | undefined): InhalerClassProfile | undefined {
  if (!drugId) return undefined;
  const norm = drugId.trim().toLowerCase();
  const staticProf = INHALER_PROFILES[norm];
  if (staticProf) return staticProf;
  if (hasDrug(norm)) {
    const entry = drug(norm);
    const cls = entry.classes ?? [];
    const comps = entry.components ?? [];
    const ics = cls.includes('ics') || comps.some((c) => ICS_TOKENS.has(c.toLowerCase()));
    const lama = cls.includes('lama') || comps.some((c) => LAMA_TOKENS.has(c.toLowerCase()));
    const laba = cls.includes('laba') || comps.some((c) => LABA_TOKENS.has(c.toLowerCase()));
    if (ics || lama || laba) {
      const rank =
        ics && lama && laba ? 30 : lama && laba ? 22 : ics && laba ? 21 : lama ? 12 : laba ? 11 : 5;
      return { ics, lama, laba, rank, canonicalId: entry.id };
    }
  }
  const tokens = norm.split('_');
  const ics = tokens.some((t) => ICS_TOKENS.has(t));
  const lama = tokens.some((t) => LAMA_TOKENS.has(t));
  const laba = tokens.some((t) => LABA_TOKENS.has(t));
  if (ics || lama || laba) {
    const rank =
      ics && lama && laba ? 30 : lama && laba ? 22 : ics && laba ? 21 : lama ? 12 : laba ? 11 : 5;
    return { ics, lama, laba, rank, canonicalId: norm };
  }
  return undefined;
}

export function formatCopdBudesonideFormoterolDose(requirePmdiSpacer: boolean): string {
  const budMcg = thFor('dose_mcg', 'copd.budesonide_formoterol_bud_mcg');
  const formMcg = thFor('dose_mcg', 'copd.budesonide_formoterol_form_mcg');
  const perTime = thFor('actuations_count', 'copd.budesonide_formoterol_per_time');
  const dailyTotal = thFor('actuations_count', 'copd.budesonide_formoterol_daily_doses');
  if (requirePmdiSpacer) {
    return `Bình xịt định liều pMDI không chứa lactose (Symbicort Rapihaler + buồng đệm) ${budMcg}/${formMcg} mcg: xịt ${perTime} nhát x 2 lần/ngày (tổng ${dailyTotal} liều/ngày cố định cho COPD; không dùng chế độ cắt cơn MART, tránh Turbuhaler DPI)`;
  }
  return `${budMcg}/${formMcg} mcg/liều: hít ${perTime} liều x 2 lần/ngày (tổng ${dailyTotal} liều/ngày cố định cho COPD theo BYT QĐ 2131/2026; không dùng chế độ MART cắt cơn của Hen)`;
}

export function formatCopdBeclometasoneFormoterolDose(requirePmdiSpacer: boolean): string {
  const spacerNote = requirePmdiSpacer ? ' kèm buồng đệm' : '';
  return `Bình xịt định liều pMDI hạt siêu mịn không chứa lactose (Foster${spacerNote}): xịt 2 nhát x 2 lần/ngày cố định cho COPD (beclometasone chuyển hóa qua esterase, an toàn khi dùng thuốc ức chế mạnh CYP3A4; tránh Foster Nexthaler DPI nếu dị ứng đạm sữa/lực hít yếu)`;
}

export function formatCopdTiotropiumDose(avoidHandihalerDpi: boolean): string {
  const baseDose = fmtDose(dose('tiotropium', 'start'));
  if (avoidHandihalerDpi) {
    return `${baseDose} – Chỉ định dạng phun sương hạt mịn Spiriva Respimat SMI (không chứa lactose, không phụ thuộc lực hít; tuyệt đối tránh bình bột khô HandiHaler DPI)`;
  }
  return baseDose;
}

export function copdMissingRec(
  fieldKey: string,
  labelVi: string,
  reasonVi: string,
  citationIds: string[]
): Recommendation {
  return {
    id: `missing_input_${fieldKey}`,
    module: 'copd',
    tier: 'Dữ liệu cần bổ sung',
    tierOrder: 99,
    action: 'CONSIDER',
    title: `Cần nhập ${labelVi} để đánh giá`,
    rationale: `Chưa có thông số ${labelVi}. Cần nhập liệu để đánh giá: ${reasonVi}.`,
    gates: [],
    citationIds,
    priority: 25,
  };
}

export type { RuleContext };
