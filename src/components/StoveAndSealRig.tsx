import React, { useState } from 'react';
import { DecoctionTasteReading, DosingAdvice, FireType } from '../types/tcm';
import { ApothecaryVfxCanvas } from './ApothecaryVfxCanvas';
import { AntiqueIcon } from './svg/AntiqueIcons';

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
  tasteReading: DecoctionTasteReading;
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
  tasteReading,
  onSelectFire,
  onSelectDosing,
  onFanStroke,
  onStampSubmit
}) => {
  const [showTasteCard, setShowTasteCard] = useState(false);
  const activeRange = FIRE_META.find((f) => f.id === fire)?.range ?? [42, 74];
  const isMatched = fanHeat >= activeRange[0] && fanHeat <= activeRange[1];

  return (
    <div className="stove-seal-rig">
      {/* Pure Hand-Painted Terracotta Stove + 60fps Volumetric Steam & Coal Spark Canvas */}
      <div className={`live-hearth-stage fire-${fire} ${fanBlowing ? 'is-fanning' : ''}`}>
        <div className="hearth-photo-stage">
          <img
            src="./art/tools/decoction-stove.jpg"
            alt="Bếp than hồng sắc siêu đất nung truyền thống"
            className="hearth-photo-img hearth-breathe"
          />
          <ApothecaryVfxCanvas
            mode="hearth"
            intensity={Math.max(0.25, Math.min(1, fanHeat / 100))}
            burstActive={fanBlowing}
            className="hearth-vfx-canvas"
          />

          {fanBlowing && <div className="fan-gust-sweep" aria-hidden="true" />}

          {hasBatTrangPot && (
            <span className="hearth-pot-relic-badge" title="Siêu Sứ Men Lam Bát Tràng (+1đ Dược hiệu)">
              <AntiqueIcon name="porcelain-pot" size={14} /> <span>Siêu Bát Tràng</span>
            </span>
          )}
        </div>

        <div className="hearth-caption-strip">
          <span>
            <strong>Trong siêu:</strong> {assignedHerbsText || 'Chưa có vị thuốc'}
          </span>
          <span
            className={`tag-badge ${isMatched ? 'fan-ok' : ''}`}
            style={{ background: isMatched ? '#23574C' : '#5A3E28' }}
          >
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
            Quạt lửa (+)
          </button>
          <button
            type="button"
            className="wooden-token-btn"
            onClick={() => onFanStroke(false)}
          >
            Ủ tro (-)
          </button>
          <button
            type="button"
            className={`wooden-token-btn taste-btn ${showTasteCard ? 'active' : ''}`}
            onClick={() => setShowTasteCard((v) => !v)}
            title="Nhấp thử một thìa nước thuốc đang sắc để cảm nhận Khí - Vị - Chiều hướng"
          >
            <AntiqueIcon name="tea-cup" size={14} /> <span>Nhấp Thử</span>
          </button>
        </div>
      </div>

      {showTasteCard && (
        <div className={`decoction-taste-card tone-${tasteReading.matchTone}`} role="status">
          <div className="taste-bowl-stage">
            <img
              src="./art/tools/porcelain-decoction-bowl.jpg"
              alt="Bát thuốc sứ Bát Tràng sóng sánh nước thuốc ấm"
              className="taste-bowl-thumb"
            />
            <span className="bowl-steam-wisp w1" aria-hidden="true" />
            <span className="bowl-steam-wisp w2" aria-hidden="true" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <strong style={{ fontFamily: 'var(--font-serif)', color: '#3b1e0a' }}>
                Nếm Thử Thìa Thuốc Trước Khi Ra Đơn
              </strong>
              <span className="muted-note" style={{ fontSize: '0.74rem' }}>{tasteReading.aroma}</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#2b1d12', lineHeight: 1.4 }}>
              <div><strong>Khí &amp; Vị:</strong> {tasteReading.flavorNote}</div>
              <div><strong>Hàn – Nhiệt:</strong> {tasteReading.thermalBalance}</div>
              <div style={{ marginTop: '3px', fontWeight: 600 }}>{tasteReading.recommendation}</div>
            </div>
          </div>
        </div>
      )}

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
