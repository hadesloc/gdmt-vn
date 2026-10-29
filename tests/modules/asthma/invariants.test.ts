/** Asthma module architecture size invariant (Round 3). */
import { describe, it, expect } from 'vitest';
import { statSync } from 'node:fs';
import { ASTHMA_MODULE_DIR, collectTsFiles } from './invariants.fixtures';

describe('GDMT-VN Module Hen (asthma) - Property-Based Safety Invariants & Architecture Suite (Round 3)', () => {
  it('Suite 0: 100% file .ts trong src/modules/asthma/ tuân thủ nghiêm ngặt giới hạn < 20 KB (< 20.480 bytes)', () => {
    const tsFiles = collectTsFiles(ASTHMA_MODULE_DIR);
    expect(tsFiles.length).toBeGreaterThanOrEqual(27);
    const oversized = tsFiles
      .map((f) => ({ file: f, bytes: statSync(f).size }))
      .filter((x) => x.bytes >= 20480);
    expect(oversized).toEqual([]);
  });
});
