import React from 'react';
import { Herb } from '../types/tcm';
import { BotanicalSvg } from './svg/BotanicalSvg';

interface PaperFoldOverlayProps {
  visible: boolean;
  herbs: Herb[];
}

export const PaperFoldOverlay: React.FC<PaperFoldOverlayProps> = ({ visible, herbs }) => {
  if (!visible) return null;

  return (
    <div className="paper-fold-backdrop" aria-live="polite" aria-label="Đang gói thang thuốc vào giấy hồng điều">
      <div className="paper-fold-stage">
        <div className="fold-sheet">
          <div className="fold-herbs-cluster">
            {herbs.map((h) => (
              <BotanicalSvg key={h.id} herbId={h.id} motif={h.motif} size={46} bare />
            ))}
          </div>
          <div className="fold-flap flap-top" />
          <div className="fold-flap flap-right" />
          <div className="fold-flap flap-bottom" />
          <div className="fold-flap flap-left" />
          {/* Painted Red Herb Packet reveals cleanly once the 4 corners fold inward */}
          <img
            src="/art/tools/red-herb-packet.jpg"
            alt="Gói thuốc Giấy Hồng Điều thắt dây gai"
            className="fold-painted-reveal"
          />
          <svg
            viewBox="0 0 220 220"
            className="hemp-twine-svg"
            aria-hidden="true"
          >
            <line x1="110" y1="12" x2="110" y2="208" className="twine-strand vertical" />
            <line x1="12" y1="110" x2="208" y2="110" className="twine-strand horizontal" />
            <circle cx="110" cy="110" r="6" className="twine-knot" />
            <path d="M110 110 Q92 92 84 102 Q96 112 110 110 Z" className="twine-bow" />
            <path d="M110 110 Q128 92 136 102 Q124 112 110 110 Z" className="twine-bow" />
          </svg>
          <div className="fold-seal-label">Tuệ Tâm Đường · Bốc Đủ Thang</div>
        </div>
        <p className="fold-caption">Đang gấp 4 góc Giấy Hồng Điều &amp; thắt dây gai mang sang Lò sắc...</p>
      </div>
    </div>
  );
};
