import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { fetchCarData } from '../lib/gemini.js';
import CarCard from './CarCard';
import { clsx } from 'clsx';

const CustomCarModal = ({ onClose }) => {
  const { addCustomCar } = useStore();
  const [carName, setCarName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewCar, setPreviewCar] = useState(null);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!carName.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await fetchCarData(carName.trim());
      setPreviewCar(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    addCustomCar(previewCar);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[170] flex items-end justify-center bg-black/35 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-car-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(92dvh,820px)] w-full max-w-lg flex-col rounded-t-[1.25rem] border border-black/[0.08] bg-[#F2F2F7] shadow-2xl sm:max-w-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-black/[0.08] px-4 py-3 sm:px-5">
          <div>
            <h2 id="add-car-title" className="text-[17px] font-semibold tracking-tight text-[#1C1C1E]">
              Add a car
            </h2>
            <p className="mt-0.5 text-[13px] text-[#8E8E93]">
              Look up Thai-market specs with AI. Add your Gemini API key in the project <span className="font-medium text-[#636366]">.env</span> file if
              lookups fail.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-2 min-h-[44px] min-w-[44px] shrink-0 rounded-xl text-[22px] leading-none text-[#8E8E93] active:opacity-70"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
          <form onSubmit={handleLookup} className="space-y-3">
            <label htmlFor="custom-car-search" className="sr-only">
              Car name
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <input
                id="custom-car-search"
                type="text"
                value={carName}
                onChange={(e) => setCarName(e.target.value)}
                placeholder="e.g. Volvo EX90"
                autoFocus
                className="min-h-[48px] flex-1 rounded-xl border border-black/[0.1] bg-white px-4 py-3 text-[16px] text-[#1C1C1E] placeholder:text-[#C7C7CC] focus:border-[#007AFF] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/25"
              />
              <button
                type="submit"
                disabled={loading || !carName.trim()}
                className={clsx(
                  'min-h-[48px] shrink-0 rounded-xl px-6 text-[16px] font-semibold text-white transition-opacity sm:px-8',
                  loading || !carName.trim()
                    ? 'cursor-not-allowed bg-[#C7C7CC]'
                    : 'bg-[#007AFF] shadow-sm active:opacity-85'
                )}
              >
                {loading ? '…' : 'Look up'}
              </button>
            </div>
            {loading && (
              <p className="text-[14px] text-[#8E8E93]">Looking up {carName.trim()}…</p>
            )}
            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] leading-snug text-[#B42318]">
                {error}
              </p>
            )}
          </form>

          {previewCar && (
            <div className="mt-6 space-y-4 border-t border-black/[0.08] pt-6">
              <p className="text-[13px] font-medium text-[#8E8E93]">Preview</p>
              <CarCard
                car={previewCar}
                isHero
                scenarioPriorityOrder={[]}
                peerCars={previewCar ? [previewCar] : []}
                onCalculate={() => {}}
              />
              <button
                type="button"
                onClick={handleConfirm}
                className="btn-primary w-full min-h-[48px] rounded-xl py-3 text-[16px] font-semibold"
              >
                Add to results
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomCarModal;
