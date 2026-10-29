import { describe, it, expect } from 'vitest';
import { encodeStateToHash, decodeStateFromHash, URL_STATE_VERSION } from '../../src/engine/urlState';
import type { Patient, Settings } from '../../src/engine/types';

describe('Engine - URL State serialization and deserialization', () => {
  it('encodes and decodes state round-trip successfully with Vietnamese characters', () => {
    const patient: Partial<Patient> = {
      name: 'Nguyễn Văn An',
      age: 68,
      sex: 'male',
      weight: 72.5,
      height: 168,
      sbp: 142,
      dbp: 88,
      scr: 130,
      k: 4.8,
      selectedModules: ['ckd', 'dm2'],
      conditions: {
        ckd: true,
        dm: true,
        htn: true
      },
      currentMeds: [
        { drugId: 'perindopril', name: 'Perindopril 5mg', dose: '5 mg', freq: '1 viên sáng' }
      ]
    };

    const settings: Partial<Settings> = {
      setting: 'outpatient',
      profile: 'VN',
      score2Region: 'high',
      theme: 'dark'
    };

    const hash = encodeStateToHash(patient, settings);
    expect(hash).toContain(`v${URL_STATE_VERSION}=`);

    const decoded = decodeStateFromHash(hash);
    expect(decoded).not.toBeNull();
    expect(decoded?.version).toBe(URL_STATE_VERSION);
    expect(decoded?.patient.name).toBe('Nguyễn Văn An');
    expect(decoded?.patient.age).toBe(68);
    expect(decoded?.patient.conditions?.ckd).toBe(true);
    expect(decoded?.patient.currentMeds?.[0].drugId).toBe('perindopril');
    expect(decoded?.settings?.profile).toBe('VN');
    expect(decoded?.settings?.theme).toBe('dark');
  });

  it('handles empty or malformed hash without crashing', () => {
    expect(decodeStateFromHash('')).toBeNull();
    expect(decodeStateFromHash('#')).toBeNull();
    expect(decodeStateFromHash('invalid_garbage_base64_!@#$')).toBeNull();
  });
});
