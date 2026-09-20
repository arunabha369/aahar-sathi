import { cn } from '@/lib/utils';

const frame = (className?: string) => ({
  viewBox: '0 0 168 132',
  'aria-hidden': true as const,
  className: cn('h-auto w-full', className),
});

/** Step 1 — the profile form. */
export function ProfileScene({ className }: { className?: string }) {
  return (
    <svg {...frame(className)}>
      <rect x="8" y="10" width="126" height="112" rx="14" fill="#FFFFFF" stroke="#E3E8E5" strokeWidth="2" />
      <circle cx="34" cy="38" r="14" fill="#D1FADF" />
      <circle cx="34" cy="33.5" r="5.5" fill="#039855" />
      <path d="M24.5 48a10 10 0 0 1 19 0Z" fill="#039855" />
      <rect x="56" y="28" width="58" height="7" rx="3.5" fill="#E3E8E5" />
      <rect x="56" y="41" width="40" height="7" rx="3.5" fill="#EEF1EF" />
      <rect x="24" y="64" width="94" height="14" rx="7" fill="#F6F7F5" stroke="#E3E8E5" strokeWidth="1.5" />
      <rect x="30" y="68.5" width="34" height="5" rx="2.5" fill="#CFD8D4" />
      <rect x="24" y="86" width="94" height="14" rx="7" fill="#F6F7F5" stroke="#E3E8E5" strokeWidth="1.5" />
      <rect x="30" y="90.5" width="52" height="5" rx="2.5" fill="#CFD8D4" />
      <rect x="24" y="108" width="44" height="6" rx="3" fill="#D1FADF" />
      <g>
        <rect x="120" y="58" width="40" height="40" rx="12" fill="#FDB022" />
        <path d="M133 78h14" stroke="#FFFFFF" strokeWidth="3.4" strokeLinecap="round" />
        <path d="M140 71v14" stroke="#FFFFFF" strokeWidth="3.4" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** Step 2 — the calculation. */
export function MathsScene({ className }: { className?: string }) {
  return (
    <svg {...frame(className)}>
      <rect x="10" y="14" width="148" height="104" rx="14" fill="#FFFFFF" stroke="#E3E8E5" strokeWidth="2" />
      <rect x="24" y="28" width="52" height="8" rx="4" fill="#E3E8E5" />
      <g>
        <rect x="24" y="76" width="16" height="26" rx="5" fill="#A6F4C5" />
        <rect x="46" y="62" width="16" height="40" rx="5" fill="#6CE9A6" />
        <rect x="68" y="50" width="16" height="52" rx="5" fill="#12B76A" />
        <rect x="90" y="58" width="16" height="44" rx="5" fill="#039855" />
        <rect x="112" y="44" width="16" height="58" rx="5" fill="#027A48" />
      </g>
      <path d="M22 44h124" stroke="#E3E8E5" strokeWidth="2" strokeDasharray="0" />
      <g>
        <rect x="104" y="18" width="52" height="24" rx="12" fill="#0E1A16" />
        <text x="130" y="34" textAnchor="middle" fontFamily="sans-serif" fontSize="12" fontWeight="700" fill="#FFFFFF">
          BMR
        </text>
      </g>
      <path d="M136 92c4.4-3 6.2-6.4 5.4-10.2 3.8 2.8 5.6 6.2 5.4 10.2a5.4 5.4 0 0 1-10.8 0Z" fill="#F79009" />
    </svg>
  );
}

/** Step 3 — the week of meals. */
export function PlanScene({ className }: { className?: string }) {
  return (
    <svg {...frame(className)}>
      <rect x="10" y="12" width="148" height="108" rx="14" fill="#FFFFFF" stroke="#E3E8E5" strokeWidth="2" />
      <rect x="10" y="12" width="148" height="22" rx="14" fill="#F6F7F5" />
      <rect x="10" y="26" width="148" height="8" fill="#F6F7F5" />
      <g fill="#CFD8D4">
        {[26, 46, 66, 86, 106, 126].map((x) => (
          <rect key={x} x={x} y="19" width="12" height="6" rx="3" />
        ))}
      </g>
      <g>
        <rect x="22" y="42" width="60" height="30" rx="9" fill="#ECFDF3" stroke="#A6F4C5" strokeWidth="1.5" />
        <circle cx="37" cy="57" r="8" fill="#12B76A" />
        <rect x="50" y="51" width="26" height="5" rx="2.5" fill="#A6F4C5" />
        <rect x="50" y="60" width="18" height="5" rx="2.5" fill="#D1FADF" />
      </g>
      <g>
        <rect x="88" y="42" width="58" height="30" rx="9" fill="#FFF8EB" stroke="#FEDF89" strokeWidth="1.5" />
        <circle cx="103" cy="57" r="8" fill="#FDB022" />
        <rect x="116" y="51" width="24" height="5" rx="2.5" fill="#FEDF89" />
        <rect x="116" y="60" width="16" height="5" rx="2.5" fill="#FEEFC7" />
      </g>
      <g>
        <rect x="22" y="80" width="124" height="30" rx="9" fill="#F6F7F5" stroke="#E3E8E5" strokeWidth="1.5" />
        <circle cx="37" cy="95" r="8" fill="#0BA5EC" />
        <rect x="50" y="89" width="60" height="5" rx="2.5" fill="#D7DFDB" />
        <rect x="50" y="98" width="38" height="5" rx="2.5" fill="#E3E8E5" />
        <path d="M124 91l4 4 8-8" stroke="#039855" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
    </svg>
  );
}

const emptyFrame = (className?: string) => ({
  viewBox: '0 0 200 140',
  'aria-hidden': true as const,
  className: className ?? 'h-auto w-40',
});

export function EmptyPlate({ className }: { className?: string }) {
  return (
    <svg {...emptyFrame(className)}>
      <ellipse cx="100" cy="124" rx="56" ry="8" fill="#0E1A16" opacity="0.06" />
      <circle cx="100" cy="70" r="46" fill="#FFFFFF" stroke="#E3E8E5" strokeWidth="3" />
      <circle cx="100" cy="70" r="33" fill="none" stroke="#E3E8E5" strokeWidth="2" strokeDasharray="7 7" />
      <path d="M38 44v22a6 6 0 0 0 6 6h2" stroke="#CFD8D4" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M38 44v14M44 44v14M50 44v14" stroke="#CFD8D4" strokeWidth="3" strokeLinecap="round" />
      <path d="M156 44c6 0 8 6 8 12s-3 8-6 9l1 21" stroke="#CFD8D4" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="100" cy="70" r="9" fill="#D1FADF" />
      <path d="M96 70l3 3 5-6" stroke="#039855" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function EmptyBasket({ className }: { className?: string }) {
  return (
    <svg {...emptyFrame(className)}>
      <ellipse cx="100" cy="124" rx="52" ry="8" fill="#0E1A16" opacity="0.06" />
      <path d="M58 56h84l-8 54a10 10 0 0 1-10 9H76a10 10 0 0 1-10-9Z" fill="#FFFFFF" stroke="#E3E8E5" strokeWidth="3" />
      <path d="M52 56h96" stroke="#CFD8D4" strokeWidth="5" strokeLinecap="round" />
      <path d="M78 56 90 30M122 56 110 30" stroke="#CFD8D4" strokeWidth="3.4" strokeLinecap="round" />
      <g stroke="#E3E8E5" strokeWidth="2.4" strokeDasharray="6 6" fill="none">
        <circle cx="86" cy="84" r="11" />
        <circle cx="114" cy="92" r="9" />
      </g>
    </svg>
  );
}

export function EmptyTrend({ className }: { className?: string }) {
  return (
    <svg {...emptyFrame(className)}>
      <rect x="26" y="22" width="148" height="88" rx="12" fill="#FFFFFF" stroke="#E3E8E5" strokeWidth="3" />
      <g stroke="#EEF1EF" strokeWidth="2">
        <path d="M26 48h148" />
        <path d="M26 70h148" />
        <path d="M26 92h148" />
      </g>
      <path d="M40 92c16 0 22-18 38-18s24 12 38 12 22-16 38-16" stroke="#CFD8D4" strokeWidth="3" strokeLinecap="round" strokeDasharray="8 8" fill="none" />
      <circle cx="40" cy="92" r="6" fill="#FFFFFF" stroke="#12B76A" strokeWidth="3" />
    </svg>
  );
}
