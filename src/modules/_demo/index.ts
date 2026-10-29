/**
 * GDMT-VN Demo Module
 * CHÚ Ý: ĐÂY LÀ MODULE DÙNG ĐỂ KIỂM THỬ GIAO DIỆN VÀ ENGINE END-TO-END.
 * Tuân thủ 100% chuẩn KB-driven (`th`, `thFor`, `drug`, `dose`, `fmtDose`, `need`, `missingInputRec`) và 0 TODO citation.
 */

import type {
  ModuleDefinition,
  Rule,
  GateResult,
  MatrixDefinition,
  PathwayDefinition,
  PresetPatient,
  ModuleInputSchema
} from '../../engine/types';
import { need, missingInputRec, hasCondition } from '../../engine/require';
import { th, thFor, drug, dose, fmtDose } from '../../kb-types';

const dapaEntry = drug('dapagliflozin');
const arniEntry = drug('sacubitril_valsartan');
const metEntry = drug('metformin');
const amloEntry = drug('amlodipine');
const furoEntry = drug('furosemide');

const sglt2EgfrMin = thFor('egfr', 'ckd.sglt2i.egfr_initiate_min');
const hfLvefCutoff = thFor('lvef', 'af.rate.lvef_cutoff');
const arniSbpMin = th('hf.arni.sbp_min_start');
const arniKMax = th('hf.arni.k_max_caution');
const metEgfrContra = thFor('egfr', 'dm2.metformin.egfr_contra');
const metEgfrCaution = thFor('egfr', 'dm2.metformin.egfr_caution');
const metReducedMaxMg = thFor('dose_mg', 'dm2.metformin.dose_reduced_max');

export const DEMO_INPUTS: ModuleInputSchema = {
  groups: [
    {
      id: 'demo_hf_group',
      titleVi: 'Chỉ số phân tầng suy tim (DEMO)',
      fields: [
        {
          id: 'lvef',
          labelVi: 'Phân suất tống máu thất trái (LVEF)',
          type: 'range',
          min: 10,
          max: 75,
          step: 1,
          unit: '%',
          defaultValue: 50,
          helpVi: `≤ ${hfLvefCutoff}% (HFrEF) · > ${hfLvefCutoff}% (HFmrEF / HFpEF)`
        },
        {
          id: 'nyha',
          labelVi: 'Phân độ cơ năng NYHA',
          type: 'select',
          options: [
            { value: 1, label: 'NYHA I - Không hạn chế vận động thể lực' },
            { value: 2, label: 'NYHA II - Hạn chế nhẹ vận động thể lực' },
            { value: 3, label: 'NYHA III - Hạn chế nhiều vận động thể lực' },
            { value: 4, label: 'NYHA IV - Khó thở ngay cả khi nghỉ ngơi' }
          ]
        }
      ]
    }
  ]
};

export const DEMO_RULES: Rule[] = [
  {
    id: 'demo.sglt2i_indication',
    module: '_demo',
    nameVi: '[DEMO] Chỉ định SGLT2i ở bệnh thận mạn hoặc đái tháo đường',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      return (
        hasCondition(ctx, 'ckd') ||
        hasCondition(ctx, 'dm') ||
        ctx.patient.selectedModules.includes('ckd') ||
        ctx.patient.selectedModules.includes('dm2')
      );
    },
    produce: (ctx) => {
      const egfr = need(ctx, 'egfr');
      if (egfr === undefined) {
        return missingInputRec('_demo', 'egfr', 'xét điều kiện khởi trị SGLT2i', [
          'kdigo.ckd.2024.rec_3_7_1_sglt2i_t2d'
        ]);
      }

      return {
        id: 'rec_demo_sglt2i',
        module: '_demo',
        tier: 'Bảo vệ tim - thận',
        tierOrder: 1,
        action: 'START',
        drugId: dapaEntry.id,
        drugNameVi: dapaEntry.nameVi,
        dose: fmtDose(dose('dapagliflozin', 'start')),
        title: `Khởi trị ${dapaEntry.nameVi} (Ức chế SGLT2)`,
        rationale: 'Làm chậm tiến triển suy thận và giảm nguy cơ biến cố tim mạch ở bệnh nhân CKD hoặc ĐTĐ típ 2.',
        gates: [
          {
            parameter: 'eGFR',
            passed: egfr >= sglt2EgfrMin,
            value: egfr,
            threshold: sglt2EgfrMin,
            messageVi:
              egfr >= sglt2EgfrMin
                ? `eGFR ${egfr} ≥ ${sglt2EgfrMin}: Đủ điều kiện khởi trị`
                : `eGFR ${egfr} < ${sglt2EgfrMin}: Dưới ngưỡng khởi trị an toàn`
          }
        ],
        citationIds: ['kdigo.ckd.2024.rec_3_7_1_sglt2i_t2d', 'kdigo.ckd.2024.rec_3_7_2_sglt2i_ckd_hf'],
        priority: 90
      };
    },
    citationIds: ['kdigo.ckd.2024.rec_3_7_1_sglt2i_t2d']
  },
  {
    id: 'demo.arni_indication',
    module: '_demo',
    nameVi: '[DEMO] Chỉ định Sacubitril/Valsartan ở suy tim HFrEF',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const ef = need(ctx, 'lvef');
      return (ef !== undefined && ef <= hfLvefCutoff) || hasCondition(ctx, 'hf');
    },
    produce: (ctx) => {
      const sbp = need(ctx, 'sbp');
      const k = need(ctx, 'k');
      const gates: GateResult[] = [];

      if (sbp !== undefined) {
        gates.push({
          parameter: 'SBP',
          passed: sbp >= arniSbpMin,
          value: sbp,
          threshold: arniSbpMin,
          messageVi:
            sbp >= arniSbpMin
              ? `Huyết áp tâm thu ${sbp} ≥ ${arniSbpMin}: Đạt tiêu chuẩn`
              : `Huyết áp tâm thu ${sbp} < ${arniSbpMin}: Cần thận trọng / tạm hoãn`
        });
      }

      if (k !== undefined) {
        gates.push({
          parameter: 'K+',
          passed: k <= arniKMax,
          value: k,
          threshold: arniKMax,
          messageVi:
            k <= arniKMax
              ? `K⁺ ${k} trong giới hạn an toàn (≤ ${arniKMax})`
              : `K⁺ ${k} vượt ngưỡng thận trọng (> ${arniKMax})`
        });
      }

      return {
        id: 'rec_demo_arni',
        module: '_demo',
        tier: 'Bốn trụ cột suy tim',
        tierOrder: 1,
        action: 'START',
        drugId: arniEntry.id,
        drugNameVi: arniEntry.nameVi,
        dose: fmtDose(dose('sacubitril_valsartan', 'start')),
        title: `Khởi trị ${arniEntry.nameVi}`,
        rationale: 'Trụ cột điều trị nền tảng giảm tử vong tim mạch và tái nhập viện ở bệnh nhân suy tim phân suất tống máu giảm.',
        gates,
        citationIds: ['esc.hf.2026.sacubitril_valsartan_dose', 'esc.hf.2026.arni_sbp_100_egfr_30'],
        priority: 95
      };
    },
    citationIds: ['esc.hf.2026.sacubitril_valsartan_dose']
  },
  {
    id: 'demo.metformin_indication',
    module: '_demo',
    nameVi: '[DEMO] Kiểm soát đường huyết với Metformin',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => hasCondition(ctx, 'dm') || ctx.patient.selectedModules.includes('dm2'),
    produce: (ctx) => {
      const egfr = need(ctx, 'egfr');
      if (egfr === undefined) {
        return missingInputRec('_demo', 'egfr', 'xác định liều và chống chỉ định Metformin', [
          'fda.metformin.egfr_bands'
        ]);
      }

      return {
        id: 'rec_demo_metformin',
        module: '_demo',
        tier: 'Kiểm soát đường huyết',
        tierOrder: 2,
        action: egfr >= metEgfrCaution ? 'START' : egfr >= metEgfrContra ? 'REDUCE' : 'STOP',
        drugId: metEntry.id,
        drugNameVi: metEntry.nameVi,
        dose:
          egfr >= metEgfrCaution
            ? fmtDose(dose('metformin', 'start'))
            : `Tối đa ${metReducedMaxMg} mg/ngày`,
        title: `Điều trị ${metEntry.nameVi} theo chức năng thận`,
        rationale: 'Thuốc hạ glucose máu đầu tay nhóm biguanide, cải thiện nhạy cảm insulin.',
        gates: [
          {
            parameter: 'eGFR',
            passed: egfr >= metEgfrContra,
            value: egfr,
            threshold: metEgfrContra,
            messageVi:
              egfr >= metEgfrContra
                ? `eGFR ${egfr} ≥ ${metEgfrContra}: Cho phép điều chỉnh theo dải lọc cầu thận`
                : `eGFR ${egfr} < ${metEgfrContra}: Chống chỉ định ${metEntry.nameVi}`
          }
        ],
        citationIds: ['fda.metformin.egfr_bands', 'byt.dm2.2020.metformin_renal_contra'],
        priority: 70
      };
    },
    citationIds: ['fda.metformin.egfr_bands']
  },
  {
    id: 'demo.k_missing_check',
    module: '_demo',
    nameVi: '[DEMO] Cân nhắc xét nghiệm Kali máu nếu chưa có',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => need(ctx, 'k') === undefined,
    produce: () => ({
      id: 'rec_demo_need_k',
      module: '_demo',
      tier: 'Xét nghiệm bổ sung',
      tierOrder: 3,
      action: 'CONSIDER',
      title: 'Định lượng Kali huyết thanh (K⁺)',
      rationale: 'Chưa có kết quả K⁺ máu. Cần bổ sung xét nghiệm để đánh giá chỉ định an toàn thuốc nhóm RASi/ARNI/MRA.',
      gates: [],
      citationIds: ['kdigo.ckd.2024.pp_3_6_2_rasi_monitoring'],
      priority: 30
    }),
    citationIds: ['kdigo.ckd.2024.pp_3_6_2_rasi_monitoring']
  }
];

export const DEMO_MATRIX: MatrixDefinition = {
  title: 'Ma trận an toàn thuốc theo dải chức năng thận (eGFR)',
  columns: [
    { id: 'g1', label: 'G1', subLabel: '≥ 90' },
    { id: 'g2', label: 'G2', subLabel: '60–89' },
    { id: 'g3a', label: 'G3a', subLabel: '45–59' },
    { id: 'g3b', label: 'G3b', subLabel: '30–44' },
    { id: 'g4', label: 'G4', subLabel: '15–29' },
    { id: 'g5', label: 'G5', subLabel: '< 15' }
  ],
  rows: [
    {
      drugId: dapaEntry.id,
      nameVi: `${dapaEntry.nameVi} (${fmtDose(dose('dapagliflozin', 'start'))})`,
      cells: {
        g1: { initiate: 'rec', continue: 'rec', citationIds: ['kdigo.ckd.2024.rec_3_7_1_sglt2i_t2d'] },
        g2: { initiate: 'rec', continue: 'rec', citationIds: ['kdigo.ckd.2024.rec_3_7_1_sglt2i_t2d'] },
        g3a: { initiate: 'rec', continue: 'rec', citationIds: ['kdigo.ckd.2024.rec_3_7_1_sglt2i_t2d'] },
        g3b: { initiate: 'rec', continue: 'rec', citationIds: ['kdigo.ckd.2024.rec_3_7_1_sglt2i_t2d'] },
        g4: {
          initiate: 'rec',
          continue: 'rec',
          note: `Khởi trị khi eGFR ≥ ${sglt2EgfrMin}; tiếp tục đến lọc máu`,
          citationIds: ['kdigo.ckd.2024.pp_3_7_1_continue_below_20']
        },
        g5: {
          initiate: 'not_rec',
          continue: 'ok',
          note: 'Không khởi trị mới, tiếp tục duy trì nếu dung nạp tốt trước lọc máu',
          citationIds: ['kdigo.ckd.2024.pp_3_7_1_continue_below_20']
        }
      }
    },
    {
      drugId: arniEntry.id,
      nameVi: arniEntry.nameVi,
      cells: {
        g1: { initiate: 'rec', continue: 'rec', citationIds: ['esc.hf.2026.sacubitril_valsartan_dose'] },
        g2: { initiate: 'rec', continue: 'rec', citationIds: ['esc.hf.2026.sacubitril_valsartan_dose'] },
        g3a: { initiate: 'rec', continue: 'rec', citationIds: ['esc.hf.2026.sacubitril_valsartan_dose'] },
        g3b: {
          initiate: 'rec',
          continue: 'rec',
          note: `Cân nhắc liều khởi đầu thấp (${fmtDose(dose('sacubitril_valsartan', 'start'))})`,
          citationIds: ['esc.hf.2026.arni_sbp_100_egfr_30']
        },
        g4: {
          initiate: 'caution',
          continue: 'caution',
          note: 'Thận trọng, theo dõi sát Kali máu và Creatinin huyết thanh',
          citationIds: ['esc.hf.2026.arni_sbp_100_egfr_30']
        },
        g5: {
          initiate: 'not_rec',
          continue: 'caution',
          citationIds: ['esc.hf.2026.arni_sbp_100_egfr_30']
        }
      }
    },
    {
      drugId: metEntry.id,
      nameVi: metEntry.nameVi,
      cells: {
        g1: { initiate: 'rec', continue: 'rec', citationIds: ['fda.metformin.egfr_bands'] },
        g2: { initiate: 'rec', continue: 'rec', citationIds: ['fda.metformin.egfr_bands'] },
        g3a: { initiate: 'rec', continue: 'rec', citationIds: ['fda.metformin.egfr_bands'] },
        g3b: {
          initiate: 'not_rec',
          continue: 'caution',
          note: `Giảm liều tối đa ${metReducedMaxMg} mg/ngày`,
          citationIds: ['fda.metformin.egfr_bands']
        },
        g4: {
          initiate: 'contra',
          continue: 'contra',
          note: `Chống chỉ định khi eGFR < ${metEgfrContra}`,
          citationIds: ['fda.metformin.egfr_bands', 'byt.dm2.2020.metformin_renal_contra']
        },
        g5: {
          initiate: 'contra',
          continue: 'contra',
          note: 'Chống chỉ định tuyệt đối do nguy cơ toan lactic',
          citationIds: ['fda.metformin.egfr_bands', 'byt.dm2.2020.metformin_renal_contra']
        }
      }
    }
  ]
};

export const DEMO_PATHWAY: PathwayDefinition = {
  title: 'Lộ trình tối ưu hóa phác đồ điều trị',
  steps: [
    {
      id: 'step_1',
      stepNumber: 1,
      title: 'Đánh giá & Phân tầng nguy cơ',
      description: 'Xác định độ lọc cầu thận eGFR, tỷ số albumin niệu UACR, phân suất tống máu LVEF và nguy cơ tim mạch - thận toàn diện.',
      status: 'completed',
      citationIds: ['kdigo.ckd.2024.rec_3_7_1_sglt2i_t2d']
    },
    {
      id: 'step_2',
      stepNumber: 2,
      title: 'Khởi trị tứ trụ nền tảng',
      description: 'Bắt đầu sớm các nhóm thuốc có bằng chứng giảm tử vong và bảo vệ cơ quan đích.',
      status: 'active',
      citationIds: ['esc.hf.2026.sacubitril_valsartan_dose']
    },
    {
      id: 'step_3',
      stepNumber: 3,
      title: 'Theo dõi sinh hóa định kỳ',
      description: 'Kiểm tra lại Creatinin huyết thanh và Kali máu sau khi khởi trị hoặc tăng liều nhóm ức chế hệ RAA / MRA.',
      status: 'upcoming',
      citationIds: ['kdigo.ckd.2024.pp_3_6_2_rasi_monitoring']
    },
    {
      id: 'step_4',
      stepNumber: 4,
      title: 'Chuẩn độ tăng liều mục tiêu',
      description: 'Tăng dần đến liều tối đa dung nạp đã được chứng minh hiệu quả trong các thử nghiệm lâm sàng.',
      status: 'upcoming',
      citationIds: ['esc.hf.2026.sacubitril_valsartan_dose']
    }
  ]
};

const preset1Age = 64;
const preset2Age = 71;

export const DEMO_PRESETS: PresetPatient[] = [
  {
    id: 'preset_ckd_dm',
    nameVi: 'BN 1: Bệnh thận mạn + ĐTĐ típ 2 (Ngoại trú)',
    description: `Bệnh nhân nam ${preset1Age} tuổi, bệnh thận mạn giai đoạn G3b kèm đái tháo đường típ 2 và tăng huyết áp ngoại trú.`,
    patient: {
      age: preset1Age,
      sex: 'male',
      weight: 68,
      height: 165,
      sbp: 135,
      dbp: 85,
      hr: 72,
      rhythm: 'sinus',
      scr: 145,
      k: 4.6,
      glucose: 8.5,
      hba1c: 7.8,
      uacr: 45,
      selectedModules: ['ckd', 'dm2', '_demo'],
      conditions: {
        ckd: true,
        dm: true,
        htn: true
      },
      currentMeds: [
        {
          drugId: amloEntry.id,
          name: amloEntry.nameVi,
          dose: fmtDose(dose('amlodipine', 'start')),
          freq: '1 lần/ngày'
        }
      ]
    }
  },
  {
    id: 'preset_hf_htn',
    nameVi: 'BN 2: Suy tim HFrEF + THA (Nội viện)',
    description: `Bệnh nhân nữ ${preset2Age} tuổi, suy tim phân suất tống máu giảm NYHA III kèm tăng huyết áp đang điều trị nội viện.`,
    patient: {
      age: preset2Age,
      sex: 'female',
      weight: 56,
      height: 152,
      sbp: 115,
      dbp: 70,
      hr: 82,
      rhythm: 'sinus',
      scr: 95,
      k: 4.8,
      lvef: 30,
      nyha: 3,
      selectedModules: ['hf', 'htn', '_demo'],
      conditions: {
        hf: true,
        htn: true
      },
      currentMeds: [
        {
          drugId: furoEntry.id,
          name: furoEntry.nameVi,
          dose: fmtDose(dose('furosemide', 'start')),
          freq: '1 lần sáng'
        }
      ]
    }
  }
];

export const demoModule: ModuleDefinition = {
  id: '_demo',
  nameVi: 'Demo Thử Nghiệm Hệ Thống',
  shortName: 'DEMO',
  icon: '🧪',
  rules: DEMO_RULES,
  inputs: DEMO_INPUTS,
  matrix: DEMO_MATRIX,
  pathway: DEMO_PATHWAY,
  presets: DEMO_PRESETS
};
