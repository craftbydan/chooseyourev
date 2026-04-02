const COOKIE_NAME = 'cye_custom_cars_v1';
/** Stay under typical 4KB cookie limit after encoding */
const MAX_ENCODED_LENGTH = 3800;

function parseCookieValue() {
  if (typeof document === 'undefined') return null;
  const prefix = `${COOKIE_NAME}=`;
  const part = document.cookie.split(';').map((s) => s.trim()).find((s) => s.startsWith(prefix));
  if (!part) return null;
  return part.slice(prefix.length);
}

/**
 * @returns {object[]}
 */
export function readCustomCarsFromCookie() {
  const encoded = parseCookieValue();
  if (!encoded) return [];
  try {
    const json = decodeURIComponent(encoded);
    const data = JSON.parse(json);
    if (!Array.isArray(data)) return [];
    return data.filter((c) => c && typeof c === 'object' && typeof c.id === 'string');
  } catch {
    return [];
  }
}

/**
 * @param {object[]} cars
 */
export function writeCustomCarsToCookie(cars) {
  if (typeof document === 'undefined') return;

  let list = [...cars];
  let encoded = encodeURIComponent(JSON.stringify(list));

  while (encoded.length > MAX_ENCODED_LENGTH && list.length > 0) {
    list.shift();
    encoded = encodeURIComponent(JSON.stringify(list));
  }

  if (encoded.length > MAX_ENCODED_LENGTH) {
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
    return;
  }

  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${COOKIE_NAME}=${encoded}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax${secure}`;
}
