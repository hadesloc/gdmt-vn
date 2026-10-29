/**
 * GDMT-VN Module Hen phế quản (Asthma) - Ma trận Điều trị
 * Phân quyền: Agent M
 *
 * Hai ma trận tham chiếu lâm sàng cốt lõi (chuẩn hóa QA-10 thFor):
 * 1. Ma trận Bậc điều trị 1–5 × Phân nhánh Track 1 (MART/AIR) vs Track 2 (SABA).
 * 2. Ma trận Bảng tương đương liều Corticosteroid hít (ICS) theo GINA 2026 Table 6.
 */

import type { MatrixDefinition } from '../../engine/types';
import { thFor } from '../../kb-types';

export const asthmaTrackMatrix: MatrixDefinition = {
  title: 'Ma trận Phân bậc Điều trị Hen phế quản × Phân nhánh (GINA 2026 & BYT 1851/2020)',
  columns: [
    { id: 'step1', label: 'Bậc 1', subLabel: 'Triệu chứng < 2 lần/tháng' },
    { id: 'step2', label: 'Bậc 2', subLabel: 'Triệu chứng ≥ 2 lần/tháng' },
    { id: 'step3', label: 'Bậc 3', subLabel: 'Triệu chứng hầu hết các ngày' },
    { id: 'step4', label: 'Bậc 4', subLabel: 'Hàng ngày + FEV1 thấp' },
    { id: 'step5', label: 'Bậc 5', subLabel: 'Hen nặng khó kiểm soát' }
  ],
  rows: [
    {
      drugId: 'budesonide_formoterol',
      nameVi: 'Track 1 (Ưu tiên): ICS-formoterol cắt cơn (AIR / MART)',
      cells: {
        step1: {
          initiate: 'rec',
          continue: 'rec',
          dose: 'Hít 1 nhát khi cần giảm triệu chứng (AIR)',
          note: 'ICS-formoterol liều thấp khi cần, không cần liều duy trì',
          citationIds: ['gina.asthma.2026.track1_preferred', 'gina.asthma.2026.track1_step1_2']
        },
        step2: {
          initiate: 'rec',
          continue: 'rec',
          dose: 'Hít 1 nhát khi cần giảm triệu chứng (AIR)',
          note: 'Dùng thuốc cắt cơn đồng thời ngừa cơn',
          citationIds: ['gina.asthma.2026.track1_preferred', 'gina.asthma.2026.track1_step1_2']
        },
        step3: {
          initiate: 'rec',
          continue: 'rec',
          dose: '1 nhát x 2 lần/ngày duy trì + 1 nhát khi cần (MART)',
          note: 'Bắt đầu liệu pháp MART liều thấp',
          citationIds: ['gina.asthma.2026.track1_step3', 'gina.asthma.2026.track1_preferred']
        },
        step4: {
          initiate: 'rec',
          continue: 'rec',
          dose: '2 nhát x 2 lần/ngày duy trì + 1 nhát khi cần (MART)',
          note: `MART liều trung bình; tối đa không quá ${thFor('inhalations_count', 'asthma.formoterol.mart_max_inhalations')} nhát/ngày`,
          citationIds: ['gina.asthma.2026.track1_step4', 'gina.asthma.2026.formoterol_max_inhalations']
        },
        step5: {
          initiate: 'rec',
          continue: 'rec',
          dose: 'Duy trì MART liều trung bình/cao + Thêm LAMA + Thuốc sinh học kiểu hình Type 2',
          note: 'Chuyển chuyên gia Hen nặng, thêm LAMA, đánh giá BCAT/FeNO/IgE',
          citationIds: ['gina.asthma.2026.step5_biologics', 'gina.asthma.2026.step5_lama_triplet']
        }
      }
    },
    {
      drugId: 'fluticasone_salmeterol',
      nameVi: 'Track 2 (Thay thế): SABA cắt cơn + ICS duy trì',
      cells: {
        step1: {
          initiate: 'ok',
          continue: 'ok',
          dose: 'Hít ICS liều thấp mỗi khi dùng SABA',
          note: 'Bắt buộc hít kèm ICS mỗi khi xịt SABA; không dùng SABA đơn độc',
          citationIds: ['gina.asthma.2026.never_saba_alone', 'byt.asthma.2020.no_saba_monotherapy']
        },
        step2: {
          initiate: 'ok',
          continue: 'ok',
          dose: 'ICS liều thấp hàng ngày + SABA khi cần',
          note: 'Duy trì đều đặn Fluticasone propionate hoặc Budesonide',
          citationIds: ['gina.asthma.2026.never_saba_alone', 'gina.asthma.2026.table_6_fluticasone_propionate']
        },
        step3: {
          initiate: 'ok',
          continue: 'ok',
          dose: 'ICS-LABA liều thấp x 2 lần/ngày + SABA khi cần',
          note: 'Accuhaler DPI 1 liều x 2 lần/ngày hoặc Evohaler pMDI 2 nhát x 2 lần/ngày',
          citationIds: ['gina.asthma.2026.never_saba_alone', 'byt.asthma.2020.ics_laba_vn_strengths']
        },
        step4: {
          initiate: 'ok',
          continue: 'ok',
          dose: 'ICS-LABA liều trung bình x 2 lần/ngày + SABA khi cần',
          note: 'Duy trì Fluticasone/salmeterol liều trung bình',
          citationIds: ['gina.asthma.2026.never_saba_alone', 'byt.asthma.2020.ics_laba_vn_strengths']
        },
        step5: {
          initiate: 'rec',
          continue: 'rec',
          dose: 'Liều cao ICS-LABA + Thêm LAMA + Thuốc sinh học',
          note: 'Chuyển chuyên khoa hô hấp đánh giá kiểu hình dị ứng/tăng BCAT',
          citationIds: ['gina.asthma.2026.step5_biologics', 'gina.asthma.2026.step5_lama_triplet']
        }
      }
    }
  ]
};

export const icsDoseEquivalenceMatrix: MatrixDefinition = {
  title: 'Bảng tương đương liều Corticosteroid hít (ICS) hàng ngày cho Người lớn & Vị thành niên (GINA 2026 Table 6)',
  columns: [
    { id: 'low', label: 'Liều thấp', subLabel: 'mcg/ngày' },
    { id: 'medium', label: 'Liều trung bình', subLabel: 'mcg/ngày' },
    { id: 'high', label: 'Liều cao', subLabel: 'mcg/ngày' }
  ],
  rows: [
    {
      drugId: 'budesonide',
      nameVi: 'Budesonide (DPI hoặc pMDI)',
      cells: {
        low: {
          initiate: 'rec',
          continue: 'rec',
          dose: `${thFor('dose_daily', 'asthma.ics.budesonide_low_min')}–${thFor('dose_daily', 'asthma.ics.budesonide_low_max')} mcg/ngày`,
          citationIds: ['gina.asthma.2026.table_6_budesonide']
        },
        medium: {
          initiate: 'rec',
          continue: 'rec',
          dose: `>${thFor('dose_daily', 'asthma.ics.budesonide_low_max')}–${thFor('dose_daily', 'asthma.ics.budesonide_med_max')} mcg/ngày`,
          citationIds: ['gina.asthma.2026.table_6_budesonide']
        },
        high: {
          initiate: 'caution',
          continue: 'caution',
          dose: `>${thFor('dose_daily', 'asthma.ics.budesonide_med_max')} mcg/ngày`,
          note: 'Liều cao kéo dài làm tăng nguy cơ tác dụng phụ toàn thân',
          citationIds: ['gina.asthma.2026.table_6_budesonide']
        }
      }
    },
    {
      drugId: 'beclometasone',
      nameVi: 'Beclometasone dipropionate (hạt siêu mịn extrafine pMDI/DPI)',
      cells: {
        low: {
          initiate: 'rec',
          continue: 'rec',
          dose: `${thFor('dose_daily', 'asthma.ics.beclometasone_low_min')}–${thFor('dose_daily', 'asthma.ics.beclometasone_low_max')} mcg/ngày`,
          citationIds: ['gina.asthma.2026.table_6_beclometasone_extrafine']
        },
        medium: {
          initiate: 'rec',
          continue: 'rec',
          dose: `>${thFor('dose_daily', 'asthma.ics.beclometasone_low_max')}–${thFor('dose_daily', 'asthma.ics.beclometasone_med_max')} mcg/ngày`,
          citationIds: ['gina.asthma.2026.table_6_beclometasone_extrafine']
        },
        high: {
          initiate: 'caution',
          continue: 'caution',
          dose: `>${thFor('dose_daily', 'asthma.ics.beclometasone_med_max')} mcg/ngày`,
          citationIds: ['gina.asthma.2026.table_6_beclometasone_extrafine']
        }
      }
    },
    {
      drugId: 'fluticasone_propionate',
      nameVi: 'Fluticasone propionate (DPI hoặc pMDI)',
      cells: {
        low: {
          initiate: 'rec',
          continue: 'rec',
          dose: `${thFor('dose_daily', 'asthma.ics.fluticasone_prop_low_min')}–${thFor('dose_daily', 'asthma.ics.fluticasone_prop_low_max')} mcg/ngày`,
          citationIds: ['gina.asthma.2026.table_6_fluticasone_propionate']
        },
        medium: {
          initiate: 'rec',
          continue: 'rec',
          dose: `>${thFor('dose_daily', 'asthma.ics.fluticasone_prop_low_max')}–${thFor('dose_daily', 'asthma.ics.fluticasone_prop_med_max')} mcg/ngày`,
          citationIds: ['gina.asthma.2026.table_6_fluticasone_propionate']
        },
        high: {
          initiate: 'caution',
          continue: 'caution',
          dose: `>${thFor('dose_daily', 'asthma.ics.fluticasone_prop_med_max')} mcg/ngày`,
          citationIds: ['gina.asthma.2026.table_6_fluticasone_propionate']
        }
      }
    },
    {
      drugId: 'fluticasone_furoate',
      nameVi: 'Fluticasone furoate (DPI Ellipta 1 lần/ngày)',
      cells: {
        low: {
          initiate: 'rec',
          continue: 'rec',
          dose: `${thFor('dose_daily', 'asthma.ics.fluticasone_furoate_low')} mcg/ngày (hít 1 lần)`,
          citationIds: ['gina.asthma.2026.table_6_fluticasone_furoate']
        },
        medium: {
          initiate: 'no_data',
          continue: 'no_data',
          dose: 'Không có mức liều trung bình riêng biệt',
          citationIds: ['gina.asthma.2026.table_6_fluticasone_furoate']
        },
        high: {
          initiate: 'caution',
          continue: 'caution',
          dose: `${thFor('dose_daily', 'asthma.ics.fluticasone_furoate_high')} mcg/ngày (hít 1 lần)`,
          citationIds: ['gina.asthma.2026.table_6_fluticasone_furoate']
        }
      }
    },
    {
      drugId: 'ciclesonide',
      nameVi: 'Ciclesonide (hạt siêu mịn extrafine pMDI)',
      cells: {
        low: {
          initiate: 'rec',
          continue: 'rec',
          dose: `${thFor('dose_daily', 'asthma.ics.ciclesonide_low_min')}–${thFor('dose_daily', 'asthma.ics.ciclesonide_low_max')} mcg/ngày`,
          citationIds: ['gina.asthma.2026.table_6_ciclesonide']
        },
        medium: {
          initiate: 'rec',
          continue: 'rec',
          dose: `>${thFor('dose_daily', 'asthma.ics.ciclesonide_low_max')}–${thFor('dose_daily', 'asthma.ics.ciclesonide_med_max')} mcg/ngày`,
          citationIds: ['gina.asthma.2026.table_6_ciclesonide']
        },
        high: {
          initiate: 'caution',
          continue: 'caution',
          dose: `>${thFor('dose_daily', 'asthma.ics.ciclesonide_med_max')} mcg/ngày`,
          citationIds: ['gina.asthma.2026.table_6_ciclesonide']
        }
      }
    },
    {
      drugId: 'mometasone',
      nameVi: 'Mometasone furoate (pMDI hạt chuẩn HFA; dạng DPI tra cứu theo thiết bị)',
      cells: {
        low: {
          initiate: 'rec',
          continue: 'rec',
          dose: `${thFor('dose_daily', 'asthma.ics.mometasone_low_min')}–${thFor('dose_daily', 'asthma.ics.mometasone_high')} mcg/ngày`,
          note: 'Áp dụng cho pMDI hạt chuẩn HFA; dạng bột khô DPI phụ thuộc từng thiết bị cụ thể',
          citationIds: ['gina.asthma.2026.table_6_mometasone', 'gina.asthma.2026.mometasone_dpi_vs_pmdi']
        },
        medium: {
          initiate: 'no_data',
          continue: 'no_data',
          dose: 'Không có mức liều trung bình riêng biệt cho pMDI (dạng DPI xem thông tin sản phẩm)',
          citationIds: ['gina.asthma.2026.table_6_mometasone', 'gina.asthma.2026.mometasone_dpi_vs_pmdi']
        },
        high: {
          initiate: 'caution',
          continue: 'caution',
          dose: `>${thFor('dose_daily', 'asthma.ics.mometasone_high')} mcg/ngày`,
          note: 'Áp dụng cho pMDI hạt chuẩn HFA; dạng DPI đối chiếu tờ thông tin sản phẩm',
          citationIds: ['gina.asthma.2026.table_6_mometasone', 'gina.asthma.2026.mometasone_dpi_vs_pmdi']
        }
      }
    }
  ]
};
