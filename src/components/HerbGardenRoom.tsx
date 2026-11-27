import React, { useState } from 'react';
import { HERB_MAP } from '../data/herbs';
import { apothecaryAudio } from '../engine/audio';
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
  const [wateringId, setWateringId] = useState<string | null>(null);
  const [harvestingId, setHarvestingId] = useState<string | null>(null);
  const [basketBounce, setBasketBounce] = useState(false);

  const handleWaterClick = (herbId: string) => {
    setWateringId(herbId);
    onWaterPlot(herbId);
    window.setTimeout(() => {
      setWateringId((cur) => (cur === herbId ? null : cur));
    }, 850);
  };

  const handleHarvestClick = (herbId: string) => {
    apothecaryAudio.playHerbSnip();
    setHarvestingId(herbId);
    onHarvestPlot(herbId);
    window.setTimeout(() => setBasketBounce(true), 420);
    window.setTimeout(() => {
      setHarvestingId((cur) => (cur === herbId ? null : cur));
      setBasketBounce(false);
    }, 820);
  };

  return (
    <div className="woodblock-sheet">
      <div className="section-heading">
        <span>Hậu Viên Thuốc Nam — Tưới Sương &amp; Hái Lá Tươi ({freshHerbIds.length} vị tươi trong giỏ)</span>
        <button type="button" className="btn-cinnabar" onClick={onGoToDispensary}>
          Mang vào Dược Các Bốc Thuốc →
        </button>
      </div>

      {/* Tactile Garden Prop Rack: Coconut Ladle, Bronze Shears & Woven Basket */}
      <div className="garden-tools-rack">
        <div className="garden-tool-card">
          <img src="/art/tools/coconut-ladle.jpg" alt="Gáo dừa tưới sương mai" className="garden-tool-thumb" />
          <div>
            <strong>Gáo Dừa Tưới Sương</strong>
            <div className="muted-note" style={{ fontSize: '0.73rem' }}>Tưới ẩm từng chậu sành lên 3/3</div>
          </div>
        </div>
        <div className="garden-tool-card">
          <img src="/art/tools/bronze-shears.jpg" alt="Kéo đồng cắt nhành lá thuốc" className="garden-tool-thumb" />
          <div>
            <strong>Kéo Đồng Hái Lá</strong>
            <div className="muted-note" style={{ fontSize: '0.73rem' }}>Cắt ngọn non giàu tinh dầu</div>
          </div>
        </div>
        <div className={`garden-tool-card basket-card ${basketBounce ? 'is-catching' : ''}`}>
          <img src="/art/tools/bamboo-basket.jpg" alt="Giỏ mây tre đan đựng lá tươi" className="garden-tool-thumb" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong>Giỏ Mây Tre Đan ({freshHerbIds.length})</strong>
            <div className="garden-basket-inline">
              {freshHerbIds.length === 0 ? (
                <span className="muted-note" style={{ fontSize: '0.73rem' }}>Chưa hái vị tươi nào.</span>
              ) : (
                freshHerbIds.map((id) => (
                  <span key={id} className="clue-chip garden-fresh-chip">
                    {HERB_MAP[id]?.name ?? id} (Tươi)
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="muted-note" style={{ marginTop: 0 }}>
        Tưới nước cho 6 chậu thảo dược Nam bằng Gáo Dừa rồi dùng Kéo Đồng thu hoạch <strong>Lá tươi vườn nhà</strong> vào Giỏ Mây. Khi bốc vị có lá tươi lên Cân Tiểu Ly, thang thuốc tăng độ tinh khiết (+2đ thưởng khi luận án).
      </p>

      <div className="garden-plots-grid">
        {GARDEN_PLOTS.map((plot) => {
          const herb = HERB_MAP[plot.herbId];
          if (!herb) return null;
          const growth = Math.max(0, Math.min(3, gardenGrowth[plot.herbId] ?? 1));
          const isReady = growth >= 3;
          const hasFreshInBasket = freshHerbIds.includes(plot.herbId);
          const isWatering = wateringId === plot.herbId;
          const isHarvesting = harvestingId === plot.herbId;

          return (
            <article key={plot.herbId} className={`garden-pot-card ${isReady ? 'is-ready' : ''} ${isWatering ? 'is-watering' : ''} ${isHarvesting ? 'is-harvesting' : ''}`}>
              <div className="garden-pot-visual">
                {isWatering && (
                  <div className="garden-ladle-fx" aria-hidden="true">
                    <img src="/art/tools/coconut-ladle.jpg" alt="" className="ladle-tilt-img" />
                    <span className="dew-stream s1" />
                    <span className="dew-stream s2" />
                    <span className="dew-stream s3" />
                  </div>
                )}
                {isHarvesting && (
                  <div className="garden-harvest-fx" aria-hidden="true">
                    <img src="/art/tools/bronze-shears.jpg" alt="" className="shears-snip-img" />
                    <div className="flying-sprig-fx">
                      <BotanicalSvg herbId={herb.id} motif={herb.motif} size={34} bare />
                    </div>
                  </div>
                )}
                <div className={`garden-plant-sway stage-${growth}`}>
                  <BotanicalSvg herbId={herb.id} motif={herb.motif} size={64} />
                </div>
                <div className="garden-terracotta-rim" aria-hidden="true" />
                <div className="garden-terracotta-body" aria-hidden="true" />
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
                    onClick={() => handleWaterClick(plot.herbId)}
                  >
                    {isReady ? 'Đã đủ ẩm' : 'Tưới sương sớm'}
                  </button>
                  <button
                    type="button"
                    className={isReady && !hasFreshInBasket ? 'btn-cinnabar' : 'btn-secondary'}
                    style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                    disabled={!isReady || hasFreshInBasket}
                    onClick={() => handleHarvestClick(plot.herbId)}
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
