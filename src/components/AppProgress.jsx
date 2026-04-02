import React from 'react';
import { clsx } from 'clsx';

const steps = [
  { id: 1, short: 'Budget', full: 'Budget' },
  { id: 2, short: 'Priorities', full: 'Priorities' },
  { id: 3, short: 'Matches', full: 'Matches' },
];

export default function AppProgress({ currentStep }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2" aria-label="Progress">
      {steps.map((s, i) => (
        <React.Fragment key={s.id}>
          {i > 0 && (
            <span
              className={clsx(
                'mx-0.5 hidden h-1 w-1 rounded-full sm:inline',
                currentStep > s.id ? 'bg-[#C7C7CC]' : 'bg-[#E5E5EA]'
              )}
              aria-hidden
            />
          )}
          <div
            className={clsx(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5',
              currentStep === s.id
                ? 'bg-white shadow-sm ring-2 ring-[#007AFF]/40'
                : currentStep > s.id
                  ? 'bg-white/90 shadow-sm ring-1 ring-black/[0.06]'
                  : 'bg-transparent opacity-45'
            )}
          >
            <span
              className={clsx(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                currentStep >= s.id ? 'bg-[#007AFF] text-white' : 'bg-[#E5E5EA] text-[#8E8E93]'
              )}
            >
              {s.id}
            </span>
            <span className="hidden text-[12px] font-semibold tracking-tight text-[#1C1C1E] sm:inline">
              {s.full}
            </span>
            <span className="text-[11px] font-semibold tracking-tight text-[#1C1C1E] sm:hidden">
              {s.short}
            </span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
