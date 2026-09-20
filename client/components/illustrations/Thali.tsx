import { cn } from '@/lib/utils';

/**
 * A top-down thali: rotis, rice, dal, sabzi and curd on a steel plate.
 * The hero's only image, so it is drawn as vector and scales to any screen.
 */
export function Thali({ className, idPrefix = 'thali' }: { className?: string; idPrefix?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      role="img"
      aria-label="An Indian thali with rotis, rice, dal, vegetables and curd"
      className={cn('size-full', className)}
    >
      <defs>
        <radialGradient id={`${idPrefix}-plate`} cx="0.36" cy="0.3" r="0.86">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="70%" stopColor="#F3F5F4" />
          <stop offset="100%" stopColor="#DFE5E2" />
        </radialGradient>
        <linearGradient id={`${idPrefix}-dal`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#FDB022" />
          <stop offset="100%" stopColor="#DC6803" />
        </linearGradient>
        <linearGradient id={`${idPrefix}-sabzi`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#32D583" />
          <stop offset="100%" stopColor="#027A48" />
        </linearGradient>
        <linearGradient id={`${idPrefix}-roti`} x1="0.2" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor="#F7E3BC" />
          <stop offset="100%" stopColor="#DFB877" />
        </linearGradient>
        <radialGradient id={`${idPrefix}-rice`} cx="0.4" cy="0.32" r="0.75">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#EDE8DA" />
        </radialGradient>
        <linearGradient id={`${idPrefix}-steel`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F4F6F5" />
          <stop offset="100%" stopColor="#DCE3DF" />
        </linearGradient>
      </defs>

      {/* plate */}
      <ellipse cx="200" cy="360" rx="148" ry="18" fill="#04452B" opacity="0.2" />
      <circle cx="200" cy="198" r="184" fill={`url(#${idPrefix}-plate)`} />
      <circle cx="200" cy="198" r="184" fill="none" stroke="#D2DAD6" strokeWidth="2" />
      <circle cx="200" cy="198" r="164" fill="none" stroke="#E9EEEB" strokeWidth="4" />
      <path d="M58 116a172 172 0 0 1 92-70" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.85" />

      {/* rotis, with one folded on top so the shape reads */}
      <g>
        <ellipse cx="134" cy="132" rx="62" ry="54" fill="#D9B379" />
        <ellipse cx="130" cy="124" rx="62" ry="54" fill={`url(#${idPrefix}-roti)`} />
        <g fill="#C4934F" opacity="0.5">
          <ellipse cx="108" cy="108" rx="8" ry="5.5" />
          <ellipse cx="146" cy="116" rx="5.5" ry="4" />
          <ellipse cx="120" cy="142" rx="6.5" ry="4.5" />
          <ellipse cx="154" cy="140" rx="4.5" ry="3.5" />
          <ellipse cx="92" cy="130" rx="5" ry="3.5" />
        </g>
        <path d="M96 96a62 54 0 0 1 62-22 62 54 0 0 0-62 22Z" fill="#FFFFFF" opacity="0.4" />
        <path d="M150 92c22 6 34 20 36 42-20-4-32-18-36-42Z" fill="#EFD3A3" stroke="#D4A968" strokeWidth="2" strokeLinejoin="round" />
      </g>

      {/* rice */}
      <g>
        <circle cx="146" cy="252" r="58" fill={`url(#${idPrefix}-rice)`} />
        <path d="M88 252a58 58 0 0 1 96-44 58 58 0 0 0-84 62Z" fill="#FFFFFF" opacity="0.8" />
        <g stroke="#DED7C3" strokeWidth="3.4" strokeLinecap="round">
          <path d="M120 236l11-6" />
          <path d="M150 226l12 4" />
          <path d="M128 268l13 2" />
          <path d="M166 258l10-7" />
          <path d="M144 290l12-5" />
          <path d="M112 274l9 6" />
          <path d="M176 280l8-8" />
        </g>
      </g>

      {/* dal katori */}
      <g>
        <circle cx="284" cy="126" r="54" fill={`url(#${idPrefix}-steel)`} />
        <circle cx="284" cy="126" r="54" fill="none" stroke="#C9D3CE" strokeWidth="2" />
        <circle cx="284" cy="126" r="44" fill="#CBD5D0" />
        <circle cx="284" cy="126" r="40" fill={`url(#${idPrefix}-dal)`} />
        <path d="M250 114a40 40 0 0 1 46-22 40 40 0 0 0-46 22Z" fill="#FFFFFF" opacity="0.3" />
        <g fill="#B54708" opacity="0.5">
          <circle cx="270" cy="134" r="4.5" />
          <circle cx="294" cy="142" r="3.5" />
          <circle cx="298" cy="114" r="4" />
        </g>
      </g>

      {/* sabzi katori */}
      <g>
        <circle cx="302" cy="250" r="50" fill={`url(#${idPrefix}-steel)`} />
        <circle cx="302" cy="250" r="50" fill="none" stroke="#C9D3CE" strokeWidth="2" />
        <circle cx="302" cy="250" r="41" fill="#CBD5D0" />
        <circle cx="302" cy="250" r="37" fill={`url(#${idPrefix}-sabzi)`} />
        <g fill="#D1FADF" opacity="0.9">
          <circle cx="290" cy="242" r="5.5" />
          <circle cx="310" cy="236" r="4.5" />
          <circle cx="314" cy="260" r="6" />
          <circle cx="292" cy="264" r="4.5" />
        </g>
        <path d="M274 242a37 37 0 0 1 38-18 37 37 0 0 0-38 18Z" fill="#FFFFFF" opacity="0.28" />
      </g>

      {/* curd katori */}
      <g>
        <circle cx="222" cy="320" r="46" fill={`url(#${idPrefix}-steel)`} />
        <circle cx="222" cy="320" r="46" fill="none" stroke="#C9D3CE" strokeWidth="2" />
        <circle cx="222" cy="320" r="37" fill="#E7EBE9" />
        <circle cx="222" cy="320" r="34" fill="#FFFFFF" />
        <path d="M203 311c9-7 22-8 33-3" stroke="#E6EBE8" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M209 330c8 5 18 6 27 2" stroke="#EFF2F0" strokeWidth="5" strokeLinecap="round" fill="none" />
      </g>

      {/* lemon, chutney and a spoon */}
      <g>
        <circle cx="104" cy="326" r="26" fill="#FEDF89" />
        <circle cx="104" cy="326" r="26" fill="none" stroke="#DC6803" strokeWidth="2" opacity="0.5" />
        <g stroke="#FFFFFF" strokeWidth="3.4" strokeLinecap="round" opacity="0.95">
          <path d="M104 304v44" />
          <path d="M82 326h44" />
          <path d="M88 310l32 32" />
          <path d="M120 310l-32 32" />
        </g>
        <circle cx="104" cy="326" r="4" fill="#FFFFFF" />
        <path d="M150 342c15-7 28-3 36 8-13 7-28 4-36-8Z" fill="#12B76A" />
        <g transform="rotate(-18 340 330)">
          <rect x="332" y="300" width="7" height="58" rx="3.5" fill="#DCE3DF" />
          <ellipse cx="335.5" cy="296" rx="12" ry="15" fill="#E9EEEB" stroke="#D2DAD6" strokeWidth="1.5" />
        </g>
      </g>
    </svg>
  );
}
