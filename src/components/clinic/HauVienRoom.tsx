import React from 'react';
import { HERB_MAP } from '../../data/herbs';
import { AmbientParticlesCanvas } from '../AmbientParticlesCanvas';
import { HerbGardenRoom } from '../HerbGardenRoom';
import type { ClinicCtx } from './useClinicDesk';

export const HauVienRoom: React.FC<{ ctx: ClinicCtx }> = ({ ctx }) => {
  const {
    freshHerbIds,
    gardenGrowth,
    onWaterGardenPlot,
    onHarvestGardenPlot,
    activeRoom,
    pushCallout,
    watchLight,
    switchRoom
  } = ctx;
  return (
    <>
    {/* ================= ROOM 4: HẬU VIÊN 2.0 — FULL-BLEED VƯỜN THUỐC NAM ================= */}
    <section
      className={`apothecary-room spatial-room ${activeRoom === 3 ? 'is-active-room' : ''}`}
      aria-label="Buồng 4: Hậu Viên Vườn Thuốc Nam"
    >
      <div className="spatial-room-bg-layer" aria-hidden="true">
        <img
          src="./art/scenes/room-hau-vien.webp"
          alt=""
          className="room-bg-img spatial-full-bg"
        />
        <div className={`watch-light ${watchLight.lamp ? "is-lamplit" : ""}`} aria-hidden="true" />
        <div className="spatial-bg-vignette" />
        <AmbientParticlesCanvas mode="garden" />
      </div>

      <div className="spatial-room-body spatial-room-scrollable">
        <HerbGardenRoom
          gardenGrowth={gardenGrowth}
          freshHerbIds={freshHerbIds}
          onWaterPlot={onWaterGardenPlot}
          onHarvestPlot={(herbId) => {
            onHarvestGardenPlot(herbId);
            const herbName = HERB_MAP[herbId]?.name ?? 'Thảo dược';
            pushCallout(`+1 ${herbName} Tươi (+2đ Tinh Khiết)`, 'jade');
          }}
          onGoToDispensary={() => switchRoom(1)}
        />
      </div>
    </section>
    </>
  );
};
