/**
 * GDMT-VN Medication Safety Review & Emergency Red Flags (KB Data-Driven)
 * Phân quyền: Agent B
 */

import type { Patient, Derived, Settings, Recommendation, CurrentMed } from '../types';
import { hasCondition } from '../types';
import { hasDrug, drug, type DrugEntry } from '../../kb-types';
import { parseDailyDoseMg } from '../doseParser';
import { expandDrugComponents, isFdcDrug } from './fdcMap';
import {
  isPregnancyContraindicated,
  getNormalizedDrugClasses,
  resolveKbDrugId,
  isSglt2iOrComboDrug,
  hasAerdCondition,
  isOphthalmicBetaBlocker,
  inferReviewModule,
  evaluateLactationSafety,
  evaluateAllergySafety,
  evaluateConductionAndWpwSafety,
  matchesContraindicationCode,
  PDE5I_DRUG_IDS,
  NITRATE_OR_SGC_DRUG_IDS,
  STRONG_CYP3A4_INHIBITOR_IDS
} from './gates';
import {
  parseDoseMg,
  checkEmergencyRedFlags,
  reviewOrganContraindicationsForCurrentMed,
  buildDuplicateClassStopIdsAndRecs
} from './reviewMedsSpecialized';
import { reviewDiseaseAndDdiStopForCurrentMed } from './reviewMedsDiseaseAndDdi';
import { reviewCurrentMedVitalsAndRenal } from './reviewMedsVitalsAndRenal';

export { checkEmergencyRedFlags };

const HEPATIC_CONTRA_CODES = new Set<string>([
  'child_pugh_c',
  'severe_hepatic_impairment',
  'moderate_to_severe_hepatic_impairment',
  'decompensated_cirrhosis',
  'active_liver_disease',
  'biliary_obstruction',
  'cholelithiasis',
  'gallbladder_disease'
]);

function isLowDoseAspirin(med: CurrentMed, resolvedId: string): boolean {
  if (resolvedId !== 'aspirin' && resolvedId !== 'acetylsalicylic_acid') return false;
  const daily = parseDailyDoseMg(med);
  if (daily !== undefined) return daily <= 162;
  const raw = `${med.dose || ''} ${med.name || ''}`;
  const m = raw.match(/(\d+(?:[.,]\d+)?)\s*mg/i);
  if (m) return parseFloat(m[1].replace(',', '.')) <= 162;
  return true;
}

export function reviewCurrentMedications(
  patient: Patient,
  derived: Derived,
  _settings: Settings,
  moduleRecs?: readonly Recommendation[]
): Recommendation[] {
  const recs: Recommendation[] = [];
  const currentMeds = Array.isArray(patient.currentMeds) ? patient.currentMeds : [];
  const egfr = derived.egfr ?? derived.egfrCr;
  const isPregnant = hasCondition({ normalized: patient, patient }, 'pregnant');
  const hasAsthma = hasCondition({ normalized: patient, patient }, 'asthma');
  const hasAerd = hasAerdCondition(patient);
  const rhythmStr = patient.rhythm as string | undefined;
  const hasAf =
    rhythmStr === 'afib' ||
    rhythmStr === 'af' ||
    rhythmStr === 'flutter' ||
    hasCondition({ normalized: patient, patient }, 'af');

  const hasHfReduced =
    (patient.lvef !== undefined && patient.lvef <= 40) ||
    (hasCondition({ normalized: patient, patient }, 'hf') &&
      (patient.lvef === undefined || patient.lvef < 50));
  const hasHfAny =
    hasCondition({ normalized: patient, patient }, 'hf') ||
    (patient.lvef !== undefined && patient.lvef < 50);

  const currentMedIdsLower = new Set<string>();
  for (const m of currentMeds) {
    if (!m?.drugId) continue;
    const resolved = resolveKbDrugId(m.drugId);
    if (!resolved) continue;
    currentMedIdsLower.add(resolved);
    for (const comp of expandDrugComponents(resolved)) currentMedIdsLower.add(comp);
  }

  const coMedAndPlannedIds = new Set<string>(currentMedIdsLower);
  let arniPlanned = false;
  if (moduleRecs) {
    for (const r of moduleRecs) {
      if (!r.drugId) continue;
      const rResolved = resolveKbDrugId(r.drugId);
      if (
        rResolved === 'sacubitril_valsartan' &&
        (r.action === 'START' || r.action === 'SWITCH' || r.action === 'HOLD')
      ) {
        arniPlanned = true;
      }
      if (
        r.action === 'START' ||
        r.action === 'UPTITRATE' ||
        r.action === 'CONTINUE' ||
        r.action === 'SWITCH'
      ) {
        coMedAndPlannedIds.add(rResolved);
        for (const comp of expandDrugComponents(rResolved)) coMedAndPlannedIds.add(comp);
      }
    }
  }

  const takingPde5i = Array.from(currentMedIdsLower).some(
    (id) => PDE5I_DRUG_IDS.has(id) || getNormalizedDrugClasses(id).has('pde5i')
  );
  const takingNitrateOrSgc = Array.from(currentMedIdsLower).some(
    (id) => NITRATE_OR_SGC_DRUG_IDS.has(id) || getNormalizedDrugClasses(id).has('nitrate')
  );
  const takingStrongCyp3a4 = Array.from(currentMedIdsLower).some(
    (id) =>
      STRONG_CYP3A4_INHIBITOR_IDS.has(id) ||
      getNormalizedDrugClasses(id).has('strong_cyp3a4_inhibitor') ||
      getNormalizedDrugClasses(id).has('strong_cyp3a4_pgp_inhibitor')
  );

  for (const med of currentMeds) {
    if (!med?.drugId) continue;
    const drugId = med.drugId.trim().toLowerCase();
    if (!drugId) continue;

    const resolvedKbId = resolveKbDrugId(drugId);
    const components = expandDrugComponents(resolvedKbId);
    const fdc = isFdcDrug(resolvedKbId);
    const ophthalmicProbe = `${med.drugId} ${med.name || ''}`;
    const isOphthalmicBb = isOphthalmicBetaBlocker(ophthalmicProbe, med.route);
    const kbDrug = hasDrug(resolvedKbId) ? drug(resolvedKbId) : undefined;
    const drugName = med.name || kbDrug?.nameVi || kbDrug?.inn || med.drugId;
    const drugClasses = getNormalizedDrugClasses(resolvedKbId);
    const doseNum = parseDoseMg(med);
    const medDoseStr = String(med.dose || '');
    const isSglt2iOrCombo = isSglt2iOrComboDrug(drugId, resolvedKbId, drugClasses, kbDrug);

    // 1. THAI KỲ (bao gồm từng thành phần trong viên phối hợp FDC)
    if (isPregnant && isPregnancyContraindicated(drugId, `${med.route || ''} ${med.name || ''}`)) {
      const unsafeComp = components.find((c) => isPregnancyContraindicated(c)) || resolvedKbId;
      const compKb = hasDrug(unsafeComp) ? drug(unsafeComp) : kbDrug;
      const pregInfo = kbDrug?.pregnancy || compKb?.pregnancy;
      const pregCitations =
        pregInfo?.citationIds && pregInfo.citationIds.length > 0
          ? pregInfo.citationIds
          : ['esc.hf.2026.pregnancy_contra', 'esc.htn.2024.pregnancy_contraindication_rasi'];
      const pregNotes =
        pregInfo?.notesVi ||
        `${drugName}${fdc ? ` (thành phần ${compKb?.nameVi || unsafeComp})` : ''} có nguy cơ gây độc phôi thai, dị tật bẩm sinh hoặc thiếu dữ liệu an toàn trong thai kỳ.`;

      recs.push({
        id: `med_review_pregnancy_stop_${drugId}`,
        module: inferReviewModule(patient, resolvedKbId, drugClasses, 'pregnancy'),
        tier: 'Cảnh báo an toàn thai kỳ',
        tierOrder: 0,
        action: 'STOP',
        drugId,
        drugNameVi: drugName,
        title: `NGỪNG NGAY ${drugName} (Chống chỉ định / tránh dùng trong thai kỳ)`,
        rationale: `Bệnh nhân đang mang thai. ${pregNotes} Cần ngừng ngay và chuyển sang phác đồ an toàn cho thai kỳ.`,
        gates: [{ parameter: 'pregnancy', passed: false, action: 'contra', messageVi: pregNotes }],
        citationIds: pregCitations,
        priority: 100
      });
      continue;
    }

    // 1a. CHO CON BÚ (`breastfeeding` — tách biệt khỏi thai kỳ)
    if (!isPregnant) {
      const lactationVerdict = evaluateLactationSafety(drugId, patient, `${med.route || ''} ${med.name || ''}`);
      if (lactationVerdict) {
        recs.push({
          id: `med_review_lactation_stop_${drugId}`,
          module: inferReviewModule(patient, resolvedKbId, drugClasses, 'lactation'),
          tier: 'Cảnh báo an toàn thời kỳ cho con bú',
          tierOrder: 0,
          action: 'STOP',
          drugId,
          drugNameVi: drugName,
          title: `NGỪNG / CHUYỂN ĐỔI ${drugName} (Chống chỉ định / tránh dùng khi đang cho con bú)`,
          rationale: `${lactationVerdict.messageVi}.${fdc ? ' Cân nhắc tách sang thuốc đơn chất tương thích với nuôi con bằng sữa mẹ.' : ''}`,
          gates: [
            {
              parameter: 'lactation',
              passed: false,
              action: 'contra',
              messageVi: lactationVerdict.messageVi
            }
          ],
          citationIds: lactationVerdict.citationIds,
          priority: 99
        });
        continue;
      }
    }

    // 1b. DỊ ỨNG THUỐC, DỊ ỨNG CHÉO NHÓM & TIỀN SỬ PHÙ MẠCH
    const allergyVerdict = evaluateAllergySafety(drugId, patient);
    if (allergyVerdict) {
      const isAngio = allergyVerdict.parameter === 'angioedema';
      recs.push({
        id: isAngio ? `med_review_angioedema_stop_${drugId}` : `med_review_allergy_stop_${drugId}`,
        module: isAngio ? 'htn' : inferReviewModule(patient, resolvedKbId, drugClasses, allergyVerdict.parameter),
        tier: 'Cảnh báo dị ứng & phù mạch',
        tierOrder: 0,
        action: 'STOP',
        drugId,
        drugNameVi: drugName,
        title: isAngio
          ? `NGỪNG NGAY ${drugName} (Tiền sử phù mạch — chống chỉ định ACEi/ARNI/Aliskiren)`
          : `NGỪNG NGAY ${drugName} (${allergyVerdict.messageVi.split(':')[0]})`,
        rationale: `${allergyVerdict.messageVi}.${fdc ? ' Bắt buộc ngừng viên phối hợp này và chuyển thành phần không gây dị ứng sang viên đơn chất.' : ''}`,
        gates: [
          {
            parameter: allergyVerdict.parameter,
            passed: false,
            action: 'contra',
            messageVi: allergyVerdict.messageVi
          }
        ],
        citationIds: allergyVerdict.citationIds,
        priority: 100
      });
      continue;
    }

    // 1c. HỆ DẪN TRUYỀN & WPW / RUNG NHĨ TIỀN KÍCH THÍCH
    const condWpw = evaluateConductionAndWpwSafety(drugId, patient, `${med.route || ''} ${med.name || ''}`);
    if (condWpw) {
      recs.push({
        id: `med_review_${condWpw.parameter}_stop_${drugId}`,
        module: condWpw.parameter === 'wpw_pre_excited_af' ? 'af' : 'hf',
        tier: 'An toàn dẫn truyền & nhịp tim',
        tierOrder: 0,
        action: 'STOP',
        drugId,
        drugNameVi: drugName,
        title: `NGỪNG NGAY ${drugName} (${condWpw.parameter === 'wpw_pre_excited_af' ? 'Chống chỉ định ở WPW / Rung nhĩ tiền kích thích' : 'Chống chỉ định trên hệ dẫn truyền chưa đặt máy tạo nhịp'})`,
        rationale: `${condWpw.messageVi}.${fdc ? ' Nếu cần duy trì thành phần hạ áp không ức chế dẫn truyền (như Amlodipine), chuyển sang viên đơn chất.' : ''}`,
        gates: [
          {
            parameter: condWpw.parameter,
            passed: false,
            action: 'contra',
            messageVi: condWpw.messageVi
          }
        ],
        citationIds: condWpw.citationIds,
        priority: 99
      });
      continue;
    }

    // 1d. GLP-1 Boxed Warning (MTC/MEN2, viêm tụy cấp) & An toàn Gan (Child-Pugh A/B/C, sỏi mật Fibrate)
    const organReview = reviewOrganContraindicationsForCurrentMed(
      drugId,
      resolvedKbId,
      drugName,
      drugClasses,
      kbDrug,
      patient,
      med
    );
    if (organReview.rec) {
      recs.push(organReview.rec);
      if (organReview.hardStopped) continue;
    }

    const isNsaid =
      !isLowDoseAspirin(med, resolvedKbId) &&
      (drugClasses.has('nsaid') ||
        components.some((c) =>
          [
            'ibuprofen', 'naproxen', 'celecoxib', 'meloxicam', 'diclofenac', 'etoricoxib',
            'piroxicam', 'tenoxicam', 'indomethacin', 'ketorolac', 'etodolac', 'dexketoprofen'
          ].includes(c)
        ));

    // 2a–2e2. Tương tác chống chỉ định tử vong & chống chỉ định bệnh lý (HFrEF, AF, Hen, AERD)
    const diseaseOrDdiStop = reviewDiseaseAndDdiStopForCurrentMed({
      drugId,
      resolvedKbId,
      drugName,
      components,
      fdc,
      isOphthalmicBb,
      drugClasses,
      isNsaid,
      egfr,
      patient,
      currentMedIdsLower,
      arniPlanned,
      takingPde5i,
      takingNitrateOrSgc,
      takingStrongCyp3a4,
      hasHfReduced,
      hasHfAny,
      hasAf,
      hasAsthma,
      hasAerd
    });
    if (diseaseOrDdiStop) {
      recs.push(diseaseOrDdiStop);
      continue;
    }

    // 2f. Thực thi toàn cục các mã chống chỉ định máy đọc (`DrugEntry.contraindications`)
    const kbEntries: DrugEntry[] = [];
    if (kbDrug) kbEntries.push(kbDrug);
    for (const comp of components) {
      if (comp !== kbDrug?.id && hasDrug(comp)) kbEntries.push(drug(comp));
    }
    let stoppedByKbContra = false;
    for (const entry of kbEntries) {
      for (const contra of entry.contraindications || []) {
        if (contra.code === 'pregnancy') continue;
        if (organReview.rec && HEPATIC_CONTRA_CODES.has(contra.code.trim().toLowerCase())) continue;

        const { matched, parameter: paramName } = matchesContraindicationCode(
          contra.code,
          patient,
          derived,
          'CONTINUE',
          resolvedKbId
        );
        if (matched) {
          const isDialysisSglt2i = contra.code === 'dialysis' && isSglt2iOrCombo;
          const stopMessage = isDialysisSglt2i
            ? 'Ngừng thuốc SGLT2i khi bệnh nhân bước vào lọc máu định kỳ theo KDIGO 2024'
            : contra.messageVi || `${entry.nameVi} chống chỉ định trên cơ địa hiện tại của bệnh nhân.`;
          const cits = isDialysisSglt2i
            ? Array.from(new Set([...contra.citationIds, 'kdigo.ckd.2024.pp_3_7_1_continue_below_20']))
            : contra.citationIds;

          recs.push({
            id: `med_review_contra_${contra.code}_${drugId}`,
            module: inferReviewModule(patient, resolvedKbId, drugClasses, contra.code),
            tier: 'Chống chỉ định thuốc đang dùng',
            tierOrder: 0,
            action: 'STOP',
            drugId,
            drugNameVi: drugName,
            title: `NGỪNG NGAY ${drugName} (${stopMessage})`,
            rationale: `${stopMessage}${fdc ? ' Bắt buộc ngừng viên phối hợp và chuyển thành phần còn lại (nếu an toàn) sang viên đơn chất.' : ''}`,
            gates: [
              {
                parameter: paramName || contra.code,
                passed: false,
                action: 'contra',
                messageVi: stopMessage
              }
            ],
            citationIds: cits,
            priority: 99
          });
          stoppedByKbContra = true;
          break;
        }
      }
      if (stoppedByKbContra) break;
    }
    if (stoppedByKbContra) continue;

    recs.push(
      ...reviewCurrentMedVitalsAndRenal({
        med,
        drugId,
        resolvedKbId,
        drugName,
        drugClasses,
        kbDrug,
        doseNum,
        medDoseStr,
        isSglt2iOrCombo,
        isNsaid,
        patient,
        derived,
        egfr,
        coMedAndPlannedIds
      })
    );
  }

  // LIPID-R3-R3-03 & HTN-R2-R3-08: Ngừng các thuốc trùng lặp nhóm độc quyền trên những thuốc còn đang hoạt động thực sự
  const { stoppedRedundantIds, recs: dupClassRecs } = buildDuplicateClassStopIdsAndRecs(patient, [
    ...(moduleRecs || []),
    ...recs
  ]);
  if (dupClassRecs.length > 0) {
    const filtered = recs.filter(
      (r) =>
        !r.drugId ||
        r.action === 'STOP' ||
        !stoppedRedundantIds.has(r.drugId.trim().toLowerCase())
    );
    filtered.push(...dupClassRecs);
    return filtered;
  }

  return recs;
}
