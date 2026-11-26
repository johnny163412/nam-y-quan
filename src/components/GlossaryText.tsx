import React, { useEffect, useRef, useState } from 'react';
import { GlossaryTerm, segmentTextWithGlossary } from '../data/glossary';

interface GlossaryTextProps {
  text: string;
}

export const GlossaryText: React.FC<GlossaryTextProps> = ({ text }) => {
  const [active, setActive] = useState<{
    entry: GlossaryTerm;
    left: number;
    top: number;
    openUpward?: boolean;
  } | null>(null);
  const containerRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null);
    };
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActive(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleOutside);
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [active]);

  const segments = segmentTextWithGlossary(text);

  const openTerm = (entry: GlossaryTerm, el: HTMLElement) => {
    const wrap = containerRef.current;
    if (!wrap) return;
    if (active?.entry.id === entry.id) {
      setActive(null);
      return;
    }
    const wRect = wrap.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    const popoverW = 280;
    const rawLeft = eRect.left - wRect.left + eRect.width / 2 - popoverW / 2;
    const maxLeft = Math.max(4, wrap.clientWidth - popoverW - 4);
    const clampedLeft = Math.max(4, Math.min(maxLeft, rawLeft));
    const openUpward = typeof window !== 'undefined' && window.innerHeight - eRect.bottom < 170;
    setActive({
      entry,
      left: clampedLeft,
      top: openUpward ? eRect.top - wRect.top - 6 : eRect.bottom - wRect.top + 6,
      openUpward
    });
  };

  return (
    <span ref={containerRef} className="glossary-wrap">
      {segments.map((seg, idx) =>
        seg.entry ? (
          <button
            key={`${seg.entry.id}-${idx}`}
            type="button"
            className={`glossary-term ${active?.entry.id === seg.entry.id ? 'is-active' : ''}`}
            onClick={(e) => openTerm(seg.entry!, e.currentTarget)}
            title="Chạm để xem chú giải Đông y đời thường"
          >
            {seg.text}
          </button>
        ) : (
          <React.Fragment key={idx}>{seg.text}</React.Fragment>
        )
      )}

      {active && (
        <span
          className="glossary-marginalia"
          role="dialog"
          aria-label={`Chú giải: ${active.entry.term}`}
          style={{
            left: `${active.left}px`,
            top: `${active.top}px`,
            transform: active.openUpward ? 'translateY(-100%)' : undefined
          }}
        >
          <span className="glossary-pop-head">
            <span>{active.entry.term}</span>
            <span className="glossary-pop-cat">{active.entry.category}</span>
          </span>
          <span className="glossary-pop-body">
            <span>{active.entry.plainMeaning}</span>
            <span className="glossary-pop-ex">{active.entry.everydayExample}</span>
          </span>
        </span>
      )}
    </span>
  );
};
