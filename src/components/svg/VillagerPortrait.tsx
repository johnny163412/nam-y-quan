import React from 'react';
import { PatientCase } from '../../types/tcm';

interface VillagerPortraitProps {
  patientCase: PatientCase;
  size?: 'compact' | 'stage';
}

const PORTRAIT_IMAGES: Record<string, string> = {
  'c1-phong-han': '/art/patients/c1-phong-han.jpg',
  'c1-phong-nhiet': '/art/patients/c1-phong-nhiet.jpg',
  'c1-thuong-thuc-han': '/art/patients/c1-thuong-thuc-han.jpg',
  'c2-ty-vi-hu-han': '/art/patients/c2-ty-vi-hu-han.jpg',
  'c2-can-khi-uat': '/art/patients/c2-can-khi-uat.jpg',
  'c2-tam-ty-luong-hu': '/art/patients/c2-tam-ty-luong-hu.jpg',
  'c2-tam-hoa-vuong': '/art/patients/c2-tam-hoa-vuong.jpg',
  'c3-vai-gay-phong-han': '/art/patients/c3-vai-gay-phong-han.jpg',
  'c3-thai-phu-khi-nghich': '/art/patients/c3-thai-phu-khi-nghich.jpg',
  'c3-than-duong-hu-phong-thap': '/art/patients/c3-than-duong-hu-phong-thap.jpg'
};

function resolvePortraitSrc(patientCase: PatientCase): string {
  if (PORTRAIT_IMAGES[patientCase.id]) {
    return PORTRAIT_IMAGES[patientCase.id];
  }
  if (patientCase.id.startsWith('proc-phong-han')) return PORTRAIT_IMAGES['c1-phong-han'];
  if (patientCase.id.startsWith('proc-phong-nhiet')) return PORTRAIT_IMAGES['c1-phong-nhiet'];
  if (patientCase.id.startsWith('proc-ty-hu')) return PORTRAIT_IMAGES['c2-ty-vi-hu-han'];
  if (patientCase.id.startsWith('proc-tam-hoa')) return PORTRAIT_IMAGES['c2-tam-hoa-vuong'];
  if (patientCase.id.startsWith('proc-kinh-lac-vai-gay')) return PORTRAIT_IMAGES['c3-vai-gay-phong-han'];
  return PORTRAIT_IMAGES['c1-thuong-thuc-han'];
}

export const VillagerPortrait: React.FC<VillagerPortraitProps> = ({
  patientCase,
  size = 'compact'
}) => {
  const portraitSrc = resolvePortraitSrc(patientCase);
  const conditionClass =
    patientCase.initialVector.coldHeat <= -45
      ? 'aura-chilled'
      : patientCase.initialVector.coldHeat >= 45
      ? 'aura-fever'
      : 'aura-calm';

  return (
    <div
      className={`patient-avatar-silk ${size === 'stage' ? 'is-stage-portrait' : ''} ${conditionClass}`}
      aria-hidden="true"
    >
      <img
        src={portraitSrc}
        alt={patientCase.patientName}
        className="patient-portrait-img portrait-breathe"
      />
      <div className="silk-frame-vignette" />
    </div>
  );
};
