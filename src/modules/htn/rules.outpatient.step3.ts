/**
 * GDMT-VN Module Tăng huyết áp (htn) - Ngoại trú Bước 3A: THA Kháng trị — Spironolactone
 * Phân quyền: Agent H (Tim mạch / THA)
 */

import type { Rule, Recommendation, RuleContext } from '../../engine/types';
import { need, hasCondition, missingInputRec } from '../../engine/require';
import { th, thFor, drug } from '../../kb-types';
import {
  MRA_IDS,
  findCurrentMed,
  getEffectiveActiveMedIds,
  getMedIds,
  getUncontrolledBpCutoffs,
  isOutpatientCrisisOrUnstable,
  needsLenientTarget,
  parseMedDoseMg
} from './helpers';
import { countCoreClasses, shouldDeferToHfrEfPillars } from './rules.outpatient.step_helpers';

export const htnOutpatientStep3Rules: Rule[] = [
  {
    id: 'htn.outpatient.step3_resistant_spironolactone',
    module: 'htn',
    nameVi: 'Bước 3 (Tăng huyết áp kháng trị): Phối hợp Spironolactone qua cổng an toàn K+ và eGFR theo Profile',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => {
      if (hasCondition(ctx, 'pregnant') || isOutpatientCrisisOrUnstable(ctx)) return false;
      const effectiveMeds = getEffectiveActiveMedIds(ctx);
      const rawMedIds = getMedIds(ctx);
      if (shouldDeferToHfrEfPillars(ctx, effectiveMeds)) return false;
      const effCore = countCoreClasses(effectiveMeds).count;
      const rawCore = countCoreClasses(rawMedIds).count;
      const egfr = need(ctx, 'egfr');
      const egfrLoop = thFor('egfr', 'htn.diuretic.egfr_loop_switch');
      // Kích hoạt khi đủ 3 nhóm nền hiệu lực, HOẶC khi đang trên 3 thuốc nền nhưng lợi tiểu Thiazide vừa bị chặn do eGFR < 30 (để vẫn phát cảnh báo AVOID Spironolactone tường minh)
      return effCore >= 3 || (rawCore >= 3 && egfr !== undefined && egfr < egfrLoop);
    },
    produce: (ctx: RuleContext): Recommendation | null => {
      const sbp = need(ctx, 'sbp');
      const dbp = need(ctx, 'dbp');
      if (sbp === undefined) {
        return missingInputRec('htn', 'sbp', 'đánh giá tăng huyết áp kháng trị Bước 3', ['esc.htn.2024.spiro_resistant']);
      }
      if (dbp === undefined) {
        return missingInputRec('htn', 'dbp', 'đánh giá tăng huyết áp kháng trị Bước 3', ['esc.htn.2024.spiro_resistant']);
      }

      const cutoffs = getUncontrolledBpCutoffs(ctx);
      if (sbp < cutoffs.sbp && dbp < cutoffs.dbp) return null;

      // Fail-closed K+ và eGFR TRƯỚC TIÊN (bảo đảm QA-1 cho mọi ca 3 thuốc thiếu K+/SCr)
      const k = need(ctx, 'k');
      if (k === undefined) {
        return missingInputRec(
          'htn',
          'k',
          'kiểm tra cổng an toàn Kali máu (K⁺ ≤ 4,5 mmol/L) trước khi khởi trị Spironolactone cho THA kháng trị',
          ['esc.htn.2024.spiro_gates_egfr30_k45', 'aha.acc.2025.table13_spiro_egfr45']
        );
      }

      const egfr = need(ctx, 'egfr');
      if (egfr === undefined) {
        return missingInputRec(
          'htn',
          'scr',
          'tính eGFR kiểm tra cổng an toàn thận (≥ 30 theo ESC/VSH hoặc ≥ 45 theo AHA/ACC) trước khi khởi trị Spironolactone',
          ['esc.htn.2024.spiro_gates_egfr30_k45', 'aha.acc.2025.table13_spiro_egfr45']
        );
      }

      const effectiveMeds = getEffectiveActiveMedIds(ctx);
      const effCore = countCoreClasses(effectiveMeds).count;

      // Kiểm tra giả kháng trị do liều quá thấp (R3-HTN-15): cả Amlodipine <= 2.5 mg VÀ Perindopril <= 2.5 mg trên bệnh nhân không suy yếu
      if (effCore >= 3 && !needsLenientTarget(ctx)) {
        const activeAmlo = findCurrentMed(ctx, ['amlodipine']);
        const activePerin = findCurrentMed(ctx, ['perindopril']);
        const amloDose = parseMedDoseMg(activeAmlo);
        const perinDose = parseMedDoseMg(activePerin);
        const amloLow = th('htn.amlodipine.dose_low');
        const amloMax = th('htn.amlodipine.dose_max');
        if (amloDose !== undefined && amloDose <= amloLow && perinDose !== undefined && perinDose <= amloLow) {
          return {
            id: 'rec_htn_step3_uptitrate_before_resistant',
            module: 'htn',
            tier: 'Bước 3: Tối ưu Liều Dung nạp Tối đa Trước khi Gắn Nhãn Kháng trị',
            tierOrder: 3,
            action: 'UPTITRATE',
            drugId: 'amlodipine',
            drugNameVi: drug('amlodipine').nameVi,
            dose: `Tối ưu liều 3 thuốc nền lên liều chuẩn/tối đa dung nạp (vd: Amlodipine 5–${amloMax} mg, Perindopril 5–${th('htn.perindopril.dose_max_htn')} mg) và kiểm tra tuân thủ + ABPM/HBPM`,
            title: 'Chưa tối ưu liều 3 thuốc nền: Tăng lên liều tối đa dung nạp & Loại trừ giả kháng trị trước khi thêm Spironolactone',
            rationale:
              'Theo định nghĩa ESC 2024, AHA/ACC 2025 và VSH 2022, tăng huyết áp kháng trị thực sự chỉ xác lập khi huyết áp vẫn trên đích dù đã dùng đủ 3 nhóm (RASi + CCB + Lợi tiểu) ở LIỀU TỐI ĐA DUNG NẠP và đã loại trừ không tuân thủ thuốc / hiệu ứng áo choàng trắng qua HBPM/ABPM.',
            gates: [],
            citationIds: ['esc.htn.2024.resistant_definition', 'esc.htn.2024.spiro_resistant'],
            priority: 77
          };
        }
      }

      const profile = ctx.settings.profile;
      const kMaxSpiro = thFor('k', 'htn.spiro.k_max_initiate');
      const egfrUsMin = thFor('egfr', 'htn.spiro.egfr_min_initiate');
      const egfrEscMin = thFor('egfr', 'htn.spiro.egfr_contra_esc');
      const egfrMinRequired = profile === 'US' ? egfrUsMin : egfrEscMin;

      const spiroName = drug('spironolactone').nameVi;
      const rawMedIds = getMedIds(ctx);
      const alreadyOnMra = rawMedIds.some((id) => MRA_IDS.includes(id));
      if (alreadyOnMra) return null;

      const kPassed = k <= kMaxSpiro;
      const egfrPassed = egfr >= egfrMinRequired;

      if (!kPassed || !egfrPassed) {
        return {
          id: 'rec_htn_step3_avoid_spironolactone',
          module: 'htn',
          tier: 'Bước 3: Cổng An toàn Chặn Spironolactone',
          tierOrder: 2,
          action: 'AVOID',
          drugId: 'spironolactone',
          drugNameVi: spiroName,
          title: `KHÔNG khởi trị ${spiroName}: Không đạt cổng an toàn (${!kPassed ? `K⁺ = ${k} > ${kMaxSpiro} mmol/L` : `eGFR = ${egfr.toFixed(1)} < ${egfrMinRequired} mL/phút/1,73 m²`})`,
          rationale: `Mặc dù huyết áp chưa đạt đích (${sbp}/${dbp} mmHg) trên phác đồ đa thuốc, ${spiroName} bị chặn do ${!kPassed ? `Kali máu ${k} mmol/L vượt ngưỡng an toàn khởi trị (≤ ${kMaxSpiro} mmol/L)` : `eGFR ${egfr.toFixed(1)} mL/phút/1,73 m² thấp hơn ngưỡng an toàn của Profile ${profile} (≥ ${egfrMinRequired} mL/phút/1,73 m²)`}, làm tăng nguy cơ tăng Kali máu đe dọa tính mạng trên nền RASi.`,
          gates: [
            {
              parameter: 'Kali máu (K⁺)',
              passed: kPassed,
              value: k,
              threshold: kMaxSpiro,
              messageVi: kPassed ? `K⁺ ${k} ≤ ${kMaxSpiro} mmol/L (Đạt)` : `K⁺ ${k} > ${kMaxSpiro} mmol/L (Không đạt)`
            },
            {
              parameter: `eGFR (${profile})`,
              passed: egfrPassed,
              value: Number(egfr.toFixed(1)),
              threshold: egfrMinRequired,
              messageVi: egfrPassed
                ? `eGFR ${egfr.toFixed(1)} ≥ ${egfrMinRequired} (Đạt)`
                : `eGFR ${egfr.toFixed(1)} < ${egfrMinRequired} (Không đạt)`
            }
          ],
          citationIds: [
            'esc.htn.2024.spiro_gates_egfr30_k45',
            'aha.acc.2025.table13_spiro_egfr45',
            'vsh.htn.2022.resistant_k5'
          ],
          profileDiff: {
            INTL: `ESC 2024 (Class IIa): Cho phép cân nhắc Spironolactone liều thấp khi eGFR ≥ ${egfrEscMin} mL/phút/1,73 m² và K⁺ ≤ ${kMaxSpiro} mmol/L`,
            US: `AHA/ACC 2025 (COR 1, Table 13): Yêu cầu eGFR ≥ ${egfrUsMin} mL/phút/1,73 m² để tránh tăng Kali máu nặng`,
            VN: `VSH/VNHA 2022 (Class I): Cho phép cân nhắc khi eGFR ≥ ${egfrEscMin} mL/phút/1,73 m² và K⁺ ≤ ${kMaxSpiro} mmol/L`
          },
          priority: 82
        };
      }

      if (effCore < 3) return null;

      const lowDoseCkd = th('htn.spiro.dose_low_ckd');
      const stdDose = th('htn.spiro.dose_start');
      const recommendedDose = egfr < egfrUsMin ? lowDoseCkd : stdDose;
      const eplLow = th('htn.eplerenone.dose_low_htn');
      const eplUsual = th('htn.eplerenone.dose_usual_htn');

      return {
        id: 'rec_htn_step3_add_spironolactone',
        module: 'htn',
        tier: 'Bước 3: Tăng huyết áp Kháng trị (Thuốc Hàng thứ 4)',
        tierOrder: 3,
        action: 'START',
        drugId: 'spironolactone',
        drugNameVi: spiroName,
        dose: `${recommendedDose} mg uống 1 lần/ngày${egfr < egfrUsMin ? ` (liều thấp thận trọng do eGFR ${egfr.toFixed(1)} trong khoảng ${egfrEscMin}–<${egfrUsMin})` : ''} — kiểm tra lại K⁺ và Creatinin sau ${th('htn.monitoring.recheck_weeks_min')}–${th('htn.monitoring.recheck_weeks_max')} tuần`,
        title: `THA kháng trị (Bước 3): Bổ sung ${spiroName} ${recommendedDose} mg/ngày (thuốc hàng thứ 4 ưu tiên số 1)`,
        rationale: `Huyết áp ${sbp}/${dbp} mmHg chưa kiểm soát trên 3 nhóm nền (RASi + CCB + Lợi tiểu). Cả K⁺ (${k} ≤ ${kMaxSpiro} mmol/L) và eGFR (${egfr.toFixed(1)} ≥ ${egfrMinRequired} mL/phút/1,73 m²) đều đạt chuẩn an toàn. Theo thử nghiệm PATHWAY-2, ${spiroName} là thuốc thứ 4 hiệu quả nhất; nếu không dung nạp do vú to nam giới / căng đau ngực, chuyển sang Eplerenone ${eplLow}–${eplUsual} mg x 1–2 lần/ngày.`,
        gates: [
          {
            parameter: 'Kali máu (K⁺)',
            passed: true,
            value: k,
            threshold: kMaxSpiro,
            messageVi: `K⁺ ${k} ≤ ${kMaxSpiro} mmol/L (Đạt)`
          },
          {
            parameter: `eGFR (${profile})`,
            passed: true,
            value: Number(egfr.toFixed(1)),
            threshold: egfrMinRequired,
            messageVi: `eGFR ${egfr.toFixed(1)} ≥ ${egfrMinRequired} mL/phút/1,73 m² (Đạt)`
          }
        ],
        citationIds: [
          'esc.htn.2024.spiro_resistant',
          'esc.htn.2024.spiro_gates_egfr30_k45',
          'aha.acc.2025.table13_spiro_egfr45',
          'vsh.htn.2022.drugs_table_mra_bb'
        ],
        profileDiff: {
          INTL: `ESC 2024: Khuyến cáo mức Class IIa (mức bằng chứng B), ngưỡng chống chỉ định eGFR < ${egfrEscMin}`,
          US: `AHA/ACC 2025: Khuyến cáo mức COR 1, yêu cầu chặt hơn eGFR ≥ ${egfrUsMin} mL/phút/1,73 m²`,
          VN: `VSH/VNHA 2022: Khuyến cáo mức Class I (mức bằng chứng A), ngưỡng eGFR ≥ ${egfrEscMin}`
        },
        priority: 79
      };
    },
    citationIds: ['esc.htn.2024.spiro_resistant', 'esc.htn.2024.spiro_gates_egfr30_k45', 'aha.acc.2025.table13_spiro_egfr45']
  },

  // -------------------------------------------------------------------------
  // 3B. BƯỚC 3 PHƯƠNG ÁN THAY THẾ KHI CHỐNG CHỈ ĐỊNH SPIRONOLACTONE (BISOPROLOL / DOXAZOSIN)
  // -------------------------------------------------------------------------
];
