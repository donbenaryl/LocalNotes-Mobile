import { useEffect, useState } from "react";

/** Uniform Spotlight image-fallback contract: the gradient placeholder shows
 * when there's no image URL to try, or once the real <Image> reports
 * onError — never merely while the image is still loading. Resets whenever
 * the URL itself changes (e.g. a fresh edition fetch). */
export function useSpotlightImageFallback(imageUrl: string | null) {
  const [hasErrored, setHasErrored] = useState(false);

  useEffect(() => {
    setHasErrored(false);
  }, [imageUrl]);

  return {
    showFallback: !imageUrl || hasErrored,
    onError: () => setHasErrored(true),
  };
}
