import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { HERB_MAP } from '../data/herbs';
import { apothecaryAudio } from '../engine/audio';
import { getPaoZhiTransformation } from '../engine/tcmEngine';
import { PaoZhiMethod, PrescriptionSlots, RoleSlot, SlotPaoZhi } from '../types/tcm';
import { ApothecaryVfxCanvas } from './ApothecaryVfxCanvas';

interface PaoZhiRigProps {
  selectedSlot: RoleSlot;
  slots: PrescriptionSlots;
  slotPaoZhi: SlotPaoZhi;
  animatingPanRole: RoleSlot | null;
  packetWrapped: boolean;
  onSelectPaoZhi: (role: RoleSlot, method: PaoZhiMethod) => void;
  onWrapAndGo: () => void;
}

export const PaoZhiRig: React.FC<PaoZhiRigProps> = ({
  selectedSlot,
  slots,
  slotPaoZhi,
  animatingPanRole,
  packetWrapped,
  onSelectPaoZhi,
  onWrapAndGo
}) => {
  const [craftSession, setCraftSession] = useState<{
    method: 'gia-dap' | 'sao-vang' | 'chich-mat';
    herbName: string;
    hits: number;
    sweetHits: number;
    heatCursor: number;
    shaking: boolean;
  } | null>(null);

  const activeHerbId = slots[selectedSlot];
  const activeHerb = activeHerbId ? HERB_MAP[activeHerbId] : null;
  const activeMethod: PaoZhiMethod = slotPaoZhi[selectedSlot] ?? 'sinh-dung';
  const activeTransform = activeHerb ? getPaoZhiTransformation(activeHerb, activeMethod) : null;
  const isGrinding = animatingPanRole === selectedSlot && activeMethod === 'gia-dap';
  const isRoasting =
    animatingPanRole === selectedSlot &&
    (activeMethod === 'sao-vang' || activeMethod === 'chich-mat');

  // Smooth oscillating wok heat needle for 3-4s roasting mini-game
  useEffect(() => {
    if (!craftSession || craftSession.method === 'gia-dap') return;
    let rafId = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      const pos = 50 + Math.sin(elapsed * 2.75) * 44;
      setCraftSession((cur) => (cur ? { ...cur, heatCursor: pos } : null));
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [craftSession?.method]);

  const finishCraft = (method: 'gia-dap' | 'sao-vang' | 'chich-mat') => {
    onSelectPaoZhi(selectedSlot, method);
    setCraftSession(null);
  };

  const openCraftMiniGame = (next: PaoZhiMethod) => {
    if (!activeHerb) return;
    if (next === 'sinh-dung') {
      onSelectPaoZhi(selectedSlot, 'sinh-dung');
      return;
    }
    setCraftSession({
      method: next,
      herbName: activeHerb.name,
      hits: 0,
      sweetHits: 0,
      heatCursor: 50,
      shaking: false
    });
  };

  const handleCraftTap = () => {
    if (!craftSession) return;
    const isMortar = craftSession.method === 'gia-dap';
    if (isMortar) {
      apothecaryAudio.playMortarGrind();
    } else {
      apothecaryAudio.playWokSizzle(craftSession.method === 'chich-mat');
    }

    const inSweetSpot = isMortar || (craftSession.heatCursor >= 34 && craftSession.heatCursor <= 66);
    const nextHits = craftSession.hits + 1;
    const nextSweet = craftSession.sweetHits + (inSweetSpot ? 1 : 0);

    if (nextHits >= 3) {
      finishCraft(craftSession.method);
      return;
    }

    setCraftSession({
      ...craftSession,
      hits: nextHits,
      sweetHits: nextSweet,
      shaking: true
    });
    window.setTimeout(() => {
      setCraftSession((cur) => (cur ? { ...cur, shaking: false } : null));
    }, 220);
  };

  const cycleWokMethod = () => {
    if (!activeHerb) return;
    const next: PaoZhiMethod =
      activeMethod === 'sao-vang'
        ? 'chich-mat'
        : activeMethod === 'chich-mat'
        ? 'sinh-dung'
        : 'sao-vang';
    openCraftMiniGame(next);
  };

  return (
    <>
      <div className="paozhi-props-stage">
        {/* Prop 1: Thuyền Nghiên Mortar & Pestle */}
        <button
          type="button"
          className={`workbench-prop-btn ${activeMethod === 'gia-dap' ? 'is-active' : ''} ${
            isGrinding ? 'anim-pounding' : ''
          }`}
          disabled={!activeHerb}
          onClick={() => openCraftMiniGame(activeMethod === 'gia-dap' ? 'sinh-dung' : 'gia-dap')}
          title="Nhấp vào Thuyền Nghiên để giã dập vị thuốc đang chọn trên cân"
        >
          <span className="prop-art-frame">
            <img src="./art/tools/mortar-closeup.jpg" alt="" className="prop-art-thumb" aria-hidden="true" />
            <span className="prop-art-sheen mortar-sheen" aria-hidden="true" />
          </span>
          <div className="prop-label">
            <strong>Cối Giã Đồng</strong>
            <span>
              {!activeHerb ? 'Chọn vị trên cân' : activeMethod === 'gia-dap' ? 'Đã giã dập tơi' : 'Chạm để giã cối'}
            </span>
          </div>
        </button>

        {/* Prop 2: Cast-Iron Roasting Wok & Fire */}
        <button
          type="button"
          className={`workbench-prop-btn ${
            activeMethod === 'sao-vang' || activeMethod === 'chich-mat' ? 'is-active' : ''
          } ${isRoasting ? 'anim-roasting' : ''}`}
          disabled={!activeHerb}
          onClick={cycleWokMethod}
          title="Nhấp vào Chảo Gang để đổi: Sao vàng / Chích mật / Để mộc"
        >
          <span className="prop-art-frame">
            <img src="./art/tools/wok-closeup.jpg" alt="" className="prop-art-thumb" aria-hidden="true" />
            {(activeMethod === 'sao-vang' || activeMethod === 'chich-mat') && (
              <span
                className={`prop-art-glow ${activeMethod === 'chich-mat' ? 'is-honey' : 'is-gold'}`}
                aria-hidden="true"
              />
            )}
          </span>
          <div className="prop-label">
            <strong>Chảo Gang Sao Thuốc</strong>
            <span>
              {!activeHerb
                ? 'Chọn vị trên cân'
                : activeMethod === 'sao-vang'
                ? 'Đã Sao Vàng (Chạm → Mật)'
                : activeMethod === 'chich-mat'
                ? 'Đã Chích Mật (Chạm → Mộc)'
                : 'Chạm để Sao / Chích mật'}
            </span>
          </div>
        </button>

        {/* Prop 3: Vermilion Paper Packet */}
        <button
          type="button"
          className={`workbench-prop-btn packet-prop ${packetWrapped ? 'is-active' : ''}`}
          onClick={onWrapAndGo}
          title="Gấp 4 góc Giấy Hồng Điều bọc thang thuốc và mang sang Bếp Sắc"
        >
          <span className="prop-art-frame">
            <img src="./art/tools/red-herb-packet.jpg" alt="" className="prop-art-thumb" aria-hidden="true" />
          </span>
          <div className="prop-label">
            <strong>Gói Giấy Hồng Điều →</strong>
            <span>Gấp 4 góc &amp; sang Lò sắc</span>
          </div>
        </button>
      </div>

      {activeTransform && (
        <div className={`paozhi-effect-banner tone-${activeTransform.statusTone}`} role="status">
          <strong>Bào Chế ({activeHerb?.name}):</strong> {activeTransform.effectSummary}
        </div>
      )}

      {/* Interactive 3-4s Tactile PaoZhi Mini-Game powered by 60fps Volumetric VFX Canvas */}
      {craftSession &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="paozhi-closeup-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label="Thao tác bào chế vị thuốc"
            onClick={() => finishCraft(craftSession.method)}
          >
            <div
              className={`paozhi-closeup-card craft-minigame-card ${craftSession.shaking ? 'is-shaking' : ''}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`closeup-art-stage is-${craftSession.method}`}>
                <img
                  src={
                    craftSession.method === 'gia-dap'
                      ? './art/tools/mortar-closeup.jpg'
                      : './art/tools/wok-closeup.jpg'
                  }
                  alt=""
                  className="closeup-art-img"
                />
                {craftSession.method === 'chich-mat' && (
                  <div className="honey-amber-glaze-wash" aria-hidden="true" />
                )}
                <div className="closeup-art-vignette" aria-hidden="true" />
                <ApothecaryVfxCanvas
                  mode={
                    craftSession.method === 'gia-dap'
                      ? 'mortar'
                      : craftSession.method === 'chich-mat'
                      ? 'wok-honey'
                      : 'wok-gold'
                  }
                  intensity={0.75 + craftSession.hits * 0.2}
                  burstActive={craftSession.shaking || craftSession.hits > 0}
                  className="closeup-vfx-canvas"
                />
                <div className="craft-beads-badge">
                  {[0, 1, 2].map((idx) => (
                    <span
                      key={idx}
                      className={`craft-bead ${idx < craftSession.hits ? 'is-lit' : ''}`}
                    />
                  ))}
                  <span style={{ marginLeft: '6px' }}>{craftSession.hits}/3 nhịp</span>
                </div>
              </div>

              {craftSession.method !== 'gia-dap' && (
                <div className="wok-timing-bar" aria-label="Thanh nhiệt độ sao chảo">
                  <div className="wok-sweet-zone" />
                  <div
                    className="wok-cursor-pin"
                    style={{ left: `${craftSession.heatCursor}%` }}
                  />
                </div>
              )}

              <div className="closeup-caption">
                {craftSession.method === 'gia-dap'
                  ? `Giã dập ${craftSession.herbName} trong Thuyền Nghiên — nhấp 3 nhịp để dậy tinh dầu!`
                  : craftSession.method === 'sao-vang'
                  ? `Đảo chảo sao vàng ${craftSession.herbName} — nhấp đúng vùng vàng cánh gián (3 nhịp)!`
                  : `Rưới mật ong rừng & chích thơm ${craftSession.herbName} — đảo đều 3 nhịp!`}
              </div>

              <div className="craft-minigame-actions">
                <button
                  type="button"
                  className="btn-cinnabar craft-tap-btn"
                  onClick={handleCraftTap}
                >
                  {craftSession.method === 'gia-dap'
                    ? `Giã Chày! (${craftSession.hits}/3)`
                    : craftSession.method === 'sao-vang'
                    ? `Đảo Chảo Vàng! (${craftSession.hits}/3)`
                    : `Rưới Mật & Đảo Đều! (${craftSession.hits}/3)`}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => finishCraft(craftSession.method)}
                >
                  Xong nhanh
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
