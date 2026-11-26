import React from 'react';
import { PatientCase } from '../../types/tcm';

interface VillagerPortraitProps {
  patientCase: PatientCase;
}

const PORTRAIT_IMAGES: Record<string, string> = {
  'c1-phong-han': '/art/patients/c1-phong-han.jpg',
  'c1-phong-nhiet': '/art/patients/c1-phong-nhiet.jpg',
  'c1-thuong-thuc-han': '/art/patients/c1-thuong-thuc-han.jpg',
  'c2-tam-ty-luong-hu': '/art/patients/c2-tam-ty-luong-hu.jpg',
  'c2-tam-hoa-vuong': '/art/patients/c2-tam-hoa-vuong.jpg',
  'c3-vai-gay-phong-han': '/art/patients/c3-vai-gay-phong-han.jpg',
  'c3-thai-phu-khi-nghich': '/art/patients/c3-thai-phu-khi-nghich.jpg',
  'c3-than-duong-hu-phong-thap': '/art/patients/c3-than-duong-hu-phong-thap.jpg'
};

function resolvePortraitSrc(patientCase: PatientCase): string | null {
  if (PORTRAIT_IMAGES[patientCase.id]) {
    return PORTRAIT_IMAGES[patientCase.id];
  }
  if (patientCase.id.startsWith('proc-phong-han')) return PORTRAIT_IMAGES['c1-phong-han'];
  if (patientCase.id.startsWith('proc-phong-nhiet')) return PORTRAIT_IMAGES['c1-phong-nhiet'];
  if (patientCase.id.startsWith('proc-tam-hoa')) return PORTRAIT_IMAGES['c2-tam-hoa-vuong'];
  if (patientCase.id.startsWith('proc-kinh-lac-vai-gay')) return PORTRAIT_IMAGES['c3-vai-gay-phong-han'];
  return null;
}

export const VillagerPortrait: React.FC<VillagerPortraitProps> = ({ patientCase }) => {
  const portraitSrc = resolvePortraitSrc(patientCase);
  const isScholar = patientCase.id.includes('can-khi-uat');
  const isGrandma = patientCase.id.includes('ty-vi-hu-han') || patientCase.id.startsWith('proc-ty-hu');

  if (portraitSrc) {
    return (
      <div className="patient-avatar-silk" aria-hidden="true">
        <img
          src={portraitSrc}
          alt={patientCase.patientName}
          className="patient-portrait-img"
        />
        <div className="silk-frame-vignette" />
      </div>
    );
  }

  // Composite silk-lit apothecary backdrop + detailed hand-drawn character for Bà Năm Trầu / Cậu Minh
  return (
    <div className="patient-avatar-silk" aria-hidden="true">
      <img
        src="/art/patients/clinic-bg.jpg"
        alt=""
        className="patient-portrait-img"
        style={{ filter: 'brightness(0.84) contrast(0.95)' }}
      />
      <svg
        viewBox="0 0 120 156"
        fill="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <g filter="url(#ink-brush-soft)" strokeLinecap="round" strokeLinejoin="round">
          <path
            d={
              isScholar
                ? 'M16 154 C18 112 34 100 60 100 C86 100 102 112 104 154 Z'
                : 'M14 154 C17 115 35 103 60 103 C85 103 103 115 106 154 Z'
            }
            fill={isScholar ? '#223E5C' : '#6A4E39'}
            stroke="#221912"
            strokeWidth="1.9"
          />
          {isScholar ? (
            <path d="M49 100 L49 112 L60 132 L71 112 L71 100" stroke="#221912" strokeWidth="1.8" fill="#EFE6D2" fillOpacity="0.85" />
          ) : (
            <path d="M40 105 C49 118 62 128 76 154 M80 105 C71 114 65 120 59 126" stroke="#221912" strokeWidth="1.8" />
          )}

          <path d="M51 86 C51 94 51 100 50 103 Q60 108 70 103 C69 100 69 94 69 86" fill="#E3C4A4" stroke="#221912" strokeWidth="1.6" />
          <path d="M36 58 C31 59 31 70 37 72" stroke="#221912" strokeWidth="1.5" fill="#E3C4A4" />
          <path d="M84 58 C89 59 89 70 83 72" stroke="#221912" strokeWidth="1.5" fill="#E3C4A4" />
          <path
            d="M38 50 C37 68 43 85 60 88 C77 85 83 68 82 50 C81 35 72 30 60 30 C48 30 39 35 38 50 Z"
            fill={isGrandma ? '#E5CBAE' : '#EAD1B6'}
            stroke="#221912"
            strokeWidth="1.8"
          />

          {isScholar ? (
            <>
              <path d="M36 48 C35 31 46 21 60 21 C74 21 85 31 84 48 C71 41 49 41 36 48 Z" fill="#1E1A16" stroke="#221912" strokeWidth="1.7" />
              <path d="M39 42 L60 35 L81 42" stroke="#5A4B3C" strokeWidth="1.3" />
            </>
          ) : (
            <>
              <path d="M31 63 C29 36 43 22 60 22 C77 22 91 36 89 63 C81 47 71 42 60 44 C49 42 39 47 31 63 Z" fill="#5D4D3F" stroke="#221912" strokeWidth="1.7" />
              <path d="M41 45 Q51 41 59 44 M61 44 Q69 41 79 45" stroke="#DFD6C5" strokeWidth="2.6" />
            </>
          )}

          <path d="M46 56 Q51 53 55 56 M65 56 Q69 53 74 56" stroke="#221912" strokeWidth="1.5" />
          <path d="M47 62 Q51 60 54 62 M66 62 Q69 60 73 62" stroke="#221912" strokeWidth="1.7" />
          <path d="M60 62 C60 68 58 72 62 73" stroke="#5A4B3C" strokeWidth="1.3" />
          <path d="M54 79 Q60 80 66 79" stroke="#8B493B" strokeWidth="1.5" />
        </g>
      </svg>
      <div className="silk-frame-vignette" />
    </div>
  );
};
