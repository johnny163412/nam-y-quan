import React from 'react';

export interface FloatingCallout {
  id: number;
  text: string;
  tone?: 'gold' | 'jade' | 'cinnabar';
}

interface FloatingJuiceLayerProps {
  callouts: FloatingCallout[];
}

export const FloatingJuiceLayer: React.FC<FloatingJuiceLayerProps> = ({ callouts }) => {
  if (callouts.length === 0) return null;
  return (
    <div className="floating-juice-layer" aria-live="polite" aria-atomic="false">
      {callouts.map((c, idx) => (
        <div
          key={c.id}
          className={`floating-juice-chip tone-${c.tone ?? 'gold'}`}
          style={{ ['--stack-offset' as string]: `${idx * 4}px` }}
        >
          {c.text}
        </div>
      ))}
    </div>
  );
};
