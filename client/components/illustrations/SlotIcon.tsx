import type { PlanSlot } from '@/lib/types';

interface SlotIconProps {
  slot: PlanSlot;
  className?: string;
}

/** One drawn icon per meal slot — sunrise, fruit, thali, chai, moon. */
export function SlotIcon({ slot, className = 'size-8' }: SlotIconProps) {
  const common = { viewBox: '0 0 32 32', 'aria-hidden': true as const, className };

  switch (slot) {
    case 'breakfast':
      return (
        <svg {...common}>
          <circle cx="16" cy="18" r="7" fill="#FDB022" />
          <path d="M16 18a7 7 0 0 1 7 7H9a7 7 0 0 1 7-7Z" fill="#F79009" />
          <g stroke="#DC6803" strokeWidth="2" strokeLinecap="round">
            <path d="M16 4v3.5" />
            <path d="M6.6 8.6 9 11" />
            <path d="M25.4 8.6 23 11" />
          </g>
          <path d="M4 25.5h24" stroke="#B54708" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );
    case 'midMorning':
      return (
        <svg {...common}>
          <path d="M16 9c4.5-2.6 11 .4 11 8s-5 12-7.5 12S17.5 27 16 27s-1 2-3.5 2S5 24.6 5 17s6.5-10.6 11-8Z" fill="#F04438" />
          <path d="M16 9c-4.5-2.6-11 .4-11 8 0 4.2 1.5 7.6 3.3 9.7C7 24 6.4 20.8 6.6 17.7 7 12 11.3 9 16 9Z" fill="#FFFFFF" opacity="0.25" />
          <path d="M16 9.5c0-3 1.8-5.3 4.6-6-.2 3.2-1.8 5.4-4.6 6Z" fill="#12B76A" />
          <path d="M16 9.5c-.4-1.4-1.4-2.4-2.9-3" stroke="#7A2E0E" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </svg>
      );
    case 'lunch':
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="13" fill="#EDF1EF" stroke="#D7DFDB" strokeWidth="1.5" />
          <circle cx="16" cy="16" r="9.5" fill="#FFFFFF" />
          <circle cx="12.6" cy="13" r="4" fill="#FDB022" />
          <circle cx="19.6" cy="13.6" r="3.4" fill="#12B76A" />
          <path d="M9.5 20.5c1.8-2.6 4.2-3.9 7-3.9s5.2 1.3 7 3.9c-1.8 2.6-4.2 3.9-7 3.9s-5.2-1.3-7-3.9Z" fill="#F2D9A8" />
        </svg>
      );
    case 'eveningSnack':
      return (
        <svg {...common}>
          <g stroke="#B54708" strokeOpacity="0.55" strokeWidth="1.8" strokeLinecap="round" fill="none">
            <path d="M13 8c1.4-1.1 1.4-2.3 0-3.4" />
            <path d="M18 8c1.4-1.1 1.4-2.3 0-3.4" />
          </g>
          <path d="M6 12h16v6a8 8 0 0 1-16 0Z" fill="#F2D9A8" />
          <path d="M6 12h16v2.2a8 8 0 0 1-16 0Z" fill="#DC6803" />
          <path d="M22 13.6h2.4a3.4 3.4 0 0 1 0 6.8H22" stroke="#B54708" strokeWidth="2" fill="none" />
          <path d="M4 27h20" stroke="#B54708" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );
    case 'dinner':
    default:
      return (
        <svg {...common}>
          <path d="M22.5 20.8A10 10 0 0 1 11.2 6.2a11 11 0 1 0 14.6 14.6c-1.1.3-2.2.4-3.3 0Z" fill="#475467" />
          <path d="M20.4 18.8A9 9 0 0 1 12 7.4a9 9 0 1 0 11.4 11.4 9 9 0 0 1-3 0Z" fill="#667085" />
          <g fill="#FEDF89">
            <path d="m25 6 .9 2 2 .9-2 .9-.9 2-.9-2-2-.9 2-.9Z" />
            <path d="m21.4 12.6.6 1.3 1.3.6-1.3.6-.6 1.3-.6-1.3-1.3-.6 1.3-.6Z" />
          </g>
        </svg>
      );
  }
}
