import React from 'react';
import { BotanicalMotif } from '../../types/tcm';

interface BotanicalSvgProps {
  motif: BotanicalMotif;
  size?: number;
}

export const BotanicalSvg: React.FC<BotanicalSvgProps> = ({ motif, size = 34 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      {motif === 'leaf-serrated' && (
        <>
          <path
            d="M24 6C15 12 10 22 12 33C14 37 19 40 24 41C29 40 34 37 36 33C38 22 33 12 24 6Z"
            fill="#8DB38B"
            fillOpacity="0.45"
            stroke="#221B15"
            strokeWidth="1.6"
          />
          <path d="M24 8V43" stroke="#221B15" strokeWidth="1.5" />
          <path d="M24 18L16 14M24 24L15 21M24 30L16 28M24 18L32 14M24 24L33 21M24 30L32 28" stroke="#23574C" strokeWidth="1.2" />
        </>
      )}
      {motif === 'leaf-aromatic' && (
        <>
          <path d="M24 42V14" stroke="#221B15" strokeWidth="1.6" />
          <ellipse cx="16" cy="24" rx="7" ry="4" transform="rotate(-25 16 24)" fill="#7AA887" fillOpacity="0.5" stroke="#221B15" strokeWidth="1.4" />
          <ellipse cx="32" cy="24" rx="7" ry="4" transform="rotate(25 32 24)" fill="#7AA887" fillOpacity="0.5" stroke="#221B15" strokeWidth="1.4" />
          <ellipse cx="18" cy="14" rx="5.5" ry="3.2" transform="rotate(-20 18 14)" fill="#7AA887" fillOpacity="0.5" stroke="#221B15" strokeWidth="1.4" />
          <ellipse cx="30" cy="14" rx="5.5" ry="3.2" transform="rotate(20 30 14)" fill="#7AA887" fillOpacity="0.5" stroke="#221B15" strokeWidth="1.4" />
        </>
      )}
      {motif === 'rhizome' && (
        <>
          <path
            d="M10 29C10 23 15 20 20 22C22 17 28 15 32 19C37 18 40 23 38 28C36 33 29 35 24 33C19 36 11 34 10 29Z"
            fill="#D8AF63"
            fillOpacity="0.58"
            stroke="#221B15"
            strokeWidth="1.6"
          />
          <path d="M16 25C18 26 19 28 18 30M26 22C28 24 28 27 27 29" stroke="#5A4B3C" strokeWidth="1.2" />
        </>
      )}
      {motif === 'flower-cluster' && (
        <>
          <path d="M24 41C24 31 20 25 15 20M24 34C27 26 32 22 36 17" stroke="#23574C" strokeWidth="1.5" />
          <circle cx="14" cy="16" r="4" fill="#F2D16B" stroke="#221B15" strokeWidth="1.4" />
          <circle cx="24" cy="12" r="4.5" fill="#F6E5A7" stroke="#221B15" strokeWidth="1.4" />
          <circle cx="35" cy="15" r="4" fill="#F2D16B" stroke="#221B15" strokeWidth="1.4" />
        </>
      )}
      {motif === 'flower-daisy' && (
        <>
          <circle cx="24" cy="22" r="12" fill="#F3C65F" fillOpacity="0.4" stroke="#221B15" strokeWidth="1.4" strokeDasharray="3 2" />
          <circle cx="24" cy="22" r="6" fill="#C77C28" stroke="#221B15" strokeWidth="1.5" />
          <path d="M24 34V43" stroke="#23574C" strokeWidth="1.6" />
        </>
      )}
      {motif === 'peel-curl' && (
        <>
          <path
            d="M13 28C13 18 22 12 31 15C36 17 37 24 32 28C28 31 21 30 20 25C19 21 24 19 27 21"
            stroke="#B65B1E"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M13 28C13 18 22 12 31 15C36 17 37 24 32 28"
            stroke="#221B15"
            strokeWidth="1.2"
            fill="none"
          />
        </>
      )}
      {motif === 'root-tuber' && (
        <>
          <path
            d="M24 8C19 14 17 24 20 34C21 38 23 41 24 42C25 41 27 38 28 34C31 24 29 14 24 8Z"
            fill="#C7A67B"
            fillOpacity="0.6"
            stroke="#221B15"
            strokeWidth="1.6"
          />
          <path d="M20 20H28M19 27H29M21 34H27" stroke="#5A4B3C" strokeWidth="1.1" />
        </>
      )}
      {motif === 'vine-tendril' && (
        <>
          <path d="M12 37C16 26 22 24 26 17C29 12 34 11 37 15" stroke="#23574C" strokeWidth="1.7" fill="none" />
          <circle cx="26" cy="24" r="6" fill="#A682B5" fillOpacity="0.45" stroke="#221B15" strokeWidth="1.4" />
          <path d="M35 16C38 18 37 22 33 21" stroke="#23574C" strokeWidth="1.3" fill="none" />
        </>
      )}
      {motif === 'seed-core' && (
        <>
          <path d="M24 11C18 17 17 28 24 37C31 28 30 17 24 11Z" fill="#5D8C6B" fillOpacity="0.55" stroke="#221B15" strokeWidth="1.5" />
          <path d="M24 11V37" stroke="#23574C" strokeWidth="1.4" />
        </>
      )}
      {motif === 'berry-cluster' && (
        <>
          <path d="M24 10V22" stroke="#5A4B3C" strokeWidth="1.5" />
          <ellipse cx="18" cy="27" rx="4.5" ry="6" fill="#A62620" fillOpacity="0.82" stroke="#221B15" strokeWidth="1.4" />
          <ellipse cx="29" cy="25" rx="4.5" ry="6" fill="#A62620" fillOpacity="0.82" stroke="#221B15" strokeWidth="1.4" />
          <ellipse cx="23" cy="33" rx="4.5" ry="6" fill="#C43B31" fillOpacity="0.85" stroke="#221B15" strokeWidth="1.4" />
        </>
      )}
      {motif === 'bark-quill' && (
        <>
          <rect x="14" y="13" width="20" height="24" rx="4" fill="#8C5230" fillOpacity="0.65" stroke="#221B15" strokeWidth="1.6" />
          <ellipse cx="24" cy="15" rx="8" ry="3" fill="#B5754A" stroke="#221B15" strokeWidth="1.3" />
          <path d="M19 22V33M29 22V33" stroke="#4D2915" strokeWidth="1.2" />
        </>
      )}
    </svg>
  );
};
