/**
 * GDMT-VN Lipid Module - Renal Function (eGFR) Dosing Matrix (Statin Rows)
 * Phân quyền: Agent I3 / Agent I5 (Round 3 Remediation)
 */

import type { MatrixRowData } from '../../engine/types';
import { thFor } from '../../kb-types';

export function buildLipidEgfrStatinRows(): MatrixRowData[] {
  const atorvaHighMax = thFor('dose_mg', 'lipid.dose.atorva_high_max');
  const atorvaModMin = thFor('dose_mg', 'lipid.dose.atorva_moderate_start');
  const atorvaModMax = thFor('dose_mg', 'lipid.dose.atorva_moderate_max');
  const rosuvaStart = thFor('dose_mg', 'lipid.dose.rosuva_asian_start');
  const rosuvaHighMax = thFor('dose_mg', 'lipid.dose.rosuva_high_max');
  const rosuvaCkdMax = thFor('dose_mg', 'lipid.dose.rosuva_severe_ckd_max');
  const simvaStartCkd = thFor('dose_mg', 'lipid.dose.simva_severe_ckd_start');
  const simvaMax = thFor('dose_mg', 'lipid.dose.simva_max');
  const simvaContra = thFor('dose_mg', 'lipid.dose.simva_contra_dose');
  const pravaCkdStart = thFor('dose_mg', 'lipid.dose.pravastatin_ckd_start');
  const pravaCkdMax = thFor('dose_mg', 'lipid.dose.pravastatin_ckd_max');
  const pitaRenalStart = thFor('dose_mg', 'lipid.dose.pita_renal_start');
  const pitaCkdMax = thFor('dose_mg', 'lipid.dose.pita_ckd_max');
  const pitaModStart = thFor('dose_mg', 'lipid.dose.pita_moderate_start');
  const pitaMax = thFor('dose_mg', 'lipid.dose.pita_max');
  const ezeDose = thFor('dose_mg', 'lipid.dose.ezetimibe_standard');
  const egfrSevere = thFor('egfr', 'lipid.safety.egfr_severe_ckd');

  return [
    {
      drugId: 'atorvastatin',
      nameVi: 'Atorvastatin (Statin thải trừ chủ yếu qua gan - mật)',
      cells: {
        g1_g2: {
          initiate: 'rec',
          continue: 'rec',
          dose: `${atorvaModMin}–${atorvaHighMax} mg/ngày`,
          note: 'Không cần chỉnh liều theo thận',
          citationIds: ['acc.lipid.2026.statin_doses']
        },
        g3a: {
          initiate: 'rec',
          continue: 'rec',
          dose: `${atorvaModMin}–${atorvaHighMax} mg/ngày`,
          note: 'Không cần chỉnh liều',
          citationIds: ['kdigo.ckd.2024.rec_3_15_1_1_statin_egfr_below_60', 'acc.lipid.2026.statin_doses']
        },
        g3b: {
          initiate: 'rec',
          continue: 'rec',
          dose: `${atorvaModMin}–${atorvaHighMax} mg/ngày`,
          note: 'Statin ưu tiên hàng đầu ở CKD',
          citationIds: ['kdigo.ckd.2024.rec_3_15_1_1_statin_egfr_below_60', 'acc.lipid.2026.statin_doses']
        },
        g4: {
          initiate: 'rec',
          continue: 'rec',
          dose: `${atorvaModMin}–${atorvaHighMax} mg/ngày`,
          note: `Không cần chỉnh liều ngay cả khi eGFR < ${egfrSevere}`,
          citationIds: ['kdigo.ckd.2024.rec_3_15_1_1_statin_egfr_below_60', 'acc.lipid.2026.statin_doses']
        },
        g5: {
          initiate: 'rec',
          continue: 'rec',
          dose: `${atorvaModMin}–${atorvaHighMax} mg/ngày`,
          note: 'Dùng được đầy đủ dải liều ở G5 chưa lọc máu',
          citationIds: ['kdigo.ckd.2024.rec_3_15_1_1_statin_egfr_below_60', 'acc.lipid.2026.statin_doses']
        },
        dialysis: {
          initiate: 'caution',
          continue: 'ok',
          dose: `Duy trì nếu đã dùng; ASCVD chưa dùng: cân nhắc ${atorvaModMin}–${atorvaModMax} mg`,
          note: 'Không khởi trị mới nếu không kèm ASCVD (Class III); cân nhắc nếu có ASCVD (ESC 2026 IIb)',
          citationIds: [
            'esc.lipid.2019.ckd_dialysis_no_init',
            'esc.lipid.2019.ckd_dialysis_continue',
            'esc.ckd.2026.dialysis_ascvd_statin_consider',
            'acc.lipid.2026.statin_doses'
          ]
        }
      }
    },
    {
      drugId: 'rosuvastatin',
      nameVi: 'Rosuvastatin (Statin ưa nước - giới hạn liều ở CKD nặng)',
      cells: {
        g1_g2: {
          initiate: 'rec',
          continue: 'rec',
          dose: `${rosuvaStart}–${rosuvaHighMax} mg/ngày`,
          note: `Khởi đầu ${rosuvaStart} mg ở cơ địa châu Á`,
          citationIds: ['fda.rosuvastatin.asian_dose', 'acc.lipid.2026.statin_doses']
        },
        g3a: {
          initiate: 'rec',
          continue: 'rec',
          dose: `${rosuvaStart}–${rosuvaHighMax} mg/ngày`,
          note: 'Không cần chỉnh liều ở CKD nhẹ – vừa',
          citationIds: ['fda.rosuvastatin.renal_impairment', 'acc.lipid.2026.statin_doses']
        },
        g3b: {
          initiate: 'caution',
          continue: 'ok',
          dose: `${rosuvaStart}–${rosuvaHighMax} mg/ngày`,
          note: 'Không bắt buộc giảm trần liều ở G3b nhưng cần theo dõi sát eGFR và triệu chứng cơ',
          citationIds: ['fda.rosuvastatin.renal_impairment', 'acc.lipid.2026.statin_doses']
        },
        g4: {
          initiate: 'caution',
          continue: 'caution',
          dose: `Khởi đầu ${rosuvaStart} mg, tối đa ${rosuvaCkdMax} mg/ngày`,
          note: `Không vượt quá ${rosuvaCkdMax} mg/ngày khi eGFR < ${egfrSevere}`,
          citationIds: ['fda.rosuvastatin.renal_impairment']
        },
        g5: {
          initiate: 'caution',
          continue: 'caution',
          dose: `Khởi đầu ${rosuvaStart} mg, tối đa ${rosuvaCkdMax} mg/ngày`,
          note: `Tăng gấp ~3 lần phơi nhiễm huyết tương; trần ≤ ${rosuvaCkdMax} mg/ngày`,
          citationIds: ['fda.rosuvastatin.renal_impairment']
        },
        dialysis: {
          initiate: 'not_rec',
          continue: 'caution',
          dose: `Tránh khởi trị mới (nếu tiếp tục: ≤ ${rosuvaCkdMax} mg)`,
          note: 'Không khởi trị mới ở lọc máu chưa có ASCVD (dữ liệu AURORA)',
          citationIds: ['esc.lipid.2019.ckd_dialysis_no_init', 'fda.rosuvastatin.renal_impairment']
        }
      }
    },
    {
      drugId: 'simvastatin',
      nameVi: 'Simvastatin (Statin - dữ liệu SHARP khi phối hợp Ezetimibe)',
      cells: {
        g1_g2: {
          initiate: 'ok',
          continue: 'ok',
          dose: `${atorvaModMin}–${simvaMax} mg/ngày`,
          note: `Không dùng liều ${simvaContra} mg`,
          citationIds: ['acc.lipid.2026.simva_contra_80mg', 'acc.lipid.2026.simvastatin_dose']
        },
        g3a: {
          initiate: 'ok',
          continue: 'ok',
          dose: `${atorvaModMax} mg/ngày (± Ezetimibe ${ezeDose} mg)`,
          note: 'Liều chuẩn trong thử nghiệm SHARP',
          citationIds: [
            'kdigo.ckd.2024.rec_3_15_1_1_statin_egfr_below_60',
            'acc.lipid.2026.simvastatin_dose',
            'esc.lipid.2019.ezetimibe_add_on'
          ]
        },
        g3b: {
          initiate: 'ok',
          continue: 'ok',
          dose: `${atorvaModMax} mg/ngày (± Ezetimibe ${ezeDose} mg)`,
          note: 'Phối hợp Simvastatin + Ezetimibe giảm biến cố xơ vữa ở CKD',
          citationIds: [
            'kdigo.ckd.2024.rec_3_15_1_1_statin_egfr_below_60',
            'acc.lipid.2026.simvastatin_dose',
            'esc.lipid.2019.ezetimibe_add_on'
          ]
        },
        g4: {
          initiate: 'caution',
          continue: 'caution',
          dose: `Khởi đầu ${simvaStartCkd} mg/ngày, chỉnh thận trọng`,
          note: 'Suy thận nặng cần khởi đầu thận trọng và theo dõi cơ',
          citationIds: ['acc.lipid.2026.simvastatin_dose']
        },
        g5: {
          initiate: 'caution',
          continue: 'caution',
          dose: `Khởi đầu ${simvaStartCkd} mg/ngày`,
          note: 'Theo dõi chặt CK và tương tác thuốc',
          citationIds: ['acc.lipid.2026.simvastatin_dose']
        },
        dialysis: {
          initiate: 'not_rec',
          continue: 'ok',
          note: 'Chỉ duy trì nếu đã uống trước lọc máu; không khởi trị mới không kèm ASCVD',
          citationIds: ['esc.lipid.2019.ckd_dialysis_no_init', 'esc.lipid.2019.ckd_dialysis_continue']
        }
      }
    },
    {
      drugId: 'pravastatin',
      nameVi: 'Pravastatin (Statin ưa nước cường độ trung bình)',
      cells: {
        g1_g2: {
          initiate: 'ok',
          continue: 'ok',
          dose: `${pravaCkdMax}–${atorvaHighMax} mg/ngày`,
          note: 'Ít tương tác CYP3A4',
          citationIds: ['acc.lipid.2026.pravastatin_dose']
        },
        g3a: {
          initiate: 'ok',
          continue: 'ok',
          dose: `${atorvaModMax}–${pravaCkdMax} mg/ngày`,
          note: 'Dung nạp tốt',
          citationIds: ['acc.lipid.2026.pravastatin_dose', 'acc.lipid.2026.statin_doses']
        },
        g3b: {
          initiate: 'ok',
          continue: 'ok',
          dose: `${atorvaModMax}–${pravaCkdMax} mg/ngày`,
          note: 'Dung nạp tốt',
          citationIds: ['acc.lipid.2026.pravastatin_dose', 'acc.lipid.2026.statin_doses']
        },
        g4: {
          initiate: 'caution',
          continue: 'caution',
          dose: `Khởi đầu ${pravaCkdStart} mg, tối đa ${pravaCkdMax} mg/ngày`,
          note: `Khởi đầu ${pravaCkdStart} mg/ngày và giới hạn ≤ ${pravaCkdMax} mg/ngày ở suy thận nặng`,
          citationIds: ['acc.lipid.2026.pravastatin_dose']
        },
        g5: {
          initiate: 'caution',
          continue: 'caution',
          dose: `Khởi đầu ${pravaCkdStart} mg, tối đa ${pravaCkdMax} mg/ngày`,
          note: `Không vượt quá ${pravaCkdMax} mg/ngày ở suy thận nặng`,
          citationIds: ['acc.lipid.2026.pravastatin_dose']
        },
        dialysis: {
          initiate: 'not_rec',
          continue: 'ok',
          note: 'Chỉ tiếp tục nếu đã dùng trước lọc máu; không khởi trị mới không kèm ASCVD',
          citationIds: ['esc.lipid.2019.ckd_dialysis_no_init', 'esc.lipid.2019.ckd_dialysis_continue']
        }
      }
    },
    {
      drugId: 'pitavastatin',
      nameVi: 'Pitavastatin (Statin cường độ trung bình - REPRIEVE)',
      cells: {
        g1_g2: {
          initiate: 'ok',
          continue: 'ok',
          dose: `${pitaModStart}–${pitaMax} mg/ngày`,
          note: 'Ít ảnh hưởng đường huyết; ưu tiên ở người nhiễm HIV (REPRIEVE)',
          citationIds: ['acc.lipid.2026.pitavastatin_dose', 'esc.lipid.2025.hiv_reprieve_pitavastatin_4mg']
        },
        g3a: {
          initiate: 'caution',
          continue: 'caution',
          dose: `Khởi đầu ${pitaRenalStart} mg, tối đa ${pitaCkdMax} mg/ngày`,
          note: `Giới hạn tối đa ${pitaCkdMax} mg/ngày ở CKD mức độ vừa`,
          citationIds: ['acc.lipid.2026.pitavastatin_dose']
        },
        g3b: {
          initiate: 'caution',
          continue: 'caution',
          dose: `Khởi đầu ${pitaRenalStart} mg, tối đa ${pitaCkdMax} mg/ngày`,
          note: `Giới hạn tối đa ${pitaCkdMax} mg/ngày`,
          citationIds: ['acc.lipid.2026.pitavastatin_dose']
        },
        g4: {
          initiate: 'caution',
          continue: 'caution',
          dose: `Khởi đầu ${pitaRenalStart} mg, tối đa ${pitaCkdMax} mg/ngày`,
          note: `Không vượt quá ${pitaCkdMax} mg/ngày ở suy thận nặng`,
          citationIds: ['acc.lipid.2026.pitavastatin_dose']
        },
        g5: {
          initiate: 'caution',
          continue: 'caution',
          dose: `${pitaRenalStart}–${pitaCkdMax} mg/ngày`,
          note: 'Thận trọng tối đa ở G5 chưa lọc máu',
          citationIds: ['acc.lipid.2026.pitavastatin_dose']
        },
        dialysis: {
          initiate: 'not_rec',
          continue: 'caution',
          dose: `Nếu duy trì: ${pitaRenalStart}–${pitaCkdMax} mg/ngày`,
          note: 'Không khởi trị mới ở lọc máu không kèm ASCVD',
          citationIds: ['acc.lipid.2026.pitavastatin_dose', 'esc.lipid.2019.ckd_dialysis_no_init']
        }
      }
    }
  ];
}
