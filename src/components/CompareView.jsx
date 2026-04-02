import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { calculateScores } from '../lib/scoring';
import { getCompareSummary } from '../lib/gemini.js';
import { formatCurrency, formatNumber, monthlyPayment, monthlyElectricity } from '../utils/humanize.js';
import { clsx } from 'clsx';

const CompareView = ({ onClose }) => {
  const { compareList, fleet, scenarioPriorityOrder } = useStore();
  const [aiSummary, setAiSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedCars = useMemo(() => {
    const cars = compareList.map(id => fleet.find(c => c.id === id)).filter(Boolean);
    return calculateScores(cars, scenarioPriorityOrder);
  }, [compareList, fleet, scenarioPriorityOrder]);

  useEffect(() => {
    setLoading(true);
    getCompareSummary(scenarioPriorityOrder, selectedCars)
      .then(res => setAiSummary(res))
      .finally(() => setLoading(false));
  }, [selectedCars, scenarioPriorityOrder]);

  if (selectedCars.length < 2) return null;

  const highestScore = Math.max(...selectedCars.map(c => c.score));

  const sections = [
    {
      title: 'WHAT IT COSTS',
      rows: [
        { label: 'Price', key: 'priceThb', format: (v) => formatCurrency(v) },
        { label: 'Monthly payment', key: 'priceThb', format: (v) => formatCurrency(monthlyPayment(v)) + '/mo' },
        { label: 'Electricity/month', key: 'id', format: (_, car) => formatCurrency(monthlyElectricity(car.rangeCity, car.efficiencyKwhPer100km)) + '/mo' },
        { label: '5-year total', key: 'priceThb', format: (v, car) => formatCurrency((monthlyPayment(v) * 60) + (monthlyElectricity(car.rangeCity, car.efficiencyKwhPer100km) * 60) + (v * 0.2)) }
      ]
    },
    {
      title: 'CAN YOU DO THE TRIP',
      rows: [
        { label: 'City range', key: 'rangeCity', format: (v) => `${v} km` },
        { label: 'Highway range', key: 'rangeHighway', format: (v) => `${v} km` },
        { label: 'Bangkok → Hua Hin', key: 'rangeHighway', format: (v) => v >= 450 ? 'Yes' : v >= 200 ? 'Tight' : 'No' },
        { label: 'Charges to 80% (DC)', key: 'timeToEightyMin', format: (v) => `~${v} min` }
      ]
    },
    {
      title: 'HOW IT FEELS',
      rows: [
        { label: '0–100 km/h', key: 'zeroToHundred', format: (v) => `${v}s` },
        { label: 'Drive type', key: 'driveType', format: (v) => v }
      ]
    },
    {
      title: 'DOES IT FIT YOUR LIFE',
      rows: [
        { label: 'Boot space', key: 'bootL', format: (v) => `${v}L` },
        { label: 'Seats', key: 'seats', format: (v) => v },
        { label: 'Car length', key: 'lengthMm', format: (v) => `${(v/1000).toFixed(2)}m` }
      ]
    },
    {
      title: 'PEACE OF MIND',
      rows: [
        { label: 'Warranty', key: 'warrantyYears', format: (v) => `${v} years` },
        { label: 'Bangkok service centers', key: 'bangkokServiceCenters', format: (v) => v },
        { label: 'Safety rating', key: 'safetyScore', format: (v) => '★'.repeat(v) + '☆'.repeat(5-v) },
        { label: 'Made in', key: 'countryOfOrigin', format: (v) => v, noHighlight: true }
      ]
    }
  ];

  const findWinner = (row, cars) => {
    if (row.noHighlight) return null;
    const values = cars.map(car => {
       if (row.key === 'id') return monthlyElectricity(car.rangeCity, car.efficiencyKwhPer100km);
       if (row.label === '5-year total') return (monthlyPayment(car.priceThb) * 60) + (monthlyElectricity(car.rangeCity, car.efficiencyKwhPer100km) * 60) + (car.priceThb * 0.2);
       return car[row.key];
    });

    // For these, lower is better
    const lowerIsBetter = ['Price', 'Monthly payment', 'Electricity/month', '5-year total', '0–100 km/h', 'Car length'].includes(row.label);
    
    const bestValue = lowerIsBetter ? Math.min(...values) : Math.max(...values);
    return cars.findIndex(car => {
       if (row.key === 'id') return monthlyElectricity(car.rangeCity, car.efficiencyKwhPer100km) === bestValue;
       if (row.label === '5-year total') return ((monthlyPayment(car.priceThb) * 60) + (monthlyElectricity(car.rangeCity, car.efficiencyKwhPer100km) * 60) + (car.priceThb * 0.2)) === bestValue;
       return car[row.key] === bestValue;
    });
  };

  return (
    <div className="fixed inset-0 z-[110] bg-[#F5F3EE] overflow-y-auto step-transition">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex justify-between items-center mb-16">
          <h1 className="text-6xl font-serif uppercase tracking-bauhaus-heading">THE VERDICT</h1>
          <button 
            onClick={onClose}
            className="text-4xl font-serif text-[#1A1A18]/30 hover:text-[#007AFF] transition-colors"
          >
            × CLOSE
          </button>
        </div>

        {/* Layer 1: Score Bar Header */}
        <div className="grid grid-cols-12 gap-0 mb-20 border-b-4 border-[#1A1A18]">
          <div className="col-span-3"></div>
          {selectedCars.map(car => (
            <div key={car.id} className="col-span-3 p-8 border-l-2 border-[#1A1A18]/10 text-center">
              <h3 className="text-2xl font-serif mb-1 leading-tight uppercase tracking-bauhaus-heading">{car.brand} {car.model}</h3>
              <p className="label uppercase tracking-widest text-muted font-bold mb-6">{car.countryOfOrigin}</p>
              
              <div className="relative h-4 bg-[#1A1A18]/5 rounded-full overflow-hidden mb-4">
                <div 
                  className={clsx(
                    "absolute top-0 left-0 h-full transition-all duration-1000",
                    car.score === highestScore ? "bg-[#007AFF]" : "bg-[#1A1A18]"
                  )}
                  style={{ width: `${car.score}%` }}
                />
              </div>
              <div className="flex justify-between items-baseline">
                <span className="label lowercase tracking-widest text-[#1A1A18]/40">Your match score</span>
                <span className="text-3xl font-serif">{car.score}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Layer 2: Spec Table */}
        <div className="mb-20">
          {sections.map(section => (
            <div key={section.title} className="mb-16">
              <h2 className="text-3xl font-serif mb-8 p-4 bg-[#1A1A18] text-white uppercase tracking-widest">{section.title}</h2>
              <div className="grid grid-cols-12 gap-0">
                {section.rows.map(row => {
                  const winnerIndex = findWinner(row, selectedCars);
                  return (
                    <React.Fragment key={row.label}>
                      <div className="col-span-3 p-6 border-b-2 border-[#1A1A18]/10 bg-[#1A1A18]/5">
                        <span className="label uppercase tracking-widest font-bold text-[#1A1A18]/60">{row.label}</span>
                      </div>
                      {selectedCars.map((car, idx) => (
                        <div key={car.id} className="col-span-3 p-6 border-b-2 border-l-2 border-[#1A1A18]/10 text-center relative">
                          <span className={clsx(
                            "text-xl font-mono tracking-bauhaus-mono",
                            idx === winnerIndex && "text-[#007AFF] font-bold"
                          )}>
                            {row.format(car[row.key], car)}
                          </span>
                          {idx === winnerIndex && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#007AFF]" />
                          )}
                        </div>
                      ))}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* AI Compare Summary */}
        <div className="p-16 bg-[#1A1A18] text-white mb-20 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 left-0 w-2 h-full bg-[#007AFF]" />
           <div className="max-w-4xl">
              <p className="label text-white/50 mb-8 uppercase tracking-widest font-bold">EXPERT VERDICT</p>
              {loading ? (
                 <div className="label lowercase tracking-widest animate-pulse opacity-50">Reviewing specifications...</div>
              ) : (
                <p className="text-3xl font-mono italic leading-relaxed text-white/90">
                   "{aiSummary}"
                </p>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default CompareView;
