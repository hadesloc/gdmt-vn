/**
 * GDMT-VN Safety - Specialized Emergency Red Flags & Organ Med Review
 * Phân quyền: Agent B
 */

import type { Patient, Derived, Settings, Recommendation, CurrentMed } from '../types';
import { hasCondition } from '../types';
import type { DrugEntry } from '../../kb-types';
import { parseDailyDoseMg } from '../doseParser';
import {
  isGlp1OrGipDrug,
  hasMtcOrMen2History,
  hasAcutePancreatitis
} from './drugClassify';
import { evaluateHepaticSafety, detectAcuteAki } from './clinicalStates';
import {
  parseDoseMg,
  buildDuplicateClassStopIdsAndRecs,
  buildDuplicateStatinStopIdsAndRecs,
  reviewStatinDoseCaps
} from './reviewMedsDdiAndDuplicates';

export {
  parseDoseMg,
  buildDuplicateClassStopIdsAndRecs,
  buildDuplicateStatinStopIdsAndRecs,
  reviewStatinDoseCaps
};

function hasAcuteHypertensiveTargetOrganDamage(patient: Patient): boolean {
  const ci = (patient.customInputs || {}) as Record<string, unknown>;
  if (ci.hypertensiveEmergency === true || ci.acuteHmod === true) return true;
  if (ci.hypertensiveEmergency === false || ci.acuteHmod === false) return false;

  const hasCompellingCondition =
    hasCondition({ normalized: patient, patient }, 'aorticDissection') ||
    hasCondition({ normalized: patient, patient }, 'acutePulmonaryEdema') ||
    hasCondition({ normalized: patient, patient }, 'hypertensiveEncephalopathy') ||
    hasCondition({ normalized: patient, patient }, 'severePreeclampsiaEclampsia') ||
    hasCondition({ normalized: patient, patient }, 'acuteIntracerebralHemorrhage') ||
    hasCondition({ normalized: patient, patient }, 'acuteAcsWithin24h') ||
    hasCondition({ normalized: patient, patient }, 'malignantHypertension') ||
    hasCondition({ normalized: patient, patient }, 'thrombolysisEligible') ||
    detectAcuteAki(patient).isAki;

  if (hasCompellingCondition) return true;

  if (
    hasCondition({ normalized: patient, patient }, 'acuteIschemicStroke') &&
    ((patient.sbp !== undefined && patient.sbp >= 220) ||
      (patient.dbp !== undefined && patient.dbp >= 120))
  ) {
    return true;
  }

  return false;
}

export function checkEmergencyRedFlags(
  patient: Patient,
  _derived: Derived,
  settings?: Settings,
  existingRecs?: readonly Recommendation[]
): Recommendation[] {
  const alerts: Recommendation[] = [];
  const isInpatient = settings?.setting === 'inpatient';

  // 1. Tăng kali máu nặng / ác tính (K+ >= 6.0 mmol/L)
  if (patient.k !== undefined && patient.k >= 6.0) {
    const hasExistingHyperkCard = Boolean(
      existingRecs?.some((r) => {
        const idL = r.id.toLowerCase();
        const isHyperkRec =
          idL.includes('hyperkalemia') ||
          idL.includes('hyperk') ||
          r.id === 'rec_ckd_emergency_rrt';
        if (!isHyperkRec) return false;
        if (isInpatient) {
          return r.action === 'START' || r.action === 'REFER';
        }
        return (
          r.action === 'REFER' &&
          (r.title.includes('CẤP CỨU') || r.tier.includes('CẤP CỨU'))
        );
      })
    );

    if (!hasExistingHyperkCard) {
      alerts.push({
        id: 'emergency_hyperkalemia_critical',
        module: 'ckd',
        tier: '🚨 CẤP CỨU NGUY KỊCH',
        tierOrder: 0,
        action: 'REFER',
        title: isInpatient
          ? `CẤP CỨU NỘI VIỆN KHẨN CẤP — xử trí cấp cứu tại chỗ & hội chẩn hồi sức: Tăng Kali máu nặng / ác tính (K⁺ = ${patient.k.toFixed(1)} ≥ 6.0 mmol/L)`
          : `CHUYỂN CẤP CỨU KHẨN CẤP: Tăng Kali máu nặng / ác tính (K⁺ = ${patient.k.toFixed(1)} ≥ 6.0 mmol/L)`,
        rationale: isInpatient
          ? `Kali máu ${patient.k.toFixed(1)} mmol/L vượt ngưỡng nguy hiểm đe dọa loạn nhịp thất và ngừng tim. Bắt buộc đo ECG 12 chuyển đạo tại giường ngay lập tức, xử trí cấp cứu tại chỗ (tiêm tĩnh mạch Calci Clorid/Gluconat bảo vệ cơ tim, truyền Insulin + Glucose) và hội chẩn hồi sức tích cực / thận nhân tạo.`
          : `Kali máu ${patient.k.toFixed(1)} mmol/L vượt ngưỡng nguy hiểm đe dọa loạn nhịp thất và ngừng tim. Bắt buộc đo ECG 12 chuyển đạo khẩn, chuyển ngay tới cơ sở cấp cứu để tiêm tĩnh mạch Calci Clorid/Gluconat bảo vệ cơ tim, truyền Insulin + Glucose và xem xét lọc máu cấp cứu.`,
        gates: [],
        citationIds: [
          'ukka.2022.guideline_16_2_calcium_salts',
          'ukka.2022.guideline_16_3_1_insulin_glucose_severe'
        ],
        priority: 100
      });
    }
  }

  // 2. Sốc tụt huyết áp (SBP < 80 mmHg)
  if (patient.sbp !== undefined && patient.sbp < 80) {
    alerts.push({
      id: 'emergency_shock_hypotension',
      module: 'hf',
      tier: '🚨 CẤP CỨU NGUY KỊCH',
      tierOrder: 0,
      action: 'REFER',
      title: isInpatient
        ? 'CẤP CỨU NỘI VIỆN KHẨN CẤP — xử trí cấp cứu tại chỗ & hội chẩn hồi sức: Tụt huyết áp nặng / Nghi ngờ sốc (SBP < 80 mmHg)'
        : 'CHUYỂN CẤP CỨU KHẨN CẤP: Tụt huyết áp nặng / Nghi ngờ sốc (SBP < 80 mmHg)',
      rationale: isInpatient
        ? `Huyết áp tâm thu ${patient.sbp} mmHg không đủ đảm bảo áp lực tưới máu não và thận. Nguy cơ sốc tim, sốc nhiễm khuẩn hoặc sốc giảm thể tích. Kích hoạt xử trí cấp cứu tại chỗ và hội chẩn hồi sức tích cực ngay lập tức.`
        : `Huyết áp tâm thu ${patient.sbp} mmHg không đủ đảm bảo áp lực tưới máu não và thận. Nguy cơ sốc tim hoặc sốc giảm thể tích. Cần nhập viện cấp cứu ngay lập tức.`,
      gates: [],
      citationIds: [
        'esc.hf.2026.acute_bb_hypoperfusion',
        'kdigo.ckd.2024.pp_3_6_5_rasi_reduce_stop'
      ],
      priority: 100
    });
  }

  // 3. HTN-R2-R3-04: Tăng huyết áp nặng (HA >= 180/120 mmHg) — Phân biệt rõ Cấp cứu có HMOD cấp (hạ áp tĩnh mạch) vs Đột quỵ thiếu máu não < 220/120 / Không HMOD (TRÁNH truyền tĩnh mạch hạ áp nhanh Class III Harm!)
  if ((patient.sbp !== undefined && patient.sbp >= 180) || (patient.dbp !== undefined && patient.dbp >= 120)) {
    const hasExistingHtnCrisisCard = Boolean(
      isInpatient &&
        existingRecs?.some(
          (r) =>
            r.module === 'htn' &&
            (r.id.toLowerCase().includes('emergency') ||
              r.id.toLowerCase().includes('stroke') ||
              r.id.toLowerCase().includes('urgency'))
        )
    );

    if (!hasExistingHtnCrisisCard) {
      const hasAcuteHmod = hasAcuteHypertensiveTargetOrganDamage(patient);
      const isStrokeBelow220NoLysis =
        hasCondition({ normalized: patient, patient }, 'acuteIschemicStroke') &&
        !hasCondition({ normalized: patient, patient }, 'thrombolysisEligible') &&
        (patient.sbp === undefined || patient.sbp < 220) &&
        (patient.dbp === undefined || patient.dbp < 120);

      if (isStrokeBelow220NoLysis) {
        alerts.push({
          id: 'emergency_hypertensive_crisis',
          module: 'htn',
          tier: '⚠️ CẢNH BÁO AN TOÀN TƯỚI MÁU NÃO',
          tierOrder: 0,
          action: isInpatient ? 'MONITOR' : 'REFER',
          title: isInpatient
            ? `Đột quỵ thiếu máu não cấp không tiêu sợi huyết (HA ${patient.sbp ?? '--'}/${patient.dbp ?? '--'} < 220/120 mmHg): KHÔNG hạ áp tĩnh mạch tích cực (Class III Harm)`
            : `CHUYỂN CẤP CỨU ĐỘT QUỴ NGAY (HA ${patient.sbp ?? '--'}/${patient.dbp ?? '--'} mmHg): Tránh tự hạ huyết áp nhanh trước nhập viện`,
          rationale: `Ở đột quỵ thiếu máu não cấp không chỉ định tiêu sợi huyết có huyết áp < 220/120 mmHg, hạ huyết áp nhanh đường tĩnh mạch trong 48–72 giờ đầu không đem lại lợi ích và làm giảm tưới máu vùng tranh tối tranh sáng (Class III Harm theo ESC 2024 / AHA / VSH 2022).`,
          gates: [],
          citationIds: ['esc.htn.2024.stroke_no_rtpa_rec32', 'vsh.htn.2022.emergency_stroke_no_thrombolysis'],
          priority: 99
        });
      } else if (hasAcuteHmod) {
        alerts.push({
          id: 'emergency_hypertensive_crisis',
          module: 'htn',
          tier: '🚨 CẤP CỨU NGUY KỊCH',
          tierOrder: 0,
          action: 'REFER',
          title: isInpatient
            ? `CẤP CỨU TĂNG HUYẾT ÁP CÓ TỔN THƯƠNG CƠ QUAN ĐÍCH CẤP (HA ${patient.sbp ?? '--'}/${patient.dbp ?? '--'} mmHg) — Kiểm soát hạ áp tĩnh mạch chuẩn độ tại ICU/CCU`
            : `CHUYỂN CẤP CỨU KHẨN CẤP: Tăng huyết áp cấp cứu kèm tổn thương cơ quan đích cấp (HA ${patient.sbp ?? '--'}/${patient.dbp ?? '--'} mmHg)`,
          rationale: `Huyết áp ${patient.sbp ?? '--'}/${patient.dbp ?? '--'} mmHg kèm tổn thương cơ quan đích cấp tính đe dọa tính mạng. Bắt buộc nhập ICU/CCU theo dõi huyết áp liên tục và truyền thuốc hạ áp đường tĩnh mạch chuẩn độ theo đích chuyên biệt từng bệnh cảnh.`,
          gates: [],
          citationIds: ['aha.acc.2025.emergency_compelling_rec2', 'vsh.htn.2022.emergency_malignant'],
          priority: 100
        });
      } else {
        alerts.push({
          id: 'emergency_hypertensive_crisis',
          module: 'htn',
          tier: isInpatient ? '⚠️ TĂNG HUYẾT ÁP NẶNG KHÔNG HMOD CẤP' : '🚨 TẦM SOÁT CẤP CỨU TĂNG HUYẾT ÁP',
          tierOrder: 0,
          action: isInpatient ? 'MONITOR' : 'REFER',
          title: isInpatient
            ? `Tăng huyết áp nặng không kèm tổn thương cơ quan đích cấp (HA ${patient.sbp ?? '--'}/${patient.dbp ?? '--'} mmHg): Tối ưu thuốc đường uống từ từ, TRÁNH truyền tĩnh mạch hạ áp nhanh`
            : `Tăng huyết áp nặng (HA ${patient.sbp ?? '--'}/${patient.dbp ?? '--'} mmHg): Tầm soát ngay tổn thương cơ quan đích cấp tính; nếu không có HMOD cấp, hạ áp đường uống từ từ trong 24–48 giờ (KHÔNG hạ áp tĩnh mạch nhanh)`,
          rationale: `Huyết áp ≥ 180/120 mmHg cần thăm khám loại trừ ngay tổn thương cơ quan đích cấp (đau ngực, phù phổi cấp, dấu thần kinh khu trú, soi đáy mắt, AKI). Khi KHÔNG có HMOD cấp tính, chống chỉ định truyền thuốc tĩnh mạch hoặc ngậm dưới lưỡi hạ áp đột ngột (Class III Harm do gây thiếu máu não/vành/thận); chỉ khởi trị lại hoặc tăng liều thuốc uống hạ áp từ từ trong 24–48 giờ.`,
          gates: [],
          citationIds: ['aha.acc.2025.emergency_general_rec3', 'vsh.htn.2022.emergency_malignant'],
          priority: 96
        });
      }
    }
  }

  // 4. Nhịp tim nguy kịch (HR < 40 hoặc HR > 150 bpm)
  if (patient.hr !== undefined && (patient.hr < 40 || patient.hr > 150)) {
    alerts.push({
      id: 'emergency_extreme_heart_rate',
      module: 'af',
      tier: '🚨 CẤP CỨU NGUY KỊCH',
      tierOrder: 0,
      action: 'REFER',
      title: isInpatient
        ? `CẤP CỨU NỘI VIỆN KHẨN CẤP — xử trí cấp cứu tại chỗ & hội chẩn hồi sức: Rối loạn nhịp tim nguy hiểm (HR = ${patient.hr} bpm)`
        : `CHUYỂN CẤP CỨU KHẨN CẤP: Rối loạn nhịp tim nguy hiểm (HR = ${patient.hr} bpm)`,
      rationale: isInpatient
        ? `Tần số tim ${patient.hr} bpm gây rối loạn huyết động và nguy cơ ngừng tuần hoàn. Cần mắc monitor, đo ECG 12 chuyển đạo tại chỗ, chuẩn bị sốc điện / tạo nhịp / thuốc chống loạn nhịp cấp cứu và hội chẩn hồi sức tim mạch ngay.`
        : `Tần số tim ${patient.hr} bpm gây rối loạn huyết động và nguy cơ ngừng tuần hoàn. Cần chuyển cấp cứu đo ECG 12 chuyển đạo và xử trí loạn nhịp khẩn cấp.`,
      gates: [],
      citationIds: [
        'esc.af.2024.emergency_electrical_cardioversion',
        'esc.hf.2026.bb_guidance_table_s6'
      ],
      priority: 100
    });
  }

  // 5. Suy hô hấp cấp nguy kịch / Đe dọa tính mạng
  const ci = patient.customInputs;
  const spo2Val = typeof patient.spo2 === 'number' ? patient.spo2 : undefined;
  const restSpo2 = typeof ci?.restingSpo2 === 'number' ? ci.restingSpo2 : undefined;
  const abgPhVal = typeof ci?.abgPh === 'number' ? ci.abgPh : undefined;
  const respSigns: string[] = [];
  if (ci?.respiratoryArrest === true) respSigns.push('ngừng thở');
  if (ci?.silentChest === true) respSigns.push('lồng ngực im lặng');
  if (abgPhVal !== undefined && abgPhVal < 7.3) respSigns.push(`pH = ${abgPhVal}`);
  if (spo2Val !== undefined && spo2Val < 85) respSigns.push(`SpO₂ = ${spo2Val}%`);
  else if (restSpo2 !== undefined && restSpo2 < 85 && settings?.setting === 'outpatient') {
    respSigns.push(`SpO₂ nghỉ = ${restSpo2}%`);
  }

  if (respSigns.length > 0) {
    const hasRespCard = existingRecs?.some((r) => {
      if (r.module !== 'copd' && r.module !== 'asthma') return false;
      const t = `${r.id} ${r.title} ${r.tier}`.toLowerCase();
      if (r.action === 'REFER' && /cấp cứu|hồi sức|\bicu\b|nguy kịch|đe dọa|nhập viện/.test(t)) return true;
      return isInpatient && /thở máy|\bniv\b|\bbipap\b|\bicu\b|nội khí quản|thông khí/.test(t);
    });
    if (!hasRespCard) {
      const signText = respSigns.join(', ');
      const mod =
        (patient.conditions?.asthma || patient.selectedModules?.includes('asthma')) &&
        !patient.selectedModules?.includes('copd')
          ? 'asthma'
          : 'copd';
      alerts.push({
        id: 'emergency_respiratory_failure_critical',
        module: mod,
        tier: '🚨 CẤP CỨU NGUY KỊCH',
        tierOrder: 0,
        action: 'REFER',
        title: isInpatient
          ? `CẤP CỨU NỘI VIỆN KHẨN CẤP — xử trí hồi sức hô hấp tại chỗ & hội chẩn ICU (${signText})`
          : `CHUYỂN CẤP CỨU KHẨN CẤP: Dấu hiệu suy hô hấp cấp đe dọa tính mạng (${signText})`,
        rationale: isInpatient
          ? `Suy hô hấp cấp nguy kịch (${signText}). Kích hoạt ngay hồi sức hô hấp tại giường (kiểm soát đường thở, oxy có kiểm soát, thông khí nhân tạo / nội khí quản khi chống chỉ định NIV) và hội chẩn ICU.`
          : `Suy hô hấp cấp đe dọa tính mạng (${signText}). Chuyển ngay tới Cấp cứu / ICU gần nhất kèm hỗ trợ oxy và thuốc giãn phế quản trên đường vận chuyển.`,
        gates: [],
        citationIds: [
          'gold.copd.2026.exac_ventilatory_failure_rome',
          'gina.asthma.2026.acute_icu_silent_chest',
          'byt.copd.2026.niv_contraindications_imv'
        ],
        priority: 100
      });
    }
  }

  return alerts;
}

export function reviewOrganContraindicationsForCurrentMed(
  drugId: string,
  resolvedKbId: string,
  drugName: string,
  drugClasses: Set<string>,
  kbDrug: DrugEntry | undefined,
  patient: Patient,
  medObj?: CurrentMed
): { rec?: Recommendation; hardStopped: boolean } {
  // 1. GLP-1 / GIP-GLP-1 RA: Tiền sử MTC / MEN 2 hoặc Viêm tụy cấp
  if (isGlp1OrGipDrug(drugId, drugClasses)) {
    if (hasMtcOrMen2History(patient)) {
      return {
        hardStopped: true,
        rec: {
          id: `med_review_glp1_mtc_men2_stop_${drugId}`,
          module: 'dm2',
          tier: 'Cảnh báo hộp đen (FDA Boxed Warning)',
          tierOrder: 0,
          action: 'STOP',
          drugId,
          drugNameVi: drugName,
          title: `NGỪNG NGAY ${drugName} (Chống chỉ định hộp đen: Tiền sử MTC / MEN 2)`,
          rationale: `Tiền sử bản thân hoặc gia đình mắc ung thư tuyến giáp thể tủy (MTC) hoặc hội chứng đa u tuyến nội tiết típ 2 (MEN 2) là chống chỉ định tuyệt đối của nhóm đồng vận thụ thể GLP-1 / GIP-GLP-1 (${drugName}). Bắt buộc ngừng thuốc vĩnh viễn.`,
          gates: [
            {
              parameter: 'MTC_MEN2',
              passed: false,
              action: 'contra',
              messageVi: 'Chống chỉ định hộp đen MTC / MEN 2 đối với GLP-1 / GIP-GLP-1 RA'
            }
          ],
          citationIds: ['fda.semaglutide.boxed_warning_mtc'],
          priority: 100
        }
      };
    }

    if (hasAcutePancreatitis(patient)) {
      return {
        hardStopped: true,
        rec: {
          id: `med_review_glp1_pancreatitis_stop_${drugId}`,
          module: 'dm2',
          tier: 'Cảnh báo viêm tụy cấp',
          tierOrder: 0,
          action: 'STOP',
          drugId,
          drugNameVi: drugName,
          title: `NGỪNG NGAY ${drugName} (Đang viêm tụy cấp)`,
          rationale: `Bệnh nhân đang có bệnh cảnh viêm tụy cấp: Bắt buộc ngừng ngay ${drugName} và không tái sử dụng nhóm GLP-1 / GIP-GLP-1 RA sau khi hồi phục.`,
          gates: [
            {
              parameter: 'pancreatitis',
              passed: false,
              action: 'contra',
              messageVi: 'Ngừng ngay GLP-1 / GIP-GLP-1 RA khi có viêm tụy cấp'
            }
          ],
          citationIds: ['fda.semaglutide.pancreatitis', 'ada.dm2.2026.incretin_pancreatitis'],
          priority: 100
        }
      };
    }
  }

  // 2. Chống chỉ định / Tạm hoãn / Giảm liều do Suy gan (Child-Pugh A/B/C, xơ gan mất bù, sỏi mật Fibrate, Telmisartan <= 40 mg)
  const dailyMg = medObj ? parseDailyDoseMg(medObj) : undefined;
  const hepaticVerdict = evaluateHepaticSafety(
    drugId,
    resolvedKbId,
    drugClasses,
    kbDrug,
    patient,
    dailyMg
  );
  if (hepaticVerdict) {
    const act = hepaticVerdict.actionForCurrent;
    return {
      hardStopped: act === 'STOP' || act === 'HOLD',
      rec: {
        id: `med_review_hepatic_${act.toLowerCase()}_${drugId}`,
        module:
          drugClasses.has('statin') || drugClasses.has('fibrate')
            ? 'lipid'
            : drugClasses.has('doac')
              ? 'af'
              : 'ckd',
        tier: 'An toàn chức năng gan',
        tierOrder: act === 'REDUCE' ? 1 : 0,
        action: act,
        drugId,
        drugNameVi: drugName,
        dose:
          act === 'REDUCE' && hepaticVerdict.maxDailyDoseMg !== undefined
            ? `Tối đa ${hepaticVerdict.maxDailyDoseMg} mg/ngày`
            : undefined,
        title:
          act === 'REDUCE' && hepaticVerdict.maxDailyDoseMg !== undefined
            ? `GIẢM LIỀU ${drugName} ≤ ${hepaticVerdict.maxDailyDoseMg} mg/ngày (An toàn gan)`
            : act === 'HOLD'
              ? `TẠM HOÃN ${drugName} (${hepaticVerdict.messageVi})`
              : `NGỪNG NGAY ${drugName} (Chống chỉ định trên gan)`,
        rationale: hepaticVerdict.messageVi,
        gates: [
          {
            parameter: 'hepatic',
            passed: false,
            action: act === 'REDUCE' ? 'reduce' : act === 'HOLD' ? 'hold' : 'contra',
            messageVi: hepaticVerdict.messageVi
          }
        ],
        citationIds: hepaticVerdict.citationIds,
        priority: act === 'STOP' ? 99 : act === 'HOLD' ? 95 : 90
      }
    };
  }

  return { hardStopped: false };
}
