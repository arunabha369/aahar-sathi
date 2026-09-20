import type { IngredientCategory } from '@/lib/types';

/** A drawn icon per grocery aisle, so the list scans by shape as well as by text. */
export function CategoryIcon({ category, className = 'size-5' }: { category: IngredientCategory; className?: string }) {
  const common = { viewBox: '0 0 24 24', 'aria-hidden': true as const, className };

  switch (category) {
    case 'Grains & Flours':
      return (
        <svg {...common}>
          <path d="M12 21V8" stroke="#B54708" strokeWidth="1.8" strokeLinecap="round" />
          <g fill="#FDB022">
            <path d="M12 8c0-2.5 1.6-4.4 4.4-5-.2 3-1.8 4.8-4.4 5Z" />
            <path d="M12 8c0-2.5-1.6-4.4-4.4-5 .2 3 1.8 4.8 4.4 5Z" />
            <path d="M12 13c0-2.5 1.6-4.4 4.4-5-.2 3-1.8 4.8-4.4 5Z" />
            <path d="M12 13c0-2.5-1.6-4.4-4.4-5 .2 3 1.8 4.8 4.4 5Z" />
            <path d="M12 18c0-2.5 1.6-4.4 4.4-5-.2 3-1.8 4.8-4.4 5Z" />
            <path d="M12 18c0-2.5-1.6-4.4-4.4-5 .2 3 1.8 4.8 4.4 5Z" />
          </g>
        </svg>
      );
    case 'Lentils & Legumes':
      return (
        <svg {...common}>
          <path d="M4 14.5c0-3 2.4-5.5 5.4-5.5 2.2 0 3.6 1.5 3.6 3.4 0 3-2.4 5.6-5.4 5.6C5.4 18 4 16.5 4 14.5Z" fill="#DC6803" />
          <path d="M11 9.5C11 6.5 13.4 4 16.4 4 18.6 4 20 5.5 20 7.4c0 3-2.4 5.6-5.4 5.6-2.2 0-3.6-1.5-3.6-3.5Z" fill="#F79009" />
          <path d="M11 18.6c0-2 1.6-3.6 3.6-3.6 1.5 0 2.4 1 2.4 2.3 0 2-1.6 3.7-3.6 3.7-1.5 0-2.4-1-2.4-2.4Z" fill="#B54708" />
        </svg>
      );
    case 'Dairy & Paneer':
      return (
        <svg {...common}>
          <path d="M8 3h8v3.2l2 3.4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9.6l2-3.4Z" fill="#E4E9E6" />
          <path d="M6 12h12v8a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1Z" fill="#FFFFFF" />
          <path d="M6 12h12v3H6Z" fill="#0BA5EC" opacity="0.25" />
          <path d="M8 3h8v3.2H8Z" fill="#CFD8D4" />
        </svg>
      );
    case 'Eggs':
      return (
        <svg {...common}>
          <path d="M12 3c3.6 0 6.5 5 6.5 9.2A6.5 6.5 0 0 1 12 19a6.5 6.5 0 0 1-6.5-6.8C5.5 8 8.4 3 12 3Z" fill="#FFFFFF" stroke="#E3E8E5" strokeWidth="1.4" />
          <circle cx="12" cy="13" r="3.2" fill="#FDB022" />
        </svg>
      );
    case 'Meat & Fish':
      return (
        <svg {...common}>
          <path d="M3 12c3-4 6.6-6 10.8-6 3.6 0 6 2 7.2 6-1.2 4-3.6 6-7.2 6C9.6 18 6 16 3 12Z" fill="#36BFFA" />
          <path d="M21 12c-1.2 4-3.6 6-7.2 6-1.6 0-3-.4-4.4-1 3.8-.6 6.6-2.4 8.4-5h3.2Z" fill="#0086C9" />
          <circle cx="9" cy="11" r="1.4" fill="#04263A" />
          <path d="M3 12 1 8.6v6.8Z" fill="#0BA5EC" />
        </svg>
      );
    case 'Vegetables & Fruits':
      return (
        <svg {...common}>
          <path d="M13.4 8.6 8 20.2a1.6 1.6 0 0 1-2.8.2L3.6 17c-.6-1 0-2.3 1.2-2.5l8.6-1.4Z" fill="#DC6803" transform="rotate(-8 12 13)" />
          <path d="M14 9c1.6-2.4 4-3.4 7-3-.4 3-2.2 4.8-5.2 5.2" fill="#12B76A" />
          <path d="M13.2 8.2c-.4-2.6.6-4.6 3-6 .8 2.6.2 4.8-1.8 6.4" fill="#039855" />
        </svg>
      );
    case 'Nuts, Seeds & Oils':
      return (
        <svg {...common}>
          <path d="M12 3c3.6 3.8 5.4 7 5.4 9.4A5.4 5.4 0 0 1 12 18a5.4 5.4 0 0 1-5.4-5.6C6.6 10 8.4 6.8 12 3Z" fill="#FDB022" />
          <path d="M12 3c-3.6 3.8-5.4 7-5.4 9.4 0 1.4.5 2.7 1.4 3.6-.2-4 1.1-7.4 4-10.2Z" fill="#FFFFFF" opacity="0.3" />
          <path d="M8 20.5c2.6-1 5.4-1 8 0" stroke="#B54708" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </svg>
      );
    case 'Spices & Others':
    default:
      return (
        <svg {...common}>
          <rect x="6" y="9" width="12" height="12" rx="2.2" fill="#F04438" />
          <rect x="6" y="9" width="12" height="4" rx="1.6" fill="#D92D20" />
          <rect x="8" y="3" width="8" height="4" rx="1.4" fill="#B42318" />
          <g fill="#FFFFFF" opacity="0.85">
            <circle cx="10" cy="16.5" r="1.1" />
            <circle cx="14" cy="15.4" r="1.1" />
            <circle cx="13" cy="18.6" r="1.1" />
          </g>
        </svg>
      );
  }
}
