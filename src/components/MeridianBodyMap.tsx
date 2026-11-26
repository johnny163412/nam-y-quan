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
          width="210"
          height="395"
          viewBox="0 0 200 420"
          role="img"
          aria-label="Đồ hình Kinh Lạc và Huyệt Đạo"
          style={{
            background: '#F7F1E3',
            border: '1.5px solid #2A211B',
            borderRadius: '2px'
          }}
        >
          {/* Woodblock anatomical silhouette */}
          <g stroke="#3A2D22" strokeWidth="1.5" fill="#E8D9BC" fillOpacity="0.65">
            <circle cx="100" cy="44" r="21" />
            <path d="M90 65 L90 78 L60 92 L36 185 L28 232 L40 236 L54 188 L72 118 L72 214 L68 320 L66 402 L84 402 L94 252 L106 252 L116 402 L134 402 L132 320 L128 214 L128 118 L146 188 L160 236 L172 232 L164 185 L140 92 L110 78 L110 65 Z" />
          </g>

          {/* Stylized meridian lines */}
          {activeSide === 'front' ? (
            <g stroke="#23574C" strokeWidth="1.1" strokeDasharray="3 3" fill="none" opacity="0.65">
              <path d="M100 72 V240" />
              <path d="M76 115 L78 312 L76 398" />
              <path d="M124 115 L120 374" />
              <path d="M64 102 L42 204 L34 230" />
              <path d="M136 102 L158 196 L162 215" />
            </g>
          ) : (
            <g stroke="#274B6D" strokeWidth="1.1" strokeDasharray="3 3" fill="none" opacity="0.65">
              <path d="M100 26 V240" />
              <path d="M86 66 L84 196 L84 320" />
              <path d="M60 102 L38 196" />
            </g>
          )}

          {/* Acupoint Nodes */}
          {visiblePoints.map((pt) => {
            const isSelected = selectedIds.includes(pt.id);
            const isDanger = isPregnant && pt.pregnancyForbidden;
            return (
              <g
                key={pt.id}
                onClick={() => handleClickPoint(pt)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? 11 : 8}
                  fill={
                    isSelected
                      ? isDanger
                        ? '#A62620'
                        : '#23574C'
                      : '#FFF8ED'
                  }
                  stroke={isDanger && !hideDetails ? '#A62620' : '#221B15'}
                  strokeWidth={isSelected ? 2.2 : 1.5}
                />
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={3}
                  fill={isSelected ? '#FFF8ED' : '#A62620'}
                />
                {!hideDetails && (
                  <text
                    x={pt.x === 100 ? pt.x : pt.x < 100 ? pt.x - 10 : pt.x + 10}
                    y={pt.y === 398 ? pt.y - 12 : pt.x === 100 ? pt.y - 11 : pt.y + 4}
                    textAnchor={pt.x === 100 ? 'middle' : pt.x < 100 ? 'end' : 'start'}
                    fontSize="9"
                    fontWeight="700"
                    fill="#221B15"
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
                borderRadius: '2px',
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
