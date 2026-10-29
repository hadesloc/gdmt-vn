import { useId } from 'react';
import type { Patient, Settings, ModuleId, Derived, ModuleDefinition } from '../engine/types';
import {
  getCanonicalFieldValue,
  setCanonicalFieldValue,
  setCanonicalCondition,
  detectPatientFieldConflicts,
  resolvePatientFieldConflicts
} from '../engine/patientFields';
import { getActiveModules } from '../modules/registry';
import { DynamicModuleInputs, DEFAULT_SHARED_PRIMARY_FIELD_IDS } from './DynamicModuleInputs';
import CurrentMedications from './CurrentMedications';

export interface PatientFormProps {
  patient: Patient;
  derived: Derived;
  settings: Settings;
  activeModules?: ModuleDefinition[];
  onChangePatient: (p: Patient) => void;
  onReset: () => void;
  onSelectPreset: () => void;
}

interface DiseaseOption {
  id: ModuleId;
  label: string;
  icon: string;
}

const DISEASES: DiseaseOption[] = [
  { id: 'ckd', label: 'Bệnh thận mạn', icon: '🫘' },
  { id: 'dm2', label: 'ĐTĐ típ 2', icon: '🩸' },
  { id: 'htn', label: 'Tăng huyết áp', icon: '❤️‍🩹' },
  { id: 'copd', label: 'COPD', icon: '🫁' },
  { id: 'asthma', label: 'Hen phế quản', icon: '💨' },
  { id: 'gout', label: 'Gút', icon: '🦶' },
  { id: 'hf', label: 'Suy tim', icon: '💓' },
  { id: 'lipid', label: 'Lipid máu', icon: '🧪' },
  { id: 'af', label: 'Rung nhĩ', icon: '⚡' }
];

export const PatientForm = ({
  patient,
  derived,
  settings,
  activeModules,
  onChangePatient,
  onReset,
  onSelectPreset
}: PatientFormProps) => {
  const formId = useId();

  const currentActiveModules = activeModules || getActiveModules(patient.selectedModules || []);
  const conflicts = detectPatientFieldConflicts(patient);

  const updateField = <K extends keyof Patient>(field: K, val: Patient[K]) => {
    if (field === 'currentMeds' || field === 'selectedModules' || field === 'conditions') {
      onChangePatient({
        ...patient,
        [field]: val
      });
      return;
    }
    onChangePatient(setCanonicalFieldValue(patient, String(field), val));
  };

  const updateCondition = (cond: string, val: boolean) => {
    onChangePatient(setCanonicalCondition(patient, cond, val));
  };

  const getFieldValue = (fieldId: string): unknown => getCanonicalFieldValue(patient, fieldId);

  const setFieldValue = (fieldId: string, val: unknown) => {
    onChangePatient(setCanonicalFieldValue(patient, fieldId, val));
  };

  const toggleDisease = (modId: ModuleId) => {
    const current = patient.selectedModules || [];
    const exists = current.includes(modId);
    const updated = exists ? current.filter((m) => m !== modId) : [...current, modId];

    // Cập nhật cả flag condition tương ứng mà vẫn bảo toàn dữ liệu chuyên khoa đã nhập
    const condKey =
      modId === 'dm2'
        ? 'dm'
        : modId === 'hf'
          ? 'hf'
          : modId === 'ckd'
            ? 'ckd'
            : modId === 'htn'
              ? 'htn'
              : modId === 'gout'
                ? 'gout'
                : modId === 'asthma'
                  ? 'asthma'
                  : modId === 'copd'
                    ? 'copd'
                    : modId;

    const withSyncedCond = setCanonicalCondition(patient, condKey, !exists);
    onChangePatient({
      ...withSyncedCond,
      selectedModules: updated
    });
  };

  const isModuleSelected = (id: ModuleId) => (patient.selectedModules || []).includes(id);

  const effectiveRhythm = getCanonicalFieldValue(patient, 'rhythm') as Patient['rhythm'] | undefined;
  const effectiveScr = getCanonicalFieldValue(patient, 'scr') as number | undefined;
  const effectiveK = getCanonicalFieldValue(patient, 'k') as number | undefined;
  const effectiveUacr = getCanonicalFieldValue(patient, 'uacr') as number | undefined;
  const effectiveGlucose = getCanonicalFieldValue(patient, 'glucose') as number | undefined;
  const effectiveHba1c = getCanonicalFieldValue(patient, 'hba1c') as number | undefined;
  const effectiveUricAcid = getCanonicalFieldValue(patient, 'uricAcid') as number | undefined;

  return (
    <div className="panel" data-testid="patient-form-panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <span>👤 Hồ sơ bệnh nhân</span>
        </h2>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            type="button"
            className="btn-header"
            style={{
              background: 'var(--bg-muted)',
              color: 'var(--text-main)',
              borderColor: 'var(--border-color)',
              minHeight: '34px',
              fontSize: '0.8rem'
            }}
            onClick={onSelectPreset}
          >
            📋 BN mẫu
          </button>
          <button
            type="button"
            className="btn-header"
            style={{
              background: 'var(--bg-muted)',
              color: '#b91c1c',
              borderColor: 'var(--border-color)',
              minHeight: '34px',
              fontSize: '0.8rem',
              transition: 'background 0.2s ease'
            }}
            onClick={onReset}
            title="Tạo hồ sơ trống sau khi xác nhận"
          >
            Hồ sơ mới
          </button>
        </div>
      </div>

      {/* Cảnh báo xung đột dữ liệu giữa hồ sơ chung và liên kết cũ (fail-closed) */}
      {conflicts.length > 0 && (
        <div
          role="alert"
          data-testid="patient-field-conflicts"
          style={{
            background: '#fffbeb',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            padding: '0.65rem 0.75rem',
            marginBottom: '0.85rem',
            fontSize: '0.82rem',
            color: '#92400e'
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
            ⚠️ Phát hiện xung đột dữ liệu trong hồ sơ nạp vào ({conflicts.length} trường)
          </div>
          {conflicts.map((c) => (
            <div key={c.fieldId} style={{ marginBottom: '0.2rem' }}>
              • {c.resolutionNoteVi}
            </div>
          ))}
          <button
            type="button"
            className="btn-header"
            style={{
              marginTop: '0.35rem',
              background: '#fef3c7',
              color: '#92400e',
              borderColor: '#f59e0b',
              fontSize: '0.78rem',
              minHeight: '30px'
            }}
            onClick={() => onChangePatient(resolvePatientFieldConflicts(patient))}
          >
            Đồng bộ về giá trị chuẩn của hồ sơ
          </button>
        </div>
      )}

      {/* Chọn bệnh lý bằng chip */}
      <div style={{ marginBottom: '1rem' }}>
        <div
          id={`${formId}-disease-heading`}
          style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}
        >
          Chọn bệnh lý đang khảo sát (đa chọn):
        </div>
        <div className="chips-container" role="group" aria-labelledby={`${formId}-disease-heading`}>
          {DISEASES.map((d) => {
            const selected = isModuleSelected(d.id);
            return (
              <button
                key={d.id}
                type="button"
                className={`disease-chip ${selected ? 'selected' : ''}`}
                aria-pressed={selected}
                onClick={() => toggleDisease(d.id)}
              >
                <span aria-hidden="true">{d.icon}</span>
                <span>{d.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Thông tin nhân khẩu học */}
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label" htmlFor={`${formId}-0`}>
            Tuổi (năm)
          </label>
          <input
            id={`${formId}-0`}
            type="number"
            inputMode="numeric"
            className="form-input"
            value={patient.age ?? ''}
            onChange={(e) => updateField('age', e.target.value !== '' ? Number(e.target.value) : undefined)}
            placeholder="vd: 65"
          />
        </div>
        <div className="form-group">
          <div className="form-label" id={`${formId}-sex`}>
            Giới tính
          </div>
          <div
            className="segmented-control"
            role="group"
            aria-labelledby={`${formId}-sex`}
            style={{ width: '100%' }}
          >
            <button
              type="button"
              className={`segmented-btn ${patient.sex === 'male' ? 'active' : ''}`}
              aria-pressed={patient.sex === 'male'}
              style={{ flex: 1 }}
              onClick={() => updateField('sex', 'male')}
            >
              Nam
            </button>
            <button
              type="button"
              className={`segmented-btn ${patient.sex === 'female' ? 'active' : ''}`}
              aria-pressed={patient.sex === 'female'}
              style={{ flex: 1 }}
              onClick={() => updateField('sex', 'female')}
            >
              Nữ
            </button>
          </div>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label className="form-label" htmlFor={`${formId}-1`}>
            Cân nặng (kg)
          </label>
          <input
            id={`${formId}-1`}
            type="number"
            inputMode="decimal"
            className="form-input"
            value={patient.weight ?? ''}
            onChange={(e) => updateField('weight', e.target.value !== '' ? Number(e.target.value) : undefined)}
            placeholder="vd: 65"
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor={`${formId}-2`}>
            Chiều cao (cm)
          </label>
          <input
            id={`${formId}-2`}
            type="number"
            inputMode="numeric"
            className="form-input"
            value={patient.height ?? ''}
            onChange={(e) => updateField('height', e.target.value !== '' ? Number(e.target.value) : undefined)}
            placeholder="vd: 165"
          />
        </div>
      </div>

      {derived.bmi && (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginBottom: '1rem' }}>
          BMI: <strong>{derived.bmi} kg/m²</strong> • BSA: <strong>{derived.bsa || '--'} m²</strong>
        </div>
      )}

      {/* Sinh hiệu */}
      <div
        id={`${formId}-vitals-heading`}
        style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', margin: '0.75rem 0 0.5rem' }}
      >
        Sinh hiệu & Nhịp tim
      </div>
      <div role="group" aria-labelledby={`${formId}-vitals-heading`}>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor={`${formId}-3`}>
              HA tâm thu (SBP mmHg)
            </label>
            <input
              id={`${formId}-3`}
              type="number"
              inputMode="numeric"
              className="form-input"
              value={patient.sbp ?? ''}
              onChange={(e) => updateField('sbp', e.target.value !== '' ? Number(e.target.value) : undefined)}
              placeholder="vd: 130"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor={`${formId}-4`}>
              HA tâm trương (DBP mmHg)
            </label>
            <input
              id={`${formId}-4`}
              type="number"
              inputMode="numeric"
              className="form-input"
              value={patient.dbp ?? ''}
              onChange={(e) => updateField('dbp', e.target.value !== '' ? Number(e.target.value) : undefined)}
              placeholder="vd: 80"
            />
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor={`${formId}-5`}>
              Nhịp tim (HR bpm)
            </label>
            <input
              id={`${formId}-5`}
              type="number"
              inputMode="numeric"
              className="form-input"
              value={patient.hr ?? ''}
              onChange={(e) => updateField('hr', e.target.value !== '' ? Number(e.target.value) : undefined)}
              placeholder="vd: 75"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor={`${formId}-6`}>
              Nhịp trên ECG
            </label>
            <select
              id={`${formId}-6`}
              className="form-input"
              value={effectiveRhythm ?? ''}
              onChange={(e) =>
                updateField(
                  'rhythm',
                  (e.target.value !== '' ? e.target.value : undefined) as Patient['rhythm']
                )
              }
            >
              <option value="">-- Chưa chọn nhịp ECG --</option>
              <option value="sinus">Nhịp xoang</option>
              <option value="afib">Rung nhĩ (AF)</option>
              <option value="paced">Máy tạo nhịp</option>
              <option value="other">Khác</option>
            </select>
          </div>
        </div>
      </div>

      {/* Xét nghiệm chính */}
      <div
        id={`${formId}-labs-heading`}
        style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', margin: '0.75rem 0 0.5rem' }}
      >
        Xét nghiệm sinh hóa & thận
      </div>
      <div role="group" aria-labelledby={`${formId}-labs-heading`}>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor={`${formId}-7`}>
              Creatinin ({settings.units.cr === 'mg_dL' ? 'mg/dL' : 'µmol/L'})
            </label>
            <input
              id={`${formId}-7`}
              type="number"
              inputMode="decimal"
              className="form-input"
              value={effectiveScr ?? ''}
              onChange={(e) => updateField('scr', e.target.value !== '' ? Number(e.target.value) : undefined)}
              placeholder={settings.units.cr === 'mg_dL' ? 'vd: 1.2' : 'vd: 110'}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor={`${formId}-8`}>
              Kali máu (K⁺ mmol/L)
            </label>
            <input
              id={`${formId}-8`}
              type="number"
              inputMode="decimal"
              className="form-input"
              value={effectiveK ?? ''}
              onChange={(e) => updateField('k', e.target.value !== '' ? Number(e.target.value) : undefined)}
              placeholder="vd: 4.5"
            />
          </div>
        </div>

        {derived.egfr && (
          <div
            style={{
              fontSize: '0.85rem',
              padding: '0.4rem 0.65rem',
              borderRadius: '6px',
              background: 'var(--bg-muted)',
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>
              eGFR CKD-EPI: <strong>{derived.egfr} mL/min/1.73m²</strong>
            </span>
            {derived.kdigoG && (
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background:
                    derived.kdigoColor === 'green'
                      ? '#dcfce7'
                      : derived.kdigoColor === 'yellow'
                        ? '#fef9c3'
                        : derived.kdigoColor === 'orange'
                          ? '#ffedd5'
                          : '#fee2e2',
                  color:
                    derived.kdigoColor === 'green'
                      ? '#166534'
                      : derived.kdigoColor === 'yellow'
                        ? '#854d0e'
                        : derived.kdigoColor === 'orange'
                          ? '#9a3412'
                          : '#991b1b'
                }}
              >
                Giai đoạn {derived.kdigoG}
              </span>
            )}
          </div>
        )}

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor={`${formId}-9`}>
              UACR ({settings.units.uacr === 'mg_g' ? 'mg/g' : 'mg/mmol'})
            </label>
            <input
              id={`${formId}-9`}
              type="number"
              inputMode="decimal"
              className="form-input"
              value={effectiveUacr ?? ''}
              onChange={(e) => updateField('uacr', e.target.value !== '' ? Number(e.target.value) : undefined)}
              placeholder={settings.units.uacr === 'mg_g' ? 'vd: 300' : 'vd: 30'}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor={`${formId}-10`}>
              Glucose đói ({settings.units.glucose === 'mg_dL' ? 'mg/dL' : 'mmol/L'})
            </label>
            <input
              id={`${formId}-10`}
              type="number"
              inputMode="decimal"
              className="form-input"
              value={effectiveGlucose ?? ''}
              onChange={(e) => updateField('glucose', e.target.value !== '' ? Number(e.target.value) : undefined)}
              placeholder={settings.units.glucose === 'mg_dL' ? 'vd: 140' : 'vd: 7.8'}
            />
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor={`${formId}-11`}>
              HbA1c ({settings.units.hba1c === 'mmol_mol' ? 'mmol/mol' : '%'})
            </label>
            <input
              id={`${formId}-11`}
              type="number"
              inputMode="decimal"
              className="form-input"
              value={effectiveHba1c ?? ''}
              onChange={(e) => updateField('hba1c', e.target.value !== '' ? Number(e.target.value) : undefined)}
              placeholder={settings.units.hba1c === 'mmol_mol' ? 'vd: 58' : 'vd: 7.5'}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor={`${formId}-12`}>
              Acid Uric ({settings.units.urat === 'mg_dL' ? 'mg/dL' : 'µmol/L'})
            </label>
            <input
              id={`${formId}-12`}
              type="number"
              inputMode="decimal"
              className="form-input"
              value={effectiveUricAcid ?? ''}
              onChange={(e) => updateField('uricAcid', e.target.value !== '' ? Number(e.target.value) : undefined)}
              placeholder={settings.units.urat === 'mg_dL' ? 'vd: 7.0' : 'vd: 420'}
            />
          </div>
        </div>
      </div>

      <CurrentMedications
        medications={patient.currentMeds || []}
        moduleIds={patient.selectedModules}
        onChange={(medications) => updateField('currentMeds', medications)}
      />

      {/* Dynamic Module Specific Inputs (đã khử trùng lặp trường chung & thu gọn nhóm phụ) */}
      <DynamicModuleInputs
        modules={currentActiveModules}
        patient={patient}
        settings={settings}
        getFieldValue={getFieldValue}
        setFieldValue={setFieldValue}
        sharedPrimaryFieldIds={DEFAULT_SHARED_PRIMARY_FIELD_IDS}
      />

      {/* Fallback LVEF slider nếu module chưa định nghĩa inputs */}
      {!currentActiveModules.some((m) => m.inputs?.groups.some((g) => g.fields.some((f) => f.id === 'lvef'))) &&
        (isModuleSelected('hf') || patient.lvef !== undefined) && (
          <div className="slider-group" style={{ marginTop: '0.5rem' }}>
            <div className="slider-header">
              <label htmlFor={`${formId}-lvef-fallback`}>Phân suất tống máu thất trái (LVEF):</label>
              <strong style={{ color: 'var(--primary)' }}>{patient.lvef ?? 50}%</strong>
            </div>
            <input
              id={`${formId}-lvef-fallback`}
              type="range"
              aria-label="Phân suất tống máu thất trái (LVEF)"
              min="10"
              max="75"
              step="1"
              className="custom-range"
              value={patient.lvef ?? 50}
              onChange={(e) => updateField('lvef', Number(e.target.value))}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: 'var(--text-subtle)'
              }}
            >
              <span>≤ 40% (HFrEF)</span>
              <span>41–49% (HFmrEF)</span>
              <span>≥ 50% (HFpEF)</span>
            </div>
          </div>
        )}

      {/* Bệnh đồng mắc & Cờ an toàn */}
      <div
        id={`${formId}-safety-flags-heading`}
        style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', margin: '0.75rem 0 0.5rem' }}
      >
        Yếu tố an toàn & Cơ địa đặc biệt
      </div>
      <div
        role="group"
        aria-labelledby={`${formId}-safety-flags-heading`}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem', fontSize: '0.85rem' }}
      >
        <label
          htmlFor={`${formId}-flag-pregnant`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
        >
          <input
            id={`${formId}-flag-pregnant`}
            type="checkbox"
            checked={Boolean(getCanonicalFieldValue(patient, 'conditions.pregnant'))}
            onChange={(e) => updateCondition('pregnant', e.target.checked)}
          />
          <span>Đang mang thai</span>
        </label>
        <label
          htmlFor={`${formId}-flag-breastfeeding`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
        >
          <input
            id={`${formId}-flag-breastfeeding`}
            type="checkbox"
            checked={Boolean(getCanonicalFieldValue(patient, 'conditions.breastfeeding'))}
            onChange={(e) => updateCondition('breastfeeding', e.target.checked)}
          />
          <span>Đang cho con bú</span>
        </label>
        <label
          htmlFor={`${formId}-flag-angioedema`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
        >
          <input
            id={`${formId}-flag-angioedema`}
            type="checkbox"
            checked={Boolean(getCanonicalFieldValue(patient, 'conditions.priorAngioedema'))}
            onChange={(e) => updateCondition('priorAngioedema', e.target.checked)}
          />
          <span>Tiền sử phù mạch</span>
        </label>
        <label
          htmlFor={`${formId}-flag-ascvd`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
        >
          <input
            id={`${formId}-flag-ascvd`}
            type="checkbox"
            checked={Boolean(getCanonicalFieldValue(patient, 'conditions.ascvd'))}
            onChange={(e) => updateCondition('ascvd', e.target.checked)}
          />
          <span>Bệnh tim mạch do xơ vữa</span>
        </label>
        <label
          htmlFor={`${formId}-flag-liver`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
        >
          <input
            id={`${formId}-flag-liver`}
            type="checkbox"
            checked={Boolean(getCanonicalFieldValue(patient, 'conditions.liverDisease'))}
            onChange={(e) => updateCondition('liverDisease', e.target.checked)}
          />
          <span>Bệnh gan mạn tính</span>
        </label>
      </div>
    </div>
  );
};
