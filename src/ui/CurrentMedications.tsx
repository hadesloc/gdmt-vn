import { useEffect, useMemo, useState } from 'react';
import type { CurrentMed, ModuleId } from '../engine/types';
import { getAllDrugs, type DrugEntry } from '../kb-types';
import { resolveKbDrugId } from '../engine/safety/drugClassify';
import './CurrentMedications.css';
import { getMedicationGroups, type MedicationGroup } from './currentMedicationGroups';
import { getRecordedDoseChoices } from './currentMedicationDoses';
import { getModule } from '../modules/registry';

type Props = {
  medications: CurrentMed[];
  onChange: (medications: CurrentMed[]) => void;
  moduleIds?: ModuleId[];
};

const fold = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[đĐ]/g, 'd')
  .toLocaleLowerCase('vi');

const drugLabel = (entry: DrugEntry) => entry.nameVi || entry.inn || entry.vnBrands?.[0] || entry.id;
const safeName = (med: CurrentMed) => med.name?.trim() || getAllDrugs().find((d) => resolveKbDrugId(d.id) === resolveKbDrugId(med.drugId))?.nameVi || med.drugId;
const normalizeCustomId = (value: string) => fold(value)
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');

export default function CurrentMedications({ medications, onChange, moduleIds = [] }: Props) {
  const drugs = useMemo(() => getAllDrugs(), []);
  const [viewModule, setViewModule] = useState<ModuleId | 'all'>('all');
  const activeView = viewModule !== 'all' && moduleIds.includes(viewModule) ? viewModule : 'all';
  const allGroups = useMemo(() => getMedicationGroups(moduleIds), [moduleIds]);
  const groups = activeView === 'all' ? allGroups : getMedicationGroups([activeView]);
  const groupedIds = new Set(allGroups.flatMap((g) => g.drugIds));
  const useHfCompactView = activeView === 'hf' || (activeView === 'all' && moduleIds.length === 1 && moduleIds[0] === 'hf');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');
  const [dose, setDose] = useState('');
  const [unit, setUnit] = useState('');
  const [freq, setFreq] = useState('');
  const [route, setRoute] = useState('');
  const [error, setError] = useState('');
  const [original, setOriginal] = useState<CurrentMed | null>(null);

  const results = useMemo(() => {
    const term = fold(search.trim());
    if (!term) return [];
    return drugs.filter((d) => [d.nameVi, d.inn, ...d.vnBrands, d.id].some((v) => fold(v || '').includes(term))).slice(0, 8);
  }, [drugs, search]);

  const resetForm = () => {
    setEditingIndex(null); setSearch(''); setSelectedId(''); setSelectedLabel('');
    setDose(''); setUnit(''); setFreq(''); setRoute(''); setError(''); setOriginal(null);
  };

  // A preset/reset or deletion must not leave an editor pointing at another row.
  useEffect(() => { resetForm(); }, [medications]);

  const beginAdd = () => { resetForm(); setEditingIndex(-1); };
  const beginEdit = (index: number) => {
    const med = medications[index];
    const canonical = resolveKbDrugId(med.drugId);
    const entry = drugs.find((d) => resolveKbDrugId(d.id) === canonical);
    setEditingIndex(index); setOriginal({ ...med });
    setSelectedId(entry?.id || med.drugId);
    setSelectedLabel(med.name || (entry ? drugLabel(entry) : med.drugId));
    setSearch(entry ? drugLabel(entry) : (med.name || med.drugId));
    setDose(String(med.dose ?? '')); setUnit(med.unit || ''); setFreq(med.freq || ''); setRoute(med.route || ''); setError('');
  };

  const selectDrug = (entry: DrugEntry) => {
    if (original && resolveKbDrugId(original.drugId) !== entry.id) { setDose(''); setUnit(''); setFreq(''); setRoute(''); }
    setSelectedId(entry.id); setSelectedLabel(drugLabel(entry)); setSearch(drugLabel(entry)); setError('');
  };

  const chooseCustom = () => {
    const name = search.trim();
    if (!name) return;
    const id = resolveKbDrugId(normalizeCustomId(name));
    if (original && resolveKbDrugId(original.drugId) !== id) { setDose(''); setUnit(''); setFreq(''); setRoute(''); }
    setSelectedId(id); setSelectedLabel(name); setError('');
  };

  const save = () => {
    if (!selectedId || !selectedLabel) { setError('Hãy tìm và chọn thuốc, hoặc dùng tên thuốc đã nhập.'); return; }
    const canonical = resolveKbDrugId(selectedId);
    const duplicateIndex = medications.findIndex((m, i) => i !== editingIndex && resolveKbDrugId(m.drugId) === canonical);
    if (duplicateIndex >= 0) { setError(`Đã có thuốc “${safeName(medications[duplicateIndex])}”. Hãy sửa mục thuốc đó.`); return; }

    const keepLegacyId = original && resolveKbDrugId(original.drugId) === canonical;
    const item: CurrentMed = {
      ...(original || {}),
      drugId: keepLegacyId ? original.drugId : selectedId,
      name: selectedLabel,
      dose: dose.trim() || undefined,
      unit: unit.trim() || undefined,
      freq: freq.trim() || undefined,
      route: route.trim() || undefined,
    };
    if (editingIndex === null || editingIndex < 0) onChange([...medications, item]);
    else onChange(medications.map((m, i) => i === editingIndex ? item : m));
    resetForm();
  };

  const customCanSelect = search.trim() && !results.some((d) => fold(drugLabel(d)) === fold(search.trim()));

  const renderGroup = (group: MedicationGroup) => <div className="current-meds__group" key={group.id}>
    <div className="current-meds__group-label">{group.label}</div>
    <div className="current-meds__group-content">
      <div className="current-meds__chips" role="group" aria-label={group.label}>
        {group.drugIds.map((id) => {
          const entry = drugs.find((d) => d.id === id);
          if (!entry) return null;
          const selected = medications.some((m) => resolveKbDrugId(m.drugId) === id);
          return <button type="button" className={`current-meds__drug${selected ? ' is-selected' : ''}`} key={id}
            aria-pressed={selected} onClick={() => selected
              ? onChange(medications.filter((m) => resolveKbDrugId(m.drugId) !== id))
              : onChange([...medications, { drugId: id, name: drugLabel(entry) }])}>{drugLabel(entry)}</button>;
        })}
      </div>
      {medications.map((med, index) => {
        const id = resolveKbDrugId(med.drugId);
        if (!group.drugIds.includes(id)) return null;
        const entry = drugs.find((d) => d.id === id);
        if (!entry) return null;
        const choices = getRecordedDoseChoices(entry);
        return <div className="current-meds__record" key={`${id}-${index}`}>
          <div className="current-meds__record-heading"><span>Liều {safeName(med)}:</span>
            <button type="button" className="current-meds__edit" aria-label={`Sửa ${safeName(med)}`} onClick={() => beginEdit(index)}>Nhập / sửa chi tiết</button>
          </div>
          <div className="current-meds__chips current-meds__dose-choices">
            {choices.map((choice) => {
              const label = `${choice.amount} ${choice.unit}${choice.frequency ? ` · ${choice.frequency}` : ''}`;
              const currentDose = fold(String(med.dose ?? '')).replace(/\s/g, '');
              const selected = (currentDose === String(choice.amount) && med.unit === choice.unit ||
                currentDose === fold(`${choice.amount}${choice.unit}`)) && med.freq === choice.frequency;
              return <button type="button" key={label} aria-label={`${safeName(med)}: ${label}`}
                aria-pressed={selected} className={`current-meds__dose${selected ? ' is-selected' : ''}`}
                onClick={() => onChange(medications.map((m, i) => i === index ? { ...m, dose: String(choice.amount), unit: choice.unit,
                  freq: choice.frequency, route: m.route || choice.route } : m))}>{label}</button>;
            })}
          </div>
          <span className={med.dose == null || med.dose === '' ? 'current-meds__missing' : 'current-meds__recorded'}>
            {med.dose == null || med.dose === '' ? 'Chưa ghi nhận liều — chọn đúng liều bệnh nhân đang dùng.'
              : `Đã ghi nhận: ${med.dose}${med.unit && !String(med.dose).includes(med.unit) ? ` ${med.unit}` : ''}${med.freq ? ` · ${med.freq}` : ''}${med.route ? ` · ${med.route}` : ''}`}
          </span>
        </div>;
      })}
    </div>
  </div>;

  return <section className="current-meds" aria-label="Thuốc bệnh nhân đang dùng">
    <div className="current-meds__heading"><h3>Thuốc bệnh nhân đang dùng</h3><span className="current-meds__count">{medications.length} thuốc</span></div>
    <p className="current-meds__hint">Chạm để chọn thuốc đang dùng, chạm lại để bỏ chọn. Chọn liều thực tế bên dưới.</p>
    {moduleIds.length > 1 && <label className="current-meds__view">Hiển thị nhóm thuốc
      <select value={activeView} onChange={(event) => setViewModule(event.target.value as ModuleId | 'all')}>
        <option value="all">Tất cả bệnh đã chọn</option>
        {moduleIds.map((id) => <option key={id} value={id}>{getModule(id)?.nameVi || id}</option>)}
      </select>
    </label>}
    <div className="current-meds__groups">{(useHfCompactView ? groups.slice(0, 4) : groups).map(renderGroup)}</div>
    {useHfCompactView && groups.length > 4 && <details className="current-meds__more"><summary>Các nhóm thuốc khác <span>{groups.length - 4}</span></summary>
      <div className="current-meds__groups">{groups.slice(4).map(renderGroup)}</div></details>}
    {medications.some((m) => !groupedIds.has(resolveKbDrugId(m.drugId))) && <ul className="current-meds__list">
      {medications.map((med, index) => {
        if (groupedIds.has(resolveKbDrugId(med.drugId))) return null;
        const name = safeName(med);
        return <li key={`${med.drugId}-${index}`} className="current-meds__item">
          <div><strong>{name}</strong><div className="current-meds__details">
            {med.dose != null && <span>Liều: {String(med.dose)}{med.unit && !String(med.dose).toLocaleLowerCase().includes(med.unit.toLocaleLowerCase()) ? ` ${med.unit}` : ''}</span>}
            {med.freq && <span>Tần suất: {med.freq}</span>}{med.route && <span>Đường dùng: {med.route}</span>}
          </div></div>
          <div className="current-meds__actions">
            <button type="button" aria-label={`Sửa ${name}`} onClick={() => beginEdit(index)}>Sửa</button>
            <button type="button" aria-label={`Xóa ${name}`} onClick={() => onChange(medications.filter((_, i) => i !== index))}>Xóa</button>
          </div>
        </li>;
      })}
    </ul>}
    {editingIndex === null && <button type="button" className="current-meds__add" onClick={beginAdd}>Tìm / thêm thuốc khác</button>}
    {editingIndex !== null && <div className="current-meds__form">
      <label>Tìm thuốc đang dùng
        <input value={search} onChange={(e) => { setSearch(e.target.value); setSelectedId(''); setSelectedLabel(''); setError(''); }} autoComplete="off" />
      </label>
      {results.length > 0 && <div className="current-meds__results" role="group" aria-label="Kết quả tìm thuốc">
        {results.map((entry) => <button type="button" key={entry.id} aria-label={`Chọn ${drugLabel(entry)}`} aria-pressed={selectedId === entry.id} onClick={() => selectDrug(entry)}>
          {drugLabel(entry)}{entry.inn && fold(entry.inn) !== fold(drugLabel(entry)) ? ` · ${entry.inn}` : ''}{entry.vnBrands?.length ? ` · ${entry.vnBrands.slice(0, 2).join(', ')}` : ''}
        </button>)}
      </div>}
      {customCanSelect && <button type="button" onClick={chooseCustom}>Dùng tên thuốc này: {search.trim()}</button>}
      {selectedId && !drugs.some((d) => resolveKbDrugId(d.id) === resolveKbDrugId(selectedId)) && <p role="note">Thuốc chưa có trong danh mục; việc kiểm tra tự động có thể chưa đầy đủ.</p>}
      {selectedLabel && <p>Đang chọn: <strong>{selectedLabel}</strong></p>}
      <label>Liều đang dùng<input value={dose} onChange={(e) => setDose(e.target.value)} /></label>
      <label>Đơn vị (nếu tách riêng)<input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="mg, mcg, nhát…" /></label>
      <label>Tần suất đang dùng<input value={freq} onChange={(e) => setFreq(e.target.value)} /></label>
      <label>Đường dùng / thiết bị<input value={route} onChange={(e) => setRoute(e.target.value)} placeholder="Uống, tiêm, pMDI, Turbuhaler…" /></label>
      {error && <p className="current-meds__error" role="alert">{error}</p>}
      <div className="current-meds__actions"><button type="button" onClick={save}>Lưu thuốc</button><button type="button" onClick={resetForm}>Hủy sửa</button></div>
    </div>}
  </section>;
}
