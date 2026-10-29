/**
 * GDMT-VN Module Tăng huyết áp (htn) - Ngoại trú: Khởi trị Thuốc Hạ áp An toàn Thai kỳ & Dự phòng Aspirin
 * Phân quyền: Agent H (Tim mạch / THA)
 */

import type { Rule, Recommendation, RuleContext } from '../../engine/types';
import { need, hasCondition, missingInputRec } from '../../engine/require';
import {
  th,
  thFor,
  drug,
  dose
} from '../../kb-types';
import {
  PREGNANCY_SAFE_ORAL_IDS,
  getMedIds,
  hasAvBlockOrSssWithoutPacer,
  isHfrEf,
  isPostpartum,
  isPregnantSevereCrisis
} from './helpers';
import { hasMethyldopaMoodOrHepaticContra } from './rules.outpatient.special.bb_ddi';

export const htnOutpatientSpecialPregnancyInitRules: Rule[] = [
  {
    id: 'htn.outpatient.pregnancy_safe_initiation',
    module: 'htn',
    nameVi: 'Khởi trị tăng huyết áp trong thai kỳ: Methyldopa / Labetalol / Nifedipine phóng thích kéo dài theo ngưỡng Profile',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => {
      if (!hasCondition(ctx, 'pregnant')) return false;
      if (hasCondition(ctx, 'severePreeclampsiaEclampsia') || isPregnantSevereCrisis(ctx)) return false;
      const medIds = getMedIds(ctx);
      const avoidMeth = hasMethyldopaMoodOrHepaticContra(ctx) || isPostpartum(ctx);
      const hasValidPregMed = medIds.some(
        (id) => PREGNANCY_SAFE_ORAL_IDS.includes(id) && !(id === 'methyldopa' && avoidMeth)
      );
      return !hasValidPregMed;
    },
    produce: (ctx: RuleContext): Recommendation | null => {
      const sbp = need(ctx, 'sbp');
      const dbp = need(ctx, 'dbp');
      if (sbp === undefined) {
        return missingInputRec('htn', 'sbp', 'xác định ngưỡng khởi trị tăng huyết áp thai kỳ', [
          'esc.htn.2024.pregnancy_targets_rec22'
        ]);
      }
      if (dbp === undefined) {
        return missingInputRec('htn', 'dbp', 'xác định ngưỡng khởi trị tăng huyết áp thai kỳ', [
          'esc.htn.2024.pregnancy_targets_rec22'
        ]);
      }

      const sbpHypo = thFor('sbp', 'htn.safety.sbp_hypotension');
      if (sbp < sbpHypo) return null;

      const profile = ctx.settings.profile;
      const sbpTrig = thFor('sbp', 'htn.pregnancy.sbp_target');
      const dbpTrig =
        profile === 'VN'
          ? thFor('dbp', 'htn.pregnancy.dbp_target_vn')
          : thFor('dbp', 'htn.pregnancy.dbp_target');

      if (sbp < sbpTrig && dbp < dbpTrig) return null;

      const avoidMeth = hasMethyldopaMoodOrHepaticContra(ctx) || isPostpartum(ctx);
      if (avoidMeth) {
        const hr = need(ctx, 'hr');
        const hrMin = thFor('hr', 'htn.bb.hr_min_initiate');
        const sbpBbMin = thFor('sbp', 'htn.safety.sbp_bb_min');
        const canUseLabetalol =
          hr !== undefined &&
          hr >= hrMin &&
          sbp >= sbpBbMin &&
          !hasCondition(ctx, 'asthma') &&
          !hasCondition(ctx, 'hf') &&
          !isHfrEf(ctx) &&
          !hasAvBlockOrSssWithoutPacer(ctx);

        if (canUseLabetalol) {
          const labName = drug('labetalol').nameVi;
          const labStart = dose('labetalol', 'start');
          const labDoseShort =
            typeof labStart === 'object' && labStart !== null
              ? `${labStart.amount} ${labStart.unit} x ${labStart.frequency}`
              : typeof labStart === 'string'
                ? labStart
                : '';
          const labDoseFull =
            typeof labStart === 'object' && labStart !== null
              ? `${labStart.amount} ${labStart.unit} ${labStart.route} ${labStart.frequency}`
              : labDoseShort;
          return {
            id: 'rec_htn_pregnancy_start_labetalol',
            module: 'htn',
            tier: 'Bước 1 Thai kỳ (Thay thế Methyldopa)',
            tierOrder: 2,
            action: 'START',
            drugId: 'labetalol',
            drugNameVi: labName,
            dose: `${labDoseFull} (chỉnh liều theo đáp ứng huyết áp và nhịp tim)`,
            title: `Khởi trị THA thai kỳ (tránh Methyldopa): ${labName} đường uống ${labDoseShort}`,
            rationale: `Huyết áp thai kỳ ${sbp}/${dbp} mmHg vượt ngưỡng điều trị (≥ ${sbpTrig}/${dbpTrig} mmHg) trên thai phụ có chống chỉ định dùng Methyldopa (trầm cảm / bệnh gan / hậu sản). Theo ESC 2024 (Class I) và AHA/ACC 2025 (COR 1), Labetalol đường uống là lựa chọn đầu tay ưu tiên hàng đầu.`,
            gates: [
              {
                parameter: 'Tần số tim (HR)',
                passed: true,
                value: hr,
                threshold: hrMin,
                messageVi: `HR ${hr} ≥ ${hrMin} bpm: An toàn khởi trị ${labName}`
              }
            ],
            citationIds: [
              'esc.htn.2024.pregnancy_first_line',
              'aha.acc.2025.pregnancy_recs',
              'aha.acc.2025.pregnancy_table22_full'
            ],
            priority: 88
          };
        }

        const nifName = drug('nifedipine').nameVi;
        const nifStart = th('htn.nifedipine.dose_start');
        const nifMax = th('htn.nifedipine.dose_max');
        return {
          id: 'rec_htn_pregnancy_start_nifedipine',
          module: 'htn',
          tier: 'Bước 1 Thai kỳ (Dạng Phóng thích Kéo dài)',
          tierOrder: 2,
          action: 'START',
          drugId: 'nifedipine',
          drugNameVi: nifName,
          dose: `${nifStart} mg viên phóng thích kéo dài (LA/Adalat LA) uống 1 lần/ngày (tối đa ${nifMax} mg/ngày; TUYỆT ĐỐI cấm cắn vỡ hoặc ngậm dưới lưỡi)`,
          title: `Khởi trị THA thai kỳ (tránh Methyldopa & Chẹn beta): ${nifName} phóng thích kéo dài ${nifStart} mg/ngày`,
          rationale: `Huyết áp thai kỳ ${sbp}/${dbp} mmHg cần khởi trị thuốc nhưng cần tránh Methyldopa (trầm cảm/bệnh gan) và không đủ điều kiện/chưa rõ HR để dùng Labetalol. Theo ESC 2024 (Class I), AHA/ACC 2025 (COR 1) và VSH 2022, ${nifName} dạng phóng thích kéo dài đường uống là lựa chọn đầu tay an toàn và hiệu quả.`,
          gates: [],
          citationIds: [
            'esc.htn.2024.pregnancy_first_line',
            'aha.acc.2025.pregnancy_recs',
            'aha.acc.2025.nifedipine_no_sublingual'
          ],
          priority: 88
        };
      }

      const methName = drug('methyldopa').nameVi;
      const methStart = th('htn.methyldopa.dose_start');
      const methMaxG = th('htn.methyldopa.dose_max_preg_g');
      const dbpMinEsc = thFor('dbp', 'htn.pregnancy.dbp_min_esc');
      const labStart = dose('labetalol', 'start');
      const labDoseShort =
        typeof labStart === 'object' && labStart !== null
          ? `${labStart.amount} ${labStart.unit} x ${labStart.frequency}`
          : typeof labStart === 'string'
            ? labStart
            : '';

      return {
        id: 'rec_htn_pregnancy_start_methyldopa',
        module: 'htn',
        tier: 'Điều trị Tăng huyết áp An toàn trong Thai kỳ',
        tierOrder: 2,
        action: 'START',
        drugId: 'methyldopa',
        drugNameVi: methName,
        dose: `${methStart} mg uống 2–3 lần/ngày (tối đa ${methMaxG} g/ngày); hoặc ưu tiên Labetalol uống ${labDoseShort} / Nifedipine phóng thích kéo dài ${th('htn.nifedipine.dose_start')} mg/ngày nếu sẵn có`,
        title: `Khởi trị an toàn trong thai kỳ: ${methName} ${methStart} mg x 2–3 lần/ngày (cùng nhóm đầu tay với Labetalol & Nifedipine LA)`,
        rationale: `Huyết áp thai kỳ ${sbp}/${dbp} mmHg đạt ngưỡng điều trị (≥ ${sbpTrig}/${dbpTrig} mmHg). Theo ESC 2024, AHA/ACC 2025 và VSH/VNHA 2022 (Bảng 16), ba thuốc uống an toàn trong thai kỳ gồm Labetalol, Nifedipine phóng thích kéo dài và ${methName} (trong đó ${methName} sẵn có rộng rãi nhất tại tuyến cơ sở Việt Nam; đích kiểm soát < ${sbpTrig}/${dbpTrig} mmHg nhưng tránh hạ DBP quá thấp < ${dbpMinEsc} mmHg để bảo tồn tưới máu nhau thai).`,
        gates: [
          {
            parameter: 'Ngưỡng khởi trị THA thai kỳ',
            passed: true,
            value: sbp,
            threshold: sbpTrig,
            messageVi: `HA ${sbp}/${dbp} ≥ ${sbpTrig}/${dbpTrig} mmHg: Khởi trị thuốc an toàn thai kỳ`
          }
        ],
        citationIds: [
          'esc.htn.2024.pregnancy_first_line',
          'esc.htn.2024.pregnancy_targets_rec22',
          'aha.acc.2025.pregnancy_recs',
          'aha.acc.2025.pregnancy_table22_full',
          'vsh.htn.2022.pregnancy_table16_targets'
        ],
        profileDiff: {
          INTL: `ESC 2024: Labetalol & Nifedipine LA ưu tiên hàng 1 (Class I), Methyldopa (Class IIa); đích < ${sbpTrig}/${thFor('dbp', 'htn.pregnancy.dbp_target')} mmHg (giữ DBP ≥ ${dbpMinEsc} mmHg)`,
          US: `AHA/ACC 2025: Labetalol & Nifedipine LA ưu tiên hàng 1 (COR 1), Methyldopa lựa chọn thay thế; đích < ${sbpTrig}/${thFor('dbp', 'htn.pregnancy.dbp_target')} mmHg`,
          VN: `VSH/VNHA 2022 (Bảng 16): Methyldopa, Labetalol và Nifedipine LA đầu tay; đích < ${sbpTrig}/${thFor('dbp', 'htn.pregnancy.dbp_target_vn')} mmHg (tránh < ${thFor('sbp', 'htn.pregnancy.sbp_min_vn')}/${dbpMinEsc} mmHg)`
        },
        priority: 87
      };
    },
    citationIds: ['esc.htn.2024.pregnancy_first_line', 'aha.acc.2025.pregnancy_recs', 'vsh.htn.2022.pregnancy_table16_targets']
  },

  {
    id: 'htn.outpatient.pregnancy_aspirin_prophylaxis',
    module: 'htn',
    nameVi: 'Dự phòng tiền sản giật trên thai phụ tăng huyết áp mạn / nguy cơ cao: Aspirin liều thấp buổi tối từ tuần 12',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) =>
      hasCondition(ctx, 'pregnant') &&
      !hasCondition(ctx, 'severePreeclampsiaEclampsia') &&
      !isPregnantSevereCrisis(ctx),
    produce: (ctx: RuleContext): Recommendation => {
      const profile = ctx.settings.profile;
      const aspUs = th('htn.pregnancy.aspirin_dose_us');
      const aspIntlMin = th('htn.pregnancy.aspirin_dose_min_intl');
      const aspIntlMax = th('htn.pregnancy.aspirin_dose_max_intl');
      const aspVnMin = th('htn.pregnancy.aspirin_dose_min_vn');
      const aspVnMax = th('htn.pregnancy.aspirin_dose_max_vn');
      const doseText =
        profile === 'US'
          ? `${aspUs} mg/ngày`
          : profile === 'VN'
            ? `${aspVnMin}–${aspVnMax} mg/ngày`
            : `${aspIntlMin}–${aspIntlMax} mg/ngày`;

      return {
        id: 'rec_htn_pregnancy_aspirin_prophylaxis',
        module: 'htn',
        tier: 'Dự phòng Tiền sản giật Chu sinh',
        tierOrder: 3,
        action: 'CONSIDER',
        title: `Dự phòng tiền sản giật: Cân nhắc Aspirin liều thấp (${doseText} uống buổi tối) từ tuần thai 12 đến tuần 36–37`,
        rationale: `Thai phụ có tăng huyết áp mạn tính hoặc nguy cơ tiền sản giật cao/trung bình được khuyến cáo mức Class I / COR 1 dùng Aspirin liều thấp (${doseText} uống trước khi đi ngủ) bắt đầu từ tuần thai 12–16 kéo dài tới tuần 36–37 (hoặc khi sinh theo AHA/ACC 2025) để giảm rõ rệt nguy cơ tiền sản giật non tháng.`,
        gates: [],
        citationIds: [
          'esc.htn.2024.pregnancy_aspirin_atenolol_methyldopa',
          'aha.acc.2025.pregnancy_recs',
          'vsh.htn.2022.pregnancy_table16_drugs_postpartum'
        ],
        profileDiff: {
          INTL: `ESC 2024: Aspirin ${aspIntlMin}–${aspIntlMax} mg/ngày buổi tối từ tuần 12 đến tuần 36–37 (Class I)`,
          US: `AHA/ACC 2025: Aspirin liều thấp ${aspUs} mg/ngày từ tuần 12 cho đến khi sinh (COR 1)`,
          VN: `VSH/VNHA 2022: Aspirin liều thấp ${aspVnMin}–${aspVnMax} mg/ngày từ tuần 12 đến tuần 36`
        },
        priority: 64
      };
    },
    citationIds: ['esc.htn.2024.pregnancy_aspirin_atenolol_methyldopa', 'aha.acc.2025.pregnancy_recs']
  },

  // -------------------------------------------------------------------------
  // 4. BỆNH THẬN MẠN / ALBUMIN NIỆU TRÊN ĐƠN MODULE HTN: GỢI Ý SGLT2i BẢO VỆ TIM-THẬN
  // -------------------------------------------------------------------------
];
