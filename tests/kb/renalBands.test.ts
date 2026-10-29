import { describe, it, expect } from 'vitest';

interface RenalInterval {
  from: number;
  to: number;
}

function checkBands(intervals: RenalInterval[]) {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < intervals.length; i++) {
    for (let j = i + 1; j < intervals.length; j++) {
      const a = intervals[i];
      const b = intervals[j];
      const start = Math.max(a.from, b.from);
      const end = Math.min(a.to, b.to);
      if (end > start) {
        errors.push(`Overlap: [${a.from}-${a.to}] vs [${b.from}-${b.to}] at ${start}-${end}`);
      }
    }
  }

  const sorted = [...intervals].sort((a, b) => a.from - b.from);
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1].from > sorted[i].to) {
      warnings.push(`Gap: ${sorted[i].to} to ${sorted[i + 1].from}`);
    }
  }

  return { errors, warnings };
}

describe('Renal Bands Overlap & Gap Check', () => {
  it('hợp lệ khi các dải tiếp giáp nhau liên tục [0-20] và [20-150]', () => {
    const res = checkBands([
      { from: 0, to: 20 },
      { from: 20, to: 150 },
    ]);
    expect(res.errors).toHaveLength(0);
    expect(res.warnings).toHaveLength(0);
  });

  it('phát hiện lỗi chồng lấn khi 2 dải đè lên nhau [20-60] và [45-90]', () => {
    const res = checkBands([
      { from: 20, to: 60 },
      { from: 45, to: 90 },
    ]);
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0]).toContain('Overlap');
  });

  it('phát hiện cảnh báo hở dải khi thiếu khoảng giữa [0-20] và [30-150]', () => {
    const res = checkBands([
      { from: 0, to: 20 },
      { from: 30, to: 150 },
    ]);
    expect(res.warnings).toHaveLength(1);
    expect(res.warnings[0]).toContain('Gap: 20 to 30');
  });
});
