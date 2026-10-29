import { useState } from 'react';
import type { MatrixDefinition, MatrixCellData } from '../engine/types';
import { getAllModules } from '../modules/registry';
import { getAllDrugs, fmtDose } from '../kb-types';
import { EvidenceQuote } from './EvidenceQuote';
import {
  deduplicateCleanCitationIds,
  resolveCitationDisplay,
  getAllSources,
  getReviewStatusForItem
} from './kbLookup';

export interface MatrixViewProps {
  matrix?: MatrixDefinition;
  initialDrugId?: string;
  onClose?: () => void;
}

const STATUS_LABELS: Record<string, { label: string; className: string; desc: string }> = {
  rec: { label: 'Khuyến cáo', className: 'cell-rec', desc: 'Có chỉ định rõ ràng theo guideline' },
  ok: { label: 'Cho phép', className: 'cell-ok', desc: 'Sử dụng an toàn, không cần chỉnh liều đặc biệt' },
  caution: { label: 'Thận trọng', className: 'cell-caution', desc: 'Cần giảm liều hoặc theo dõi sát sinh hóa' },
  not_rec: { label: 'Không K/C', className: 'cell-not_rec', desc: 'Không khuyến cáo khởi trị mới' },
  contra: { label: 'Chống CĐ', className: 'cell-contra', desc: 'Chống chỉ định tuyệt đối' },
  no_data: { label: '--', className: 'cell-no_data', desc: 'Chưa có đủ dữ liệu an toàn' }
};

export const MatrixView = ({
  matrix,
  initialDrugId
}: MatrixViewProps) => {
  const allAvailableMatrices: MatrixDefinition[] = [];
  if (matrix) {
    allAvailableMatrices.push(matrix);
  }
  for (const mod of getAllModules()) {
    if (mod.matrix && !allAvailableMatrices.some((m) => m.title === mod.matrix!.title)) {
      allAvailableMatrices.push(mod.matrix);
    }
    if (mod.matrices) {
      for (const m of mod.matrices) {
        if (!allAvailableMatrices.some((ex) => ex.title === m.title)) {
          allAvailableMatrices.push(m);
        }
      }
    }
  }

  const [selectedMatrixIdx, setSelectedMatrixIdx] = useState(0);
  const currentMatrix = allAvailableMatrices[selectedMatrixIdx];
  const [selectedCell, setSelectedCell] = useState<{
    drugId: string;
    drugName: string;
    columnLabel: string;
    cell: MatrixCellData;
  } | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'drugs' | 'sources'>('matrix');
  const [drugQuery, setDrugQuery] = useState('');

  const kbDrugs = getAllDrugs();
  const filteredDrugs = drugQuery.trim()
    ? kbDrugs.filter((d) => {
        const q = drugQuery.trim().toLowerCase();
        return (
          d.nameVi.toLowerCase().includes(q) ||
          d.inn.toLowerCase().includes(q) ||
          d.class.toLowerCase().includes(q) ||
          d.vnBrands.some((b) => b.toLowerCase().includes(q))
        );
      })
    : kbDrugs.slice(0, 30);

  const kbSources = getAllSources();

  return (
    <div className="panel" data-testid="matrix-view-panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <span>📊 Bằng chứng lâm sàng & Ma trận an toàn</span>
        </h2>
        <div className="segmented-control">
          <button
            type="button"
            className={`segmented-btn ${activeSubTab === 'matrix' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('matrix')}
          >
            Ma trận an toàn
          </button>
          <button
            type="button"
            className={`segmented-btn ${activeSubTab === 'drugs' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('drugs')}
          >
            Tra cứu thuốc ({kbDrugs.length})
          </button>
          <button
            type="button"
            className={`segmented-btn ${activeSubTab === 'sources' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('sources')}
          >
            Nguồn Guideline ({kbSources.length})
          </button>
        </div>
      </div>

      {activeSubTab === 'matrix' && (
        <div>
          {allAvailableMatrices.length > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              {allAvailableMatrices.map((m, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`segmented-btn ${selectedMatrixIdx === idx ? 'active' : ''}`}
                  onClick={() => setSelectedMatrixIdx(idx)}
                >
                  {m.title}
                </button>
              ))}
            </div>
          )}

          {!currentMatrix ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-subtle)' }}>
              Chưa có ma trận an toàn nào được đăng ký trong hệ thống.
            </div>
          ) : (
            <>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                {currentMatrix.title} (Ô trên: <strong>Khởi trị</strong> | Ô dưới: <strong>Duy trì</strong>; Bấm vào ô để xem chi tiết liều và trích dẫn nguyên văn).
              </div>

              <div className="matrix-container">
                <table className="matrix-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', minWidth: '150px' }}>Thuốc</th>
                      {currentMatrix.columns.map((col) => (
                        <th key={col.id} style={{ minWidth: '85px' }}>
                          <div>{col.label}</div>
                          {col.subLabel && <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: 400 }}>{col.subLabel}</div>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentMatrix.rows.map((row) => {
                      const isHighlighted = initialDrugId && row.drugId.toLowerCase() === initialDrugId.toLowerCase();
                      return (
                        <tr key={row.drugId} style={isHighlighted ? { background: '#eff6ff' } : undefined}>
                          <td style={{ textAlign: 'left', fontWeight: 600 }}>
                            {row.nameVi}
                          </td>
                          {currentMatrix.columns.map((col) => {
                            const cell = row.cells[col.id] || { initiate: 'no_data', continue: 'no_data', citationIds: [] };
                            const initInfo = STATUS_LABELS[cell.initiate] || STATUS_LABELS.no_data;
                            const contInfo = STATUS_LABELS[cell.continue] || STATUS_LABELS.no_data;

                            return (
                              <td key={col.id} style={{ padding: '3px' }}>
                                <div
                                  className="matrix-cell-box"
                                  onClick={() =>
                                    setSelectedCell({
                                      drugId: row.drugId,
                                      drugName: row.nameVi,
                                      columnLabel: col.subLabel ? `${col.label} (${col.subLabel})` : col.label,
                                      cell
                                    })
                                  }
                                  title={`Bấm xem trích dẫn: ${row.nameVi} tại ${col.label}`}
                                >
                                  <div
                                    className={initInfo.className}
                                    style={{
                                      fontSize: '0.7rem',
                                      fontWeight: 700,
                                      padding: '2px 4px',
                                      borderRadius: '3px 3px 0 0',
                                      borderBottom: '1px solid rgba(0,0,0,0.06)'
                                    }}
                                  >
                                    {initInfo.label}
                                  </div>
                                  <div
                                    className={contInfo.className}
                                    style={{
                                      fontSize: '0.7rem',
                                      fontWeight: 600,
                                      padding: '2px 4px',
                                      borderRadius: '0 0 3px 3px'
                                    }}
                                  >
                                    {contInfo.label}
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Chú giải Matrix */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem', fontSize: '0.8rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Chú giải:</span>
                {Object.entries(STATUS_LABELS).map(([key, item]) => (
                  <span key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span className={item.className} style={{ width: '12px', height: '12px', borderRadius: '2px', display: 'inline-block' }} />
                    <span>{item.label} ({item.desc})</span>
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {activeSubTab === 'drugs' && (
        <div style={{ fontSize: '0.9rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <div style={{ fontWeight: 600 }}>
              Từ điển hoạt chất trong Cơ sở Tri thức GDMT-VN ({kbDrugs.length} thuốc):
            </div>
            <input
              type="text"
              className="form-input"
              style={{ maxWidth: '300px', width: '100%' }}
              value={drugQuery}
              onChange={(e) => setDrugQuery(e.target.value)}
              placeholder="Tìm tên thuốc, biệt dược VN, nhóm..."
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filteredDrugs.map((d) => {
              const revStatus = getReviewStatusForItem(d.id);
              return (
                <div key={d.id} style={{ padding: '0.75rem', background: 'var(--bg-muted)', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <div>
                      <strong>{d.nameVi}</strong> ({d.class})
                      {d.vnBrands.length > 0 && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginLeft: '0.4rem' }}>
                          • Biệt dược: {d.vnBrands.slice(0, 3).join(', ')}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                      Trạng thái: {revStatus === 'ai_multi_reviewed' ? 'Đa AI đồng thuận' : revStatus === 'ai_cross_checked' ? 'AI đối chiếu' : revStatus === 'auto_checked' ? 'Máy kiểm chứng' : 'Bản nháp'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Khởi đầu: {fmtDose(d.start) || 'Theo chỉ định'} • Đích: {fmtDose(d.target) || 'Tối đa dung nạp'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeSubTab === 'sources' && (
        <div style={{ fontSize: '0.9rem' }}>
          <div style={{ marginBottom: '0.75rem', fontWeight: 600 }}>
            Tài liệu hướng dẫn điều trị và nhãn thuốc đã đăng ký trong KB ({kbSources.length} nguồn):
          </div>
          <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', color: 'var(--text-muted)' }}>
            {kbSources.map((src) => (
              <li key={src.id}>
                <strong>{src.org} ({src.year}):</strong> {src.title}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginLeft: '0.4rem' }}>
                  [{src.jurisdiction}]
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modal chi tiết ô được chọn */}
      {selectedCell && (
        <div className="modal-overlay" onClick={() => setSelectedCell(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                Chi tiết sử dụng {selectedCell.drugName} ({selectedCell.columnLabel})
              </h3>
              <button
                type="button"
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
                onClick={() => setSelectedCell(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <div><strong>Khởi trị:</strong> {STATUS_LABELS[selectedCell.cell.initiate]?.label || selectedCell.cell.initiate}</div>
              <div><strong>Duy trì:</strong> {STATUS_LABELS[selectedCell.cell.continue]?.label || selectedCell.cell.continue}</div>
              {selectedCell.cell.dose && (
                <div><strong>Liều khuyến cáo:</strong> {selectedCell.cell.dose}</div>
              )}
              {selectedCell.cell.note && (
                <div style={{ marginTop: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <strong>Lưu ý:</strong> {selectedCell.cell.note}
                </div>
              )}
            </div>

            {deduplicateCleanCitationIds(selectedCell.cell.citationIds).length > 0 && (
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  Trích dẫn guideline nguyên văn:
                </div>
                {deduplicateCleanCitationIds(selectedCell.cell.citationIds).map((cid) => {
                  const resolved = resolveCitationDisplay(cid, { drugId: selectedCell.drugId });
                  return (
                    <EvidenceQuote
                      key={cid}
                      quote={resolved.quote}
                      quoteVi={resolved.quoteVi}
                      sourceOrg={resolved.sourceOrg}
                      sourceTitle={resolved.sourceTitle}
                      locator={resolved.locator}
                      page={resolved.page}
                      cor={resolved.cor}
                      loe={resolved.loe}
                      reviewStatus={resolved.reviewStatus}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
