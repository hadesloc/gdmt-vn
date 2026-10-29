import type { Recommendation, Rule } from '../../engine/types';
import { drug, fmtDose, dose } from '../../kb-types';
import { resolveKbDrugId } from '../../engine/safety/drugClassify';
import { asthmaRule, hasSevereMilkProteinAllergy, hasStrongCyp3a4Inhibitor } from './helpers.dosing';
import { evaluateAcuteAsthma, evaluateGinaControl, isAdultOrAdolescent } from './helpers.clinical';
import { cypControllerBridge } from './helpers.cyp3a4';
import { generateAsthmaActionPlanVi } from './actionPlan';

const citations = ['gina.asthma.2026.cyp3a4_ics_laba_interaction', 'chiesi.fostair.cyp3a4_caution',
  'chiesi.fostair.fixed_maintenance', 'gina.asthma.2026.table_6_beclometasone_extrafine'];
const base = { module: 'asthma' as const, tier: 'Tương tác CYP3A4 & Tiếp nối ICS', tierOrder: 1, priority: 99, gates: [], citationIds: citations }; // qa-allow: index - safety bridge priority

export const asthmaCypControllerRules: Rule[] = [
  asthmaRule({
    id: 'asthma.cyp3a4.missing_assessment', setting: 'both', nameVi: 'Bổ sung đánh giá trước khi chọn ICS cầu nối CYP3A4', citationIds: citations,
    when: (ctx) => isAdultOrAdolescent(ctx) && hasStrongCyp3a4Inhibitor(ctx) &&
      !evaluateAcuteAsthma(ctx).hasAcuteAttack && evaluateGinaControl(ctx).level === 'missing',
    produce: (): Recommendation => ({ ...base, id: 'rec_asthma_cyp_missing_assessment', action: 'REFER',
      title: 'Cần bác sĩ đánh giá kiểm soát hen và đơn ICS trước khi chọn thuốc thay thế do CYP3A4',
      rationale: 'Thiếu dữ liệu GINA nên chưa thể chọn liều controller cầu nối. Bổ sung đánh giá triệu chứng, bậc/thiết bị và liều đang dùng; hội chẩn sớm nếu controller hiện tại phải tránh do tương tác. Không tự ngừng ICS hoặc chỉ dùng SABA.' })
  }),
  asthmaRule({
    id: 'asthma.cyp3a4.controller_bridge', setting: 'both', nameVi: 'Tiếp nối ICS ít phụ thuộc CYP3A4 theo tuổi', citationIds: citations,
    when: (ctx) => Boolean(cypControllerBridge(ctx)),
    produce: (ctx): Recommendation | null => {
      const choice = cypControllerBridge(ctx);
      if (!choice || choice.blocked) return null;
      return { ...base, id: 'rec_asthma_cyp_controller_bridge', action: choice.action,
        drugId: choice.drugId, switchFrom: choice.switchFrom, dose: choice.maintenance,
        citationIds: [...citations, ...drug(choice.drugId).citationIds],
        title: `Tiếp nối ${drug(choice.drugId).nameVi} dạng ${choice.deviceLabel} thay controller tương tác CYP3A4`,
        rationale: 'Cầu nối do bác sĩ xác nhận để không gián đoạn ICS khi phải dùng thuốc gây tương tác. Beclometasone ít phụ thuộc CYP3A4 nhưng vẫn có thể gây tác dụng toàn thân: theo dõi Cushing/suy thượng thận, đáp ứng hen và rà soát đổi thuốc gây tương tác. Không coi đây là hạ bậc điều trị.' };
    }
  }),
  asthmaRule({
    id: 'asthma.cyp3a4.rescue_bridge', setting: 'both', nameVi: 'SABA đi kèm cầu nối ICS duy trì cố định', citationIds: citations,
    when: (ctx) => Boolean(cypControllerBridge(ctx)),
    produce: (ctx): Recommendation | null => {
      const choice = cypControllerBridge(ctx);
      if (!choice || choice.blocked || !choice.rescueId) return null;
      return { ...base, id: 'rec_asthma_cyp_rescue_bridge', action: ctx.patient.currentMeds.some((m) => resolveKbDrugId(m.drugId) === choice.rescueId) ? 'CONTINUE' : 'START', drugId: choice.rescueId,
        dose: choice.rescueId === 'terbutaline' ? fmtDose(dose('terbutaline', 'start')) : 'Salbutamol pMDI qua buồng đệm khi cần, theo đơn cắt cơn đã được bác sĩ xác nhận (không dùng liều phác đồ cấp cứu thường quy)',
        title: `${drug(choice.rescueId).nameVi} khi cần, luôn đi cùng ICS duy trì trong cầu nối CYP3A4`,
        rationale: 'Phác đồ cầu nối dùng ICS duy trì cố định và SABA riêng; không để SABA đơn trị liệu. Nếu nhu cầu thuốc cắt cơn tăng hoặc khó thở nặng, đánh giá đợt cấp ngay.' };
    }
  }),
  asthmaRule({
    id: 'asthma.cyp3a4.bridge_review', setting: 'both', nameVi: 'Hội chẩn xác nhận cầu nối khi có tương tác CYP3A4', citationIds: citations,
    when: (ctx) => Boolean(cypControllerBridge(ctx)),
    produce: (ctx): Recommendation | null => {
      const choice = cypControllerBridge(ctx);
      if (!choice) return null;
      return { ...base, id: 'rec_asthma_cyp_bridge_review', action: 'REFER',
        title: choice.blocked ? 'Hội chẩn khẩn: Không còn ICS cầu nối phù hợp do dị ứng' : !choice.rescueId ? 'Hội chẩn khẩn: Chưa có thuốc cắt cơn phù hợp' : 'Hội chẩn xác nhận liều ICS và thuốc gây tương tác CYP3A4',
        rationale: 'Không tự ngừng thuốc kháng virus/kháng nấm hoặc tự đổi kháng sinh. Xác nhận dạng pMDI, liều ICS tương đương và thuốc cắt cơn trước khi dùng; đánh giá chuyên khoa trong ngày nếu hen nặng hoặc cầu nối chưa đủ kiểm soát. Ở người chưa đủ tuổi dùng phối hợp Beclometasone/formoterol, dùng ICS đơn chất theo đánh giá chuyên khoa.' };
    }
  }),
  asthmaRule({
    id: 'asthma.cyp3a4.action_plan_bridge', setting: 'both', nameVi: 'Kế hoạch hành động theo cùng controller cầu nối CYP3A4', citationIds: citations,
    when: (ctx) => Boolean(cypControllerBridge(ctx)),
    produce: (ctx): Recommendation | null => {
      const choice = cypControllerBridge(ctx);
      if (!choice || choice.blocked || !choice.confirmedDose || choice.rescueId !== 'salbutamol') return null;
      return { ...base, id: 'rec_asthma_action_plan_doc', action: 'MONITOR',
        title: 'Kế hoạch hành động trong thời gian dùng thuốc tương tác CYP3A4 — cần bác sĩ xác nhận',
        rationale: generateAsthmaActionPlanVi({ track: 'track2', controllerDrug: drug(choice.drugId).nameVi + ' ' + choice.deviceLabel,
          relieverDrug: 'Salbutamol pMDI', maintenanceDose: choice.maintenance,
          relieverInstructions: 'Theo đơn cắt cơn đã xác nhận', lactoseFreePmdiOnly: hasSevereMilkProteinAllergy(ctx) }) };
    }
  })
];
