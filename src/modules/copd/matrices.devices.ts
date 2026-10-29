import type { MatrixDefinition } from '../../engine/types';
import { drug, dose, fmtDose, thFor } from '../../kb-types';

const nebDoseMg = thFor('dose_mg', 'copd.salbutamol_nebulizer_dose');
const o2Min = thFor('restingSpo2', 'copd.oxygen_target_spo2_min');
const o2Max = thFor('restingSpo2', 'copd.oxygen_target_spo2_max');

export const copdMatrixDevices: MatrixDefinition = {
  title: 'Ma trận cá thể hóa lựa chọn thuốc – dụng cụ hít tại Việt Nam theo khả năng hít & phối hợp (BYT QĐ 2131/2026)',
  columns: [
    { id: 'flow_good', label: 'Lực hít đủ & Phối hợp tốt', subLabel: 'Đa số bệnh nhân ngoại trú' },
    { id: 'flow_weak', label: 'Lưu lượng hít yếu (PIFr thấp)', subLabel: 'Người cao tuổi / GOLD 3–4' },
    { id: 'poor_coord', label: 'Khó phối hợp tay – hít', subLabel: 'Run tay / Khó bấm đồng thì' },
    { id: 'acute_severe', label: 'Đợt cấp nặng / Thở nhanh mệt', subLabel: 'Nội viện / Cấp cứu' },
  ],
  rows: [
    {
      drugId: 'tiotropium',
      nameVi: `${drug('tiotropium').nameVi} (Spiriva Respimat – Hạt mịn SMI)`,
      cells: {
        flow_good: {
          initiate: 'rec',
          continue: 'rec',
          dose: fmtDose(dose('tiotropium', 'start')),
          note: 'LAMA chuẩn cho Nhóm A hoặc phối hợp thêm trên nền ICS+LABA',
          citationIds: ['byt.copd.2026.tiotropium_dose'],
        },
        flow_weak: {
          initiate: 'rec',
          continue: 'rec',
          dose: fmtDose(dose('tiotropium', 'start')),
          note: 'Ưu tiên Spiriva Respimat SMI (không chứa lactose, không dùng HandiHaler DPI) khi lực hít yếu hoặc dị ứng nặng đạm sữa',
          citationIds: ['byt.copd.2026.tiotropium_dose', 'byt.copd.2026.discharge_checklist'],
        },
        poor_coord: {
          initiate: 'rec',
          continue: 'rec',
          dose: fmtDose(dose('tiotropium', 'start')),
          note: 'Thời gian phun sương kéo dài giúp giảm lỗi bấm – hít không đồng bộ; có thể dùng kèm buồng đệm',
          citationIds: ['byt.copd.2026.tiotropium_dose', 'byt.copd.2026.discharge_checklist'],
        },
        acute_severe: {
          initiate: 'caution',
          continue: 'ok',
          note: 'Trong giai đoạn khó thở cấp nặng ưu tiên khí dung SABA/SAMA trước, duy trì lại SMI khi ổn định',
          citationIds: ['byt.copd.2026.salbutamol_neb_dose', 'byt.copd.2026.discharge_checklist'],
        },
      },
    },
    {
      drugId: 'tiotropium_olodaterol',
      nameVi: `${drug('tiotropium_olodaterol').nameVi} (Spiolto Respimat – Hạt mịn SMI)`,
      cells: {
        flow_good: {
          initiate: 'rec',
          continue: 'rec',
          dose: fmtDose(dose('tiotropium_olodaterol', 'start')),
          note: 'Phối hợp LABA+LAMA ưu tiên cho Nhóm B và Nhóm E (an toàn khi dùng thuốc ức chế mạnh CYP3A4)',
          citationIds: ['gold.copd.2026.initial_group_b', 'gold.copd.2026.initial_group_e'],
        },
        flow_weak: {
          initiate: 'rec',
          continue: 'rec',
          dose: fmtDose(dose('tiotropium_olodaterol', 'start')),
          note: 'Thiết bị SMI không chứa lactose, không đòi hỏi lưu lượng đỉnh hít vào cao như bình bột khô DPI',
          citationIds: ['byt.copd.2026.discharge_checklist'],
        },
        poor_coord: {
          initiate: 'rec',
          continue: 'rec',
          dose: fmtDose(dose('tiotropium_olodaterol', 'start')),
          note: 'Phun hạt mịn chậm dễ hít sâu vào phổi hơn pMDI thông thường',
          citationIds: ['byt.copd.2026.discharge_checklist'],
        },
        acute_severe: {
          initiate: 'caution',
          continue: 'ok',
          note: 'Tạm ưu tiên khí dung giãn phế quản tác dụng ngắn khi suy hô hấp cấp, chuyển lại trước xuất viện',
          citationIds: ['byt.copd.2026.discharge_checklist'],
        },
      },
    },
    {
      drugId: 'umeclidinium_vilanterol',
      nameVi: `${drug('umeclidinium_vilanterol').nameVi} (Anoro Ellipta – Bột khô DPI)`,
      cells: {
        flow_good: {
          initiate: 'rec',
          continue: 'rec',
          dose: fmtDose(dose('umeclidinium_vilanterol', 'start')),
          note: 'LABA+LAMA 1 lần/ngày trong bình Ellipta; tránh phối hợp thuốc ức chế mạnh CYP3A4 (clarithromycin, itraconazole, ritonavir) do tăng phơi nhiễm vilanterol',
          citationIds: ['byt.copd.2026.vilanterol_umeclidinium_dose', 'byt.copd.2026.salmeterol_cyp3a4_contra'],
        },
        flow_weak: {
          initiate: 'caution',
          continue: 'caution',
          note: 'Bình bột khô DPI chứa lactose cần lưu lượng hít đủ mạnh; nếu lực hít yếu hoặc dị ứng nặng đạm sữa nên chuyển sang SMI (Spiolto Respimat)',
          citationIds: ['byt.copd.2026.discharge_checklist', 'gold.copd.2026.followup_dyspnea_switch_device'],
        },
        poor_coord: {
          initiate: 'rec',
          continue: 'rec',
          dose: fmtDose(dose('umeclidinium_vilanterol', 'start')),
          note: 'Thao tác mở nắp – hít sâu – đóng nắp đơn giản, không đòi hỏi phối hợp bấm – hít đồng thì',
          citationIds: ['byt.copd.2026.vilanterol_umeclidinium_dose', 'byt.copd.2026.discharge_checklist'],
        },
        acute_severe: {
          initiate: 'not_rec',
          continue: 'caution',
          note: 'Không khởi đầu bình bột khô DPI khi đang khó thở cấp nặng; đánh giá lại lực hít trước khi xuất viện',
          citationIds: ['byt.copd.2026.discharge_checklist'],
        },
      },
    },
    {
      drugId: 'glycopyrronium_indacaterol',
      nameVi: `${drug('glycopyrronium_indacaterol').nameVi} (Ultibro Breezhaler – Bột khô DPI)`,
      cells: {
        flow_good: {
          initiate: 'rec',
          continue: 'rec',
          dose: fmtDose(dose('glycopyrronium_indacaterol', 'start')),
          note: 'LABA+LAMA dùng 1 lần/ngày thuận tiện khi lực hít đủ mạnh',
          citationIds: ['byt.copd.2026.indacaterol_glycopyrronium_dose'],
        },
        flow_weak: {
          initiate: 'caution',
          continue: 'caution',
          note: 'Thận trọng/tránh dùng DPI nếu lưu lượng hít quá yếu không đủ phân tán bột thuốc; nên chuyển sang SMI hoặc pMDI + buồng đệm',
          citationIds: ['byt.copd.2026.discharge_checklist', 'gold.copd.2026.followup_dyspnea_switch_device'],
        },
        poor_coord: {
          initiate: 'ok',
          continue: 'ok',
          dose: fmtDose(dose('glycopyrronium_indacaterol', 'start')),
          note: 'Kích hoạt bằng luồng hít nên không cần phối hợp bấm – hít, nhưng cần lắp viên nang đúng cách',
          citationIds: ['byt.copd.2026.indacaterol_glycopyrronium_dose'],
        },
        acute_severe: {
          initiate: 'not_rec',
          continue: 'caution',
          note: 'Bệnh nhân khó thở cấp nặng thường không đủ lực hít cho bình bột khô DPI',
          citationIds: ['byt.copd.2026.discharge_checklist'],
        },
      },
    },
    {
      drugId: 'fluticasone_furoate_umeclidinium_vilanterol',
      nameVi: `${drug('fluticasone_furoate_umeclidinium_vilanterol').nameVi} (Trelegy Ellipta – Bột khô DPI)`,
      cells: {
        flow_good: {
          initiate: 'rec',
          continue: 'rec',
          dose: fmtDose(dose('fluticasone_furoate_umeclidinium_vilanterol', 'start')),
          note: 'Bộ ba 1 bình hít dùng 1 lần/ngày; chống chỉ định/tránh phối hợp thuốc ức chế mạnh CYP3A4 (tăng phơi nhiễm fluticasone furoate & vilanterol gây hội chứng Cushing/loạn nhịp)',
          citationIds: ['gold.copd.2026.initial_group_e_triple_eos300', 'byt.copd.2026.salmeterol_cyp3a4_contra'],
        },
        flow_weak: {
          initiate: 'caution',
          continue: 'caution',
          note: 'Bình bột khô DPI chứa lactose cần lưu lượng hít đủ mạnh; nếu lực hít yếu hoặc dị ứng đạm sữa nên chuyển sang ba thuốc dạng pMDI kèm buồng đệm',
          citationIds: ['byt.copd.2026.discharge_checklist', 'gold.copd.2026.followup_dyspnea_switch_device'],
        },
        poor_coord: {
          initiate: 'rec',
          continue: 'rec',
          dose: fmtDose(dose('fluticasone_furoate_umeclidinium_vilanterol', 'start')),
          note: 'Thao tác rất đơn giản (mở nắp – hít sâu – đóng nắp), không đòi hỏi bấm đồng thì',
          citationIds: ['byt.copd.2026.discharge_checklist'],
        },
        acute_severe: {
          initiate: 'not_rec',
          continue: 'caution',
          note: 'Không khởi đầu DPI khi đang suy hô hấp cấp; đánh giá lại lực hít trước khi xuất viện',
          citationIds: ['byt.copd.2026.discharge_checklist'],
        },
      },
    },
    {
      drugId: 'budesonide_glycopyrronium_formoterol',
      nameVi: `${drug('budesonide_glycopyrronium_formoterol').nameVi} (Breztri Aerosphere – Bình xịt pMDI)`,
      cells: {
        flow_good: {
          initiate: 'rec',
          continue: 'rec',
          dose: fmtDose(dose('budesonide_glycopyrronium_formoterol', 'start')),
          note: 'Phác đồ ba thuốc dạng bình xịt định liều pMDI không chứa lactose; nếu dùng thuốc ức chế mạnh CYP3A4 cần chuyển sang Trimbow pMDI (beclometasone)',
          citationIds: ['gold.copd.2026.initial_group_e_triple_eos300'],
        },
        flow_weak: {
          initiate: 'rec',
          continue: 'rec',
          dose: fmtDose(dose('budesonide_glycopyrronium_formoterol', 'start')),
          note: 'Lựa chọn ba thuốc phù hợp cho người có lưu lượng hít yếu hoặc dị ứng đạm sữa khi kết hợp với buồng đệm (spacer)',
          citationIds: ['byt.copd.2026.discharge_checklist', 'gold.copd.2026.followup_dyspnea_switch_device'],
        },
        poor_coord: {
          initiate: 'caution',
          continue: 'caution',
          dose: fmtDose(dose('budesonide_glycopyrronium_formoterol', 'start')),
          note: 'Bắt buộc hướng dẫn dùng kèm buồng đệm nếu bệnh nhân khó phối hợp bấm – hít đồng thời',
          citationIds: ['byt.copd.2026.discharge_checklist'],
        },
        acute_severe: {
          initiate: 'caution',
          continue: 'ok',
          note: 'Có thể dùng qua buồng đệm khi bệnh nhân qua giai đoạn suy hô hấp nguy kịch',
          citationIds: ['byt.copd.2026.discharge_checklist'],
        },
      },
    },
    {
      drugId: 'salbutamol',
      nameVi: `${drug('salbutamol').nameVi} (Máy phun khí dung nén khí / pMDI + buồng đệm cắt cơn)`,
      cells: {
        flow_good: {
          initiate: 'ok',
          continue: 'ok',
          dose: fmtDose(dose('salbutamol', 'start')),
          note: 'Ngoại trú ưu tiên pMDI kèm buồng đệm cắt cơn khi cần; không dùng SABA đơn độc thay thế thuốc duy trì dài hạn',
          citationIds: ['gold.copd.2026.exac_saba_initial', 'byt.copd.2026.bronchodilator_short_acting'],
        },
        flow_weak: {
          initiate: 'rec',
          continue: 'rec',
          dose: `Khí dung ${nebDoseMg} mg/lần x 4–6 lần/ngày`,
          note: 'Phù hợp người cao tuổi lực hít rất yếu không hít hiệu quả qua bình cầm tay (dùng pMDI + buồng đệm có van hoặc máy khí dung)',
          citationIds: ['byt.copd.2026.salbutamol_neb_dose'],
        },
        poor_coord: {
          initiate: 'rec',
          continue: 'rec',
          dose: `Khí dung ${nebDoseMg} mg/lần x 4–6 lần/ngày`,
          note: 'Không đòi hỏi phối hợp tay – hít đồng thì; ưu tiên ống ngậm miệng (mouthpiece) thay vì mặt nạ nếu pha kèm ipratropium để tránh sương vào mắt gây glôcôm',
          citationIds: ['byt.copd.2026.salbutamol_neb_dose', 'gold.copd.2026.lama_glaucoma_caution'],
        },
        acute_severe: {
          initiate: 'rec',
          continue: 'rec',
          dose: `Khí dung ${nebDoseMg} mg/lần x 4–6 lần/ngày`,
          note: `Ưu tiên hàng đầu trong đợt cấp nặng: chạy máy khí dung bằng khí nén (không chạy bằng dòng oxy lưu lượng cao khi tăng CO₂ máu, giữ SpO₂ mục tiêu ${o2Min}–${o2Max}%)`,
          citationIds: ['byt.copd.2026.salbutamol_neb_dose', 'byt.copd.2026.oxygen_target_88_92'],
        },
      },
    },
  ],
};
