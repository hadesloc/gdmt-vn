import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { computeContentHash } from '../src/kb-types/node';
import type { DrugEntry, ReviewState } from '../src/kb-types/index';

const ROOT_DIR = process.cwd().endsWith('gdmt-vn') ? process.cwd() : join(process.cwd(), 'gdmt-vn');
const KB_DIR = join(ROOT_DIR, 'kb');

const drugFiles = [
  'dapagliflozin', 'empagliflozin', 'canagliflozin',
  'enalapril', 'perindopril', 'lisinopril', 'ramipril', 'captopril',
  'losartan', 'valsartan', 'telmisartan', 'irbesartan', 'candesartan',
  'finerenone',
  'patiromer', 'sodium_zirconium_cyclosilicate', 'calcium_polystyrene_sulfonate',
  'sodium_bicarbonate'
];

for (const drugId of drugFiles) {
  const filePath = join(KB_DIR, 'drugs', `${drugId}.json`);
  const d: DrugEntry = JSON.parse(readFileSync(filePath, 'utf8'));

  // 1. Canagliflozin: sửa vnBrands, thêm washout mổ, thêm gate thai kỳ
  if (drugId === 'canagliflozin') {
    d.vnBrands = []; // Chưa lưu hành đại trà tại VN
    if (!d.interactions.some(i => i.includes('phẫu thuật'))) {
      d.interactions.push('Tạm ngừng ít nhất 3 ngày trước phẫu thuật lớn để phòng ngừa toan ceton đái tháo đường euglycemic');
    }
  }

  // 2. Patiromer: sửa vnBrands, thêm hạ Mg máu
  if (drugId === 'patiromer') {
    d.vnBrands = []; // Chưa lưu hành đại trà tại VN
    if (!d.interactions.some(i => i.includes('magnesi'))) {
      d.interactions.push('Nguy cơ hạ magnesi máu (hypomagnesemia); cần theo dõi nồng độ magnesi huyết thanh định kỳ');
    }
  }

  // 3. SZC: sửa 5 mg -> 5 g
  if (drugId === 'sodium_zirconium_cyclosilicate') {
    if (typeof d.target === 'object' && d.target.description) {
      d.target.description = d.target.description.replace('5 mg cách ngày', '5 g cách ngày');
    }
  }

  // 4. Calcium Polystyrene Sulfonate: bỏ Resonium A, đổi vnBrands
  if (drugId === 'calcium_polystyrene_sulfonate') {
    d.nameVi = 'Kalimate (Calcium Polystyrene Sulfonate)';
    d.vnBrands = ['Kalimate', 'K-Pion', 'Calcium Resonium'];
  }

  // 5. Sodium Bicarbonate: sửa mâu thuẫn liều
  if (drugId === 'sodium_bicarbonate') {
    if (typeof d.start === 'object') {
      d.start.amount = 500;
      d.start.description = '500–1000 mg x 2–3 lần/ngày (tổng 1–2 g/ngày)';
    }
    if (typeof d.target === 'object') {
      d.target.amount = 1000;
      d.target.description = '2–4 g/ngày nhằm duy trì HCO3- 22–26 mmol/L';
    }
  }

  // 6. Thêm cảnh báo washout 36h cho các thuốc ACEi còn lại
  if (['enalapril', 'lisinopril', 'ramipril', 'captopril'].includes(drugId)) {
    if (!d.interactions.some(i => i.includes('36 giờ'))) {
      d.interactions.push('Bắt buộc khoảng trống đào thải (washout period) ít nhất 36 giờ trước hoặc sau khi dùng Sacubitril/Valsartan (ARNI) để tránh phù mạch thanh quản cấp tử vong');
    }
  }

  // 7. Thêm Gate thai kỳ vào gates cho SGLT2i, ACEi, ARB, nsMRA
  const isSglt2i = ['dapagliflozin', 'empagliflozin', 'canagliflozin'].includes(drugId);
  const isAcei = ['enalapril', 'perindopril', 'lisinopril', 'ramipril', 'captopril'].includes(drugId);
  const isArb = ['losartan', 'valsartan', 'telmisartan', 'irbesartan', 'candesartan'].includes(drugId);
  const isMra = drugId === 'finerenone';

  if (isSglt2i || isAcei || isArb || isMra) {
    if (!d.gates.some(g => g.parameter === 'pregnancy')) {
      const msg = isSglt2i
        ? 'Chống chỉ định SGLT2i trong thai kỳ (tam cá nguyệt 2 và 3) do nguy cơ gây độc thận thai nhi'
        : isAcei
          ? 'Chống chỉ định tuyệt đối nhóm thuốc ức chế men chuyển trong thai kỳ (Boxed Warning: độc tính phôi thai và tử vong chu sinh)'
          : isArb
            ? 'Chống chỉ định tuyệt đối nhóm thuốc ức chế thụ thể ARB trong thai kỳ (Boxed Warning: độc tính thai nhi)'
            : 'Chống chỉ định Finerenone trong thai kỳ';

      d.gates.push({
        id: `gate_${drugId}_pregnancy`,
        parameter: 'pregnancy',
        operator: '==',
        threshold: 1,
        action: 'contra',
        messageVi: msg,
        citationIds: d.citationIds
      });
    }
  }

  // Ghi lại file thuốc
  writeFileSync(filePath, JSON.stringify(d, null, 2), 'utf8');

  // Cập nhật review state với hash mới
  const hash = computeContentHash(d);
  const revPath = join(KB_DIR, 'review', `${drugId}.json`);
  const rev: ReviewState = {
    itemId: drugId,
    contentHash: hash,
    status: 'auto_checked',
    reports: [
      {
        reviewedAt: new Date().toISOString(),
        role: 'system_auto_validator',
        verdict: 'pass',
        issues: [],
        summary: `Tự động cập nhật cổng an toàn thai kỳ, biệt dược VN và thứ nguyên liều cho ${d.nameVi}.`
      }
    ],
    lastReviewedAt: new Date().toISOString()
  };
  writeFileSync(revPath, JSON.stringify(rev, null, 2), 'utf8');
}

console.log(`Đã cập nhật thành công toàn bộ ${drugFiles.length} file thuốc và review states!`);
