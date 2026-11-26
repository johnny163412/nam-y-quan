import React, { useState } from 'react';
import { TongueProfile, TongueZoneDetail } from '../../types/tcm';

interface TongueMirrorProps {
  tongue: TongueProfile;
  onInspectZone?: (zone: TongueZoneDetail) => void;
  compact?: boolean;
  hideSummary?: boolean;
}

const BODY_COLOR_HEX: Record<TongueProfile['bodyColor'], string> = {
  pale: '#E4C2BE',
  pink: '#D88D8C',
  red: '#C45353',
  crimson: '#8E2027',
  purplish: '#9C6278'
};

const COAT_COLOR_HEX: Record<TongueProfile['coatColor'], string> = {
  'thin-white': 'rgba(248, 246, 238, 0.55)',
  'thick-white': 'rgba(245, 241, 228, 0.88)',
  'yellow-dry': 'rgba(214, 184, 96, 0.72)',
  'yellow-greasy': 'rgba(196, 168, 72, 0.86)',
  peeled: 'rgba(255, 255, 255, 0.08)'
};

export const TongueMirror: React.FC<TongueMirrorProps> = ({ tongue, onInspectZone, compact = false, hideSummary = false }) => {
  const [activeZone, setActiveZone] = useState<TongueZoneDetail>(tongue.zones[0]);

  const handleSelect = (zoneKey: TongueZoneDetail['zone']) => {
    const found = tongue.zones.find((z) => z.zone === zoneKey) ?? tongue.zones[0];
    setActiveZone(found);
    onInspectZone?.(found);
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
      <svg
        width={compact ? 140 : 172}
        height={compact ? 168 : 206}
        viewBox="0 0 180 216"
        role="img"
        aria-label="Gương soi Thiệt chẩn 5 vùng Tạng Phủ"
        style={{ flexShrink: 0 }}
      >
        {/* Dark mouth cavity & organic hand-drawn tongue layer */}
        <g filter="url(#ink-brush-soft)" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M16 106 C15 48 48 12 90 13 C133 12 165 48 164 108 C165 166 132 203 90 203 C47 203 15 165 16 106 Z"
            fill="#2B1B18"
            stroke="#2F231A"
            strokeWidth="2.1"
          />

          {/* Tongue base */}
          <path
            d={
              tongue.bodyShape === 'swollen-teeth'
                ? 'M36 46 Q90 22 144 46 Q152 84 143 102 Q151 120 140 138 Q144 156 126 174 Q90 198 54 174 Q36 156 40 138 Q29 120 37 102 Q28 84 36 46 Z'
                : tongue.bodyShape === 'thin'
                ? 'M50 48 Q90 28 130 48 Q138 118 124 166 Q90 192 56 166 Q42 118 50 48 Z'
                : 'M40 46 Q90 24 140 46 Q150 116 132 168 Q90 196 48 168 Q30 116 40 46 Z'
            }
            fill={BODY_COLOR_HEX[tongue.bodyColor]}
            stroke="#2F231A"
            strokeWidth="1.9"
          />

          {/* Tongue coat watercolor wash */}
          <path
            d={
              tongue.bodyShape === 'thin'
                ? 'M62 56 C88 45 104 47 118 57 C126 98 120 140 107 158 C90 172 72 168 62 155 C54 132 54 90 62 56 Z'
                : 'M53 54 C84 42 108 43 127 56 C137 96 131 142 114 160 C92 174 68 171 55 156 C44 134 45 86 53 54 Z'
            }
            fill={COAT_COLOR_HEX[tongue.coatColor]}
          />

          {/* Moisture sheen */}
          {tongue.moisture === 'wet-slippery' && (
            <path
              d="M70 76 C66 94 67 112 73 123 C79 116 78 92 74 75 Z"
              fill="rgba(255,255,255,0.34)"
            />
          )}
        </g>

        {/* Interactive Zone Hotspots */}
        <g
          onClick={() => handleSelect('root')}
          style={{ cursor: 'pointer' }}
        >
          <path
            d="M57 57 C66 40 114 40 123 57 C115 73 65 73 57 57 Z"
            fill={activeZone.zone === 'root' ? 'rgba(166, 38, 32, 0.22)' : 'transparent'}
            stroke="#2F231A"
            strokeDasharray="3 3"
            strokeWidth={activeZone.zone === 'root' ? 1.8 : 0.9}
          />
          <text x="90" y="60" textAnchor="middle" fontSize="11" fontWeight="700" fill="#221B15">
            Gốc (Thận)
          </text>
        </g>

        <g onClick={() => handleSelect('center')} style={{ cursor: 'pointer' }}>
          <path
            d="M66 108 C66 84 114 84 114 108 C114 132 66 132 66 108 Z"
            fill={activeZone.zone === 'center' ? 'rgba(166, 38, 32, 0.22)' : 'transparent'}
            stroke="#2F231A"
            strokeDasharray="3 3"
            strokeWidth={activeZone.zone === 'center' ? 1.8 : 0.9}
          />
          <text x="90" y="105" textAnchor="middle" fontSize="10" fontWeight="700" fill="#221B15">
            Giữa
          </text>
          <text x="90" y="117" textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#221B15">
            (Tỳ Vị)
          </text>
        </g>

        <g onClick={() => handleSelect('sides')} style={{ cursor: 'pointer' }}>
          <path
            d="M42 78 C34 94 35 126 45 140 C56 136 58 92 50 79 Z"
            fill={activeZone.zone === 'sides' ? 'rgba(166, 38, 32, 0.25)' : 'transparent'}
            stroke="#2F231A"
            strokeDasharray="2 2"
            strokeWidth={activeZone.zone === 'sides' ? 1.8 : 0.8}
          />
          <path
            d="M138 78 C146 94 145 126 135 140 C124 136 122 92 130 79 Z"
            fill={activeZone.zone === 'sides' ? 'rgba(166, 38, 32, 0.25)' : 'transparent'}
            stroke="#2F231A"
            strokeDasharray="2 2"
            strokeWidth={activeZone.zone === 'sides' ? 1.8 : 0.8}
          />
          <text x="45" y="112" textAnchor="middle" fontSize="9" fontWeight="700" fill="#221B15">
            Can
          </text>
          <text x="135" y="112" textAnchor="middle" fontSize="9" fontWeight="700" fill="#221B15">
            Đởm
          </text>
        </g>

        <g onClick={() => handleSelect('tip')} style={{ cursor: 'pointer' }}>
          <path
            d="M62 158 C70 142 110 142 118 158 C108 178 72 178 62 158 Z"
            fill={activeZone.zone === 'tip' ? 'rgba(166, 38, 32, 0.25)' : 'transparent'}
            stroke="#2F231A"
            strokeDasharray="3 3"
            strokeWidth={activeZone.zone === 'tip' ? 1.8 : 0.9}
          />
          <text x="90" y="163" textAnchor="middle" fontSize="11" fontWeight="700" fill="#221B15">
            Đầu (Tâm Phế)
          </text>
        </g>
      </svg>

      {!hideSummary && (
        <div style={{ flex: 1, minWidth: 185 }}>
          <p style={{ margin: '0 0 8px', fontSize: '0.88rem' }}>{tongue.summary}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
            {tongue.zones.map((z) => (
              <button
                key={z.zone}
                type="button"
                className={`toggle-pill ${activeZone.zone === z.zone ? 'active' : ''}`}
                style={{ flex: 'none', fontSize: '0.78rem', padding: '4px 8px' }}
                onClick={() => handleSelect(z.zone)}
              >
                {z.label.split(' ')[0]} {z.label.split(' ')[1] ?? ''}
              </button>
            ))}
          </div>
          <div
            style={{
              padding: '8px 10px',
              background: '#EFE6D2',
              border: '1px solid rgba(42,33,27,0.35)',
              borderRadius: '2px',
              fontSize: '0.85rem'
            }}
          >
            <strong>{activeZone.label}:</strong> {activeZone.finding}
            <div style={{ color: '#23574C', fontWeight: 600, marginTop: '3px' }}>
              Luận đoán: {activeZone.clueTag}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
