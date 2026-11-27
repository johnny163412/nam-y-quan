import React, { useEffect, useRef } from 'react';
import { PatientCase } from '../../types/tcm';
import { AntiqueIcon, AntiqueIconName } from './AntiqueIcons';

export type ExamToolType = 'vong' | 'van' | 'van-hoi' | 'thiet';

interface VillagerPortraitProps {
  patientCase: PatientCase;
  size?: 'compact' | 'stage';
  mood?: 'sick' | 'recovered';
  activeExamTool?: ExamToolType | null;
  coughing?: boolean;
}

const EXAM_TOOL_META: Record<ExamToolType, { icon: AntiqueIconName; label: string }> = {
  vong: { icon: 'mirror', label: 'Đang soi Thiệt chẩn' },
  van: { icon: 'ear-wave', label: 'Đang nghe thanh âm' },
  'van-hoi': { icon: 'bamboo-slips', label: 'Đang rút thẻ vấn' },
  thiet: { icon: 'pulse-pillow', label: 'Đang bắt mạch' }
};

const PORTRAIT_IMAGES: Record<string, string> = {
  'c1-phong-han': './art/patients/c1-phong-han.jpg',
  'c1-phong-nhiet': './art/patients/c1-phong-nhiet.jpg',
  'c1-thuong-thuc-han': './art/patients/c1-thuong-thuc-han.jpg',
  'c2-ty-vi-hu-han': './art/patients/c2-ty-vi-hu-han.jpg',
  'c2-can-khi-uat': './art/patients/c2-can-khi-uat.jpg',
  'c2-tam-ty-luong-hu': './art/patients/c2-tam-ty-luong-hu.jpg',
  'c2-tam-hoa-vuong': './art/patients/c2-tam-hoa-vuong.jpg',
  'c3-vai-gay-phong-han': './art/patients/c3-vai-gay-phong-han.jpg',
  'c3-thai-phu-khi-nghich': './art/patients/c3-thai-phu-khi-nghich.jpg',
  'c3-than-duong-hu-phong-thap': './art/patients/c3-than-duong-hu-phong-thap.jpg'
};

function resolvePortraitSrc(patientCase: PatientCase): string {
  // a tái khám visit keeps the same person's face
  const portraitKey = patientCase.followUpOf ?? patientCase.id;
  if (PORTRAIT_IMAGES[portraitKey]) {
    return PORTRAIT_IMAGES[portraitKey];
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
  size = 'compact',
  mood = 'sick',
  activeExamTool = null,
  coughing = false
}) => {
  const portraitSrc = resolvePortraitSrc(patientCase);
  const coldHeat = patientCase.initialVector.coldHeat;
  const conditionClass =
    mood === 'recovered'
      ? 'aura-recovered'
      : coldHeat <= -45
      ? 'aura-chilled'
      : coldHeat >= 45
      ? 'aura-fever'
      : 'aura-calm';

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    type SymptomParticle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      life: number;
      maxLife: number;
      kind: 'mist' | 'sweat' | 'qi' | 'gold';
    };
    const parts: SymptomParticle[] = [];
    let tick = 0;
    let rafId = 0;

    const spawn = () => {
      if (mood === 'recovered') {
        parts.push({
          x: w * (0.2 + Math.random() * 0.6),
          y: h * (0.65 + Math.random() * 0.25),
          vx: (Math.random() - 0.5) * 0.3,
          vy: -(0.5 + Math.random() * 0.65),
          r: 1.6 + Math.random() * 2.2,
          life: 0,
          maxLife: 60 + Math.random() * 35,
          kind: 'gold'
        });
      } else if (coldHeat <= -35) {
        parts.push({
          x: w * 0.48 + (Math.random() - 0.5) * 14,
          y: h * 0.50,
          vx: 0.25 + Math.random() * 0.3,
          vy: -(0.22 + Math.random() * 0.28),
          r: 7 + Math.random() * 10,
          life: 0,
          maxLife: 72 + Math.random() * 30,
          kind: 'mist'
        });
      } else if (coldHeat >= 35) {
        parts.push({
          x: w * (Math.random() > 0.5 ? 0.38 : 0.62) + (Math.random() - 0.5) * 8,
          y: h * 0.34,
          vx: (Math.random() - 0.5) * 0.1,
          vy: 0.45 + Math.random() * 0.35,
          r: 1.5 + Math.random() * 1.1,
          life: 0,
          maxLife: 48 + Math.random() * 24,
          kind: 'sweat'
        });
      } else {
        parts.push({
          x: w * (0.3 + Math.random() * 0.4),
          y: h * 0.68,
          vx: (Math.random() - 0.5) * 0.22,
          vy: -(0.35 + Math.random() * 0.35),
          r: 1.8 + Math.random() * 2.0,
          life: 0,
          maxLife: 68 + Math.random() * 30,
          kind: 'qi'
        });
      }
    };

    const frame = () => {
      tick += 1;
      ctx.clearRect(0, 0, w, h);

      if (mood === 'recovered' && tick % 7 === 0 && parts.length < 18) spawn();
      else if (coldHeat <= -35 && tick % 20 === 0 && parts.length < 10) spawn();
      else if (coldHeat >= 35 && tick % 24 === 0 && parts.length < 8) spawn();
      else if (tick % 22 === 0 && parts.length < 10) spawn();

      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life += 1;
        if (p.life >= p.maxLife) {
          parts.splice(i, 1);
          continue;
        }
        const prog = p.life / p.maxLife;
        const alpha = prog < 0.25 ? prog / 0.25 : Math.max(0, 1 - (prog - 0.25) / 0.75);
        p.x += p.vx;
        p.y += p.vy;

        if (p.kind === 'mist') {
          p.r += 0.12;
          const g = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, p.r);
          g.addColorStop(0, `rgba(240, 248, 255, ${alpha * 0.32})`);
          g.addColorStop(1, 'rgba(240, 248, 255, 0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === 'sweat') {
          ctx.fillStyle = `rgba(235, 248, 255, ${alpha * 0.78})`;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.r * 0.75, p.r * 1.35, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === 'gold') {
          ctx.fillStyle = `rgba(255, 218, 118, ${alpha * 0.88})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = `rgba(224, 210, 184, ${alpha * 0.45})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [coldHeat, mood, patientCase.id]);

  const toolBadge = activeExamTool ? EXAM_TOOL_META[activeExamTool] : null;

  return (
    <div
      className={`patient-avatar-silk ${size === 'stage' ? 'is-stage-portrait' : ''} ${conditionClass} ${
        coughing ? 'is-coughing' : ''
      } ${mood === 'recovered' ? 'is-bowing-recovered' : ''}`}
      aria-hidden="true"
    >
      <img
        src={portraitSrc}
        alt={patientCase.patientName}
        className="patient-portrait-img portrait-breathe"
      />
      <canvas
        ref={canvasRef}
        width={140}
        height={160}
        className="portrait-symptom-canvas"
      />
      <div className="silk-frame-vignette" />
      {size === 'stage' && toolBadge && (
        <div className="portrait-tool-callout">
          <AntiqueIcon name={toolBadge.icon} size={13} />
          <span>{toolBadge.label}</span>
        </div>
      )}
    </div>
  );
};
