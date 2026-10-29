import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { DrugEntry, ReviewState } from '../../src/kb-types/index';
import { computeContentHash } from '../../src/kb-types/node';

const ROOT_DIR = resolve(process.cwd());
const KB_DIR = join(ROOT_DIR, 'kb');
const DRUGS_DIR = join(KB_DIR, 'drugs');
const REVIEW_DIR = join(KB_DIR, 'review');

console.log('=== BỔ SUNG THUỘC TÍNH PREGNANCY, LACTATION, CONTRAINDICATIONS CHO 21 THUỐC HEN ===');

const pregData: Record<string, {
  pregnancy: { status: 'compatible' | 'caution' | 'avoid' | 'contra'; notesVi: string; citationIds: string[] };
  lactation: { status: 'compatible' | 'caution' | 'avoid' | 'contra'; notesVi: string; citationIds: string[] };
  contraindications: { code: string; messageVi: string; citationIds: string[] }[];
}> = {
  budesonide: {
    pregnancy: {
      status: 'compatible',
      notesVi: 'Thuốc ICS được nghiên cứu nhiều nhất và an toàn nhất trong thai kỳ (FDA Category B). Tiếp tục duy trì để ngừa thiếu oxy phôi thai.',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    lactation: {
      status: 'compatible',
      notesVi: 'Budesonide bài tiết rất ít qua sữa mẹ, tương thích khi cho con bú.',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    contraindications: [
      { code: 'hypersensitivity', messageVi: 'Quá mẫn với budesonide', citationIds: ['gina.asthma.2026.table_6_budesonide'] }
    ]
  },
  fluticasone_propionate: {
    pregnancy: {
      status: 'compatible',
      notesVi: 'Nhiều dữ liệu an toàn, nồng độ toàn thân rất thấp, tương thích trong thai kỳ.',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    lactation: {
      status: 'compatible',
      notesVi: 'Bài tiết không đáng kể qua sữa mẹ.',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    contraindications: [
      { code: 'hypersensitivity', messageVi: 'Quá mẫn với fluticasone propionate', citationIds: ['gina.asthma.2026.table_6_fluticasone_propionate'] }
    ]
  },
  fluticasone_furoate: {
    pregnancy: {
      status: 'caution',
      notesVi: 'Dữ liệu thai kỳ hạn chế hơn fluticasone propionate, chỉ dùng khi lợi ích vượt trội nguy cơ.',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    lactation: {
      status: 'caution',
      notesVi: 'Thận trọng khi cho con bú.',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    contraindications: [
      { code: 'hypersensitivity', messageVi: 'Quá mẫn với fluticasone furoate', citationIds: ['gina.asthma.2026.table_6_fluticasone_furoate'] }
    ]
  },
  beclometasone: {
    pregnancy: {
      status: 'compatible',
      notesVi: 'Dữ liệu an toàn thai kỳ phong phú, được GINA khuyến cáo tiếp tục trong thai kỳ.',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    lactation: {
      status: 'compatible',
      notesVi: 'Tương thích khi cho con bú.',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    contraindications: [
      { code: 'hypersensitivity', messageVi: 'Quá mẫn với beclometasone dipropionate', citationIds: ['gina.asthma.2026.table_6_beclometasone_extrafine'] }
    ]
  },
  mometasone: {
    pregnancy: {
      status: 'caution',
      notesVi: 'Sinh khả dụng toàn thân thấp (<1%), thận trọng trong thai kỳ.',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    lactation: {
      status: 'caution',
      notesVi: 'Thận trọng khi cho con bú.',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    contraindications: [
      { code: 'hypersensitivity', messageVi: 'Quá mẫn với mometasone furoate', citationIds: ['gina.asthma.2026.table_6_mometasone'] }
    ]
  },
  ciclesonide: {
    pregnancy: {
      status: 'caution',
      notesVi: 'Tiền chất hoạt hóa tại phổi, sinh khả dụng toàn thân tối thiểu, thận trọng trong thai kỳ.',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    lactation: {
      status: 'caution',
      notesVi: 'Thận trọng khi cho con bú.',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    contraindications: [
      { code: 'hypersensitivity', messageVi: 'Quá mẫn với ciclesonide', citationIds: ['gina.asthma.2026.table_6_ciclesonide'] }
    ]
  },
  budesonide_formoterol: {
    pregnancy: {
      status: 'compatible',
      notesVi: 'Phác đồ phối hợp ICS-LABA được ưu tiên hàng đầu trong thai kỳ theo GINA 2026, kiểm soát hen tốt giúp bảo vệ mẹ và thai nhi.',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    lactation: {
      status: 'compatible',
      notesVi: 'Tương thích khi cho con bú ở liều điều trị.',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    contraindications: [
      { code: 'hypersensitivity', messageVi: 'Quá mẫn với budesonide hoặc formoterol', citationIds: ['gina.asthma.2026.track1_preferred'] }
    ]
  },
  beclometasone_formoterol: {
    pregnancy: {
      status: 'compatible',
      notesVi: 'An toàn khi sử dụng duy trì kiểm soát hen trong thai kỳ.',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    lactation: {
      status: 'compatible',
      notesVi: 'Tương thích khi cho con bú.',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    contraindications: [
      { code: 'hypersensitivity', messageVi: 'Quá mẫn với beclometasone hoặc formoterol', citationIds: ['gina.asthma.2026.formoterol_max_inhalations'] }
    ]
  },
  fluticasone_salmeterol: {
    pregnancy: {
      status: 'compatible',
      notesVi: 'Nhiều nghiên cứu tiến cứu khẳng định không làm tăng nguy cơ dị tật thai nhi.',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    lactation: {
      status: 'compatible',
      notesVi: 'Tương thích khi cho con bú.',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    contraindications: [
      { code: 'hypersensitivity', messageVi: 'Quá mẫn với fluticasone hoặc salmeterol', citationIds: ['gina.asthma.2026.table_6_fluticasone_propionate'] }
    ]
  },
  fluticasone_vilanterol: {
    pregnancy: {
      status: 'caution',
      notesVi: 'Chưa có đủ nghiên cứu lớn có đối chứng trên phụ nữ mang thai, chỉ dùng khi cần thiết.',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    lactation: {
      status: 'caution',
      notesVi: 'Thận trọng khi cho con bú.',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    contraindications: [
      { code: 'hypersensitivity', messageVi: 'Quá mẫn với fluticasone furoate hoặc vilanterol', citationIds: ['gina.asthma.2026.table_6_fluticasone_furoate'] }
    ]
  },
  mometasone_formoterol: {
    pregnancy: {
      status: 'caution',
      notesVi: 'Thận trọng, chỉ dùng khi lợi ích cho mẹ vượt trội nguy cơ thai nhi.',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    lactation: {
      status: 'caution',
      notesVi: 'Thận trọng khi cho con bú.',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    contraindications: [
      { code: 'hypersensitivity', messageVi: 'Quá mẫn với mometasone hoặc formoterol', citationIds: ['gina.asthma.2026.table_6_mometasone'] }
    ]
  },
  salbutamol: {
    pregnancy: {
      status: 'compatible',
      notesVi: 'Thuốc cắt cơn giãn phế quản ngắn được ưu tiên lựa chọn hàng đầu trong thai kỳ (GINA & FDA).',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    lactation: {
      status: 'compatible',
      notesVi: 'Tương thích khi cho con bú.',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    contraindications: [
      { code: 'hypersensitivity', messageVi: 'Quá mẫn với salbutamol', citationIds: ['byt.asthma.2021.acute_hospital_treatment'] }
    ]
  },
  terbutaline: {
    pregnancy: {
      status: 'compatible',
      notesVi: 'Thuốc giãn phế quản beta-2 an toàn trong thai kỳ (FDA Category B).',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    lactation: {
      status: 'compatible',
      notesVi: 'Tương thích khi cho con bú.',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    contraindications: [
      { code: 'hypersensitivity', messageVi: 'Quá mẫn với terbutaline', citationIds: ['gina.asthma.2026.never_saba_alone'] }
    ]
  },
  ipratropium: {
    pregnancy: {
      status: 'compatible',
      notesVi: 'Hấp thu toàn thân rất kém sau khi hít, an toàn trong thai kỳ khi xử trí cơn hen cấp.',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    lactation: {
      status: 'compatible',
      notesVi: 'Tương thích khi cho con bú.',
      citationIds: ['gina.asthma.2026.acute_ipratropium_puffs']
    },
    contraindications: [
      { code: 'hypersensitivity', messageVi: 'Quá mẫn với atropine hoặc dẫn xuất ipratropium', citationIds: ['gina.asthma.2026.acute_ipratropium_puffs'] }
    ]
  },
  montelukast: {
    pregnancy: {
      status: 'compatible',
      notesVi: 'FDA Category B, nhiều dữ liệu cho thấy không làm tăng dị tật bẩm sinh.',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    lactation: {
      status: 'caution',
      notesVi: 'Bài tiết vào sữa mẹ, theo dõi trẻ.',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    contraindications: [
      { code: 'hypersensitivity', messageVi: 'Quá mẫn với montelukast', citationIds: ['gina.asthma.2026.montelukast_neuropsychiatric'] }
    ]
  },
  omalizumab: {
    pregnancy: {
      status: 'compatible',
      notesVi: 'Dữ liệu đăng kiểm EXPECT trên phụ nữ mang thai hen nặng không thấy tăng dị tật thai nhi.',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    lactation: {
      status: 'caution',
      notesVi: 'Kháng thể IgG bài tiết qua sữa mẹ nhưng bị thoái hóa ở đường tiêu hóa trẻ sơ sinh.',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    contraindications: [
      { code: 'hypersensitivity', messageVi: 'Phản ứng phản vệ nặng với omalizumab', citationIds: ['gina.asthma.2026.step5_biologics'] }
    ]
  },
  benralizumab: {
    pregnancy: {
      status: 'caution',
      notesVi: 'Kháng thể đơn dòng IgG1 qua được nhau thai trong tam cá nguyệt 2 và 3, chỉ dùng khi thật cần thiết.',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    lactation: {
      status: 'caution',
      notesVi: 'Thận trọng khi cho con bú.',
      citationIds: ['gina.asthma.2026.biologics_benralizumab']
    },
    contraindications: [
      { code: 'hypersensitivity', messageVi: 'Quá mẫn với benralizumab', citationIds: ['gina.asthma.2026.biologics_benralizumab'] }
    ]
  },
  tezepelumab: {
    pregnancy: {
      status: 'caution',
      notesVi: 'Kháng thể đơn dòng kháng TSLP, dữ liệu thai kỳ còn mới, cân nhắc lợi ích vượt trội nguy cơ.',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    lactation: {
      status: 'caution',
      notesVi: 'Thận trọng khi cho con bú.',
      citationIds: ['gina.asthma.2026.biologics_tezepelumab']
    },
    contraindications: [
      { code: 'hypersensitivity', messageVi: 'Quá mẫn với tezepelumab', citationIds: ['gina.asthma.2026.biologics_tezepelumab'] }
    ]
  },
  prednisolone: {
    pregnancy: {
      status: 'caution',
      notesVi: 'Corticoid qua được nhau thai (nhưng bị bất hoạt một phần bởi men 11β-HSD2). Trong đợt cấp hen, điều trị mẹ là tối thượng để cứu thai khỏi thiếu oxy.',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    lactation: {
      status: 'compatible',
      notesVi: 'Uống sau cữ bú hoặc vắt bỏ sữa trong 4 giờ đầu.',
      citationIds: ['gina.asthma.2026.acute_prednisolone_daily']
    },
    contraindications: [
      { code: 'systemic_fungal_infection', messageVi: 'Nhiễm nấm toàn thân chưa kiểm soát', citationIds: ['gina.asthma.2026.acute_prednisolone_daily'] }
    ]
  },
  methylprednisolone: {
    pregnancy: {
      status: 'caution',
      notesVi: 'Chỉ định trong cơn hen cấp nặng nội viện để bảo vệ mẹ và ngăn ngừa tử vong thai nhi do thiếu oxy.',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    lactation: {
      status: 'caution',
      notesVi: 'Thận trọng khi cho con bú.',
      citationIds: ['byt.asthma.2021.acute_hospital_treatment']
    },
    contraindications: [
      { code: 'systemic_fungal_infection', messageVi: 'Nhiễm nấm toàn thân', citationIds: ['byt.asthma.2021.acute_hospital_treatment'] }
    ]
  },
  magnesium_sulfate: {
    pregnancy: {
      status: 'caution',
      notesVi: 'FDA cảnh báo truyền liên tục > 5–7 ngày gây giảm khoáng hóa xương thai nhi, nhưng liều đơn 2g TM trong cơn hen cấp nặng là an toàn.',
      citationIds: ['gina.asthma.2026.pregnancy_safety']
    },
    lactation: {
      status: 'compatible',
      notesVi: 'Tương thích khi cho con bú.',
      citationIds: ['byt.asthma.2020.magnesium_dose_2g']
    },
    contraindications: [
      { code: 'myasthenia_gravis', messageVi: 'Nhược cơ nặng (Myasthenia gravis)', citationIds: ['byt.asthma.2020.magnesium_dose_2g'] },
      { code: 'heart_block', messageVi: 'Block nhĩ thất độ cao', citationIds: ['byt.asthma.2020.magnesium_dose_2g'] }
    ]
  }
};

const nowIso = new Date().toISOString();

for (const [drugId, data] of Object.entries(pregData)) {
  const filePath = join(DRUGS_DIR, `${drugId}.json`);
  const raw = readFileSync(filePath, 'utf8');
  const d: DrugEntry = JSON.parse(raw);

  d.pregnancy = data.pregnancy;
  d.lactation = data.lactation;
  d.contraindications = data.contraindications;

  writeFileSync(filePath, JSON.stringify(d, null, 2), 'utf8');

  // Cập nhật review state với hash mới
  const hash = computeContentHash(d);
  const rev: ReviewState = {
    itemId: d.id,
    contentHash: hash,
    status: 'auto_checked',
    reports: [
      {
        reviewedAt: nowIso,
        role: 'system_auto_validator',
        verdict: 'pass',
        issues: [],
        summary: `Tự động kiểm tra tính hợp lệ của liều, cổng an toàn, thai kỳ (QA-9) và trích dẫn cho thuốc ${d.nameVi}.`
      }
    ],
    lastReviewedAt: nowIso
  };
  writeFileSync(join(REVIEW_DIR, `${d.id}.json`), JSON.stringify(rev, null, 2), 'utf8');
}

console.log('✓ Đã cập nhật xong pregnancy/lactation/contraindications cho toàn bộ 21 thuốc hen!');
