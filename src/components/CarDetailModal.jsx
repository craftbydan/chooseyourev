import React from 'react';
import { useCarImage } from '../hooks/useCarImage';
import { formatCurrency, monthlyPayment } from '../utils/humanize.js';
import { perCategoryFitOutOf5, overallMatchOutOf5 } from '../lib/scoring';
import { clsx } from 'clsx';

const SPEC_ROWS = [
  { label: 'Price (incl. VAT, list)', key: 'priceThb', fmt: (v) => formatCurrency(v) },
  { label: 'Segment', key: 'segment', fmt: (v) => String(v || '—') },
  { label: 'Body style', key: 'bodyStyle', fmt: (v) => String(v || '—') },
  { label: 'Country of origin', key: 'countryOfOrigin', fmt: (v) => String(v || '—') },
  { label: 'Drive', key: 'driveType', fmt: (v) => String(v || '—') },
  { label: 'City range', key: 'rangeCity', fmt: (v) => `${v ?? '—'} km` },
  { label: 'Highway range', key: 'rangeHighway', fmt: (v) => `${v ?? '—'} km` },
  { label: 'DC charge (max)', key: 'dcChargeKw', fmt: (v) => `${v ?? '—'} kW` },
  { label: 'Time to 80% DC', key: 'timeToEightyMin', fmt: (v) => `~${v ?? '—'} min` },
  { label: '0–100 km/h', key: 'zeroToHundred', fmt: (v) => `${v ?? '—'} s` },
  { label: 'Boot', key: 'bootL', fmt: (v) => `${v ?? '—'} L` },
  { label: 'Seats', key: 'seats', fmt: (v) => String(v ?? '—') },
  { label: 'Vehicle warranty', key: 'warrantyYears', fmt: (v) => `${v ?? '—'} yr` },
  { label: 'Battery warranty', key: 'batteryWarrantyYears', fmt: (v) => `${v ?? '—'} yr` },
  { label: 'Bangkok service centers', key: 'bangkokServiceCenters', fmt: (v) => String(v ?? '—') },
  { label: 'Safety (1–5)', key: 'safetyScore', fmt: (v) => String(v ?? '—') },
  { label: 'Safety source', key: 'safetySource', fmt: (v) => String(v || '—') },
  { label: 'Length', key: 'lengthMm', fmt: (v) => `${v ?? '—'} mm` },
  { label: 'Width', key: 'widthMm', fmt: (v) => `${v ?? '—'} mm` },
  { label: 'Efficiency', key: 'efficiencyKwhPer100km', fmt: (v) => `${v ?? '—'} kWh/100km` },
  { label: 'Data source', key: 'dataSource', fmt: (v) => String(v || 'catalog') },
];

function StarRow({ label, sub, value }) {
  const v = value == null ? null : Math.min(5, Math.max(0, value));
  return (
    <div className="flex flex-col gap-1 border-b border-black/[0.06] py-2.5 last:border-0">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[14px] font-semibold text-[#1C1C1E]">{label}</p>
          {sub ? <p className="text-[12px] text-[#8E8E93]">{sub}</p> : null}
        </div>
        {v == null ? (
          <span className="text-[13px] text-[#C7C7CC]">—</span>
        ) : (
          <span className="text-[15px] font-bold tabular-nums text-[#007AFF]">{v.toFixed(1)} / 5</span>
        )}
      </div>
      {v != null && (
        <div className="flex gap-0.5" aria-hidden>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={clsx(
                'h-1.5 flex-1 rounded-full',
                i <= Math.round(v) ? 'bg-[#007AFF]' : 'bg-[#E5E5EA]'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const CarDetailModal = ({ car, peerCars, onClose }) => {
  const { url, loading, onImgError } = useCarImage(car);
  const categories = perCategoryFitOutOf5(car, peerCars);
  const overall5 = overallMatchOutOf5(car.score);
  const monthlyPay = monthlyPayment(car.priceThb);
  const canCompareCategories = peerCars.length >= 2;

  return (
    <div
      className="fixed inset-0 z-[175] flex items-end justify-center bg-black/35 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="car-detail-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(94dvh,880px)] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.25rem] border border-black/[0.08] bg-[#F2F2F7] shadow-2xl sm:max-w-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-2 border-b border-black/[0.08] px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-[#8E8E93]">{car.brand}</p>
            <h2 id="car-detail-title" className="text-[20px] font-semibold leading-tight text-[#1C1C1E] sm:text-[22px]">
              {car.model}
            </h2>
            {car.score != null && (
              <p className="mt-1 text-[14px] text-[#8E8E93]">
                Match score{' '}
                <span className="font-semibold text-[#1C1C1E]">{car.score}</span>
                {overall5 != null && (
                  <span className="text-[#8E8E93]">
                    {' '}
                    · <span className="font-semibold text-[#007AFF]">{overall5}</span> / 5 overall
                  </span>
                )}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] shrink-0 rounded-xl text-[22px] leading-none text-[#8E8E93] active:opacity-70"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="relative aspect-[16/10] w-full bg-[#E5E5EA] sm:aspect-[2/1]">
            {loading && <div className="absolute inset-0 animate-pulse bg-[#D1D1D6]" />}
            {url ? (
              <img src={url} alt="" className="h-full w-full object-cover" onError={onImgError} />
            ) : !loading ? (
              <div className="flex h-full items-center justify-center p-6 text-center text-[14px] text-[#8E8E93]">
                No photo — we search Wikipedia for custom adds.
              </div>
            ) : null}
            {car.isCustom && (
              <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white">
                Custom / AI
              </span>
            )}
          </div>

          <div className="px-4 py-4 sm:px-5">
            <h3 className="mb-2 text-[15px] font-semibold text-[#1C1C1E]">Lifestyle fit vs this list</h3>
            <p className="mb-3 text-[12px] leading-snug text-[#8E8E93]">
              {canCompareCategories
                ? 'Each row is 0–5 compared with other cars in your current budget band (and filters), using the same signals as the main match score.'
                : 'Add another car to this budget band (or widen filters) to see 0–5 category scores. Brand preference still applies below.'}
            </p>
            <div className="rounded-xl border border-black/[0.06] bg-white/90 px-3 shadow-sm">
              {categories.map((c) => (
                <StarRow key={c.id} label={c.label} sub={c.explanation} value={c.score} />
              ))}
            </div>
          </div>

          <div className="border-t border-black/[0.08] px-4 py-4 sm:px-5">
            <h3 className="mb-3 text-[15px] font-semibold text-[#1C1C1E]">Full data</h3>
            <dl className="space-y-0 rounded-xl border border-black/[0.06] bg-white/90 shadow-sm">
              <div className="flex justify-between gap-3 border-b border-black/[0.06] px-3 py-2.5">
                <dt className="text-[13px] text-[#8E8E93]">Loan estimate</dt>
                <dd className="text-right text-[14px] font-medium text-[#1C1C1E]">
                  {car.priceThb > 0 ? `${formatCurrency(monthlyPay)}/mo` : '—'}
                </dd>
              </div>
              {SPEC_ROWS.map(({ label, key, fmt }) => (
                <div key={key} className="flex justify-between gap-3 border-b border-black/[0.06] px-3 py-2.5 last:border-0">
                  <dt className="text-[13px] text-[#8E8E93]">{label}</dt>
                  <dd className="max-w-[55%] text-right text-[14px] font-medium text-[#1C1C1E]">
                    {fmt(car[key])}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarDetailModal;
