/**
 * GDMT-VN Multi-Role Multi-Round AI Review Pipeline
 *
 * Ported and adapted from: on-call/tools/m12/ai_review.ts
 *
 * Hội đồng phản biện AI độc lập gồm các vai:
 * - 3 vai cốt lõi:
 *   1. guideline_checker: Đối chiếu khuyến cáo, trích dẫn PDF nguyên văn.
 *   2. clinical_pharmacist: Dược sĩ lâm sàng (liều, chỉnh liều thận, tương tác).
 *   3. adversarial_reviewer: Phản biện đối kháng (tìm kẽ hở, rủi ro lâm sàng).
 * - Chuyên gia chuyên khoa (Specialists theo module):
 *   4. nephrologist (Thận học: CKD, AKI, lọc máu).
 *   5. endocrinologist (Nội tiết: ĐTĐ, hạ đường huyết, toan ceton).
 *   6. cardiologist (Tim mạch: Suy tim, THA, rung nhĩ, lipid).
 *   7. pulmonologist (Hô hấp: COPD, Hen).
 *   8. rheumatologist (Cơ xương khớp: Gút, tương tác urat).
 *
 * Chế độ:
 *   --dry-run: Không gọi AI thật, dùng mock đánh giá hợp lệ để test pipeline.
 *   --item <id>: Review một mục cụ thể.
 *   --module <name>: Review toàn bộ mục thuộc module.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  type ReviewState,
  type ReviewReportRecord,
  type ReviewIssue,
  type ReviewVerdict,
} from '../../src/kb-types/index';
import { computeContentHash, CONTENT_HASH_VERSION } from '../../src/kb-types/node';
import { migrateReviewState } from '../../src/kb-types/review';
import { chat, extractJson } from './aiClient';

export type ReviewRole =
  | 'guideline_checker'
  | 'clinical_pharmacist'
  | 'adversarial_reviewer'
  | 'nephrologist'
  | 'endocrinologist'
  | 'cardiologist'
  | 'pulmonologist'
  | 'rheumatologist';

export interface AiReviewOutput {
  verdict: ReviewVerdict;
  summary: string;
  issues: ReviewIssue[];
  suggestedFix?: string;
}

const ROLE_PROMPTS: Record<ReviewRole, string> = {
  guideline_checker:
    'Vai: CHUYÊN GIA ĐỐI CHIẾU GUIDELINE. Kiểm tra xem nội dung thuốc, ngưỡng số và khuyến cáo có bám sát nguyên văn trích dẫn đã được xác minh trong PDF không. Phát hiện nếu có sự suy diễn quá mức, trích dẫn lệch nghĩa hoặc thiếu căn cứ.',
  clinical_pharmacist:
    'Vai: DƯỢC SĨ LÂM SÀNG. Kiểm tra liều khởi đầu, liều đích, các bước chuẩn độ liều, dải chỉnh liều theo chức năng thận (eGFR/CrCl), các cổng an toàn (K+, HA, nhịp tim), chống chỉ định tuyệt đối/tương đối và tương tác thuốc nguy cơ cao.',
  adversarial_reviewer:
    'Vai: PHẢN BIỆN ĐỐI KHÁNG Y KHOA. Cố tình tìm các kịch bản nguy hiểm có thể gây hại cho bệnh nhân: tụt HA, sốc, tăng kali máu nặng, suy thận cấp, nhiễm toan, hạ đường huyết nghiêm trọng hoặc dùng sai chỉ định.',
  nephrologist:
    'Vai: BÁC SĨ CHUYÊN KHOA THẬN HỌC. Đánh giá tính an toàn và hiệu quả trên bệnh nhân bệnh thận mạn (CKD các giai đoạn G1-G5), bệnh nhân đang lọc máu (HD/PD), nguy cơ đợt cấp tổn thương thận cấp (AKI) và chỉnh liều thận.',
  endocrinologist:
    'Vai: BÁC SĨ CHUYÊN KHOA NỘI TIẾT. Đánh giá tính chuẩn xác trong điều trị đái tháo đường típ 2, phối hợp thuốc hạ đường huyết, phòng ngừa hạ đường huyết và biến chứng toan ceton (DKA/eDKA) khi dùng SGLT2i.',
  cardiologist:
    'Vai: BÁC SĨ CHUYÊN KHOA TIM MẠCH. Đánh giá phác đồ 4 trụ cột suy tim (HFrEF/HFmrEF/HFpEF), kiểm soát huyết áp, xử trí rung nhĩ và phân tầng nguy cơ tim mạch - đích điều trị lipid máu.',
  pulmonologist:
    'Vai: BÁC SĨ CHUYÊN KHOA HÔ HẤP. Đánh giá phân nhóm COPD (GOLD A/B/E), phân bậc hen (GINA Track 1 & 2), liều lượng ICS tương đương và chỉ định thuốc giãn phế quản tác dụng kéo dài.',
  rheumatologist:
    'Vai: BÁC SĨ CHUYÊN KHOA CƠ XƯƠNG KHỚP. Đánh giá chỉ định hạ urat máu trong gút, liều allopurinol/febuxostat, tầm soát HLA-B*58:01 và phác đồ dự phòng cơn gút cấp bằng colchicine/NSAID.',
};

const SYSTEM_PROMPT = `Bạn là thành viên hội đồng chuyên gia y khoa kiểm duyệt Knowledge Base cho hệ thống hỗ trợ quyết định lâm sàng GDMT-VN (Guideline Directed Medical Therapy).
Mục tiêu: Đảm bảo độ chính xác tuyệt đối, bám sát y học chứng cứ, không sai sót liều lượng hoặc ngưỡng an toàn.
Quy định đánh giá:
- critical: Lỗi nghiêm trọng có thể đe dọa tính mạng người bệnh (vd: sai liều gấp nhiều lần, bỏ qua chống chỉ định nguy hiểm, nhầm lẫn thuốc).
- major: Sai sót kiến thức y khoa, sai ngưỡng lâm sàng hoặc mâu thuẫn trực tiếp với guideline chính thống.
- minor: Góp ý về cách diễn đạt, giải thích chưa đầy đủ hoặc cải thiện câu chữ tiếng Việt.

Bạn PHẢI trả về DUY NHẤT một khối JSON hợp lệ theo định dạng:
{
  "verdict": "pass" | "concerns" | "fail",
  "summary": "Tóm tắt ngắn gọn trong 1-3 câu tiếng Việt",
  "issues": [
    {
      "severity": "critical" | "major" | "minor",
      "problem": "Mô tả vấn đề cụ thể",
      "target": "Tên trường hoặc ID bị ảnh hưởng",
      "suggestedFix": "Đề xuất sửa đổi cụ thể"
    }
  ]
}
Quy tắc verdict:
- pass: Không có issue critical hoặc major.
- concerns: Có issue major nhưng không có critical.
- fail: Có ít nhất một issue critical.`;

export async function reviewItemWithRole(
  itemData: unknown,
  role: ReviewRole,
  opts: { dryRun?: boolean; round?: number } = {}
): Promise<{ ok: boolean; output?: AiReviewOutput; error?: string; dryRun?: boolean }> {
  if (opts.dryRun) {
    return {
      ok: true,
      dryRun: true,
      output: {
        verdict: 'pass',
        summary: `[DRY-RUN] Đã kiểm tra mô phỏng thành công cho vai ${role}`,
        issues: [],
      },
    };
  }

  const roleDesc = ROLE_PROMPTS[role] ?? ROLE_PROMPTS.guideline_checker;
  const userContent = `${roleDesc}\n\nNỘI DUNG DỮ LIỆU ĐƯỢC DUYỆT (JSON):\n${JSON.stringify(itemData, null, 2)}`;

  const res = await chat(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
    { temperature: 0.1, maxTokens: 4000 }
  );

  if (!res.ok) {
    return { ok: false, error: res.error };
  }

  const parsed = extractJson<AiReviewOutput>(res.content);
  if (!parsed || !parsed.verdict || !Array.isArray(parsed.issues)) {
    return {
      ok: false,
      error: `Phản hồi không đúng định dạng JSON: ${res.content.slice(0, 200)}...`,
    };
  }

  return { ok: true, output: parsed };
}

/**
 * Điều phối review đa vai và tổng hợp trạng thái duyệt (ReviewState)
 */
export async function runReviewForKbItem(
  itemId: string,
  itemData: unknown,
  roles: ReviewRole[],
  opts: { dryRun?: boolean; currentReview?: ReviewState; round?: number } = {}
): Promise<ReviewState> {
  const round = opts.round ?? 1;
  const now = new Date().toISOString();
  const contentHash = computeContentHash(itemData);

  const currentReview = opts.currentReview
    ? migrateReviewState(opts.currentReview, itemData, now) : undefined;
  const existingReports: ReviewReportRecord[] = currentReview?.reports ?? [];
  const newReports: ReviewReportRecord[] = [];

  console.log(`\n[AI Review] Đang duyệt "${itemId}" (Vòng ${round}) qua ${roles.length} vai...`);

  for (const role of roles) {
    process.stdout.write(`  - Vai: ${role}... `);
    const result = await reviewItemWithRole(itemData, role, { dryRun: opts.dryRun, round });

    if (!result.ok) {
      console.log(`✖ LỖI (${result.error})`);
      newReports.push({
        round,
        reviewedAt: now,
        role,
        verdict: 'uncertain',
        issues: [{ severity: 'major', problem: `Không thể kết nối AI: ${result.error}` }],
        summary: 'Lỗi trong quá trình gọi AI',
      });
    } else {
      const out = result.output!;
      console.log(`✔ [${out.verdict.toUpperCase()}] ${out.issues.length} vấn đề (${out.summary})`);
      newReports.push({
        round,
        reviewedAt: now,
        role,
        verdict: out.verdict,
        issues: out.issues,
        summary: out.summary,
      });
    }
  }

  // Simulated reports never count as approval evidence.
  const allReports = opts.dryRun ? existingReports : [...existingReports, ...newReports];

  // Logic tổng hợp trạng thái (Aggregate):
  // 1. Nếu có bất kỳ verdict nào là 'fail' hoặc có issue 'critical' -> draft
  // 2. Nếu có 3 vai cốt lõi pass/concerns không có critical -> ai_cross_checked
  // 3. Nếu qua >= 2 vòng hoặc có chuyên gia chuyên khoa và tất cả đều pass -> ai_multi_reviewed
  const hasCritical = allReports.some((r) => r.issues.some((i) => i.severity === 'critical'));
  const hasFail = allReports.some((r) => r.verdict === 'fail');

  const coreRoles: ReviewRole[] = ['guideline_checker', 'clinical_pharmacist', 'adversarial_reviewer'];
  const passedCoreRoles = new Set(
    allReports
      .filter((r) => coreRoles.includes(r.role as ReviewRole) && (r.verdict === 'pass' || r.verdict === 'concerns'))
      .map((r) => r.role)
  );

  let newStatus: ReviewState['status'] = 'draft';

  if (!opts.dryRun && allReports.length > 0 && !hasCritical && !hasFail) {
    const allCorePassed = coreRoles.every((r) => passedCoreRoles.has(r));
    if (allCorePassed) {
      newStatus = 'ai_cross_checked';
      // Đủ điều kiện multi_reviewed nếu có chuyên gia chuyên khoa hoặc nhiều vòng
      const hasSpecialist = allReports.some(
        (r) =>
          ['nephrologist', 'endocrinologist', 'cardiologist', 'pulmonologist', 'rheumatologist'].includes(r.role ?? '') &&
          r.verdict === 'pass'
      );
      const totalRounds = new Set(allReports.map((r) => r.round)).size;
      const noMajors = allReports.every((r) => !r.issues.some((i) => i.severity === 'major'));

      if ((hasSpecialist || totalRounds >= 2) && noMajors) {
        newStatus = 'ai_multi_reviewed';
      }
    } else {
      newStatus = 'auto_checked';
    }
  }

  const updatedReview: ReviewState = {
    itemId,
    contentHash,
    hashVersion: CONTENT_HASH_VERSION,
    status: newStatus,
    reports: allReports,
    ...(!opts.dryRun && newReports.length > 0 ? { lastReviewedAt: now }
      : currentReview?.lastReviewedAt ? { lastReviewedAt: currentReview.lastReviewedAt } : {}),
    ...(currentReview?.history ? { history: currentReview.history } : {}),
  };

  return updatedReview;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const itemIdx = args.indexOf('--item');
  const targetItem = itemIdx >= 0 ? args[itemIdx + 1] : undefined;

  console.log('=== GDMT-VN AI REVIEW RUNNER ===');
  if (dryRun) console.log('Chế độ: --dry-run (mô phỏng, không gọi API thật)');

  // Nạp dữ liệu thuốc và ngưỡng để review
  const nestedKbDir = resolve(process.cwd(), 'gdmt-vn', 'kb');
  const kbDir = existsSync(nestedKbDir) ? nestedKbDir : resolve(process.cwd(), 'kb');
  const reviewDir = join(kbDir, 'review');
  mkdirSync(reviewDir, { recursive: true });

  // Danh sách các vai chuẩn
  const defaultRoles: ReviewRole[] = [
    'guideline_checker',
    'clinical_pharmacist',
    'adversarial_reviewer',
    'nephrologist',
  ];

  // Tìm các file drug mẫu để review thử
  const drugFile = join(kbDir, 'drugs', '_sample.json');
  if (existsSync(drugFile)) {
    const raw = readFileSync(drugFile, 'utf8');
    const drugs = JSON.parse(raw);
    const list = Array.isArray(drugs) ? drugs : [drugs];

    for (const d of list) {
      if (targetItem && d.id !== targetItem) continue;

      const outPath = join(reviewDir, `${d.id}.json`);
      const currentReview: ReviewState | undefined = existsSync(outPath)
        ? JSON.parse(readFileSync(outPath, 'utf8')) : undefined;
      const reviewState = await runReviewForKbItem(d.id, d, defaultRoles, { dryRun, currentReview });
      if (!dryRun) {
        writeFileSync(outPath, JSON.stringify(reviewState, null, 2), 'utf8');
        console.log(`\n✔ Đã lưu ReviewState (${reviewState.status}) tại: ${outPath}`);
      } else console.log(`\n[DRY-RUN] Không lưu ReviewState: ${outPath}`);
    }
  } else {
    console.log('Chưa có file kb/drugs/_sample.json để review.');
  }
}

if (process.argv[1] && process.argv[1].endsWith('aiReview.ts')) {
  main().catch((err) => {
    console.error(`Lỗi: ${(err as Error).message}`);
    process.exit(1);
  });
}
