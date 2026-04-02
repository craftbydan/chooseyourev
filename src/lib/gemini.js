import { formatPriorityListForAi } from '../data/scenarios';

const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash';
const BASE = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export async function askGemini(prompt) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return "API Key not found. Please set VITE_GEMINI_API_KEY in your .env file.";

  const res = await fetch(`${BASE}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

const SYSTEM_CONTEXT = `You are an EV advisor for the Thai market. You speak like a knowledgeable,
straight-talking friend — not a salesperson, not a spec sheet.
You give honest, specific advice in 2–3 sentences.

Rules:
- Never mention scores, weights, or algorithms
- Tie the recommendation to the user's specific life scenarios
- Use Thai context naturally: Bangkok traffic, condo charging,
  upcountry trips, THB pricing
- If the car has a real weakness for this user, name it briefly. Don't hide it.
- Never say "Great choice" or anything salesy
- English only, conversational, no bullet points
- 2–3 sentences maximum. Be decisive.`;

export async function getCarExplanation(car, scenarioPriorityOrder, monthlyPay) {
  const priorities = formatPriorityListForAi(scenarioPriorityOrder);
  const prompt = `
${SYSTEM_CONTEXT}

User's situation:
- Segment: ${car.segment}
- Priorities (1 = most important): ${priorities}

The car: ${car.brand} ${car.model} — made in ${car.countryOfOrigin}
- City range: ${car.rangeCity} km
- Highway range: ${car.rangeHighway} km
- Charge speed (DC max): ${car.dcChargeKw} kW
- Time to 80% on DC: ${car.timeToEightyMin} min
- Boot: ${car.bootL}L, Seats: ${car.seats}
- Warranty: ${car.warrantyYears} years
- Bangkok service centers: ${car.bangkokServiceCenters}
- 0–100: ${car.zeroToHundred}s
- Monthly payment estimate: ฿${monthlyPay} at 20% down, 48 months

This car ranked highly for this user.
Write 2–3 sentences on why this car does or doesn't work for this person.
Be honest. Be specific. Sound like a friend.
`;
  return askGemini(prompt);
}

export async function getFinanceSentence(car, price, monthlyPay, electricity, savings, total5yr) {
  const prompt = `
${SYSTEM_CONTEXT}

User is buying a ${car.brand} ${car.model} (made in ${car.countryOfOrigin}) at ฿${price}.
Monthly loan payment: ฿${monthlyPay}. Monthly electricity cost: ฿${electricity}.
Monthly saving vs their current petrol car: ฿${savings}.
5-year total cost of ownership estimate: ฿${total5yr}.

Write ONE sentence in plain English on whether this is a reasonable
financial decision for a Thai family. Be direct. Not cheerful.
`;
  return askGemini(prompt);
}

export async function getCompareSummary(scenarioPriorityOrder, cars) {
  const priorities = formatPriorityListForAi(scenarioPriorityOrder);
  const prompt = `
${SYSTEM_CONTEXT}

User's priorities (1 = most important): ${priorities}.
They are comparing:
${cars.map(c => `- ${c.brand} ${c.model} made in ${c.countryOfOrigin}: ${c.rangeCity}km city, ${c.dcChargeKw}kW charging`).join('\n')}

Full specs: ${JSON.stringify(cars)}

Pick ONE winner for this specific person. Explain in 3 sentences why.
Name the one main tradeoff they give up by not picking the others.
Do not recommend all of them. Be decisive.
`;
  return askGemini(prompt);
}

export async function fetchCarData(carName) {
  const prompt = `
You are a car data API for the Thai market. Return ONLY a valid JSON object.
No explanation, no markdown, no backticks. Just raw JSON.

Find current Thai market specs for: "${carName}"

Return this exact structure:
{
  "id": "brand-model-slug",
  "brand": "",
  "model": "",
  "countryOfOrigin": "",
  "segment": "spare | middle | main",
  "bodyStyle": "hatchback | sedan | suv | crossover",
  "priceThb": 0,
  "rangeCity": 0,
  "rangeHighway": 0,
  "dcChargeKw": 0,
  "timeToEightyMin": 0,
  "zeroToHundred": 0.0,
  "bootL": 0,
  "seats": 5,
  "warrantyYears": 0,
  "batteryWarrantyYears": 0,
  "bangkokServiceCenters": 0,
  "safetyScore": 0,
  "safetySource": "Euro NCAP | ASEAN NCAP | estimated",
  "lengthMm": 0,
  "widthMm": 0,
  "efficiencyKwhPer100km": 0.0,
  "driveType": "FWD | RWD | AWD",
  "photo": null,
  "isCustom": true,
  "dataSource": "gemini-fetched"
}

Rules:
- priceThb: official Thai price in baht. If unavailable, use null.
- rangeCity: real-world city estimate (WLTP × 0.75 if only WLTP available)
- rangeHighway: real-world highway at 120km/h (WLTP × 0.85 if needed)
- segment: "spare" if under 600000, "middle" if 600000–1000000, "main" if over 1000000
- countryOfOrigin: brand's home country, not assembly location
- If the car is not sold in Thailand or data is unavailable, return:
  { "error": "not_found", "message": "brief reason" }
`;

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key not found.");

  const res = await fetch(`${BASE}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  const data = await res.json();
  const raw = data.candidates[0].content.parts[0].text.trim().replace(/^```json/, '').replace(/```$/, '');

  try {
    const parsed = JSON.parse(raw);
    if (parsed.error) throw new Error(parsed.message);
    return parsed;
  } catch {
    throw new Error('Could not parse car data. Try a more specific name.');
  }
}
