import { formatPriorityListForAi } from '../data/scenarios';

/** When unset, try Gemini 3 Flash preview first, then stable 2.5 Flash. Override with VITE_GEMINI_MODEL (comma = fallbacks). */
const DEFAULT_MODEL_CHAIN = ['gemini-3-flash-preview', 'gemini-2.5-flash'];

function getModelChain() {
  const env = import.meta.env.VITE_GEMINI_MODEL?.trim();
  if (!env) return [...DEFAULT_MODEL_CHAIN];
  return env
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function endpoint(model) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

function isRetryableModelError(res, data) {
  if (res.ok) return false;
  const msg = String(data?.error?.message || '').toLowerCase();
  if (res.status === 404) return true;
  if (msg.includes('not found') && (msg.includes('model') || msg.includes('models/'))) return true;
  if (msg.includes('invalid') && msg.includes('model')) return true;
  if (msg.includes('does not exist')) return true;
  return false;
}

/**
 * POST generateContent; on unknown-model errors, tries the next model in the chain.
 */
async function callGeminiApi(apiKey, body) {
  const chain = getModelChain();
  let lastErr = 'AI request failed.';

  for (let i = 0; i < chain.length; i++) {
    const model = chain[i];
    const res = await fetch(`${endpoint(model)}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const rawText = await res.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      if (res.ok) throw new Error('Invalid response from AI service.');
      data = {};
    }
    if (res.ok) return data;
    lastErr = data?.error?.message || data?.error?.status || `HTTP ${res.status}`;
    if (isRetryableModelError(res, data) && i < chain.length - 1) continue;
    throw new Error(lastErr);
  }
  throw new Error(lastErr);
}

/** Throws a clear Error when the model returns no usable text (blocked, empty, or malformed). */
function extractGeminiText(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Empty response from AI.');
  }
  if (data.error) {
    throw new Error(data.error.message || data.error.status || 'API error');
  }
  const blockReason = data.promptFeedback?.blockReason;
  if (blockReason) {
    throw new Error(`Request blocked (${blockReason}). Try a different search term.`);
  }
  const candidate = data.candidates?.[0];
  if (!candidate) {
    throw new Error('No answer from AI. Check the API key, model name, or try again.');
  }
  const parts = candidate.content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) {
    const fr = candidate.finishReason ? ` Reason: ${candidate.finishReason}.` : '';
    throw new Error(`No text returned from AI.${fr} Try another model or a clearer car name.`);
  }
  const text = parts.map((p) => p?.text).filter(Boolean).join('');
  if (!String(text).trim()) {
    const fr = candidate.finishReason ? ` Reason: ${candidate.finishReason}.` : '';
    throw new Error(`No text returned from AI.${fr} Try another model or a clearer car name.`);
  }
  return String(text);
}

export async function askGemini(prompt) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return "API Key not found. Please set VITE_GEMINI_API_KEY in your .env file.";

  try {
    const data = await callGeminiApi(apiKey, {
      contents: [{ parts: [{ text: prompt }] }],
    });
    return extractGeminiText(data);
  } catch (e) {
    return e?.message || 'AI request failed.';
  }
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

function slugifyId(s) {
  return (
    String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'custom-ev'
  );
}

function inferSegmentFromPrice(priceThb) {
  const p = Number(priceThb);
  if (!p || Number.isNaN(p)) return 'middle';
  if (p < 600000) return 'spare';
  if (p <= 1000000) return 'middle';
  return 'main';
}

/**
 * Same fields as catalog cars.json (+ imageSearchQuery). Safe for scoring and UI.
 */
export function normalizeGeminiCar(raw) {
  const brand = String(raw.brand || 'Unknown').trim();
  const model = String(raw.model || 'EV').trim();
  const base = slugifyId(`${brand}-${model}`);
  const id =
    raw.id && String(raw.id).trim()
      ? String(raw.id)
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
      : `${base}-${Date.now().toString(36)}`;

  const body = String(raw.bodyStyle || 'crossover').toLowerCase();
  const bodyStyle = ['hatchback', 'sedan', 'suv', 'crossover'].includes(body) ? body : 'crossover';

  const drive = String(raw.driveType || 'FWD').toUpperCase().replace(/\s/g, '');
  const driveType = ['FWD', 'RWD', 'AWD'].includes(drive) ? drive : 'FWD';

  let photo = null;
  if (raw.photo && /^https?:\/\//i.test(String(raw.photo))) {
    const u = String(raw.photo).trim();
    try {
      photo = new URL(u).href;
    } catch {
      photo = null;
    }
  }

  return {
    id,
    brand,
    model,
    countryOfOrigin: String(raw.countryOfOrigin || 'Unknown').trim(),
    segment: ['spare', 'middle', 'main'].includes(raw.segment) ? raw.segment : inferSegmentFromPrice(raw.priceThb),
    bodyStyle,
    priceThb: raw.priceThb != null && !Number.isNaN(Number(raw.priceThb)) ? Number(raw.priceThb) : null,
    rangeCity: Number(raw.rangeCity) || 0,
    rangeHighway: Number(raw.rangeHighway) || 0,
    dcChargeKw: Number(raw.dcChargeKw) || 0,
    timeToEightyMin: Number(raw.timeToEightyMin) || 0,
    zeroToHundred: Number(raw.zeroToHundred) || 0,
    bootL: Number(raw.bootL) || 0,
    seats: Math.min(7, Math.max(2, Number(raw.seats) || 5)),
    warrantyYears: Number(raw.warrantyYears) || 0,
    batteryWarrantyYears: Number(raw.batteryWarrantyYears) || 0,
    bangkokServiceCenters: Number(raw.bangkokServiceCenters) || 0,
    safetyScore: Math.min(5, Math.max(0, Number(raw.safetyScore) || 0)),
    safetySource: String(raw.safetySource || 'estimated').trim(),
    lengthMm: Number(raw.lengthMm) || 0,
    widthMm: Number(raw.widthMm) || 0,
    efficiencyKwhPer100km: Number(raw.efficiencyKwhPer100km) || 0,
    driveType,
    photo,
    imageSearchQuery: raw.imageSearchQuery ? String(raw.imageSearchQuery).trim().slice(0, 200) : null,
    isCustom: true,
    dataSource: 'gemini-fetched',
  };
}

export async function fetchCarData(carName) {
  const prompt = `
You are a car data API for the Thai market. Return ONLY a valid JSON object.
No explanation, no markdown, no backticks. Just raw JSON.

Find current Thai-market retail specs (prices usually include VAT) for: "${carName}"

Return exactly these keys (same schema as our in-app catalog):
{
  "id": "lowercase-brand-model-slug",
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
  "imageSearchQuery": "",
  "isCustom": true,
  "dataSource": "gemini-fetched"
}

Rules:
- priceThb: official Thai list / OTR Bangkok in baht including VAT when known; else null.
- rangeCity / rangeHighway: realistic km (if only WLTP, approximate city as WLTP×0.75, highway at 120 km/h as WLTP×0.85).
- segment from priceThb: spare < 600000; middle 600000–1000000; main > 1000000 (if price null, estimate from model positioning).
- bangkokServiceCenters: rough count of brand service outlets in Greater Bangkok if known, else 0.
- safetyScore: 1–5 stars if NCAP known, else 0 with safetySource "estimated".
- photo: MUST be null unless you are certain of a stable https URL to a real vehicle image (official press pack). Never invent URLs.
- imageSearchQuery: REQUIRED short English phrase for finding a photo (e.g. "Mercedes-Benz EQB" or "Volvo EX90 electric"). Used with Wikipedia image search in the app.
- countryOfOrigin: brand home country (Germany, China, USA, Sweden, etc.), not CKD plant.
- If not sold in Thailand or unknown: { "error": "not_found", "message": "brief reason" }
`;

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key not found.");

  const data = await callGeminiApi(apiKey, {
    contents: [{ parts: [{ text: prompt }] }],
  });
  const text = extractGeminiText(data);
  const raw = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');

  try {
    const parsed = JSON.parse(raw);
    if (parsed.error) throw new Error(parsed.message || 'Model could not find this car for Thailand.');
    return normalizeGeminiCar(parsed);
  } catch (e) {
    if (e instanceof Error && e.message && !e.message.includes('JSON')) throw e;
    throw new Error('Could not parse car data. Try a more specific name (e.g. Mercedes-Benz EQB).');
  }
}
