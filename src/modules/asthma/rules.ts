/**
 * GDMT-VN Module Hen phế quản (Asthma) - Rules Barrel
 * Phân quyền: Agent M
 *
 * Hệ thống quy tắc mô-đun hóa (< 20 KB/file):
 * - helpers.ts: Bộ hằng số nhóm thuốc & hàm đánh giá lâm sàng (GINA 4/4, phân tầng cơn cấp, chuyển đổi bình hít)
 * - rules.safety.ts: Chống chỉ định đa thuốc (.filter -> STOP), trần MART 12 nhát, AERD COX-1/COX-2, CYP3A4, Montelukast 2 tầng, Thai kỳ
 * - rules.acute.ts: Cấp cứu nội viện (Ưu tiên nguy kịch ICU mọi độ tuổi, giữ liều cấp cứu UPTITRATE, cổng thận/HA MgSO4, đơn xuất viện Box 9-7)
 * - rules.track1.ts: Quản lý ngoại trú GINA Track 1 (Bậc 1–4, hỗ trợ Foster, chống hố đen điều trị, cân nhắc nâng bậc 2–3 tháng)
 * - rules.track2.ts: Quản lý Bậc 5 hen nặng, Track 2 (giữ ICS đơn chất hiện tại), hồ sơ BYT Việt Nam & Kế hoạch hành động cá thể hóa
 */

import type { Rule } from '../../engine/types';
import { asthmaSafetyRules } from './rules.safety';
import { asthmaAcuteRules } from './rules.acute';
import { asthmaTrack1Rules } from './rules.track1';
import { asthmaTrack2AndSupportRules } from './rules.track2';
import { asthmaCypControllerRules } from './rules.cyp3a4';

export * from './helpers';

export const asthmaRules: Rule[] = [
  ...asthmaSafetyRules,
  ...asthmaCypControllerRules,
  ...asthmaAcuteRules,
  ...asthmaTrack1Rules,
  ...asthmaTrack2AndSupportRules
];
