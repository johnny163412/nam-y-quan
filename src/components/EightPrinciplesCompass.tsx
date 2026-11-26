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

const ELEMENT_ANGLES: Record<ElementKey, number> = {
  moc: 0,
  hoa: 72,
  tho: 144,
  kim: 216,
  thuy: 288
};

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

  const outerDialDeg = -ELEMENT_ANGLES[diagnosis.primaryElement] + (diagnosis.location === 'bieu' ? -12 : 12);
  const initNeedleDeg = Math.max(-72, Math.min(72, (initialVector.coldHeat / 100) * 70));
  const previewNeedleDeg = showTreatmentProjection
    ? Math.max(-72, Math.min(72, (previewVector.coldHeat / 100) * 70))
    : initNeedleDeg;
  const isBalanced = showTreatmentProjection && balanceScore >= 75;

  return (
    <div className="compass-box">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '8px', flexWrap: 'wrap' }}>
        <strong style={{ fontFamily: 'var(--font-serif)', fontSize: '0.98rem' }}>
          La Bàn Bát Cương &amp; Đĩa Đồng Bát Quái
        </strong>
        {showTreatmentProjection && (
          <span
            className="tag-badge"
            style={{
              background: isBalanced ? '#23574C' : '#6B4616',
              color: '#FFF5E0',
              borderColor: 'var(--gold-trim)'
            }}
          >
            Độ quân bình dự kiến: {balanceScore}%
          </span>
        )}
      </div>

      {/* Mechanical Brass Bagua / Taiji Dial + 3 Axes side by side */}
      <div className="compass-brass-layout">
        <div className={`brass-dial-shell ${isBalanced ? 'is-harmonized' : ''}`} aria-hidden="true">
          <svg width="132" height="132" viewBox="0 0 132 132" className="brass-dial-svg">
            <defs>
              <radialGradient id="brassRingGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#3B2616" />
                <stop offset="68%" stopColor="#26170D" />
                <stop offset="86%" stopColor="#B8893D" />
                <stop offset="100%" stopColor="#6D491B" />
              </radialGradient>
            </defs>
            <circle cx="66" cy="66" r="62" fill="url(#brassRingGrad)" stroke="#E3BC6C" strokeWidth="1.6" />
            <circle cx="66" cy="66" r="48" fill="#1D120A" stroke="#9C6B24" strokeWidth="1.2" />

            {/* Rotating Outer Ngũ Hành & Bát Quái Ring */}
            <g
              style={{
                transformOrigin: '66px 66px',
                transform: `rotate(${outerDialDeg}deg)`,
                transition: 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)'
              }}
            >
              {['Mộc', 'Hỏa', 'Thổ', 'Kim', 'Thủy'].map((lbl, idx) => {
                const rad = ((idx * 72 - 90) * Math.PI) / 180;
                const tx = 66 + Math.cos(rad) * 54;
                const ty = 66 + Math.sin(rad) * 54 + 3;
                return (
                  <text
                    key={lbl}
                    x={tx}
                    y={ty}
                    textAnchor="middle"
                    fontSize="7.4"
                    fontWeight="700"
                    fill="#FFF0CE"
                  >
                    {lbl}
                  </text>
                );
              })}
              {Array.from({ length: 8 }).map((_, i) => {
                const ang = i * 45;
                return (
                  <g key={i} transform={`rotate(${ang} 66 66)`}>
                    <line x1="60" y1="22" x2="72" y2="22" stroke="#D59E49" strokeWidth="1.2" />
                    <line x1="60" y1="25" x2="72" y2="25" stroke="#D59E49" strokeWidth="1" strokeDasharray={i % 2 ? '4 2' : undefined} />
                  </g>
                );
              })}
            </g>

            {/* Inner Equilibrium Crosshair */}
            <circle cx="66" cy="66" r="32" fill="#2A1B11" stroke="#6E4A24" strokeWidth="1" />
            <line x1="66" y1="34" x2="66" y2="98" stroke="rgba(227,188,108,0.28)" strokeWidth="1" />
            <line x1="34" y1="66" x2="98" y2="66" stroke="rgba(227,188,108,0.28)" strokeWidth="1" />

            {/* Red initial pathology needle */}
            <g
              style={{
                transformOrigin: '66px 66px',
                transform: `rotate(${initNeedleDeg}deg)`,
                transition: 'transform 360ms ease'
              }}
            >
              <polygon points="66,35 69,66 63,66" fill="#C93B32" opacity="0.88" />
            </g>

            {/* Jade equilibrium preview needle */}
            <g
              style={{
                transformOrigin: '66px 66px',
                transform: `rotate(${previewNeedleDeg}deg)`,
                transition: 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)'
              }}
            >
              <polygon points="66,33 68.5,66 63.5,66" fill={isBalanced ? '#74DFC4' : '#E7B96A'} />
            </g>

            {/* Central Taiji Medallion */}
            <circle cx="66" cy="66" r="9" fill="#FAF0D8" stroke="#D59E49" strokeWidth="1.4" />
            <path d="M66 57 A9 9 0 0 1 66 75 A4.5 4.5 0 0 1 66 66 A4.5 4.5 0 0 0 66 57 Z" fill="#24160E" />
            <circle cx="66" cy="61.5" r="1.4" fill="#FAF0D8" />
            <circle cx="66" cy="70.5" r="1.4" fill="#24160E" />
          </svg>
          <div className="brass-dial-caption">
            {diagnosis.nature === 'han' ? 'Thiên Hàn' : 'Thiên Nhiệt'} · {ELEMENT_SHORT[diagnosis.primaryElement]}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {axes.map((ax) => (
            <div className="axis-row" key={ax.label}>
              <div className="axis-labels">
                <span>{ax.left}</span>
                <span style={{ color: 'var(--sand-muted)', fontWeight: 500 }}>{ax.label}</span>
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
        </div>
      </div>

      <div style={{ fontSize: '0.78rem', color: 'var(--sand-muted)', marginBottom: '8px' }}>
        Chấm đỏ / Kim son: Lệch bệnh hiện tại | Kim xanh / Kim vàng: Hướng cân bằng sau khi kê đơn
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
