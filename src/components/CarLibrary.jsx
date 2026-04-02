import React, { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { useCarImage } from '../hooks/useCarImage';
import { formatCurrency } from '../utils/humanize.js';
import { clsx } from 'clsx';

const SEGMENTS = [
  { id: 'all', label: 'All' },
  { id: 'spare', label: 'Spare' },
  { id: 'middle', label: 'Middle' },
  { id: 'main', label: 'Main' },
];

function learnMoreHref(car) {
  if (car.learnMoreUrl && typeof car.learnMoreUrl === 'string') return car.learnMoreUrl;
  const q = `${car.brand} ${car.model} electric vehicle`;
  return `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}`;
}

function learnMoreLabel(car) {
  if (car.learnMoreUrl) {
    try {
      return new URL(car.learnMoreUrl).hostname.replace(/^www\./, '');
    } catch {
      return 'Link';
    }
  }
  return 'Wikipedia';
}

function LibraryRow({ car }) {
  const { addToCompare, removeFromCompare, compareList } = useStore();
  const { url, loading, onImgError } = useCarImage(car);
  const inCompare = compareList.includes(car.id);
  const full = compareList.length >= 3 && !inCompare;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-white/80 px-3 py-2.5 shadow-sm">
      <div className="h-14 w-[4.5rem] shrink-0 overflow-hidden rounded-lg bg-[#E5E5EA] ring-1 ring-black/[0.06]">
        {loading && <div className="h-full w-full animate-pulse bg-[#D1D1D6]" />}
        {url ? (
          <img src={url} alt="" className="h-full w-full object-cover" onError={onImgError} />
        ) : !loading ? (
          <div className="flex h-full items-center justify-center px-1 text-center text-[9px] font-medium text-[#8E8E93]">
            {car.model}
          </div>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-[#1C1C1E]">
          {car.brand} {car.model}
        </p>
        <p className="mt-0.5 text-[14px]">
          <span className="text-[13px] font-medium text-[#8E8E93]">Price </span>
          <span className="font-semibold tabular-nums text-[#1C1C1E]">{formatCurrency(car.priceThb)}</span>
        </p>
        <p className="mt-0.5 text-[13px] text-[#8E8E93]">{car.rangeCity} km city range</p>
        <p className="mt-1 text-[12px] leading-snug">
          <span className="text-[#8E8E93]">Learn more at </span>
          <a
            href={learnMoreHref(car)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#007AFF] underline-offset-2 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {learnMoreLabel(car)}
          </a>
        </p>
      </div>
      <button
        type="button"
        disabled={full}
        onClick={() => (inCompare ? removeFromCompare(car.id) : addToCompare(car.id))}
        className={clsx(
          'min-h-[40px] shrink-0 rounded-lg px-3 text-[14px] font-semibold transition-opacity',
          full && 'cursor-not-allowed text-[#C7C7CC]',
          !full && inCompare && 'text-[#007AFF]',
          !full && !inCompare && 'text-[#007AFF] active:opacity-70'
        )}
      >
        {inCompare ? 'Remove' : full ? 'Full' : 'Compare'}
      </button>
    </div>
  );
}

const CarLibrary = ({ onClose }) => {
  const { fleet } = useStore();
  const [query, setQuery] = useState('');
  const [segment, setSegment] = useState('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return fleet.filter((c) => {
      if (segment !== 'all' && c.segment !== segment) return false;
      if (!q) return true;
      const hay = `${c.brand} ${c.model}`.toLowerCase();
      return hay.includes(q);
    });
  }, [fleet, query, segment]);

  return (
    <div
      className="fixed inset-0 z-[160] flex items-end justify-center bg-black/35 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="car-library-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(92dvh,720px)] w-full max-w-lg flex-col rounded-t-[1.25rem] border border-black/[0.08] bg-[#F2F2F7] shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/[0.08] px-4 py-3 sm:px-5">
          <h2 id="car-library-title" className="text-[17px] font-semibold tracking-tight text-[#1C1C1E]">
            Car library
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-xl text-[22px] leading-none text-[#8E8E93] active:opacity-70"
            aria-label="Close car library"
          >
            ×
          </button>
        </div>

        <div className="border-b border-black/[0.06] px-4 py-3 sm:px-5">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search brand or model"
            className="w-full rounded-xl border border-black/[0.1] bg-white px-4 py-3 text-[16px] text-[#1C1C1E] placeholder:text-[#C7C7CC] focus:border-[#007AFF] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/25"
            autoFocus
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {SEGMENTS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSegment(s.id)}
                className={clsx(
                  'min-h-[36px] rounded-full px-4 text-[14px] font-semibold transition-colors',
                  segment === s.id
                    ? 'bg-[#1C1C1E] text-white'
                    : 'bg-white text-[#1C1C1E] ring-1 ring-black/[0.08] active:opacity-80'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5">
          <p className="mb-2 text-[13px] text-[#8E8E93]">
            {filtered.length} car{filtered.length === 1 ? '' : 's'}
          </p>
          <ul className="flex flex-col gap-2 pb-4">
            {filtered.map((car) => (
              <li key={car.id}>
                <LibraryRow car={car} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CarLibrary;
