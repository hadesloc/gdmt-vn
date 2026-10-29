import { useId } from 'react';
import type { Patient, Settings, ModuleDefinition, UnitSettings } from '../engine/types';

export interface DynamicModuleInputsProps {
  modules: ModuleDefinition[];
  patient: Patient;
  settings: Settings;
  getFieldValue: (fieldId: string) => unknown;
  setFieldValue: (fieldId: string, val: unknown) => void;
}

function formatUnitLabel(unitKey: keyof UnitSettings, units: UnitSettings, fallback?: string): string | undefined {
  switch (unitKey) {
    case 'cr':
      return units.cr === 'mg_dL' ? 'mg/dL' : 'µmol/L';
    case 'glucose':
      return units.glucose === 'mg_dL' ? 'mg/dL' : 'mmol/L';
    case 'lipid':
      return units.lipid === 'mg_dL' ? 'mg/dL' : 'mmol/L';
    case 'urat':
      return units.urat === 'mg_dL' ? 'mg/dL' : 'µmol/L';
    case 'uacr':
      return units.uacr === 'mg_g' ? 'mg/g' : 'mg/mmol';
    case 'hba1c':
      return units.hba1c === 'mmol_mol' ? 'mmol/mol' : '%';
    default:
      return fallback;
  }
}

export const DynamicModuleInputs = ({
  modules,
  patient,
  settings,
  getFieldValue,
  setFieldValue
}: DynamicModuleInputsProps) => {
  const formId = useId();
  return (
    <>
      {modules.map((mod) => {
        if (!mod.inputs?.groups || mod.inputs.groups.length === 0) return null;
        return (
          <div
            key={mod.id}
            style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: 'var(--bg-muted)',
              borderRadius: '8px'
            }}
            data-testid={`module-inputs-${mod.id}`}
          >
            {mod.inputs.groups.map((group) => (
              <div key={group.id} style={{ marginBottom: '0.5rem' }}>
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    marginBottom: '0.4rem'
                  }}
                >
                  {mod.icon ? `${mod.icon} ` : ''}
                  {group.titleVi}
                </div>
                {group.descriptionVi && (
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-subtle)',
                      marginBottom: '0.5rem'
                    }}
                  >
                    {group.descriptionVi}
                  </div>
                )}
                {group.fields.map((field) => {
                  if (field.visibleIf && !field.visibleIf(patient)) return null;
                  const val = getFieldValue(field.id);
                  const inputId = `${formId}-${mod.id}-${group.id}-${field.id}`;
                  const effectiveUnit = field.unitKey
                    ? formatUnitLabel(field.unitKey, settings.units, field.unit)
                    : field.unit;

                  if (field.type === 'range') {
                    return (
                      <div key={field.id} className="slider-group" style={{ marginTop: '0.5rem' }}>
                        <div className="slider-header">
                          <label htmlFor={inputId}>{field.labelVi}:</label>
                          <strong style={{ color: 'var(--primary)' }}>
                            {(val as number) ?? field.defaultValue ?? field.min ?? 0}
                            {effectiveUnit ? ` ${effectiveUnit}` : ''}
                          </strong>
                        </div>
                        <input
                          id={inputId}
                          type="range"
                          min={field.min ?? 0}
                          max={field.max ?? 100}
                          step={field.step ?? 1}
                          className="custom-range"
                          value={(val as number) ?? field.defaultValue ?? field.min ?? 0}
                          onChange={(e) => setFieldValue(field.id, Number(e.target.value))}
                        />
                        {field.helpVi && (
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-subtle)',
                              marginTop: '0.2rem'
                            }}
                          >
                            {field.helpVi}
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (field.type === 'select') {
                    return (
                      <div key={field.id} className="form-group" style={{ marginBottom: '0.5rem' }}>
                        <label className="form-label" htmlFor={inputId}>{field.labelVi}</label>
                        <select
                          id={inputId}
                          className="form-input"
                          value={String(val ?? field.defaultValue ?? '')}
                          onChange={(e) => {
                            const selectedOpt = field.options?.find(
                              (o) => String(o.value) === e.target.value
                            );
                            setFieldValue(field.id, selectedOpt ? selectedOpt.value : e.target.value);
                          }}
                        >
                          <option value="">-- Chọn {field.labelVi} --</option>
                          {field.options?.map((opt) => (
                            <option key={String(opt.value)} value={String(opt.value)}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }

                  if (field.type === 'boolean') {
                    return (
                      <label
                        key={field.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          cursor: 'pointer',
                          margin: '0.35rem 0',
                          fontSize: '0.85rem'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(val)}
                          onChange={(e) => setFieldValue(field.id, e.target.checked)}
                        />
                        <span>{field.labelVi}</span>
                      </label>
                    );
                  }

                  return (
                    <div key={field.id} className="form-group" style={{ marginBottom: '0.5rem' }}>
                      <label className="form-label" htmlFor={inputId}>
                        {field.labelVi}
                        {effectiveUnit ? ` (${effectiveUnit})` : ''}
                      </label>
                      <input
                        id={inputId}
                        type={field.type === 'number' ? 'number' : 'text'}
                        inputMode={field.type === 'number' ? 'decimal' : 'text'}
                        step={field.step}
                        className="form-input"
                        value={val !== undefined ? String(val) : ''}
                        onChange={(e) =>
                          setFieldValue(
                            field.id,
                            field.type === 'number'
                              ? e.target.value
                                ? Number(e.target.value)
                                : undefined
                              : e.target.value
                          )
                        }
                        placeholder={field.placeholder || ''}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
};
