import React from 'react';
import { useStore } from '../store/useStore';

const SegmentGate = () => {
  const setSegment = useStore((state) => state.setSegment);

  const segments = [
    {
      id: 'spare',
      label: 'Spare / second car',
      priceRange: 'Under ฿600,000',
      description: 'Second car, short hops, less pressure.',
    },
    {
      id: 'middle',
      label: 'Stepping up',
      priceRange: '฿600,000 – ฿1,000,000',
      description: 'Nicer than basic, not your forever car yet.',
    },
    {
      id: 'main',
      label: 'Main car',
      priceRange: '฿1,000,000 and up',
      description: 'Daily driver you plan to keep.',
    },
  ];

  return (
    <div className="step-transition mx-auto max-w-lg px-4 pb-[calc(4rem+env(safe-area-inset-bottom,0px))] pt-2 sm:max-w-2xl sm:px-6 md:max-w-4xl md:pb-16 md:pt-4">
      <p className="sr-only">Choose your budget band to continue.</p>
      <div className="mb-8">
        <p className="text-[13px] font-medium uppercase tracking-wide text-[#8E8E93]">Step 1 of 3</p>
        <h1 className="mt-1 text-[28px] font-semibold leading-tight tracking-tight text-[#1C1C1E] sm:text-[34px]">
          What are you shopping for?
        </h1>
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:gap-4">
        {segments.map((segment) => (
          <button
            key={segment.id}
            type="button"
            onClick={() => setSegment(segment.id)}
            className="group flex min-h-[120px] flex-1 flex-col rounded-2xl border border-black/[0.06] bg-white p-5 text-left shadow-sm transition-all active:scale-[0.99] md:min-h-[200px] md:p-6 md:hover:shadow-md md:hover:ring-2 md:hover:ring-[#007AFF]/25"
          >
            <span className="text-[15px] font-semibold leading-snug text-[#1C1C1E]">{segment.label}</span>
            <span className="mt-1 text-[20px] font-semibold tracking-tight text-[#007AFF]">{segment.priceRange}</span>
            <p className="mt-3 flex-1 text-[15px] leading-relaxed text-[#8E8E93]">{segment.description}</p>
            <span className="mt-4 inline-flex min-h-[44px] items-center text-[17px] font-semibold text-[#007AFF] group-active:opacity-60">
              Continue
              <span className="ml-1" aria-hidden>
                ›
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SegmentGate;
