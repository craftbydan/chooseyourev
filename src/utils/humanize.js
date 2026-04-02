export function cityRangeLabel(km) {
  if (km >= 380) return `${km} km — gets you to Hua Hin and back`;
  if (km >= 250) return `${km} km — comfortable for daily Bangkok use`;
  return `${km} km — best kept to city trips`;
}

export function chargeLabel(min) {
  return `Charges to 80% in ~${min} min`;
}

export function monthlyPayment(price, downPct = 0.2, months = 48, annualRate = 0.0279) {
  if (price == null || Number.isNaN(price) || price <= 0) return 0;
  const principal = price * (1 - downPct);
  const r = annualRate / 12;
  return Math.round(principal * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
}

export function monthlyElectricity(rangeCity, efficiencyKwhPer100km, kmPerMonth = 1500, ratePerKwh = 4.20) {
  return Math.round((kmPerMonth / 100) * efficiencyKwhPer100km * ratePerKwh);
}

export function monthlyFuelCost(kmPerMonth = 1500, fuelEfficiency = 12, fuelPrice = 40) {
  return Math.round((kmPerMonth / fuelEfficiency) * fuelPrice);
}

export function huaHinTrip(rangeHighway) {
  // 225km one way
  if (rangeHighway >= 450) return 'Yes';
  if (rangeHighway >= 200) return 'Tight';
  return 'No';
}

export function formatCurrency(value) {
  if (value === null || value === undefined) return '฿-';
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0
  }).format(value);
}

export function formatNumber(value) {
  return new Intl.NumberFormat('th-TH').format(value);
}
