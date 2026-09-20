import { Armchair, Dumbbell, Flame, Footprints, Scale, Target, TrendingUp, Zap } from 'lucide-react';
import type { Activity, Cuisine, Diet, Gender, Goal } from '@/lib/types';

const svg = (className: string) => ({ viewBox: '0 0 24 24', 'aria-hidden': true as const, className });

export function GenderIcon({ gender, className = 'size-5' }: { gender: Gender; className?: string }) {
  return gender === 'male' ? (
    <svg {...svg(className)}>
      <circle cx="10" cy="14" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M15.4 8.6 21 3m0 0h-5m5 0v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  ) : (
    <svg {...svg(className)}>
      <circle cx="12" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 15v6m-3-3h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function ActivityIcon({ activity, className = 'size-5' }: { activity: Activity; className?: string }) {
  const map = { sedentary: Armchair, light: Footprints, moderate: Zap, active: Dumbbell, athlete: Flame };
  const Icon = map[activity];
  return <Icon className={className} aria-hidden="true" />;
}

export function GoalIcon({ goal, className = 'size-5' }: { goal: Goal; className?: string }) {
  const map = { loss: Target, maintain: Scale, gain: TrendingUp };
  const Icon = map[goal];
  return <Icon className={className} aria-hidden="true" />;
}

/** Diet icons are drawn, so veg / egg / non-veg read at a glance. */
export function DietIcon({ diet, className = 'size-5' }: { diet: Diet; className?: string }) {
  if (diet === 'veg') {
    return (
      <svg {...svg(className)}>
        <path d="M20 4c.9 7.4-2 12.2-8.6 14.4C7 19.8 4.3 18 3.6 13.2 2.9 8.5 6.2 5.3 13.6 4.6c2.3-.2 4.4-.4 6.4-.6Z" fill="#12B76A" />
        <path d="M19.4 4.6C13 8 8.4 12.6 5.6 19.4" stroke="#054F31" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      </svg>
    );
  }
  if (diet === 'egg') {
    return (
      <svg {...svg(className)}>
        <path d="M12 2.6c3.8 0 6.9 5.4 6.9 9.8A6.9 6.9 0 0 1 12 19.4a6.9 6.9 0 0 1-6.9-7C5.1 8 8.2 2.6 12 2.6Z" fill="#FFFFFF" stroke="#D2DAD6" strokeWidth="1.6" />
        <circle cx="12" cy="12.6" r="3.4" fill="#FDB022" />
      </svg>
    );
  }
  return (
    <svg {...svg(className)}>
      <path d="M14.8 3.3a4.6 4.6 0 0 1 6 6.2c-.8 1.6-2.4 2.5-4.2 2.6l-5.6 5.6-1.2 3.4-3.2 1.3-1.5-1.5L6.4 18l3.4-1.2 5.6-5.6c.1-1.9 1-3.5 2.6-4.3" fill="#F04438" />
      <path d="M9.8 16.8 6.4 18l-1.3 3.2-1.5-1.5L4.9 16.5Z" fill="#F7E3BC" />
    </svg>
  );
}

/** Cuisine icons: a roti, a dosa with chutney, a fish, a thali and a mixed plate. */
export function CuisineIcon({ cuisine, className = 'size-5' }: { cuisine: Cuisine; className?: string }) {
  switch (cuisine) {
    case 'north':
      return (
        <svg {...svg(className)}>
          <circle cx="12" cy="12" r="9" fill="#F7E3BC" stroke="#D4A968" strokeWidth="1.6" />
          <g fill="#D4A968" opacity="0.7">
            <circle cx="9" cy="9.5" r="1.3" />
            <circle cx="14.5" cy="10.5" r="1" />
            <circle cx="11" cy="15" r="1.2" />
            <circle cx="15.5" cy="14.5" r="0.9" />
          </g>
        </svg>
      );
    case 'south':
      return (
        <svg {...svg(className)}>
          <path d="M3 15c3.6-5.4 7.4-8 11.5-8 2.4 0 4.3.9 5.5 2.6-3 5-7 7.4-12 7.4H3Z" fill="#F7E3BC" stroke="#D4A968" strokeWidth="1.4" strokeLinejoin="round" />
          <circle cx="18" cy="16" r="3.4" fill="#FFFFFF" stroke="#D2DAD6" strokeWidth="1.3" />
          <circle cx="18" cy="16" r="1.6" fill="#12B76A" />
        </svg>
      );
    case 'east':
      return (
        <svg {...svg(className)}>
          <path d="M2.5 12c2.8-3.6 6.1-5.4 10-5.4 3.3 0 5.6 1.8 6.8 5.4-1.2 3.6-3.5 5.4-6.8 5.4-3.9 0-7.2-1.8-10-5.4Z" fill="#36BFFA" />
          <path d="M19.3 12c-1.2 3.6-3.5 5.4-6.8 5.4-1.4 0-2.7-.3-4-.9 3.5-.6 6.1-2.2 7.8-4.5h3Z" fill="#0086C9" />
          <circle cx="8.6" cy="11.2" r="1.2" fill="#04263A" />
          <path d="m2.5 12-2-3v6Z" fill="#0BA5EC" />
        </svg>
      );
    case 'west':
      return (
        <svg {...svg(className)}>
          <rect x="3.5" y="6" width="17" height="12" rx="3" fill="#FEDF89" stroke="#DC6803" strokeWidth="1.4" />
          <circle cx="8.5" cy="12" r="2.4" fill="#12B76A" />
          <circle cx="15.5" cy="12" r="2.4" fill="#F04438" />
        </svg>
      );
    case 'mix':
    default:
      return (
        <svg {...svg(className)}>
          <circle cx="12" cy="12" r="9.2" fill="#F3F5F4" stroke="#D2DAD6" strokeWidth="1.4" />
          <path d="M12 2.8A9.2 9.2 0 0 1 21.2 12H12Z" fill="#FDB022" />
          <path d="M12 12h9.2A9.2 9.2 0 0 1 12 21.2Z" fill="#12B76A" />
          <path d="M12 12v9.2A9.2 9.2 0 0 1 2.8 12Z" fill="#36BFFA" />
          <path d="M12 12H2.8A9.2 9.2 0 0 1 12 2.8Z" fill="#F7E3BC" />
        </svg>
      );
  }
}
