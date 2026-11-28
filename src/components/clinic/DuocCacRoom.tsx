import React from 'react';
import { HERBS } from '../../data/herbs';
import { RoleSlot } from '../../types/tcm';
import { AmbientParticlesCanvas } from '../AmbientParticlesCanvas';
import { BrassScaleRig } from '../BrassScaleRig';
import { PaoZhiRig } from '../PaoZhiRig';
import { BotanicalSvg } from '../svg/BotanicalSvg';
import { HealerHandOverlay } from '../svg/HealerHandOverlay';
import { VillagerPortrait } from '../svg/VillagerPortrait';
import { ROLE_TITLES } from '../clinic/clinicConstants';
import type { ClinicCtx } from './useClinicDesk';
import { RoomBackdrop } from './RoomBackdrop';

export const DuocCacRoom: React.FC<{ ctx: ClinicCtx }> = ({ ctx }) => {
  const {
    discoveredFormulas,
    freshHerbIds,
    onOpenCodexHerb,
    selectedCase,
    activeRoom,
    diagnosis,
    slots,
    slotPaoZhi,
    animatingPanRole,
    selectedSlot,
    setSelectedSlot,
    chestFilter,
    setChestFilter,
    openDrawerId,
    draggingHerbId,
    setDraggingHerbId,
    hoveredHerb,
    setHoveredHerb,
    packetWrapped,
    scoopAnim,
    setScoopAnim,
    justScoopedRole,
    changeDiagnosis,
    deskRoom2Ref,
    chestWrapRef,
    panRefs,
    herbRefs,
    weights,
    setWeights,
    watchLight,
    hasDragonScale,
    switchRoom,
    availableHerbs,
    preview,
    activeFormulas,
    hasAssignedTreatment,
    handleAssignHerb,
    handleApplyFormula,
    handleSelectPaoZhi,
    handleToggleDrawer,
    handleScoopFromDrawer,
    handleDrawerHover,
    handleWrapHerbPacketAndGoRoom3,
    natureClass
  } = ctx;
  return (
    <>
    {/* ================= ROOM 2: DƯỢC CÁC 2.0 — FULL-BLEED SPATIAL WORKBENCH ================= */}
    <section
      className={`apothecary-room spatial-room ${activeRoom === 1 ? 'is-active-room' : ''}`}
      aria-label="Buồng 2: Dược Các và Bào Chế"
    >
      <div className="spatial-room-bg-layer" aria-hidden="true">
        <RoomBackdrop room="duoc-cac" night={watchLight.lamp} />
        <div className={`watch-light ${watchLight.lamp ? "is-lamplit" : ""}`} aria-hidden="true" />
        <div className="spatial-bg-vignette" />
        <AmbientParticlesCanvas mode="sunbeams" />
      </div>

      <div className="spatial-room-body spatial-room-scrollable">
        <div
          ref={deskRoom2Ref}
          className={`woodblock-sheet desk-right-col spatial-translucent-sheet ${draggingHerbId ? 'is-dragging-herb' : ''}`}
        >
        {/* Sticky Mini Patient Silk Scroll Strip for Effortless Cross-Room Deduction */}
        <div className="mini-patient-scroll-strip" aria-label="Tóm tắt bệnh án đang khám">
          <VillagerPortrait patientCase={selectedCase} size="compact" />
          <div className="mini-patient-meta">
            <div className="mini-patient-head">
              <strong>{selectedCase.patientName}</strong> ({selectedCase.age}t) · {selectedCase.seasonTag}
              {selectedCase.isPregnant && (
                <span className="tag-badge pregnant" style={{ marginLeft: '6px', padding: '1px 6px', fontSize: '0.68rem' }}>Thai phụ</span>
              )}
            </div>
            <div className="mini-patient-vitals">
              <span><strong>Lưỡi:</strong> {selectedCase.tongue.summary.split('—')[0].trim()}</span>
              <span> · <strong>Mạch:</strong> {selectedCase.pulse.name}</span>
            </div>
          </div>
          <div className="mini-patient-actions">
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '3px 8px', fontSize: '0.73rem' }}
              onClick={() => switchRoom(0)}
            >
              ← Tiền Đường
            </button>
          </div>
        </div>

        <HealerHandOverlay
          scoop={scoopAnim}
          onComplete={(doneId) =>
            setScoopAnim((cur) => (cur && cur.id === doneId ? null : cur))
          }
        />

        <BrassScaleRig
          slots={slots}
          slotPaoZhi={slotPaoZhi}
          selectedSlot={selectedSlot}
          justScoopedRole={justScoopedRole}
          animatingPanRole={animatingPanRole}
          freshHerbIds={freshHerbIds}
          diagnosis={diagnosis}
          initialVector={selectedCase.initialVector}
          previewVector={preview.resultingVector}
          balanceScore={preview.balanceScore}
          alerts={preview.alerts}
          hasTreatment={hasAssignedTreatment}
          hasDragonScale={hasDragonScale}
          discoveredFormulas={discoveredFormulas}
          panRefs={panRefs}
          weights={weights}
          setWeights={setWeights}
          onChangeDiagnosis={changeDiagnosis}
          onSelectSlot={setSelectedSlot}
          onAssignHerb={handleAssignHerb}
          onApplyFormula={handleApplyFormula}
        />

        <PaoZhiRig
          selectedSlot={selectedSlot}
          slots={slots}
          slotPaoZhi={slotPaoZhi}
          animatingPanRole={animatingPanRole}
          packetWrapped={packetWrapped}
          onSelectPaoZhi={handleSelectPaoZhi}
          onWrapAndGo={handleWrapHerbPacketAndGoRoom3}
        />

        {activeFormulas.length > 0 && (
          <div className="synergy-banner">
            <strong style={{ color: '#E7B96A', fontFamily: 'var(--font-serif)' }}>
              Cộng hưởng Cổ phương ({activeFormulas.map((f) => f.name).join(' + ')}):
            </strong>{' '}
            <span>{activeFormulas[0].principle}</span>
          </div>
        )}

        {preview.alerts.map((al, i) => (
          <div
            key={`${al.sourceId}-${i}`}
            className={`alert-banner ${al.severity === 'caution' ? 'caution' : ''}`}
          >
            {al.message}
          </div>
        ))}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '0.82rem', color: 'var(--ink-muted)', margin: '6px 0' }}>
          <span>
            Tủ Thuốc Bách Tử ({HERBS.length} vị · Bốc vào <strong>{ROLE_TITLES[selectedSlot]}</strong>)
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', alignItems: 'center' }}>
            {([
              { id: 'all', label: `Tất cả (${HERBS.length})` },
              { id: 'warm', label: 'Ôn Ấm' },
              { id: 'cool', label: 'Hàn Lương' },
              { id: 'neutral', label: 'Bình Hòa' },
              { id: 'fresh', label: `Lá Tươi (${freshHerbIds.length})` }
            ] as const).map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`acupoint-chip ${chestFilter === tab.id ? 'active' : ''}`}
                onClick={() => setChestFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '2px 8px', fontSize: '0.74rem' }}
              onClick={() => switchRoom(3)}
            >
              Giỏ lá tươi ({freshHerbIds.length}) · Ra Hậu Viên →
            </button>
          </div>
        </div>

        <div
          ref={chestWrapRef}
          className="apothecary-chest-wrap"
          onMouseLeave={() => setHoveredHerb(null)}
        >
          {hoveredHerb && (
            <div
              className="herb-hover-tooltip"
              role="tooltip"
              style={{ left: `${hoveredHerb.left}px`, top: `${hoveredHerb.top}px` }}
            >
              <div className="tooltip-head">
                <span className="tooltip-head-name">{hoveredHerb.herb.name}</span>
                <span className="tooltip-head-sub">{hoveredHerb.herb.traditionalName}</span>
              </div>
              <div className="tooltip-body">
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
                  <BotanicalSvg herbId={hoveredHerb.herb.id} motif={hoveredHerb.herb.motif} size={58} />
                  <div style={{ minWidth: 0 }}>
                    <span className={`nature-tag ${natureClass(hoveredHerb.herb.nature)}`}>
                      {hoveredHerb.herb.nature} ({hoveredHerb.herb.flavors.join(', ')})
                    </span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '3px' }}>
                      <strong>Quy kinh:</strong> {hoveredHerb.herb.meridians.join(', ')}
                    </div>
                  </div>
                </div>
                <p style={{ margin: '0 0 5px', fontSize: '0.78rem', lineHeight: 1.4 }}>
                  {hoveredHerb.herb.summary}
                </p>
                {hoveredHerb.herb.contraindications.warningText && (
                  <div className="tooltip-warn">
                    <strong>Kiêng kỵ:</strong> {hoveredHerb.herb.contraindications.warningText}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="apothecary-chest">
            <div className="chest-drawers-grid">
              {availableHerbs.map((herb) => {
                const assignedRole = (Object.keys(slots) as RoleSlot[]).find(
                  (r) => slots[r] === herb.id
                );
                const isOpen = openDrawerId === herb.id;
                const isFresh = freshHerbIds.includes(herb.id);
                const natureShort =
                  herb.nature === 'Ôn' || herb.nature === 'Nhiệt'
                    ? 'hot'
                    : herb.nature === 'Bình'
                    ? 'neutral'
                    : 'cold';

                return (
                  <div
                    key={herb.id}
                    ref={(el) => {
                      herbRefs.current[herb.id] = el;
                    }}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', herb.id);
                      setDraggingHerbId(herb.id);
                      setHoveredHerb(null);
                    }}
                    onDragEnd={() => setDraggingHerbId(null)}
                    onMouseEnter={(e) => handleDrawerHover(herb, e.currentTarget)}
                    onFocus={(e) => handleDrawerHover(herb, e.currentTarget)}
                    className={`wood-drawer ${isOpen ? 'is-open' : ''} ${
                      assignedRole ? 'is-assigned' : ''
                    }`}
                  >
                    <button
                      type="button"
                      className="drawer-face-btn"
                      aria-expanded={isOpen}
                      onClick={() => handleToggleDrawer(herb)}
                    >
                      {assignedRole && (
                        <span className="drawer-role-ribbon">
                          {ROLE_TITLES[assignedRole].replace(' dược', '')}
                        </span>
                      )}
                      {!assignedRole && isFresh && (
                        <span className="drawer-fresh-ribbon">Tươi</span>
                      )}
                      <span className="drawer-name-slip">
                        <span className={`qi-dot qi-${natureShort}`} aria-hidden="true" />
                        <span className="drawer-herb-title">{herb.name}</span>
                      </span>
                      <span className="brass-pull-plate" aria-hidden="true">
                        <span className="brass-pull-ring" />
                      </span>
                    </button>

                    {isOpen && (
                      <div className="drawer-3d-open-box">
                        <div
                          role="button"
                          tabIndex={0}
                          className="drawer-cedar-well"
                          aria-label={`Nhón ${herb.name} bỏ vào ${ROLE_TITLES[selectedSlot]}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleScoopFromDrawer(herb);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              handleScoopFromDrawer(herb);
                            }
                          }}
                        >
                          <div className="cedar-herbs-pile">
                            <BotanicalSvg herbId={herb.id} motif={herb.motif} size={52} bare />
                          </div>
                          <span className="cedar-pinch-cta">
                            Nhón bỏ {ROLE_TITLES[selectedSlot]}
                          </span>
                        </div>

                        <div className="drawer-front-ledge">
                          <span className="drawer-ledge-name">{herb.name}</span>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: '1px 6px', fontSize: '0.68rem' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenCodexHerb(herb.id);
                              }}
                            >
                              Y thư
                            </button>
                            {assignedRole && (
                              <button
                                type="button"
                                className="btn-secondary"
                                style={{ padding: '1px 6px', fontSize: '0.68rem' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAssignHerb(assignedRole, null);
                                }}
                              >
                                Trả
                              </button>
                            )}
                            <button
                              type="button"
                              className="drawer-close-knob"
                              aria-label="Đẩy đóng ngăn thuốc"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleDrawer(herb);
                              }}
                            >
                              ▲
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
    </>
  );
};
