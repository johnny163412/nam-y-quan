import React from 'react';
import { PatientCase } from '../../types/tcm';

interface VillagerPortraitProps {
  patientCase: PatientCase;
}

type PersonaStyle = 'elder-boatman' | 'young-woman' | 'grandmother' | 'scholar' | 'craftsman';

function resolvePersona(patientCase: PatientCase): PersonaStyle {
  const id = patientCase.id;
  const name = patientCase.patientName.toLowerCase();
  if (id.includes('can-khi-uat') || name.includes('minh')) return 'scholar';
  if (id.includes('ty-vi-hu-han') || name.includes('bà năm') || name.includes('bà tư')) {
    return 'grandmother';
  }
  if (
    patientCase.isPregnant ||
    name.includes('cô ') ||
    name.includes('chị ')
  ) {
    return 'young-woman';
  }
  if (
    patientCase.age >= 50 ||
    id.includes('phong-han') ||
    id.includes('than-duong-hu') ||
    name.includes('ông ') ||
    name.includes('bác năm')
  ) {
    return 'elder-boatman';
  }
  return 'craftsman';
}

export const VillagerPortrait: React.FC<VillagerPortraitProps> = ({ patientCase }) => {
  const style = resolvePersona(patientCase);

  return (
    <div className="patient-avatar" aria-hidden="true">
      <svg width="78" height="86" viewBox="0 0 84 92" fill="none">
        <g filter="url(#ink-brush-soft)" strokeLinecap="round" strokeLinejoin="round">
          {/* Paper background wash */}
          <path
            d="M4 6 C28 3 58 4 80 6 C82 32 81 64 80 87 C52 89 24 88 5 87 C3 62 3 32 4 6 Z"
            fill="#F4ECD8"
          />

          {/* Subtle nón lá halo for boatman / outdoor folk */}
          {style === 'elder-boatman' && (
            <path
              d="M9 52 Q42 20 75 52 Q42 46 9 52 Z"
              fill="#D9BC84"
              fillOpacity="0.45"
              stroke="#5A4B3C"
              strokeWidth="1.2"
            />
          )}

          {/* Shoulders & Traditional Áo Giao Lĩnh / Áo Nâu Sồng */}
          <path
            d={
              style === 'scholar'
                ? 'M12 90 C14 68 24 61 42 61 C60 61 70 68 72 90 Z'
                : 'M10 90 C12 69 24 62 42 62 C60 62 72 69 74 90 Z'
            }
            fill={
              style === 'scholar'
                ? '#274B6D'
                : style === 'young-woman'
                ? '#8B493B'
                : style === 'grandmother'
                ? '#6F543F'
                : '#7B6047'
            }
            fillOpacity={style === 'scholar' ? 0.58 : 0.45}
            stroke="#2F231A"
            strokeWidth="1.6"
          />

          {/* Traditional Crossed Collar (Áo giao lĩnh / vạt chéo) */}
          {style === 'young-woman' ? (
            <>
              <path d="M31 63 L42 75 L53 63" fill="#B84437" fillOpacity="0.68" stroke="#2F231A" strokeWidth="1.3" />
              <path d="M29 63 C34 73 40 80 48 90" stroke="#2F231A" strokeWidth="1.4" />
            </>
          ) : style === 'scholar' ? (
            <path d="M34 61 L34 68 L42 82 L50 68 L50 61" stroke="#2F231A" strokeWidth="1.5" fill="#F7F1E3" fillOpacity="0.6" />
          ) : (
            <path d="M29 63 C36 72 44 79 54 90 M54 63 C48 70 44 74 40 78" stroke="#2F231A" strokeWidth="1.45" />
          )}

          {/* Neck */}
          <path d="M36 53 C36 58 36 62 35 64 Q42 67 49 64 C48 62 48 58 48 53" fill="#E6CBB0" stroke="#2F231A" strokeWidth="1.35" />

          {/* Face & Ears */}
          <path d="M25 36 C21 37 21 44 25 45" stroke="#2F231A" strokeWidth="1.3" fill="#E6CBB0" />
          <path d="M59 36 C63 37 63 44 59 45" stroke="#2F231A" strokeWidth="1.3" fill="#E6CBB0" />
          <path
            d="M26 30 C25 42 29 53 42 55 C55 53 59 42 58 30 C57 20 50 17 42 17 C34 17 27 20 26 30 Z"
            fill="#ECD4BA"
            stroke="#2F231A"
            strokeWidth="1.6"
          />

          {/* Hair / Traditional Headwear */}
          {style === 'elder-boatman' && (
            <>
              {/* Khăn đầu rìu */}
              <path
                d="M24 29 C24 19 32 13 42 13 C52 13 60 19 60 29 C52 25 32 25 24 29 Z"
                fill="#5A4636"
                fillOpacity="0.82"
                stroke="#2F231A"
                strokeWidth="1.45"
              />
              <path d="M27 24 Q42 20 57 24" stroke="#E2D4B7" strokeWidth="1" opacity="0.65" />
              {/* Chòm râu thưa */}
              <path d="M37 54 Q42 64 47 54 M42 55 L42 63" stroke="#5A4B3C" strokeWidth="1.2" />
            </>
          )}

          {style === 'young-woman' && (
            <>
              {/* Khăn mỏ quạ / tóc vấn truyền thống */}
              <path
                d="M23 35 C22 20 31 12 42 12 C53 12 62 20 61 35 C56 26 49 23 42 26 C35 23 28 26 23 35 Z"
                fill="#2A211B"
                fillOpacity="0.88"
                stroke="#2F231A"
                strokeWidth="1.4"
              />
            </>
          )}

          {style === 'grandmother' && (
            <>
              {/* Khăn vuông bà cụ & tóc bạc */}
              <path
                d="M22 38 C20 20 30 12 42 12 C54 12 64 20 62 38 C56 27 49 24 42 25 C35 24 28 27 22 38 Z"
                fill="#6B5A4C"
                fillOpacity="0.8"
                stroke="#2F231A"
                strokeWidth="1.45"
              />
              <path d="M28 27 Q35 24 41 26 M43 26 Q49 24 56 27" stroke="#DFD6C5" strokeWidth="2.1" />
            </>
          )}

          {style === 'scholar' && (
            <>
              {/* Khăn đóng chữ nhân */}
              <path
                d="M25 29 C24 18 32 11 42 11 C52 11 60 18 59 29 C50 24 34 24 25 29 Z"
                fill="#221B15"
                fillOpacity="0.88"
                stroke="#2F231A"
                strokeWidth="1.5"
              />
              <path d="M27 25 L42 20 L57 25" stroke="#5A4B3C" strokeWidth="1.2" />
            </>
          )}

          {style === 'craftsman' && (
            <>
              {/* Búi tóc & khăn quấn trán thợ thủ công */}
              <circle cx="42" cy="12" r="5" fill="#2F231A" />
              <path
                d="M25 28 C26 21 33 17 42 17 C51 17 58 21 59 28 C51 25 33 25 25 28 Z"
                fill="#8C5230"
                fillOpacity="0.72"
                stroke="#2F231A"
                strokeWidth="1.4"
              />
            </>
          )}

          {/* Expressive Brush Facial Features */}
          <path d="M32 34 Q35 32 38 34 M46 34 Q49 32 52 34" stroke="#2F231A" strokeWidth="1.25" />
          <path d="M33 38 Q35 37 37 38 M47 38 Q49 37 51 38" stroke="#2F231A" strokeWidth="1.5" />
          <path d="M42 38 C42 42 41 44 43 45" stroke="#5A4B3C" strokeWidth="1.15" />
          <path d="M38 49 Q42 50 46 49" stroke="#8B493B" strokeWidth="1.3" />
        </g>
      </svg>
    </div>
  );
};
