import React, { useState, useEffect } from 'react';
import { getFinanceSentence } from '../lib/gemini.js';
import { monthlyPayment, monthlyElectricity, monthlyFuelCost, formatCurrency } from '../utils/humanize.js';
import { clsx } from 'clsx';

const TERM_OPTIONS = [24, 36, 48, 60, 72];

function StatBlock({ value, label, accent }) {
  return (
    <div className="rounded-xl bg-white/[0.06] px-4 py-4 ring-1 ring-white/[0.08]">
      <p
        className={clsx(
          'text-[22px] font-semibold tabular-nums leading-tight tracking-tight sm:text-[24px]',
          accent ? 'text-[#64D2FF]' : 'text-white'
        )}
      >
        {value}
      </p>
      <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-white/45">{label}</p>
    </div>
  );
}

const FinanceCalc = ({ car, onClose }) => {
  const [downPct, setDownPct] = useState(0.2);
  const [months, setMonths] = useState(48);
  const [rate, setRate] = useState(2.79);
  const [kmMonth, setKmMonth] = useState(1500);
  const [elecRate, setElecRate] = useState(4.2);
  const [fuelPrice, setFuelPrice] = useState(40);
  const [fuelEff, setFuelEff] = useState(12);

  const [aiSentence, setAiSentence] = useState('');
  const [loading, setLoading] = useState(false);

  const priceThb = car.priceThb ?? 0;
  const monthlyLoan = monthlyPayment(priceThb, downPct, months, rate / 100);
  const monthlyElec = monthlyElectricity(car.rangeCity, car.efficiencyKwhPer100km, kmMonth, elecRate);
  const fuelCost = monthlyFuelCost(kmMonth, fuelEff, fuelPrice);
  const savings = fuelCost - monthlyElec;
  const total5yr = monthlyLoan * Math.min(months, 60) + monthlyElec * 60 + priceThb * downPct;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getFinanceSentence(car, priceThb, monthlyLoan, monthlyElec, savings, total5yr)
      .then((res) => {
        if (!cancelled) setAiSentence(res);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [car, priceThb, monthlyLoan, monthlyElec, savings, total5yr]);

  const inputClass =
    'w-full min-h-[48px] rounded-xl border border-black/[0.12] bg-white px-4 py-3 text-[17px] font-medium tabular-nums text-[#1C1C1E] focus:border-[#007AFF] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/25';

  const labelClass = 'mb-2 block text-[13px] font-medium text-[#8E8E93]';

  return (
    <div
      className="fixed inset-0 z-[180] flex justify-end bg-black/35 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="finance-calc-title"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-md flex-col border-l border-black/[0.08] bg-[#F2F2F7] shadow-2xl sm:max-w-lg sm:rounded-l-[1.25rem]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-black/[0.08] px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-[#8E8E93]">Finance</p>
            <h2 id="finance-calc-title" className="truncate text-[17px] font-semibold text-[#1C1C1E] sm:text-[19px]">
              {car.brand} {car.model}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] shrink-0 rounded-xl text-[22px] leading-none text-[#8E8E93] transition-colors hover:text-[#1C1C1E] active:opacity-70"
            aria-label="Close finance calculator"
          >
            ×
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
          <p className="mb-6 text-[28px] font-semibold tabular-nums tracking-tight text-[#007AFF] sm:text-[32px]">
            {priceThb > 0 ? formatCurrency(priceThb) : 'Price not set'}
          </p>

          <section className="space-y-6">
            <div>
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <span className="text-[13px] font-medium text-[#8E8E93]">Down payment</span>
                <span className="text-[15px] font-semibold tabular-nums text-[#1C1C1E]">
                  {Math.round(downPct * 100)}% · {formatCurrency(priceThb * downPct)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.05"
                value={downPct}
                onChange={(e) => setDownPct(parseFloat(e.target.value))}
                className="w-full accent-[#007AFF]"
              />
            </div>

            <div>
              <span className={labelClass}>Loan term</span>
              <div className="flex flex-wrap gap-2">
                {TERM_OPTIONS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMonths(m)}
                    className={clsx(
                      'min-h-[40px] min-w-[3.25rem] rounded-full px-4 text-[14px] font-semibold transition-colors',
                      months === m
                        ? 'bg-[#1C1C1E] text-white'
                        : 'bg-white text-[#1C1C1E] ring-1 ring-black/[0.1] active:bg-[#E5E5EA]'
                    )}
                  >
                    {m} mo
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="finance-rate">
                Annual interest rate (%)
              </label>
              <input
                id="finance-rate"
                type="number"
                value={rate}
                step="0.01"
                onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                className={inputClass}
              />
            </div>
          </section>

          <section className="mt-8 space-y-6 border-t border-black/[0.08] pt-8">
            <div>
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <span className="text-[13px] font-medium text-[#8E8E93]">Km driven / month</span>
                <span className="text-[15px] font-semibold tabular-nums text-[#1C1C1E]">{kmMonth} km</span>
              </div>
              <input
                type="range"
                min="500"
                max="5000"
                step="100"
                value={kmMonth}
                onChange={(e) => setKmMonth(parseInt(e.target.value, 10))}
                className="w-full accent-[#007AFF]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="finance-elec">
                  Electricity (฿/kWh)
                </label>
                <input
                  id="finance-elec"
                  type="number"
                  value={elecRate}
                  step="0.1"
                  onChange={(e) => setElecRate(parseFloat(e.target.value) || 0)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="finance-fuel">
                  Petrol (฿/L)
                </label>
                <input
                  id="finance-fuel"
                  type="number"
                  value={fuelPrice}
                  step="0.5"
                  onChange={(e) => setFuelPrice(parseFloat(e.target.value) || 0)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="finance-fuel-eff">
                Petrol car (km/L) for comparison
              </label>
              <input
                id="finance-fuel-eff"
                type="number"
                value={fuelEff}
                step="0.5"
                onChange={(e) => setFuelEff(parseFloat(e.target.value) || 1)}
                className={inputClass}
              />
            </div>
          </section>

          <section className="mt-8 rounded-2xl bg-[#1C1C1E] p-5 sm:p-6">
            <p className="mb-4 text-[13px] font-semibold uppercase tracking-wide text-white/40">Estimates</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <StatBlock value={formatCurrency(monthlyLoan)} label="Loan / month" accent />
              <StatBlock value={formatCurrency(monthlyElec)} label="Electricity / month" accent />
              <StatBlock value={formatCurrency(savings)} label="vs petrol / month" />
              <StatBlock value={formatCurrency(total5yr)} label="5-year total (rough)" />
            </div>

            <div className="mt-5 border-t border-white/[0.1] pt-5">
              {loading ? (
                <p className="text-[14px] text-white/45">Generating a quick take…</p>
              ) : (
                <p className="text-[15px] leading-relaxed text-white/85">
                  {aiSentence?.replace(/^["']|["']$/g, '')}
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default FinanceCalc;
