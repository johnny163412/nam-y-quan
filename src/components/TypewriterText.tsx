import React, { useEffect, useState } from 'react';
import { apothecaryAudio, VoiceArchetype } from '../engine/audio';
import { GlossaryText } from './GlossaryText';

interface TypewriterTextProps {
  text: string;
  voice?: VoiceArchetype;
  instant?: boolean;
  speedMs?: number;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  voice = 'merchant',
  instant = false,
  speedMs = 20
}) => {
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const [shownCount, setShownCount] = useState<number>(
    instant || reducedMotion ? text.length : 0
  );

  useEffect(() => {
    if (instant || reducedMotion) {
      setShownCount(text.length);
      return;
    }
    setShownCount(0);
    let idx = 0;
    const timer = window.setInterval(() => {
      idx += 2;
      if (idx >= text.length) {
        setShownCount(text.length);
        window.clearInterval(timer);
        return;
      }
      setShownCount(idx);
      const ch = text[idx - 1];
      if (ch && ch !== ' ' && idx % 6 === 0) {
        apothecaryAudio.playVoiceBlip(voice);
      }
    }, speedMs);

    return () => window.clearInterval(timer);
  }, [text, instant, reducedMotion, speedMs, voice]);

  const isDone = shownCount >= text.length;

  return (
    <span
      className={`typewriter-span ${isDone ? 'is-done' : 'is-typing'}`}
      onClick={() => {
        if (!isDone) setShownCount(text.length);
      }}
      title={isDone ? undefined : 'Chạm để hiện trọn câu ngay'}
    >
      {isDone ? <GlossaryText text={text} /> : text.slice(0, shownCount)}
      {!isDone && <span className="typewriter-caret" aria-hidden="true">▍</span>}
    </span>
  );
};
