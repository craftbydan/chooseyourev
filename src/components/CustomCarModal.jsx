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
    if (!carName) return;

    setLoading(true);
    setError(null);
    try {
      const data = await fetchCarData(carName);
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
    <div className="fixed inset-0 z-[120] bg-[#F5F3EE] flex flex-col p-12 overflow-y-auto step-transition">
      <div className="max-w-4xl mx-auto w-full flex flex-col items-center justify-center min-h-full">
        <button 
          onClick={onClose}
          className="absolute top-12 right-12 text-5xl font-serif text-[#1A1A18]/30 hover:text-[#D4420A] transition-colors"
        >
          ×
        </button>

        <div className="w-full mb-16 text-center">
          <h1 className="text-6xl font-serif uppercase tracking-bauhaus-heading mb-4">Which car are you looking for?</h1>
          <p className="label tracking-widest text-muted uppercase font-bold">TYPE A NAME AND WE'LL FETCH THE SPECS FOR YOU</p>
        </div>

        <form onSubmit={handleLookup} className="w-full mb-20">
          <div className="relative group">
            <input 
              type="text" 
              value={carName}
              onChange={(e) => setCarName(e.target.value)}
              placeholder="e.g. Volvo EX90"
              autoFocus
              className="w-full p-10 bg-transparent border-b-4 border-[#1A1A18] text-5xl font-serif focus:outline-none focus:border-[#D4420A] transition-colors placeholder:opacity-20 uppercase tracking-widest"
            />
            <button 
              type="submit"
              disabled={loading}
              className={clsx(
                "absolute right-4 bottom-8 text-5xl font-serif transition-all hover:scale-110",
                loading ? "animate-pulse text-muted" : "text-[#D4420A]"
              )}
            >
              {loading ? '...' : '→'}
            </button>
          </div>
          {loading && (
             <p className="label lowercase tracking-widest mt-8 animate-pulse text-center w-full">Looking up {carName}...</p>
          )}
          {error && (
             <p className="text-xl font-mono text-[#D4420A] mt-8 text-center italic">"Error: {error}"</p>
          )}
        </form>

        {previewCar && (
          <div className="w-full space-y-12 step-transition">
            <div className="border-t-4 border-[#1A1A18] pt-12">
               <p className="label mb-8 uppercase tracking-widest font-bold text-center">PREVIEWING FETCHED DATA</p>
               <CarCard car={previewCar} isHero scenarioPriorityOrder={[]} onCalculate={() => {}} />
            </div>
            
            <div className="flex justify-center">
               <button 
                 onClick={handleConfirm}
                 className="btn-primary py-8 px-16 text-2xl uppercase tracking-widest"
               >
                 Add to results →
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomCarModal;
