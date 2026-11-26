import React from 'react';
import { HERB_MAP } from '../data/herbs';
import { BotanicalSvg } from './svg/BotanicalSvg';

export interface GardenPlotConfig {
  herbId: string;
  soilNote: string;
  harvestHint: string;
}

export const GARDEN_PLOTS: GardenPlotConfig[] = [
  {
    herbId: 'tia-to',
    soilNote: 'Đất thịt ẩm râm hiên Đông',
    harvestHint: 'Ngắt ngọn lá tía thơm giàu tinh dầu Tân Ôn'
  },
  {
    herbId: 'kinh-gioi',
    soilNote: 'Chậu đất gốm hứng nắng mai',
    harvestHint: 'Hái ngọn mang hoa trị cảm lạnh gió sương'
  },
  {
    herbId: 'bac-ha',
    soilNote: 'Khay gốm bên giếng nước trong',
    harvestHint: 'Lá non mát họng giúp Tân Lương giải biểu'
  },
  {
    herbId: 'sinh-khuong',
    soilNote: 'Luống đất cát tơi thoát nước',
    harvestHint: 'Đào củ gừng tươi ấm Tỳ Vị, chống buồn nôn'
  },
  {
    herbId: 'ngai-cuu',
    soilNote: 'Góc vườn nắng nhẹ thoáng gió',
    harvestHint: 'Lá ngải thơm ôn kinh tán hàn lưng gối'
  },
  {
    herbId: 'la-lot',
    soilNote: 'Chân tường đá rêu ẩm mát',
    harvestHint: 'Lá xanh đậm trừ phong thấp, ấm xương khớp'
  }
];

interface HerbGardenRoomProps {
  gardenGrowth: Record<string, number>;
  freshHerbIds: string[];
  onWaterPlot: (herbId: string) => void;
  onHarvestPlot: (herbId: string) => void;
  onGoToDispensary: () => void;
}

export const HerbGardenRoom: React.FC<HerbGardenRoomProps> = ({
  gardenGrowth,
  freshHerbIds,
  onWaterPlot,
  onHarvestPlot,
  onGoToDispensary
}) => {
  return (
    <div className="woodblock-sheet">
      <div className="section-heading">
        <span>Hậu Viên Thuốc Nam — Tưới Sương &amp; Hái Lá Tươi ({freshHerbIds.length} vị tươi trong giỏ)</span>
        <button type="button" className="btn-cinnabar" onClick={onGoToDispensary}>
          Mang vào Dược Các Bốc Thuốc →
        </button>
      </div>

      <p className="muted-note" style={{ marginTop: 0 }}>
        Tưới nước cho 6 chậu thảo dược Nam quen thuộc quanh nhà để tích trữ <strong>Lá tươi vườn nhà</strong>. Khi bốc vị thuốc có sẵn lá tươi lên Cân Tiểu Ly, thang thuốc sẽ tăng thêm tinh khiết (+2đ thưởng khi luận án).
      </p>

      <div className="garden-basket-strip">
        <strong>Giỏ mây lá tươi hiện có:</strong>{' '}
        {freshHerbIds.length === 0 ? (
          <span className="muted-note">Chưa hái vị tươi nào. Hãy tưới &amp; thu hoạch bên dưới!</span>
        ) : (
          freshHerbIds.map((id) => (
            <span key={id} className="clue-chip garden-fresh-chip">
              {HERB_MAP[id]?.name ?? id} (Tươi)
            </span>
          ))
        )}
      </div>

      <div className="garden-plots-grid">
        {GARDEN_PLOTS.map((plot) => {
          const herb = HERB_MAP[plot.herbId];
          if (!herb) return null;
          const growth = Math.max(0, Math.min(3, gardenGrowth[plot.herbId] ?? 1));
          const isReady = growth >= 3;
          const hasFreshInBasket = freshHerbIds.includes(plot.herbId);

          return (
            <article key={plot.herbId} className={`garden-pot-card ${isReady ? 'is-ready' : ''}`}>
              <div className="garden-pot-visual">
                <div className={`garden-plant-sway stage-${growth}`}>
                  <BotanicalSvg herbId={herb.id} motif={herb.motif} size={64} />
                </div>
                <div className="garden-terracotta-rim" aria-hidden="true" />
              </div>

              <div className="garden-pot-info">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                  <strong style={{ fontFamily: 'var(--font-serif)', fontSize: '0.96rem' }}>
                    {herb.name}
                  </strong>
                  <span className="tag-badge" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                    {isReady ? 'Xanh tốt (Sẵn hái)' : `Sinh trưởng ${growth}/3`}
                  </span>
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--ink-muted)', margin: '2px 0' }}>
                  {plot.soilNote} · {plot.harvestHint}
                </div>

                <div className="garden-growth-dots" aria-label={`Độ trưởng thành ${growth}/3`}>
                  {[1, 2, 3].map((step) => (
                    <span key={step} className={`growth-dot ${growth >= step ? 'filled' : ''}`} />
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '4px 9px', fontSize: '0.76rem' }}
                    disabled={isReady}
                    onClick={() => onWaterPlot(plot.herbId)}
                  >
                    {isReady ? 'Đã đủ ẩm' : 'Tưới sương sớm'}
                  </button>
                  <button
                    type="button"
                    className={isReady && !hasFreshInBasket ? 'btn-cinnabar' : 'btn-secondary'}
                    style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                    disabled={!isReady || hasFreshInBasket}
                    onClick={() => onHarvestPlot(plot.herbId)}
                  >
                    {hasFreshInBasket ? 'Đã có trong giỏ' : isReady ? 'Hái lá tươi' : 'Chờ lớn đủ 3/3'}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
