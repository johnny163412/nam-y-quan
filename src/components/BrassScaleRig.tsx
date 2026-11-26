import React from 'react';
import { HERB_MAP } from '../data/herbs';
import { Herb, PaoZhiMethod, PrescriptionSlots, RoleSlot, SlotPaoZhi } from '../types/tcm';
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
  coldHeatBalance: number;
  hasTreatment: boolean;
  hasDragonScale: boolean;
  panRefs: React.MutableRefObject<Record<RoleSlot, HTMLDivElement | null>>;
  onSelectSlot: (role: RoleSlot) => void;
  onAssignHerb: (role: RoleSlot, herbId: string | null) => void;
}

export const BrassScaleRig: React.FC<BrassScaleRigProps> = ({
  slots,
  slotPaoZhi,
  selectedSlot,
  justScoopedRole,
  animatingPanRole,
  freshHerbIds,
  coldHeatBalance,
  hasTreatment,
  hasDragonScale,
  panRefs,
  onSelectSlot,
  onAssignHerb
}) => {
  const beamTilt = hasTreatment ? Math.max(-7, Math.min(7, coldHeatBalance / 13)) : 0;

  return (
    <div className={`brass-scale-rig ${hasDragonScale ? 'dragon-upgraded' : ''}`}>
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
              } ${isDropped ? 'dish-pendulum-drop' : ''} ${
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
              {/* Hanging brass chains */}
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
