import { useState } from 'react';
import type { PathwayDefinition } from '../engine/types';
import { getAllModules } from '../modules/registry';

export interface PathwayViewProps {
  pathway?: PathwayDefinition;
}

export const PathwayView = ({
  pathway
}: PathwayViewProps) => {
  const allAvailablePathways: PathwayDefinition[] = [];
  if (pathway) {
    allAvailablePathways.push(pathway);
  }
  for (const mod of getAllModules()) {
    if (mod.pathway && !allAvailablePathways.some((p) => p.title === mod.pathway!.title)) {
      allAvailablePathways.push(mod.pathway);
    }
    if (mod.pathways) {
      for (const p of mod.pathways) {
        if (!allAvailablePathways.some((ex) => ex.title === p.title)) {
          allAvailablePathways.push(p);
        }
      }
    }
  }

  const [selectedIdx, setSelectedIdx] = useState(0);
  const currentPathway = allAvailablePathways[selectedIdx];

  if (!currentPathway) {
    return (
      <div className="panel" data-testid="pathway-view-panel">
        <div className="panel-header">
          <h2 className="panel-title">
            <span>🗺️ Lộ trình điều trị GDMT</span>
          </h2>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-subtle)' }}>
          Chưa có lộ trình nào được đăng ký trong hệ thống.
        </div>
      </div>
    );
  }

  return (
    <div className="panel" data-testid="pathway-view-panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <span>🗺️ {currentPathway.title}</span>
        </h2>
        {allAvailablePathways.length > 1 && (
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {allAvailablePathways.map((p, idx) => (
              <button
                key={idx}
                type="button"
                className={`segmented-btn ${selectedIdx === idx ? 'active' : ''}`}
                onClick={() => setSelectedIdx(idx)}
              >
                {p.title}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
        Lộ trình tối ưu hóa điều trị nội khoa chuẩn y khoa theo từng giai đoạn, giúp bác sĩ chuẩn độ an toàn và không bỏ sót các trụ cột bảo vệ tim - thận.
      </div>

      <div className="pathway-timeline">
        {currentPathway.steps.map((step) => {
          const statusColors = {
            completed: { bg: '#16a34a', text: '#ffffff', badge: 'Đã hoàn thành' },
            active: { bg: '#2563eb', text: '#ffffff', badge: 'Đang thực hiện' },
            upcoming: { bg: '#94a3b8', text: '#ffffff', badge: 'Giai đoạn kế tiếp' }
          };
          const current = statusColors[step.status] || statusColors.upcoming;

          return (
            <div key={step.id} className="pathway-step-card">
              <div
                className="step-node"
                style={{ background: current.bg, color: current.text }}
              >
                {step.stepNumber}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {step.title}
                </h3>
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: `${current.bg}18`,
                    color: current.bg,
                    fontWeight: 700
                  }}
                >
                  {current.badge}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
