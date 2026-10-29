import { useId, useState } from 'react';
import type {
  Patient,
  Settings,
  ModuleDefinition,
  ModuleInputField,
  ModuleInputGroup,
  UnitSettings
} from '../engine/types';

export interface DynamicModuleInputsProps {
  modules: ModuleDefinition[];
  patient: Patient;
  settings: Settings;
  getFieldValue: (fieldId: string) => unknown;
  setFieldValue: (fieldId: string, val: unknown) => void;
  sharedPrimaryFieldIds?: ReadonlySet<string>;
}

/**
 * Các trường đã có mặt cố định trên biểu mẫu chung (PatientForm) nên không lặp lại lần 2 trong từng mô-đun.
 */
export const DEFAULT_SHARED_PRIMARY_FIELD_IDS = new Set<string>([
  'age',
  'sex',
  'weight',
  'height',
  'sbp',
  'dbp',
  'hr',
  'rhythm',
  'scr',
  'k',
  'uacr',
  'glucose',
  'hba1c',
  'uricAcid',
  'conditions.pregnant',
  'conditions.pregnancy',
  'customInputs.pregnant',
  'customInputs.pregnancy',
  'conditions.breastfeeding',
  'conditions.lactation',
  'customInputs.breastfeeding',
  'customInputs.lactation',
  'conditions.priorAngioedema',
  'conditions.angioedemaHistory',
  'conditions.ascvd',
  'conditions.liverDisease',
  'conditions.liver_disease'
]);

/**
 * Các nhóm chỉ dành riêng cho hồi sức / nội viện cấp cứu; ẩn khi đang ở chế độ Ngoại trú
 * (trừ khi hồ sơ đã có sẵn dữ liệu nhập trong nhóm đó).
 */
const STRICT_INPATIENT_GROUP_IDS = new Set<string>([
  'hf_inpatient_group',
  'htn_inpatient_emergency_hmod',
  'ckd_aki_inpatient_emergency'
]);

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

function isFieldFilled(field: ModuleInputField, val: unknown): boolean {
  if (val === undefined || val === null || val === '') return false;
  if (field.type === 'boolean') return val === true;
  return true;
}

export const DynamicModuleInputs = ({
  modules,
  patient,
  settings,
  getFieldValue,
  setFieldValue,
  sharedPrimaryFieldIds = DEFAULT_SHARED_PRIMARY_FIELD_IDS
}: DynamicModuleInputsProps) => {
  const formId = useId();
  const [groupOverrides, setGroupOverrides] = useState<Record<string, boolean>>({});

  // Theo dõi các field.id đã hiển thị để không bao giờ nhân đôi cùng 1 trường giữa nhiều mô-đun đang bật
  const renderedFieldIds = new Set<string>(sharedPrimaryFieldIds);

  const isGroupExpanded = (
    groupKey: string,
    group: ModuleInputGroup,
    visibleGroupIndex: number,
    filledCount: number
  ): boolean => {
    if (groupKey in groupOverrides) {
      return groupOverrides[groupKey];
    }
    if (visibleGroupIndex === 0) {
      return true;
    }
    if (
      settings.setting === 'inpatient' &&
      (group.id.includes('inpatient') || group.id.includes('acute'))
    ) {
      return true;
    }
    return filledCount > 0;
  };

  const toggleGroup = (groupKey: string, currentExpanded: boolean) => {
    setGroupOverrides((prev) => ({
      ...prev,
      [groupKey]: !currentExpanded
    }));
  };

  return (
    <>
      {modules.map((mod) => {
        if (!mod.inputs?.groups || mod.inputs.groups.length === 0) return null;

        const preparedGroups: Array<{
          group: ModuleInputGroup;
          fields: ModuleInputField[];
          filledCount: number;
        }> = [];

        for (const group of mod.inputs.groups) {
          const rawGroupHasFilled = group.fields.some((f) =>
            isFieldFilled(f, getFieldValue(f.id))
          );

          // Ẩn các nhóm thuần nội viện khi đang khám Ngoại trú (trừ khi đã có dữ liệu)
          if (
            settings.setting === 'outpatient' &&
            STRICT_INPATIENT_GROUP_IDS.has(group.id) &&
            !rawGroupHasFilled
          ) {
            continue;
          }

          const dedupedFields: ModuleInputField[] = [];
          for (const field of group.fields) {
            if (renderedFieldIds.has(field.id)) continue;
            if (field.visibleIf && !field.visibleIf(patient)) continue;
            renderedFieldIds.add(field.id);
            dedupedFields.push(field);
          }

          if (dedupedFields.length === 0) continue;

          const filledCount = dedupedFields.filter((f) =>
            isFieldFilled(f, getFieldValue(f.id))
          ).length;

          preparedGroups.push({
            group,
            fields: dedupedFields,
            filledCount
          });
        }

        if (preparedGroups.length === 0) return null;

        return (
          <section
            key={mod.id}
            aria-label={`Thông số chuyên khoa ${mod.nameVi}`}
            style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: 'var(--bg-muted)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}
            data-testid={`module-inputs-${mod.id}`}
          >
            {preparedGroups.map(({ group, fields, filledCount }, groupIdx) => {
              const groupKey = `${mod.id}:${group.id}`;
              const expanded = isGroupExpanded(groupKey, group, groupIdx, filledCount);
              const headingId = `${formId}-${mod.id}-${group.id}-heading`;
              const panelId = `${formId}-${mod.id}-${group.id}-panel`;

              return (
                <div
                  key={group.id}
                  style={{
                    marginBottom: groupIdx < preparedGroups.length - 1 ? '0.65rem' : 0,
                    paddingBottom: groupIdx < preparedGroups.length - 1 ? '0.5rem' : 0,
                    borderBottom:
                      groupIdx < preparedGroups.length - 1
                        ? '1px dashed var(--border-color)'
                        : 'none'
                  }}
                >
                  <button
                    type="button"
                    id={headingId}
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    onClick={() => toggleGroup(groupKey, expanded)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      background: 'transparent',
                      border: 'none',
                      padding: '0.2rem 0',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: 'var(--primary)'
                    }}
                  >
                    <span>
                      {mod.icon ? `${mod.icon} ` : ''}
                      {group.titleVi}
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        flexShrink: 0
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: '10px',
                          background: filledCount > 0 ? '#dbeafe' : 'var(--bg-surface)',
                          color: filledCount > 0 ? '#1d4ed8' : 'var(--text-subtle)',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        Đã nhập {filledCount}/{fields.length}
                      </span>
                      <span aria-hidden="true" style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                        {expanded ? '▲' : '▼'}
                      </span>
                    </span>
                  </button>

                  {expanded && (
                    <div
                      id={panelId}
                      role="group"
                      aria-labelledby={headingId}
                      style={{ marginTop: '0.45rem' }}
                    >
                      {group.descriptionVi && (
                        <div
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-subtle)',
                            marginBottom: '0.5rem'
                          }}
                        >
                          {group.descriptionVi}
                        </div>
                      )}

                      {fields.map((field) => {
                        const val = getFieldValue(field.id);
                        const safeFieldDomId = field.id.replace(/[^a-zA-Z0-9_-]/g, '-');
                        const inputId = `${formId}-${mod.id}-${group.id}-${safeFieldDomId}`;
                        const helpId = field.helpVi ? `${inputId}-help` : undefined;
                        const effectiveUnit = field.unitKey
                          ? formatUnitLabel(field.unitKey, settings.units, field.unit)
                          : field.unit;

                        if (field.type === 'range') {
                          return (
                            <div key={field.id} className="slider-group" style={{ marginTop: '0.5rem' }}>
                              <div className="slider-header">
                                <label htmlFor={inputId}>{field.labelVi}</label>
                                <strong style={{ color: 'var(--primary)' }}>
                                  {(val as number) ?? field.defaultValue ?? field.min ?? 0}
                                  {effectiveUnit ? ` ${effectiveUnit}` : ''}
                                </strong>
                              </div>
                              <input
                                id={inputId}
                                type="range"
                                aria-describedby={helpId}
                                min={field.min ?? 0}
                                max={field.max ?? 100}
                                step={field.step ?? 1}
                                className="custom-range"
                                value={(val as number) ?? field.defaultValue ?? field.min ?? 0}
                                onChange={(e) => setFieldValue(field.id, Number(e.target.value))}
                              />
                              {field.helpVi && (
                                <div
                                  id={helpId}
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
                              <label className="form-label" htmlFor={inputId}>
                                {field.labelVi}
                              </label>
                              <select
                                id={inputId}
                                aria-describedby={helpId}
                                className="form-input"
                                value={String(val ?? field.defaultValue ?? '')}
                                onChange={(e) => {
                                  if (e.target.value === '') {
                                    const explicitEmptyOpt = field.options?.find(
                                      (o) => String(o.value) === ''
                                    );
                                    setFieldValue(
                                      field.id,
                                      explicitEmptyOpt ? explicitEmptyOpt.value : undefined
                                    );
                                    return;
                                  }
                                  const selectedOpt = field.options?.find(
                                    (o) => String(o.value) === e.target.value
                                  );
                                  setFieldValue(field.id, selectedOpt ? selectedOpt.value : e.target.value);
                                }}
                              >
                                {!field.options?.some((o) => String(o.value) === '') && (
                                  <option value="">-- Chọn {field.labelVi} --</option>
                                )}
                                {field.options?.map((opt) => (
                                  <option key={String(opt.value)} value={String(opt.value)}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                              {field.helpVi && (
                                <div
                                  id={helpId}
                                  style={{
                                    fontSize: '0.74rem',
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

                        if (field.type === 'boolean') {
                          return (
                            <div key={field.id} style={{ margin: '0.35rem 0' }}>
                              <label
                                htmlFor={inputId}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem'
                                }}
                              >
                                <input
                                  id={inputId}
                                  type="checkbox"
                                  aria-describedby={helpId}
                                  checked={Boolean(val)}
                                  onChange={(e) => setFieldValue(field.id, e.target.checked)}
                                />
                                <span>{field.labelVi}</span>
                              </label>
                            </div>
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
                              aria-describedby={helpId}
                              step={field.step}
                              min={field.min}
                              max={field.max}
                              className="form-input"
                              value={val !== undefined ? String(val) : ''}
                              onChange={(e) =>
                                setFieldValue(
                                  field.id,
                                  field.type === 'number'
                                    ? e.target.value !== ''
                                      ? Number(e.target.value)
                                      : undefined
                                    : e.target.value
                                )
                              }
                              placeholder={field.placeholder || ''}
                            />
                            {field.helpVi && (
                              <div
                                id={helpId}
                                style={{
                                  fontSize: '0.74rem',
                                  color: 'var(--text-subtle)',
                                  marginTop: '0.2rem'
                                }}
                              >
                                {field.helpVi}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        );
      })}
    </>
  );
};
