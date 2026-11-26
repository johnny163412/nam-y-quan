import React, { useState } from 'react';
import { ACUPOINTS } from '../data/acupoints';
import { Acupoint } from '../types/tcm';

interface MeridianBodyMapProps {
  selectedIds: string[];
  onToggleAcupoint: (id: string) => void;
  candidateIds?: string[];
  forcedSide?: 'front' | 'back';
  isPregnant?: boolean;
  hideDetails?: boolean;
}

export const MeridianBodyMap: React.FC<MeridianBodyMapProps> = ({
  selectedIds,
  onToggleAcupoint,
  candidateIds,
  forcedSide,
  isPregnant = false,
  hideDetails = false
}) => {
  const [side, setSide] = useState<'front' | 'back'>(forcedSide ?? 'front');
  const [inspected, setInspected] = useState<Acupoint | null>(null);

  const activeSide = forcedSide ?? side;
  const visiblePoints = ACUPOINTS.filter((p) => {
    if (p.bodySide !== activeSide) return false;
    if (candidateIds && !candidateIds.includes(p.id)) return false;
    return true;
  });

  const handleClickPoint = (pt: Acupoint) => {
    setInspected(pt);
    onToggleAcupoint(pt.id);
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
            background: 'radial-gradient(circle at 50% 42%, #FAF4E4 0%, #EFE4CA 100%)',
            border: '1.5px solid #2F231A',
            borderRadius: '4px',
            boxShadow: 'inset 0 0 18px rgba(90, 75, 60, 0.14)'
          }}
        >
          {/* Woodblock scroll top & bottom accent lines */}
          <path d="M-8 10 Q125 7 258 10 M-8 434 Q125 437 258 434" stroke="#9C6B24" strokeWidth="0.9" opacity="0.45" fill="none" />

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
              {/* Delicate flowing meridian pathways */}
              <g stroke="#23574C" strokeWidth="1.1" strokeDasharray="4 3" fill="none" opacity="0.58">
                <path d="M125 68 C125 112 125 168 125 220" />
                <path d="M102 124 C95 190 94 265 93 333 C92 368 92 392 91 411" />
                <path d="M148 124 C150 198 148 290 142 377" />
                <path d="M84 114 C70 152 60 188 55 226 C51 236 48 240 46 244" />
                <path d="M166 114 C178 152 186 188 190 218 L195 233" />
              </g>
            </>
          ) : (
            /* Hand-drawn brush-ink back figure calibrated to the exact 250x444 scroll proportions */
            <g filter="url(#ink-brush-soft)" strokeLinecap="round" strokeLinejoin="round">
              {/* Topknot bun & nape hair */}
              <path
                d="M116 34 C115 26 120 22 125 22 C130 22 135 26 134 34 C130 36 120 36 116 34 Z"
                fill="#352820"
                stroke="#2F231A"
                strokeWidth="1.4"
              />
              <path d="M116 33 Q125 35 134 33 M134 33 Q139 36 138 40" stroke="#A62620" strokeWidth="1.3" fill="none" />
              <path d="M104 57 C100 57 100 66 105 67" fill="#EBD5BA" stroke="#2F231A" strokeWidth="1.3" />
              <path d="M146 57 C150 57 150 66 145 67" fill="#EBD5BA" stroke="#2F231A" strokeWidth="1.3" />
              <path
                d="M105 57 C104 43 112 36 125 36 C138 36 146 43 145 57 C144 68 139 77 133 81 C128 78 122 78 117 81 C111 77 106 68 105 57 Z"
                fill="#352820"
                fillOpacity="0.9"
                stroke="#2F231A"
                strokeWidth="1.5"
              />

              {/* Organic Body Back Silhouette */}
              <path
                d="M116 82 C116 90 114 95 109 98
                   C96 102 82 107 75 117
                   C67 132 62 156 57 178
                   C52 195 48 212 45 227
                   C40 233 37 243 39 252
                   C41 255 44 255 45 250
                   C46 256 50 257 51 251
                   C53 255 56 253 56 246
                   C57 235 58 228 60 221
                   C65 204 71 182 78 161
                   C82 148 86 137 89 133
                   C89 156 90 178 93 198
                   C94 212 92 228 89 248
                   C87 270 89 294 93 318
                   C95 342 95 372 94 398
                   C92 407 85 416 85 421
                   C87 425 97 425 105 422
                   C109 419 109 408 108 398
                   C110 370 113 340 115 314
                   C117 292 120 274 125 270
                   C130 274 133 292 135 314
                   C137 340 140 370 142 398
                   C141 408 141 419 145 422
                   C153 425 163 425 165 421
                   C165 416 158 407 156 398
                   C155 372 155 342 157 318
                   C161 294 163 270 161 248
                   C158 228 156 212 157 198
                   C160 178 161 156 161 133
                   C164 137 168 148 172 161
                   C179 182 185 204 190 221
                   C192 228 193 235 194 246
                   C194 253 197 255 199 251
                   C200 257 204 256 205 250
                   C206 255 209 255 211 252
                   C213 243 210 233 205 227
                   C202 212 198 195 193 178
                   C188 156 183 132 175 117
                   C168 107 154 102 141 98
                   C136 95 134 90 134 82"
                fill="#E4C6A3"
                stroke="#2F231A"
                strokeWidth="1.55"
              />

              {/* Cloth Waist Wrap (Back view) */}
              <path
                d="M90 238 Q125 244 160 238 L162 269 Q142 275 125 272 Q108 275 88 269 Z"
                fill="#6C7C6B"
                fillOpacity="0.65"
                stroke="#2F231A"
                strokeWidth="1.4"
              />
              <path d="M90 242 Q125 248 160 242" stroke="#2F231A" strokeWidth="1.1" fill="none" />

              {/* Dorsal spine & scapula ink lines */}
              <g stroke="#8E6C4E" strokeWidth="1.1" fill="none" opacity="0.72">
                <path d="M125 94 C124 142 126 190 125 234" />
                <path d="M97 125 C102 144 108 154 113 158 M153 125 C148 144 142 154 137 158" />
                <path d="M97 316 Q103 314 109 316 M141 316 Q147 314 153 316" />
              </g>

              {/* Back meridian pathways */}
              <g stroke="#274B6D" strokeWidth="1.15" strokeDasharray="4 3" fill="none" opacity="0.7">
                <path d="M125 42 C125 102 125 174 125 236" />
                <path d="M111 84 C109 124 108 162 108 196 C107 254 105 304 105 352" />
                <path d="M82 118 C69 154 61 186 56 214" />
              </g>
            </g>
          )}

          {/* Acupoint Nodes & Crisp Unfiltered Labels */}
          {visiblePoints.map((pt) => {
            const isSelected = selectedIds.includes(pt.id);
            const isDanger = isPregnant && pt.pregnancyForbidden;

            let labelX = pt.x < 125 ? pt.x - 10 : pt.x + 10;
            const labelY = pt.y + 3;
            let anchor: 'start' | 'middle' | 'end' = pt.x < 125 ? 'end' : 'start';

            if (
              pt.id === 'an-duong' ||
              pt.id === 'bach-hoi' ||
              pt.id === 'trung-quan' ||
              pt.id === 'khi-hai' ||
              pt.id === 'than-du' ||
              pt.id === 'tam-am-giao' ||
              pt.id === 'noi-quan' ||
              pt.id === 'than-mon'
            ) {
              labelX = pt.x + 10;
              anchor = 'start';
            } else if (
              pt.id === 'hop-coc' ||
              pt.id === 'liet-khuyet' ||
              pt.id === 'ngoai-quan' ||
              pt.id === 'phong-tri' ||
              pt.id === 'tuc-tam-ly' ||
              pt.id === 'thai-xung'
            ) {
              labelX = pt.x - 10;
              anchor = 'end';
            }

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
                        : '#23574C'
                      : 'rgba(255, 248, 237, 0.92)'
                  }
                  stroke={isDanger && !hideDetails ? '#A62620' : '#2F231A'}
                  strokeWidth={isSelected ? 2 : 1.35}
                />
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
          <div style={{ fontWeight: 700, marginBottom: '6px', fontSize: '0.9rem' }}>
            Danh sách huyệt ({activeSide === 'front' ? 'Mặt Trước' : 'Mặt Sau'})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
            {visiblePoints.map((pt) => {
              const active = selectedIds.includes(pt.id);
              return (
                <button
                  key={pt.id}
                  type="button"
                  className={`toggle-pill ${active ? 'active' : ''}`}
                  style={{
                    flex: 'none',
                    fontSize: '0.8rem',
                    padding: '4px 9px',
                    background: active ? '#23574C' : undefined,
                    borderColor: active ? '#23574C' : undefined
                  }}
                  onClick={() => handleClickPoint(pt)}
                >
                  {pt.name} ({pt.code})
                </button>
              );
            })}
          </div>

          {inspected ? (
            <div
              style={{
                padding: '10px',
                background: '#EFE6D2',
                border: '1px solid rgba(42,33,27,0.35)',
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
