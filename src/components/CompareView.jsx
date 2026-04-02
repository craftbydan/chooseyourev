import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { calculateScores } from '../lib/scoring';
import { getCompareSummary } from '../lib/gemini.js';
import { formatCurrency, monthlyPayment, monthlyElectricity } from '../utils/humanize.js';
import { clsx } from 'clsx';

const CompareView = ({ onClose }) => {
  const { compareList, fleet, scenarioPriorityOrder } = useStore();
  const [aiSummary, setAiSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedCars = useMemo(() => {
    const cars = compareList.map((id) => fleet.find((c) => c.id === id)).filter(Boolean);
    return calculateScores(cars, scenarioPriorityOrder);
  }, [compareList, fleet, scenarioPriorityOrder]);

  useEffect(() => {
    setLoading(true);
    getCompareSummary(scenarioPriorityOrder, selectedCars)
      .then((res) => setAiSummary(res))
      .finally(() => setLoading(false));
  }, [selectedCars, scenarioPriorityOrder]);

  if (selectedCars.length < 2) return null;

  const highestScore = Math.max(...selectedCars.map((c) => c.score));
  const n = selectedCars.length;

  const gridTemplate = `minmax(10.5rem, 13rem) repeat(${n}, minmax(0, 1fr))`;
  /** Wide compare tables: horizontal scroll on narrow phones instead of squashed columns */
  const gridMinWidth = `max(100%, calc(10.25rem + ${n} * 5.25rem))`;

  const sections = [
    {
      title: 'What it costs',
      rows: [
        { label: 'Price', key: 'priceThb', format: (v) => formatCurrency(v) },
        {
          label: 'Monthly payment',
          key: 'priceThb',
          format: (v) => `${formatCurrency(monthlyPayment(v))}/mo`,
        },
        {
          label: 'Electricity / month',
          key: 'id',
          format: (_, car) =>
            `${formatCurrency(monthlyElectricity(car.rangeCity, car.efficiencyKwhPer100km))}/mo`,
        },
        {
          label: '5-year total (rough)',
          key: 'priceThb',
          format: (v, car) =>
            formatCurrency(
              monthlyPayment(v) * 60 +
                monthlyElectricity(car.rangeCity, car.efficiencyKwhPer100km) * 60 +
                v * 0.2
            ),
        },
      ],
    },
    {
      title: 'Can you do the trip',
      rows: [
        { label: 'City range', key: 'rangeCity', format: (v) => `${v} km` },
        { label: 'Highway range', key: 'rangeHighway', format: (v) => `${v} km` },
        {
          label: 'Bangkok → Hua Hin',
          key: 'rangeHighway',
          format: (v) => (v >= 450 ? 'Yes' : v >= 200 ? 'Tight' : 'No'),
        },
        { label: 'Charge to 80% (DC)', key: 'timeToEightyMin', format: (v) => `~${v} min` },
      ],
    },
    {
      title: 'How it feels',
      rows: [
        { label: '0–100 km/h', key: 'zeroToHundred', format: (v) => `${v}s` },
        { label: 'Drive type', key: 'driveType', format: (v) => v, noHighlight: true },
      ],
    },
    {
      title: 'Does it fit your life',
      rows: [
        { label: 'Boot', key: 'bootL', format: (v) => `${v} L` },
        { label: 'Seats', key: 'seats', format: (v) => String(v) },
        { label: 'Length', key: 'lengthMm', format: (v) => `${(v / 1000).toFixed(2)} m` },
      ],
    },
    {
      title: 'Peace of mind',
      rows: [
        { label: 'Warranty', key: 'warrantyYears', format: (v) => `${v} yr` },
        { label: 'Bangkok service centers', key: 'bangkokServiceCenters', format: (v) => String(v) },
        {
          label: 'Safety',
          key: 'safetyScore',
          format: (v) => (v > 0 ? '★'.repeat(Math.min(5, v)) + '☆'.repeat(Math.max(0, 5 - v)) : '—'),
        },
        { label: 'Made in', key: 'countryOfOrigin', format: (v) => v, noHighlight: true },
      ],
    },
  ];

  const numericForRow = (row, car) => {
    if (row.key === 'id') return monthlyElectricity(car.rangeCity, car.efficiencyKwhPer100km);
    if (row.label === '5-year total (rough)')
      return (
        monthlyPayment(car.priceThb) * 60 +
        monthlyElectricity(car.rangeCity, car.efficiencyKwhPer100km) * 60 +
        car.priceThb * 0.2
      );
    const v = car[row.key];
    return typeof v === 'number' ? v : Number(v) || 0;
  };

  const findWinnerIndex = (row, cars) => {
    if (row.noHighlight) return null;
    const values = cars.map((car) => numericForRow(row, car));
    const lowerIsBetter = [
      'Price',
      'Monthly payment',
      'Electricity / month',
      '5-year total (rough)',
      '0–100 km/h',
      'Length',
    ].includes(row.label);
    const best = lowerIsBetter ? Math.min(...values) : Math.max(...values);
    const idx = values.findIndex((v) => v === best);
    return idx;
  };

  return (
    <div
      className="fixed inset-0 z-[185] flex flex-col justify-end bg-black/35 backdrop-blur-sm sm:justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] min-h-0 flex-1 flex-col bg-[#F2F2F7] sm:max-h-[calc(100dvh-2rem)] sm:max-w-6xl sm:flex-none sm:rounded-2xl sm:border sm:border-black/[0.08] sm:shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-black/[0.08] px-4 py-3 sm:px-6 sm:py-4">
          <div>
            <h1 id="compare-title" className="text-[22px] font-semibold tracking-tight text-[#1C1C1E] sm:text-[26px]">
              Compare
            </h1>
            <p className="mt-0.5 text-[14px] text-[#8E8E93]">Side-by-side specs · best value per row highlighted in blue</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] shrink-0 rounded-xl px-4 text-[15px] font-semibold text-[#007AFF] active:opacity-70"
          >
            Done
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-[max(2rem,calc(1rem+env(safe-area-inset-bottom,0px)))] pt-4 sm:px-6">
          <div className="-mx-4 overflow-x-auto overscroll-x-contain px-4 [-webkit-overflow-scrolling:touch] sm:mx-0 sm:overflow-x-visible sm:px-0">
            <div style={{ minWidth: gridMinWidth }}>
          {/* Car column headers + match */}
          <div
            className="mb-6 gap-px overflow-hidden rounded-xl border border-black/[0.08] bg-black/[0.08] shadow-sm"
            style={{ display: 'grid', gridTemplateColumns: gridTemplate }}
          >
            <div className="flex min-h-[5rem] items-center bg-[#E5E5EA] px-3 py-3 sm:px-4">
              <span className="text-[12px] font-semibold uppercase tracking-wide text-[#636366]">Match</span>
            </div>
            {selectedCars.map((car) => (
              <div
                key={car.id}
                className="flex min-h-[5rem] flex-col justify-center bg-white px-3 py-3 text-center sm:px-4"
              >
                <p className="text-[15px] font-semibold leading-tight text-[#1C1C1E] sm:text-[16px]">
                  {car.brand} {car.model}
                </p>
                <p className="mt-1 text-[12px] text-[#8E8E93]">{car.countryOfOrigin}</p>
                <div className="mt-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#E5E5EA]">
                    <div
                      className={clsx(
                        'h-full rounded-full transition-all',
                        car.score === highestScore ? 'bg-[#007AFF]' : 'bg-[#AEAEB2]'
                      )}
                      style={{ width: `${car.score}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[20px] font-semibold tabular-nums text-[#1C1C1E]">{car.score}</p>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-[#8E8E93]">Your match</p>
                </div>
              </div>
            ))}
          </div>

          {sections.map((section) => (
            <div key={section.title} className="mb-6">
              <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-[#8E8E93]">
                {section.title}
              </h2>
              <div
                className="overflow-hidden rounded-xl border border-black/[0.08] bg-black/[0.06]"
                style={{ display: 'grid', gridTemplateColumns: gridTemplate }}
              >
                {section.rows.map((row, rowIdx) => {
                  const winnerIdx = findWinnerIndex(row, selectedCars);
                  const isLast = rowIdx === section.rows.length - 1;
                  return (
                    <React.Fragment key={row.label}>
                      <div
                        className={clsx(
                          'flex items-center border-black/[0.06] bg-[#F2F2F7] px-3 py-3 sm:px-4',
                          !isLast && 'border-b'
                        )}
                      >
                        <span className="text-[14px] font-medium leading-snug text-[#636366]">{row.label}</span>
                      </div>
                      {selectedCars.map((car, idx) => {
                        const isWin = winnerIdx === idx;
                        return (
                          <div
                            key={car.id}
                            className={clsx(
                              'flex items-center justify-center border-black/[0.06] bg-white px-2 py-3 text-center sm:px-3',
                              !isLast && 'border-b',
                              isWin && 'bg-[rgba(0,122,255,0.07)]'
                            )}
                          >
                            <span
                              className={clsx(
                                'text-[15px] font-semibold tabular-nums text-[#1C1C1E] sm:text-[16px]',
                                isWin && 'text-[#007AFF]'
                              )}
                            >
                              {row.format(car[row.key], car)}
                            </span>
                          </div>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          ))}
            </div>
          </div>

          <div className="rounded-2xl border border-black/[0.08] bg-[#1C1C1E] p-5 sm:p-6">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-white/45">AI summary</p>
            {loading ? (
              <p className="text-[15px] text-white/50">Reviewing specs…</p>
            ) : (
              <p className="text-[16px] leading-relaxed text-white/90 sm:text-[17px]">
                {aiSummary?.replace(/^["']|["']$/g, '')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompareView;
