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
}

export const MeridianBodyMap: React.FC<MeridianBodyMapProps> = ({
  selectedIds,
  onToggleAcupoint,
  candidateIds,
  forcedSide,
  isPregnant = false,
  hideDetails = false,
  moxaEnabled = false,
  onToggleMoxa
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
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
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
            background: 'radial-gradient(circle at 50% 42%, #E5D4B3 0%, #D4BE96 100%)',
            border: '2px solid #5A3E28',
            borderRadius: '4px',
            boxShadow: 'inset 0 0 18px rgba(70, 44, 18, 0.18)'
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
                <path d="M125 42 C125 76 125 148 125 236" />
                <path d="M111 84 L109 124 L109 144 L109 164 L109 180 L108 196 C106 254 104 300 101 352" />
                <path d="M139 84 C142 130 143 185 145 232 C148 272 150 296 151 316 L151 362" />
                <path d="M125 98 Q140 101 154 105" />
                <path d="M82 118 C69 154 61 186 56 214" />
              </g>
              {selectedIds.length > 0 && !hideDetails && (
                <g
                  className="meridian-qi-stream"
                  stroke={moxaEnabled ? '#E8833A' : '#58D3AF'}
                  strokeWidth="1.9"
                  fill="none"
                  opacity="0.88"
                >
                  <path d="M125 42 C125 76 125 148 125 236" />
                  <path d="M111 84 L109 124 L109 144 L109 164 L109 180 L108 196 C106 254 104 300 101 352" />
                  <path d="M139 84 C142 130 143 185 145 232 C148 272 150 296 151 316 L151 362" />
                  <path d="M125 98 Q140 101 154 105" />
                  <path d="M82 118 C69 154 61 186 56 214" />
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
                    <circle cx={pt.x} cy={pt.y} r="14" fill="rgba(235, 118, 38, 0.28)" />
                    <path
                      d={`M ${pt.x - 2} ${pt.y - 7} Q ${pt.x - 7} ${pt.y - 16} ${pt.x} ${pt.y - 25} Q ${pt.x + 6} ${pt.y - 31} ${pt.x + 1} ${pt.y - 37}`}
                      stroke="rgba(255, 244, 224, 0.85)"
                      strokeWidth="1.6"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </g>
                )}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={2.6}
                  fill={isSelected ? '#FFF8ED' : '#A62620'}
                />
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
        <div style={{ flex: 1, minWidth: 210 }}>
          {onToggleMoxa && (
            <div className={`moxa-strip ${moxaEnabled ? 'is-burning' : ''}`}>
              <img
                src="/art/tools/moxa-stick.jpg"
                alt="Điếu ngải cứu đang cháy âm ỉ tỏa khói thơm"
                className="moxa-thumb"
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.84rem', color: moxaEnabled ? '#FFF3D6' : 'var(--ink-primary)' }}>
                  Hơ Điếu Ngải Cứu (Cứu ấm huyệt)
                </div>
                <div style={{ fontSize: '0.75rem', color: moxaEnabled ? '#E5C693' : 'var(--ink-muted)' }}>
                  Bật khi chứng thiên Hàn / đau buốt lưng gối để dẫn dương khí thấm sâu (+2đ thưởng).
                </div>
              </div>
              <button
                type="button"
                className={`toggle-pill ${moxaEnabled ? 'active' : ''}`}
                style={{ flex: 'none', padding: '5px 10px' }}
                onClick={onToggleMoxa}
                aria-pressed={moxaEnabled}
              >
                {moxaEnabled ? 'Đang hơ ấm' : 'Châm điếu ngải'}
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
