import { useState, useEffect } from 'react';
import { getCarImageUrl, peekCarImageUrl } from '../lib/carImages';

/**
 * Loads a photo URL for a car (Wikipedia/Wikimedia when no HTTPS photo in data).
 */
export function useCarImage(car) {
  const initial =
    car?.photo && /^https?:\/\//i.test(car.photo) ? car.photo : peekCarImageUrl(car?.id);
  const [url, setUrl] = useState(initial ?? null);
  const [loading, setLoading] = useState(!initial && !!car?.id);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!car?.id) {
      setUrl(null);
      setLoading(false);
      return;
    }

    if (car.photo && /^https?:\/\//i.test(car.photo)) {
      setUrl(car.photo);
      setLoading(false);
      return;
    }

    const cached = peekCarImageUrl(car.id);
    if (cached) {
      setUrl(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setFailed(false);

    getCarImageUrl(car).then((u) => {
      if (cancelled) return;
      setUrl(u);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [car?.id, car?.brand, car?.model, car?.photo, car?.isCustom, car?.imageSearchQuery]);

  const onImgError = () => setFailed(true);

  return {
    url: failed ? null : url,
    loading,
    onImgError,
  };
}
