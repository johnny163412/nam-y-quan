import React, { useEffect, useRef, useState } from 'react';
import { apothecaryAudio } from '../engine/audio';
import { PulseFingerZone, PulseProfile } from '../types/tcm';
import { GlossaryText } from './GlossaryText';

interface PulseCanvasProps {
  pulse: PulseProfile;
  onDepthInspected?: (depth: 'phu' | 'tram') => void;
  onFingerInspected?: (zone: PulseFingerZone, finding: string) => void;
  hideName?: boolean;
}

/** Coordinates calibrated directly onto the three healer fingertips resting on the wrist in `./art/tools/pulse-pillow.jpg` */
const FINGER_ZONES: {
  id: PulseFingerZone;
  title: string;
  organ: string;
  leftPct: number;
  topPct: number;
}[] = [
  { id: 'thon', title: 'Thốn', organ: 'Tâm/Phế', leftPct: 48.5, topPct: 58.0 },
  { id: 'quan', title: 'Quan', organ: 'Can/Tỳ', leftPct: 44.2, topPct: 60.5 },
  { id: 'xich', title: 'Xích', organ: 'Thận', leftPct: 39.8, topPct: 62.0 }
];

export const PulseCanvas: React.FC<PulseCanvasProps> = ({
  pulse,
  onDepthInspected,
  onFingerInspected,
  hideName = false
}) => {
  const [depth, setDepth] = useState<'phu' | 'tram'>('phu');
  const [activeFinger, setActiveFinger] = useState<PulseFingerZone>('quan');
  const [audioPulseOn, setAudioPulseOn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const fingerMultiplier = pulse.zoneNotes?.[activeFinger]?.strengthMultiplier ?? 1;
  const baseStrength = depth === 'phu' ? pulse.phuStrength : pulse.tramStrength;
  const activeStrength = Math.max(0.2, Math.min(1.15, baseStrength * fingerMultiplier));

  const switchDepth = (next: 'phu' | 'tram') => {
    setDepth(next);
    onDepthInspected?.(next);
  };

  const switchFinger = (zone: PulseFingerZone) => {
    setActiveFinger(zone);
    const note = pulse.zoneNotes?.[zone];
    if (note && onFingerInspected) {
      onFingerInspected(zone, `${note.label}: ${note.finding}`);
    }
    apothecaryAudio.playPulseBeat(activeStrength);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const start = performance.now();
    let lastBeatIdx = -1;

    const sampleWave = (phase: number, strength: number, h: number) => {
      let wave = 0;
      if (phase < 0.18) {
        const p = phase / 0.18;
        wave = Math.sin(p * Math.PI);
        if (pulse.waveStyle === 'tight' || pulse.waveStyle === 'wiry') {
          wave = Math.pow(wave, 0.55);
        } else if (pulse.waveStyle === 'slippery') {
          wave = Math.sin(p * Math.PI) * 1.06;
        }
      } else if (phase < 0.34) {
        const d = (phase - 0.18) / 0.16;
        wave = Math.sin(d * Math.PI) * (pulse.waveStyle === 'thready' ? 0.18 : 0.34);
      }
      return h * 0.58 - wave * (h * 0.36 * strength);
    };

    const render = (now: number) => {
      const elapsed = (now - start) / 1000;
      const w = canvas.width;
      const h = canvas.height;
      const midY = h * 0.58;

      ctx.clearRect(0, 0, w, h);

      // Aged Dó parchment gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#E8D9B8');
      bgGrad.addColorStop(1, '#D7C197');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Delicate sepia vertical ink guide lines & horizon line
      ctx.strokeStyle = 'rgba(68, 42, 22, 0.16)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(w, midY);
      ctx.stroke();

      const activeIdx = activeFinger === 'thon' ? 0 : activeFinger === 'quan' ? 1 : 2;
      if (!hideName) {
        ctx.fillStyle = 'rgba(166, 38, 32, 0.08)';
        ctx.fillRect((w / 3) * activeIdx, 0, w / 3, h);
      }

      const zoneNames = ['Thốn (Tâm/Phế)', 'Quan (Can/Tỳ)', 'Xích (Thận)'];
      ctx.font = '600 11px "Be Vietnam Pro", sans-serif';
      zoneNames.forEach((label, idx) => {
        const zx = (w / 3) * idx + 10;
        ctx.fillStyle = !hideName && idx === activeIdx ? '#8E231D' : '#5A4B3C';
        ctx.fillText(label, zx, 16);
        if (idx > 0) {
          ctx.strokeStyle = 'rgba(140, 92, 32, 0.34)';
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo((w / 3) * idx, 6);
          ctx.lineTo((w / 3) * idx, h - 6);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      const freq = pulse.bpm / 60;
      const beatIndex = Math.floor(elapsed * freq);
      if (audioPulseOn && beatIndex !== lastBeatIdx) {
        lastBeatIdx = beatIndex;
        apothecaryAudio.playPulseBeat(activeStrength);
      }

      // Soft calligraphy ink echo shadow stroke
      ctx.strokeStyle = depth === 'phu' ? 'rgba(166, 38, 32, 0.22)' : 'rgba(35, 87, 76, 0.22)';
      ctx.lineWidth = 4.2 + activeStrength * 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let x = 0; x < w; x += 2) {
        const phase = ((elapsed * freq - x / 135) % 1 + 1) % 1;
        const y = sampleWave(phase, activeStrength, h);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Primary crisp tapered brush-ink stroke
      ctx.strokeStyle = depth === 'phu' ? '#9E221B' : '#1E5247';
      ctx.lineWidth = 1.6 + activeStrength * 1.4;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const phase = ((elapsed * freq - x / 135) % 1 + 1) % 1;
        const y = sampleWave(phase, activeStrength, h);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Active pulse cinnabar bead surfing along the active zone
      const beadX = !hideName ? w * ((activeIdx + 0.5) / 3) : w * 0.5;
      const beadPhase = ((elapsed * freq - beadX / 135) % 1 + 1) % 1;
      const beadY = sampleWave(beadPhase, activeStrength, h);
      ctx.fillStyle = depth === 'phu' ? '#C73228' : '#266E5E';
      ctx.beginPath();
      ctx.arc(beadX, beadY, 3.8, 0, Math.PI * 2);
      ctx.fill();

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [pulse, depth, activeFinger, activeStrength, audioPulseOn, hideName]);

  const activeZoneNote = pulse.zoneNotes?.[activeFinger];

  return (
    <div>
      {!hideName && (
        <div className="pulse-wrist-stage">
          <div className="pulse-wrist-backdrop">
            <img
              src="./art/tools/pulse-pillow.jpg"
              alt="Thầy thuốc đặt ba ngón Thốn Quan Xích bắt mạch trên gối gấm bên ngọn đèn dầu"
              className="pulse-pillow-art-pure"
            />
            <div className="pulse-hotspots-layer" role="group" aria-label="Ba bộ Thốn Quan Xích trên cổ tay">
              {FINGER_ZONES.map((fz) => {
                const isAct = activeFinger === fz.id;
                return (
                  <button
                    key={fz.id}
                    type="button"
                    className={`pulse-finger-hotspot ${isAct ? 'is-active' : ''} depth-${depth} zone-${fz.id}`}
                    style={{ left: `${fz.leftPct}%`, top: `${fz.topPct}%` }}
                    onClick={() => switchFinger(fz.id)}
                    aria-pressed={isAct}
                    title={`Bộ ${fz.title} (${fz.organ})`}
                  >
                    {isAct && (
                      <span
                        className="hotspot-ripple-ring"
                        style={{ animationDuration: `${Math.max(0.45, 60 / pulse.bpm)}s` }}
                        aria-hidden="true"
                      />
                    )}
                    <span className="hotspot-dot" />
                    <span className="hotspot-pill">{fz.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="wrist-controls-strip">
            <div className="brass-pair-toggle">
              <button
                type="button"
                className={`knob-half ${depth === 'phu' ? 'active' : ''}`}
                onClick={() => switchDepth('phu')}
              >
                Phù thủ (Ấn nhẹ)
              </button>
              <button
                type="button"
                className={`knob-half ${depth === 'tram' ? 'active' : ''}`}
                onClick={() => switchDepth('tram')}
              >
                Trầm thủ (Ấn sâu)
              </button>
            </div>
            <button
              type="button"
              className={`wooden-token-btn ${audioPulseOn ? 'active' : ''}`}
              onClick={() => setAudioPulseOn((v) => !v)}
            >
              {audioPulseOn ? 'Đang nghe nhịp mạch' : 'Nghe nhịp mạch'}
            </button>
          </div>
        </div>
      )}

      {hideName && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
          <button type="button" className={`toggle-pill ${depth === 'phu' ? 'active' : ''}`} onClick={() => switchDepth('phu')}>
            Phù thủ (Nông)
          </button>
          <button type="button" className={`toggle-pill ${depth === 'tram' ? 'active' : ''}`} onClick={() => switchDepth('tram')}>
            Trầm thủ (Sâu)
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={480}
        height={108}
        style={{
          width: '100%',
          height: '108px',
          border: '2px solid #5A3E28',
          borderRadius: '3px',
          display: 'block'
        }}
      />

      <div style={{ marginTop: '8px', fontSize: '0.86rem' }}>
        {!hideName && (
          <div style={{ fontWeight: 700, color: '#221B15' }}>
            <GlossaryText text={`${pulse.name} (${pulse.bpm} nhịp/phút)`} />
          </div>
        )}
        <div style={{ color: '#5A4B3C', marginTop: '2px' }}>
          <GlossaryText
            text={depth === 'phu' ? `Cảm nhận Phù thủ: ${pulse.phuFinding}` : `Cảm nhận Trầm thủ: ${pulse.tramFinding}`}
          />
        </div>
        {!hideName && activeZoneNote && (
          <div className="pulse-zone-readout">
            <strong>{activeZoneNote.label}:</strong> <GlossaryText text={activeZoneNote.finding} />
          </div>
        )}
      </div>
    </div>
  );
};
