import { PREFER_WESTERN_FILTER_TOP_N } from '../data/scenarios';

const scenarioWeights = {
  city: { rangeCity: 2, efficiencyKwhPer100km: 3, lengthMm: 1 },
  upcountry: { rangeHighway: 4, dcChargeKw: 3, timeToEightyMin: 2 },
  homeCharging: { rangeCity: 3, efficiencyKwhPer100km: 4 },
  family: { seats: 3, bootL: 3, safetyScore: 2 },
  noHeadache: { warrantyYears: 4, bangkokServiceCenters: 3, safetyScore: 2 },
  drivingFeel: { zeroToHundred: 4 },
  valueForMoney: { priceEfficiency: 5 },
  tightParking: { lengthMm: -3, widthMm: -2 },
  preferWestern: {},
};

const invertFields = [
  'zeroToHundred',
  'efficiencyKwhPer100km',
  'timeToEightyMin',
  'lengthMm',
  'widthMm',
  'priceThb',
];

/**
 * @param {object[]} cars
 * @param {string[]} scenarioPriorityOrder — scenario ids, highest priority first
 */
export function calculateScores(cars, scenarioPriorityOrder) {
  const order = scenarioPriorityOrder?.length ? scenarioPriorityOrder : [];

  let filteredCars = [...cars];
  const westernIdx = order.indexOf('preferWestern');
  if (westernIdx !== -1 && westernIdx < PREFER_WESTERN_FILTER_TOP_N) {
    filteredCars = filteredCars.filter((car) =>
      ['USA', 'Germany', 'Sweden'].includes(car.countryOfOrigin)
    );
  }

  if (filteredCars.length === 0) return [];

  const fieldsToNormalize = [
    'rangeCity',
    'rangeHighway',
    'dcChargeKw',
    'timeToEightyMin',
    'zeroToHundred',
    'bootL',
    'seats',
    'warrantyYears',
    'bangkokServiceCenters',
    'safetyScore',
    'lengthMm',
    'widthMm',
    'efficiencyKwhPer100km',
    'priceThb',
  ];

  const stats = {};
  fieldsToNormalize.forEach((field) => {
    const values = filteredCars.map((c) => c[field] || 0);
    stats[field] = {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  });

  const priceEfficiencies = filteredCars.map((car) => {
    const p = car.priceThb > 0 ? car.priceThb : 1;
    return (car.rangeCity / p) * 1000000;
  });
  const peMin = Math.min(...priceEfficiencies);
  const peMax = Math.max(...priceEfficiencies);

  const n = order.length || 1;

  const scoredCars = filteredCars.map((car) => {
    const normalized = {};
    fieldsToNormalize.forEach((field) => {
      const { min, max } = stats[field];
      let val = max === min ? 1 : (car[field] - min) / (max - min);
      if (invertFields.includes(field)) val = 1 - val;
      normalized[field] = val;
    });

    const peRaw = (car.rangeCity / (car.priceThb > 0 ? car.priceThb : 1)) * 1000000;
    normalized.priceEfficiency =
      peMax === peMin ? 1 : (peRaw - peMin) / (peMax - peMin);

    let totalScore = 0;
    let totalWeight = 0;

    order.forEach((scenario, rankIndex) => {
      const rankBoost = (n - rankIndex) / n;
      const weights = scenarioWeights[scenario];
      if (!weights) return;
      Object.entries(weights).forEach(([field, weight]) => {
        const absoluteWeight = Math.abs(weight);
        const w = absoluteWeight * rankBoost;
        const value = normalized[field] || 0;
        totalScore += value * w;
        totalWeight += w;
      });
    });

    const finalScore = totalWeight === 0 ? 50 : (totalScore / totalWeight) * 100;

    return {
      ...car,
      score: Math.round(finalScore),
    };
  });

  return scoredCars.sort((a, b) => b.score - a.score);
}
