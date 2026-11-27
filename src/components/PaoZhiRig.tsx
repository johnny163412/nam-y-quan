import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { HERB_MAP } from '../data/herbs';
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
  const [cutscene, setCutscene] = useState<{
    method: 'gia-dap' | 'sao-vang' | 'chich-mat';
    herbName: string;
  } | null>(null);

  const activeHerbId = slots[selectedSlot];
  const activeHerb = activeHerbId ? HERB_MAP[activeHerbId] : null;
  const activeMethod: PaoZhiMethod = slotPaoZhi[selectedSlot] ?? 'sinh-dung';
  const activeTransform = activeHerb ? getPaoZhiTransformation(activeHerb, activeMethod) : null;
  const isGrinding = animatingPanRole === selectedSlot && activeMethod === 'gia-dap';
  const isRoasting =
    animatingPanRole === selectedSlot &&
    (activeMethod === 'sao-vang' || activeMethod === 'chich-mat');

  useEffect(() => {
    if (!cutscene) return;
    const t = window.setTimeout(() => setCutscene(null), 1500);
    return () => window.clearTimeout(t);
  }, [cutscene]);

  const triggerPaoZhi = (next: PaoZhiMethod) => {
    onSelectPaoZhi(selectedSlot, next);
    if (activeHerb && next !== 'sinh-dung') {
      setCutscene({ method: next, herbName: activeHerb.name });
    }
  };

  const cycleWokMethod = () => {
    if (!activeHerb) return;
    const next: PaoZhiMethod =
      activeMethod === 'sao-vang'
        ? 'chich-mat'
        : activeMethod === 'chich-mat'
        ? 'sinh-dung'
        : 'sao-vang';
    triggerPaoZhi(next);
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
          onClick={() => triggerPaoZhi(activeMethod === 'gia-dap' ? 'sinh-dung' : 'gia-dap')}
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

      {/* Close-up Live Painterly PaoZhi Cutscene Stage powered by 60fps Volumetric VFX Canvas */}
      {cutscene &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="paozhi-closeup-backdrop"
            role="dialog"
            aria-label="Cảnh bào chế vị thuốc"
            onClick={() => setCutscene(null)}
          >
            <div className="paozhi-closeup-card" onClick={(e) => e.stopPropagation()}>
              <div className={`closeup-art-stage is-${cutscene.method}`}>
                <img
                  src={
                    cutscene.method === 'gia-dap'
                      ? './art/tools/mortar-closeup.jpg'
                      : './art/tools/wok-closeup.jpg'
                  }
                  alt=""
                  className="closeup-art-img"
                />
                {cutscene.method === 'chich-mat' && (
                  <div className="honey-amber-glaze-wash" aria-hidden="true" />
                )}
                <div className="closeup-art-vignette" aria-hidden="true" />
                <ApothecaryVfxCanvas
                  mode={
                    cutscene.method === 'gia-dap'
                      ? 'mortar'
                      : cutscene.method === 'chich-mat'
                      ? 'wok-honey'
                      : 'wok-gold'
                  }
                  intensity={0.95}
                  burstActive
                  className="closeup-vfx-canvas"
                />
              </div>

              <div className="closeup-caption">
                {cutscene.method === 'gia-dap'
                  ? `Đang giã dập ${cutscene.herbName} trong Thuyền Nghiên cho dậy tinh dầu...`
                  : cutscene.method === 'sao-vang'
                  ? `Đang đảo đều sao vàng ${cutscene.herbName} trên Chảo Gang lửa hồng...`
                  : `Đang rưới mật ong rừng & chích thơm ${cutscene.herbName}...`}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
