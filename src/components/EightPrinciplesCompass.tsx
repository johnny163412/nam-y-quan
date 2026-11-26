import React from 'react';
import { ELEMENT_CYCLE_ORDER, ELEMENT_SHORT } from '../engine/tcmEngine';
import { DiagnosisChoice, EightPrinciplesVector, ElementKey } from '../types/tcm';

interface EightPrinciplesCompassProps {
  initialVector: EightPrinciplesVector;
  previewVector: EightPrinciplesVector;
  balanceScore: number;
  diagnosis: DiagnosisChoice;
  onChangeDiagnosis: (next: DiagnosisChoice) => void;
  showTreatmentProjection: boolean;
}

function toPercent(value: number): number {
  return Math.max(4, Math.min(96, ((value + 100) / 200) * 100));
}

export const EightPrinciplesCompass: React.FC<EightPrinciplesCompassProps> = ({
  initialVector,
  previewVector,
  balanceScore,
  diagnosis,
  onChangeDiagnosis,
  showTreatmentProjection
}) => {
  const axes = [
    {
      label: 'Vị trí bệnh (Biểu — Lý)',
      left: 'Biểu (Ngoài da kinh lạc)',
      right: 'Lý (Tạng phủ sâu)',
      init: initialVector.exteriorInterior,
      prev: previewVector.exteriorInterior
    },
    {
      label: 'Tính chất (Hàn — Nhiệt)',
      left: 'Hàn (Lạnh)',
      right: 'Nhiệt (Nóng)',
      init: initialVector.coldHeat,
      prev: previewVector.coldHeat
    },
    {
      label: 'Chính / Tà (Hư — Thực)',
      left: 'Hư (Chính khí suy)',
      right: 'Thực (Tà khí thịnh)',
      init: initialVector.deficiencyExcess,
      prev: previewVector.deficiencyExcess
    }
  ];

  return (
    <div className="compass-box">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '8px', flexWrap: 'wrap' }}>
        <strong style={{ fontFamily: 'var(--font-serif)', fontSize: '0.98rem' }}>
          La Bàn Bát Cương &amp; Hướng Điều Hòa
        </strong>
        {showTreatmentProjection && (
          <span
            className="tag-badge"
            style={{
              background: balanceScore >= 75 ? 'var(--herbal-jade-soft)' : 'var(--brass-soft)',
              color: balanceScore >= 75 ? 'var(--herbal-jade)' : 'var(--brass-ochre)'
            }}
          >
            Độ quân bình dự kiến: {balanceScore}%
          </span>
        )}
      </div>

      {axes.map((ax) => (
        <div className="axis-row" key={ax.label}>
          <div className="axis-labels">
            <span>{ax.left}</span>
            <span style={{ color: 'var(--ink-muted)', fontWeight: 500 }}>{ax.label}</span>
            <span>{ax.right}</span>
          </div>
          <div className="axis-track" aria-label={ax.label}>
            <div className="axis-center-line" title="Âm bình Dương bí (Mục tiêu)" />
            <div
              className="axis-marker-initial"
              style={{ left: `${toPercent(ax.init)}%` }}
              title="Trạng thái bệnh ban đầu (Chấm đỏ)"
            />
            {showTreatmentProjection && (
              <div
                className="axis-marker-preview"
                style={{ left: `${toPercent(ax.prev)}%` }}
                title="Sau khi kê đơn & bấm huyệt (Kim xanh)"
              />
            )}
          </div>
        </div>
      ))}

      <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginBottom: '8px' }}>
        Chấm đỏ: Lệch bệnh hiện tại | Kim xanh: Điểm cân bằng sau khi đặt thuốc vào Cân Tiểu Ly
      </div>

      <div className="diag-selector-grid">
        <div className="diag-group">
          <span className="diag-group-label">1. Chốt Biểu / Lý</span>
          <div className="toggle-pair">
            <button
              type="button"
              className={`toggle-pill ${diagnosis.location === 'bieu' ? 'active' : ''}`}
              onClick={() => onChangeDiagnosis({ ...diagnosis, location: 'bieu' })}
            >
              Biểu chứng
            </button>
            <button
              type="button"
              className={`toggle-pill ${diagnosis.location === 'ly' ? 'active' : ''}`}
              onClick={() => onChangeDiagnosis({ ...diagnosis, location: 'ly' })}
            >
              Lý chứng
            </button>
          </div>
        </div>

        <div className="diag-group">
          <span className="diag-group-label">2. Chốt Hàn / Nhiệt</span>
          <div className="toggle-pair">
            <button
              type="button"
              className={`toggle-pill ${diagnosis.nature === 'han' ? 'active' : ''}`}
              onClick={() => onChangeDiagnosis({ ...diagnosis, nature: 'han' })}
            >
              Hàn chứng
            </button>
            <button
              type="button"
              className={`toggle-pill ${diagnosis.nature === 'nhiet' ? 'active' : ''}`}
              onClick={() => onChangeDiagnosis({ ...diagnosis, nature: 'nhiet' })}
            >
              Nhiệt chứng
            </button>
          </div>
        </div>

        <div className="diag-group">
          <span className="diag-group-label">3. Chốt Hư / Thực</span>
          <div className="toggle-pair">
            <button
              type="button"
              className={`toggle-pill ${diagnosis.state === 'hu' ? 'active' : ''}`}
              onClick={() => onChangeDiagnosis({ ...diagnosis, state: 'hu' })}
            >
              Hư chứng
            </button>
            <button
              type="button"
              className={`toggle-pill ${diagnosis.state === 'thuc' ? 'active' : ''}`}
              onClick={() => onChangeDiagnosis({ ...diagnosis, state: 'thuc' })}
            >
              Thực chứng
            </button>
          </div>
        </div>

        <div className="diag-group">
          <span className="diag-group-label">4. Tạng Phủ Trọng Tâm</span>
          <select
            aria-label="Tạng Phủ Trọng Tâm"
            className="case-select"
            value={diagnosis.primaryElement}
            onChange={(e) =>
              onChangeDiagnosis({ ...diagnosis, primaryElement: e.target.value as ElementKey })
            }
          >
            {ELEMENT_CYCLE_ORDER.map((el) => (
              <option key={el} value={el}>
                Hành {ELEMENT_SHORT[el]} (
                {el === 'moc'
                  ? 'Can - Đởm'
                  : el === 'hoa'
                  ? 'Tâm - Tiểu Trường'
                  : el === 'tho'
                  ? 'Tỳ - Vị'
                  : el === 'kim'
                  ? 'Phế - Đại Trường'
                  : 'Thận - Bàng Quang'}
                )
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
