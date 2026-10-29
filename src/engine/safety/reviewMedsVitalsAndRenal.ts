/**
 * GDMT-VN Medication Safety Review — AKI, Shock, Dialysis, Perioperative, Renal, Electrolytes/QTc, Vitals & Dose Caps
 * Phân quyền: Agent B
 */

import type { Patient, Derived, Recommendation, CurrentMed } from '../types';
import { hasCondition } from '../types';
import { renalBand, hasDrug, drug, type DrugEntry } from '../../kb-types';
import { currentRenalDoseAdjustment } from './renalDoseAdjustment';
import { expandDrugComponents, isFdcDrug } from './fdcMap';
import {
  DOAC_DRUG_IDS,
  getNormalizedDrugClasses,
  isOphthalmicBetaBlocker
} from './drugClassify';
import {
  detectAcuteAki,
  isCardiogenicShockOrVasopressor,
  isNephrotoxicOrHemodynamicInAki
} from './clinicalStates';
import { evaluateElectrolyteAndQtSafety } from './electrolyteAndQtGates';
import { reviewStatinDoseCaps } from './reviewMedsSpecialized';

export interface CurrentMedVitalRenalContext {
  med?: CurrentMed;
  drugId: string;
  resolvedKbId: string;
  drugName: string;
  drugClasses: Set<string>;
  kbDrug?: DrugEntry;
  doseNum?: number;
  medDoseStr: string;
  isSglt2iOrCombo: boolean;
  isNsaid: boolean;
  patient: Patient;
  derived: Derived;
  egfr?: number;
  coMedAndPlannedIds: Set<string>;
}

export function reviewCurrentMedVitalsAndRenal(ctx: CurrentMedVitalRenalContext): Recommendation[] {
  const {
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
  } = ctx;

  const recs: Recommendation[] = [];
  if (isOphthalmicBetaBlocker(drugId, med?.route)) return recs;

  const components = expandDrugComponents(resolvedKbId);
  const fdc = isFdcDrug(resolvedKbId);
  const k = patient.k;
  const sbp = patient.sbp;
  const hr = patient.hr;

  const renalDose = currentRenalDoseAdjustment({
    id: `med_review_renal_dose_${drugId}`, module: 'ckd', tier: 'An toàn chức năng thận',
    tierOrder: 0, action: 'CONTINUE', drugId, drugNameVi: drugName,
    title: drugName, rationale: '', gates: [], citationIds: [], priority: 94,
  }, patient, derived);
  if (renalDose) recs.push({
    id: `med_review_renal_dose_${drugId}`, module: 'ckd', tier: 'An toàn chức năng thận',
    tierOrder: 0, drugId, drugNameVi: drugName, priority: 94, ...renalDose,
  });

  // 2g. Ngừng Finerenone trên bệnh nhân đang lọc máu (onDialysis === true)
  if (components.includes('finerenone') && hasCondition({ normalized: patient, patient }, 'onDialysis')) {
    recs.push({
      id: 'med_review_dialysis_finerenone_stop',
      module: 'ckd',
      tier: 'An toàn lọc máu & suy thận giai đoạn cuối',
      tierOrder: 0,
      action: 'STOP',
      drugId,
      drugNameVi: drugName,
      title: `NGỪNG NGAY ${drugName} (Đang lọc máu chu kỳ / Suy thận giai đoạn cuối)`,
      rationale: `${drugName} không được khuyến cáo và phải ngừng ở bệnh nhân suy thận giai đoạn cuối đang lọc máu do nguy cơ tăng kali máu ác tính đe dọa tính mạng.`,
      gates: [{ parameter: 'dialysis', passed: false, action: 'contra', messageVi: 'Đang lọc máu: Bắt buộc ngừng Finerenone bất kể Creatinin sau lọc' }],
      citationIds: ['fda.finerenone.table_1_starting_dose', 'fda.finerenone.table_2_dose_adjustment'],
      priority: 99
    });
    return recs;
  }

  // 2h. Tạm ngưng SGLT2i (kể cả FDC như Synjardy/Xigduo/Glyxambi) trước phẫu thuật để phòng euDKA chu phẫu
  if (isSglt2iOrCombo && hasCondition({ normalized: patient, patient }, 'plannedSurgery')) {
    const withholdDays =
      components.includes('ertugliflozin') || drugId === 'steglatro' || drugId === 'segluromet' ? 4 : 3;
    recs.push({
      id: `med_review_preop_sglt2i_hold_${drugId}`,
      module: 'dm2',
      tier: 'An toàn tiền phẫu & chu phẫu',
      tierOrder: 0,
      action: 'HOLD',
      drugId,
      drugNameVi: drugName,
      title: `TẠM NGƯNG TRƯỚC MỔ ${withholdDays} NGÀY: ${drugName} (Phòng euDKA chu phẫu)`,
      rationale: `Bệnh nhân có lịch phẫu thuật: Bắt buộc tạm ngưng ${drugName} ít nhất ${withholdDays} ngày trước mổ để phòng biến chứng nhiễm toan ceton đẳng đường huyết (euDKA) chu phẫu.${fdc ? ' Cân nhắc chuyển tạm thành phần hạ đường huyết còn lại sang viên đơn chất an toàn hoặc insulin chu phẫu.' : ''}`,
      gates: [{ parameter: 'plannedSurgery', passed: false, action: 'hold', messageVi: `Chuẩn bị phẫu thuật: Tạm ngưng ${drugName} ít nhất ${withholdDays} ngày trước mổ (phòng euDKA)` }],
      citationIds: ['ada.dm2.2026.sglt2i_withhold_surgery', 'ada.dm2.2026.sglt2i_avoid_severe_illness'],
      priority: 96
    });
  }

  // 2h2. Tạm ngưng Metformin / FDC chứa Metformin khi chụp cản quang iod đường tĩnh mạch (đặc biệt khi eGFR < 60)
  if (
    components.includes('metformin') &&
    Boolean(patient.customInputs?.iodinatedContrast || patient.customInputs?.contrastPlanned) &&
    (egfr === undefined || egfr < 60 || Boolean(patient.customInputs?.intraArterialContrast))
  ) {
    recs.push({
      id: `med_review_contrast_metformin_hold_${drugId}`,
      module: 'dm2',
      tier: 'An toàn thuốc cản quang iod',
      tierOrder: 0,
      action: 'HOLD',
      drugId,
      drugNameVi: drugName,
      title: `TẠM NGƯNG ${drugName} TRƯỚC/TRONG KHI TIÊM CẢN QUANG IOD (48 giờ)`,
      rationale: `Bệnh nhân chuẩn bị hoặc vừa dùng thuốc cản quang iod${egfr !== undefined ? ` kèm eGFR = ${egfr.toFixed(0)} mL/phút/1.73m²` : ''}: Bắt buộc tạm ngưng ${drugName} (chứa Metformin) tại thời điểm chụp và kiểm tra lại eGFR sau 48 giờ trước khi dùng lại để phòng nhiễm toan lactic.`,
      gates: [{ parameter: 'iodinated_contrast', passed: false, action: 'hold', messageVi: 'Tạm ngưng Metformin 48 giờ quanh thủ thuật cản quang iod' }],
      citationIds: ['fda.metformin.contrast_discontinue'],
      priority: 96
    });
  }

  // 2i. HTN-R2-R3-03 & HF-R2-R3-04: Tạm ngưng (HOLD) thuốc độc thận / huyết động cầu thận đang dùng trong đợt Tổn thương thận cấp (AKI)
  const akiInfo = detectAcuteAki(patient);
  if (akiInfo.isAki && isNephrotoxicOrHemodynamicInAki(resolvedKbId)) {
    const act = isNsaid ? 'STOP' : 'HOLD';
    recs.push({
      id: `med_review_aki_${act.toLowerCase()}_${drugId}`,
      module: 'ckd',
      tier: 'An toàn trong tổn thương thận cấp (AKI)',
      tierOrder: 0,
      action: act,
      drugId,
      drugNameVi: drugName,
      title: `${act === 'STOP' ? 'NGỪNG NGAY' : 'TẠM NGƯNG (HOLD)'} ${drugName} (${akiInfo.reasonVi || 'Đang có tổn thương thận cấp AKI'})`,
      rationale: `${akiInfo.reasonVi || 'Bệnh nhân đang có tổn thương thận cấp (AKI)'}: Bắt buộc ${act === 'STOP' ? 'ngừng ngay NSAID' : `tạm ngưng ${drugName}`} trong giai đoạn AKI tiến triển để phục hồi áp lực lọc cầu thận và tránh tích lũy độc tính thuốc.${fdc ? ' Nếu cần kiểm soát huyết áp cấp thời, dùng tạm thuốc đơn chất an toàn thận (ví dụ chẹn kênh calci DHP).' : ''}`,
      gates: [{ parameter: 'AKI', passed: false, action: act === 'STOP' ? 'contra' : 'hold', messageVi: `${akiInfo.reasonVi || 'AKI'}: ${act === 'STOP' ? 'Ngừng' : 'Tạm ngưng'} ${drugName}` }],
      citationIds: [
        'kdigo.aki.2012.table_2_staging',
        'kdigo.ckd.2024.pp_3_6_5_rasi_reduce_stop',
        'byt.ckd.2024.aki_on_ckd_definition'
      ],
      priority: act === 'STOP' ? 99 : 96
    });
  }

  // 3. TĂNG KALI MÁU (Hyperkalemia — bao gồm SPC chứa ACEi/ARB/ARNI/MRA/Aliskiren)
  const isPotassiumRetaining =
    drugClasses.has('mra') ||
    drugClasses.has('mra_steroidal') ||
    drugClasses.has('mra_nonsteroidal') ||
    drugClasses.has('rasi') ||
    drugClasses.has('acei') ||
    drugClasses.has('arb') ||
    drugClasses.has('arni') ||
    drugClasses.has('renin_inhibitor');

  if (isPotassiumRetaining && k !== undefined) {
    if (k >= 6.0) {
      recs.push({
        id: `med_review_hyperk_severe_${drugId}`,
        module: 'ckd',
        tier: 'Cấp cứu tăng kali máu',
        tierOrder: 0,
        action: 'STOP',
        drugId,
        drugNameVi: drugName,
        title: `NGỪNG KHẨN CẤP ${drugName} (K⁺ = ${k.toFixed(1)} mmol/L)`,
        rationale: `Tăng kali máu mức độ nặng (K⁺ ≥ 6.0 mmol/L). Bắt buộc ngừng ngay ${drugName}${fdc ? ' (chứa thành phần giữ kali RAA/MRA; có thể tách sang đơn chất hạ áp không giữ kali như Amlodipine nếu huyết áp cao)' : ''} và xử trí cấp cứu hạ kali máu.`,
        gates: [{ parameter: 'K+', passed: false, action: 'contra', value: k, threshold: 6.0, messageVi: `K⁺ ${k.toFixed(1)} mmol/L ≥ 6.0 mmol/L: Chống chỉ định tiếp tục thuốc giữ kali` }],
        citationIds: ['ukka.2022.guideline_16_2_calcium_salts', 'kdigo.ckd.2024.pp_3_6_5_rasi_reduce_stop'],
        priority: 100
      });
    } else if (k > 5.5) {
      recs.push({
        id: `med_review_hyperk_moderate_${drugId}`,
        module: 'ckd',
        tier: 'Kiểm soát tăng kali máu',
        tierOrder: 1,
        action: 'HOLD',
        drugId,
        drugNameVi: drugName,
        title: `TẠM HOÃN / GIẢM LIỀU ${drugName} (K⁺ = ${k.toFixed(1)} mmol/L)`,
        rationale: `Kali máu tăng cao (K⁺ > 5.5 mmol/L). Tạm hoãn hoặc giảm liều ${drugName}, phối hợp thuốc gắn kali đường tiêu hóa nếu có chỉ định và kiểm tra lại điện giải đồ.${fdc ? ' Chuyển tạm thành phần không giữ kali sang viên đơn chất nếu cần duy trì huyết áp.' : ''}`,
        gates: [{ parameter: 'K+', passed: false, action: 'hold', value: k, threshold: 5.5, messageVi: `K⁺ ${k.toFixed(1)} mmol/L > 5.5 mmol/L: Vượt ngưỡng an toàn duy trì` }],
        citationIds: ['kdigo.ckd.2024.pp_3_6_3_hyperkalemia_k_binders', 'kdigo.ckd.2024.pp_3_6_5_rasi_reduce_stop'],
        priority: 95
      });
    }
  }

  // 3b. HẠ NATRI MÁU (Na+ < 130 / < 125), QTc > 500 ms & HẠ KALI MÁU NGUY HIỂM (K+ < 3.5 Digoxin/QT; K+ < 3.0 Lợi tiểu)
  const elQtVerdict = evaluateElectrolyteAndQtSafety(drugId, kbDrug, patient, derived);
  if (elQtVerdict) {
    const act = elQtVerdict.actionForActive;
    recs.push({
      id: `med_review_elqt_${elQtVerdict.parameter.toLowerCase().replace(/[^a-z0-9]/g, '')}_${drugId}`,
      module: elQtVerdict.parameter === 'QTc' ? 'af' : 'htn',
      tier: 'An toàn điện giải & điện tâm đồ',
      tierOrder: 0,
      action: act,
      drugId,
      drugNameVi: drugName,
      title: `${act === 'STOP' ? 'NGỪNG NGAY' : 'TẠM HOÃN'} ${drugName} (${elQtVerdict.messageVi.split(':')[0]})`,
      rationale: `${elQtVerdict.messageVi}.${fdc ? ' Chuyển thành phần thuốc còn lại sang viên đơn chất an toàn không gây rối loạn điện giải.' : ''}`,
      gates: [
        {
          parameter: elQtVerdict.parameter,
          passed: false,
          action: act === 'STOP' ? 'contra' : 'hold',
          value: elQtVerdict.value,
          threshold: elQtVerdict.threshold,
          messageVi: elQtVerdict.messageVi
        }
      ],
      citationIds: elQtVerdict.citationIds,
      priority: act === 'STOP' ? 99 : 96
    });
  }

  // 4. CHỨC NĂNG THẬN SUY GIẢM NẶNG (bao gồm phân rã từng thành phần FDC!)
  if (egfr !== undefined || derived.crcl !== undefined) {
    if (components.includes('metformin') && egfr !== undefined && egfr < 30) {
      recs.push({
        id: fdc ? `med_review_metformin_egfr_stop_${drugId}` : 'med_review_metformin_egfr_stop',
        module: 'dm2',
        tier: 'An toàn chức năng thận',
        tierOrder: 0,
        action: 'STOP',
        drugId,
        drugNameVi: drugName,
        title: `NGỪNG ${drugName} (Chứa Metformin — eGFR = ${egfr.toFixed(0)} < 30 mL/phút/1.73m²)`,
        rationale: `Chống chỉ định tuyệt đối Metformin khi eGFR < 30 mL/phút/1.73m² do nguy cơ nhiễm toan acid lactic đe dọa tính mạng.${fdc ? ' Ngừng viên phối hợp này và chuyển thành phần còn lại (nếu còn chỉ định ở eGFR hiện tại, ví dụ Linagliptin hoặc tiếp tục SGLT2i đơn chất) sang viên rời.' : ''}`,
        gates: [{ parameter: 'eGFR', passed: false, action: 'contra', value: egfr, threshold: 30, messageVi: 'eGFR < 30: Chống chỉ định Metformin' }],
        citationIds: ['kdigo.dm2.2022.metformin_discontinue_below_30', 'byt.dm2.2020.metformin_renal_contra'],
        priority: 98
      });
    } else if (isNsaid && egfr !== undefined && egfr < 30) {
      recs.push({
        id: `med_review_nsaid_egfr_stop_${drugId}`,
        module: 'ckd',
        tier: 'An toàn chức năng thận',
        tierOrder: 0,
        action: 'STOP',
        drugId,
        drugNameVi: drugName,
        title: `NGỪNG ${drugName} (Suy thận nặng eGFR < 30 mL/phút/1.73m²)`,
        rationale: `Thuốc chống viêm không steroid (NSAID) ức chế prostaglandin làm co thắt tiểu động mạch vào cầu thận, đẩy nhanh tiến triển suy thận và gây tổn thương thận cấp (AKI).`,
        gates: [{ parameter: 'eGFR', passed: false, action: 'contra', value: egfr, threshold: 30, messageVi: 'eGFR < 30: Chống chỉ định NSAID' }],
        citationIds: ['kdigo.ckd.2024.nsaid_nephrotoxicity_p132'],
        priority: 98
      });
    } else if (components.includes('finerenone') && egfr !== undefined && egfr < 15) {
      recs.push({
        id: 'med_review_finerenone_egfr_stop',
        module: 'ckd',
        tier: 'An toàn chức năng thận',
        tierOrder: 0,
        action: 'STOP',
        drugId,
        drugNameVi: drugName,
        title: `NGỪNG Finerenone (eGFR = ${egfr.toFixed(0)} < 15 mL/phút/1.73m²)`,
        rationale: `Không tiếp tục Finerenone khi bệnh thận tiến triển tới giai đoạn cuối (eGFR < 15 mL/phút/1.73m²) do nguy cơ tăng kali máu nghiêm trọng.`,
        gates: [{ parameter: 'eGFR', passed: false, action: 'contra', value: egfr, threshold: 15, messageVi: 'eGFR < 15: Ngừng Finerenone' }],
        citationIds: ['fda.finerenone.table_1_starting_dose', 'fda.finerenone.table_2_dose_adjustment'],
        priority: 95
      });
    } else {
      const checkIds = Array.from(new Set([resolvedKbId, ...components]));
      for (const cid of checkIds) {
        if (!hasDrug(cid)) continue;
        const cDrug = drug(cid);
        const isDoac = DOAC_DRUG_IDS.has(cid) || getNormalizedDrugClasses(cid).has('doac');
        const useCrcl = isDoac && derived.crcl !== undefined;
        const primaryMetric = useCrcl ? derived.crcl : egfr;
        if (primaryMetric === undefined) continue;
        const band = renalBand(cid, primaryMetric, useCrcl ? 'crcl' : 'egfr');
        if (band && band.continue === 'contra') {
          const label = useCrcl ? 'CrCl' : 'eGFR';
          const cutoff = band.crclTo ?? band.eGFRTo;
          recs.push({
            id: `med_review_renal_contra_${drugId}`,
            module: 'ckd',
            tier: 'An toàn chức năng thận',
            tierOrder: 0,
            action: 'STOP',
            drugId,
            drugNameVi: drugName,
            title: `NGỪNG ${drugName} (${fdc ? `Thành phần ${cDrug.nameVi} chống chỉ định khi ` : ''}${label} = ${primaryMetric.toFixed(0)}${cutoff ? ` < ${cutoff}` : ''} mL/phút)`,
            rationale: `${band.note || `Chống chỉ định duy trì ${cDrug.nameVi} ở mức chức năng thận hiện tại (${label} = ${primaryMetric.toFixed(0)} mL/phút).`}${fdc ? ' Bắt buộc ngừng viên phối hợp và chuyển thành phần còn lại (nếu an toàn thận) sang viên đơn chất.' : ''}`,
            gates: [
              {
                parameter: label,
                passed: false,
                action: 'contra',
                value: Number(primaryMetric.toFixed(1)),
                threshold: cutoff,
                messageVi: band.note || `Chống chỉ định thận đối với ${cDrug.nameVi}`
              }
            ],
            citationIds: band.citationIds,
            priority: 96
          });
          break;
        }
      }
    }
  }

  // 5. TỤT HUYẾT ÁP NẶNG (SBP < 90 mmHg) HOẶC SỐC TIM / PHỤ THUỘC VẬN MẠCH
  const isBpLoweringMed =
    drugClasses.has('rasi') ||
    drugClasses.has('acei') ||
    drugClasses.has('arb') ||
    drugClasses.has('arni') ||
    drugClasses.has('renin_inhibitor') ||
    drugClasses.has('beta_blocker') ||
    drugClasses.has('dhp_ccb') ||
    drugClasses.has('ndhp_ccb') ||
    drugClasses.has('sglt2i') ||
    drugClasses.has('mra') ||
    drugClasses.has('diuretic') ||
    drugClasses.has('loop_diuretic') ||
    drugClasses.has('thiazide_diuretic') ||
    drugClasses.has('nitrate') ||
    drugClasses.has('vasodilator') ||
    ['sacubitril_valsartan', 'vericiguat', 'ivabradine', 'hydralazine', 'urapidil'].includes(resolvedKbId);

  const inShock = isCardiogenicShockOrVasopressor(patient);
  if (isBpLoweringMed && ((sbp !== undefined && sbp < 90) || inShock)) {
    recs.push({
      id: `med_review_hypotension_hold_${drugId}`,
      module: inShock ? 'hf' : 'htn',
      tier: 'An toàn huyết động',
      tierOrder: 0,
      action: 'HOLD',
      drugId,
      drugNameVi: drugName,
      title:
        sbp !== undefined && sbp < 90
          ? `TẠM HOÃN ${drugName} (Tụt huyết áp SBP = ${sbp} < 90 mmHg)`
          : `TẠM HOÃN ${drugName} (Đang sốc tim / phụ thuộc thuốc vận mạch)`,
      rationale: `Bệnh nhân đang tụt huyết áp hoặc trong tình trạng sốc tim / phụ thuộc vận mạch. Bắt buộc tạm hoãn các thuốc hạ áp, giãn mạch, lợi tiểu, SGLT2i, MRA hoặc chẹn beta đường uống cho tới khi ổn định huyết động.`,
      gates: [
        {
          parameter: sbp !== undefined && sbp < 90 ? 'SBP' : 'cardiogenic_shock',
          passed: false,
          action: 'hold',
          value: sbp,
          threshold: sbp !== undefined && sbp < 90 ? 90 : undefined,
          messageVi:
            sbp !== undefined && sbp < 90
              ? `SBP ${sbp} mmHg < 90 mmHg: Nguy cơ tụt huyết áp nặng`
              : 'Đang sốc tim / phụ thuộc vận mạch: Tạm hoãn thuốc đường uống hạ áp'
        }
      ],
      citationIds: ['kdigo.ckd.2024.pp_3_6_5_rasi_reduce_stop', 'esc.hf.2026.acute_bb_hypoperfusion'],
      priority: 95
    });
  }

  // 6. NHỊP TIM CHẬM NẶNG (HR < 50 bpm, trừ khi đã có máy tạo nhịp)
  const isBradyMed =
    drugClasses.has('beta_blocker') ||
    drugClasses.has('ndhp_ccb') ||
    components.some((c) => ['ivabradine', 'digoxin', 'diltiazem', 'verapamil'].includes(c));

  if (
    isBradyMed &&
    hr !== undefined &&
    hr < 50 &&
    !hasCondition({ normalized: patient, patient }, 'pacemaker')
  ) {
    recs.push({
      id: `med_review_bradycardia_hold_${drugId}`,
      module: 'hf',
      tier: 'An toàn dẫn truyền & nhịp tim',
      tierOrder: 0,
      action: 'HOLD',
      drugId,
      drugNameVi: drugName,
      title: `TẠM HOÃN ${drugName} (Nhịp tim chậm HR = ${hr} < 50 bpm)`,
      rationale: `Tần số tim chậm quá mức (HR < 50 bpm). Nguy cơ bloc dẫn truyền nhĩ thất và ngất. Cần tạm hoãn ${drugName} và đo ECG 12 chuyển đạo.`,
      gates: [{ parameter: 'HR', passed: false, action: 'hold', value: hr, threshold: 50, messageVi: `HR ${hr} bpm < 50 bpm: Chống chỉ định thuốc làm chậm nhịp` }],
      citationIds: ['esc.hf.2026.bb_guidance_table_s6', 'esc.af.2024.rate_control_lvef_preserved'],
      priority: 95
    });
  }

  // 7. RÀ LIỀU TRẦN ĐỘC TÍNH & TƯƠNG TÁC STATIN / EPLERENONE
  const statinCapRec = reviewStatinDoseCaps(
    resolvedKbId,
    drugName,
    doseNum,
    medDoseStr,
    coMedAndPlannedIds,
    med
  );
  if (statinCapRec) {
    recs.push({ ...statinCapRec, drugId });
  }

  return recs;
}
