import React from 'react';
import { apothecaryAudio } from '../../engine/audio';
import { AntiqueIcon } from '../svg/AntiqueIcons';
import { EXAM_INSTRUMENTS, TabletopTool } from './clinicConstants';

interface TabletopDeskProps {
  yDucPoints: number;
  incenseLit: boolean;
  onLightIncense: () => void;
  activeToolDrawer: TabletopTool | null;
  onToggleTool: (tool: TabletopTool) => void;
  askedCount: number;
  maxInquiries: number;
  hasJadeSeal: boolean;
  onShowRelics: () => void;
}

/** Must render OUTSIDE `.apothecary-room-track`: `position: fixed` inside a transformed ancestor breaks viewport centering. */
export const TabletopDesk: React.FC<TabletopDeskProps> = ({
  yDucPoints,
  incenseLit,
  onLightIncense,
  activeToolDrawer,
  onToggleTool,
  askedCount,
  maxInquiries,
  hasJadeSeal,
  onShowRelics
}) => (
    <div className="tien-duong-desk-foreground">
      {/* Physical Relic 1 on Left Side of Desk: Antique Bronze Incense Burner */}
      <button
        type="button"
        className={`desk-physical-relic relic-incense ${yDucPoints >= 20 ? 'is-unlocked' : 'is-locked'} ${
          incenseLit ? 'is-lit' : ''
        }`}
        onClick={onLightIncense}
        title={
          yDucPoints >= 20
            ? 'Đỉnh Trầm Hương — Nhấp để thắp trầm định thần (+1 lượt hỏi Thẻ Vấn cho ca này)'
            : `Đỉnh Trầm Hương — Mở khóa tại 20 Y Đức (hiện có ${yDucPoints})`
        }
      >
        <span className="desk-relic-art-wrap">
          <img
            src="./art/tools/bronze-incense-burner.webp"
            alt="Đỉnh Trầm Hương đặt trên bàn khám"
            className="desk-relic-img"
          />
          {yDucPoints >= 20 && (
            <>
              <span className="desk-smoke-plume s1" aria-hidden="true" />
              <span className="desk-smoke-plume s2" aria-hidden="true" />
            </>
          )}
        </span>
        <span className="desk-relic-caption">
          {yDucPoints >= 20
            ? incenseLit
              ? 'Trầm Đang Tỏa (+1 Vấn)'
              : 'Thắp Đỉnh Trầm'
            : 'Đỉnh Trầm (20 YĐ)'}
        </span>
      </button>

      {/* Center 5 Tactile Examination Instruments directly on the Wooden Desk */}
      <div className="spatial-tabletop-tray" role="toolbar" aria-label="Khay 5 pháp khí trên bàn khám">
        {EXAM_INSTRUMENTS.map((inst) => {
          const isOpen = activeToolDrawer === inst.id;
          return (
            <button
              key={inst.id}
              type="button"
              className={`tabletop-tool-btn ${isOpen ? 'active' : ''}`}
              onClick={() => {
                onToggleTool(inst.id);
                apothecaryAudio.playPageTurn();
              }}
            >
              <span className="tabletop-tool-icon" aria-hidden="true">
                <AntiqueIcon name={inst.icon} size={18} />
              </span>
              <span className="tabletop-tool-label">
                {inst.id === 'van-hoi'
                  ? `${inst.label} (${askedCount}/${maxInquiries})`
                  : inst.label}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          className={`tabletop-tool-btn is-compass ${activeToolDrawer === 'bat-cuong' ? 'active' : ''}`}
          onClick={() => {
            onToggleTool('bat-cuong');
            apothecaryAudio.playPageTurn();
          }}
        >
          <span className="tabletop-tool-icon" aria-hidden="true">
            <AntiqueIcon name="yin-yang" size={18} />
          </span>
          <span className="tabletop-tool-label">Đĩa Bát Quái</span>
        </button>
      </div>

      {/* Physical Relic 2 on Right Side of Desk: Jade / Cinnabar Clinic Seal */}
      <button
        type="button"
        className={`desk-physical-relic relic-seal ${hasJadeSeal ? 'is-jade-unlocked' : 'is-wood-active'}`}
        onClick={onShowRelics}
        title={
          hasJadeSeal
            ? 'Ấn Ngọc Bích Trấn Quán (120 Y Đức) — Nhấp xem danh sách bảo vật đang hiện hữu'
            : 'Ấn Gỗ Tuệ Tâm Đường — Đạt 120 Y Đức sẽ hóa Ấn Ngọc Bích'
        }
      >
        <span className={`desk-seal-block ${hasJadeSeal ? 'is-jade' : ''}`} aria-hidden="true">
          惠心
        </span>
        <span className="desk-relic-caption">
          {hasJadeSeal ? 'Ấn Ngọc Bích' : 'Ấn Y Quán'}
        </span>
      </button>
    </div>
);
