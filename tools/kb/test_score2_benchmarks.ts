import { computeScore2 } from '../../src/engine/calculators/score2';

export const SCORE2_BENCHMARKS = [
  // 1. Nữ 42t, không hút, SBP 110, Non-HDL 3.5 (TC 4.8, HDL 1.3) -> Chart: 1%
  { name: 'F 42 non SBP110 NonHDL 3.5', age: 42, sex: 'female' as const, smoker: false, sbp: 110, tc: 4.8, hdl: 1.3, chart: 1 },
  // 2. Nam 42t, hút thuốc, SBP 150, Non-HDL 5.5 (TC 6.8, HDL 1.3) -> Chart: 9%
  { name: 'M 42 smoker SBP150 NonHDL 5.5', age: 42, sex: 'male' as const, smoker: true, sbp: 150, tc: 6.8, hdl: 1.3, chart: 9 },
  // 3. Nữ 52t, không hút, SBP 130, Non-HDL 4.5 (TC 5.8, HDL 1.3) -> Chart: 3%
  { name: 'F 52 non SBP130 NonHDL 4.5', age: 52, sex: 'female' as const, smoker: false, sbp: 130, tc: 5.8, hdl: 1.3, chart: 3 },
  // 4. Nam 52t, hút thuốc, SBP 130, Non-HDL 4.5 (TC 5.8, HDL 1.3) -> Chart: 9%
  { name: 'M 52 smoker SBP130 NonHDL 4.5', age: 52, sex: 'male' as const, smoker: true, sbp: 130, tc: 5.8, hdl: 1.3, chart: 9 },
  // 5. Nữ 52t, hút thuốc, SBP 170, Non-HDL 6.5 (TC 7.8, HDL 1.3) -> Chart: 16%
  { name: 'F 52 smoker SBP170 NonHDL 6.5', age: 52, sex: 'female' as const, smoker: true, sbp: 170, tc: 7.8, hdl: 1.3, chart: 16 },
  // 6. Nam 52t, không hút, SBP 170, Non-HDL 4.5 (TC 5.8, HDL 1.3) -> Chart: 8%
  { name: 'M 52 non SBP170 NonHDL 4.5', age: 52, sex: 'male' as const, smoker: false, sbp: 170, tc: 5.8, hdl: 1.3, chart: 8 },
  // 7. Nữ 62t, không hút, SBP 150, Non-HDL 4.5 (TC 5.8, HDL 1.3) -> Chart: 9%
  { name: 'F 62 non SBP150 NonHDL 4.5', age: 62, sex: 'female' as const, smoker: false, sbp: 150, tc: 5.8, hdl: 1.3, chart: 9 },
  // 8. Nam 62t, hút thuốc, SBP 150, Non-HDL 5.5 (TC 6.8, HDL 1.3) -> Chart: 20%
  { name: 'M 62 smoker SBP150 NonHDL 5.5', age: 62, sex: 'male' as const, smoker: true, sbp: 150, tc: 6.8, hdl: 1.3, chart: 20 },
  // 9. Nữ 67t, không hút, SBP 150, Non-HDL 4.5 (TC 5.8, HDL 1.3) -> Chart: 13%
  { name: 'F 67 non SBP150 NonHDL 4.5', age: 67, sex: 'female' as const, smoker: false, sbp: 150, tc: 5.8, hdl: 1.3, chart: 13 },
  // 10. Nam 67t, hút thuốc, SBP 150, Non-HDL 5.5 (TC 6.8, HDL 1.3) -> Chart: 25%
  { name: 'M 67 smoker SBP150 NonHDL 5.5', age: 67, sex: 'male' as const, smoker: true, sbp: 150, tc: 6.8, hdl: 1.3, chart: 25 },
  // 11. Nữ 72t (SCORE2-OP), không hút, SBP 150, Non-HDL 4.5 (TC 5.8, HDL 1.3) -> Chart: 18%
  { name: 'F 72 non SBP150 NonHDL 4.5', age: 72, sex: 'female' as const, smoker: false, sbp: 150, tc: 5.8, hdl: 1.3, chart: 18 },
  // 12. Nam 72t (SCORE2-OP), hút thuốc, SBP 150, Non-HDL 4.5 (TC 5.8, HDL 1.3) -> Chart: 29%
  { name: 'M 72 smoker SBP150 NonHDL 4.5', age: 72, sex: 'male' as const, smoker: true, sbp: 150, tc: 5.8, hdl: 1.3, chart: 29 },
  // 13. Nam 77t (SCORE2-OP), không hút, SBP 150, Non-HDL 4.5 (TC 5.8, HDL 1.3) -> Chart: 27%
  { name: 'M 77 non SBP150 NonHDL 4.5', age: 77, sex: 'male' as const, smoker: false, sbp: 150, tc: 5.8, hdl: 1.3, chart: 27 },
  // 14. Nữ 77t (SCORE2-OP), hút thuốc, SBP 150, Non-HDL 5.5 (TC 6.8, HDL 1.3) -> Chart: 39%
  { name: 'F 77 smoker SBP150 NonHDL 5.5', age: 77, sex: 'female' as const, smoker: true, sbp: 150, tc: 6.8, hdl: 1.3, chart: 39 },
];

function main() {
  console.log('--- ĐỐI CHIẾU SCORE2 VỚI BẢNG ESC 2021 CVD PREVENTION (HIGH RISK REGION - 14 Ô) ---');
  let maxDiff = 0;
  let passCount = 0;

  for (const b of SCORE2_BENCHMARKS) {
    const res = computeScore2({
      age: b.age,
      sex: b.sex,
      smoker: b.smoker,
      sbp: b.sbp,
      tc: b.tc,
      hdl: b.hdl,
      riskRegion: 'high',
    });

    const diff = Math.abs((res.riskPercent ?? 0) - b.chart);
    if (diff > maxDiff) maxDiff = diff;
    const ok = diff <= 1.0;
    if (ok) passCount++;

    console.log(
      `${b.name.padEnd(35)}: Engine=${res.riskPercent}%, Chart=${b.chart}%, Diff=${diff.toFixed(2)}% [${ok ? 'PASS' : 'FAIL'}]`
    );
  }

  console.log(`\nKết quả: ${passCount}/${SCORE2_BENCHMARKS.length} ô đạt chuẩn (sai số <= 1.0%). Max Diff = ${maxDiff.toFixed(2)}%`);
}

main();
