import React, { useEffect, useRef, useState } from 'react';
import { CLASSICAL_FORMULAS } from '../data/formulas';
import { HERB_MAP } from '../data/herbs';
import {
  ELEMENT_CYCLE_ORDER,
  ELEMENT_SHORT,
  getPaoZhiTransformation
} from '../engine/tcmEngine';
import {
  ClassicalFormula,
  ContraindicationAlert,
  DiagnosisChoice,
  EightPrinciplesVector,
  ElementKey,
  Herb,
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
  discoveredFormulas: string[];
  panRefs: React.MutableRefObject<Record<RoleSlot, HTMLDivElement | null>>;
  onChangeDiagnosis: (next: DiagnosisChoice) => void;
  onSelectSlot: (role: RoleSlot) => void;
  onAssignHerb: (role: RoleSlot, herbId: string | null) => void;
  onApplyFormula?: (formula: ClassicalFormula) => void;
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
  discoveredFormulas,
  panRefs,
  onChangeDiagnosis,
  onSelectSlot,
  onAssignHerb,
  onApplyFormula
}) => {
  const [showFormulaScroll, setShowFormulaScroll] = useState(false);
  const targetBeamTilt = hasTreatment ? Math.max(-8.5, Math.min(8.5, previewVector.coldHeat / 12)) : 0;

  // Real damped spring physics for the antique bronze dragon balance beam (60fps RAF)
  const [springAngle, setSpringAngle] = useState(0);
  const angleRef = useRef(0);
  const velRef = useRef(0);
  const targetRef = useRef(targetBeamTilt);
  targetRef.current = targetBeamTilt;

  const slotTorqueKick =
    (slots.quan ? -2.2 : 0) +
    (slots.than ? -1.0 : 0) +
    (slots.ta ? 1.0 : 0) +
    (slots.su ? 2.2 : 0);

  useEffect(() => {
    velRef.current += slotTorqueKick * 0.65;
  }, [slots.quan, slots.than, slots.ta, slots.su, justScoopedRole, slotTorqueKick, slotPaoZhi]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setSpringAngle(targetRef.current);
      return;
    }
    let rafId = 0;
    const step = () => {
      const disp = targetRef.current - angleRef.current;
      velRef.current = velRef.current * 0.86 + disp * 0.088;
      angleRef.current += velRef.current;
      if (Math.abs(disp) > 0.015 || Math.abs(velRef.current) > 0.015) {
        setSpringAngle(angleRef.current);
        rafId = requestAnimationFrame(step);
      } else {
        angleRef.current = targetRef.current;
        velRef.current = 0;
        setSpringAngle(targetRef.current);
      }
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [targetBeamTilt, slots.quan, slots.than, slots.ta, slots.su, justScoopedRole, slotPaoZhi]);

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

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {onApplyFormula && (
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  className={`mini-toggle-chip ${showFormulaScroll ? 'is-open' : ''}`}
                  onClick={() => setShowFormulaScroll((v) => !v)}
                  title="Áp nhanh bài cổ phương đã lĩnh ngộ lên 4 đĩa cân"
                >
                  📜 Bốc Cổ Phương
                </button>
                {showFormulaScroll && (
                  <div className="formula-quick-popover" role="dialog" aria-label="Sổ tay Bốc Cổ Phương 1 chạm">
                    <div className="formula-popover-head">
                      <strong>Chọn Cổ Phương Bốc Nhanh</strong>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '1px 6px', fontSize: '0.72rem' }}
                        onClick={() => setShowFormulaScroll(false)}
                      >
                        Đóng
                      </button>
                    </div>
                    <div className="formula-popover-list">
                      {CLASSICAL_FORMULAS.map((f) => {
                        const isKnown = discoveredFormulas.includes(f.id);
                        return (
                          <button
                            key={f.id}
                            type="button"
                            className={`formula-quick-item ${isKnown ? 'is-known' : ''}`}
                            onClick={() => {
                              onApplyFormula(f);
                              setShowFormulaScroll(false);
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px', alignItems: 'center' }}>
                              <strong>{f.name}</strong>
                              <span style={{ fontSize: '0.68rem', color: isKnown ? '#E7B96A' : '#BFA882' }}>
                                {isKnown ? '★ Đã lĩnh ngộ' : f.category}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.72rem', color: '#E8D6B4' }}>
                              {[...f.requiredHerbs, ...(f.optionalAnyHerbs?.slice(0, 1) ?? [])]
                                .map((id) => HERB_MAP[id]?.name ?? id)
                                .join(' + ')}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
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

      {/* Dragon Engraved Antique Bronze Balance Beam with Real Spring Physics */}
      <div className="balance-beam-bar" aria-hidden="true">
        <svg width="100%" height="56" viewBox="0 0 460 56" fill="none">
          <defs>
            <linearGradient id="bronzeBeamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#85581E" />
              <stop offset="25%" stopColor="#E6BC66" />
              <stop offset="50%" stopColor="#9E6D28" />
              <stop offset="75%" stopColor="#F0CA7A" />
              <stop offset="100%" stopColor="#7C5018" />
            </linearGradient>
            <radialGradient id="fulcrumJewelGrad" cx="42%" cy="38%" r="60%">
              <stop offset="0%" stopColor="#FFE9A8" />
              <stop offset="65%" stopColor="#C8933C" />
              <stop offset="100%" stopColor="#4A2E0D" />
            </radialGradient>
          </defs>

          {/* Suspended upper cord & dragon crest finial */}
          <path d="M230 2 V18" stroke={hasDragonScale ? '#FFE08E' : '#C99848'} strokeWidth="3.2" strokeLinecap="round" />
          <path d="M214 14 Q230 5 246 14" stroke="#B68335" strokeWidth="1.6" fill="none" />

          <g
            style={{
              transformOrigin: '230px 19px',
              transform: `rotate(${springAngle}deg)`
            }}
          >
            {/* Sculpted engraved bronze balance beam with tapered dragon finials */}
            <path
              d="M36 22 Q132 10 230 18 Q328 10 424 22 Q434 22 438 16 Q426 27 416 25 Q326 16 230 23 Q134 16 44 25 Q34 27 22 16 Q26 22 36 22 Z"
              fill="url(#bronzeBeamGrad)"
              stroke="#3A220B"
              strokeWidth="1.2"
            />
            <circle cx="48" cy="23" r="3.6" fill="#2A190C" stroke="#EBC36F" strokeWidth="1.3" />
            <circle cx="168" cy="19" r="3.2" fill="#2A190C" stroke="#EBC36F" strokeWidth="1.2" />
            <circle cx="292" cy="19" r="3.2" fill="#2A190C" stroke="#EBC36F" strokeWidth="1.2" />
            <circle cx="412" cy="23" r="3.6" fill="#2A190C" stroke="#EBC36F" strokeWidth="1.3" />

            {/* Suspended chain strands with vertical gravity compensation */}
            {[
              { x: 48, y: 26 },
              { x: 168, y: 22 },
              { x: 292, y: 22 },
              { x: 412, y: 26 }
            ].map((hook, idx) => (
              <g
                key={idx}
                style={{
                  transformOrigin: `${hook.x}px ${hook.y}px`,
                  transform: `rotate(${-springAngle * 0.72}deg)`
                }}
              >
                <path
                  d={`M${hook.x} ${hook.y} L${hook.x - 13} 54 M${hook.x} ${hook.y} L${hook.x + 13} 54`}
                  stroke="#C99848"
                  strokeWidth="1.35"
                  strokeDasharray="2.5 1.5"
                  opacity="0.88"
                />
              </g>
            ))}
          </g>

          {/* Central Brass Pivot Medallion */}
          <circle cx="230" cy="19" r="6.5" fill="url(#fulcrumJewelGrad)" stroke="#2F1B0A" strokeWidth="1.4" />
          <circle cx="230" cy="19" r="2.2" fill="#6F1B14" />
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
              style={{
                transform: `translateY(${((meta.role === 'quan' ? -1.4 : meta.role === 'than' ? -0.6 : meta.role === 'ta' ? 0.6 : 1.4) * springAngle).toFixed(2)}px)`
              }}
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

              {herb ? (() => {
                const craftTf = getPaoZhiTransformation(herb, method);
                return (
                  <>
                    <div className={`dish-herb-art art-craft-${method}`}>
                      <BotanicalSvg herbId={herb.id} motif={herb.motif} size={50} bare />
                    </div>
                    <div className="dish-herb-label">{herb.name}</div>
                    {isFresh && <span className="dish-mini-pill fresh">Tươi</span>}
                    {craftTf.badgeLabel && (
                      <span className={`dish-mini-pill paozhi tone-${craftTf.statusTone}`}>
                        {craftTf.badgeLabel}
                      </span>
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
                );
              })() : (
                <div className="dish-empty-hint">{meta.weight}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
