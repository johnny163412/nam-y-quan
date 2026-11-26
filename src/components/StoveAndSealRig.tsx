import React from 'react';
import { DosingAdvice, FireType } from '../types/tcm';

const FIRE_META: { id: FireType; title: string; badge: string; range: [number, number] }[] = [
  { id: 'vu-hoa', title: 'Vũ Hỏa', badge: '75–100%', range: [75, 100] },
  { id: 'van-vu', title: 'Văn Vũ', badge: '42–74%', range: [42, 74] },
  { id: 'van-hoa', title: 'Văn Hỏa', badge: '15–41%', range: [15, 41] }
];

const DOSING_CUPS: { id: DosingAdvice; label: string }[] = [
  { id: 'nong-dap-chan', label: 'Uống nóng · Đắp chăn' },
  { id: 'am-thoang-gio', label: 'Uống ấm · Thoáng gió' },
  { id: 'am-duong-tang', label: 'Uống ấm · Sau bữa ăn' }
];

interface StoveAndSealRigProps {
  fire: FireType;
  dosing: DosingAdvice;
  fanHeat: number;
  fanBlowing: boolean;
  hasBatTrangPot: boolean;
  hasJadeSeal: boolean;
  stampingActive: boolean;
  assignedHerbsText: string;
  patientName: string;
  onSelectFire: (f: FireType) => void;
  onSelectDosing: (d: DosingAdvice) => void;
  onFanStroke: (up: boolean) => void;
  onStampSubmit: () => void;
}

export const StoveAndSealRig: React.FC<StoveAndSealRigProps> = ({
  fire,
  dosing,
  fanHeat,
  fanBlowing,
  hasBatTrangPot,
  hasJadeSeal,
  stampingActive,
  assignedHerbsText,
  patientName,
  onSelectFire,
  onSelectDosing,
  onFanStroke,
  onStampSubmit
}) => {
  const activeRange = FIRE_META.find((f) => f.id === fire)?.range ?? [42, 74];
  const isMatched = fanHeat >= activeRange[0] && fanHeat <= activeRange[1];

  return (
    <div className="stove-seal-rig">
      {/* Live Animated Terracotta Decoction Stove + SVG Multi-layer Fire + Spout Steam + Swinging Fan */}
      <div className={`live-hearth-stage fire-${fire} ${fanBlowing ? 'is-fanning' : ''}`}>
        <svg viewBox="0 0 380 186" className="hearth-svg" role="img" aria-label="Bếp than hồng sắc siêu đất nung và quạt nan">
          <defs>
            <radialGradient id="hearthGlow" cx="44%" cy="78%" r="55%">
              <stop offset="0%" stopColor="rgba(255, 130, 42, 0.55)" />
              <stop offset="65%" stopColor="rgba(195, 58, 18, 0.18)" />
              <stop offset="100%" stopColor="rgba(20, 11, 6, 0)" />
            </radialGradient>
          </defs>

          {/* Dark wood hearth backdrop + ember glow */}
          <rect x="0" y="0" width="380" height="186" fill="#1C110A" />
          <rect x="0" y="0" width="380" height="186" fill="url(#hearthGlow)" style={{ opacity: Math.max(0.35, fanHeat / 100) }} />
          <rect x="0" y="148" width="380" height="38" fill="#2A190E" stroke="#634224" strokeWidth="1.5" />

          {/* Clay Stove & Ember Pit */}
          <path d="M104 128 H222 L214 166 H112 Z" fill="#5E3522" stroke="#2D160B" strokeWidth="2" />
          <ellipse cx="163" cy="128" rx="59" ry="12" fill="#2B140A" stroke="#854B2E" strokeWidth="2" />
          <ellipse cx="163" cy="148" rx="22" ry="9" fill="#4A1708" />

          {/* Animated Multi-Layer Fire Flames */}
          <g className="hearth-flames-group">
            <path d="M132 132 Q144 96 156 128 Q165 88 176 128 Q186 98 196 132 Z" fill="#E8581E" />
            <path d="M142 132 Q151 104 163 128 Q174 102 185 132 Z" fill="#FFB848" />
          </g>

          {/* Terracotta or Antique Bát Tràng Ceramic Kettle */}
          <g transform="translate(0, 0)">
            {/* Spout & Steam Wisps */}
            <path d="M114 88 Q90 80 86 64 L96 62 Q100 74 118 80 Z" fill={hasBatTrangPot ? '#D8D4C2' : '#964928'} stroke="#2F180D" strokeWidth="1.8" />
            <g className="kettle-spout-steam" stroke="rgba(255, 245, 224, 0.78)" strokeWidth="2.4" fill="none" strokeLinecap="round">
              <path d="M88 58 Q78 40 89 24 Q96 12 85 4" />
              <path d="M93 56 Q102 39 92 22 Q86 12 97 3" />
            </g>
            {/* Kettle body */}
            <path
              d="M115 74 C112 108 124 126 163 126 C202 126 214 108 211 74 C208 58 190 52 163 52 C136 52 118 58 115 74 Z"
              fill={hasBatTrangPot ? '#EDE4CE' : '#A44F2A'}
              stroke={hasBatTrangPot ? '#28527A' : '#31170A'}
              strokeWidth="2.2"
            />
            {hasBatTrangPot && (
              <path d="M134 86 Q163 96 192 86 M140 98 Q163 106 186 98" stroke="#28527A" strokeWidth="2" fill="none" opacity="0.72" />
            )}
            {/* Lid & Bamboo Handle */}
            <ellipse cx="163" cy="54" rx="28" ry="7" fill={hasBatTrangPot ? '#D8CEB8' : '#853D1E'} stroke="#2E160A" strokeWidth="1.6" />
            <circle cx="163" cy="46" r="5" fill="#CFA052" stroke="#2E160A" strokeWidth="1.4" />
            <path d="M210 72 Q232 76 230 96 Q228 110 206 108" fill="none" stroke="#6E4422" strokeWidth="6" strokeLinecap="round" />
          </g>

          {/* Animated Bamboo Hand Fan (Quạt Nan) on Right */}
          <g className="hearth-bamboo-fan">
            <path d="M274 146 L292 120" stroke="#A67438" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M266 96 C272 64 316 58 334 86 C348 108 326 134 294 126 Z" fill="#D9B675" stroke="#69461E" strokeWidth="1.8" />
            <path d="M294 122 L286 78 M294 122 L308 72 M294 122 L326 88" stroke="#9B7238" strokeWidth="1.1" />
          </g>

          {/* Flying Ember Sparks when Fan blows */}
          <g className="fan-sparks-group" fill="#FFCE54">
            <circle cx="242" cy="116" r="2.2" />
            <circle cx="222" cy="102" r="1.8" />
            <circle cx="196" cy="96" r="2.1" />
          </g>
        </svg>

        <div className="hearth-caption-strip">
          <span>
            <strong>Trong siêu:</strong> {assignedHerbsText || 'Chưa có vị thuốc'}
          </span>
          <span className={`tag-badge ${isMatched ? 'fan-ok' : ''}`} style={{ background: isMatched ? '#23574C' : '#5A3E28' }}>
            Nhiệt: {fanHeat}% {isMatched ? '· Chuẩn (+2đ)' : `(${activeRange[0]}–${activeRange[1]}%)`}
          </span>
        </div>
      </div>

      {/* Compact Fire Meter + Round Fan Controls */}
      <div className="fan-meter-track" aria-hidden="true" style={{ marginBottom: '8px' }}>
        <div
          className="fan-meter-target"
          style={{ left: `${activeRange[0]}%`, width: `${activeRange[1] - activeRange[0]}%` }}
        />
        <div className="fan-meter-needle" style={{ left: `${fanHeat}%` }} />
      </div>

      <div className="hearth-controls-grid">
        <div className="round-choices-group">
          <span className="mini-group-title">Độ lửa:</span>
          {FIRE_META.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`wooden-token-btn ${fire === opt.id ? 'active' : ''}`}
              onClick={() => onSelectFire(opt.id)}
              title={`Chọn ${opt.title} (${opt.badge})`}
            >
              {opt.title}
            </button>
          ))}
        </div>

        <div className="round-choices-group">
          <button
            type="button"
            className="wooden-token-btn fan-btn"
            onClick={() => onFanStroke(true)}
          >
            Quạt bùng lửa (+)
          </button>
          <button
            type="button"
            className="wooden-token-btn"
            onClick={() => onFanStroke(false)}
          >
            Ủ tro dịu (-)
          </button>
        </div>
      </div>

      {/* Porcelain Dosing Cups */}
      <div className="round-choices-group" style={{ marginTop: '8px' }}>
        <span className="mini-group-title">Dặn {patientName}:</span>
        {DOSING_CUPS.map((cup) => (
          <button
            key={cup.id}
            type="button"
            className={`porcelain-cup-btn ${dosing === cup.id ? 'active' : ''}`}
            onClick={() => onSelectDosing(cup.id)}
          >
            {cup.label}
          </button>
        ))}
      </div>

      {/* Physical Wood Dragon Seal Stamp on Vermilion Pad */}
      <div className="physical-seal-dock">
        <button
          type="button"
          className={`wooden-seal-button ${hasJadeSeal ? 'is-jade' : ''} ${stampingActive ? 'is-slamming' : ''}`}
          disabled={stampingActive}
          onClick={onStampSubmit}
        >
          <span className="seal-knob" aria-hidden="true" />
          <span className="seal-face">
            {stampingActive ? 'Đang Dập Ấn...' : 'Dập Ấn Chu Sa · Giao Thuốc'}
          </span>
        </button>
      </div>
    </div>
  );
};
