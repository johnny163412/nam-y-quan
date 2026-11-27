import React, { useEffect, useRef, useState } from 'react';

interface BrushSignaturePadProps {
  signature?: string;
  onSave: (dataUrl: string | null) => void;
}

const W = 300;
const H = 100;

/** Optional brush-ink signature: slow strokes pool thick ink, fast flicks thin out like a real hair brush. */
export const BrushSignaturePad: React.FC<BrushSignaturePadProps> = ({ signature, onSave }) => {
  const [open, setOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const last = useRef<{ x: number; y: number; t: number; w: number } | null>(null);
  const dirty = useRef(false);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!open || !cv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W * dpr;
    cv.height = H * dpr;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    if (signature) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, W, H);
      img.src = signature;
    }
  }, [open, signature]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H, t: e.timeStamp };
  };

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    last.current = { ...point(e), w: 4.2 };
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const prev = last.current;
    const ctx = canvasRef.current?.getContext('2d');
    if (!prev || !ctx) return;
    const p = point(e);
    const dist = Math.hypot(p.x - prev.x, p.y - prev.y);
    if (dist < 0.8) return;
    const speed = dist / Math.max(1, p.t - prev.t);
    const target = Math.max(1.1, Math.min(5.5, 5.5 - speed * 2.6));
    const w = prev.w + (target - prev.w) * 0.35;
    ctx.strokeStyle = 'rgba(28, 18, 10, 0.92)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    dirty.current = true;
    last.current = { ...p, w };
  };

  const up = () => {
    last.current = null;
    if (dirty.current && canvasRef.current) {
      dirty.current = false;
      onSave(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clear = () => {
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.clearRect(0, 0, W, H);
    onSave(null);
  };

  return (
    <div className="brush-signature">
      <button type="button" className="hud-scroll-btn" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {signature ? 'Chữ ký lương y (đã ký)' : 'Ký tên lương y (tuỳ chọn)'}
      </button>
      {open && (
        <div className="brush-signature-sheet">
          <canvas
            ref={canvasRef}
            className="brush-signature-canvas"
            aria-label="Khung ký tên bằng bút lông"
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
          />
          <button type="button" className="btn-secondary" onClick={clear}>
            Xoá chữ ký
          </button>
        </div>
      )}
    </div>
  );
};
