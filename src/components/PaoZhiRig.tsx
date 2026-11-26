import React from 'react';
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
  const activeHerbId = slots[selectedSlot];
  const activeHerb = activeHerbId ? HERB_MAP[activeHerbId] : null;
  const activeMethod: PaoZhiMethod = slotPaoZhi[selectedSlot] ?? 'sinh-dung';
  const isGrinding = animatingPanRole === selectedSlot && activeMethod === 'gia-dap';
  const isRoasting =
    animatingPanRole === selectedSlot &&
    (activeMethod === 'sao-vang' || activeMethod === 'chich-mat');

  const cycleWokMethod = () => {
    if (!activeHerb) return;
    const next: PaoZhiMethod =
      activeMethod === 'sao-vang'
        ? 'chich-mat'
        : activeMethod === 'chich-mat'
        ? 'sinh-dung'
        : 'sao-vang';
    onSelectPaoZhi(selectedSlot, next);
  };

  return (
    <div className="paozhi-props-stage">
      {/* Prop 1: Brass Mortar & Pestle (Giã dập) */}
      <button
        type="button"
        className={`workbench-prop-btn ${activeMethod === 'gia-dap' ? 'is-active' : ''} ${
          isGrinding ? 'anim-pounding' : ''
        }`}
        disabled={!activeHerb}
        onClick={() => onSelectPaoZhi(selectedSlot, activeMethod === 'gia-dap' ? 'sinh-dung' : 'gia-dap')}
        title="Nhấp vào Cối Đồng để giã dập vị thuốc đang chọn trên cân"
      >
        <svg width="78" height="62" viewBox="0 0 78 62" fill="none" aria-hidden="true">
          {/* Brass pestle arm */}
          <g className="pestle-arm">
            <rect x="44" y="4" width="8" height="32" rx="4" transform="rotate(24 48 16)" fill="#CFA052" stroke="#36220D" strokeWidth="1.4" />
            <circle cx="41" cy="29" r="5" fill="#E6BE70" stroke="#36220D" strokeWidth="1.2" />
          </g>
          {/* Floating crushed flecks */}
          <g className="mortar-flecks" fill="#6F9A58">
            <circle cx="32" cy="20" r="2" />
            <circle cx="44" cy="18" r="1.8" />
            <circle cx="38" cy="14" r="1.5" />
          </g>
          {/* Heavy bronze mortar body */}
          <path d="M18 28 H60 L54 52 Q39 58 24 52 Z" fill="#9E702E" stroke="#2D1B0C" strokeWidth="1.8" />
          <ellipse cx="39" cy="28" rx="21" ry="5.5" fill="#5D3D19" stroke="#E5BD6C" strokeWidth="1.4" />
          <rect x="26" y="52" width="26" height="5" rx="2" fill="#704D1C" stroke="#2D1B0C" strokeWidth="1.2" />
        </svg>
        <div className="prop-label">
          <strong>Cối Giã Đồng</strong>
          <span>
            {!activeHerb ? 'Chọn vị trên cân' : activeMethod === 'gia-dap' ? 'Đang giã dập' : 'Chạm để giã'}
          </span>
        </div>
      </button>

      {/* Prop 2: Cast-Iron Roasting Wok & Fire (Sao vàng / Chích mật) */}
      <button
        type="button"
        className={`workbench-prop-btn ${
          activeMethod === 'sao-vang' || activeMethod === 'chich-mat' ? 'is-active' : ''
        } ${isRoasting ? 'anim-roasting' : ''}`}
        disabled={!activeHerb}
        onClick={cycleWokMethod}
        title="Nhấp vào Chảo Gang để đổi cách chế biến: Sao vàng / Chích mật / Để mộc"
      >
        <svg width="82" height="62" viewBox="0 0 82 62" fill="none" aria-hidden="true">
          {/* Charcoal Flames */}
          <g className={`wok-flames ${activeMethod === 'sao-vang' || activeMethod === 'chich-mat' ? 'burning' : ''}`}>
            <path d="M24 56 Q28 42 33 55 Q39 39 45 55 Q50 43 56 56 Z" fill="#E86524" />
            <path d="M30 56 Q35 45 40 55 Q45 44 50 56 Z" fill="#FFD166" />
          </g>
          {/* Cast iron wok & wooden handles */}
          <path d="M12 31 Q41 53 70 31 Z" fill="#322B28" stroke="#18120F" strokeWidth="1.8" />
          <ellipse cx="41" cy="31" rx="29" ry="7" fill="#4B403B" stroke="#857161" strokeWidth="1.3" />
          <line x1="6" y1="28" x2="14" y2="31" stroke="#6E4624" strokeWidth="4" strokeLinecap="round" />
          <line x1="68" y1="31" x2="76" y2="28" stroke="#6E4624" strokeWidth="4" strokeLinecap="round" />
          {/* Tossing herb slices inside wok */}
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

      {/* Prop 3: Fold Vermilion Paper Packet (Giấy Hồng Điều) */}
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
  );
};
