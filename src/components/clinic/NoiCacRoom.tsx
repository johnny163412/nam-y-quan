import React from 'react';
import { apothecaryAudio } from '../../engine/audio';
import { AmbientParticlesCanvas } from '../AmbientParticlesCanvas';
import { MeridianBodyMap } from '../MeridianBodyMap';
import { StoveAndSealRig } from '../StoveAndSealRig';
import { VillagerPortrait } from '../svg/VillagerPortrait';
import { FIRE_TARGET_RANGES } from '../clinic/clinicConstants';
import type { ClinicCtx } from './useClinicDesk';
import { RoomBackdrop } from './RoomBackdrop';

export const NoiCacRoom: React.FC<{ ctx: ClinicCtx }> = ({ ctx }) => {
  const {
    selectedCase,
    activeRoom,
    selectedAcupoints,
    moxaEnabled,
    setMoxaEnabled,
    cuppingEnabled,
    setCuppingEnabled,
    fire,
    setFire,
    fanHeat,
    setFanHeat,
    fanBlowing,
    dosing,
    setDosing,
    stampingActive,
    signature,
    onSaveSignature,
    pushCallout,
    watchLight,
    tasteReading,
    hasBatTrangPot,
    hasJadeSeal,
    switchRoom,
    preview,
    handleToggleAcupoint,
    handleFanStroke,
    handleFinalStampSubmit,
    assignedHerbsSummary
  } = ctx;
  return (
    <>
    {/* ================= ROOM 3: NỘI CÁC 2.0 — FULL-BLEED KINH LẠC & HỎA LÒ ================= */}
    <section
      className={`apothecary-room spatial-room ${activeRoom === 2 ? 'is-active-room' : ''}`}
      aria-label="Buồng 3: Nội Các Châm Cứu và Bếp Sắc"
    >
      <div className="spatial-room-bg-layer" aria-hidden="true">
        <RoomBackdrop room="noi-cac" night={watchLight.lamp} />
        <div className={`watch-light ${watchLight.lamp ? "is-lamplit" : ""}`} aria-hidden="true" />
        <div className="spatial-bg-vignette" />
        <AmbientParticlesCanvas mode="embers" />
      </div>

      <div className="spatial-room-body spatial-room-scrollable">

      {/* Sticky Mini Patient Silk Scroll Strip in Room III */}
      <div className="mini-patient-scroll-strip in-room3" aria-label="Tóm tắt bệnh án đang khám">
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
            onClick={() => switchRoom(1)}
          >
            ← Dược Các
          </button>
        </div>
      </div>

      <div className="desk-grid room-inner-grid">
        <div className="woodblock-sheet">
          <MeridianBodyMap
            selectedIds={selectedAcupoints}
            onToggleAcupoint={handleToggleAcupoint}
            isPregnant={selectedCase.isPregnant}
            moxaEnabled={moxaEnabled}
            onToggleMoxa={() => {
              setMoxaEnabled((prev) => {
                const next = !prev;
                if (next) {
                  apothecaryAudio.playMoxaWarmth();
                  pushCallout('Hơ Ngải Cứu · Ôn Dương Đắc Khí! (+2đ)', 'gold');
                }
                return next;
              });
            }}
            cuppingEnabled={cuppingEnabled}
            onToggleCupping={() => {
              setCuppingEnabled((prev) => {
                const next = !prev;
                if (next) {
                  apothecaryAudio.playCuppingSuction();
                  pushCallout('Giác Hơi Ống Tre · Thông Kinh Lạc!', 'jade');
                }
                return next;
              });
            }}
          />
        </div>

        <div className="woodblock-sheet">
          <StoveAndSealRig
            fire={fire}
            dosing={dosing}
            fanHeat={fanHeat}
            fanBlowing={fanBlowing}
            hasBatTrangPot={hasBatTrangPot}
            hasJadeSeal={hasJadeSeal}
            stampingActive={stampingActive}
            assignedHerbsText={assignedHerbsSummary.join(', ')}
            patientName={selectedCase.patientName}
            tasteReading={tasteReading}
            onSelectFire={(nextFire) => {
              setFire(nextFire);
              const [lo, hi] = FIRE_TARGET_RANGES[nextFire];
              setFanHeat(Math.round((lo + hi) / 2));
              apothecaryAudio.playStoveSimmer(nextFire === 'vu-hoa');
            }}
            onSelectDosing={(nextDos) => {
              setDosing(nextDos);
              apothecaryAudio.playPageTurn();
            }}
            onFanStroke={handleFanStroke}
            onStampSubmit={handleFinalStampSubmit}
            signature={signature}
            onSaveSignature={onSaveSignature}
          />

          {preview.alerts.map((al, i) => (
            <div
              key={`r3-${al.sourceId}-${i}`}
              className={`alert-banner ${al.severity === 'caution' ? 'caution' : ''}`}
            >
              {al.message}
            </div>
          ))}
        </div>
      </div>
      </div>
    </section>
    </>
  );
};
