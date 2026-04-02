import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { getFinanceSentence } from '../lib/gemini.js';
import { monthlyPayment, monthlyElectricity, monthlyFuelCost, formatCurrency } from '../utils/humanize.js';
import { clsx } from 'clsx';

const FinanceCalc = ({ car, onClose }) => {
  const [downPct, setDownPct] = useState(0.2);
  const [months, setMonths] = useState(48);
  const [rate, setRate] = useState(2.79);
  const [kmMonth, setKmMonth] = useState(1500);
  const [elecRate, setElecRate] = useState(4.20);
  const [fuelPrice, setFuelPrice] = useState(40);
  const [fuelEff, setFuelEff] = useState(12);
  
  const [aiSentence, setAiSentence] = useState('');
  const [loading, setLoading] = useState(false);

  const priceThb = car.priceThb ?? 0;
  const monthlyLoan = monthlyPayment(priceThb, downPct, months, rate / 100);
  const monthlyElec = monthlyElectricity(car.rangeCity, car.efficiencyKwhPer100km, kmMonth, elecRate);
  const fuelCost = monthlyFuelCost(kmMonth, fuelEff, fuelPrice);
  const savings = fuelCost - monthlyElec;
  const total5yr =
    (monthlyLoan * Math.min(months, 60)) + monthlyElec * 60 + priceThb * downPct;

  useEffect(() => {
    setLoading(true);
    getFinanceSentence(car, priceThb, monthlyLoan, monthlyElec, savings, total5yr)
      .then(res => setAiSentence(res))
      .finally(() => setLoading(false));
  }, [car]);

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-[#1A1A18]/20 backdrop-blur-sm transition-all duration-300">
      <div className="w-full max-w-xl h-full bg-white shadow-2xl p-12 overflow-y-auto panel-slide-in relative">
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 text-4xl font-serif text-[#1A1A18]/30 hover:text-[#007AFF] transition-colors"
        >
          ×
        </button>
        
        <div className="mb-12">
          <p className="label mb-3 uppercase tracking-widest font-bold opacity-50">FINANCE CALCULATOR</p>
          <h2 className="text-3xl sm:text-5xl font-serif mb-3 leading-tight uppercase tracking-tight">{car.brand} {car.model}</h2>
          <p className="text-2xl font-serif text-[#007AFF] uppercase tracking-widest">
            {priceThb > 0 ? formatCurrency(priceThb) : 'Price not set'}
          </p>
        </div>

        <div className="space-y-10 border-t-2 border-[#1A1A18]/10 pt-10">
           {/* Loan Settings */}
           <div className="space-y-8">
             <div>
               <div className="flex justify-between items-baseline mb-4">
                 <label className="label uppercase tracking-widest font-bold">DOWN PAYMENT</label>
                 <span className="text-sm font-mono font-bold tracking-tight">{Math.round(downPct * 100)}% ({formatCurrency(priceThb * downPct)})</span>
               </div>
               <input 
                 type="range" min="0" max="0.5" step="0.05" value={downPct} 
                 onChange={(e) => setDownPct(parseFloat(e.target.value))}
                 className="w-full accent-[#007AFF]"
               />
             </div>

             <div>
               <label className="label block mb-4 uppercase tracking-widest font-bold">LOAN TERM (MONTHS)</label>
               <div className="grid grid-cols-5 gap-0 border-2 border-[#1A1A18] rounded-sm overflow-hidden">
                 {[24, 36, 48, 60, 72].map(m => (
                   <button 
                     key={m} 
                     onClick={() => setMonths(m)}
                     className={clsx(
                       "py-3 font-mono text-xs border-r-2 last:border-r-0 border-[#1A1A18] transition-colors",
                       months === m ? "bg-[#1A1A18] text-white" : "hover:bg-[#F5F3EE] bg-white"
                     )}
                   >
                     {m}
                   </button>
                 ))}
               </div>
             </div>

             <div>
               <label className="label block mb-4 uppercase tracking-widest font-bold">ANNUAL INTEREST RATE (%)</label>
               <input 
                 type="number" value={rate} step="0.01"
                 onChange={(e) => setRate(parseFloat(e.target.value))}
                 className="w-full p-4 border-2 border-[#1A1A18] font-mono text-lg focus:outline-none focus:border-[#007AFF] rounded-sm"
               />
             </div>
           </div>

           {/* Running Costs */}
           <div className="space-y-8 border-t-2 border-[#1A1A18]/10 pt-10">
             <div>
               <div className="flex justify-between items-baseline mb-4">
                 <label className="label uppercase tracking-widest font-bold">KM DRIVEN / MONTH</label>
                 <span className="text-lg font-mono font-medium tracking-bauhaus-mono">{kmMonth} km</span>
               </div>
               <input 
                 type="range" min="500" max="5000" step="100" value={kmMonth} 
                 onChange={(e) => setKmMonth(parseInt(e.target.value))}
                 className="w-full accent-[#007AFF]"
               />
             </div>

             <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="label block mb-4 uppercase tracking-widest font-bold">ELEC. (฿/KWH)</label>
                  <input 
                    type="number" value={elecRate} step="0.1"
                    onChange={(e) => setElecRate(parseFloat(e.target.value))}
                    className="w-full p-4 border-2 border-[#1A1A18] font-mono text-lg focus:outline-none focus:border-[#007AFF] rounded-sm"
                  />
                </div>
                <div>
                  <label className="label block mb-4 uppercase tracking-widest font-bold">FUEL (฿/L)</label>
                  <input 
                    type="number" value={fuelPrice} step="0.5"
                    onChange={(e) => setFuelPrice(parseFloat(e.target.value))}
                    className="w-full p-4 border-2 border-[#1A1A18] font-mono text-lg focus:outline-none focus:border-[#007AFF] rounded-sm"
                  />
                </div>
             </div>
           </div>

           {/* Results Output */}
           <div className="bg-[#1A1A18] text-white p-12 -mx-12 mb-[-3rem] space-y-12">
             <div className="grid grid-cols-2 gap-x-12 gap-y-10 border-b-2 border-white/10 pb-10">
               <div>
                 <p className="text-4xl font-serif text-[#007AFF] mb-2">{formatCurrency(monthlyLoan)}</p>
                 <p className="label text-white/50 uppercase tracking-widest font-bold">LOAN PAYMENT</p>
               </div>
               <div>
                 <p className="text-4xl font-serif text-[#007AFF] mb-2">{formatCurrency(monthlyElec)}</p>
                 <p className="label text-white/50 uppercase tracking-widest font-bold">ELEC. COST</p>
               </div>
               <div>
                 <p className="text-4xl font-serif text-white mb-2">{formatCurrency(savings)}</p>
                 <p className="label text-white/50 uppercase tracking-widest font-bold">FUEL SAVING</p>
               </div>
               <div>
                 <p className="text-4xl font-serif text-white mb-2">{formatCurrency(total5yr)}</p>
                 <p className="label text-white/50 uppercase tracking-widest font-bold">TOTAL OVER 5 YRS</p>
               </div>
             </div>

             <div className="min-h-[4rem]">
               {loading ? (
                 <div className="label lowercase tracking-widest animate-pulse opacity-50">Thinking about your money...</div>
               ) : (
                 <p className="text-xl font-mono italic leading-relaxed text-white/90">
                   "{aiSentence}"
                 </p>
               )}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceCalc;
