import { describe, it, expect } from 'vitest';
import { decodeStateFromHash, encodeStateToHash } from '../../src/engine/urlState';
import { parseCaseFile, serializeCaseFile } from '../../src/engine/workspaceState';
import type { Patient, Settings } from '../../src/engine/types';
const patient: Patient = { name: 'Ca giả lập Nguyễn An', age: 65, selectedModules: ['hf', 'ckd', 'dm2', 'htn', 'copd', 'asthma', 'gout', 'lipid', 'af'], conditions: { ckd: true }, currentMeds: [{ drugId: 'bisoprolol', dose: 3.75, unit: 'mg', freq: '1 lần/ngày' }], customInputs: { nyha: 2, instruction: 'Dữ kiện thử nghiệm' } };
const settings: Settings = { setting: 'outpatient', profile: 'VN', units: { cr: 'mg_dL', glucose: 'mmol_L', lipid: 'mmol_L', urat: 'umol_L', uacr: 'mg_g', hba1c: 'pct' }, score2Region: 'high', theme: 'dark', fontScale: 'normal', onlyReviewed: false };
const asHash = (value: unknown, prefix = 'v1=') => '#'+prefix+Buffer.from(JSON.stringify(value),'utf8').toString('base64url');
describe('internal trial workspace transport', () => {
  it('round-trips all9modules, selected dose/frequency, Vietnamese and unit preferences exactly', () => {
    const file = serializeCaseFile(patient, settings);
    expect(parseCaseFile(file)).toEqual({ patient, settings });
    expect(decodeStateFromHash(encodeStateToHash(patient, settings))).toEqual({ version: 1, patient, settings });
    expect(JSON.parse(file)).toMatchObject({ format: 'gdmt-vn-case', version: 1 });
  });
  it('accepts partial legacy settings without inventing missing patient data', () => {
    const decoded = decodeStateFromHash(asHash({ version: 1, patient: { selectedModules: ['ckd'] }, settings: { units: { cr: 'mg_dL' } } }));
    expect(decoded?.patient.scr).toBeUndefined(); expect(decoded?.settings?.units?.cr).toBe('mg_dL');
  });
  it.each([null, [], { version: 2, patient }, { version: 1, patient: null }, { version: 1, patient: { currentMeds: 'bad' } }, { version: 1, patient: { currentMeds: [{ dose: 10 }] } }, { version: 1, patient: { conditions: { ckd: 'yes' } } }, { version: 1, patient: { selectedModules: ['unknown'] } }, { version: 1, patient: { age: '65' } }, { version: 1, patient: {}, settings: { units: { cr: 'wrong' } } }, { version: 1, patient: {}, settings: { onlyReviewed: 'false' } }])('rejects malformed state safely (%j)', (value) => {
    expect(decodeStateFromHash(asHash(value))).toBeNull();
  });
  it('rejects an unsupported prefix even when payload says v1', () => {
    expect(decodeStateFromHash(asHash({ version: 1, patient }, 'v2='))).toBeNull();
  });
  it.each(['{bad', '{"format":"other","version":1,"patient":{}}', '{"format":"gdmt-vn-case","version":2,"patient":{},"settings":{}}', '{"format":"gdmt-vn-case","version":1,"patient":{},"settings":{"profile":"wrong"}}'])('rejects corrupt/unrecognized import files (%s)', (text) => {
    expect(() => parseCaseFile(text)).toThrow();
  });
  it('rejects oversized files and non-finite values rather than loading unsafe shapes', () => {
    expect(() => parseCaseFile(' '.repeat(2_000_001))).toThrow(/lớn/);
    expect(() => parseCaseFile('{"format":"gdmt-vn-case","version":1,"patient":{"scr":1e999},"settings":{}}')).toThrow(/hợp lệ/);
  });
});
