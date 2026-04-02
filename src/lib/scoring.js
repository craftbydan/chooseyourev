import { PREFER_WESTERN_FILTER_TOP_N, SCENARIOS } from '../data/scenarios';

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

/**
 * Same cohort used for ranking (segment list after optional western-brand filter).
 * @param {object[]} segmentCars — fleet filtered by segment only
 */
export function getPeerCarsForScoring(segmentCars, scenarioPriorityOrder) {
  const order = scenarioPriorityOrder?.length ? scenarioPriorityOrder : [];
  let filteredCars = [...segmentCars];
  const westernIdx = order.indexOf('preferWestern');
  if (westernIdx !== -1 && westernIdx < PREFER_WESTERN_FILTER_TOP_N) {
    filteredCars = filteredCars.filter((car) =>
      ['USA', 'Germany', 'Sweden'].includes(car.countryOfOrigin)
    );
  }
  return filteredCars;
}

function buildStats(filteredCars) {
  const stats = {};
  fieldsToNormalize.forEach((field) => {
    const values = filteredCars.map((c) => Number(c[field]) || 0);
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
  return { stats, peMin, peMax, priceEfficiencies };
}

function normalizedForCar(car, stats, peMin, peMax) {
  const normalized = {};
  fieldsToNormalize.forEach((field) => {
    const { min, max } = stats[field];
    let val = max === min ? 1 : ((Number(car[field]) || 0) - min) / (max - min);
    if (invertFields.includes(field)) val = 1 - val;
    normalized[field] = val;
  });
  const peRaw = (car.rangeCity / (car.priceThb > 0 ? car.priceThb : 1)) * 1000000;
  normalized.priceEfficiency = peMax === peMin ? 1 : (peRaw - peMin) / (peMax - peMin);
  return normalized;
}

/**
 * Peers = segment cohort used for match % (includes `car` if in list).
 * Returns each lifestyle category as 0–5 (higher = better fit vs peers).
 */
export function perCategoryFitOutOf5(car, peerCars) {
  if (!car || !peerCars?.length) {
    return SCENARIOS.map((s) => ({
      id: s.id,
      label: s.label,
      score: null,
      explanation: s.explanation,
    }));
  }

  if (peerCars.length < 2) {
    return SCENARIOS.map((s) => ({
      id: s.id,
      label: s.label,
      score:
        s.id === 'preferWestern'
          ? ['USA', 'Germany', 'Sweden'].includes(car.countryOfOrigin)
            ? 5
            : 0
          : null,
      explanation: s.explanation,
    }));
  }

  const extended = peerCars.some((c) => c.id === car.id) ? peerCars : [...peerCars, car];
  const { stats, peMin, peMax } = buildStats(extended);
  const normalized = normalizedForCar(car, stats, peMin, peMax);

  return SCENARIOS.map((s) => {
    const weights = scenarioWeights[s.id];
    if (s.id === 'preferWestern') {
      const ok = ['USA', 'Germany', 'Sweden'].includes(car.countryOfOrigin);
      return {
        id: s.id,
        label: s.label,
        score: ok ? 5 : 0,
        explanation: s.explanation,
      };
    }
    if (!weights || Object.keys(weights).length === 0) {
      return { id: s.id, label: s.label, score: null, explanation: s.explanation };
    }
    let num = 0;
    let den = 0;
    Object.entries(weights).forEach(([field, weight]) => {
      const w = Math.abs(weight);
      num += (normalized[field] ?? 0) * w;
      den += w;
    });
    const raw = den > 0 ? num / den : 0;
    const score = Math.round(raw * 50) / 10;
    return {
      id: s.id,
      label: s.label,
      score: Math.min(5, Math.max(0, score)),
      explanation: s.explanation,
    };
  });
}

/** Overall match 0–5 from the same 0–100 match score shown on cards. */
export function overallMatchOutOf5(score0to100) {
  if (score0to100 == null || Number.isNaN(score0to100)) return null;
  return Math.round((score0to100 / 20) * 10) / 10;
}

/**
 * @param {object[]} cars — segment-filtered fleet (western filter applied inside)
 * @param {string[]} scenarioPriorityOrder — scenario ids, highest priority first
 */
export function calculateScores(cars, scenarioPriorityOrder) {
  const order = scenarioPriorityOrder?.length ? scenarioPriorityOrder : [];
  const filteredCars = getPeerCarsForScoring(cars, scenarioPriorityOrder);

  if (filteredCars.length === 0) return [];

  const { stats, peMin, peMax } = buildStats(filteredCars);
  const n = order.length || 1;

  const scoredCars = filteredCars.map((car) => {
    const normalized = normalizedForCar(car, stats, peMin, peMax);

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
