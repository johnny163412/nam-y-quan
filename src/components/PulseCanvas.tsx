import React, { useEffect, useRef, useState } from 'react';
import { apothecaryAudio } from '../engine/audio';
import { PulseProfile } from '../types/tcm';

interface PulseCanvasProps {
  pulse: PulseProfile;
  onDepthInspected?: (depth: 'phu' | 'tram') => void;
  hideName?: boolean;
}

export const PulseCanvas: React.FC<PulseCanvasProps> = ({ pulse, onDepthInspected, hideName = false }) => {
  const [depth, setDepth] = useState<'phu' | 'tram'>('phu');
  const [audioPulseOn, setAudioPulseOn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeStrength = depth === 'phu' ? pulse.phuStrength : pulse.tramStrength;

  const switchDepth = (next: 'phu' | 'tram') => {
    setDepth(next);
    onDepthInspected?.(next);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let start = performance.now();
    let lastBeatIdx = -1;

    const render = (now: number) => {
      const elapsed = (now - start) / 1000;
      const w = canvas.width;
      const h = canvas.height;
      const midY = h * 0.56;

      ctx.clearRect(0, 0, w, h);

      // Tea-aged parchment pulse scroll background
      ctx.fillStyle = '#DCC7A0';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(56, 36, 23, 0.16)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 28) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(w, midY);
      ctx.stroke();

      // Draw 3 finger position zones: Thốn - Quan - Xích
      const zoneNames = ['Thốn (Tâm/Phế)', 'Quan (Can/Tỳ)', 'Xích (Thận)'];
      ctx.fillStyle = '#5A4B3C';
      ctx.font = '600 11px "Be Vietnam Pro", sans-serif';
      zoneNames.forEach((label, idx) => {
        const zx = (w / 3) * idx + 10;
        ctx.fillText(label, zx, 16);
        if (idx > 0) {
          ctx.strokeStyle = 'rgba(156, 107, 36, 0.35)';
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

      // Draw sumi-ink / cinnabar pulse waveform
      ctx.strokeStyle = depth === 'phu' ? '#A62620' : '#23574C';
      ctx.lineWidth = 1.4 + activeStrength * 1.8;
      ctx.beginPath();

      for (let x = 0; x < w; x++) {
        const phase = ((elapsed * freq - x / 135) % 1 + 1) % 1;
        let wave = 0;
        if (phase < 0.18) {
          const p = phase / 0.18;
          wave = Math.sin(p * Math.PI);
          if (pulse.waveStyle === 'tight' || pulse.waveStyle === 'wiry') {
            wave = Math.pow(wave, 0.55); // sharp tense peak
          } else if (pulse.waveStyle === 'slippery') {
            wave = Math.sin(p * Math.PI) * 1.05;
          }
        } else if (phase < 0.34) {
          const d = (phase - 0.18) / 0.16;
          wave = Math.sin(d * Math.PI) * (pulse.waveStyle === 'thready' ? 0.18 : 0.34);
        }

        const amp = (h * 0.36) * activeStrength;
        const y = midY - wave * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [pulse, depth, activeStrength, audioPulseOn]);

  return (
    <div>
      {!hideName && (
        <div className="pulse-pillow-scene">
          <img
            src="/art/tools/pulse-pillow.jpg"
            alt="Gối bắt mạch lụa đỏ và ba ngón Thốn Quan Xích"
            className="pulse-pillow-img"
          />
          <div className="pulse-pillow-caption">
            Đặt ba ngón tay <strong>Thốn — Quan — Xích</strong> lên gối lụa đỏ, thử hai lực ấn Nông &amp; Sâu
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
        <button
          type="button"
          className={`toggle-pill ${depth === 'phu' ? 'active' : ''}`}
          onClick={() => switchDepth('phu')}
        >
          Phù thủ (Ấn nhẹ tầng nông)
        </button>
        <button
          type="button"
          className={`toggle-pill ${depth === 'tram' ? 'active' : ''}`}
          onClick={() => switchDepth('tram')}
        >
          Trầm thủ (Ấn sâu sát cốt)
        </button>
        <button
          type="button"
          className="btn-secondary"
          style={{ padding: '4px 10px', fontSize: '0.8rem' }}
          onClick={() => setAudioPulseOn((v) => !v)}
        >
          {audioPulseOn ? 'Tắt nhịp đập' : 'Nghe nhịp mạch'}
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={480}
        height={118}
        style={{
          width: '100%',
          height: '118px',
          border: '2px solid #5A3E28',
          borderRadius: '3px',
          display: 'block'
        }}
      />

      <div style={{ marginTop: '8px', fontSize: '0.86rem' }}>
        {!hideName && (
          <div style={{ fontWeight: 700, color: '#221B15' }}>
            {pulse.name} ({pulse.bpm} nhịp/phút)
          </div>
        )}
        <div style={{ color: '#5A4B3C', marginTop: '2px' }}>
          {depth === 'phu' ? `Cảm nhận Phù thủ: ${pulse.phuFinding}` : `Cảm nhận Trầm thủ: ${pulse.tramFinding}`}
        </div>
      </div>
    </div>
  );
};
