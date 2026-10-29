import type { MatrixDefinition } from '../../engine/types';
import { thFor, drug, dose, fmtDose } from '../../kb-types';

export const copdMatrixTherapy: MatrixDefinition = {
  title: 'Ma trận lựa chọn liệu pháp duy trì & leo thang theo phân nhóm A/B/E & BCAT (GOLD 2026 & BYT 2131/2026)',
  columns: [
    { id: 'group_a', label: 'Nhóm A', subLabel: 'Ít TC, 0 đợt cấp' },
    { id: 'group_b', label: 'Nhóm B', subLabel: 'Nhiều TC, 0 đợt cấp' },
    { id: 'group_e_low_eos', label: 'Nhóm E (<100)', subLabel: `BCAT < ${thFor('bloodEos', 'copd.eosinophils_low')} /µL` },
    { id: 'group_e_mod_eos', label: 'Nhóm E (100–299)', subLabel: `BCAT ${thFor('bloodEos', 'copd.eosinophils_low')}–299 /µL` },
    { id: 'group_e_high_eos', label: 'Nhóm E (≥300)', subLabel: `BCAT ≥ ${thFor('bloodEos', 'copd.eosinophils_high')} /µL` },
  ],
  rows: [
    {
      drugId: 'tiotropium',
      nameVi: `${drug('tiotropium').nameVi} (LAMA đơn chất)`,
      cells: {
        group_a: {
          initiate: 'rec',
          continue: 'rec',
          dose: fmtDose(dose('tiotropium', 'start')),
          note: 'Lựa chọn khởi đầu ưu tiên cho nhóm A (nếu không kèm hen phế quản)',
          citationIds: ['gold.copd.2026.initial_group_a'],
        },
        group_b: {
          initiate: 'ok',
          continue: 'caution',
          dose: fmtDose(dose('tiotropium', 'start')),
          note: 'Chỉ dùng tạm tại tuyến cơ sở khi chưa có phối hợp đôi; ưu tiên nâng lên LABA+LAMA',
          citationIds: ['byt.copd.2026.abe_groups'],
        },
        group_e_low_eos: {
          initiate: 'not_rec',
          continue: 'caution',
          note: 'Nhóm E cần khởi đầu bằng phối hợp đôi LABA+LAMA',
          citationIds: ['gold.copd.2026.initial_group_e'],
        },
        group_e_mod_eos: {
          initiate: 'not_rec',
          continue: 'caution',
          note: 'Nhóm E cần khởi đầu bằng phối hợp đôi LABA+LAMA',
          citationIds: ['gold.copd.2026.initial_group_e'],
        },
        group_e_high_eos: {
          initiate: 'not_rec',
          continue: 'not_rec',
          note: 'Ưu tiên phác đồ ba thuốc ICS+LAMA+LABA khi BCAT cao',
          citationIds: ['gold.copd.2026.initial_group_e_triple_eos300'],
        },
      },
    },
    {
      drugId: 'tiotropium_olodaterol',
      nameVi: `${drug('tiotropium_olodaterol').nameVi} (LABA + LAMA)`,
      cells: {
        group_a: {
          initiate: 'ok',
          continue: 'rec',
          dose: fmtDose(dose('tiotropium_olodaterol', 'start')),
          note: 'Nâng bậc khi đơn trị liệu giãn phế quản chưa kiểm soát đủ khó thở',
          citationIds: ['gold.copd.2026.followup_dyspnea_laba_lama'],
        },
        group_b: {
          initiate: 'rec',
          continue: 'rec',
          dose: fmtDose(dose('tiotropium_olodaterol', 'start')),
          note: 'Khởi đầu ưu tiên hàng đầu theo GOLD 2026 và BYT 2131/2026',
          citationIds: ['gold.copd.2026.initial_group_b'],
        },
        group_e_low_eos: {
          initiate: 'rec',
          continue: 'rec',
          dose: fmtDose(dose('tiotropium_olodaterol', 'start')),
          note: 'Khởi đầu ưu tiên cho nhóm E có BCAT thấp (tránh ICS do nguy cơ viêm phổi)',
          citationIds: ['gold.copd.2026.initial_group_e', 'gold.copd.2026.followup_eos_less_100_pneumonia'],
        },
        group_e_mod_eos: {
          initiate: 'rec',
          continue: 'rec',
          dose: fmtDose(dose('tiotropium_olodaterol', 'start')),
          note: 'Khởi đầu ưu tiên; nâng lên ba thuốc có ICS nếu đợt cấp vẫn tái phát khi theo dõi',
          citationIds: ['gold.copd.2026.initial_group_e', 'gold.copd.2026.followup_exac_eos_100_300'],
        },
        group_e_high_eos: {
          initiate: 'ok',
          continue: 'caution',
          dose: fmtDose(dose('tiotropium_olodaterol', 'start')),
          note: 'Có thể khởi đầu nếu chống chỉ định ICS, nhưng phác đồ ba thuốc ưu tiên hơn khi BCAT cao',
          citationIds: ['gold.copd.2026.initial_group_e_triple_eos300'],
        },
      },
    },
    {
      drugId: 'fluticasone_furoate_umeclidinium_vilanterol',
      nameVi: `${drug('fluticasone_furoate_umeclidinium_vilanterol').nameVi} (Triple ICS+LAMA+LABA)`,
      cells: {
        group_a: {
          initiate: 'not_rec',
          continue: 'caution',
          note: 'Không khởi trị ICS cho nhóm A (trừ khi đồng mắc hen). Nếu đã ổn định sạch đợt cấp nhờ chỉ định đúng trước đó thì không tự ý rút ICS trừ khi viêm phổi tái diễn; nếu khởi trị sai chỉ định ban đầu (0 đợt cấp, BCAT thấp) thì cân nhắc rút ICS sang LABA+LAMA',
          citationIds: ['gold.copd.2026.initial_group_a', 'gold.copd.2026.ics_withdrawal'],
        },
        group_b: {
          initiate: 'not_rec',
          continue: 'caution',
          note: 'Không khởi trị ICS cho nhóm B (trừ khi đồng mắc hen). Nếu trước đó có chỉ định đúng giúp đạt 0 đợt cấp thì không tự ý rút ICS trừ khi viêm phổi tái diễn; nếu khởi trị sai chỉ định ban đầu thì cân nhắc chuyển về LABA+LAMA',
          citationIds: ['gold.copd.2026.initial_group_b', 'gold.copd.2026.ics_withdrawal'],
        },
        group_e_low_eos: {
          initiate: 'not_rec',
          continue: 'caution',
          note: 'Không khuyến cáo thêm ICS khi BCAT thấp do ít hiệu quả và tăng nguy cơ viêm phổi',
          citationIds: ['gold.copd.2026.followup_eos_less_100_pneumonia'],
        },
        group_e_mod_eos: {
          initiate: 'not_rec',
          continue: 'rec',
          dose: fmtDose(dose('fluticasone_furoate_umeclidinium_vilanterol', 'start')),
          note: 'Không khởi trị đầu tay khi chưa dùng thuốc; nâng bậc lên ba thuốc nếu đợt cấp tái phát trên LABA+LAMA',
          citationIds: ['gold.copd.2026.followup_exac_eos_100_300'],
        },
        group_e_high_eos: {
          initiate: 'rec',
          continue: 'rec',
          dose: fmtDose(dose('fluticasone_furoate_umeclidinium_vilanterol', 'start')),
          note: 'Cân nhắc khởi đầu ưu tiên cho nhóm E có BCAT cao giúp giảm mạnh đợt cấp và tử vong',
          citationIds: ['gold.copd.2026.initial_group_e_triple_eos300'],
        },
      },
    },
    {
      drugId: 'roflumilast',
      nameVi: `${drug('roflumilast').nameVi} (Ức chế PDE4 – Leo thang theo dõi)`,
      cells: {
        group_a: {
          initiate: 'not_rec',
          continue: 'not_rec',
          citationIds: ['gold.copd.2026.initial_group_a'],
        },
        group_b: {
          initiate: 'not_rec',
          continue: 'not_rec',
          citationIds: ['gold.copd.2026.initial_group_b'],
        },
        group_e_low_eos: {
          initiate: 'not_rec',
          continue: 'rec',
          dose: fmtDose(dose('roflumilast', 'start')),
          note: `Không dùng khởi trị ban đầu; bổ sung theo dõi trên LABA+LAMA khi FEV₁ < ${thFor('fev1PredPct', 'copd.fev1_severe_roflumilast')}% và viêm phế quản mạn`,
          citationIds: ['gold.copd.2026.followup_roflumilast', 'byt.copd.2026.followup_roflumilast_azithro'],
        },
        group_e_mod_eos: {
          initiate: 'not_rec',
          continue: 'ok',
          dose: fmtDose(dose('roflumilast', 'start')),
          note: `Không dùng khởi trị ban đầu; cân nhắc bổ sung sau khi đã tối ưu LABA+LAMA/ba thuốc ở FEV₁ < ${thFor('fev1PredPct', 'copd.fev1_severe_roflumilast')}% kèm viêm phế quản mạn`,
          citationIds: ['gold.copd.2026.followup_roflumilast'],
        },
        group_e_high_eos: {
          initiate: 'not_rec',
          continue: 'ok',
          dose: fmtDose(dose('roflumilast', 'start')),
          note: 'Không dùng khởi trị ban đầu; chỉ cân nhắc khi vẫn còn đợt cấp dù đã tối ưu phác đồ ba thuốc',
          citationIds: ['gold.copd.2026.followup_roflumilast'],
        },
      },
    },
    {
      drugId: 'azithromycin',
      nameVi: `${drug('azithromycin').nameVi} (Macrolide dự phòng – Leo thang theo dõi)`,
      cells: {
        group_a: {
          initiate: 'not_rec',
          continue: 'not_rec',
          citationIds: ['gold.copd.2026.initial_group_a'],
        },
        group_b: {
          initiate: 'not_rec',
          continue: 'not_rec',
          citationIds: ['gold.copd.2026.initial_group_b'],
        },
        group_e_low_eos: {
          initiate: 'not_rec',
          continue: 'rec',
          dose: fmtDose(dose('azithromycin', 'start')),
          note: 'Không dùng khởi trị ban đầu; bổ sung theo dõi trên LABA+LAMA ở người không còn hút thuốc (đã cai hoặc chưa từng hút), QTc bình thường',
          citationIds: ['gold.copd.2026.followup_azithromycin', 'byt.copd.2026.followup_roflumilast_azithro'],
        },
        group_e_mod_eos: {
          initiate: 'not_rec',
          continue: 'ok',
          dose: fmtDose(dose('azithromycin', 'start')),
          note: 'Không dùng khởi trị ban đầu; cân nhắc sau khi tối ưu thuốc hít ở người không hút thuốc, theo dõi QTc và thính lực',
          citationIds: ['gold.copd.2026.followup_azithromycin', 'gold.copd.2026.azithromycin_safety'],
        },
        group_e_high_eos: {
          initiate: 'not_rec',
          continue: 'ok',
          dose: fmtDose(dose('azithromycin', 'start')),
          note: 'Không dùng khởi trị ban đầu; ưu tiên phác đồ ba thuốc và thuốc sinh học trước',
          citationIds: ['gold.copd.2026.followup_azithromycin'],
        },
      },
    },
    {
      drugId: 'dupilumab',
      nameVi: `${drug('dupilumab').nameVi} (Sinh học Anti-IL-4Rα – Leo thang theo dõi)`,
      cells: {
        group_a: {
          initiate: 'not_rec',
          continue: 'not_rec',
          citationIds: ['gold.copd.2026.initial_group_a'],
        },
        group_b: {
          initiate: 'not_rec',
          continue: 'not_rec',
          citationIds: ['gold.copd.2026.initial_group_b'],
        },
        group_e_low_eos: {
          initiate: 'not_rec',
          continue: 'not_rec',
          note: 'Không có chỉ định khi BCAT thấp',
          citationIds: ['gold.copd.2026.biologics_dupilumab_mepolizumab'],
        },
        group_e_mod_eos: {
          initiate: 'not_rec',
          continue: 'not_rec',
          note: `Chỉ định khi BCAT ≥ ${thFor('bloodEos', 'copd.eosinophils_high')} /µL theo GOLD 2026 (chưa đưa vào hướng dẫn BYT 2131/2026)`,
          citationIds: ['gold.copd.2026.biologics_dupilumab_mepolizumab'],
        },
        group_e_high_eos: {
          initiate: 'not_rec',
          continue: 'rec',
          dose: fmtDose(dose('dupilumab', 'start')),
          note: 'Không khởi trị đầu tay; bổ sung đơn trị sinh học khi có viêm phế quản mạn và vẫn đợt cấp tái phát trên phác đồ ba thuốc',
          citationIds: ['gold.copd.2026.biologics_dupilumab_mepolizumab', 'fda.copd.dupilumab_dose'],
        },
      },
    },
    {
      drugId: 'mepolizumab',
      nameVi: `${drug('mepolizumab').nameVi} (Sinh học Anti-IL-5 – Leo thang theo dõi)`,
      cells: {
        group_a: {
          initiate: 'not_rec',
          continue: 'not_rec',
          citationIds: ['gold.copd.2026.initial_group_a'],
        },
        group_b: {
          initiate: 'not_rec',
          continue: 'not_rec',
          citationIds: ['gold.copd.2026.initial_group_b'],
        },
        group_e_low_eos: {
          initiate: 'not_rec',
          continue: 'not_rec',
          note: 'Không có chỉ định khi BCAT thấp',
          citationIds: ['gold.copd.2026.biologics_dupilumab_mepolizumab'],
        },
        group_e_mod_eos: {
          initiate: 'not_rec',
          continue: 'not_rec',
          note: `Chỉ định khi BCAT ≥ ${thFor('bloodEos', 'copd.eosinophils_high')} /µL theo GOLD 2026 (chưa đưa vào hướng dẫn BYT 2131/2026)`,
          citationIds: ['gold.copd.2026.biologics_dupilumab_mepolizumab'],
        },
        group_e_high_eos: {
          initiate: 'not_rec',
          continue: 'rec',
          dose: fmtDose(dose('mepolizumab', 'start')),
          note: 'Không khởi trị đầu tay; bổ sung đơn trị sinh học khi đợt cấp tái phát trên phác đồ ba thuốc (không phối hợp kép với Dupilumab); lưu ý chưa có SĐK COPD tại VN',
          citationIds: ['gold.copd.2026.biologics_dupilumab_mepolizumab', 'gina.copd.2026.mepolizumab_100mg_q4w'],
        },
      },
    },
  ],
};
