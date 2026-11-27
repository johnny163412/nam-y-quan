import React, { useState } from 'react';
import { ACUPOINTS } from '../data/acupoints';
import { apothecaryAudio } from '../engine/audio';
import { Acupoint } from '../types/tcm';

interface MeridianBodyMapProps {
  selectedIds: string[];
  onToggleAcupoint: (id: string) => void;
  candidateIds?: string[];
  forcedSide?: 'front' | 'back';
  isPregnant?: boolean;
  hideDetails?: boolean;
  moxaEnabled?: boolean;
  onToggleMoxa?: () => void;
  cuppingEnabled?: boolean;
  onToggleCupping?: () => void;
}

export const MeridianBodyMap: React.FC<MeridianBodyMapProps> = ({
  selectedIds,
  onToggleAcupoint,
  candidateIds,
  forcedSide,
  isPregnant = false,
  hideDetails = false,
  moxaEnabled = false,
  onToggleMoxa,
  cuppingEnabled = false,
  onToggleCupping
}) => {
  const [side, setSide] = useState<'front' | 'back'>(forcedSide ?? 'front');
  const [inspected, setInspected] = useState<Acupoint | null>(null);
  const [deQiPointId, setDeQiPointId] = useState<string | null>(null);

  const activeSide = forcedSide ?? side;
  const visiblePoints = ACUPOINTS.filter((p) => {
    if (p.bodySide !== activeSide) return false;
    if (candidateIds && !candidateIds.includes(p.id)) return false;
    return true;
  });

  const handleClickPoint = (pt: Acupoint) => {
    const activating = !selectedIds.includes(pt.id);
    setInspected(pt);
    onToggleAcupoint(pt.id);
    if (activating && !hideDetails) {
      setDeQiPointId(pt.id);
      apothecaryAudio.playDeQiChime();
      window.setTimeout(() => {
        setDeQiPointId((cur) => (cur === pt.id ? null : cur));
      }, 950);
    }
  };

  return (
    <div className="meridian-map-layout">
      <div className="meridian-canvas-col">
        {!forcedSide && (
          <div className="toggle-pair" style={{ width: '100%' }}>
            <button
              type="button"
              className={`toggle-pill ${activeSide === 'front' ? 'active' : ''}`}
              onClick={() => setSide('front')}
            >
              Mặt Trước (Âm / Vị)
            </button>
            <button
              type="button"
              className={`toggle-pill ${activeSide === 'back' ? 'active' : ''}`}
              onClick={() => setSide('back')}
            >
              Mặt Sau (Đốc / Bàng Quang)
            </button>
          </div>
        )}

        <svg
          width="284"
          height="444"
          viewBox="-18 0 286 444"
          role="img"
          aria-label="Đồ hình Kinh Lạc và Huyệt Đạo cổ họa"
          style={{
            maxWidth: '100%',
            height: 'auto',
            background: 'radial-gradient(circle at 50% 42%, #EFE2C6 0%, #DFCCA6 100%)',
            border: '2px solid #5A3E28',
            borderRadius: '4px',
            boxShadow: 'inset 0 0 18px rgba(70, 44, 18, 0.14)'
          }}
        >
          {/* Antique Rosewood & Brass Scroll Rollers top & bottom */}
          <g>
            <rect x="-14" y="2" width="278" height="6" rx="2" fill="#3B2314" stroke="#8C6234" strokeWidth="0.9" />
            <circle cx="-13" cy="5" r="4" fill="#CFA052" stroke="#3B2314" strokeWidth="1" />
            <circle cx="263" cy="5" r="4" fill="#CFA052" stroke="#3B2314" strokeWidth="1" />
            <rect x="-14" y="436" width="278" height="6" rx="2" fill="#3B2314" stroke="#8C6234" strokeWidth="0.9" />
            <circle cx="-13" cy="439" r="4" fill="#CFA052" stroke="#3B2314" strokeWidth="1" />
            <circle cx="263" cy="439" r="4" fill="#CFA052" stroke="#3B2314" strokeWidth="1" />
          </g>

          {activeSide === 'front' ? (
            <>
              {/* Master Vietnamese silk-and-ink front figure blended seamlessly into Dó paper */}
              <image
                href="/art/meridians/meridian-front.jpg"
                x="0"
                y="0"
                width="250"
                height="444"
                preserveAspectRatio="none"
                style={{ mixBlendMode: 'multiply' }}
              />
              {/* Delicate flowing meridian pathways + active Đắc Khí flow */}
              <g stroke="#23574C" strokeWidth="1.1" strokeDasharray="4 3" fill="none" opacity="0.58">
                <path d="M125 68 C125 106 125 138 125 220" />
                <path d="M102 124 C95 190 94 265 93 333 C92 368 92 392 91 411" />
                <path d="M148 124 C150 198 148 290 142 377 L140 398" />
                <path d="M84 114 C70 152 60 188 55 226 C51 236 48 240 46 244" />
                <path d="M166 114 C178 152 186 188 190 218 L195 233" />
              </g>
              {selectedIds.length > 0 && !hideDetails && (
                <g
                  className="meridian-qi-stream"
                  stroke={moxaEnabled ? '#E8833A' : '#58D3AF'}
                  strokeWidth="1.9"
                  fill="none"
                  opacity="0.88"
                >
                  <path d="M125 68 C125 106 125 138 125 220" />
                  <path d="M102 124 C95 190 94 265 93 333 C92 368 92 392 91 411" />
                  <path d="M148 124 C150 198 148 290 142 377 L140 398" />
                  <path d="M84 114 C70 152 60 188 55 226 C51 236 48 240 46 244" />
                  <path d="M166 114 C178 152 186 188 190 218 L195 233" />
                </g>
              )}
            </>
          ) : (
            <>
              {/* Painted silk dorsal scroll aligned 1:1 with front silhouette & dorsal acupoints */}
              <image
                href="/art/meridians/meridian-back.jpg"
                x="0"
                y="0"
                width="250"
                height="444"
                preserveAspectRatio="none"
                style={{ mixBlendMode: 'multiply' }}
              />
              {/* Back meridian pathways: Đốc Mạch, Bàng Quang (Back-Shu + Ủy Trung), Đởm & Tam Tiêu */}
              <g stroke="#274B6D" strokeWidth="1.15" strokeDasharray="4 3" fill="none" opacity="0.72">
                <path d="M126 36 C126 76 126 148 126 236" />
                <path d="M112 83 L110 124 L110 144 L110 164 L110 180 L110 196 C108 254 106 300 103 354" />
                <path d="M140 83 C142 130 144 185 146 232 C148 272 149 296 149 318 L149 364" />
                <path d="M126 98 Q140 101 154 105" />
                <path d="M84 118 C71 154 61 188 53 222" />
              </g>
              {selectedIds.length > 0 && !hideDetails && (
                <g
                  className="meridian-qi-stream"
                  stroke={moxaEnabled ? '#E8833A' : '#58D3AF'}
                  strokeWidth="1.9"
                  fill="none"
                  opacity="0.88"
                >
                  <path d="M126 36 C126 76 126 148 126 236" />
                  <path d="M112 83 L110 124 L110 144 L110 164 L110 180 L110 196 C108 254 106 300 103 354" />
                  <path d="M140 83 C142 130 144 185 146 232 C148 272 149 296 149 318 L149 364" />
                  <path d="M126 98 Q140 101 154 105" />
                  <path d="M84 118 C71 154 61 188 53 222" />
                </g>
              )}
            </>
          )}

          {/* Acupoint Nodes & Crisp Non-Overlapping Labels */}
          {visiblePoints.map((pt) => {
            const isSelected = selectedIds.includes(pt.id);
            const isDanger = isPregnant && pt.pregnancyForbidden;

            let labelX = pt.x < 125 ? pt.x - 10 : pt.x + 10;
            let labelY = pt.y + 3;
            let anchor: 'start' | 'middle' | 'end' = pt.x < 125 ? 'end' : 'start';

            const rightAlignedIds = new Set([
              'an-duong',
              'dan-trung',
              'trung-quan',
              'khi-hai',
              'tam-am-giao',
              'thai-khe',
              'noi-quan',
              'than-mon',
              'bach-hoi',
              'dai-chuy',
              'kien-tinh',
              'menh-mon',
              'uy-trung'
            ]);
            const leftAlignedIds = new Set([
              'hop-coc',
              'liet-khuyet',
              'ngoai-quan',
              'phong-tri',
              'phe-du',
              'tam-du',
              'can-du',
              'ty-du',
              'than-du',
              'tuc-tam-ly',
              'thai-xung'
            ]);

            if (rightAlignedIds.has(pt.id)) {
              labelX = pt.x + 10;
              anchor = 'start';
            } else if (leftAlignedIds.has(pt.id)) {
              labelX = pt.x - 10;
              anchor = 'end';
            }

            if (pt.id === 'dai-chuy') labelY = pt.y - 2;
            if (pt.id === 'kien-tinh') labelY = pt.y + 8;
            if (pt.id === 'ty-du') labelY = pt.y - 1;
            if (pt.id === 'than-du') labelY = pt.y + 5;
            if (pt.id === 'thai-khe') labelY = pt.y + 4;

            return (
              <g
                key={pt.id}
                onClick={() => handleClickPoint(pt)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? 9.5 : 7}
                  fill={
                    isSelected
                      ? isDanger
                        ? '#A62620'
                        : moxaEnabled
                        ? '#B84418'
                        : '#23574C'
                      : 'rgba(255, 248, 237, 0.92)'
                  }
                  stroke={isDanger && !hideDetails ? '#A62620' : moxaEnabled && isSelected ? '#F5B552' : '#2F231A'}
                  strokeWidth={isSelected ? 2 : 1.35}
                />
                {isSelected && deQiPointId === pt.id && !hideDetails && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="11"
                    className="deqi-pulse-ring"
                    fill="none"
                    stroke={moxaEnabled ? '#FF9A44' : '#58D3AF'}
                    strokeWidth="2.2"
                  />
                )}
                {isSelected && moxaEnabled && !hideDetails && (
                  <g className="moxa-aura-group" aria-hidden="true">
                    <circle cx={pt.x} cy={pt.y} r="14" fill="rgba(235, 118, 38, 0.30)" />
                    <circle cx={pt.x + 1} cy={pt.y - 4} r="2.2" fill="#FF9838" className="moxa-ember-spark" />
                    <path
                      className="moxa-smoke-plume"
                      d={`M ${pt.x - 2} ${pt.y - 7} Q ${pt.x - 8} ${pt.y - 16} ${pt.x} ${pt.y - 25} Q ${pt.x + 7} ${pt.y - 32} ${pt.x + 1} ${pt.y - 40}`}
                      stroke="rgba(255, 244, 224, 0.88)"
                      strokeWidth="1.7"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <path
                      className="moxa-smoke-plume secondary"
                      d={`M ${pt.x + 2} ${pt.y - 8} Q ${pt.x + 9} ${pt.y - 18} ${pt.x + 2} ${pt.y - 27} Q ${pt.x - 5} ${pt.y - 35} ${pt.x - 1} ${pt.y - 42}`}
                      stroke="rgba(246, 226, 192, 0.56)"
                      strokeWidth="1.25"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </g>
                )}
                {isSelected && cuppingEnabled && pt.bodySide === 'back' && !hideDetails && (
                  <g className="bamboo-cup-overlay" aria-hidden="true">
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="12.5"
                      fill="rgba(164, 96, 44, 0.16)"
                      stroke="#7D491D"
                      strokeWidth="2.8"
                    />
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="10.2"
                      fill="none"
                      stroke="#E0B272"
                      strokeWidth="0.9"
                      strokeDasharray="3 2"
                    />
                  </g>
                )}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={2.6}
                  fill={isSelected ? '#FFF8ED' : '#A62620'}
                />
                {isSelected && !hideDetails && (
                  <g
                    className="silver-needle-group"
                    transform={`translate(${pt.x}, ${pt.y})`}
                    aria-hidden="true"
                  >
                    {/* Angled fine silver acupuncture needle + wound copper handle */}
                    <g transform="rotate(32)">
                      <line x1="0" y1="0" x2="0" y2="-16" stroke="#F4F6F8" strokeWidth="1.4" strokeLinecap="round" />
                      <line x1="0.3" y1="0" x2="0.3" y2="-16" stroke="#4D5B66" strokeWidth="0.6" strokeLinecap="round" />
                      <line x1="0" y1="-16" x2="0" y2="-23" stroke="#B66E2E" strokeWidth="2.7" strokeLinecap="round" />
                      <line x1="-1.1" y1="-17.5" x2="1.1" y2="-17.5" stroke="#5A3012" strokeWidth="0.7" />
                      <line x1="-1.1" y1="-19.5" x2="1.1" y2="-19.5" stroke="#5A3012" strokeWidth="0.7" />
                      <line x1="-1.1" y1="-21.5" x2="1.1" y2="-21.5" stroke="#5A3012" strokeWidth="0.7" />
                    </g>
                  </g>
                )}
                {!hideDetails && (
                  <text
                    x={labelX}
                    y={labelY}
                    textAnchor={anchor}
                    fontSize="8.8"
                    fontWeight="700"
                    fill="#221B15"
                    stroke="#FAF4E4"
                    strokeWidth="2.6"
                    paintOrder="stroke"
                  >
                    {pt.name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {!hideDetails && (
        <div className="meridian-details-col">
          {onToggleMoxa && (
            <div className={`moxa-strip ${moxaEnabled ? 'is-burning' : ''}`}>
              <img
                src="/art/tools/moxa-stick.jpg"
                alt="Điếu ngải cứu đang cháy âm ỉ tỏa khói thơm"
                className="moxa-thumb"
              />
              <div className="moxa-strip-copy">
                <div style={{ fontWeight: 700, fontSize: '0.84rem', color: moxaEnabled ? '#FFF3D6' : 'var(--ink-primary)' }}>
                  Hơ Điếu Ngải Cứu (Cứu ấm huyệt)
                </div>
                <div style={{ fontSize: '0.75rem', color: moxaEnabled ? '#E5C693' : 'var(--ink-muted)' }}>
                  Dẫn dương khí thấm sâu khi chứng thiên Hàn (+2đ).
                </div>
              </div>
              <button
                type="button"
                className={`toggle-pill moxa-action-btn ${moxaEnabled ? 'active' : ''}`}
                onClick={onToggleMoxa}
                aria-pressed={moxaEnabled}
              >
                {moxaEnabled ? 'Đang hơ ấm' : 'Châm điếu ngải'}
              </button>
            </div>
          )}

          {onToggleCupping && (
            <div className={`moxa-strip ${cuppingEnabled ? 'is-cupping' : ''}`}>
              <img
                src="/art/tools/bamboo-cupping.jpg"
                alt="Ống giác hơi tre cổ truyền"
                className="moxa-thumb"
              />
              <div className="moxa-strip-copy">
                <div style={{ fontWeight: 700, fontSize: '0.84rem', color: cuppingEnabled ? '#FFF3D6' : 'var(--ink-primary)' }}>
                  Úp Ống Giác Tre (Trục Phong Hàn lưng vai)
                </div>
                <div style={{ fontSize: '0.75rem', color: cuppingEnabled ? '#E5C693' : 'var(--ink-muted)' }}>
                  Hút phong hàn thấp trên các huyệt Mặt Sau (+1đ).
                </div>
              </div>
              <button
                type="button"
                className={`toggle-pill moxa-action-btn ${cuppingEnabled ? 'active' : ''}`}
                onClick={onToggleCupping}
                aria-pressed={cuppingEnabled}
              >
                {cuppingEnabled ? 'Đang giác tre' : 'Úp ống giác'}
              </button>
            </div>
          )}

          <div style={{ fontWeight: 700, marginBottom: '6px', fontSize: '0.84rem', color: '#7C1A14' }}>
            Chạm trực tiếp vào huyệt trên đồ hình lụa ({activeSide === 'front' ? 'Mặt Trước' : 'Mặt Sau'} · {visiblePoints.length} huyệt) — Đã chọn {selectedIds.length} huyệt
          </div>

          <div className="acupoint-quick-grid" role="group" aria-label="Danh sách chọn nhanh huyệt đạo">
            {visiblePoints.map((pt) => {
              const isSelected = selectedIds.includes(pt.id);
              const isDanger = isPregnant && pt.pregnancyForbidden;
              return (
                <button
                  key={pt.id}
                  type="button"
                  className={`acupoint-chip ${isSelected ? 'active' : ''} ${isDanger ? 'danger' : ''}`}
                  onClick={() => handleClickPoint(pt)}
                  aria-pressed={isSelected}
                  title={`${pt.name} (${pt.code}) — ${pt.meridian}`}
                >
                  {pt.name} <span style={{ opacity: 0.72 }}>({pt.code})</span>
                </button>
              );
            })}
          </div>

          {inspected ? (
            <div
              style={{
                padding: '10px',
                background: '#DFCCA8',
                border: '1.5px solid #5A3E28',
                borderRadius: '3px',
                fontSize: '0.85rem'
              }}
            >
              <div style={{ fontWeight: 700, fontFamily: 'var(--font-serif)', fontSize: '0.95rem' }}>
                {inspected.name} ({inspected.code}) — {inspected.meridian}
              </div>
              <p style={{ margin: '4px 0' }}>
                <strong>Vị trí:</strong> {inspected.locationGuide}
              </p>
              <p style={{ margin: '4px 0' }}>
                <strong>Thủ pháp:</strong> {inspected.techniqueNote}
              </p>
              <p style={{ margin: '4px 0' }}>
                <strong>Chủ trị:</strong> {inspected.indications.join(', ')}
              </p>
              {inspected.warningText && (
                <div className="alert-banner" style={{ margin: '6px 0 0' }}>
                  {inspected.warningText}
                </div>
              )}
            </div>
          ) : (
            <p className="muted-note">
              Chạm trực tiếp vào huyệt trên đồ hình hoặc nút tên huyệt để xem cách xác định vị trí và phối hợp trị liệu.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
