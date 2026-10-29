/**
 * GDMT-VN Gout Module - Rule Registry Aggregator
 * Phân quyền: Agent K
 *
 * Tổng hợp toàn bộ các quy tắc lâm sàng của module Gút từ các phân hệ modular (< 25 KB/file):
 * 1. rules.safety.antiinflam.ts — Cổng an toàn NSAID/COX-2i & Colchicine
 * 2. rules.flare.ts             — Phác đồ cắt cơn gút cấp, chườm đá lạnh & duy trì ULT trong cơn cấp
 * 3. rules.safety.ult.ts        — An toàn XOI/HLA-B*58:01/Azathioprine, Chỉ định ULT & Đích urat
 * 4. rules.ult.ts               — Khởi trị & chuẩn độ Allopurinol / Febuxostat
 * 5. rules.uricosuric.ts        — Quản lý nhóm tăng thải acid uric (Probenecid & Benzbromarone)
 * 6. rules.prophylaxis.ts       — An toàn thai kỳ & Dự phòng cơn bùng phát 3–6 tháng
 * 7. rules.concurrent.ts        — Tối ưu thuốc đồng mắc (Thiazide, Losartan, Fenofibrate, SGLT2i, Aspirin) & Lối sống
 * 8. rules.inpatient.ts         — Đối chiếu thuốc & Giám sát nội trú (QA-1 fail-closed)
 */

import type { Rule } from '../../engine/types';
import { goutAntiinflamSafetyRules } from './rules.safety.antiinflam';
import { goutFlareRules } from './rules.flare';
import { goutUltSafetyAndIndicationRules } from './rules.safety.ult';
import { goutUltRules } from './rules.ult';
import { goutUricosuricRules } from './rules.uricosuric';
import { goutProphylaxisRules } from './rules.prophylaxis';
import { goutConcurrentAndLifestyleRules } from './rules.concurrent';
import { goutInpatientRules } from './rules.inpatient';

export const goutRules: Rule[] = [
  ...goutAntiinflamSafetyRules,
  ...goutFlareRules,
  ...goutUltSafetyAndIndicationRules,
  ...goutUltRules,
  ...goutUricosuricRules,
  ...goutProphylaxisRules,
  ...goutConcurrentAndLifestyleRules,
  ...goutInpatientRules
];
