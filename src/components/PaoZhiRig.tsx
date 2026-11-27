import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { HERB_MAP } from '../data/herbs';
import { PaoZhiMethod, PrescriptionSlots, RoleSlot, SlotPaoZhi } from '../types/tcm';

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
  const isGrinding = animatingPanRole === selectedSlot && activeMethod === 'gia-dap';
  const isRoasting =
    animatingPanRole === selectedSlot &&
    (activeMethod === 'sao-vang' || activeMethod === 'chich-mat');

  useEffect(() => {
    if (!cutscene) return;
    const t = window.setTimeout(() => setCutscene(null), 1350);
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
            <img src="/art/tools/mortar-closeup.jpg" alt="" className="prop-art-thumb" aria-hidden="true" />
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
            <img src="/art/tools/wok-closeup.jpg" alt="" className="prop-art-thumb" aria-hidden="true" />
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
            <img src="/art/tools/red-herb-packet.jpg" alt="" className="prop-art-thumb" aria-hidden="true" />
          </span>
          <div className="prop-label">
            <strong>Gói Giấy Hồng Điều →</strong>
            <span>Gấp 4 góc &amp; sang Lò sắc</span>
          </div>
        </button>
      </div>

      {/* Close-up Live Animated Painterly PaoZhi Cutscene Stage rendered in Portal */}
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
                      ? '/art/tools/mortar-closeup.jpg'
                      : '/art/tools/wok-closeup.jpg'
                  }
                  alt=""
                  className="closeup-art-img"
                />
                <div className="closeup-art-vignette" aria-hidden="true" />

                {cutscene.method === 'gia-dap' ? (
                  <svg viewBox="0 0 320 210" className="closeup-fx-svg" aria-hidden="true">
                    <g className="closeup-burst">
                      <circle cx="132" cy="96" r="4" fill="#9ED69E" />
                      <circle cx="188" cy="88" r="4.5" fill="#EAC16C" />
                      <circle cx="154" cy="72" r="3.4" fill="#C2E6B8" />
                      <circle cx="176" cy="76" r="3.8" fill="#F2CB78" />
                    </g>
                    <g className="closeup-pestle">
                      <rect x="150" y="16" width="20" height="86" rx="9" fill="#CFA052" stroke="#2D190A" strokeWidth="2.2" />
                      <ellipse cx="160" cy="96" rx="15" ry="9" fill="#B5822E" stroke="#2D190A" strokeWidth="1.8" />
                    </g>
                  </svg>
                ) : (
                  <svg viewBox="0 0 320 210" className="closeup-fx-svg" aria-hidden="true">
                    {cutscene.method === 'chich-mat' && (
                      <g className="honey-pour-group">
                        <path d="M214 22 Q196 58 176 118" stroke="#F0A52B" strokeWidth="8" strokeLinecap="round" fill="none" />
                        <path d="M214 22 Q196 58 176 118" stroke="#FFE599" strokeWidth="3" strokeLinecap="round" fill="none" />
                      </g>
                    )}
                    <g className={`closeup-toss-herbs ${cutscene.method === 'chich-mat' ? 'to-honey' : 'to-gold'}`}>
                      <ellipse cx="122" cy="118" rx="14" ry="6" transform="rotate(-14 122 118)" />
                      <ellipse cx="160" cy="110" rx="16" ry="6.5" transform="rotate(10 160 110)" />
                      <ellipse cx="196" cy="120" rx="13" ry="5.5" transform="rotate(-8 196 120)" />
                    </g>
                    <g className="closeup-spatula">
                      <path d="M88 30 L146 112 L160 104 L100 22 Z" fill="#B57D42" stroke="#2D190A" strokeWidth="2" />
                    </g>
                    <g className="closeup-smoke" stroke="rgba(255,244,224,0.82)" strokeWidth="2.8" fill="none" strokeLinecap="round">
                      <path d="M126 84 Q112 58 128 36" />
                      <path d="M168 78 Q184 52 164 28" />
                    </g>
                  </svg>
                )}
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
