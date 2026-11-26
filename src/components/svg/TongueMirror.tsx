import React, { useState } from 'react';
import { TongueProfile, TongueZoneDetail } from '../../types/tcm';

interface TongueMirrorProps {
  tongue: TongueProfile;
  onInspectZone?: (zone: TongueZoneDetail) => void;
  compact?: boolean;
  hideSummary?: boolean;
  blindLabels?: boolean;
}

const BODY_COLOR_HEX: Record<TongueProfile['bodyColor'], string> = {
  pale: '#E4C2BE',
  pink: '#D88D8C',
  red: '#C45353',
  crimson: '#8E2027',
  purplish: '#9C6278'
};

const BODY_DARK_HEX: Record<TongueProfile['bodyColor'], string> = {
  pale: '#B58985',
  pink: '#A25B5A',
  red: '#8F3131',
  crimson: '#5D1016',
  purplish: '#663B4B'
};

const COAT_COLOR_HEX: Record<TongueProfile['coatColor'], string> = {
  'thin-white': 'rgba(248, 246, 238, 0.55)',
  'thick-white': 'rgba(245, 241, 228, 0.88)',
  'yellow-dry': 'rgba(214, 184, 96, 0.72)',
  'yellow-greasy': 'rgba(196, 168, 72, 0.86)',
  peeled: 'rgba(255, 255, 255, 0.08)'
};

export const TongueMirror: React.FC<TongueMirrorProps> = ({
  tongue,
  onInspectZone,
  compact = false,
  hideSummary = false,
  blindLabels = false
}) => {
  const [activeZone, setActiveZone] = useState<TongueZoneDetail>(tongue.zones[0]);

  const handleSelect = (zoneKey: TongueZoneDetail['zone']) => {
    const found = tongue.zones.find((z) => z.zone === zoneKey) ?? tongue.zones[0];
    setActiveZone(found);
    onInspectZone?.(found);
  };

  const showHeatDots = tongue.bodyColor === 'red' || tongue.bodyColor === 'crimson';

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
      <svg
        width={compact ? 156 : 194}
        height={compact ? 184 : 228}
        viewBox="0 0 210 248"
        role="img"
        aria-label="Gương đồng Bát Hoa soi Thiệt chẩn 5 vùng Tạng Phủ"
        style={{ flexShrink: 0, filter: 'drop-shadow(0 6px 12px rgba(28, 16, 8, 0.34))' }}
      >
        <defs>
          <linearGradient id="bronze-rim-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DEB45F" />
            <stop offset="28%" stopColor="#8E5F24" />
            <stop offset="56%" stopColor="#CFA04E" />
            <stop offset="84%" stopColor="#5D3C16" />
            <stop offset="100%" stopColor="#3B240C" />
          </linearGradient>
          <radialGradient id="oral-cavity-grad" cx="50%" cy="46%" r="54%">
            <stop offset="0%" stopColor="#4A2721" />
            <stop offset="72%" stopColor="#261310" />
            <stop offset="100%" stopColor="#160B09" />
          </radialGradient>
          <radialGradient id="tongue-depth-grad" cx="50%" cy="42%" r="60%">
            <stop offset="0%" stopColor={BODY_COLOR_HEX[tongue.bodyColor]} />
            <stop offset="82%" stopColor={BODY_COLOR_HEX[tongue.bodyColor]} />
            <stop offset="100%" stopColor={BODY_DARK_HEX[tongue.bodyColor]} />
          </radialGradient>
        </defs>

        {/* Carved bronze suspension ring at crown */}
        <circle cx="105" cy="14" r="9" fill="none" stroke="url(#bronze-rim-grad)" strokeWidth="4.2" />
        <circle cx="105" cy="14" r="5" fill="none" stroke="#36220D" strokeWidth="1" />

        {/* Carved handle tang at bottom */}
        <path
          d="M93 222 L117 222 L114 242 Q105 246 96 242 Z"
          fill="url(#bronze-rim-grad)"
          stroke="#2E1B0A"
          strokeWidth="1.6"
        />
        <line x1="96" y1="229" x2="114" y2="229" stroke="#36220D" strokeWidth="1.2" />
        <line x1="97" y1="236" x2="113" y2="236" stroke="#36220D" strokeWidth="1.2" />

        {/* Ornate Eight-Lobe Antique Bronze Mirror Bezel (Gương Đồng Bát Hoa) */}
        <path
          d="M105 21
             Q130 19 144 33 Q169 32 178 55 Q197 70 193 96
             Q206 121 193 146 Q197 172 178 187 Q169 210 144 209
             Q130 223 105 221 Q80 223 66 209 Q41 210 32 187
             Q13 172 17 146 Q4 121 17 96 Q13 70 32 55
             Q41 32 66 33 Q80 19 105 21 Z"
          fill="url(#bronze-rim-grad)"
          stroke="#2A1909"
          strokeWidth="2.2"
        />
        {/* Inner engraved bronze beading ring */}
        <ellipse
          cx="105"
          cy="121"
          rx="81"
          ry="91"
          fill="none"
          stroke="#E7C278"
          strokeWidth="1.3"
          strokeDasharray="3 3"
          opacity="0.72"
        />

        {/* Shaded lips & dark oral cavity inside bronze mirror */}
        <g transform="translate(15, 13)" filter="url(#ink-brush-soft)" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M14 108 C13 48 47 11 90 12 C133 11 167 48 166 108 C167 167 132 204 90 204 C47 204 13 167 14 108 Z"
            fill="url(#oral-cavity-grad)"
            stroke="#2E1B0A"
            strokeWidth="2.2"
          />
          {/* Subtle upper lip arch */}
          <path
            d="M32 50 Q62 24 90 30 Q118 24 148 50 Q120 38 90 42 Q60 38 32 50 Z"
            fill="#8D4C48"
            fillOpacity="0.65"
          />

          {/* Tongue base with shaded depth */}
          <path
            d={
              tongue.bodyShape === 'swollen-teeth'
                ? 'M36 46 Q90 22 144 46 Q152 84 143 102 Q151 120 140 138 Q144 156 126 174 Q90 198 54 174 Q36 156 40 138 Q29 120 37 102 Q28 84 36 46 Z'
                : tongue.bodyShape === 'thin'
                ? 'M50 48 Q90 28 130 48 Q138 118 124 166 Q90 192 56 166 Q42 118 50 48 Z'
                : 'M40 46 Q90 24 140 46 Q150 116 132 168 Q90 196 48 168 Q30 116 40 46 Z'
            }
            fill="url(#tongue-depth-grad)"
            stroke="#2F231A"
            strokeWidth="2.0"
          />

          {/* Median lingual sulcus crease */}
          <path
            d="M90 50 C88 86 91 124 90 156"
            stroke="#5D1B1A"
            strokeOpacity="0.32"
            strokeWidth="1.5"
            fill="none"
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

          {/* Crimson heat papillae (chấm đỏ điểm nhiệt) when red/crimson */}
          {showHeatDots && (
            <g fill="#7A1118" fillOpacity="0.72">
              <circle cx="78" cy="154" r="1.4" />
              <circle cx="96" cy="160" r="1.5" />
              <circle cx="105" cy="150" r="1.3" />
              <circle cx="86" cy="166" r="1.3" />
              <circle cx="48" cy="118" r="1.3" />
              <circle cx="132" cy="116" r="1.3" />
            </g>
          )}

          {/* Moisture sheen */}
          {tongue.moisture === 'wet-slippery' && (
            <path
              d="M70 76 C66 94 67 112 73 123 C79 116 78 92 74 75 Z"
              fill="rgba(255,255,255,0.38)"
            />
          )}
        </g>

        {/* Interactive Zone Hotspots & High-Contrast Labels */}
        <g transform="translate(15, 13)">
          <g onClick={() => handleSelect('root')} style={{ cursor: 'pointer' }}>
            <path
              d="M57 57 C66 40 114 40 123 57 C115 73 65 73 57 57 Z"
              fill={activeZone.zone === 'root' ? 'rgba(166, 38, 32, 0.24)' : 'transparent'}
              stroke="#2F231A"
              strokeDasharray="3 3"
              strokeWidth={activeZone.zone === 'root' ? 1.8 : 0.9}
            />
            <text
              x="90"
              y="60"
              textAnchor="middle"
              fontSize="10.5"
              fontWeight="700"
              fill="#22170F"
              stroke="#FAF4E4"
              strokeWidth="2.8"
              paintOrder="stroke"
            >
              {blindLabels ? 'Vùng Gốc' : 'Gốc (Thận)'}
            </text>
          </g>

          <g onClick={() => handleSelect('center')} style={{ cursor: 'pointer' }}>
            <path
              d="M66 108 C66 84 114 84 114 108 C114 132 66 132 66 108 Z"
              fill={activeZone.zone === 'center' ? 'rgba(166, 38, 32, 0.24)' : 'transparent'}
              stroke="#2F231A"
              strokeDasharray="3 3"
              strokeWidth={activeZone.zone === 'center' ? 1.8 : 0.9}
            />
            <text
              x="90"
              y="105"
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fill="#22170F"
              stroke="#FAF4E4"
              strokeWidth="2.8"
              paintOrder="stroke"
            >
              {blindLabels ? 'Vùng' : 'Giữa'}
            </text>
            <text
              x="90"
              y="117"
              textAnchor="middle"
              fontSize="9.5"
              fontWeight="700"
              fill="#22170F"
              stroke="#FAF4E4"
              strokeWidth="2.8"
              paintOrder="stroke"
            >
              {blindLabels ? 'Giữa' : '(Tỳ Vị)'}
            </text>
          </g>

          <g onClick={() => handleSelect('sides')} style={{ cursor: 'pointer' }}>
            <path
              d="M42 78 C34 94 35 126 45 140 C56 136 58 92 50 79 Z"
              fill={activeZone.zone === 'sides' ? 'rgba(166, 38, 32, 0.26)' : 'transparent'}
              stroke="#2F231A"
              strokeDasharray="2 2"
              strokeWidth={activeZone.zone === 'sides' ? 1.8 : 0.8}
            />
            <path
              d="M138 78 C146 94 145 126 135 140 C124 136 122 92 130 79 Z"
              fill={activeZone.zone === 'sides' ? 'rgba(166, 38, 32, 0.26)' : 'transparent'}
              stroke="#2F231A"
              strokeDasharray="2 2"
              strokeWidth={activeZone.zone === 'sides' ? 1.8 : 0.8}
            />
            <text
              x="45"
              y="112"
              textAnchor="middle"
              fontSize="9"
              fontWeight="700"
              fill="#22170F"
              stroke="#FAF4E4"
              strokeWidth="2.8"
              paintOrder="stroke"
            >
              {blindLabels ? 'Rìa' : 'Can'}
            </text>
            <text
              x="135"
              y="112"
              textAnchor="middle"
              fontSize="9"
              fontWeight="700"
              fill="#22170F"
              stroke="#FAF4E4"
              strokeWidth="2.8"
              paintOrder="stroke"
            >
              {blindLabels ? 'Rìa' : 'Đởm'}
            </text>
          </g>

          <g onClick={() => handleSelect('tip')} style={{ cursor: 'pointer' }}>
            <path
              d="M62 158 C70 142 110 142 118 158 C108 178 72 178 62 158 Z"
              fill={activeZone.zone === 'tip' ? 'rgba(166, 38, 32, 0.26)' : 'transparent'}
              stroke="#2F231A"
              strokeDasharray="3 3"
              strokeWidth={activeZone.zone === 'tip' ? 1.8 : 0.9}
            />
            <text
              x="90"
              y="163"
              textAnchor="middle"
              fontSize="10.5"
              fontWeight="700"
              fill="#22170F"
              stroke="#FAF4E4"
              strokeWidth="2.8"
              paintOrder="stroke"
            >
              {blindLabels ? 'Đầu Lưỡi' : 'Đầu (Tâm Phế)'}
            </text>
          </g>
        </g>
      </svg>

      {!hideSummary && (
        <div style={{ flex: 1, minWidth: 185 }}>
          <p style={{ margin: '0 0 8px', fontSize: '0.88rem' }}>{tongue.summary}</p>
          <div className="tongue-readout-card">
            <div style={{ fontSize: '0.74rem', color: '#7C1A14', fontWeight: 700, marginBottom: '2px' }}>
              Chạm trực tiếp vào các vùng trên mặt gương đồng để soi ({activeZone.label})
            </div>
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
