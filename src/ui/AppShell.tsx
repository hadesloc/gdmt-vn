import { useState, useEffect } from 'react';
import type { Patient, Settings, Derived, PresetPatient, UnitSettings, ModuleInputField } from '../engine/types';
import { evaluate } from '../engine/evaluate';
import { derivePatientData } from '../engine/derive';
import { normalizePatientUnits, denormalizePatientFromSi } from '../engine/units';
import { encodeStateToHash, decodeStateFromHash } from '../engine/urlState';
import { getAllModules, getActiveModules, isDemoEnabled } from '../modules/registry';
import { PatientForm } from './PatientForm';
import { PlanList } from './PlanList';
import { MatrixView } from './MatrixView';
import { PathwayView } from './PathwayView';
import { LearnView } from './LearnView';
import { SettingsView } from './SettingsView';
import { AboutView } from './AboutView';
import { buildDisplayedPlan } from './displayedPlan';
import { CaseWorkspace, TRIAL_SCOPE } from './CaseWorkspace';
import { ShareDialog } from './ShareDialog';
import { Modal } from './Modal';
import './styles.css';

export type MainTab = 'pathway' | 'plan' | 'evidence' | 'learn' | 'settings' | 'about';

const INITIAL_PATIENT: Patient = {
  age: 65,
  sex: 'male',
  weight: 68,
  height: 165,
  sbp: 135,
  dbp: 82,
  hr: 74,
  rhythm: 'sinus',
  scr: 125,
  k: 4.5,
  glucose: 8.2,
  hba1c: 7.4,
  uacr: 25,
  selectedModules: ['ckd', 'dm2'],
  conditions: {
    ckd: true,
    dm: true,
    htn: true
  },
  currentMeds: []
};

const INITIAL_SETTINGS: Settings = {
  setting: 'outpatient',
  profile: 'INTL',
  units: {
    cr: 'umol_L',
    glucose: 'mmol_L',
    lipid: 'mmol_L',
    urat: 'umol_L',
    uacr: 'mg_mmol',
    hba1c: 'pct'
  },
  score2Region: 'high',
  fontScale: 'normal',
  theme: 'light',
  onlyReviewed: false
};

export function buildPatientFromPreset(
  preset: PresetPatient,
  fallbackSelectedModules: Patient['selectedModules'] = [],
  units?: UnitSettings,
  inputFields?: readonly ModuleInputField[]
): Patient {
  const baseSi: Patient = {
    ...preset.patient,
    selectedModules: preset.patient.selectedModules
      ? [...preset.patient.selectedModules]
      : [...fallbackSelectedModules],
    conditions: preset.patient.conditions ? { ...preset.patient.conditions } : {},
    currentMeds: preset.patient.currentMeds
      ? preset.patient.currentMeds.map((m) => ({ ...m }))
      : [],
    customInputs: preset.patient.customInputs ? { ...preset.patient.customInputs } : {}
  };
  return units ? denormalizePatientFromSi(baseSi, units, inputFields) : baseSi;
}

export function applyPresetSelection(
  preset: PresetPatient,
  currentSettings: Settings,
  fallbackSelectedModules: Patient['selectedModules'] = ['_demo'],
  inputFields?: readonly ModuleInputField[]
): { patient: Patient; settings: Settings } {
  const nextSettings: Settings = {
    ...currentSettings,
    setting: preset.setting ?? 'outpatient'
  };
  const nextPatient = buildPatientFromPreset(
    preset,
    fallbackSelectedModules,
    nextSettings.units,
    inputFields
  );
  return { patient: nextPatient, settings: nextSettings };
}

function restorePatient(value: Partial<Patient>): Patient {
  return { ...value, selectedModules: (value.selectedModules ?? []).filter((id) => id !== '_demo' || isDemoEnabled()),
    currentMeds: value.currentMeds ?? [], conditions: value.conditions ?? {}, customInputs: value.customInputs ?? {} };
}

function restoreSettings(value?: Partial<Settings>): Settings {
  return { ...INITIAL_SETTINGS, ...value, units: { ...INITIAL_SETTINGS.units, ...value?.units } };
}

export const AppShell = () => {
  const [initial] = useState(() => {
    const hash = window.location.hash;
    const decoded = decodeStateFromHash(hash);
    return { patient: decoded ? restorePatient(decoded.patient) : hash ? restorePatient({}) : INITIAL_PATIENT,
      settings: restoreSettings(decoded?.settings),
      error: hash && !decoded ? 'Không đọc được liên kết hồ sơ hoặc phiên bản không được hỗ trợ. Hãy mở tệp đã lưu hoặc chọn BN mẫu.' : undefined };
  });
  const [patient, setPatient] = useState<Patient>(initial.patient);

  const [settings, setSettings] = useState<Settings>(initial.settings);
  const [loadError, setLoadError] = useState(initial.error);
  const [share, setShare] = useState<'note' | 'link'>();
  const [showReset, setShowReset] = useState(false);

  const [activeTab, setActiveTab] = useState<MainTab>('plan');
  const [mobileSegment, setMobileSegment] = useState<'patient' | 'plan'>('patient');
  const [showPresetsModal, setShowPresetsModal] = useState(false);
  const [presetSearch, setPresetSearch] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportCopyError, setReportCopyError] = useState('');
  const [matrixTargetDrug, setMatrixTargetDrug] = useState<string | undefined>();

  // Cập nhật URL hash khi patient hoặc settings thay đổi (không reload trang)
  useEffect(() => {
    const hash = encodeStateToHash(patient, settings);
    if (hash) {
      window.history.replaceState(null, '', `#${hash}`);
    }
  }, [patient, settings]);

  // Cập nhật DOM theme và font scale
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    document.documentElement.setAttribute('data-font', settings.fontScale);
  }, [settings.theme, settings.fontScale]);

  // Đánh giá kế hoạch GDMT từ engine thuần
  const activeModules = getActiveModules(patient.selectedModules);
  const allModules = getAllModules();
  const presets = allModules.flatMap((m) => m.presets || []);
  const foldSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
  const visiblePresets = presets.filter((preset) => {
    const diseaseNames = allModules.filter((module) => preset.patient.selectedModules?.includes(module.id)).map((module) => module.nameVi).join(' ');
    return foldSearch(`${preset.nameVi} ${preset.description} ${preset.patient.selectedModules?.join(' ') ?? ''} ${diseaseNames}`).includes(foldSearch(presetSearch.trim()));
  });
  const rawPlan = evaluate(patient, settings, { modules: activeModules });
  const allInputFieldsForUi = allModules.flatMap((m) =>
    m.inputs?.groups ? m.inputs.groups.flatMap((g) => g.fields) : []
  );
  const normalized = normalizePatientUnits(patient, settings.units, allInputFieldsForUi);
  const derived: Derived = derivePatientData(normalized, settings);
  const plan = buildDisplayedPlan(rawPlan, normalized, derived, settings);
  const noteText = `${TRIAL_SCOPE}\n\n${plan.noteText}`;

  const handleResetPatient = () => {
    setPatient({
      selectedModules: [],
      conditions: {},
      currentMeds: []
    });
    setLoadError(undefined); setShowReset(false); setMobileSegment('patient');
  };

  const handleOpenMatrix = (drugId?: string) => {
    setMatrixTargetDrug(drugId);
    setActiveTab('evidence');
  };

  const handleCopyNote = () => setShare('note');
  const handleCopyLink = () => setShare('link');

  const handlePrint = () => {
    window.print();
  };

  const handleToggleTheme = () => {
    const nextTheme = settings.theme === 'light' ? 'dark' : settings.theme === 'dark' ? 'high_contrast' : 'light';
    setSettings({ ...settings, theme: nextTheme });
  };

  const handleToggleFont = () => {
    const nextFont = settings.fontScale === 'normal' ? 'large' : settings.fontScale === 'large' ? 'xlarge' : 'normal';
    setSettings({ ...settings, fontScale: nextFont });
  };

  const handleCopyReportData = async () => {
    const payload = {
      timestamp: new Date().toISOString(),
      reportComment: reportText,
      patient,
      settings,
      planSummary: plan.summary
    };
    setReportSuccess(false); setReportCopyError('');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setReportSuccess(true);
      setTimeout(() => setReportSuccess(false), 3000);
    } catch { setReportCopyError(JSON.stringify(payload, null, 2)); }
  };

  return (
    <div className="app-shell" data-testid="app-shell">
      {/* Header Navy */}
      <header className="app-header">
        <div className="header-container">
          <div className="brand-section">
            <div className="brand-logo">G</div>
            <div className="brand-text">
              <h1>GDMT-VN</h1>
              <p>Phác đồ điều trị nội khoa tối ưu 9 bệnh mạn tính</p>
            </div>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="btn-header"
              onClick={handleToggleFont}
              title="Thay đổi cỡ chữ (A / A+ / A++)"
            >
              {settings.fontScale === 'normal' ? 'A' : settings.fontScale === 'large' ? 'A+' : 'A++'}
            </button>
            <button
              type="button"
              className="btn-header"
              onClick={handleToggleTheme}
              title="Chuyển chế độ sáng / tối / tương phản"
            >
              {settings.theme === 'light' ? '☀️' : settings.theme === 'dark' ? '🌙' : '👁️'}
            </button>
            <button
              type="button"
              className="btn-header"
              style={{ background: 'rgba(239, 68, 68, 0.25)', borderColor: 'rgba(239, 68, 68, 0.4)' }}
              onClick={() => setShowReportModal(true)}
              title="Báo lỗi hoặc góp ý lâm sàng"
            >
              🚩 Báo sai
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Navigation Tabs */}
      <nav className="nav-tabs">
        <div className="nav-tabs-container">
          <button
            type="button"
            className={`tab-item ${activeTab === 'pathway' ? 'active' : ''}`}
            onClick={() => setActiveTab('pathway')}
          >
            🗺️ Lộ trình
          </button>
          <button
            type="button"
            className={`tab-item ${activeTab === 'plan' ? 'active' : ''}`}
            onClick={() => setActiveTab('plan')}
          >
            📋 Phác đồ ({plan.recommendations.length})
          </button>
          <button
            type="button"
            className={`tab-item ${activeTab === 'evidence' ? 'active' : ''}`}
            onClick={() => setActiveTab('evidence')}
          >
            📊 Bằng chứng
          </button>
          <button
            type="button"
            className={`tab-item ${activeTab === 'learn' ? 'active' : ''}`}
            onClick={() => setActiveTab('learn')}
          >
            📚 Học
          </button>
          <button
            type="button"
            className={`tab-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Cài đặt
          </button>
          <button
            type="button"
            className={`tab-item ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            ℹ️ Giới thiệu
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        <CaseWorkspace patient={patient} settings={settings} loadError={loadError} onImport={(loadedPatient, loadedSettings) => {
          setPatient(restorePatient(loadedPatient)); setSettings(restoreSettings(loadedSettings));
          setLoadError(undefined); setActiveTab('plan'); setMobileSegment('patient');
        }} />
        {/* Tab Phác đồ */}
        {activeTab === 'plan' && (
          <div>
            {/* Thanh công cụ: Ngoại trú/Nội viện & Profile & Mobile Segmented */}
            <div className="plan-toolbar">
              <div className="toolbar-group">
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Bối cảnh:
                </span>
                <div className="segmented-control">
                  <button
                    type="button"
                    className={`segmented-btn ${settings.setting === 'outpatient' ? 'active' : ''}`}
                    onClick={() => setSettings({ ...settings, setting: 'outpatient' })}
                  >
                    Ngoại trú
                  </button>
                  <button
                    type="button"
                    className={`segmented-btn ${settings.setting === 'inpatient' ? 'active' : ''}`}
                    onClick={() => setSettings({ ...settings, setting: 'inpatient' })}
                  >
                    Nội viện
                  </button>
                </div>
              </div>

              <div className="toolbar-group">
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Hướng dẫn:
                </span>
                <div className="segmented-control">
                  <button
                    type="button"
                    className={`segmented-btn ${settings.profile === 'INTL' ? 'active' : ''}`}
                    onClick={() => setSettings({ ...settings, profile: 'INTL' })}
                  >
                    Quốc tế
                  </button>
                  <button
                    type="button"
                    className={`segmented-btn ${settings.profile === 'VN' ? 'active' : ''}`}
                    onClick={() => setSettings({ ...settings, profile: 'VN' })}
                  >
                    Bộ Y tế
                  </button>
                  <button
                    type="button"
                    className={`segmented-btn ${settings.profile === 'US' ? 'active' : ''}`}
                    onClick={() => setSettings({ ...settings, profile: 'US' })}
                  >
                    Hoa Kỳ
                  </button>
                </div>
              </div>

              {/* Mobile Only: Segmented Bệnh nhân | Kế hoạch */}
              <div className="toolbar-group mobile-only-segmented">
                <div className="segmented-control">
                  <button
                    type="button"
                    className={`segmented-btn ${mobileSegment === 'patient' ? 'active' : ''}`}
                    onClick={() => setMobileSegment('patient')}
                  >
                    Bệnh nhân
                  </button>
                  <button
                    type="button"
                    className={`segmented-btn ${mobileSegment === 'plan' ? 'active' : ''}`}
                    onClick={() => setMobileSegment('plan')}
                  >
                    Kế hoạch ({plan.recommendations.length})
                  </button>
                </div>
              </div>
            </div>

            {/* Grid 2 Cột Desktop / 1 Cột Mobile */}
            <div className="two-column-grid">
              <div className={`col-patient ${mobileSegment === 'plan' ? 'mobile-hidden' : ''}`}>
                <PatientForm
                  patient={patient}
                  derived={derived}
                  settings={settings}
                  activeModules={activeModules}
                  onChangePatient={(next) => { setLoadError(undefined); setPatient(next); }}
                  onReset={() => setShowReset(true)}
                  onSelectPreset={() => { setPresetSearch(''); setShowPresetsModal(true); }}
                />
              </div>

              <div className={`col-plan ${mobileSegment === 'patient' ? 'mobile-hidden' : ''}`}>
                <PlanList
                  plan={plan}
                  onlyReviewed={settings.onlyReviewed}
                  onOpenMatrix={handleOpenMatrix}
                  onCopyNote={handleCopyNote}
                  onCopyLink={handleCopyLink}
                  onPrint={handlePrint}
                />
              </div>
            </div>

            {/* Nút nổi xem kế hoạch trên Mobile */}
            <button
              type="button"
              className="floating-plan-btn"
              onClick={() => setMobileSegment(mobileSegment === 'patient' ? 'plan' : 'patient')}
            >
              <span>{mobileSegment === 'patient' ? '📋 Xem kế hoạch' : '👤 Sửa bệnh nhân'}</span>
              <span
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.8rem'
                }}
              >
                {plan.recommendations.length}
              </span>
            </button>
          </div>
        )}

        {/* Tab Lộ trình */}
        {activeTab === 'pathway' && <PathwayView />}

        {/* Tab Bằng chứng */}
        {activeTab === 'evidence' && <MatrixView initialDrugId={matrixTargetDrug} />}

        {/* Tab Học */}
        {activeTab === 'learn' && <LearnView />}

        {/* Tab Cài đặt */}
        {activeTab === 'settings' && (
          <SettingsView settings={settings} onUpdateSettings={setSettings} />
        )}

        {/* Tab Giới thiệu */}
        {activeTab === 'about' && <AboutView />}
      </main>

      <section className="print-document" data-testid="print-document" aria-label="Bản in kế hoạch">
        <h1>GDMT-VN · Kế hoạch thử nghiệm</h1><pre>{noteText}</pre>
      </section>
      {share && <ShareDialog key={share} kind={share} text={share === 'note' ? noteText : window.location.href} onClose={() => setShare(undefined)} />}
      {showReset && <Modal title="Bắt đầu hồ sơ mới" onClose={() => setShowReset(false)}>
        <p>Hồ sơ đang mở sẽ được xóa khỏi phiên này. Bạn có thể lưu thành tệp trước khi bắt đầu hồ sơ mới.</p>
        <div className="workspace-actions"><button type="button" className="workspace-button" onClick={() => setShowReset(false)}>Hủy</button>
          <button type="button" className="workspace-button primary" onClick={handleResetPatient}>Tạo hồ sơ trống</button></div>
      </Modal>}

      {/* Mobile Bottom Tab Bar */}
      <div className="mobile-nav-bar">
        <button
          type="button"
          className={`mobile-tab-btn ${activeTab === 'pathway' ? 'active' : ''}`}
          onClick={() => setActiveTab('pathway')}
        >
          <span className="mobile-tab-icon">🗺️</span>
          <span>Lộ trình</span>
        </button>
        <button
          type="button"
          className={`mobile-tab-btn ${activeTab === 'plan' ? 'active' : ''}`}
          onClick={() => setActiveTab('plan')}
        >
          <span className="mobile-tab-icon">📋</span>
          <span>Phác đồ</span>
        </button>
        <button
          type="button"
          className={`mobile-tab-btn ${activeTab === 'evidence' ? 'active' : ''}`}
          onClick={() => setActiveTab('evidence')}
        >
          <span className="mobile-tab-icon">📊</span>
          <span>Bằng chứng</span>
        </button>
        <button
          type="button"
          className={`mobile-tab-btn ${activeTab === 'learn' ? 'active' : ''}`}
          onClick={() => setActiveTab('learn')}
        >
          <span className="mobile-tab-icon">📚</span>
          <span>Học</span>
        </button>
        <button
          type="button"
          className={`mobile-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <span className="mobile-tab-icon">⚙️</span>
          <span>Cài đặt</span>
        </button>
      </div>

      {/* Modal Bệnh nhân mẫu (Presets) */}
      {showPresetsModal && (
        <Modal title="Chọn Bệnh Nhân Mẫu Chuẩn" onClose={() => setShowPresetsModal(false)}>
            <label className="form-label" htmlFor="preset-search">Tìm ca theo bệnh hoặc tình huống</label>
            <input id="preset-search" className="form-input" type="search" value={presetSearch} onChange={(event) => setPresetSearch(event.target.value)} placeholder="Ví dụ: suy tim, CKD, tăng kali…" />
            <p className="workspace-feedback">{visiblePresets.length} ca giả lập</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {visiblePresets.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-subtle)', padding: '1rem' }}>
                  Không tìm thấy ca phù hợp. Thử tên bệnh hoặc tình huống khác.
                </div>
              ) : (
                visiblePresets.map((preset) => (
                  <button type="button" className="preset-choice"
                    key={preset.id}
                    data-testid={`preset-item-${preset.id}`}
                    style={{
                      padding: '0.85rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-muted)',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      const applied = applyPresetSelection(
                        preset,
                        settings,
                        patient.selectedModules,
                        allInputFieldsForUi
                      );
                      setSettings(applied.settings);
                      setPatient(restorePatient(applied.patient));
                      setLoadError(undefined);
                      setShowPresetsModal(false);
                    }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>
                      {preset.nameVi}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {preset.description}
                    </div>
                  </button>
                ))
              )}
            </div>
        </Modal>
      )}

      {/* Modal Báo sai (Report Issue) */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>🚩 Báo Sai / Góp Ý Lâm Sàng</h3>
              <button
                type="button"
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
                onClick={() => setShowReportModal(false)}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Mô tả chi tiết điểm sai lệch giữa khuyến cáo của hệ thống và guideline/thực tế lâm sàng. Bấm nút dưới đây để sao chép toàn bộ gói trạng thái JSON kèm mô tả vào Clipboard:
            </p>

            <textarea
              aria-label="Mô tả lỗi hoặc góp ý"
              className="form-input"
              rows={4}
              style={{ width: '100%', marginBottom: '1rem' }}
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="Nhập mô tả lỗi (vd: Thuốc Dapagliflozin ghi sai ngưỡng eGFR theo KDIGO 2024 trang 32...)"
            />
            {reportCopyError && <><p role="alert">Không thể sao chép tự động. Chọn gói dữ liệu dưới đây để sao chép thủ công.</p>
              <textarea className="form-input workspace-text" aria-label="Gói dữ liệu báo lỗi" readOnly value={reportCopyError} onFocus={(event) => event.target.select()} /></>}

            <button
              type="button"
              className="btn-header"
              style={{
                width: '100%',
                justifyContent: 'center',
                background: reportSuccess ? '#16a34a' : 'var(--primary)',
                color: '#ffffff',
                minHeight: '42px',
                fontSize: '0.95rem'
              }}
              onClick={handleCopyReportData}
            >
              {reportSuccess ? '✓ Đã sao chép gói dữ liệu vào Clipboard!' : '📋 Sao chép JSON Trạng thái để gửi'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
