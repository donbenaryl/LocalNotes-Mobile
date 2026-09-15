import { useEffect, useState } from "react";
import {
  needsLocalVideoCache,
  resolvePlayableVideoUri,
} from "@/utils/playableVideoUri";

export interface PlayableVideoUriState {
  /** Ready-to-play URI (remote or local file://). Null while preparing or on error. */
  playableUri: string | null;
  isPreparing: boolean;
  error: Error | null;
}

/**
 * Resolves a remote video URL into something expo-video can play on this device.
 * iOS cleartext http sources are cached to disk first (Range-less servers).
 */
export function usePlayableVideoUri(
  remoteUri: string | null | undefined,
): PlayableVideoUriState {
  const [playableUri, setPlayableUri] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!remoteUri) {
      setPlayableUri(null);
      setIsPreparing(false);
      setError(null);
      return;
    }

    if (!needsLocalVideoCache(remoteUri)) {
      setPlayableUri(remoteUri);
      setIsPreparing(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsPreparing(true);
    setPlayableUri(null);
    setError(null);

    void resolvePlayableVideoUri(remoteUri)
      .then((uri) => {
        if (cancelled) return;
        setPlayableUri(uri);
        setIsPreparing(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setPlayableUri(null);
        setIsPreparing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [remoteUri]);

  return { playableUri, isPreparing, error };
}
