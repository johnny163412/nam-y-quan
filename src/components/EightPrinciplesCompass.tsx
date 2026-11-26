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

const ELEMENT_FULL: Record<ElementKey, string> = {
  moc: 'Mộc (Can)',
  hoa: 'Hỏa (Tâm)',
  tho: 'Thổ (Tỳ)',
  kim: 'Kim (Phế)',
  thuy: 'Thủy (Thận)'
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
      label: 'Biểu ↔ Lý',
      init: initialVector.exteriorInterior,
      prev: previewVector.exteriorInterior
    },
    {
      label: 'Hàn ↔ Nhiệt',
      init: initialVector.coldHeat,
      prev: previewVector.coldHeat
    },
    {
      label: 'Hư ↔ Thực',
      init: initialVector.deficiencyExcess,
      prev: previewVector.deficiencyExcess
    }
  ];

  const outerDialDeg =
    -ELEMENT_ANGLES[diagnosis.primaryElement] + (diagnosis.location === 'bieu' ? -10 : 10);
  const initNeedleDeg = Math.max(-72, Math.min(72, (initialVector.coldHeat / 100) * 70));
  const previewNeedleDeg = showTreatmentProjection
    ? Math.max(-72, Math.min(72, (previewVector.coldHeat / 100) * 70))
    : initNeedleDeg;
  const isBalanced = showTreatmentProjection && balanceScore >= 75;

  return (
    <div className="compass-box dial-centric-box">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px', flexWrap: 'wrap' }}>
        <strong style={{ fontFamily: 'var(--font-serif)', fontSize: '0.98rem' }}>
          La Bàn Đồng Bát Quái — Biện Chứng
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
            Quân bình: {balanceScore}%
          </span>
        )}
      </div>

      {/* Interactive Ring of 5 Elements around Rotating Brass Compass */}
      <div className="dial-orbit-wrap">
        <div className={`brass-dial-shell ${isBalanced ? 'is-harmonized' : ''}`}>
          <svg width="144" height="144" viewBox="0 0 132 132" className="brass-dial-svg" aria-hidden="true">
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
                  <text key={lbl} x={tx} y={ty} textAnchor="middle" fontSize="7.4" fontWeight="700" fill="#FFF0CE">
                    {lbl}
                  </text>
                );
              })}
              {Array.from({ length: 8 }).map((_, i) => (
                <g key={i} transform={`rotate(${i * 45} 66 66)`}>
                  <line x1="60" y1="22" x2="72" y2="22" stroke="#D59E49" strokeWidth="1.2" />
                  <line x1="60" y1="25" x2="72" y2="25" stroke="#D59E49" strokeWidth="1" strokeDasharray={i % 2 ? '4 2' : undefined} />
                </g>
              ))}
            </g>

            <circle cx="66" cy="66" r="32" fill="#2A1B11" stroke="#6E4A24" strokeWidth="1" />
            <line x1="66" y1="34" x2="66" y2="98" stroke="rgba(227,188,108,0.28)" strokeWidth="1" />
            <line x1="34" y1="66" x2="98" y2="66" stroke="rgba(227,188,108,0.28)" strokeWidth="1" />

            <g style={{ transformOrigin: '66px 66px', transform: `rotate(${initNeedleDeg}deg)`, transition: 'transform 360ms ease' }}>
              <polygon points="66,35 69,66 63,66" fill="#C93B32" opacity="0.9" />
            </g>
            <g style={{ transformOrigin: '66px 66px', transform: `rotate(${previewNeedleDeg}deg)`, transition: 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)' }}>
              <polygon points="66,33 68.5,66 63.5,66" fill={isBalanced ? '#74DFC4' : '#E7B96A'} />
            </g>

            <circle cx="66" cy="66" r="9.5" fill="#FAF0D8" stroke="#D59E49" strokeWidth="1.4" />
            <path d="M66 56.5 A9.5 9.5 0 0 1 66 75.5 A4.75 4.75 0 0 1 66 66 A4.75 4.75 0 0 0 66 56.5 Z" fill="#24160E" />
            <circle cx="66" cy="61.2" r="1.4" fill="#FAF0D8" />
            <circle cx="66" cy="70.8" r="1.4" fill="#24160E" />
          </svg>
          <div className="brass-dial-caption">
            {diagnosis.nature === 'han' ? 'Hàn' : 'Nhiệt'} · {ELEMENT_FULL[diagnosis.primaryElement]}
          </div>
        </div>

        {/* 3 Slim Axis Bars */}
        <div style={{ flex: 1, minWidth: '170px' }}>
          {axes.map((ax) => (
            <div className="axis-row" key={ax.label}>
              <div className="axis-labels">
                <span>{ax.label.split(' ↔ ')[0]}</span>
                <span>{ax.label.split(' ↔ ')[1]}</span>
              </div>
              <div className="axis-track" aria-label={ax.label}>
                <div className="axis-center-line" />
                <div className="axis-marker-initial" style={{ left: `${toPercent(ax.init)}%` }} />
                {showTreatmentProjection && (
                  <div className="axis-marker-preview" style={{ left: `${toPercent(ax.prev)}%` }} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Round Brass Toggles & 5 Element Petals (Zero Boxes) */}
      <div className="compass-knobs-row" role="group" aria-label="Chốt Bát Cương">
        <div className="brass-pair-toggle">
          <button
            type="button"
            className={`knob-half ${diagnosis.location === 'bieu' ? 'active' : ''}`}
            onClick={() => onChangeDiagnosis({ ...diagnosis, location: 'bieu' })}
          >
            Biểu chứng
          </button>
          <button
            type="button"
            className={`knob-half ${diagnosis.location === 'ly' ? 'active' : ''}`}
            onClick={() => onChangeDiagnosis({ ...diagnosis, location: 'ly' })}
          >
            Lý chứng
          </button>
        </div>

        <div className="brass-pair-toggle">
          <button
            type="button"
            className={`knob-half ${diagnosis.nature === 'han' ? 'active' : ''}`}
            onClick={() => onChangeDiagnosis({ ...diagnosis, nature: 'han' })}
          >
            Hàn chứng
          </button>
          <button
            type="button"
            className={`knob-half ${diagnosis.nature === 'nhiet' ? 'active' : ''}`}
            onClick={() => onChangeDiagnosis({ ...diagnosis, nature: 'nhiet' })}
          >
            Nhiệt chứng
          </button>
        </div>

        <div className="brass-pair-toggle">
          <button
            type="button"
            className={`knob-half ${diagnosis.state === 'hu' ? 'active' : ''}`}
            onClick={() => onChangeDiagnosis({ ...diagnosis, state: 'hu' })}
          >
            Hư chứng
          </button>
          <button
            type="button"
            className={`knob-half ${diagnosis.state === 'thuc' ? 'active' : ''}`}
            onClick={() => onChangeDiagnosis({ ...diagnosis, state: 'thuc' })}
          >
            Thực chứng
          </button>
        </div>
      </div>

      <div className="element-petals-row" role="group" aria-label="Tạng Phủ Trọng Tâm">
        {ELEMENT_CYCLE_ORDER.map((el) => (
          <button
            key={el}
            type="button"
            className={`element-petal-btn el-${el} ${diagnosis.primaryElement === el ? 'active' : ''}`}
            onClick={() => onChangeDiagnosis({ ...diagnosis, primaryElement: el })}
            title={ELEMENT_FULL[el]}
          >
            {ELEMENT_SHORT[el]}
          </button>
        ))}
      </div>
    </div>
  );
};
