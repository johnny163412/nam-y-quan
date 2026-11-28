import React from 'react';
import { apothecaryAudio } from '../../engine/audio';
import { EXAM_INSTRUMENTS, TabletopTool } from './clinicConstants';

const TOOL_ART: Record<TabletopTool, { art: string; title: string }> = {
  vong: { art: './art/tools/desk-vong-mirror.webp', title: 'Vọng Chẩn: gương đồng soi lưỡi, nhìn sắc mặt' },
  van: { art: './art/tools/desk-van-tube.webp', title: 'Văn Chẩn: ống trúc nghe hơi thở, tiếng nói' },
  'van-hoi': { art: './art/tools/desk-vanhoi-slips.webp', title: 'Vấn Chẩn: rút thẻ tre để hỏi bệnh' },
  thiet: { art: './art/tools/desk-thiet-pillow.webp', title: 'Thiết Chẩn: gối bắt mạch' },
  'bat-cuong': { art: './art/tools/desk-batquai-disc.webp', title: 'Đĩa đồng Bát Quái: chốt biện chứng' }
};

const DESK_TOOLS = [...EXAM_INSTRUMENTS, { id: 'bat-cuong' as const, label: 'Đĩa Bát Quái' }].map((t) => ({
  id: t.id as TabletopTool,
  label: t.label,
  ...TOOL_ART[t.id as TabletopTool]
}));

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

      {/* The 5 Tứ Chẩn instruments as painted objects resting on the desk */}
      <div className="spatial-tabletop-tray" role="toolbar" aria-label="5 pháp khí trên bàn khám">
        {DESK_TOOLS.map((tool) => {
          const isOpen = activeToolDrawer === tool.id;
          return (
            <button
              key={tool.id}
              type="button"
              className={`tabletop-tool-btn tool-${tool.id} ${isOpen ? 'active' : ''}`}
              title={tool.title}
              onClick={() => {
                onToggleTool(tool.id);
                apothecaryAudio.playPageTurn();
              }}
            >
              <img src={tool.art} alt="" className="tabletop-tool-art" draggable={false} />
              <span className="tabletop-tool-label">
                {tool.id === 'van-hoi' ? `${tool.label} (${askedCount}/${maxInquiries})` : tool.label}
              </span>
            </button>
          );
        })}
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
