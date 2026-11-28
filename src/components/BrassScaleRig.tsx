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

/** Teaching doses on the cân tiểu ly: Quân heaviest, Sứ lightest (1 tiền ≈ 3.75 g). */
const DOSE_TIEN: Record<RoleSlot, number> = { quan: 4, than: 3, ta: 2, su: 1 };
const GRAM_PER_TIEN = 3.75;
const MAX_TIEN = 10;
const WEIGH_TOLERANCE = 0.15;
// Geometry of steelyard-beam.webp (1200×80): đề pivot at x=200, sao 0…10 tiền from x=260, 86px per tiền.
const PIVOT = { x: 200, y: 70 };
const BEAM_X0 = 260;
const PX_PER_TIEN = 86;

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
  // Cân tiểu ly: the pan (hook x=80) and the sliding quả cân balance about the đề (x=200).
  const anyFilled = Boolean(slots.quan || slots.than || slots.ta || slots.su);
  const [caseOpen, setCaseOpen] = useState(anyFilled);
  useEffect(() => {
    if (anyFilled) setCaseOpen(true);
    else setWeights({});
  }, [anyFilled]);

  // Quả cân position in tiền, per role + herb, so swapping the herb asks for a fresh weighing.
  const [weights, setWeights] = useState<Record<string, number>>({});
  // The pan shows the herb just scooped (selection auto-advances to the next packet) or the packet last touched.
  const [panRole, setPanRole] = useState<RoleSlot>(selectedSlot);
  useEffect(() => {
    if (justScoopedRole) setPanRole(justScoopedRole);
  }, [justScoopedRole]);
  const panHerbId = slots[panRole];
  const panKey = `${panRole}:${panHerbId ?? ''}`;
  const weightTien = weights[panKey] ?? 0;
  const targetTien = panHerbId ? DOSE_TIEN[panRole] : 0;
  const isWeighed = (role: RoleSlot) => {
    const id = slots[role];
    return Boolean(id && Math.abs((weights[`${role}:${id}`] ?? 0) - DOSE_TIEN[role]) <= WEIGH_TOLERANCE);
  };
  const setWeightTien = (t: number) => {
    const clamped = Math.max(0, Math.min(MAX_TIEN, Math.round(t * 10) / 10));
    const snapped = panHerbId && Math.abs(clamped - targetTien) <= WEIGH_TOLERANCE ? targetTien : clamped;
    setWeights((w) => ({ ...w, [panKey]: snapped }));
  };
  // Heavier than the herb → the long arm drops (positive SVG rotation); lighter → the pan drops.
  const targetBeamTilt = Math.max(-5, Math.min(5, (weightTien - targetTien) * 1.6));

  // Damped spring so the beam swings and settles (60fps RAF)
  const [springAngle, setSpringAngle] = useState(0);
  const angleRef = useRef(0);
  const velRef = useRef(0);
  const targetRef = useRef(targetBeamTilt);
  targetRef.current = targetBeamTilt;

  useEffect(() => {
    if (justScoopedRole) velRef.current -= 1.6; // herb drops into the pan
  }, [justScoopedRole]);

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
  }, [targetBeamTilt, justScoopedRole]);

  const svgRef = useRef<SVGSVGElement>(null);
  const draggingRef = useRef(false);
  const tienFromPointer = (e: React.PointerEvent) => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return weightTien;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return (p.x - BEAM_X0) / PX_PER_TIEN;
  };

  const rad = (springAngle * Math.PI) / 180;
  const onBeam = (x: number) => ({
    x: PIVOT.x + (x - PIVOT.x) * Math.cos(rad),
    y: PIVOT.y + (x - PIVOT.x) * Math.sin(rad)
  });
  const hook = onBeam(80);
  const bob = onBeam(BEAM_X0 + weightTien * PX_PER_TIEN);
  const panHerb: Herb | null = panHerbId ? HERB_MAP[panHerbId] : null;
  const panMeta = ROLE_META.find((m) => m.role === panRole)!;
  const diff = weightTien - targetTien;
  let reading: string;
  if (!panHerb) reading = `Đĩa cân trống: bốc một vị vào gói ${panMeta.short} trước.`;
  else if (isWeighed(panRole))
    reading = `Đòn thăng bằng: ${panHerb.name} ${targetTien} tiền (≈ ${(targetTien * GRAM_PER_TIEN).toFixed(1)} g). Gói ${panMeta.short} đã cân.`;
  else if (diff < 0) reading = `Đòn chúi về phía đĩa: đẩy quả cân ra xa đầu đề.`;
  else reading = `Đòn vểnh đầu đĩa: kéo quả cân lùi về gần đầu đề.`;

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
  let verdictText = 'Hãy kéo hộc bốc vị thuốc vào 4 gói thuốc để xem chiều hướng Biện Chứng.';
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
                  title="Áp nhanh bài cổ phương đã lĩnh ngộ vào 4 gói thuốc"
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

      {/* E. Hộp cân hình đàn → A. cân tiểu ly over 4 gói giấy dó (chia thang) */}
      <div className={`coherent-scale-assembly ${caseOpen ? 'case-open' : 'case-closed'}`}>
        {!caseOpen ? (
          <button
            type="button"
            className="scale-case-closed"
            onClick={() => setCaseOpen(true)}
            aria-label="Mở hộp cân tiểu ly"
          >
            <img
              src={hasDragonScale ? './art/tools/scale-case-long.webp' : './art/tools/scale-case-go.webp'}
              alt=""
              draggable={false}
            />
            <span className="scale-case-caption">
              {hasDragonScale ? 'Hộp cân khảm xà cừ rồng' : 'Hộp cân gỗ mít'} · Mở hộp cân tiểu ly
            </span>
          </button>
        ) : (
          <div className="steelyard-stage">
            <svg
              ref={svgRef}
              className="steelyard-svg"
              viewBox="-60 -40 1260 290"
              preserveAspectRatio="xMidYMid meet"
              onPointerDown={(e) => {
                if (!panHerb) return;
                draggingRef.current = true;
                e.currentTarget.setPointerCapture(e.pointerId);
                setWeightTien(tienFromPointer(e));
              }}
              onPointerMove={(e) => {
                if (draggingRef.current) setWeightTien(tienFromPointer(e));
              }}
              onPointerUp={() => {
                draggingRef.current = false;
              }}
              onPointerCancel={() => {
                draggingRef.current = false;
              }}
            >
              {/* Đề: the cord loop the healer lifts the steelyard by */}
              <path d={`M${PIVOT.x} ${PIVOT.y} L${PIVOT.x} 16`} stroke="#6B4A26" strokeWidth="3" />
              <ellipse cx={PIVOT.x} cy="12" rx="11" ry="9" fill="none" stroke="#6B4A26" strokeWidth="3" />
              <image
                href="./art/tools/steelyard-beam.webp"
                x="0"
                y={PIVOT.y - 40}
                width="1200"
                height="80"
                transform={`rotate(${springAngle.toFixed(2)} ${PIVOT.x} ${PIVOT.y})`}
              />
              {/* Pan on three cords, hanging plumb from the hook */}
              {[-82, 0, 82].map((dx) => (
                <line key={dx} x1={hook.x} y1={hook.y} x2={hook.x + dx} y2={hook.y + 128} stroke="#8A6A3E" strokeWidth="2" />
              ))}
              {panHerb && (
                <foreignObject x={hook.x - 36} y={hook.y + 78} width="72" height="64">
                  <div className="steelyard-pan-herb">
                    <BotanicalSvg herbId={panHerb.id} motif={panHerb.motif} size={58} bare />
                  </div>
                </foreignObject>
              )}
              <image href="./art/tools/steelyard-pan.webp" x={hook.x - 90} y={hook.y + 112} width="180" height="60" />
              <text x={hook.x} y={hook.y + 196} className="steelyard-pan-label" textAnchor="middle">
                {panMeta.short}
                {panHerb ? ` · ${panHerb.name}` : ' · trống'}
              </text>
              {/* Quả cân on its cord: drag along the beam (or tap a sao) to balance */}
              <g
                role="slider"
                tabIndex={0}
                aria-label="Quả cân tiểu ly"
                aria-valuemin={0}
                aria-valuemax={MAX_TIEN}
                aria-valuenow={weightTien}
                aria-valuetext={`${weightTien.toFixed(1)} tiền`}
                className="steelyard-bob"
                onKeyDown={(e) => {
                  const step = e.key === 'PageUp' ? 1 : e.key === 'PageDown' ? -1 : e.key === 'ArrowRight' ? 0.1 : e.key === 'ArrowLeft' ? -0.1 : 0;
                  if (!step || !panHerb) return;
                  e.preventDefault();
                  setWeightTien(weightTien + step);
                }}
              >
                <line x1={bob.x} y1={bob.y} x2={bob.x} y2={bob.y + 44} stroke="#6B4A26" strokeWidth="2.4" />
                <image href="./art/tools/steelyard-weight.webp" x={bob.x - 27} y={bob.y + 38} width="54" height="72" />
              </g>
            </svg>
            <div className={`steelyard-reading ${panHerb && isWeighed(panRole) ? 'is-level' : ''}`} role="status">
              {reading}
            </div>
          </div>
        )}

        {/* 4 gói giấy dó: chia thang Quân · Thần · Tá · Sứ */}
        <div className="paper-packets-row">
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
                aria-label={`Gói ${meta.short} (${meta.weight})${herb ? `: ${herb.name}` : ': Trống'}`}
                className={`paper-packet packet-${meta.role} ${isSelected ? 'is-selected' : ''} ${
                  herb ? 'is-filled' : ''
                } ${alignClass} ${isDropped ? 'dish-pendulum-drop' : ''} ${
                  isCrafting ? `paozhi-anim-${method}` : ''
                } dish-tint-${method}`}
                onClick={() => {
                  setPanRole(meta.role);
                  onSelectSlot(meta.role);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setPanRole(meta.role);
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
                      {isWeighed(meta.role) ? (
                        <span className="dish-mini-pill weighed">{DOSE_TIEN[meta.role]} tiền</span>
                      ) : (
                        <span className="dish-mini-pill unweighed">Chưa cân</span>
                      )}
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
                        aria-label={`Bỏ ${herb.name} khỏi gói ${meta.short}`}
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
