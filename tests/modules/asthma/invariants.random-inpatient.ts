/** Checks the original inpatient acute-safety assertions for one randomized case. */
import { evaluate } from '../../../src/engine/evaluate';
import type { Patient, Settings } from '../../../src/engine/types';

export function verifyRandomInpatientCase(
  patient: Patient,
  defaultSettings: Settings,
  isUnder12: boolean,
  paco2Max: number,
  i: number
): { count: number; log: string[] } {
  let violations = 0;
  const violationLog: string[] = [];
  // Đánh giá Nội viện (Cấp cứu)
  const planIn = evaluate(patient, { ...defaultSettings, setting: 'inpatient' });

  // 0b. Tiêu chuẩn toàn cục #4 cho Nội viện
  for (const r of planIn.recommendations) {
    if ((r.action === 'STOP' || r.action === 'AVOID' || r.action === 'HOLD') && r.dose !== undefined) {
      violations++;
      violationLog.push(`[Ca #${i}] Nội viện ${r.id} (${r.action}) còn dính dose="${r.dose}"`);
    }
  }

  const silentChest = Boolean(patient.customInputs?.silentChest);
  const drowsy = patient.customInputs?.mentalStatus === 'drowsy_confused';
  const unableToSpeak = patient.customInputs?.speechAbility === 'unable';
  const paco2Val = typeof patient.customInputs?.paco2 === 'number' ? patient.customInputs.paco2 : undefined;
  const rrVal = typeof patient.customInputs?.respiratoryRate === 'number' ? patient.customInputs.respiratoryRate : undefined;
  const isBradypneic = rrVal !== undefined && rrVal < 10;
  const isBradycardic = typeof patient.hr === 'number' && patient.hr < 50;
  const isHypotensive = typeof patient.sbp === 'number' && patient.sbp < 90;
  const isExplicitlyAcute = patient.customInputs?.isAcuteExacerbation === true;
  const isLifeThreatening =
    silentChest ||
    drowsy ||
    unableToSpeak ||
    (paco2Val !== undefined && paco2Val > paco2Max) ||
    (isExplicitlyAcute && (isHypotensive || isBradypneic || isBradycardic));
  const hasDiazepam = patient.currentMeds.some((m) => m.drugId === 'diazepam');
  const isExplicitlyNotAcute = patient.customInputs?.isAcuteExacerbation === false && !isLifeThreatening;

  // 13. Cơn hen đe dọa tử vong bắt buộc có REFER ICU cho MỌI lứa tuổi + cổng chống sốc MgSO4 (ASTHMA-R3-R1-07)
  if (isLifeThreatening) {
    const icuRefer = planIn.recommendations.find(
      (r) => r.id === 'rec_asthma_acute_life_threatening_icu' && r.action === 'REFER'
    );
    if (!icuRefer) {
      violations++;
      violationLog.push(`[Ca #${i}] Cơn nguy kịch (age=${patient.age}) thiếu REFER ICU`);
    }
    if (!isUnder12) {
      const validAcuteActions = ['START', 'UPTITRATE', 'CONTINUE'];
      const hasSaba = planIn.recommendations.some(
        (r) => (r.drugId === 'salbutamol' || r.drugId === 'terbutaline') && validAcuteActions.includes(r.action)
      );
      const hasIpra = planIn.recommendations.some(
        (r) => r.drugId === 'ipratropium' && validAcuteActions.includes(r.action)
      );
      const hasSteroid = planIn.recommendations.some(
        (r) => (r.drugId === 'methylprednisolone' || r.drugId === 'hydrocortisone') && validAcuteActions.includes(r.action)
      );
      const mgRec = planIn.recommendations.find((r) => r.drugId === 'magnesium_sulfate');
      const mgValid = isHypotensive || isBradycardic
        ? mgRec?.action === 'AVOID'
        : Boolean(mgRec && (validAcuteActions.includes(mgRec.action) ||
            (['CONSIDER', 'DEFER'].includes(mgRec.action) && mgRec.dose === undefined)));

      if (!hasSaba || !hasIpra || !hasSteroid || !mgValid) {
        violations++;
        violationLog.push(
          `[Ca #${i}] Cơn nguy kịch lỗi gói hồi sức (SABA:${hasSaba}, Ipra:${hasIpra}, Steroid:${hasSteroid}, sbp=${patient.sbp}, Mg:${mgRec?.action})`
        );
      }
    }
  }

  // 14. Thuốc an thần trong cơn cấp thực sự luôn bị STOP; nội trú ổn định ngoài cơn cấp không bị chặn nhầm
  if (hasDiazepam && (isExplicitlyAcute || isLifeThreatening)) {
    const stopSedative = planIn.recommendations.find(
      (r) => r.drugId === 'diazepam' && r.action === 'STOP'
    );
    if (!stopSedative) {
      violations++;
      violationLog.push(`[Ca #${i}] Thuốc an thần trong cơn cấp nội viện nhưng không có STOP`);
    }
  }
  if (hasDiazepam && isExplicitlyNotAcute) {
    const wrongSedativeBlock = planIn.recommendations.find(
      (r) => r.id.startsWith('rec_asthma_acute_no_sedatives')
    );
    if (wrongSedativeBlock) {
      violations++;
      violationLog.push(`[Ca #${i}] Bệnh nhân nội trú không có cơn hen cấp nhưng vẫn bị chặn Diazepam`);
    }
  }
  return { count: violations, log: violationLog };
}
