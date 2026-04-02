/**
 * Resolve a real vehicle photo URL via Wikipedia (English) REST APIs.
 * Images are Wikimedia Commons / Wikipedia — no API key. Cached per car id.
 */

const SUMMARY = 'https://en.wikipedia.org/api/rest_v1/page/summary';
const SEARCH = 'https://en.wikipedia.org/w/rest.php/v1/search/page';

const cache = new Map();
const inflight = new Map();

/** Ordered fallbacks: first match with an image wins */
const WIKI_TITLE_TRIES = {
  'byd-dolphin': ['BYD Dolphin'],
  'mg4-electric': ['MG4 EV', 'MG Mulan (automobile)'],
  'neta-v-ii': ['Neta V', 'Hozon Auto'],
  'byd-atto-3': ['BYD Atto 3'],
  'deepal-s05': ['Deepal S05', 'Deepal S07', 'Changan Deepal'],
  'tesla-model-3-rwd': ['Tesla Model 3'],
  'tesla-model-y-rwd': ['Tesla Model Y'],
  'byd-seal-rwd': ['BYD Seal'],
  'byd-sealion-7': ['BYD Sea Lion 07', 'BYD Song Plus', 'BYD Sealion 7'],
  'byd-han': ['BYD Han'],
  'xpeng-g6': ['Xpeng G6'],
  'zeekr-7x': ['Zeekr 7X', 'Zeekr'],
  'bmw-ix1': ['BMW iX1'],
  'bmw-ix3': ['BMW iX3'],
  'volvo-ex30': ['Volvo EX30'],
  'volvo-ex40': ['Volvo EX40', 'Volvo EC40'],
  'mercedes-benz-eqa': ['Mercedes-Benz EQA'],
  'deepal-s07': ['Deepal S07', 'Changan Deepal'],
  'aion-v-plus': ['Aion V', 'GAC Aion V'],
  'neta-x-smart': ['Neta X'],
  'ora-good-cat-pro': ['Ora Good Cat', 'Ora Funky Cat'],
  'byd-dolphin-extended': ['BYD Dolphin'],
  'aion-y-plus': ['Aion Y Plus', 'GAC Aion Y'],
  'mg-zs-ev': ['MG ZS EV'],
};

function normalizeWikiUrl(u) {
  if (!u) return null;
  if (u.startsWith('//')) return `https:${u}`;
  return u;
}

function pickFromSummary(data) {
  if (!data || data.type === 'disambiguation') return null;
  const orig = data.originalimage?.source;
  if (orig) return normalizeWikiUrl(orig);
  const thumb = data.thumbnail?.source;
  if (thumb) return normalizeWikiUrl(thumb);
  return null;
}

async function fetchSummary(title) {
  const slug = encodeURIComponent(title.replace(/ /g, '_'));
  const res = await fetch(`${SUMMARY}/${slug}`);
  if (!res.ok) return null;
  return res.json();
}

async function searchPages(query) {
  const res = await fetch(`${SEARCH}?q=${encodeURIComponent(query)}&limit=6`);
  if (!res.ok) return [];
  const json = await res.json();
  return json.pages || [];
}

async function imageFromSearchQuery(query) {
  const pages = await searchPages(query);
  for (const p of pages) {
    const title = p.title || p.key?.replace(/_/g, ' ');
    if (title) {
      const sum = await fetchSummary(title);
      const img = pickFromSummary(sum);
      if (img) return upscaleCommonsThumb(img);
    }
    const tu = p.thumbnail?.url;
    if (tu) return upscaleCommonsThumb(normalizeWikiUrl(tu));
  }
  return null;
}

/** Request a larger Commons thumbnail when URL uses /NNNpx- pattern */
function upscaleCommonsThumb(url) {
  if (!url || !url.includes('upload.wikimedia.org')) return url;
  return url.replace(/\/(\d+)px-([^/]+)$/, (_, n, rest) => {
    const w = Math.min(800, Math.max(Number(n) || 60, 400));
    return `/${w}px-${rest}`;
  });
}

async function resolveBuiltin(car) {
  const tries = WIKI_TITLE_TRIES[car.id];
  if (tries?.length) {
    for (const title of tries) {
      const sum = await fetchSummary(title);
      const img = pickFromSummary(sum);
      if (img) return upscaleCommonsThumb(img);
    }
  }
  return imageFromSearchQuery(`${car.brand} ${car.model} electric car`);
}

/**
 * @param {{ id: string, brand: string, model: string, photo?: string|null, isCustom?: boolean }} car
 * @returns {Promise<string|null>}
 */
export async function getCarImageUrl(car) {
  if (car.photo && /^https?:\/\//i.test(car.photo)) {
    return car.photo;
  }

  if (cache.has(car.id)) {
    return cache.get(car.id);
  }

  if (inflight.has(car.id)) {
    return inflight.get(car.id);
  }

  const promise = (async () => {
    try {
      let url = null;
      if (car.isCustom) {
        url = await imageFromSearchQuery(`${car.brand} ${car.model} electric vehicle`);
        if (!url) url = await imageFromSearchQuery(`${car.brand} ${car.model}`);
      } else {
        url = await resolveBuiltin(car);
      }
      cache.set(car.id, url);
      return url;
    } catch {
      cache.set(car.id, null);
      return null;
    } finally {
      inflight.delete(car.id);
    }
  })();

  inflight.set(car.id, promise);
  return promise;
}

export function peekCarImageUrl(carId) {
  return cache.get(carId) ?? null;
}
