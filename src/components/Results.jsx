import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { calculateScores, getPeerCarsForScoring } from '../lib/scoring';
import CarCard from './CarCard';
import FinanceCalc from './FinanceCalc';
import CustomCarModal from './CustomCarModal';
import { clsx } from 'clsx';
import { getScenarioById } from '../data/scenarios';

const segmentTitles = {
  spare: 'Spare / second car',
  middle: 'Stepping up (฿600k–1M)',
  main: 'Main car (฿1M+)',
};

/** How many matches to show in the main grid (rest below the fold) */
const GRID_PAGE_SIZE = 9;

const Results = ({ onEditLifestyle }) => {
  const { fleet, selectedSegment, scenarioPriorityOrder, compareList } = useStore();
  const [calculatingCar, setCalculatingCar] = useState(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  const segmentCars = useMemo(() => {
    if (!selectedSegment) return [];
    return fleet.filter((c) => c.segment === selectedSegment);
  }, [fleet, selectedSegment]);

  const peerCars = useMemo(
    () => getPeerCarsForScoring(segmentCars, scenarioPriorityOrder),
    [segmentCars, scenarioPriorityOrder]
  );

  const scoredCars = useMemo(() => {
    if (!selectedSegment) return [];
    return calculateScores(segmentCars, scenarioPriorityOrder);
  }, [selectedSegment, segmentCars, scenarioPriorityOrder]);

  const primaryGrid = scoredCars.slice(0, GRID_PAGE_SIZE);
  const others = scoredCars.slice(GRID_PAGE_SIZE);

  return (
    <div
      className={clsx(
        'mx-auto min-h-screen max-w-7xl px-4 pb-12 pt-2 step-transition sm:px-6 md:pb-20 md:pt-6',
        compareList.length > 0 && 'pb-40 sm:pb-44'
      )}
    >
      <div className="mb-8 flex flex-col gap-4 sm:mb-10 md:mb-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div>
            <p className="text-[13px] font-medium uppercase tracking-wide text-[#8E8E93]">Step 3 of 3</p>
            <h1 className="mt-1 text-[28px] font-semibold leading-tight tracking-tight text-[#1C1C1E] sm:text-[34px] md:text-[40px]">
              Here’s what fits.
            </h1>
            {selectedSegment && (
              <p className="mt-3 text-[15px] text-[#8E8E93]">
                Budget:{' '}
                <span className="font-semibold text-[#1C1C1E]">{segmentTitles[selectedSegment]}</span>
              </p>
            )}
            {scoredCars.length > 0 && (
              <p className="mt-2 text-[15px] text-[#8E8E93]">
                <span className="font-semibold text-[#1C1C1E]">{scoredCars.length}</span> cars ranked for
                you — compare several side by side.
              </p>
            )}
          </div>
          {onEditLifestyle && (
            <button
              type="button"
              onClick={onEditLifestyle}
              className="inline-flex min-h-[44px] w-fit items-center text-[17px] font-normal text-[#007AFF] active:opacity-60"
            >
              ‹ Edit priorities
            </button>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-[13px] font-medium text-[#8E8E93]">Your priorities (top first)</p>
          <ol className="flex flex-wrap gap-2">
            {scenarioPriorityOrder.slice(0, 5).map((id, i) => (
              <li
                key={id}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[13px] font-medium text-[#1C1C1E] shadow-sm ring-1 ring-black/[0.06]"
              >
                <span className="text-[#8E8E93]">{i + 1}.</span>
                {getScenarioById(id)?.label ?? id}
              </li>
            ))}
            {scenarioPriorityOrder.length > 5 && (
              <li className="self-center text-[13px] text-[#8E8E93]">
                +{scenarioPriorityOrder.length - 5} more
              </li>
            )}
          </ol>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-6">
        {primaryGrid.length > 0 ? (
          <>
            <div className="md:col-span-12">
              <h2 className="mb-3 text-[20px] font-semibold tracking-tight text-[#1C1C1E]">Top matches</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {primaryGrid.map((car, i) => (
                  <CarCard
                    key={car.id}
                    car={car}
                    index={i}
                    compact
                    isHero={i === 0}
                    scenarioPriorityOrder={scenarioPriorityOrder}
                    peerCars={peerCars}
                    onCalculate={setCalculatingCar}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="md:col-span-12 rounded-2xl border border-dashed border-[#C7C7CC] bg-white p-12 text-center shadow-sm sm:p-16">
            <h2 className="text-[22px] font-semibold text-[#1C1C1E]">No cars in this list</h2>
            <p className="mx-auto mt-3 max-w-md text-[17px] leading-relaxed text-[#8E8E93]">
              <strong className="font-semibold text-[#1C1C1E]">US or European brands</strong> is high on your list (top
              five), so we’re only showing those. Drag that line lower on the last step, or change your budget, to see
              more cars.
            </p>
          </div>
        )}

        {others.length > 0 && (
          <div className="md:col-span-12 mt-10 border-t border-black/[0.08] pt-10">
            <h2 className="mb-4 text-[20px] font-semibold tracking-tight text-[#1C1C1E]">More options</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((car, i) => (
                <CarCard
                  key={car.id}
                  car={car}
                  index={primaryGrid.length + i}
                  compact
                  isHero={false}
                  scenarioPriorityOrder={scenarioPriorityOrder}
                  peerCars={peerCars}
                  onCalculate={setCalculatingCar}
                />
              ))}
            </div>
          </div>
        )}

        <div className="md:col-span-12 mt-10 lg:col-span-6 lg:max-w-md">
          <button
            type="button"
            onClick={() => setIsCustomModalOpen(true)}
            className="group flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#C7C7CC] bg-white px-6 py-10 shadow-sm transition-all active:scale-[0.99] hover:border-[#007AFF]/50 hover:shadow-md sm:py-12"
          >
            <span className="mb-2 text-4xl font-light text-[#C7C7CC] transition-colors group-hover:text-[#007AFF]">+</span>
            <span className="text-[15px] font-semibold text-[#007AFF]">Add a car</span>
          </button>
        </div>
      </div>

      {calculatingCar && <FinanceCalc car={calculatingCar} onClose={() => setCalculatingCar(null)} />}

      {isCustomModalOpen && <CustomCarModal onClose={() => setIsCustomModalOpen(false)} />}
    </div>
  );
};

export default Results;
