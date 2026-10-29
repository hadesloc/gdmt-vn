/**
 * GDMT-VN CKD Module - Outpatient Chronic Hyperkalemia Binders & Hypokalemia Safety Rules
 * Phân quyền: Agent E (Round 4 Remediation & < 20 KB Modularization)
 * Bao phủ: CKD-R4-R1-04 (SZC HD non-dialysis day dosing), CKD-R4-R2-06 (CPS bowel/Ca2+ contra), CKD-R4-R2-08, CKD-R4-R3-02
 */

import type { Rule } from '../../engine/types';
import { need } from '../../engine/require';
import { dose, drug, thFor } from '../../kb-types/access';
import {
  fmtShortDose,
  getMedComponents,
  hasCkdFlag,
  hasCpsContraindication,
  isAkiActive,
  isDriMed,
  isKBinderMed,
  isKSparingOrSteroidalMraMed,
  isOutpatientAcuteCrisis,
  isRasiOrArniMed,
  KBINDER_DRUG_IDS,
  medDisplayName,
  normalizeDrugId,
} from './helpers';

export const ckdOutpatientKbinderRules: Rule[] = [
  // 1. Tăng Kali máu nhẹ–vừa ngoại trú ổn định (5.1–5.9 mmol/L): Chất gắn Kali để duy trì/tái lập RASi/MRA
  {
    id: 'ckd.outpatient.chronic_hyperkalemia_binders',
    module: 'ckd',
    nameVi: 'Sử dụng chất gắn Kali để kiểm soát Kali và duy trì liệu pháp RASi/MRA',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (isAkiActive(ctx) || isOutpatientAcuteCrisis(ctx)) return false;
      const k = need(ctx, 'k');
      if (ctx.patient.currentMeds.some((m) => isKBinderMed(m))) return false;

      const hasKRetaining = ctx.patient.currentMeds.some(
        (m) =>
          isRasiOrArniMed(m) ||
          isDriMed(m) ||
          normalizeDrugId(m.drugId) === 'finerenone' ||
          isKSparingOrSteroidalMraMed(m)
      );
      const kMin = thFor('k', 'ckd.rasi.k_initiate_max');
      const kEmergency = thFor('k', 'ckd.hyperkalemia.moderate_min');

      return hasKRetaining && k !== undefined && k > kMin && k < kEmergency;
    },
    produce: (ctx) => {
      const k = need(ctx, 'k')!;
      const isVN = ctx.settings.profile === 'VN';
      const onHd = hasCkdFlag(ctx, 'onDialysis');
      const cpsContra = hasCpsContraindication(ctx);
      const kMin = thFor('k', 'ckd.rasi.k_initiate_max');
      const kHold = thFor('k', 'ckd.rasi.k_hold_threshold');
      const hdStartG = thFor('dose_g', 'ckd.szc.hd_start_dose');
      const hdMaxG = thFor('dose_g', 'ckd.szc.hd_max_dose');
      const naMg = thFor('dose_mg', 'ckd.szc.sodium_per_5g_mg');

      const cpsName = drug('calcium_polystyrene_sulfonate').nameVi;
      const patiromerName = drug('patiromer').nameVi;
      const szcName = drug('sodium_zirconium_cyclosilicate').nameVi;

      let binderDrugId: (typeof KBINDER_DRUG_IDS)[number] =
        isVN && !cpsContra
          ? 'calcium_polystyrene_sulfonate'
          : onHd || cpsContra
            ? 'sodium_zirconium_cyclosilicate'
            : 'patiromer';

      const binderName = drug(binderDrugId).nameVi;
      const binderDose =
        binderDrugId === 'sodium_zirconium_cyclosilicate' && onHd
          ? `${hdStartG} g x 1 lần/ngày vào ngày không lọc máu (chỉnh liều tối đa ${hdMaxG} g vào ngày không lọc máu)`
          : binderDrugId === 'sodium_zirconium_cyclosilicate'
            ? fmtShortDose(dose('sodium_zirconium_cyclosilicate', 'target'))
            : fmtShortDose(dose(binderDrugId, 'start'));

      const displayCitations =
        binderDrugId === 'calcium_polystyrene_sulfonate'
          ? [
              'kdigo.ckd.2024.pp_3_6_3_hyperkalemia_k_binders',
              'byt.ckd.2024.potassium_resine_dose',
              'ukka.2022.appendix_3f_cps_safety_3h_bowel',
            ]
          : binderDrugId === 'sodium_zirconium_cyclosilicate' && onHd
            ? [
                'kdigo.ckd.2024.pp_3_6_3_hyperkalemia_k_binders',
                'fda.szc.hemodialysis_dosing',
                'fda.szc.hemodialysis_maintenance_sodium',
                'fda.szc.edema_sodium_400mg',
              ]
            : binderDrugId === 'sodium_zirconium_cyclosilicate'
              ? [
                  'kdigo.ckd.2024.pp_3_6_3_hyperkalemia_k_binders',
                  'fda.szc.starting_dose',
                  'fda.szc.edema_sodium_400mg',
                  'ukka.2022.appendix_3f_cps_contra_bowel',
                ]
              : ['kdigo.ckd.2024.pp_3_6_3_hyperkalemia_k_binders', 'fda.patiromer.starting_dose'];

      const titleText =
        k > kHold
          ? `Khởi trị chất gắn Kali (${binderName}) để hạ Kali máu và tái lập RASi/MRA sau khi ổn định`
          : `Sử dụng chất gắn Kali (${binderName}) để duy trì liệu pháp RASi/MRA`;

      let safetyDetailNote =
        binderDrugId === 'calcium_polystyrene_sulfonate'
          ? ' Lưu ý uống cách các thuốc đường uống khác ít nhất 3 giờ (6 giờ nếu liệt dạ dày) và tránh dùng nếu có táo bón nặng/tắc ruột.'
          : binderDrugId === 'patiromer'
            ? ' Lưu ý uống Patiromer cách các thuốc đường uống khác ít nhất 3 giờ.'
            : ` Lưu ý mỗi liều ${hdStartG} g Lokelma chứa khoảng ${naMg} mg Natri nên cần theo dõi dấu hiệu phù và quá tải dịch.`;

      if (cpsContra && isVN) {
        safetyDetailNote +=
          ` Chống chỉ định dùng nhựa trao đổi ion ${cpsName} do bệnh nhân có tắc ruột / liệt ruột hoặc tăng canxi máu (UKKA 2022 Appendix 3F) — chuyển sang chất gắn kali không chứa canxi (${binderName}).`;
      }
      if (onHd && binderDrugId === 'sodium_zirconium_cyclosilicate') {
        safetyDetailNote +=
          ` LƯU Ý LỌC MÁU CHU KỲ (FDA Lokelma Mục 2.2): CHỈ uống Lokelma vào NGÀY KHÔNG LỌC MÁU (khởi đầu ${hdStartG} g/ngày vào ngày không lọc máu, không dùng phác đồ nạp hàng ngày) để tránh hạ kali máu sau lọc.`;
      }

      return {
        id: 'rec_ckd_k_binder_start',
        module: 'ckd',
        tier: 'Kiểm soát biến chứng & Toan kiềm',
        tierOrder: 2,
        action: 'START',
        drugId: binderDrugId,
        drugNameVi: binderName,
        dose: binderDose,
        title: titleText,
        rationale: `Kali máu ${k} mmol/L (> ${kMin} mmol/L). Theo KDIGO 2024 (Practice Point 3.6.3) và Hướng dẫn BYT 2024: Sử dụng thuốc gắn kali đường tiêu hóa (${binderName}) kết hợp chế độ ăn hạn chế kali nhằm kiểm soát kali máu và duy trì/tái lập phác đồ bảo vệ thận RASi/MRA tối ưu.${safetyDetailNote}`,
        gates: [
          {
            parameter: 'K+',
            passed: true,
            value: k,
            threshold: kMin,
            messageVi: `K+ ${k} mmol/L > ${kMin}: Chỉ định thuốc gắn kali kiểm soát tăng kali mạn tính`,
          },
        ],
        citationIds: displayCitations,
        profileDiff: {
          INTL: onHd
            ? `FDA Lokelma Mục 2.2: Trên lọc máu chu kỳ, dùng ${szcName} ${hdStartG} g x 1 lần/ngày CHỈ vào ngày không lọc máu (hoặc ${patiromerName})`
            : `KDIGO 2024: Ưu tiên thuốc gắn kali thế hệ mới không hấp thu (${patiromerName} hoặc ${szcName}) để giữ liều tối đa RASi/nsMRA`,
          VN: cpsContra
            ? `Chống chỉ định ${cpsName} (tắc/liệt ruột hoặc tăng canxi máu): Chuyển dùng ${szcName} hoặc ${patiromerName}`
            : `BYT 2024: Sử dụng nhựa trao đổi ion sẵn có (${cpsName}) hoặc ${szcName} (nếu đang lọc máu chu kỳ chỉ uống ${hdStartG} g vào ngày không lọc máu)`,
          US: onHd
            ? `FDA Lokelma Section 2.2: Dùng ${szcName} ${hdStartG} g x 1 lần/ngày vào ngày không lọc máu (tối đa ${hdMaxG} g)`
            : `FDA / KDIGO 2024: Ưu tiên ${patiromerName} hoặc ${szcName} cho tăng kali máu mạn tính`,
        },
        priority: 78,
      };
    },
    citationIds: [
      'kdigo.ckd.2024.pp_3_6_3_hyperkalemia_k_binders',
      'byt.ckd.2024.potassium_resine_dose',
      'fda.patiromer.starting_dose',
      'fda.szc.hemodialysis_dosing',
    ],
  },

  // 2. Ngừng / Tạm ngừng Chất gắn Kali khi hạ kali máu hoặc K+ dưới ngưỡng an toàn
  ...KBINDER_DRUG_IDS.map(
    (targetBinderId): Rule => ({
      id: `ckd.safety.kbinder_low_k_${targetBinderId}`,
      module: 'ckd',
      nameVi: `Ngừng hoặc tạm ngừng ${targetBinderId} khi kali máu hạ thấp`,
      setting: 'both',
      profiles: ['INTL', 'VN', 'US'],
      when: (ctx) => {
        const k = need(ctx, 'k');
        if (k === undefined) return false;
        const hasThisBinder = ctx.patient.currentMeds.some(
          (m) =>
            isKBinderMed(m) &&
            (normalizeDrugId(m.drugId) === targetBinderId ||
              getMedComponents(m).includes(targetBinderId))
        );
        if (!hasThisBinder) return false;
        if (targetBinderId === 'calcium_polystyrene_sulfonate') {
          if (hasCpsContraindication(ctx)) return false;
          return k < thFor('k', 'ckd.kbinder.cps_k_contra');
        }
        return k < thFor('k', 'ckd.kbinder.k_low_hold');
      },
      produce: (ctx) => {
        const k = need(ctx, 'k')!;
        const med = ctx.patient.currentMeds.find(
          (m) =>
            isKBinderMed(m) &&
            (normalizeDrugId(m.drugId) === targetBinderId ||
              getMedComponents(m).includes(targetBinderId))
        )!;
        const binderName = medDisplayName(med);
        const stopHypoK = thFor('k', 'ckd.kbinder.k_hypokalemia_stop');
        const holdLowK = thFor('k', 'ckd.kbinder.k_low_hold');
        const cpsContraK = thFor('k', 'ckd.kbinder.cps_k_contra');

        if (k < stopHypoK) {
          return {
            id: `rec_ckd_stop_kbinder_hypok_${targetBinderId}`,
            module: 'ckd',
            tier: 'Cảnh báo an toàn điện giải',
            tierOrder: 0,
            action: 'STOP',
            drugId: targetBinderId,
            drugNameVi: binderName,
            dose: undefined,
            title: `NGỪNG NGAY ${binderName} do hạ kali máu (K⁺ = ${k} < ${stopHypoK} mmol/L)`,
            rationale:
              `Nồng độ kali huyết thanh hiện tại ${k} mmol/L (< ${stopHypoK} mmol/L — hạ kali máu rõ trên lâm sàng). Theo nhãn FDA/SmPC: Bắt buộc ngừng ngay chất gắn kali đường tiêu hóa (${binderName}), theo dõi điện tâm đồ và đánh giá bù kali thích hợp để phòng ngừa loạn nhịp thất.`,
            gates: [
              {
                parameter: 'K+',
                passed: false,
                value: k,
                threshold: stopHypoK,
                messageVi: `K+ ${k} mmol/L < ${stopHypoK}: Hạ kali máu — bắt buộc ngừng ${binderName}`,
              },
            ],
            citationIds: [
              'fda.patiromer.hypokalemia_3_5',
              'fda.szc.hypokalemia_discontinue',
              'ukka.2022.guideline_8_1_cps_target_5',
            ],
            priority: 103,
          };
        }

        if (targetBinderId === 'calcium_polystyrene_sulfonate' && k >= holdLowK) {
          return {
            id: 'rec_ckd_hold_cps_k_below_5',
            module: 'ckd',
            tier: 'Cảnh báo an toàn điện giải',
            tierOrder: 0,
            action: 'STOP',
            drugId: targetBinderId,
            drugNameVi: binderName,
            dose: undefined,
            title: `NGỪNG / TẠM NGỪNG ${binderName} khi Kali máu đã giảm dưới ${cpsContraK} mmol/L (K⁺ = ${k} mmol/L)`,
            rationale:
              `Theo SmPC Calcium Resonium (Mục 4.3 Chống chỉ định) và UKKA 2022 Guideline 8.1: Nhựa trao đổi ion Calcium Polystyrene Sulfonate chỉ dùng ngắn hạn nhằm đưa K⁺ về <= ${cpsContraK} mmol/L và chống chỉ định tiếp tục sử dụng khi K⁺ < ${cpsContraK} mmol/L do nguy cơ hạ kali máu, tăng canxi máu và táo bón/hoại tử đại tràng.`,
            gates: [
              {
                parameter: 'K+',
                passed: false,
                value: k,
                threshold: cpsContraK,
                messageVi: `K+ ${k} mmol/L < ${cpsContraK}: Chống chỉ định tiếp tục dùng nhựa trao đổi ion CPS`,
              },
            ],
            citationIds: [
              'ukka.2022.guideline_8_1_cps_target_5',
              'ukka.2022.appendix_3f_cps_contra_bowel',
            ],
            priority: 99,
          };
        }

        return {
          id: `rec_ckd_hold_kbinder_lowk_${targetBinderId}`,
          module: 'ckd',
          tier: 'Cảnh báo an toàn điện giải',
          tierOrder: 0,
          action: 'HOLD',
          drugId: targetBinderId,
          drugNameVi: binderName,
          dose: undefined,
          title: `TẠM NGỪNG / GIẢM LIỀU ${binderName} do Kali máu giảm dưới khoảng mục tiêu (K⁺ = ${k} < ${holdLowK} mmol/L)`,
          rationale:
            `Theo nhãn FDA Lokelma/Veltassa: Khi nồng độ kali huyết thanh giảm xuống dưới khoảng mục tiêu (${k} < ${holdLowK} mmol/L), cần tạm ngừng hoặc giảm liều ${binderName} và kiểm tra lại điện giải để tránh tiến triển sang hạ kali máu thực sự (< ${stopHypoK} mmol/L).`,
          gates: [
            {
              parameter: 'K+',
              passed: false,
              value: k,
              threshold: holdLowK,
              messageVi: `K+ ${k} mmol/L < ${holdLowK}: Dưới ngưỡng mục tiêu, tạm ngừng/giảm liều ${binderName}`,
            },
          ],
          citationIds: ['fda.szc.target_range_4_0', 'fda.szc.hypokalemia_discontinue'],
          priority: 96,
        };
      },
      citationIds: [
        'fda.patiromer.hypokalemia_3_5',
        'fda.szc.hypokalemia_discontinue',
        'ukka.2022.guideline_8_1_cps_target_5',
      ],
    })
  ),
];
