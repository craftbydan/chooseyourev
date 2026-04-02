import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { getCarExplanation } from '../lib/gemini.js';
import { cityRangeLabel, monthlyPayment, formatCurrency } from '../utils/humanize.js';
import { useCarImage } from '../hooks/useCarImage';
import CarDetailModal from './CarDetailModal';
import { clsx } from 'clsx';

const CarCard = ({
  car,
  index,
  isHero = false,
  compact = false,
  scenarioPriorityOrder = [],
  onCalculate,
  peerCars = [],
}) => {
  const { addToCompare, compareList, removeFromCompare } = useStore();
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const isSelected = compareList.includes(car.id);
  const monthlyPay = monthlyPayment(car.priceThb);
  const hasPrice = car.priceThb != null && car.priceThb > 0;
  const { url: imageUrl, loading: imageLoading, onImgError } = useCarImage(car);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    setImgLoaded(false);
  }, [imageUrl]);

  useEffect(() => {
    if (isHero && scenarioPriorityOrder.length > 0 && !explanation) {
      setLoading(true);
      getCarExplanation(car, scenarioPriorityOrder, monthlyPay)
        .then((res) => setExplanation(res))
        .finally(() => setLoading(false));
    }
  }, [isHero, scenarioPriorityOrder, car, monthlyPay]);

  const handleCompare = () => {
    if (isSelected) {
      removeFromCompare(car.id);
    } else {
      addToCompare(car.id);
    }
  };

  const cardClasses = clsx(
    'card group flex overflow-hidden transition-all duration-300',
    compact ? 'h-full min-h-0 flex-col' : 'flex-col md:flex-row',
    !compact && isHero && 'md:col-span-12',
    !compact && !isHero && 'md:col-span-6',
    isSelected && 'ring-2 ring-[#007AFF] ring-offset-2 ring-offset-[#F2F2F7]'
  );

  const imageShell = clsx(
    'relative shrink-0 overflow-hidden bg-[#E5E5EA]',
    compact
      ? 'h-36 w-full sm:h-40'
      : isHero
        ? 'aspect-[4/3] md:aspect-auto md:w-1/2 md:min-h-[280px]'
        : 'aspect-[16/9] w-full md:aspect-[5/3]'
  );

  const bodyPad = compact ? 'p-4 sm:p-5' : 'p-6 sm:p-8 md:p-10';
  const titleClass = compact
    ? 'mb-2 text-xl font-semibold leading-tight text-[#1C1C1E] sm:text-[22px]'
    : 'mb-4 text-[26px] font-semibold leading-tight tracking-tight text-[#1C1C1E] sm:text-3xl md:text-4xl';
  const scoreClass = compact
    ? 'text-[22px] font-semibold leading-none text-[#007AFF] sm:text-[26px]'
    : 'text-[34px] font-semibold leading-none tracking-tight text-[#007AFF]';

  return (
    <div className={cardClasses}>
      <div className={imageShell}>
        {(imageLoading || (imageUrl && !imgLoaded)) && (
          <div className="absolute inset-0 z-[1] animate-pulse bg-gradient-to-br from-[#E5E5EA] to-[#D1D1D6]" aria-hidden />
        )}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${car.brand} ${car.model}`}
            onError={onImgError}
            onLoad={() => setImgLoaded(true)}
            className="relative z-[2] h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : !imageLoading ? (
          <div className="flex h-full min-h-[6rem] w-full flex-col items-center justify-center bg-[#E5E5EA] p-4 text-center">
            <p className="text-[12px] font-medium text-[#8E8E93]">{car.brand}</p>
            <p className="mt-0.5 text-[15px] font-semibold text-[#1C1C1E]">{car.model}</p>
            {car.isCustom ? (
              <p className="mt-2 rounded-full bg-[#1C1C1E] px-2 py-0.5 text-[10px] font-semibold text-white">Custom</p>
            ) : (
              <p className="mt-2 text-[11px] text-[#8E8E93]">No photo</p>
            )}
          </div>
        ) : null}

        <button
          type="button"
          className="absolute inset-0 z-[4] cursor-pointer bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#007AFF]"
          aria-label={`View full details and scores for ${car.brand} ${car.model}`}
          onClick={() => setDetailOpen(true)}
        />

        {car.isCustom && (
          <div className="pointer-events-none absolute right-2 top-2 z-[5] rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            Custom
          </div>
        )}

        {index !== undefined && (
          <div
            className={clsx(
              'pointer-events-none absolute left-2 top-2 z-[5] flex items-center justify-center rounded-full bg-white/95 font-semibold text-[#1C1C1E] shadow-sm backdrop-blur-sm',
              compact ? 'h-7 w-7 text-[13px]' : 'left-3 top-3 h-9 w-9 text-[15px]'
            )}
          >
            {index + 1}
          </div>
        )}
      </div>

      <div
        className={clsx(
          'flex min-h-0 flex-1 flex-col justify-between',
          bodyPad,
          !compact && isHero ? 'md:w-1/2' : 'w-full'
        )}
      >
        <div className="relative min-h-0">
          <div
            className={clsx(
              'flex items-start justify-between gap-2 border-b border-black/[0.08]',
              compact ? 'mb-3 pb-3' : 'mb-5 pb-4'
            )}
          >
            <p className={clsx('font-medium text-[#8E8E93]', compact ? 'text-[13px]' : 'text-[15px]')}>
              {car.brand}
              <span className="mx-1 text-[#C7C7CC]">·</span>
              {car.countryOfOrigin}
            </p>
            {car.score ? (
              <div className="flex flex-col items-end">
                <span className={scoreClass}>{car.score}</span>
                <span className="text-[10px] font-medium uppercase tracking-wide text-[#8E8E93]">Match</span>
              </div>
            ) : null}
          </div>

          <h2 className={titleClass}>{car.model}</h2>

          {isHero && (
            <div className={clsx('min-h-[2.5rem]', compact ? 'mb-3' : 'mb-6 min-h-[3.5rem]')}>
              {loading ? (
                <div className="flex gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#C7C7CC]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#C7C7CC] delay-75" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#C7C7CC] delay-150" />
                </div>
              ) : explanation && !explanation.includes('API Key not found') ? (
                <p
                  className={clsx(
                    'leading-snug text-[#3C3C43]',
                    compact ? 'line-clamp-4 text-[14px]' : 'text-[17px] leading-relaxed'
                  )}
                >
                  {explanation}
                </p>
              ) : null}
            </div>
          )}

          <div className={clsx('space-y-2 border-t border-black/[0.08] pt-3', !compact && 'space-y-3 pt-5')}>
            <div className="flex justify-between gap-2">
              <span className={clsx('font-medium text-[#8E8E93]', compact ? 'text-[12px]' : 'text-[13px]')}>City range</span>
              <span
                className={clsx(
                  'max-w-[58%] text-right font-medium text-[#1C1C1E]',
                  compact ? 'text-[13px]' : 'text-[15px]'
                )}
              >
                {compact ? `${car.rangeCity} km` : cityRangeLabel(car.rangeCity)}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className={clsx('font-medium text-[#8E8E93]', compact ? 'text-[12px]' : 'text-[13px]')}>To 80%</span>
              <span className={clsx('text-right font-medium text-[#1C1C1E]', compact ? 'text-[13px]' : 'text-[15px]')}>
                ~{car.timeToEightyMin} min
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className={clsx('font-medium text-[#8E8E93]', compact ? 'text-[12px]' : 'text-[13px]')}>Loan est.</span>
              <span className={clsx('text-right font-medium text-[#1C1C1E]', compact ? 'text-[13px]' : 'text-[15px]')}>
                {hasPrice ? `${formatCurrency(monthlyPay)}/mo` : '—'}
              </span>
            </div>
          </div>
        </div>

        <div className={clsx('flex gap-2', compact ? 'mt-4 flex-col sm:flex-row' : 'mt-8 flex-col sm:flex-row')}>
          <button
            type="button"
            onClick={() => onCalculate(car)}
            className={clsx(
              'min-h-[44px] flex-1 rounded-xl border border-[#C7C7CC] bg-white font-semibold text-[#007AFF] transition-colors active:bg-[#F2F2F7]',
              compact ? 'py-2.5 text-[14px]' : 'py-3 text-[15px]'
            )}
          >
            Calculate
          </button>
          <button
            type="button"
            onClick={handleCompare}
            className={clsx(
              'min-h-[44px] flex-1 rounded-xl font-semibold transition-colors active:scale-[0.99]',
              compact ? 'py-2.5 text-[14px]' : 'py-3 text-[15px]',
              isSelected
                ? 'bg-[#007AFF] text-white shadow-sm active:opacity-90'
                : 'border-2 border-[#007AFF] bg-white text-[#007AFF] hover:bg-[rgba(0,122,255,0.06)] active:bg-[rgba(0,122,255,0.1)]'
            )}
          >
            {isSelected ? 'In compare' : 'Add to compare'}
          </button>
        </div>
      </div>

      {detailOpen && <CarDetailModal car={car} peerCars={peerCars} onClose={() => setDetailOpen(false)} />}
    </div>
  );
};

export default CarCard;
