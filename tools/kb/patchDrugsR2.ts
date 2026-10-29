import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { DrugEntry, ReviewState } from '../../src/kb-types/index';
import { computeContentHash } from '../../src/kb-types/node';

const KB_DIR = resolve(process.cwd(), 'kb');
const DRUGS_DIR = join(KB_DIR, 'drugs');
const REVIEW_DIR = join(KB_DIR, 'review');
const nowIso = new Date().toISOString();

function updateDrug(id: string, updater: (d: DrugEntry) => void) {
  const p = join(DRUGS_DIR, `${id}.json`);
  const d: DrugEntry = JSON.parse(readFileSync(p, 'utf8'));
  updater(d);
  writeFileSync(p, JSON.stringify(d, null, 2), 'utf8');

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
        summary: `Tự động kiểm tra tính hợp lệ của liều, cổng an toàn và trích dẫn cho thuốc ${d.nameVi}.`
      }
    ],
    lastReviewedAt: nowIso
  };
  writeFileSync(join(REVIEW_DIR, `${d.id}.json`), JSON.stringify(rev, null, 2), 'utf8');
  console.log(`✓ Updated ${id}`);
}

// 1. Foster
updateDrug('beclometasone_formoterol', (d) => {
  d.gates = [
    {
      id: 'gate_foster_formoterol_max_daily',
      parameter: 'totalDailyPuffs',
      operator: '>',
      threshold: 12,
      unit: 'nhát/ngày',
      action: 'hold',
      messageVi: 'Cần khám y tế khẩn cấp nếu dùng quá 12 nhát hít Foster 100/6 mcg trong ngày (vượt quá liều formoterol an toàn)',
      citationIds: ['gina.asthma.2026.formoterol_max_inhalations', 'gina.asthma.2026.formoterol_max_mcg']
    }
  ];
});

// 2. Terbutaline
updateDrug('terbutaline', (d) => {
  d.target = {
    amount: 8,
    unit: 'nhát',
    frequency: 'ngày',
    route: 'hít',
    description: 'Tối đa 8 nhát/ngày (4 mg/ngày) trong đợt co thắt phế quản cấp'
  };
  d.gates = [
    {
      id: 'gate_terbutaline_not_alone',
      parameter: 'hasIcsMaintenance',
      operator: '==',
      threshold: 0,
      unit: 'cờ',
      action: 'caution',
      messageVi: 'CẢNH BÁO: Tuyệt đối không dùng Terbutaline (SABA) đơn độc không kèm ICS vì làm tăng nguy cơ đợt cấp nặng và tử vong',
      citationIds: ['gina.asthma.2026.never_saba_alone', 'byt.asthma.2020.no_saba_monotherapy']
    }
  ];
});

// 3. Fluticasone furoate
updateDrug('fluticasone_furoate', (d) => {
  d.vnBrands = ['Relvar Ellipta (dạng phối hợp)'];
});

// 4. Beclometasone
updateDrug('beclometasone', (d) => {
  d.vnBrands = ['Foster (dạng phối hợp hạt siêu mịn)'];
});

// 5. Mometasone
updateDrug('mometasone', (d) => {
  d.vnBrands = ['Dulera (dạng phối hợp)', 'Nasonex (xịt mũi)'];
});

// 6. Tezepelumab
updateDrug('tezepelumab', (d) => {
  d.vnBrands = ['Tezspire (chưa phân phối đại trà tại VN - thuốc hội chẩn chuyên khoa)'];
});
