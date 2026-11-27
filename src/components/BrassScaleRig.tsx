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
import { AntiqueIcon } from './svg/AntiqueIcons';

const ROLE_META: { role: RoleSlot; short: string; weight: string; ratioHint: string }[] = [
  { role: 'quan', short: 'Quân', weight: 'Chủ lực', ratioHint: 'Trọng tâm ×1.25' },
  { role: 'than', short: 'Thần', weight: 'Trợ Quân', ratioHint: 'Hiệp trợ ×0.95' },
  { role: 'ta', short: 'Tá', weight: 'Hỗ trợ', ratioHint: 'Kiềm chế ×0.75' },
  { role: 'su', short: 'Sứ', weight: 'Điều hòa', ratioHint: 'Dẫn kinh ×0.55' }
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
                  <AntiqueIcon name="scroll" size={14} /> <span>Bốc Cổ Phương</span>
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
                              <span style={{ fontSize: '0.68rem', color: isKnown ? '#E7B96A' : '#BFA882', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                {isKnown ? (
                                  <>
                                    <AntiqueIcon name="star-seal" size={11} /> <span>Đã lĩnh ngộ</span>
                                  </>
                                ) : (
                                  f.category
                                )}
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

      {/* Coherent Full-Width Dragon Scale Stand + Aligned Chains + 4 Hanging Pans */}
      <div className="coherent-scale-assembly">
        <div className="balance-beam-bar fullwidth-beam" aria-hidden="true">
          <svg
            width="100%"
            height="94"
            viewBox="0 0 1000 94"
            preserveAspectRatio="none"
            className="coherent-scale-svg"
          >
            <defs>
              <linearGradient id="bronzeBeamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7A4F1A" />
                <stop offset="22%" stopColor="#E6BC66" />
                <stop offset="50%" stopColor="#A6742B" />
                <stop offset="78%" stopColor="#F0CA7A" />
                <stop offset="100%" stopColor="#724815" />
              </linearGradient>
              <linearGradient id="standPillarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3E2311" />
                <stop offset="50%" stopColor="#754925" />
                <stop offset="100%" stopColor="#2F190B" />
              </linearGradient>
              <radialGradient id="fulcrumJewelGrad" cx="42%" cy="38%" r="60%">
                <stop offset="0%" stopColor="#FFE9A8" />
                <stop offset="65%" stopColor="#C8933C" />
                <stop offset="100%" stopColor="#4A2E0D" />
              </radialGradient>
            </defs>

            {/* Central Hardwood Pillar & Yin-Yang Calibration Arc */}
            <rect x="492" y="16" width="16" height="76" rx="3" fill="url(#standPillarGrad)" stroke="#2A1609" strokeWidth="1.5" />
            <ellipse cx="500" cy="91" rx="68" ry="5" fill="#3A2110" stroke="#A6742B" strokeWidth="1.4" />
            <path d="M446 32 A56 56 0 0 1 554 32" stroke="rgba(122,84,42,0.52)" strokeWidth="1.8" fill="none" strokeDasharray="3 4" />
            <text x="436" y="34" fontSize="11" fontWeight="700" fill="#2A4D6E" textAnchor="end">Hàn</text>
            <text x="500" y="11" fontSize="10.5" fontWeight="700" fill="#5A3918" textAnchor="middle">Quân Bình</text>
            <text x="564" y="34" fontSize="11" fontWeight="700" fill="#9E2A20" textAnchor="start">Nhiệt</text>

            {/* Tilting Dragon Bronze Crossbar spanning exactly across all 4 column centers (125, 375, 625, 875) */}
            <g
              style={{
                transformOrigin: '500px 38px',
                transform: `rotate(${springAngle}deg)`
              }}
            >
              {/* Main sculpted crossbar */}
              <path
                d="M104 39 Q302 27 500 35 Q698 27 896 39 Q914 38 922 30 Q906 46 888 44 Q696 33 500 41 Q304 33 112 44 Q94 46 78 30 Q86 38 104 39 Z"
                fill="url(#bronzeBeamGrad)"
                stroke="#3A220B"
                strokeWidth="1.6"
              />

              {/* Pointer needle rising from beam center into calibration arc */}
              <path d="M497 35 L500 13 L503 35 Z" fill="#A62620" stroke="#3A120D" strokeWidth="1" />

              {/* 4 Column-Locked Hanging Hooks & Straight Triangle Chains Dropping Seamlessly into Dishes */}
              {[125, 375, 625, 875].map((hx, idx) => (
                <g key={idx}>
                  <circle cx={hx} cy="42" r="5.5" fill="#2A190C" stroke="#EBC36F" strokeWidth="1.8" />
                  <g
                    style={{
                      transformOrigin: `${hx}px 45px`,
                      transform: `rotate(${-springAngle * 0.82}deg)`
                    }}
                  >
                    <path
                      d={`M${hx} 45 L${hx - 34} 94 M${hx} 45 L${hx + 34} 94`}
                      stroke="#9F702E"
                      strokeWidth="2.1"
                      strokeDasharray="4 2"
                    />
                    <circle cx={hx} cy="47" r="2.6" fill="#F2C873" />
                  </g>
                </g>
              ))}
            </g>

            {/* Central Brass Fulcrum Medallion */}
            <circle cx="500" cy="38" r="9" fill="url(#fulcrumJewelGrad)" stroke="#2F1B0A" strokeWidth="1.8" />
            <circle cx="500" cy="38" r="3" fill="#7C1E16" />
          </svg>
        </div>

        {/* 4 Round Hanging Brass Dish Pans Directly Underneath Hooks */}
        <div className="brass-dishes-row coherent-row">
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
                <div className="dish-role-badge">
                  {meta.short} · {meta.weight}
                </div>

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
                  <div className="dish-empty-hint">
                    <div>{meta.ratioHint}</div>
                    <div style={{ fontSize: '0.67rem', opacity: 0.78, marginTop: '2px' }}>Chạm chọn vị</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
