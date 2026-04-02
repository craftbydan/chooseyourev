import React, { useState, useEffect } from 'react';
import { useStore } from './store/useStore';
import SegmentGate from './components/SegmentGate';
import ScenarioCards from './components/ScenarioCards';
import Results from './components/Results';
import CompareBar from './components/CompareBar';
import CompareView from './components/CompareView';
import AppProgress from './components/AppProgress';
import CarLibrary from './components/CarLibrary';
import { clsx } from 'clsx';

function App() {
  const { selectedSegment, reset, setSegment } = useStore();
  const [step, setStep] = useState(1);
  const [isComparing, setIsComparing] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  // Advance step 1 -> 2
  useEffect(() => {
    if (selectedSegment && step === 1) {
      setStep(2);
    }
    // If reset, go back to step 1
    if (!selectedSegment && step !== 1) {
      setStep(1);
    }
  }, [selectedSegment, step]);

  const handleFindMyCar = () => {
    setStep(3);
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#F2F2F7] text-[#1C1C1E] selection:bg-[#007AFF]/25 selection:text-[#1C1C1E]">
      <nav
        className={clsx(
          'fixed left-0 right-0 top-0 z-[150] border-b border-black/[0.08] px-4 sm:px-6 md:px-10',
          'pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-3 md:pb-4 md:pt-[calc(1rem+env(safe-area-inset-top,0px))]',
          'bg-[#F2F2F7]/85 backdrop-blur-xl backdrop-saturate-150'
        )}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <button
            type="button"
            onClick={reset}
            className="flex min-h-[44px] min-w-0 items-center gap-3 rounded-xl p-1 text-left active:opacity-70"
            aria-label="Choose Your EV — home / start over"
          >
            <img
              src="/favicon.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-black/[0.08]"
            />
            <div className="flex min-w-0 flex-col sm:flex-row sm:items-baseline sm:gap-2">
              <span className="text-[17px] font-semibold leading-tight tracking-tight text-[#1C1C1E] md:text-[19px]">
                Choose Your EV
              </span>
              <span className="text-[13px] font-medium text-[#8E8E93]">Thailand</span>
            </div>
          </button>
          <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
            <AppProgress currentStep={step} />
            <button
              type="button"
              onClick={() => setLibraryOpen(true)}
              className="min-h-[40px] shrink-0 rounded-xl border border-black/[0.12] bg-white/90 px-4 py-2 text-[15px] font-semibold text-[#1C1C1E] shadow-sm active:opacity-80"
            >
              Car library
            </button>
            {step > 1 && (
              <button type="button" onClick={reset} className="btn-primary min-h-[40px] shrink-0 px-4 py-2 text-[15px]">
                Start over
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-[calc(7rem+env(safe-area-inset-top,0px))] sm:pt-[calc(6.5rem+env(safe-area-inset-top,0px))] md:pt-[calc(7rem+env(safe-area-inset-top,0px))]">
        {step === 1 && <SegmentGate />}
        
        {step === 2 && (
          <ScenarioCards
            onFindMyCar={handleFindMyCar}
            onBackToBudget={() => setSegment(null)}
          />
        )}
        
        {step === 3 && (
          <>
            <Results onEditLifestyle={() => setStep(2)} />
            <CompareBar onCompare={() => setIsComparing(true)} />
            {isComparing && (
              <CompareView onClose={() => setIsComparing(false)} />
            )}
          </>
        )}
      </main>

      {libraryOpen && <CarLibrary onClose={() => setLibraryOpen(false)} />}
    </div>
  );
}

export default App;
