import React from 'react';
import { BotanicalMotif } from '../../types/tcm';

export const PAINTED_HERB_IDS = new Set([
  'tia-to',
  'kinh-gioi',
  'sinh-khuong',
  'bac-ha',
  'kim-ngan-hoa',
  'cuc-hoa',
  'cat-can',
  'cam-thao',
  'tran-bi',
  'hoai-son',
  'dinh-lang',
  'ngai-cuu',
  'lac-tien',
  'tam-sen',
  'ky-tu',
  'nhan-tran',
  'la-lot',
  'co-xuoc',
  'que-chi',
  'dan-sam'
]);

interface BotanicalSvgProps {
  motif: BotanicalMotif;
  herbId?: string;
  size?: number;
}

export const BotanicalSvg: React.FC<BotanicalSvgProps> = ({ motif, herbId, size = 34 }) => {
  if (herbId && PAINTED_HERB_IDS.has(herbId)) {
    return (
      <img
        src={`/art/herbs/${herbId}.jpg`}
        alt=""
        loading="lazy"
        className="botanical-ink-img"
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          mixBlendMode: 'multiply',
          borderRadius: '4px',
          flexShrink: 0
        }}
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <radialGradient id="wash-green" cx="42%" cy="38%" r="60%">
          <stop offset="0%" stopColor="#9EC397" stopOpacity="0.88" />
          <stop offset="100%" stopColor="#3B6E52" stopOpacity="0.62" />
        </radialGradient>
        <radialGradient id="wash-gold" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#F8DF8A" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#C47E2C" stopOpacity="0.72" />
        </radialGradient>
        <radialGradient id="wash-red" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#DC5E4A" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#8F221C" stopOpacity="0.8" />
        </radialGradient>
        <radialGradient id="wash-root" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#E4C99E" stopOpacity="0.88" />
          <stop offset="100%" stopColor="#9C7147" stopOpacity="0.68" />
        </radialGradient>
      </defs>

      <circle cx="24" cy="24" r="21" fill="#EFE4CC" fillOpacity="0.48" />

      <g filter="url(#ink-brush-soft)" strokeLinecap="round" strokeLinejoin="round">
        {motif === 'leaf-serrated' && (
          <>
            <path
              d="M25 8 C15 14 11 23 13 33 C15 38 20 40 25 41 C31 40 36 37 37 32 C39 22 33 13 25 8 Z"
              fill="url(#wash-green)"
            />
            <path
              d="M24 7 C19 10 15 13 13 18 C11 21 13 23 11 26 C10 29 12 31 12 34 C14 38 19 40 24 41 C29 40 34 38 36 34 C36 31 38 29 37 26 C35 23 37 21 35 18 C33 13 29 10 24 7 Z"
              stroke="#2F231A"
              strokeWidth="1.45"
            />
            <path d="M24 9 C23.5 18 24.5 30 23.5 43" stroke="#2F231A" strokeWidth="1.4" />
            <path
              d="M24 18 Q19 16 15 15 M24 24 Q18 22 14 22 M24 30 Q18 29 15 30 M24 18 Q29 16 33 15 M24 24 Q30 22 34 22 M24 30 Q30 29 33 30"
              stroke="#23574C"
              strokeWidth="1.1"
            />
          </>
        )}

        {motif === 'leaf-aromatic' && (
          <>
            <path d="M23 42 C24 32 23 22 25 11" stroke="#2F231A" strokeWidth="1.45" />
            <path d="M23 26 C17 26 11 24 9 20 C13 17 19 19 23 26 Z" fill="url(#wash-green)" stroke="#2F231A" strokeWidth="1.3" />
            <path d="M24 25 C30 25 36 23 39 18 C34 16 28 18 24 25 Z" fill="url(#wash-green)" stroke="#2F231A" strokeWidth="1.3" />
            <path d="M24 16 C19 15 15 13 13 10 C17 8 21 11 24 16 Z" fill="url(#wash-green)" stroke="#2F231A" strokeWidth="1.25" />
            <path d="M25 15 C30 14 34 12 36 9 C32 7 28 10 25 15 Z" fill="url(#wash-green)" stroke="#2F231A" strokeWidth="1.25" />
            <path d="M23 34 Q18 32 15 30" stroke="#23574C" strokeWidth="1.15" />
          </>
        )}

        {motif === 'rhizome' && (
          <>
            <path
              d="M11 30 C10 24 15 20 20 22 C22 16 28 14 32 19 C38 17 41 23 38 28 C36 33 30 35 24 33 C19 37 12 35 11 30 Z"
              fill="url(#wash-gold)"
              stroke="#2F231A"
              strokeWidth="1.45"
            />
            <path
              d="M16 25 C18 26 19 29 18 31 M25 21 C27 23 27 27 26 29 M32 24 C34 25 34 28 33 29"
              stroke="#5A4B3C"
              strokeWidth="1.1"
            />
          </>
        )}

        {motif === 'flower-cluster' && (
          <>
            <path d="M23 42 C24 33 21 26 15 20 M24 35 C27 27 32 22 36 17" stroke="#23574C" strokeWidth="1.4" />
            <path d="M10 17 C12 12 17 12 19 16 C17 20 12 20 10 17 Z" fill="url(#wash-gold)" stroke="#2F231A" strokeWidth="1.25" />
            <path d="M19 13 C22 8 28 9 29 14 C27 18 21 18 19 13 Z" fill="#F8E9B4" stroke="#2F231A" strokeWidth="1.25" />
            <path d="M30 16 C33 11 38 12 39 17 C36 21 31 20 30 16 Z" fill="url(#wash-gold)" stroke="#2F231A" strokeWidth="1.25" />
            <path d="M15 14 L13 11 M25 11 L26 8 M35 13 L37 10" stroke="#A62620" strokeWidth="1.1" />
          </>
        )}

        {motif === 'flower-daisy' && (
          <>
            <path d="M24 32 C24 37 23 40 24 43" stroke="#23574C" strokeWidth="1.5" />
            <path
              d="M24 9 C27 12 32 10 34 14 C38 16 37 21 39 24 C36 27 35 32 30 32 C27 35 21 35 18 32 C13 32 12 27 9 24 C11 20 10 16 14 14 C16 10 21 12 24 9 Z"
              fill="url(#wash-gold)"
              stroke="#2F231A"
              strokeWidth="1.25"
            />
            <path
              d="M19 22 C19 18 22 16 25 17 C29 17 30 21 29 24 C28 28 23 28 20 26 C19 25 19 23 19 22 Z"
              fill="#C77C28"
              stroke="#2F231A"
              strokeWidth="1.35"
            />
          </>
        )}

        {motif === 'peel-curl' && (
          <>
            <path
              d="M13 29 C12 18 22 11 31 15 C37 17 38 24 33 29 C28 32 21 30 20 25 C19 21 24 19 28 21"
              stroke="#B85C1E"
              strokeWidth="4.4"
              fill="none"
            />
            <path
              d="M13 29 C12 18 22 11 31 15 C37 17 38 24 33 29 C28 32 21 30 20 25"
              stroke="#2F231A"
              strokeWidth="1.2"
              fill="none"
            />
          </>
        )}

        {motif === 'root-tuber' && (
          <>
            <path
              d="M24 8 C19 14 17 24 20 34 C21 38 23 41 24 42 C25 41 27 38 28 34 C31 24 29 14 24 8 Z"
              fill={herbId === 'dan-sam' ? 'url(#wash-red)' : 'url(#wash-root)'}
              stroke="#2F231A"
              strokeWidth="1.45"
            />
            <path
              d="M20 20 Q24 21 28 20 M19 27 Q24 28 29 27 M21 34 Q24 35 27 34 M20 38 Q16 40 15 43 M27 37 Q31 40 32 43"
              stroke="#5A4B3C"
              strokeWidth="1.1"
            />
          </>
        )}

        {motif === 'vine-tendril' && (
          <>
            <path d="M12 38 C16 27 22 24 26 17 C29 12 35 11 38 15 C40 18 37 22 33 20" stroke="#23574C" strokeWidth="1.5" fill="none" />
            <path
              d="M20 24 C20 19 24 17 28 19 C32 21 32 26 28 29 C24 31 20 28 20 24 Z"
              fill="#9E7CB2"
              fillOpacity="0.58"
              stroke="#2F231A"
              strokeWidth="1.3"
            />
            <path d="M16 32 Q11 29 11 24 Q16 25 18 29" fill="url(#wash-green)" stroke="#2F231A" strokeWidth="1.2" />
          </>
        )}

        {motif === 'seed-core' && (
          <>
            <path
              d="M24 10 C18 17 17 29 24 38 C31 29 30 17 24 10 Z"
              fill="url(#wash-green)"
              stroke="#2F231A"
              strokeWidth="1.45"
            />
            <path d="M24 11 C23 19 25 29 24 37" stroke="#23574C" strokeWidth="1.35" />
          </>
        )}

        {motif === 'berry-cluster' && (
          <>
            <path d="M24 9 C24 15 23 19 24 23 M24 17 L18 22 M24 16 L30 20" stroke="#5A4B3C" strokeWidth="1.4" />
            <path d="M14 27 C14 22 21 21 22 27 C22 32 15 33 14 27 Z" fill="url(#wash-red)" stroke="#2F231A" strokeWidth="1.25" />
            <path d="M25 25 C25 20 32 19 33 25 C33 30 26 31 25 25 Z" fill="url(#wash-red)" stroke="#2F231A" strokeWidth="1.25" />
            <path d="M19 34 C19 29 26 28 27 34 C27 39 20 40 19 34 Z" fill="url(#wash-red)" stroke="#2F231A" strokeWidth="1.25" />
          </>
        )}

        {motif === 'bark-quill' && (
          <>
            <path
              d="M15 15 C14 23 14 31 15 37 C20 39 29 39 34 36 C35 28 34 20 33 14 C28 12 19 12 15 15 Z"
              fill="#9C5732"
              fillOpacity="0.78"
              stroke="#2F231A"
              strokeWidth="1.45"
            />
            <path d="M16 15 Q24 18 32 15" stroke="#C58255" strokeWidth="2.4" />
            <path d="M20 21 C19.5 26 20 31 20 34 M28 21 C28.5 26 28 31 28 34" stroke="#4D2915" strokeWidth="1.15" />
          </>
        )}
      </g>
    </svg>
  );
};
