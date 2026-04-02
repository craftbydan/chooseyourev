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
        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#8E8E93] text-[10px] font-bold text-white shadow-sm"
        aria-label={`Remove ${car.model}`}
      >
        ×
      </button>
    </div>
  );
}

const CompareBar = ({ onCompare }) => {
  const { compareList, removeFromCompare, clearCompare, fleet } = useStore();

  if (compareList.length === 0) return null;

  const selectedCars = compareList.map((id) => fleet.find((c) => c.id === id)).filter(Boolean);

  return (
    <div className="safe-pb fixed bottom-0 left-0 right-0 z-[80] border-t border-black/[0.1] bg-[#F2F2F7]/95 px-4 py-4 text-[#1C1C1E] shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-xl md:px-10 md:py-5">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full items-center gap-4 sm:w-auto">
          <h3 className="text-[15px] font-semibold tracking-tight">Compare</h3>
          <div className="flex flex-1 items-center gap-2 overflow-x-auto pb-1 sm:flex-initial sm:pb-0">
            {selectedCars.map((car) => (
              <CompareThumb key={car.id} car={car} onRemove={removeFromCompare} />
            ))}
            {selectedCars.length < 3 && (
              <div className="flex h-11 w-16 flex-shrink-0 items-center justify-center rounded-lg border border-dashed border-[#C7C7CC] text-lg text-[#C7C7CC] sm:h-12 sm:w-[4.5rem]">
                +
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-black/[0.06] pt-3 sm:border-t-0 sm:pt-0">
          <button
            type="button"
            onClick={clearCompare}
            className="min-h-[44px] px-2 text-[15px] font-normal text-[#007AFF]"
          >
            Clear
          </button>
          <button
            type="button"
            disabled={selectedCars.length < 2}
            onClick={onCompare}
            className={clsx(
              'min-h-[44px] rounded-xl px-6 text-[15px] font-semibold text-white transition-opacity',
              selectedCars.length < 2
                ? 'cursor-not-allowed bg-[#C7C7CC]'
                : 'bg-[#007AFF] shadow-sm active:opacity-85'
            )}
          >
            Compare {selectedCars.length}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompareBar;
