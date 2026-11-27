import React, { useMemo, useState } from 'react';
import { HERB_MAP } from '../data/herbs';
import { apothecaryAudio } from '../engine/audio';
import { BotanicalSvg } from './svg/BotanicalSvg';

export type GardenZoneKey = 'all' | 'giai-bieu' | 'bo-duong' | 'thanh-kinh';

export interface GardenPlotConfig {
  herbId: string;
  zone: Exclude<GardenZoneKey, 'all'>;
  soilNote: string;
  harvestHint: string;
}

export const GARDEN_PLOTS: GardenPlotConfig[] = [
  // Luống 1: Giải Biểu & Lá Thơm (6 chậu)
  {
    herbId: 'tia-to',
    zone: 'giai-bieu',
    soilNote: 'Đất thịt ẩm râm hiên Đông',
    harvestHint: 'Ngắt ngọn lá tía thơm giàu tinh dầu Tân Ôn'
  },
  {
    herbId: 'kinh-gioi',
    zone: 'giai-bieu',
    soilNote: 'Chậu đất gốm hứng nắng mai',
    harvestHint: 'Hái ngọn mang hoa trị cảm lạnh gió sương'
  },
  {
    herbId: 'bac-ha',
    zone: 'giai-bieu',
    soilNote: 'Khay gốm bên giếng nước trong',
    harvestHint: 'Lá non mát họng giúp Tân Lương giải biểu'
  },
  {
    herbId: 'sinh-khuong',
    zone: 'giai-bieu',
    soilNote: 'Luống đất cát tơi thoát nước',
    harvestHint: 'Đào củ gừng tươi ấm Tỳ Vị, chống buồn nôn'
  },
  {
    herbId: 'cat-can',
    zone: 'giai-bieu',
    soilNote: 'Giàn tre leo phủ đất thịt pha cát',
    harvestHint: 'Đào rễ củ giải cơ cứng gáy, sinh tân chỉ khát'
  },
  {
    herbId: 'tran-bi',
    zone: 'giai-bieu',
    soilNote: 'Bầu đất tơi thoáng đón nắng trưa',
    harvestHint: 'Thu vỏ quýt chín phơi thơm lý khí hóa đờm'
  },

  // Luống 2: Bổ Dưỡng & An Thần (7 chậu)
  {
    herbId: 'hoai-son',
    zone: 'bo-duong',
    soilNote: 'Luống cát mịn ven giàn leo',
    harvestHint: 'Thu củ mài trắng mịn kiện Tỳ bổ Phế Thận'
  },
  {
    herbId: 'dinh-lang',
    zone: 'bo-duong',
    soilNote: 'Chậu sành lớn trước hiên nhà',
    harvestHint: 'Thu rễ lâu năm bổ ngũ tạng tăng sức bền'
  },
  {
    herbId: 'cam-thao',
    zone: 'bo-duong',
    soilNote: 'Đất phù sa tơi giàu mùn',
    harvestHint: 'Thu rễ ngọt bình hòa chư vị (Quốc lão)'
  },
  {
    herbId: 'lac-tien',
    zone: 'bo-duong',
    soilNote: 'Giàn nứa mát râm sau hiên',
    harvestHint: 'Hái ngọn dây nhãn lồng dưỡng Tâm an thần'
  },
  {
    herbId: 'tam-sen',
    zone: 'bo-duong',
    soilNote: 'Bể sành nước tĩnh thả sen',
    harvestHint: 'Tách mầm xanh liên tâm thanh Tâm hỏa mất ngủ'
  },
  {
    herbId: 'ky-tu',
    zone: 'bo-duong',
    soilNote: 'Chậu đất ẩm nhiều nắng chiều',
    harvestHint: 'Hái chùm quả chín đỏ tư bổ Can Thận sáng mắt'
  },
  {
    herbId: 'ngai-cuu',
    zone: 'bo-duong',
    soilNote: 'Góc vườn nắng nhẹ thoáng gió',
    harvestHint: 'Lá ngải thơm ôn kinh tán hàn lưng gối'
  },

  // Luống 3: Thanh Nhiệt & Thông Kinh Lạc (7 chậu)
  {
    herbId: 'kim-ngan-hoa',
    zone: 'thanh-kinh',
    soilNote: 'Giàn gỗ thông thoáng phía Tây',
    harvestHint: 'Hái nụ hoa chớm nở thanh nhiệt giải độc'
  },
  {
    herbId: 'cuc-hoa',
    zone: 'thanh-kinh',
    soilNote: 'Chậu sành nông nhiều nắng sớm',
    harvestHint: 'Ngắt cụm hoa vàng sơ phong bình Can minh mục'
  },
  {
    herbId: 'nhan-tran',
    zone: 'thanh-kinh',
    soilNote: 'Đất đồi ẩm nhẹ ven rào trúc',
    harvestHint: 'Hái cành lá thơm thanh thấp nhiệt Can Đởm'
  },
  {
    herbId: 'la-lot',
    zone: 'thanh-kinh',
    soilNote: 'Chân tường đá rêu ẩm mát',
    harvestHint: 'Lá xanh đậm trừ phong thấp, ấm xương khớp'
  },
  {
    herbId: 'co-xuoc',
    zone: 'thanh-kinh',
    soilNote: 'Luống đất ẩm ven lối đá',
    harvestHint: 'Đào rễ thổ ngưu tất hoạt huyết mạnh gân cốt'
  },
  {
    herbId: 'que-chi',
    zone: 'thanh-kinh',
    soilNote: 'Chậu lớn đất đỏ thoáng khí',
    harvestHint: 'Cắt cành quế non ôn thông kinh mạch ra tứ chi'
  },
  {
    herbId: 'dan-sam',
    zone: 'thanh-kinh',
    soilNote: 'Đất cát pha tơi xốp giàu khoáng',
    harvestHint: 'Đào rễ đỏ hoạt huyết khứ ứ dưỡng tâm'
  }
];

const ZONE_TABS: { id: GardenZoneKey; label: string }[] = [
  { id: 'all', label: `Tất cả Dược Viên (${GARDEN_PLOTS.length})` },
  { id: 'giai-bieu', label: 'Giải Biểu & Lá Thơm (6)' },
  { id: 'bo-duong', label: 'Bổ Dưỡng & An Thần (7)' },
  { id: 'thanh-kinh', label: 'Thanh Nhiệt & Kinh Lạc (7)' }
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
  const [zoneFilter, setZoneFilter] = useState<GardenZoneKey>('all');
  const [wateringId, setWateringId] = useState<string | null>(null);
  const [harvestingId, setHarvestingId] = useState<string | null>(null);
  const [basketBounce, setBasketBounce] = useState(false);

  const visiblePlots = useMemo(
    () => (zoneFilter === 'all' ? GARDEN_PLOTS : GARDEN_PLOTS.filter((p) => p.zone === zoneFilter)),
    [zoneFilter]
  );

  const handleWaterClick = (herbId: string) => {
    setWateringId(herbId);
    onWaterPlot(herbId);
    window.setTimeout(() => {
      setWateringId((cur) => (cur === herbId ? null : cur));
    }, 850);
  };

  const handleWaterAllVisible = () => {
    const thirsty = visiblePlots.filter((p) => (gardenGrowth[p.herbId] ?? 1) < 3);
    if (thirsty.length === 0) return;
    setWateringId(thirsty[0].herbId);
    thirsty.forEach((p) => onWaterPlot(p.herbId));
    window.setTimeout(() => setWateringId(null), 850);
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
        <span>Hậu Viên Thuốc Nam — Đủ {GARDEN_PLOTS.length} Chậu Dược Liệu ({freshHerbIds.length} vị tươi trong giỏ)</span>
        <button type="button" className="btn-cinnabar" onClick={onGoToDispensary}>
          Mang vào Dược Các Bốc Thuốc →
        </button>
      </div>

      {/* Tactile Garden Prop Rack: Coconut Ladle, Bronze Shears & Woven Basket */}
      <div className="garden-tools-rack">
        <div className="garden-tool-card">
          <img src="./art/tools/coconut-ladle.webp" alt="Gáo dừa tưới sương mai" className="garden-tool-thumb" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong>Gáo Dừa Tưới Sương</strong>
            <div className="muted-note" style={{ fontSize: '0.73rem' }}>Tưới ẩm từng chậu hoặc cả luống</div>
            <button
              type="button"
              className="btn-secondary"
              style={{ marginTop: '4px', padding: '2px 8px', fontSize: '0.72rem' }}
              onClick={handleWaterAllVisible}
            >
              Tưới cả luống (+1 cấp)
            </button>
          </div>
        </div>
        <div className="garden-tool-card">
          <img src="./art/tools/bronze-shears.webp" alt="Kéo đồng cắt nhành lá thuốc" className="garden-tool-thumb" />
          <div>
            <strong>Kéo Đồng Hái Lá</strong>
            <div className="muted-note" style={{ fontSize: '0.73rem' }}>Cắt ngọn non giàu tinh dầu khi đạt 3/3</div>
          </div>
        </div>
        <div className={`garden-tool-card basket-card ${basketBounce ? 'is-catching' : ''}`}>
          <img src="./art/tools/bamboo-basket.webp" alt="Giỏ mây tre đan đựng lá tươi" className="garden-tool-thumb" />
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

      <div className="garden-zone-tabs" role="tablist" aria-label="Phân luống Dược Viên">
        {ZONE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={zoneFilter === tab.id}
            className={`acupoint-chip ${zoneFilter === tab.id ? 'active' : ''}`}
            onClick={() => setZoneFilter(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p className="muted-note" style={{ marginTop: 0 }}>
        Tưới nước cho đủ 20 chậu thảo dược Nam bằng Gáo Dừa rồi dùng Kéo Đồng thu hoạch <strong>Lá tươi vườn nhà</strong> vào Giỏ Mây. Khi bốc vị có lá tươi lên Cân Tiểu Ly, thang thuốc tăng độ tinh khiết (+2đ thưởng khi luận án).
      </p>

      <div className="garden-plots-grid">
        {visiblePlots.map((plot) => {
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
                    <img src="./art/tools/coconut-ladle.webp" alt="" className="ladle-tilt-img" />
                    <span className="dew-stream s1" />
                    <span className="dew-stream s2" />
                    <span className="dew-stream s3" />
                  </div>
                )}
                {isHarvesting && (
                  <div className="garden-harvest-fx" aria-hidden="true">
                    <img src="./art/tools/bronze-shears.webp" alt="" className="shears-snip-img" />
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
