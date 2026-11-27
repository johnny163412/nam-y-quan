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
          <div className="fold-seal-label">Tuệ Tâm Đường · Bốc Đủ Thang</div>
        </div>
        <p className="fold-caption">Đang gấp 4 góc Giấy Hồng Điều &amp; thắt dây gai mang sang Lò sắc...</p>
      </div>
    </div>
  );
};
