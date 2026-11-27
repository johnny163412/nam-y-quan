import React from 'react';
import { HERB_MAP } from '../data/herbs';
import { ELEMENT_CYCLE_ORDER, ELEMENT_SHORT } from '../engine/tcmEngine';
import {
  ContraindicationAlert,
  DiagnosisChoice,
  EightPrinciplesVector,
  ElementKey,
  Herb,
  PaoZhiMethod,
  PrescriptionSlots,
  RoleSlot,
  SlotPaoZhi
} from '../types/tcm';
import { BotanicalSvg } from './svg/BotanicalSvg';

const ROLE_META: { role: RoleSlot; short: string; weight: string }[] = [
  { role: 'quan', short: 'Quân', weight: 'Chủ lực' },
  { role: 'than', short: 'Thần', weight: 'Trợ Quân' },
  { role: 'ta', short: 'Tá', weight: 'Hỗ trợ' },
  { role: 'su', short: 'Sứ', weight: 'Điều hòa' }
];

const PAO_ZHI_BADGE: Record<PaoZhiMethod, string> = {
  'sinh-dung': '',
  'gia-dap': 'Giã',
  'sao-vang': 'Sao',
  'chich-mat': 'Mật'
};

interface BrassScaleRigProps {
  slots: PrescriptionSlots;
  slotPaoZhi: SlotPaoZhi;
  selectedSlot: RoleSlot;
  justScoopedRole: RoleSlot | null;
  animatingPanRole: RoleSlot | null;
  freshHerbIds: string[];
  diagnosis: DiagnosisChoice;
  initialVector: EightPrinciplesVector;
  previewVector: EightPrinciplesVector;
  balanceScore: number;
  alerts: ContraindicationAlert[];
  hasTreatment: boolean;
  hasDragonScale: boolean;
  panRefs: React.MutableRefObject<Record<RoleSlot, HTMLDivElement | null>>;
  onChangeDiagnosis: (next: DiagnosisChoice) => void;
  onSelectSlot: (role: RoleSlot) => void;
  onAssignHerb: (role: RoleSlot, herbId: string | null) => void;
}

function toPct(v: number): number {
  return Math.max(4, Math.min(96, ((v + 100) / 200) * 100));
}

function getHerbDirectionalStatus(
  herb: Herb,
  initialVector: EightPrinciplesVector,
  alerts: ContraindicationAlert[]
): 'danger' | 'helpful' | 'neutral' {
  if (alerts.some((a) => a.sourceId === herb.id)) return 'danger';
  const chInitial = initialVector.coldHeat;
  const chHerb = herb.vectorEffect.coldHeat;
  if (Math.abs(chInitial) >= 25 && chHerb !== 0) {
    if (Math.sign(chInitial) !== Math.sign(chHerb)) return 'helpful';
    return 'danger';
  }
  const deInitial = initialVector.deficiencyExcess;
  const deHerb = herb.vectorEffect.deficiencyExcess;
  if (Math.abs(deInitial) >= 25 && deHerb !== 0) {
    return Math.sign(deInitial) !== Math.sign(deHerb) ? 'helpful' : 'neutral';
  }
  return 'helpful';
}

export const BrassScaleRig: React.FC<BrassScaleRigProps> = ({
  slots,
  slotPaoZhi,
  selectedSlot,
  justScoopedRole,
  animatingPanRole,
  freshHerbIds,
  diagnosis,
  initialVector,
  previewVector,
  balanceScore,
  alerts,
  hasTreatment,
  hasDragonScale,
  panRefs,
  onChangeDiagnosis,
  onSelectSlot,
  onAssignHerb
}) => {
  const beamTilt = hasTreatment ? Math.max(-7, Math.min(7, previewVector.coldHeat / 13)) : 0;

  const initDist =
    Math.abs(initialVector.exteriorInterior) +
    Math.abs(initialVector.coldHeat) +
    Math.abs(initialVector.deficiencyExcess);
  const prevDist =
    Math.abs(previewVector.exteriorInterior) +
    Math.abs(previewVector.coldHeat) +
    Math.abs(previewVector.deficiencyExcess);
  const hasCritical = alerts.some((a) => a.severity === 'critical');
  const hasAnyAlert = alerts.length > 0;
  const improved = hasTreatment && prevDist < initDist;
  const worsened = hasTreatment && prevDist > initDist + 6;

  // Clinical direction verdict banner without leaking hidden textbook solution
  let verdictTone: 'idle' | 'balanced' | 'good' | 'warn' | 'critical' = 'idle';
  let verdictText = 'Hãy kéo hộc bốc vị thuốc lên 4 đĩa cân để xem chiều hướng Biện Chứng.';
  if (hasCritical) {
    verdictTone = 'critical';
    verdictText = `CẢNH BÁO NGƯỢC Y LÝ / CẤM KỴ: ${alerts.find((a) => a.severity === 'critical')?.message ?? 'Có vị thuốc xung khắc nặng với bệnh cơ!'}`;
  } else if (hasAnyAlert || worsened) {
    verdictTone = 'warn';
    verdictText = hasAnyAlert
      ? alerts[0].message
      : 'Ngược chiều bệnh cơ: Thang thuốc đang đẩy Hàn/Nhiệt hoặc Biểu/Lý lệch xa khỏi tâm cân bằng!';
  } else if (hasTreatment && balanceScore >= 75) {
    verdictTone = 'balanced';
    verdictText = `Âm Dương Quân Bình (${balanceScore}%): Thang thuốc thuận chiều, đưa Hàn–Nhiệt & Biểu–Lý tiến sát cân bằng!`;
  } else if (improved) {
    verdictTone = 'good';
    verdictText = `Thuận chiều bệnh cơ (${balanceScore}%): Các vị thuốc đang kéo lệch bệnh về gần tâm cân bằng. Có thể phối thêm Quân/Thần.`;
  }

  return (
    <div className={`brass-scale-rig ${hasDragonScale ? 'dragon-upgraded' : ''}`}>
      {/* Live Biện Chứng Feedback & Quick Adjustment Strip inside Dược Các */}
      <div className="dispensary-compass-strip">
        <div className="dispensary-diag-row">
          <div className="diag-quick-pills" role="group" aria-label="Biện chứng nhanh tại Dược Các">
            <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#E7B96A' }}>Biện chứng đã chốt:</span>
            <button
              type="button"
              className="mini-toggle-chip"
              onClick={() =>
                onChangeDiagnosis({
                  ...diagnosis,
                  location: diagnosis.location === 'bieu' ? 'ly' : 'bieu'
                })
              }
              title="Nhấp để đổi nhanh Biểu / Lý"
            >
              {diagnosis.location === 'bieu' ? 'Biểu chứng' : 'Lý chứng'} ↻
            </button>
            <button
              type="button"
              className="mini-toggle-chip"
              onClick={() =>
                onChangeDiagnosis({
                  ...diagnosis,
                  nature: diagnosis.nature === 'han' ? 'nhiet' : 'han'
                })
              }
              title="Nhấp để đổi nhanh Hàn / Nhiệt"
            >
              {diagnosis.nature === 'han' ? 'Hàn chứng' : 'Nhiệt chứng'} ↻
            </button>
            <button
              type="button"
              className="mini-toggle-chip"
              onClick={() =>
                onChangeDiagnosis({
                  ...diagnosis,
                  state: diagnosis.state === 'hu' ? 'thuc' : 'hu'
                })
              }
              title="Nhấp để đổi nhanh Hư / Thực"
            >
              {diagnosis.state === 'hu' ? 'Hư chứng' : 'Thực chứng'} ↻
            </button>
            <button
              type="button"
              className="mini-toggle-chip"
              onClick={() => {
                const idx = ELEMENT_CYCLE_ORDER.indexOf(diagnosis.primaryElement);
                const nextEl: ElementKey =
                  ELEMENT_CYCLE_ORDER[(idx + 1) % ELEMENT_CYCLE_ORDER.length];
                onChangeDiagnosis({ ...diagnosis, primaryElement: nextEl });
              }}
              title="Nhấp để xoay Hành trọng tâm"
            >
              Hành {ELEMENT_SHORT[diagnosis.primaryElement]} ↻
            </button>
          </div>

          <span
            className="tag-badge"
            style={{
              background:
                verdictTone === 'balanced'
                  ? '#23574C'
                  : verdictTone === 'critical' || verdictTone === 'warn'
                  ? '#8E231D'
                  : '#5A3E28'
            }}
          >
            Quân bình: {hasTreatment ? `${balanceScore}%` : 'Chờ bốc'}
          </span>
        </div>

        {/* 3 Real-Time Micro Axis Needles */}
        <div className="dispensary-axes-mini">
          {[
            { name: 'Biểu↔Lý', init: initialVector.exteriorInterior, prev: previewVector.exteriorInterior },
            { name: 'Hàn↔Nhiệt', init: initialVector.coldHeat, prev: previewVector.coldHeat },
            { name: 'Hư↔Thực', init: initialVector.deficiencyExcess, prev: previewVector.deficiencyExcess }
          ].map((ax) => (
            <div key={ax.name} className="mini-axis-cell">
              <div className="mini-axis-lbl">{ax.name}</div>
              <div className="axis-track" style={{ height: '8px' }}>
                <div className="axis-center-line" />
                <div className="axis-marker-initial" style={{ left: `${toPct(ax.init)}%` }} />
                {hasTreatment && (
                  <div className="axis-marker-preview" style={{ left: `${toPct(ax.prev)}%` }} />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Live Verdict Pill */}
        <div className={`dispensary-verdict tone-${verdictTone}`} role="status">
          {verdictText}
        </div>
      </div>

      {/* Dragon Engraved Balance Beam */}
      <div className="balance-beam-bar" aria-hidden="true">
        <svg width="100%" height="44" viewBox="0 0 440 44" fill="none">
          <path d="M220 2 V16" stroke={hasDragonScale ? '#F5CE72' : '#CFA052'} strokeWidth="2.8" />
          <circle cx="220" cy="16" r="5.5" fill="#D59E49" stroke="#2F231A" strokeWidth="1.4" />
          <g
            style={{
              transformOrigin: '220px 16px',
              transform: `rotate(${beamTilt}deg)`,
              transition: 'transform 360ms cubic-bezier(0.22, 1, 0.36, 1)'
            }}
          >
            <path d="M46 16 Q133 8 220 15 Q307 8 394 16" stroke={hasDragonScale ? '#E7B96A' : '#9C6B24'} strokeWidth="3.8" strokeLinecap="round" />
            <circle cx="46" cy="16" r="3.4" fill="#2F231A" stroke="#D59E49" strokeWidth="1.1" />
            <circle cx="162" cy="14" r="3" fill="#2F231A" stroke="#D59E49" strokeWidth="1" />
            <circle cx="278" cy="14" r="3" fill="#2F231A" stroke="#D59E49" strokeWidth="1" />
            <circle cx="394" cy="16" r="3.4" fill="#2F231A" stroke="#D59E49" strokeWidth="1.1" />
            <path d="M46 18 L34 42 M46 18 L58 42" stroke="#C59344" strokeWidth="1.2" opacity="0.82" />
            <path d="M162 16 L150 42 M162 16 L174 42" stroke="#C59344" strokeWidth="1.2" opacity="0.82" />
            <path d="M278 16 L266 42 M278 16 L290 42" stroke="#C59344" strokeWidth="1.2" opacity="0.82" />
            <path d="M394 18 L382 42 M394 18 L406 42" stroke="#C59344" strokeWidth="1.2" opacity="0.82" />
          </g>
        </svg>
      </div>

      {/* 4 Round Hanging Brass Dish Pans */}
      <div className="brass-dishes-row">
        {ROLE_META.map((meta) => {
          const herbId = slots[meta.role];
          const herb: Herb | null = herbId ? HERB_MAP[herbId] : null;
          const isSelected = selectedSlot === meta.role;
          const method = slotPaoZhi[meta.role] ?? 'sinh-dung';
          const isFresh = Boolean(herb && freshHerbIds.includes(herb.id));
          const isDropped = justScoopedRole === meta.role;
          const isCrafting = animatingPanRole === meta.role;
          const alignClass = herb
            ? `dish-align-${getHerbDirectionalStatus(herb, initialVector, alerts)}`
            : '';

          return (
            <div
              key={meta.role}
              ref={(el) => {
                panRefs.current[meta.role] = el;
              }}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              aria-label={`${meta.short} (${meta.weight})${herb ? `: ${herb.name}` : ': Trống'}`}
              className={`round-scale-dish ${isSelected ? 'is-selected' : ''} ${
                herb ? 'is-filled' : ''
              } ${alignClass} ${isDropped ? 'dish-pendulum-drop' : ''} ${
                isCrafting ? `paozhi-anim-${method}` : ''
              } dish-tint-${method}`}
              onClick={() => onSelectSlot(meta.role)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectSlot(meta.role);
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const droppedId = e.dataTransfer.getData('text/plain');
                if (droppedId && HERB_MAP[droppedId]) {
                  onAssignHerb(meta.role, droppedId);
                }
              }}
            >
              <div className="dish-chains" aria-hidden="true">
                <span className="chain-strand left" />
                <span className="chain-strand right" />
              </div>

              <div className="dish-role-badge">{meta.short}</div>

              {herb ? (
                <>
                  <div className="dish-herb-art">
                    <BotanicalSvg herbId={herb.id} motif={herb.motif} size={50} bare />
                  </div>
                  <div className="dish-herb-label">{herb.name}</div>
                  {isFresh && <span className="dish-mini-pill fresh">Tươi</span>}
                  {PAO_ZHI_BADGE[method] && (
                    <span className="dish-mini-pill paozhi">{PAO_ZHI_BADGE[method]}</span>
                  )}
                  <button
                    type="button"
                    className="dish-clear-dot"
                    title={`Trả ${herb.name} về hộc`}
                    aria-label={`Bỏ ${herb.name} khỏi đĩa ${meta.short}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAssignHerb(meta.role, null);
                    }}
                  >
                    ×
                  </button>
                </>
              ) : (
                <div className="dish-empty-hint">{meta.weight}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
