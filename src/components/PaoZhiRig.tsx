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
    const t = window.setTimeout(() => setCutscene(null), 1300);
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
        {/* Prop 1: Brass Mortar & Pestle */}
        <button
          type="button"
          className={`workbench-prop-btn ${activeMethod === 'gia-dap' ? 'is-active' : ''} ${
            isGrinding ? 'anim-pounding' : ''
          }`}
          disabled={!activeHerb}
          onClick={() => triggerPaoZhi(activeMethod === 'gia-dap' ? 'sinh-dung' : 'gia-dap')}
          title="Nhấp vào Cối Đồng để giã dập vị thuốc đang chọn trên cân"
        >
          <svg width="78" height="62" viewBox="0 0 78 62" fill="none" aria-hidden="true">
            <g className="pestle-arm">
              <rect x="44" y="4" width="8" height="32" rx="4" transform="rotate(24 48 16)" fill="#CFA052" stroke="#36220D" strokeWidth="1.4" />
              <circle cx="41" cy="29" r="5" fill="#E6BE70" stroke="#36220D" strokeWidth="1.2" />
            </g>
            <g className="mortar-flecks" fill="#6F9A58">
              <circle cx="32" cy="20" r="2" />
              <circle cx="44" cy="18" r="1.8" />
              <circle cx="38" cy="14" r="1.5" />
            </g>
            <path d="M18 28 H60 L54 52 Q39 58 24 52 Z" fill="#9E702E" stroke="#2D1B0C" strokeWidth="1.8" />
            <ellipse cx="39" cy="28" rx="21" ry="5.5" fill="#5D3D19" stroke="#E5BD6C" strokeWidth="1.4" />
            <rect x="26" y="52" width="26" height="5" rx="2" fill="#704D1C" stroke="#2D1B0C" strokeWidth="1.2" />
          </svg>
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
          <svg width="82" height="62" viewBox="0 0 82 62" fill="none" aria-hidden="true">
            <g className={`wok-flames ${activeMethod === 'sao-vang' || activeMethod === 'chich-mat' ? 'burning' : ''}`}>
              <path d="M24 56 Q28 42 33 55 Q39 39 45 55 Q50 43 56 56 Z" fill="#E86524" />
              <path d="M30 56 Q35 45 40 55 Q45 44 50 56 Z" fill="#FFD166" />
            </g>
            <path d="M12 31 Q41 53 70 31 Z" fill="#322B28" stroke="#18120F" strokeWidth="1.8" />
            <ellipse cx="41" cy="31" rx="29" ry="7" fill="#4B403B" stroke="#857161" strokeWidth="1.3" />
            <line x1="6" y1="28" x2="14" y2="31" stroke="#6E4624" strokeWidth="4" strokeLinecap="round" />
            <line x1="68" y1="31" x2="76" y2="28" stroke="#6E4624" strokeWidth="4" strokeLinecap="round" />
            <g className="wok-herbs-toss">
              <ellipse cx="33" cy="29" rx="4.5" ry="2.4" fill={activeMethod === 'chich-mat' ? '#E5A135' : '#C9A45A'} />
              <ellipse cx="44" cy="27" rx="4" ry="2.2" fill="#B68339" />
              <ellipse cx="51" cy="30" rx="4" ry="2.1" fill={activeMethod === 'chich-mat' ? '#F0B642' : '#C9A45A'} />
            </g>
          </svg>
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
          <svg width="78" height="62" viewBox="0 0 78 62" fill="none" aria-hidden="true">
            <polygon points="39,7 69,31 39,55 9,31" fill="#A62620" stroke="#E7B96A" strokeWidth="1.8" />
            <line x1="24" y1="19" x2="54" y2="43" stroke="#E2C896" strokeWidth="2.4" />
            <line x1="54" y1="19" x2="24" y2="43" stroke="#E2C896" strokeWidth="2.4" />
            <rect x="33" y="23" width="12" height="16" rx="1.5" fill="#F7E7C8" stroke="#6E3B16" strokeWidth="1" />
          </svg>
          <div className="prop-label">
            <strong>Gói Giấy Hồng Điều →</strong>
            <span>Gấp 4 góc &amp; sang Lò sắc</span>
          </div>
        </button>
      </div>

      {/* Close-up Live Animated PaoZhi Cutscene Stage rendered in Portal so transformed carousel never shifts position: fixed */}
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
              {cutscene.method === 'gia-dap' ? (
                <svg viewBox="0 0 280 200" className="closeup-svg is-mortar" aria-hidden="true">
                  <rect x="24" y="156" width="232" height="24" rx="4" fill="#3B2314" stroke="#7C562B" strokeWidth="2" />
                  <g className="closeup-burst">
                    <circle cx="106" cy="78" r="3" fill="#82D18E" />
                    <circle cx="174" cy="72" r="3.2" fill="#D5B05A" />
                    <circle cx="124" cy="60" r="2.4" fill="#A6D9A1" />
                    <circle cx="158" cy="58" r="2.6" fill="#E8BE65" />
                  </g>
                  <g className="closeup-mortar-body">
                    <ellipse cx="140" cy="96" rx="44" ry="12" fill="#543817" />
                    <g className="crushed-slices">
                      <ellipse cx="122" cy="95" rx="12" ry="5" fill="#7D9E5B" />
                      <ellipse cx="144" cy="93" rx="14" ry="5.5" fill="#B58E49" />
                      <ellipse cx="158" cy="96" rx="10" ry="4.5" fill="#638748" />
                    </g>
                    <path d="M84 94 H196 L180 156 Q140 168 100 156 Z" fill="#A87832" stroke="#36200D" strokeWidth="2.4" />
                    <ellipse cx="140" cy="94" rx="56" ry="13" fill="none" stroke="#ECC371" strokeWidth="2.4" />
                  </g>
                  <g className="closeup-pestle">
                    <rect x="132" y="10" width="18" height="84" rx="8" fill="#D6A64E" stroke="#3A220C" strokeWidth="2" />
                    <ellipse cx="141" cy="88" rx="14" ry="8" fill="#B5822E" stroke="#3A220C" strokeWidth="1.6" />
                  </g>
                </svg>
              ) : (
                <svg viewBox="0 0 280 200" className="closeup-svg is-wok" aria-hidden="true">
                  <rect x="36" y="156" width="208" height="22" rx="4" fill="#2A170D" />
                  <g className="closeup-flames">
                    <path d="M68 158 Q88 122 108 156 Q128 112 146 156 Q168 116 188 156 Q205 124 220 158 Z" fill="#E85A1B" />
                    <path d="M86 158 Q106 130 124 156 Q142 124 162 156 Q180 132 198 158 Z" fill="#FFD166" />
                  </g>
                  <path d="M46 112 Q140 168 234 112 Z" fill="#2E2724" stroke="#14100E" strokeWidth="2.4" />
                  <ellipse cx="140" cy="112" rx="94" ry="18" fill="#463C37" stroke="#8C7562" strokeWidth="2" />
                  {cutscene.method === 'chich-mat' && (
                    <g className="honey-pour-group">
                      <path d="M188 20 Q176 48 164 106" stroke="#F0A52B" strokeWidth="7" strokeLinecap="round" fill="none" />
                      <path d="M188 20 Q176 48 164 106" stroke="#FFE082" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                    </g>
                  )}
                  <g className={`closeup-toss-herbs ${cutscene.method === 'chich-mat' ? 'to-honey' : 'to-gold'}`}>
                    <ellipse cx="106" cy="106" rx="14" ry="6" transform="rotate(-14 106 106)" />
                    <ellipse cx="140" cy="100" rx="15" ry="6.5" transform="rotate(10 140 100)" />
                    <ellipse cx="172" cy="108" rx="13" ry="5.5" transform="rotate(-8 172 108)" />
                    <ellipse cx="124" cy="112" rx="12" ry="5" transform="rotate(22 124 112)" />
                    <ellipse cx="156" cy="114" rx="12" ry="5" transform="rotate(-18 156 114)" />
                  </g>
                  <g className="closeup-spatula">
                    <path d="M76 28 L128 106 L142 98 L88 22 Z" fill="#9E6A36" stroke="#3E2510" strokeWidth="1.8" />
                  </g>
                  <g className="closeup-smoke" stroke="rgba(255,244,224,0.75)" strokeWidth="2.5" fill="none" strokeLinecap="round">
                    <path d="M110 78 Q98 54 112 34" />
                    <path d="M144 74 Q158 50 142 28" />
                  </g>
                </svg>
              )}
              <div className="closeup-caption">
                {cutscene.method === 'gia-dap'
                  ? `Đang giã dập ${cutscene.herbName} trong Cối Đồng cho dậy tinh dầu...`
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
