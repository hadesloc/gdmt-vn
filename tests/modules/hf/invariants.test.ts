/**
 * GDMT-VN Module Suy tim (hf) - Property-Based Safety Invariants Test
 * Phân quyền: Agent G (Round 1 Remediation & QA-10)
 *
 * Kiểm thử tính bất biến an toàn tuyệt đối trên 16.000 ca bệnh ngẫu nhiên hóa (≥ 15.000 ca):
 * - Suite 1 (8.000 ca): Cổng an toàn lâm sàng (phù mạch, washout ACEi vs chuyển trực tiếp ARB,
 *   K+, SBP, HR, nhịp xoang, ASTHMA-R2-208 không gợi ý Carvedilol, thai kỳ, lọc máu,
 *   NYHA IV cấm ICD, QRS < 130 ms cấm CRT, HFpEF không ép START ARNI/BB/Semaglutide, sốc tim nội viện).
 * - Suite 2 (8.000 ca - QA-1 / QA-9 Fail-Closed): Khi các trường bắt buộc (K+, Scr/eGFR, SBP, HR, LVEF)
 *   bị xóa ngẫu nhiên (undefined), tuyệt đối KHÔNG sinh START/UPTITRATE của thuốc phụ thuộc cổng đó
 *   và LUÔN phát cảnh báo missing_input_<field> tương ứng.
 */

import { describe, it, expect } from 'vitest';
import { evaluate } from '../../../src/engine/evaluate';
import type { CurrentMed, Patient, Settings } from '../../../src/engine/types';

const defaultSettings: Settings = {
  setting: 'outpatient',
  profile: 'INTL',
  units: {
    cr: 'umol_L',
    glucose: 'mmol_L',
    lipid: 'mmol_L',
    urat: 'umol_L',
    uacr: 'mg_mmol',
    hba1c: 'pct',
  },
  score2Region: 'high',
  fontScale: 'normal',
  theme: 'light',
  onlyReviewed: false,
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number): number {
  return Number((Math.random() * (max - min) + min).toFixed(1));
}

function generateRandomHfPatient(seedIndex: number): Patient {
  const rhythms: ('sinus' | 'afib' | 'paced' | 'other')[] = ['sinus', 'afib', 'paced', 'other'];
  const congestions = ['euvolaemic', 'mild', 'overt'];

  const sex = Math.random() < 0.5 ? 'male' : 'female';
  const priorAngio = Math.random() < 0.12;
  const takingAcei = Math.random() < 0.15;
  const asthma = Math.random() < 0.18;
  const pregnant = sex === 'female' && Math.random() < 0.12;
  const onDialysis = !pregnant && Math.random() < 0.1;

  const currentMeds: CurrentMed[] = [];
  if (Math.random() < 0.15) {
    currentMeds.push({ drugId: 'bisoprolol', name: 'Bisoprolol', dose: '5 mg x 1 lần/ngày' });
  } else if (Math.random() < 0.12) {
    currentMeds.push({ drugId: 'carvedilol', name: 'Carvedilol', dose: '6.25 mg x 2 lần/ngày' });
  }
  if (!takingAcei && Math.random() < 0.1) {
    currentMeds.push({ drugId: 'valsartan', name: 'Valsartan', dose: '80 mg x 2 lần/ngày' });
  }

  return {
    id: `rnd_pt_${seedIndex}`,
    age: pregnant ? randInt(22, 42) : randInt(40, 90),
    sex,
    weight: randInt(45, 115),
    height: randInt(145, 185),
    sbp: randInt(75, 190),
    dbp: randInt(45, 110),
    hr: randInt(42, 130),
    rhythm: rhythms[randInt(0, rhythms.length - 1)],
    lvef: randInt(15, 65),
    nyha: randInt(1, 4) as 1 | 2 | 3 | 4,
    scr: onDialysis ? randInt(450, 750) : randInt(50, 350),
    k: randFloat(3.2, 6.2),
    conditions: {
      hf: true,
      priorAngioedema: priorAngio,
      asthma,
      pregnant,
      onDialysis,
      ckd: onDialysis || Math.random() < 0.25,
      dm: Math.random() < 0.3,
    },
    currentMeds,
    selectedModules: ['hf'],
    customInputs: {
      congestion: congestions[randInt(0, congestions.length - 1)],
      fmtDurationMonths: randInt(0, 12),
      takingAcei,
      recentWorseningHf: Math.random() < 0.25,
      qrsDuration: randInt(80, 180),
      qrsMorphology: Math.random() < 0.4 ? 'lbbb' : Math.random() < 0.5 ? 'non_lbbb' : 'normal',
    },
  };
}

describe('Safety Invariants: Kiểm thử bất biến an toàn tuyệt đối trên 16.000 ca ngẫu nhiên (≥ 15.000 ca)', () => {
  it('Suite 1: Chạy 8.000 ca ngẫu nhiên đầy đủ (ngoại trú + nội trú) và đảm bảo 0 vi phạm bất biến lâm sàng', () => {
    const TOTAL_CASES = 8000;
    let violations = 0;
    const violationLog: string[] = [];

    for (let i = 0; i < TOTAL_CASES; i++) {
      const patient = generateRandomHfPatient(i);
      const isInpatient = i % 5 === 0;
      const settings: Settings = isInpatient
        ? { ...defaultSettings, setting: 'inpatient' }
        : defaultSettings;
      const plan = evaluate(patient, settings);

      const arniRec = plan.recommendations.find((r) => r.drugId === 'sacubitril_valsartan');
      const mraRec = plan.recommendations.find(
        (r) => r.drugId === 'spironolactone' || r.drugId === 'eplerenone' || r.drugId === 'finerenone'
      );
      const bbRec = plan.recommendations.find(
        (r) =>
          r.drugId === 'bisoprolol' ||
          r.drugId === 'carvedilol' ||
          r.drugId === 'metoprolol_succinate' ||
          r.drugId === 'nebivolol'
      );
      const sglt2iRec = plan.recommendations.find(
        (r) => r.drugId === 'dapagliflozin' || r.drugId === 'empagliflozin'
      );
      const ivabradineRec = plan.recommendations.find((r) => r.drugId === 'ivabradine');
      const semaRec = plan.recommendations.find((r) => r.drugId === 'semaglutide');

      // 1. ARNI & tiền sử phù mạch
      if (patient.conditions?.priorAngioedema && arniRec) {
        if (['START', 'UPTITRATE', 'CONTINUE', 'SWITCH'].includes(arniRec.action)) {
          violations++;
          violationLog.push(`Ca ${i}: ARNI được ${arniRec.action} dù có tiền sử phù mạch!`);
        }
      }

      // 2. ARNI & đang dùng ACEi chưa washout 36h
      if (patient.customInputs?.takingAcei && arniRec) {
        if (arniRec.action === 'START' || arniRec.action === 'UPTITRATE') {
          violations++;
          violationLog.push(`Ca ${i}: ARNI được ${arniRec.action} khi đang dùng ACEi chưa washout!`);
        }
      }

      // 3. ARNI & SBP < 100 mmHg
      if (patient.sbp !== undefined && patient.sbp < 100 && arniRec) {
        if (arniRec.action === 'START' || arniRec.action === 'UPTITRATE') {
          violations++;
          violationLog.push(`Ca ${i}: ARNI được ${arniRec.action} khi SBP = ${patient.sbp} < 100!`);
        }
      }

      // 4. MRA (sMRA + Finerenone) & Kali máu > 5.0 mmol/L
      if (patient.k !== undefined && patient.k > 5.0 && mraRec) {
        if (mraRec.action === 'START' || mraRec.action === 'UPTITRATE') {
          violations++;
          violationLog.push(`Ca ${i}: MRA được ${mraRec.action} khi K+ = ${patient.k} > 5.0!`);
        }
      }

      const sbp = patient.sbp ?? 120;
      const hr = patient.hr ?? 72;

      // 5. Chẹn beta & HR < 50 bpm hoặc SBP < 90 mmHg
      if ((hr < 50 || sbp < 90) && bbRec) {
        if (bbRec.action === 'START' || bbRec.action === 'UPTITRATE' || bbRec.action === 'CONTINUE') {
          violations++;
          violationLog.push(`Ca ${i}: Chẹn beta được ${bbRec.action} khi HR=${hr}, SBP=${sbp}!`);
        }
      }

      // 6. Ivabradine & nhịp không xoang hoặc HR < 70 bpm
      if ((patient.rhythm !== 'sinus' || hr < 70) && ivabradineRec) {
        if (ivabradineRec.action === 'START' || ivabradineRec.action === 'CONSIDER') {
          violations++;
          violationLog.push(`Ca ${i}: Ivabradine được ${ivabradineRec.action} khi rhythm=${patient.rhythm}, HR=${hr}!`);
        }
      }

      // 7. ASTHMA-R2-208: Khi có hen phế quản, tuyệt đối KHÔNG gợi ý Carvedilol.
      // Được phép nhắc tên khi thẻ đang NGƯNG/TẠM NGƯNG/CHUYỂN KHỎI Carvedilol người bệnh đang dùng.
      if (patient.conditions?.asthma) {
        const onCarv = (patient.currentMeds ?? []).some((m) => m.drugId === 'carvedilol');
        const isDeescalation = (r: (typeof plan.recommendations)[number]) =>
          r.drugId !== 'carvedilol' && onCarv && (r.switchFrom === 'carvedilol' || ['HOLD', 'STOP', 'DEFER', 'AVOID'].includes(r.action));
        const isCarvStopOrHold = (r: (typeof plan.recommendations)[number]) =>
          r.drugId === 'carvedilol' && ['HOLD', 'STOP', 'AVOID', 'DEFER'].includes(r.action);
        const recHfBb = plan.recommendations.find((r) => r.id === 'rec_hf_bb');
        if (recHfBb && !isDeescalation(recHfBb) && !isCarvStopOrHold(recHfBb)) {
          const textBlob = `${recHfBb.drugId ?? ''} ${recHfBb.drugNameVi ?? ''} ${recHfBb.title} ${recHfBb.rationale}`.toLowerCase();
          if (textBlob.includes('carvedilol')) {
            violations++;
            violationLog.push(`Ca ${i} (ASTHMA-R2-208): rec_hf_bb (${recHfBb.action}) nhắc tới Carvedilol khi bệnh nhân có hen!`);
          }
        }
        for (const r of plan.recommendations) {
          if (['START', 'UPTITRATE', 'CONSIDER', 'CONTINUE', 'SWITCH'].includes(r.action) && !isDeescalation(r)) {
            const suggestBlob = `${r.drugId ?? ''} ${r.drugNameVi ?? ''} ${r.title} ${r.rationale}`.toLowerCase();
            if (suggestBlob.includes('carvedilol')) {
              violations++;
              violationLog.push(`Ca ${i} (ASTHMA-R2-208): Khuyến cáo ${r.id} (${r.action}) gợi ý Carvedilol ở bệnh nhân hen!`);
            }
          }
        }
      }

      // 8. Thai kỳ: tuyệt đối cấm ARNI, MRA, SGLT2i, Ivabradine, Vericiguat, Semaglutide
      if (patient.conditions?.pregnant) {
        for (const rec of [arniRec, mraRec, sglt2iRec, ivabradineRec, semaRec]) {
          if (rec && ['START', 'UPTITRATE', 'CONTINUE', 'CONSIDER', 'SWITCH'].includes(rec.action)) {
            violations++;
            violationLog.push(`Ca ${i}: Thai kỳ nhưng ${rec.drugId} vẫn được ${rec.action}!`);
          }
        }
      }

      // 9. Lọc máu: không khởi trị thường quy ARNI, MRA, SGLT2i
      if (patient.conditions?.onDialysis) {
        for (const rec of [arniRec, mraRec, sglt2iRec]) {
          if (rec && (rec.action === 'START' || rec.action === 'UPTITRATE')) {
            violations++;
            violationLog.push(`Ca ${i}: Đang lọc máu nhưng ${rec.drugId} vẫn được ${rec.action}!`);
          }
        }
      }

      // 10. NYHA IV cấm ICD dự phòng tiên phát; QRS < 130 ms cấm CRT
      if (patient.nyha === 4 && plan.recommendations.some((r) => r.id === 'rec_hf_icd_start')) {
        violations++;
        violationLog.push(`Ca ${i}: NYHA IV vẫn sinh rec_hf_icd_start!`);
      }
      const qrs = Number(patient.customInputs?.qrsDuration ?? 150);
      if (qrs < 130 && plan.recommendations.some((r) => r.id === 'rec_hf_crt_start')) {
        violations++;
        violationLog.push(`Ca ${i}: QRS ${qrs} ms < 130 ms vẫn sinh rec_hf_crt_start!`);
      }

      // 11. HFpEF (LVEF >= 50%): không ép START ARNI/BB, Semaglutide chỉ CONSIDER/CONTINUE (không START)
      if ((patient.lvef ?? 0) >= 50) {
        if (arniRec && arniRec.action === 'START') {
          violations++;
          violationLog.push(`Ca ${i}: HFpEF nhưng ARNI bị ép START!`);
        }
        if (semaRec && semaRec.action === 'START') {
          violations++;
          violationLog.push(`Ca ${i}: HFpEF nhưng Semaglutide bị ép START thay vì CONSIDER!`);
        }
      }

      // 12. Nội viện SBP < 90 mmHg (sốc tim / tụt HA): Furosemide tĩnh mạch không được START trước khi ổn định huyết động
      if (isInpatient && sbp < 90) {
        const furoRec = plan.recommendations.find((r) => r.drugId === 'furosemide');
        if (furoRec && furoRec.action === 'START') {
          violations++;
          violationLog.push(`Ca ${i}: Nội viện SBP=${sbp} < 90 nhưng Furosemide vẫn START!`);
        }
      }
    }

    if (violations > 0) {
      console.error(`Phát hiện ${violations} vi phạm bất biến:\n` + violationLog.slice(0, 10).join('\n'));
    }
    expect(violations).toBe(0);
  }, 120000);

  it('Suite 2 (QA-1 / QA-9 Fail-Closed): Chạy 8.000 ca thiếu dữ liệu ngẫu nhiên, đảm bảo 0 vi phạm khởi trị/tăng liều', () => {
    const TOTAL_CASES = 8000;
    let violations = 0;
    const violationLog: string[] = [];

    for (let i = 0; i < TOTAL_CASES; i++) {
      const patient = generateRandomHfPatient(i + 8000);
      // Xóa thuốc đang dùng để kiểm tra nghiêm ngặt hành vi khởi trị mới khi thiếu dữ liệu
      patient.currentMeds = [];
      patient.conditions!.pregnant = false;
      patient.conditions!.onDialysis = false;

      const omitK = Math.random() < 0.3;
      const omitScr = Math.random() < 0.3;
      const omitSbp = Math.random() < 0.3;
      const omitHr = Math.random() < 0.3;
      const omitEf = Math.random() < 0.3;

      if (omitK) patient.k = undefined;
      if (omitScr) patient.scr = undefined;
      if (omitSbp) patient.sbp = undefined;
      if (omitHr) patient.hr = undefined;
      if (omitEf) patient.lvef = undefined;

      const plan = evaluate(patient, defaultSettings);

      const arniRec = plan.recommendations.find((r) => r.drugId === 'sacubitril_valsartan');
      const mraRec = plan.recommendations.find(
        (r) => r.drugId === 'spironolactone' || r.drugId === 'eplerenone' || r.drugId === 'finerenone'
      );
      const bbRec = plan.recommendations.find(
        (r) =>
          r.drugId === 'bisoprolol' ||
          r.drugId === 'carvedilol' ||
          r.drugId === 'metoprolol_succinate' ||
          r.drugId === 'nebivolol'
      );
      const sglt2iRec = plan.recommendations.find(
        (r) => r.drugId === 'dapagliflozin' || r.drugId === 'empagliflozin'
      );

      if (omitK) {
        if (mraRec && (mraRec.action === 'START' || mraRec.action === 'UPTITRATE')) {
          violations++;
          violationLog.push(`Ca ${i}: Thiếu K+ nhưng MRA vẫn được ${mraRec.action}!`);
        }
        if (arniRec && (arniRec.action === 'START' || arniRec.action === 'UPTITRATE')) {
          violations++;
          violationLog.push(`Ca ${i}: Thiếu K+ nhưng ARNI vẫn được ${arniRec.action}!`);
        }
        if (!plan.recommendations.some((r) => r.id === 'missing_input_k')) {
          violations++;
          violationLog.push(`Ca ${i}: Thiếu K+ nhưng không sinh missing_input_k!`);
        }
      }

      if (omitScr) {
        if (mraRec && (mraRec.action === 'START' || mraRec.action === 'UPTITRATE')) {
          violations++;
          violationLog.push(`Ca ${i}: Thiếu eGFR nhưng MRA vẫn được ${mraRec.action}!`);
        }
        if (sglt2iRec && sglt2iRec.action === 'START') {
          violations++;
          violationLog.push(`Ca ${i}: Thiếu eGFR nhưng SGLT2i vẫn được START!`);
        }
        if (!plan.recommendations.some((r) => r.id === 'missing_input_egfr')) {
          violations++;
          violationLog.push(`Ca ${i}: Thiếu eGFR nhưng không sinh missing_input_egfr!`);
        }
      }

      if (omitSbp) {
        for (const rec of [arniRec, bbRec, mraRec, sglt2iRec]) {
          if (rec && (rec.action === 'START' || rec.action === 'UPTITRATE')) {
            violations++;
            violationLog.push(`Ca ${i}: Thiếu SBP nhưng ${rec.drugId} vẫn được ${rec.action}!`);
          }
        }
        if (!plan.recommendations.some((r) => r.id === 'missing_input_sbp')) {
          violations++;
          violationLog.push(`Ca ${i}: Thiếu SBP nhưng không sinh missing_input_sbp!`);
        }
      }

      if (omitHr) {
        if (bbRec && (bbRec.action === 'START' || bbRec.action === 'UPTITRATE')) {
          violations++;
          violationLog.push(`Ca ${i}: Thiếu HR nhưng BB vẫn được ${bbRec.action}!`);
        }
        if (!plan.recommendations.some((r) => r.id === 'missing_input_hr')) {
          violations++;
          violationLog.push(`Ca ${i}: Thiếu HR nhưng không sinh missing_input_hr!`);
        }
      }

      if (omitEf) {
        for (const rec of [arniRec, bbRec, mraRec, sglt2iRec]) {
          if (rec && (rec.action === 'START' || rec.action === 'UPTITRATE')) {
            violations++;
            violationLog.push(`Ca ${i}: Thiếu LVEF nhưng trụ cột ${rec.drugId} vẫn được ${rec.action}!`);
          }
        }
        const gatedExtras = plan.recommendations.filter(
          (r) =>
            r.drugId === 'ivabradine' ||
            r.drugId === 'vericiguat' ||
            r.drugId === 'digoxin' ||
            r.drugId === 'semaglutide' ||
            r.id === 'rec_hf_icd_start' ||
            r.id === 'rec_hf_crt_start'
        );
        if (gatedExtras.length > 0) {
          violations++;
          violationLog.push(`Ca ${i}: Thiếu LVEF nhưng vẫn sinh chỉ định phụ thuộc LVEF!`);
        }
        if (!plan.recommendations.some((r) => r.id === 'missing_input_lvef')) {
          violations++;
          violationLog.push(`Ca ${i}: Thiếu LVEF nhưng không sinh missing_input_lvef!`);
        }
      }
    }

    if (violations > 0) {
      console.error(`Phát hiện ${violations} vi phạm fail-closed:\n` + violationLog.slice(0, 10).join('\n'));
    }
    expect(violations).toBe(0);
  }, 120000);
});
