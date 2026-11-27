import React, { useEffect, useRef, useState } from 'react';
import { TongueProfile, TongueZoneDetail } from '../../types/tcm';

interface TongueMirrorProps {
  tongue: TongueProfile;
  onInspectZone?: (zone: TongueZoneDetail) => void;
  compact?: boolean;
  hideSummary?: boolean;
  blindLabels?: boolean;
}

const BODY_PALETTE: Record<TongueProfile['bodyColor'], { base: string; edge: string; vein: string }> = {
  pale: { base: '#DFBEB8', edge: '#B78C86', vein: '#9D6F6B' },
  pink: { base: '#D88B8A', edge: '#A45A59', vein: '#843D3E' },
  red: { base: '#C65252', edge: '#8C2D2D', vein: '#69191B' },
  crimson: { base: '#962228', edge: '#5A1015', vein: '#3D080C' },
  purplish: { base: '#9C6279', edge: '#623749', vein: '#442031' }
};

function drawOrganicTonguePath(ctx: CanvasRenderingContext2D, shape: TongueProfile['bodyShape']) {
  ctx.beginPath();
  if (shape === 'swollen-teeth') {
    ctx.moveTo(36, 46);
    ctx.quadraticCurveTo(90, 22, 144, 46);
    ctx.quadraticCurveTo(152, 84, 143, 102);
    ctx.quadraticCurveTo(151, 120, 140, 138);
    ctx.quadraticCurveTo(144, 156, 126, 174);
    ctx.quadraticCurveTo(90, 198, 54, 174);
    ctx.quadraticCurveTo(36, 156, 40, 138);
    ctx.quadraticCurveTo(29, 120, 37, 102);
    ctx.quadraticCurveTo(28, 84, 36, 46);
  } else if (shape === 'thin') {
    ctx.moveTo(50, 48);
    ctx.quadraticCurveTo(90, 28, 130, 48);
    ctx.quadraticCurveTo(138, 118, 124, 166);
    ctx.quadraticCurveTo(90, 192, 56, 166);
    ctx.quadraticCurveTo(42, 118, 50, 48);
  } else {
    ctx.moveTo(40, 46);
    ctx.quadraticCurveTo(90, 24, 140, 46);
    ctx.quadraticCurveTo(150, 116, 132, 168);
    ctx.quadraticCurveTo(90, 196, 48, 168);
    ctx.quadraticCurveTo(30, 116, 40, 46);
  }
  ctx.closePath();
}

export const TongueMirror: React.FC<TongueMirrorProps> = ({
  tongue,
  onInspectZone,
  compact = false,
  hideSummary = false,
  blindLabels = false
}) => {
  const [activeZone, setActiveZone] = useState<TongueZoneDetail>(tongue.zones[0]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleSelect = (zoneKey: TongueZoneDetail['zone']) => {
    const found = tongue.zones.find((z) => z.zone === zoneKey) ?? tongue.zones[0];
    setActiveZone(found);
    onInspectZone?.(found);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const palette = BODY_PALETTE[tongue.bodyColor];
    ctx.clearRect(0, 0, 180, 216);

    // 1. Dark recessed oral cavity clipped to antique oval mirror aperture
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(90, 108, 76, 94, 0, 0, Math.PI * 2);
    ctx.clip();

    const cavityGrad = ctx.createRadialGradient(90, 96, 14, 90, 108, 96);
    cavityGrad.addColorStop(0, '#4A2621');
    cavityGrad.addColorStop(0.7, '#24120E');
    cavityGrad.addColorStop(1, '#120806');
    ctx.fillStyle = cavityGrad;
    ctx.fillRect(0, 0, 180, 216);

    // Subtle upper lip arch
    ctx.fillStyle = 'rgba(146, 78, 74, 0.58)';
    ctx.beginPath();
    ctx.moveTo(28, 48);
    ctx.quadraticCurveTo(60, 22, 90, 29);
    ctx.quadraticCurveTo(120, 22, 152, 48);
    ctx.quadraticCurveTo(120, 37, 90, 41);
    ctx.quadraticCurveTo(60, 37, 28, 48);
    ctx.closePath();
    ctx.fill();

    // 2. Textured watercolor tongue body
    ctx.save();
    drawOrganicTonguePath(ctx, tongue.bodyShape);
    ctx.clip();

    const bodyGrad = ctx.createRadialGradient(90, 92, 16, 90, 114, 92);
    bodyGrad.addColorStop(0, palette.base);
    bodyGrad.addColorStop(0.78, palette.base);
    bodyGrad.addColorStop(1, palette.edge);
    ctx.fillStyle = bodyGrad;
    ctx.fillRect(20, 20, 140, 185);

    // Organic lingual papillae & mottled watercolor granulation
    let seed = 7319;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = 0; i < 160; i++) {
      const px = 38 + rand() * 104;
      const py = 44 + rand() * 136;
      const r = 0.8 + rand() * 2.1;
      ctx.fillStyle = i % 3 === 0 ? 'rgba(255,244,238,0.16)' : 'rgba(65,18,16,0.11)';
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Median lingual sulcus groove
    ctx.strokeStyle = 'rgba(84, 24, 22, 0.28)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(90, 50);
    ctx.bezierCurveTo(88, 86, 92, 126, 90, 162);
    ctx.stroke();

    // 3. Multi-layered mottled tongue coating wash (Rêu lưỡi)
    const coatRgba =
      tongue.coatColor === 'thin-white'
        ? '247, 244, 232'
        : tongue.coatColor === 'thick-white'
        ? '244, 238, 220'
        : tongue.coatColor === 'yellow-dry'
        ? '216, 180, 92'
        : tongue.coatColor === 'yellow-greasy'
        ? '194, 162, 68'
        : '250, 240, 230';
    const coatAlpha =
      tongue.coatColor === 'peeled'
        ? 0.08
        : tongue.coatColor === 'thin-white'
        ? 0.44
        : 0.78;

    for (let c = 0; c < 18; c++) {
      const cx = 64 + rand() * 52;
      const cy = 62 + rand() * 94;
      const rad = 14 + rand() * 20;
      const cg = ctx.createRadialGradient(cx, cy, 2, cx, cy, rad);
      cg.addColorStop(0, `rgba(${coatRgba}, ${coatAlpha * 0.62})`);
      cg.addColorStop(1, `rgba(${coatRgba}, 0)`);
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Red/Crimson Heat Papillae Dots (Điểm ứ nhiệt / Đầu lưỡi đỏ)
    if (tongue.bodyColor === 'red' || tongue.bodyColor === 'crimson') {
      ctx.fillStyle = 'rgba(130, 14, 22, 0.72)';
      [
        [76, 152],
        [95, 160],
        [104, 148],
        [85, 166],
        [48, 116],
        [132, 114]
      ].forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.arc(dx, dy, 1.6, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 5. Wet-slippery saliva moisture sheen
    if (tongue.moisture === 'wet-slippery') {
      const sheen = ctx.createLinearGradient(68, 72, 82, 134);
      sheen.addColorStop(0, 'rgba(255, 255, 255, 0.42)');
      sheen.addColorStop(1, 'rgba(255, 255, 255, 0.04)');
      ctx.fillStyle = sheen;
      ctx.beginPath();
      ctx.ellipse(73, 102, 4.5, 22, -0.1, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Soft ink outline around tongue
    drawOrganicTonguePath(ctx, tongue.bodyShape);
    ctx.strokeStyle = 'rgba(46, 28, 18, 0.72)';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.restore();
  }, [tongue]);

  const width = compact ? 156 : 194;
  const height = compact ? 184 : 228;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
      <div className="tongue-mirror-stage" style={{ width, height }}>
        <canvas
          ref={canvasRef}
          width={180}
          height={216}
          className="tongue-watercolor-canvas"
          aria-hidden="true"
        />

        <svg
          width={width}
          height={height}
          viewBox="0 0 210 248"
          role="img"
          aria-label="Gương đồng Bát Hoa soi Thiệt chẩn 5 vùng Tạng Phủ"
          className="tongue-mirror-overlay-svg"
        >
          <defs>
            <linearGradient id="bronze-rim-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#DEB45F" />
              <stop offset="28%" stopColor="#8E5F24" />
              <stop offset="56%" stopColor="#CFA04E" />
              <stop offset="84%" stopColor="#5D3C16" />
              <stop offset="100%" stopColor="#3B240C" />
            </linearGradient>
            <mask id="mirror-aperture-cutout">
              <rect x="0" y="0" width="210" height="248" fill="#FFF" />
              <ellipse cx="105" cy="121" rx="76" ry="93" fill="#000" />
            </mask>
          </defs>

          {/* Outer bronze mirror frame with cutout aperture showing watercolor tongue canvas below */}
          <g mask="url(#mirror-aperture-cutout)">
            <circle cx="105" cy="14" r="9" fill="none" stroke="url(#bronze-rim-grad)" strokeWidth="4.2" />
            <circle cx="105" cy="14" r="5" fill="none" stroke="#36220D" strokeWidth="1" />
            <path
              d="M93 222 L117 222 L114 242 Q105 246 96 242 Z"
              fill="url(#bronze-rim-grad)"
              stroke="#2E1B0A"
              strokeWidth="1.6"
            />
            <line x1="96" y1="229" x2="114" y2="229" stroke="#36220D" strokeWidth="1.2" />
            <line x1="97" y1="236" x2="113" y2="236" stroke="#36220D" strokeWidth="1.2" />
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
          </g>

          <ellipse
            cx="105"
            cy="121"
            rx="80"
            ry="95"
            fill="none"
            stroke="#E7C278"
            strokeWidth="1.3"
            strokeDasharray="3 3"
            opacity="0.72"
          />

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
      </div>

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
