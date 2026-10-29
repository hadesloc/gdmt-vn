/**
 * GDMT-VN Safety - Organ Contraindication (GLP-1 Boxed Warning, Hepatic Child-Pugh),
 * Acute Bronchospasm & Cardiogenic Shock Gates
 * Phân quyền: Agent B
 */

import type { Patient, Settings, Recommendation, GateResult, Action } from '../types';
import { hasCondition } from '../types';
import type { DrugEntry } from '../../kb-types';
import { parseDailyDoseMg } from '../doseParser';
import { isParenteralRecommendation } from '../routeGuard';
import { expandDrugComponents } from './fdcMap';
import {
  resolveKbDrugId,
  isGlp1OrGipDrug,
  hasMtcOrMen2History,
  hasPancreatitisHistory,
  hasAcutePancreatitis,
  hasAerdCondition,
  isCox1NsaidOrSalicylate,
  hasAcuteBronchospasmOrRespFailure,
  isOphthalmicBetaBlocker
} from './drugClassify';
import {
  evaluateHepaticSafety,
  isCardiogenicShockOrVasopressor
} from './clinicalStates';
import { applyPerioperativeAkiAndHypoGates } from './crisisAndHypoGates';

const PLACEHOLDER_PREFIX = 'TO' + 'DO:';

export function mergeCleanCitations(base: string[], extra: string[]): string[] {
  const set = new Set<string>(base);
  for (const c of extra) {
    if (c && !c.toUpperCase().startsWith(PLACEHOLDER_PREFIX)) {
      set.add(c);
    }
  }
  return Array.from(set);
}

export interface MutableGateState {
  gates: GateResult[];
  citationIds: string[];
  isBlocked: boolean;
  blockReason: string;
  updatedAction: Action;
  updatedTitle: string;
  updatedRationale: string;
  updatedDose?: string;
}

export function applyOrganAndCrisisSafetyGates(
  rec: Recommendation,
  patient: Patient,
  settings: Settings | undefined,
  drugId: string,
  resolvedKbId: string,
  kbDrug: DrugEntry | undefined,
  drugClasses: Set<string>,
  isPrescribingAction: boolean,
  state: MutableGateState
): void {
  const displayDrug = rec.drugNameVi || kbDrug?.nameVi || rec.title;
  const recComponents = expandDrugComponents(resolvedKbId);
  const matchingCurrentMed = (patient.currentMeds || []).find((m) => {
    const mid = (m.drugId || '').trim().toLowerCase();
    if (!mid) return false;
    return mid === drugId || resolveKbDrugId(mid) === resolvedKbId;
  });
  const isDrugInCurrentMeds = rec.action === 'CONTINUE' || Boolean(matchingCurrentMed);
  const isOngoingCurrentAction =
    rec.action === 'CONTINUE' ||
    rec.action === 'REDUCE' ||
    (rec.action === 'UPTITRATE' && isDrugInCurrentMeds);

  // 1. Cổng Boxed Warning toàn cục nhóm GLP-1 RA / GIP-GLP-1 RA (MTC / MEN 2 & Viêm tụy)
  if (isGlp1OrGipDrug(drugId, drugClasses) && isPrescribingAction) {
    if (hasMtcOrMen2History(patient)) {
      if (!state.gates.some((g) => g.parameter === 'MTC_MEN2' && !g.passed)) {
        state.gates.push({
          parameter: 'MTC_MEN2',
          passed: false,
          action: 'contra',
          messageVi:
            'Chống chỉ định hộp đen (FDA Boxed Warning): Tiền sử bản thân hoặc gia đình mắc ung thư tuyến giáp thể tủy (MTC) hoặc hội chứng đa u tuyến nội tiết típ 2 (MEN 2)'
        });
      }
      state.citationIds = mergeCleanCitations(state.citationIds, [
        'fda.semaglutide.boxed_warning_mtc'
      ]);
      state.updatedAction = isOngoingCurrentAction ? 'STOP' : 'AVOID';
      state.updatedTitle = `${state.updatedAction === 'STOP' ? 'NGỪNG NGAY' : 'CHỐNG CHỈ ĐỊNH HỘP ĐEN'} ${displayDrug} (Tiền sử MTC / MEN 2)`;
      state.updatedRationale = `Chống chỉ định tuyệt đối nhóm đồng vận thụ thể GLP-1 / GIP-GLP-1 (${displayDrug}) trên bệnh nhân có tiền sử bản thân hoặc gia đình mắc ung thư tuyến giáp thể tủy (MTC) hoặc MEN 2 (FDA Boxed Warning). ${state.updatedRationale}`;
      state.isBlocked = true;
      state.blockReason = 'Chống chỉ định hộp đen MTC / MEN 2 đối với GLP-1 / GIP-GLP-1 RA';
      return;
    }

    const isAcutePanc = hasAcutePancreatitis(patient);
    const hasPanc = hasPancreatitisHistory(patient);
    if (
      hasPanc &&
      (isAcutePanc ||
        rec.action === 'START' ||
        rec.action === 'UPTITRATE' ||
        rec.action === 'CONSIDER' ||
        rec.action === 'SWITCH')
    ) {
      if (!state.gates.some((g) => g.parameter === 'pancreatitis' && !g.passed)) {
        state.gates.push({
          parameter: 'pancreatitis',
          passed: false,
          action: 'contra',
          messageVi: isAcutePanc
            ? 'Đang viêm tụy cấp: Ngừng ngay và chống chỉ định dùng lại nhóm GLP-1 / GIP-GLP-1 RA'
            : 'Tiền sử viêm tụy: Tránh khởi trị hoặc tăng liều nhóm GLP-1 / GIP-GLP-1 RA, ưu tiên nhóm hạ đường huyết/bảo vệ thận khác'
        });
      }
      state.citationIds = mergeCleanCitations(state.citationIds, [
        'fda.semaglutide.pancreatitis',
        'ada.dm2.2026.incretin_pancreatitis'
      ]);
      state.updatedAction = isAcutePanc && isOngoingCurrentAction ? 'STOP' : 'AVOID';
      state.updatedTitle = `${state.updatedAction === 'STOP' ? 'NGỪNG NGAY' : 'CHỐNG CHỈ ĐỊNH / TRÁNH DÙNG'} ${displayDrug} (Tiền sử viêm tụy)`;
      state.updatedRationale = `${isAcutePanc ? 'Bệnh nhân đang viêm tụy cấp: Bắt buộc ngừng ngay' : 'Bệnh nhân có tiền sử viêm tụy: Tránh khởi trị/tăng liều'} ${displayDrug} theo cảnh báo an toàn FDA & ADA 2026. ${state.updatedRationale}`;
      state.isBlocked = true;
      state.blockReason = 'Chống chỉ định / tránh dùng GLP-1 RA do tiền sử viêm tụy';
      return;
    }
  }

  // 2. Cổng an toàn Gan (Hepatic Child-Pugh A / B / C, xơ gan mất bù, sỏi mật Fibrate, trần liều Telmisartan <= 40 mg)
  if (isPrescribingAction) {
    const recDailyMg = matchingCurrentMed
      ? parseDailyDoseMg(matchingCurrentMed)
      : rec.dose
        ? parseDailyDoseMg({ drugId: resolvedKbId, dose: rec.dose })
        : undefined;
    const hepaticVerdict = evaluateHepaticSafety(
      drugId,
      resolvedKbId,
      drugClasses,
      kbDrug,
      patient,
      recDailyMg
    );
    if (hepaticVerdict) {
      const nextAct: Action = isOngoingCurrentAction
        ? hepaticVerdict.actionForCurrent
        : hepaticVerdict.actionForStart;
      if (!state.gates.some((g) => g.parameter === 'hepatic' && !g.passed)) {
        state.gates.push({
          parameter: 'hepatic',
          passed: false,
          action:
            nextAct === 'REDUCE'
              ? 'reduce'
              : nextAct === 'HOLD'
                ? 'hold'
                : 'contra',
          messageVi: hepaticVerdict.messageVi
        });
      }
      state.citationIds = mergeCleanCitations(state.citationIds, hepaticVerdict.citationIds);
      state.updatedAction = nextAct;
      if (nextAct === 'REDUCE' && hepaticVerdict.maxDailyDoseMg !== undefined) {
        state.updatedDose = `Tối đa ${hepaticVerdict.maxDailyDoseMg} mg/ngày`;
        state.updatedTitle = `GIẢM LIỀU ${displayDrug} ≤ ${hepaticVerdict.maxDailyDoseMg} mg/ngày (An toàn gan)`;
      } else {
        state.updatedTitle =
          nextAct === 'HOLD'
            ? `TẠM HOÃN ${displayDrug} (An toàn gan)`
            : nextAct === 'STOP'
              ? `NGỪNG NGAY ${displayDrug} (Chống chỉ định trên gan)`
              : `CHỐNG CHỈ ĐỊNH / TRÁNH DÙNG ${displayDrug} (Suy gan / Bệnh gan)`;
        state.isBlocked = true;
        state.blockReason = hepaticVerdict.messageVi;
      }
      if (!state.updatedRationale.includes(hepaticVerdict.messageVi)) {
        state.updatedRationale = `${hepaticVerdict.messageVi}. ${state.updatedRationale}`;
      }
      if (state.isBlocked) return;
    }
  }

  // 3. Finerenone chống chỉ định / ngừng trên bệnh nhân đang lọc máu (onDialysis)
  if (
    recComponents.includes('finerenone') &&
    isPrescribingAction &&
    hasCondition({ normalized: patient, patient }, 'onDialysis')
  ) {
    if (!state.gates.some((g) => g.parameter === 'dialysis' && !g.passed)) {
      state.gates.push({
        parameter: 'dialysis',
        passed: false,
        action: 'contra',
        messageVi:
          'Đang lọc máu chu kỳ: Không chỉ định và bắt buộc ngừng Finerenone bất kể eGFR ước tính sau lọc'
      });
    }
    state.citationIds = mergeCleanCitations(state.citationIds, [
      'fda.finerenone.table_1_starting_dose',
      'fda.finerenone.table_2_dose_adjustment'
    ]);
    state.updatedAction = isOngoingCurrentAction ? 'STOP' : 'AVOID';
    state.updatedTitle = `${state.updatedAction === 'STOP' ? 'NGỪNG NGAY' : 'CHỐNG CHỈ ĐỊNH / TRÁNH DÙNG'} ${displayDrug} (Đang lọc máu)`;
    state.isBlocked = true;
    state.blockReason = 'Không dùng Finerenone ở bệnh nhân đang lọc máu';
    return;
  }

  // 3b. Cổng chống chỉ định toàn cục NSAID ức chế COX-1 / Aspirin trên bệnh nhân AERD (Tam chứng Samter)
  if (
    isPrescribingAction &&
    hasAerdCondition(patient) &&
    isCox1NsaidOrSalicylate(drugId, resolvedKbId, drugClasses)
  ) {
    if (!state.gates.some((g) => g.parameter === 'AERD_COX1_NSAID' && !g.passed)) {
      state.gates.push({
        parameter: 'AERD_COX1_NSAID',
        passed: false,
        action: 'contra',
        messageVi:
          'Bệnh hô hấp kịch phát do aspirin/NSAID (AERD / tam chứng Samter): Chống chỉ định tuyệt đối aspirin và các NSAID ức chế COX-1 do nguy cơ khởi phát co thắt phế quản cấp nguy kịch'
      });
    }
    state.citationIds = mergeCleanCitations(state.citationIds, ['gina.asthma.2026.aerd_avoid_nsaid']);
    state.updatedAction = isOngoingCurrentAction ? 'STOP' : 'AVOID';
    state.updatedTitle = `${state.updatedAction === 'STOP' ? 'NGỪNG NGAY' : 'CHỐNG CHỈ ĐỊNH TUYỆT ĐỐI'} ${displayDrug} (Bệnh hô hấp kịch phát do NSAID/Aspirin - AERD)`;
    state.updatedRationale = `Bệnh nhân mắc bệnh hô hấp kịch phát do aspirin/NSAID (AERD / tam chứng Samter): Chống chỉ định tuyệt đối ${displayDrug} (nhóm ức chế COX-1) do nguy cơ co thắt phế quản cấp đe dọa tính mạng; nếu bắt buộc giảm đau kháng viêm, cân nhắc paracetamol hoặc ức chế chọn lọc COX-2 dưới giám sát ≥ 2 giờ (GINA 2026). ${state.updatedRationale}`;
    state.isBlocked = true;
    state.blockReason = 'Chống chỉ định NSAID ức chế COX-1 / Aspirin ở bệnh nhân AERD';
    return;
  }

  // 3c. HF-R2-R3-03: Tránh dùng khởi trị, tăng liều hoặc chuyển đổi thuốc chẹn beta trong đợt cấp co thắt phế quản / suy hô hấp cấp -> AVOID
  const isBetaBlocker =
    !isOphthalmicBetaBlocker(drugId, `${rec.title} ${rec.dose || ''}`) &&
    !drugClasses.has('laba') &&
    !drugClasses.has('saba') &&
    !drugClasses.has('ics') &&
    (drugClasses.has('beta_blocker') ||
      drugClasses.has('bb_selective') ||
      drugClasses.has('bb_nonselective') ||
      recComponents.some((c) =>
        [
          'bisoprolol',
          'metoprolol_succinate',
          'metoprolol_tartrate',
          'metoprolol',
          'carvedilol',
          'nebivolol',
          'atenolol',
          'propranolol',
          'labetalol',
          'esmolol',
          'sotalol'
        ].includes(c)
      ));
  if (
    isBetaBlocker &&
    hasAcuteBronchospasmOrRespFailure(patient) &&
    (rec.action === 'START' ||
      rec.action === 'UPTITRATE' ||
      rec.action === 'CONSIDER' ||
      rec.action === 'SWITCH') &&
    state.updatedAction !== 'STOP' &&
    state.updatedAction !== 'HOLD'
  ) {
    if (!state.gates.some((g) => g.parameter === 'acute_bronchospasm_bb_defer' && !g.passed)) {
      state.gates.push({
        parameter: 'acute_bronchospasm_bb_defer',
        passed: false,
        action: 'contra',
        messageVi:
          'Đang trong đợt cấp co thắt phế quản / suy hô hấp cấp: Chống chỉ định khởi trị, tăng liều hoặc chuyển đổi thuốc chẹn beta cho tới khi hết co thắt phế quản cấp và ổn định hô hấp'
      });
    }
    state.citationIds = mergeCleanCitations(state.citationIds, [
      'gina.asthma.2026.beta_blocker_bronchospasm'
    ]);
    state.updatedAction = 'AVOID';
    state.updatedTitle = `CHỐNG CHỈ ĐỊNH / TRÁNH DÙNG ${displayDrug} (Đang đợt cấp co thắt phế quản / suy hô hấp cấp)`;
    state.updatedRationale = `Bệnh nhân đang trong đợt cấp co thắt phế quản hoặc suy hô hấp cấp: Tránh khởi trị, tăng liều hoặc chuyển đổi thuốc chẹn beta (${displayDrug}) cho tới khi hết hoàn toàn co thắt phế quản cấp và ổn định hô hấp (GINA 2026 / ESC HF 2026). ${state.updatedRationale}`;
    state.isBlocked = true;
    state.blockReason = 'Tránh dùng thuốc chẹn beta trong đợt cấp co thắt phế quản / suy hô hấp cấp';
    return;
  }

  // 3d. HF-R2-R3-02: Sốc tim hoặc đang phụ thuộc thuốc vận mạch / tăng co bóp
  if (
    isPrescribingAction &&
    isCardiogenicShockOrVasopressor(patient) &&
    !isParenteralRecommendation(rec) &&
    state.updatedAction !== 'AVOID' &&
    state.updatedAction !== 'STOP'
  ) {
    const isOralGdmtOrVasodilator =
      drugClasses.has('rasi') ||
      drugClasses.has('acei') ||
      drugClasses.has('arb') ||
      drugClasses.has('arni') ||
      drugClasses.has('renin_inhibitor') ||
      drugClasses.has('beta_blocker') ||
      drugClasses.has('mra') ||
      drugClasses.has('mra_steroidal') ||
      drugClasses.has('mra_nonsteroidal') ||
      drugClasses.has('sglt2i') ||
      drugClasses.has('dhp_ccb') ||
      drugClasses.has('ndhp_ccb') ||
      drugClasses.has('thiazide_diuretic') ||
      drugClasses.has('nitrate') ||
      drugClasses.has('vasodilator') ||
      (drugClasses.has('loop_diuretic') && patient.sbp !== undefined && patient.sbp < 90) ||
      ['vericiguat', 'ivabradine', 'sacubitril_valsartan', 'hydralazine', 'isosorbide_dinitrate'].includes(resolvedKbId);

    if (isOralGdmtOrVasodilator) {
      if (!state.gates.some((g) => g.parameter === 'cardiogenic_shock' && !g.passed)) {
        state.gates.push({
          parameter: 'cardiogenic_shock',
          passed: false,
          action: 'hold',
          messageVi:
            'Đang sốc tim / giảm tưới máu ngoại vi hoặc phụ thuộc thuốc vận mạch - tăng co bóp: Bắt buộc tạm hoãn GDMT đường uống và thuốc giãn mạch cho tới khi cai vận mạch và ổn định huyết động'
        });
      }
      state.citationIds = mergeCleanCitations(state.citationIds, [
        'esc.hf.2026.acute_inotropes_shock_sbp90',
        'esc.hf.2026.shock_sbp_90_hypoperfusion'
      ]);
      state.updatedAction = 'HOLD';
      state.updatedTitle = `TẠM HOÃN ${displayDrug} (Đang sốc tim / phụ thuộc vận mạch)`;
      state.updatedRationale = `Bệnh nhân đang trong bệnh cảnh sốc tim / giảm tưới máu mô hoặc đang truyền vận mạch / thuốc tăng co bóp: Không khởi trị, tăng liều hoặc duy trì GDMT đường uống (${displayDrug}) cho tới khi khôi phục tưới máu cơ quan và ngưng vận mạch ≥ 24 giờ (ESC HF 2026). ${state.updatedRationale}`;
      state.isBlocked = true;
      state.blockReason = 'Đang sốc tim / phụ thuộc vận mạch — tạm hoãn GDMT đường uống';
      return;
    }
  }

  applyPerioperativeAkiAndHypoGates(
    rec,
    patient,
    settings,
    drugId,
    resolvedKbId,
    kbDrug,
    drugClasses,
    isPrescribingAction,
    isDrugInCurrentMeds,
    isOngoingCurrentAction,
    displayDrug,
    state
  );
}
