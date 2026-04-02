import React from 'react';
import { useStore } from '../store/useStore';
import { useCarImage } from '../hooks/useCarImage';
import { clsx } from 'clsx';

function CompareThumb({ car, onRemove }) {
  const { url, loading, onImgError } = useCarImage(car);

  return (
    <div className="group relative flex-shrink-0">
      <div className="h-11 w-16 overflow-hidden rounded-lg bg-[#E5E5EA] ring-1 ring-black/[0.06] sm:h-12 sm:w-[4.5rem]">
        {loading && <div className="h-full w-full animate-pulse bg-[#D1D1D6]" />}
        {url ? (
          <img src={url} alt="" className="h-full w-full object-cover" onError={onImgError} />
        ) : !loading ? (
          <div className="flex h-full items-center justify-center px-1 text-center text-[9px] font-medium leading-tight text-[#8E8E93]">
            {car.model}
          </div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onRemove(car.id)}
        className="absolute -right-1 -top-1 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-transparent text-[14px] font-bold text-[#8E8E93] active:opacity-80"
        aria-label={`Remove ${car.model} from compare`}
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#8E8E93] text-[10px] text-white shadow-sm ring-2 ring-[#F2F2F7]">
          ×
        </span>
      </button>
    </div>
  );
}

const CompareBar = ({ onCompare }) => {
  const { compareList, removeFromCompare, clearCompare, fleet } = useStore();

  if (compareList.length === 0) return null;

  const selectedCars = compareList.map((id) => fleet.find((c) => c.id === id)).filter(Boolean);
  const n = selectedCars.length;
  const needMore = Math.max(0, 2 - n);
  const canOpen = n >= 2;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[80] border-t border-black/[0.1] bg-[#F2F2F7]/95 px-4 pt-4 text-[#1C1C1E] shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-xl md:px-10 md:pt-5 md:pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="flex w-full flex-col gap-1.5 sm:w-auto sm:max-w-[min(100%,42rem)]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="text-[15px] font-semibold tracking-tight">Compare</h3>
            <span className="text-[13px] text-[#8E8E93]">
              {n} of 2–3 cars
              {needMore > 0 && (
                <span className="font-medium text-[#1C1C1E]"> · tap “Add to compare” on another card</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 sm:pb-0">
            {selectedCars.map((car) => (
              <CompareThumb key={car.id} car={car} onRemove={removeFromCompare} />
            ))}
            {n < 3 && (
              <div
                className="flex h-11 w-16 flex-shrink-0 flex-col items-center justify-center rounded-lg border border-dashed border-[#C7C7CC] bg-white/50 text-[#C7C7CC] sm:h-12 sm:w-[4.5rem]"
                title="Empty slot — choose another car above"
                aria-hidden
              >
                <span className="text-lg leading-none">+</span>
                {needMore > 0 && <span className="mt-0.5 text-[8px] font-semibold uppercase tracking-wide text-[#AEAEB2]">Need {needMore}</span>}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-black/[0.06] pt-3 sm:border-t-0 sm:pt-0">
          <button
            type="button"
            onClick={clearCompare}
            className="min-h-[44px] shrink-0 px-2 text-[15px] font-normal text-[#007AFF] active:opacity-70"
          >
            Clear all
          </button>
          <button
            type="button"
            disabled={!canOpen}
            onClick={onCompare}
            className={clsx(
              'min-h-[44px] shrink-0 rounded-xl px-6 text-[15px] font-semibold transition-opacity',
              !canOpen
                ? 'cursor-not-allowed bg-[#E5E5EA] text-[#8E8E93]'
                : 'bg-[#007AFF] text-white shadow-sm active:opacity-85'
            )}
          >
            {canOpen ? `View comparison (${n})` : 'Pick 1 more car'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompareBar;
