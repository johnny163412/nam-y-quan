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
          width="254"
          height="422"
          viewBox="-18 0 256 430"
          role="img"
          aria-label="Đồ hình Kinh Lạc và Huyệt Đạo cổ họa"
          style={{
            background: 'radial-gradient(circle at 50% 42%, #FAF4E4 0%, #EFE4CA 100%)',
            border: '1.5px solid #2F231A',
            borderRadius: '4px'
          }}
        >
          {/* Classical Vietnamese folk scroll figure ("Hình nhân Y thư cổ") */}
          <g filter="url(#ink-brush-soft)" strokeLinecap="round" strokeLinejoin="round">
            {/* Subtle woodblock scroll frame lines */}
            <path d="M12 10 Q110 8 208 10 M12 420 Q110 422 208 420" stroke="#9C6B24" strokeWidth="0.8" opacity="0.45" />

            {/* Topknot bun (Búi tóc củ hành buộc dải vải) */}
            <path
              d="M101 25 C100 17 105 14 110 14 C115 14 120 17 119 25 C115 27 105 27 101 25 Z"
              fill="#352820"
              stroke="#2F231A"
              strokeWidth="1.4"
            />
            <path d="M101 24 Q110 26 119 24 M119 24 Q124 27 123 31" stroke="#A62620" strokeWidth="1.3" fill="none" />

            {/* Ears */}
            <path d="M89 48 C85 48 85 57 90 58" fill="#EBD5BA" stroke="#2F231A" strokeWidth="1.3" />
            <path d="M131 48 C135 48 135 57 130 58" fill="#EBD5BA" stroke="#2F231A" strokeWidth="1.3" />

            {/* Head & Jawline */}
            <path
              d="M90 48 C89 35 97 27 110 27 C123 27 131 35 130 48 C130 62 122 73 110 74 C98 73 90 62 90 48 Z"
              fill="#EED9BF"
              stroke="#2F231A"
              strokeWidth="1.55"
            />

            {/* Hairline / Facial Features */}
            {activeSide === 'front' ? (
              <>
                <path d="M91 40 C97 31 123 31 129 40 C123 35 97 35 91 40 Z" fill="#352820" />
                <path d="M97 46 Q102 44 106 46 M114 46 Q118 44 123 46" stroke="#2F231A" strokeWidth="1.1" />
                <path d="M98 51 Q102 50 105 51 M115 51 Q118 50 122 51" stroke="#2F231A" strokeWidth="1.35" />
                <path d="M110 51 C110 56 109 58 111 59" stroke="#5A4B3C" strokeWidth="1" />
                <path d="M105 64 Q110 66 115 64" stroke="#8B493B" strokeWidth="1.15" />
              </>
            ) : (
              <>
                {/* Back of head hair & nape hairline */}
                <path
                  d="M90 48 C89 34 97 27 110 27 C123 27 131 34 130 48 C129 58 124 67 118 71 C113 68 107 68 102 71 C96 67 91 58 90 48 Z"
                  fill="#352820"
                  fillOpacity="0.88"
                  stroke="#2F231A"
                  strokeWidth="1.4"
                />
                <path d="M102 71 L103 77 M118 71 L117 77" stroke="#5A4B3C" strokeWidth="0.9" />
              </>
            )}

            {/* Organic Body Silhouette: Neck, Curved Shoulders, Arms, Hands, Torso, Legs & Feet */}
            <path
              d="M101 73 C101 81 100 85 95 88
                 C84 91 71 95 64 104
                 C56 118 51 142 45 162
                 C40 179 37 196 34 210
                 C29 216 26 226 28 235
                 C30 238 33 238 34 233
                 C35 239 39 240 40 234
                 C42 238 45 236 45 229
                 C46 218 46 213 48 206
                 C53 190 58 168 65 148
                 C69 136 73 125 76 121
                 C76 144 77 166 80 186
                 C81 200 79 218 76 238
                 C74 260 76 284 80 308
                 C82 332 82 362 81 388
                 C79 397 72 406 72 411
                 C74 415 84 415 92 412
                 C96 409 96 398 95 388
                 C97 360 100 330 102 304
                 C104 282 106 266 110 262
                 C114 266 116 282 118 304
                 C120 330 123 360 125 388
                 C124 398 124 409 128 412
                 C136 415 146 415 148 411
                 C148 406 141 397 139 388
                 C138 362 138 332 140 308
                 C144 284 146 260 144 238
                 C141 218 139 200 140 186
                 C143 166 144 144 144 121
                 C147 125 151 136 155 148
                 C162 168 167 190 172 206
                 C174 213 174 218 175 229
                 C175 236 178 238 180 234
                 C181 240 185 239 186 233
                 C187 238 190 238 192 235
                 C194 226 191 216 186 210
                 C183 196 180 179 175 162
                 C169 142 164 118 156 104
                 C149 95 136 91 125 88
                 C120 85 119 81 119 73"
              fill="#EAD3B7"
              stroke="#2F231A"
              strokeWidth="1.55"
            />

            {/* Traditional Cloth Waist Wrap ("Khố lụa thắt đai vải" — classical folk chart garment) */}
            <path
              d="M77 228 Q110 235 143 228 L145 259 Q127 265 113 262 L110 274 L107 262 Q93 265 75 259 Z"
              fill="#6C7C6B"
              fillOpacity="0.62"
              stroke="#2F231A"
              strokeWidth="1.4"
            />
            <path
              d="M77 232 Q110 239 143 232 M108 234 C104 248 103 260 100 269 M112 234 C115 247 117 258 119 266"
              stroke="#2F231A"
              strokeWidth="1.15"
              fill="none"
            />

            {/* Subtle anatomical brush lines */}
            {activeSide === 'front' ? (
              <g stroke="#8E6C4E" strokeWidth="1" fill="none" opacity="0.72">
                <path d="M84 103 Q98 108 107 104 M136 103 Q122 108 113 104" />
                <path d="M84 134 Q96 141 106 135 M136 134 Q124 141 114 135" />
                <circle cx="110" cy="195" r="2" fill="#8E6C4E" />
                <path d="M86 303 Q91 307 96 303 M124 303 Q129 307 134 303" />
              </g>
            ) : (
              <g stroke="#8E6C4E" strokeWidth="1" fill="none" opacity="0.72">
                <path d="M110 86 C109 132 111 182 110 225" strokeDasharray="3 3" />
                <path d="M83 116 C88 134 94 144 98 148 M137 116 C132 134 126 144 122 148" />
                <path d="M84 305 Q90 303 95 305 M125 305 Q130 303 136 305" />
              </g>
            )}

            {/* Flowing Meridian Pathways */}
            {activeSide === 'front' ? (
              <g stroke="#23574C" strokeWidth="1.15" strokeDasharray="4 3" fill="none" opacity="0.72">
                <path d="M110 49 C110 96 110 165 110 225" />
                <path d="M88 118 C82 180 80 250 84 318 C85 352 84 378 84 402" />
                <path d="M132 118 C134 185 130 280 122 374" />
                <path d="M72 106 C58 142 49 175 44 198 C40 212 36 220 33 226" />
                <path d="M148 106 C162 142 172 174 177 196 L181 212" />
              </g>
            ) : (
              <g stroke="#274B6D" strokeWidth="1.15" strokeDasharray="4 3" fill="none" opacity="0.72">
                <path d="M110 32 C110 92 110 164 110 228" />
                <path d="M96 73 C94 118 93 158 93 196 C92 252 90 300 90 340" />
                <path d="M68 106 C54 142 46 172 42 194" />
              </g>
            )}
          </g>

          {/* Acupoint Nodes & Crisp Unfiltered Labels */}
          {visiblePoints.map((pt) => {
            const isSelected = selectedIds.includes(pt.id);
            const isDanger = isPregnant && pt.pregnancyForbidden;

            let labelX = pt.x < 110 ? pt.x - 10 : pt.x + 10;
            let labelY = pt.y + 3;
            let anchor: 'start' | 'middle' | 'end' = pt.x < 110 ? 'end' : 'start';

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

            if (pt.id === 'thai-xung') {
              labelY = pt.y + 4;
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
                  r={isSelected ? 10 : 7.5}
                  fill={
                    isSelected
                      ? isDanger
                        ? '#A62620'
                        : '#23574C'
                      : '#FFF8ED'
                  }
                  stroke={isDanger && !hideDetails ? '#A62620' : '#2F231A'}
                  strokeWidth={isSelected ? 2 : 1.4}
                />
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={2.8}
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
                    strokeWidth="2.4"
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
