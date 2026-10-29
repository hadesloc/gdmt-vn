/**
 * GDMT-VN Lipid Module - Renal Function (eGFR) Dosing Matrix (Non-Statin & Builder)
 * Phân quyền: Agent I3
 */

import type { MatrixDefinition, MatrixRowData } from '../../engine/types';
import { thFor } from '../../kb-types';
import { buildLipidEgfrStatinRows } from './matrix.egfr.statin';

export function buildLipidEgfrNonStatinRows(): MatrixRowData[] {
  const ezeDose = thFor('dose_mg', 'lipid.dose.ezetimibe_standard');
  const evoBiweekly = thFor('dose_mg', 'lipid.dose.evolocumab_biweekly');
  const bempDose = thFor('dose_mg', 'lipid.dose.bempedoic_standard');
  const fenoStart = thFor('dose_mg', 'lipid.dose.fenofibrate_start_145');
  const fenoMax = thFor('dose_mg', 'lipid.dose.fenofibrate_standard');
  const fenoReduced = thFor('dose_mg', 'lipid.dose.fenofibrate_reduced');
  const icosapentDaily = thFor('dose_g', 'lipid.dose.icosapent_daily');
  const egfrSevere = thFor('egfr', 'lipid.safety.egfr_severe_ckd');

  return [
    {
      drugId: 'ezetimibe',
      nameVi: 'Ezetimibe (Ức chế hấp thu cholesterol)',
      cells: {
        g1_g2: {
          initiate: 'rec',
          continue: 'rec',
          dose: `${ezeDose} mg/ngày`,
          note: 'Không cần chỉnh liều',
          citationIds: ['esc.lipid.2019.ezetimibe_add_on']
        },
        g3a: {
          initiate: 'rec',
          continue: 'rec',
          dose: `${ezeDose} mg/ngày`,
          note: 'Phối hợp chuẩn với Statin ở CKD',
          citationIds: ['kdigo.ckd.2024.rec_3_15_1_1_statin_egfr_below_60', 'esc.lipid.2019.ezetimibe_add_on']
        },
        g3b: {
          initiate: 'rec',
          continue: 'rec',
          dose: `${ezeDose} mg/ngày`,
          note: 'Không cần chỉnh liều theo eGFR',
          citationIds: ['kdigo.ckd.2024.rec_3_15_1_1_statin_egfr_below_60', 'esc.lipid.2019.ezetimibe_add_on']
        },
        g4: {
          initiate: 'rec',
          continue: 'rec',
          dose: `${ezeDose} mg/ngày`,
          note: 'Giúp đạt đích LDL-C mà không cần đẩy quá cao liều statin thải qua thận',
          citationIds: ['kdigo.ckd.2024.rec_3_15_1_1_statin_egfr_below_60', 'esc.lipid.2019.ezetimibe_add_on']
        },
        g5: {
          initiate: 'rec',
          continue: 'rec',
          dose: `${ezeDose} mg/ngày`,
          note: 'Không cần chỉnh liều',
          citationIds: ['kdigo.ckd.2024.rec_3_15_1_1_statin_egfr_below_60', 'esc.lipid.2019.ezetimibe_add_on']
        },
        dialysis: {
          initiate: 'caution',
          continue: 'ok',
          dose: `${ezeDose} mg/ngày (duy trì nếu đã dùng)`,
          note: 'Tiếp tục duy trì nếu đã dùng phối hợp từ trước lọc máu',
          citationIds: ['esc.lipid.2019.ckd_dialysis_continue', 'esc.lipid.2019.ezetimibe_add_on']
        }
      }
    },
    {
      drugId: 'evolocumab',
      nameVi: 'Evolocumab / Alirocumab / Inclisiran (Ức chế PCSK9)',
      cells: {
        g1_g2: {
          initiate: 'ok',
          continue: 'ok',
          dose: `Evolocumab ${evoBiweekly} mg/2 tuần`,
          note: 'Không thải trừ qua thận',
          citationIds: ['fda.evolocumab.dose']
        },
        g3a: {
          initiate: 'ok',
          continue: 'ok',
          dose: `Evolocumab ${evoBiweekly} mg/2 tuần`,
          note: 'Không cần chỉnh liều',
          citationIds: ['fda.evolocumab.dose']
        },
        g3b: {
          initiate: 'ok',
          continue: 'ok',
          dose: `Evolocumab ${evoBiweekly} mg/2 tuần`,
          note: 'Không cần chỉnh liều',
          citationIds: ['fda.evolocumab.dose']
        },
        g4: {
          initiate: 'ok',
          continue: 'ok',
          dose: `Evolocumab ${evoBiweekly} mg/2 tuần`,
          note: 'An toàn ở CKD G4; không cần chỉnh liều',
          citationIds: ['fda.evolocumab.dose']
        },
        g5: {
          initiate: 'caution',
          continue: 'caution',
          note: 'Kháng thể đơn dòng phân giải qua hệ lưới nội mô, dữ liệu G5 còn hạn chế',
          citationIds: ['fda.evolocumab.dose']
        },
        dialysis: {
          initiate: 'no_data',
          continue: 'caution',
          note: 'Dữ liệu lâm sàng rất hạn chế; hội chẩn chuyên khoa tim mạch – thận',
          citationIds: ['fda.evolocumab.dose']
        }
      }
    },
    {
      drugId: 'bempedoic_acid',
      nameVi: 'Bempedoic acid (Ức chế ACL)',
      cells: {
        g1_g2: {
          initiate: 'ok',
          continue: 'ok',
          dose: `${bempDose} mg/ngày`,
          note: 'Theo dõi acid uric máu',
          citationIds: ['fda.bempedoic.dose', 'fda.bempedoic.gout_risk']
        },
        g3a: {
          initiate: 'ok',
          continue: 'ok',
          dose: `${bempDose} mg/ngày`,
          note: 'Không cần chỉnh liều ở suy thận nhẹ – vừa',
          citationIds: ['fda.bempedoic.dose']
        },
        g3b: {
          initiate: 'caution',
          continue: 'caution',
          dose: `${bempDose} mg/ngày`,
          note: 'Theo dõi sát acid uric và creatinine',
          citationIds: ['fda.bempedoic.dose', 'fda.bempedoic.gout_risk']
        },
        g4: {
          initiate: 'caution',
          continue: 'caution',
          dose: `${bempDose} mg/ngày`,
          note: `Kinh nghiệm lâm sàng còn hạn chế ở eGFR < ${egfrSevere}`,
          citationIds: ['fda.bempedoic.dose']
        },
        g5: {
          initiate: 'not_rec',
          continue: 'not_rec',
          note: 'Chưa được nghiên cứu đầy đủ ở bệnh thận giai đoạn cuối',
          citationIds: ['fda.bempedoic.dose']
        },
        dialysis: {
          initiate: 'not_rec',
          continue: 'not_rec',
          note: 'Chưa được nghiên cứu ở bệnh nhân lọc máu',
          citationIds: ['fda.bempedoic.dose']
        }
      }
    },
    {
      drugId: 'fenofibrate',
      nameVi: 'Fenofibrate (Fibrate thải trừ mạnh qua thận)',
      cells: {
        g1_g2: {
          initiate: 'ok',
          continue: 'ok',
          dose: `${fenoStart}–${fenoMax} mg/ngày`,
          note: 'Kiểm tra creatinine nền và sau khởi trị',
          citationIds: [
            'acc.lipid.2026.fenofibrate_dose_range',
            'byt.lipid.2020.fenofibrate_145_200',
            'byt.ckd.2024.fenofibrate_creatinine_monitor'
          ]
        },
        g3a: {
          initiate: 'caution',
          continue: 'caution',
          dose: `Khởi đầu liều thấp từ ${fenoReduced} mg/ngày`,
          note: 'Bắt buộc khởi đầu chế phẩm hàm lượng thấp và đánh giá lại thận trước khi tăng liều',
          citationIds: ['acc.lipid.2026.fenofibrate_renal', 'acc.lipid.2026.fenofibrate_dose_range']
        },
        g3b: {
          initiate: 'caution',
          continue: 'caution',
          dose: `Khởi đầu liều thấp từ ${fenoReduced} mg/ngày`,
          note: 'Nguy cơ tích lũy thuốc và tăng creatinine hồi phục; theo dõi sát thận & CK',
          citationIds: [
            'acc.lipid.2026.fenofibrate_renal',
            'byt.ckd.2024.fenofibrate_creatinine_monitor'
          ]
        },
        g4: {
          initiate: 'contra',
          continue: 'contra',
          note: `Chống chỉ định tuyệt đối khi eGFR < ${egfrSevere} mL/phút/1.73m²`,
          citationIds: ['acc.lipid.2026.fenofibrate_renal']
        },
        g5: {
          initiate: 'contra',
          continue: 'contra',
          note: 'Chống chỉ định tuyệt đối',
          citationIds: ['acc.lipid.2026.fenofibrate_renal']
        },
        dialysis: {
          initiate: 'contra',
          continue: 'contra',
          note: 'Không lọc sạch qua thẩm tách máu; chống chỉ định hoàn toàn',
          citationIds: ['acc.lipid.2026.fenofibrate_renal']
        }
      }
    },
    {
      drugId: 'icosapent_ethyl',
      nameVi: 'Icosapent ethyl / Omega-3 kê đơn',
      cells: {
        g1_g2: {
          initiate: 'ok',
          continue: 'ok',
          dose: `${icosapentDaily} g/ngày`,
          note: 'Không cần chỉnh liều theo thận',
          citationIds: ['esc.lipid.2019.htg_icosapent_ethyl']
        },
        g3a: {
          initiate: 'ok',
          continue: 'ok',
          dose: `${icosapentDaily} g/ngày`,
          note: 'Không cần chỉnh liều',
          citationIds: ['esc.lipid.2019.htg_icosapent_ethyl']
        },
        g3b: {
          initiate: 'ok',
          continue: 'ok',
          dose: `${icosapentDaily} g/ngày`,
          note: 'Lựa chọn hạ TG an toàn thận hơn Fibrate',
          citationIds: ['esc.lipid.2019.htg_icosapent_ethyl', 'acc.lipid.2026.htg_fibrate_omega3_pancreatitis']
        },
        g4: {
          initiate: 'caution',
          continue: 'caution',
          dose: `${icosapentDaily} g/ngày`,
          note: 'Thay thế Fibrate khi tăng TG nặng kèm suy thận nặng; chú ý nguy cơ chảy máu',
          citationIds: [
            'esc.lipid.2019.htg_icosapent_ethyl',
            'acc.lipid.2026.htg_fibrate_omega3_pancreatitis',
            'acc.lipid.2026.icosapent_af_bleeding'
          ]
        },
        g5: {
          initiate: 'caution',
          continue: 'caution',
          dose: `${icosapentDaily} g/ngày`,
          note: 'Thận trọng theo dõi chảy máu uremic',
          citationIds: ['esc.lipid.2019.htg_icosapent_ethyl', 'acc.lipid.2026.icosapent_af_bleeding']
        },
        dialysis: {
          initiate: 'caution',
          continue: 'caution',
          note: 'Chỉ cân nhắc khi tăng TG rất nặng nguy cơ viêm tụy; theo dõi chảy máu và rung nhĩ',
          citationIds: [
            'acc.lipid.2026.htg_fibrate_omega3_pancreatitis',
            'acc.lipid.2026.icosapent_af_bleeding'
          ]
        }
      }
    }
  ];
}

export function buildLipidEgfrMatrix(): MatrixDefinition {
  const egfrCkd = thFor('egfr', 'lipid.safety.egfr_ckd_cutoff');
  const egfrSevere = thFor('egfr', 'lipid.safety.egfr_severe_ckd');

  return {
    title: 'Ma trận hiệu chỉnh liều thuốc hạ lipid máu theo mức lọc cầu thận eGFR (KDIGO 2024 / ESC 2019–2026 / ACC 2026)',
    columns: [
      { id: 'g1_g2', label: `eGFR ≥ ${egfrCkd}`, subLabel: 'G1 – G2' },
      { id: 'g3a', label: 'eGFR 45–59', subLabel: 'G3a' },
      { id: 'g3b', label: `eGFR ${egfrSevere}–44`, subLabel: 'G3b' },
      { id: 'g4', label: `eGFR 15–<${egfrSevere}`, subLabel: 'G4 (Suy thận nặng)' },
      { id: 'g5', label: 'Mức lọc dưới 15', subLabel: 'G5 chưa lọc máu' },
      { id: 'dialysis', label: 'Lọc máu chu kỳ', subLabel: 'HD / PD' }
    ],
    rows: [...buildLipidEgfrStatinRows(), ...buildLipidEgfrNonStatinRows()]
  };
}

export const lipidEgfrMatrix: MatrixDefinition = buildLipidEgfrMatrix();
