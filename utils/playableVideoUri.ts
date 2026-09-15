import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";

const CACHE_DIR_NAME = "offer-videos";

/**
 * iOS AVPlayer needs HTTP Range / 206 for remote progressive MP4s.
 * Local Django media (cleartext http) often lacks Range support, so we
 * download to disk and play a local file:// URI instead.
 */
export function needsLocalVideoCache(uri: string): boolean {
  if (Platform.OS !== "ios") return false;
  try {
    return new URL(uri).protocol === "http:";
  } catch {
    return false;
  }
}

function cacheFileName(remoteUri: string): string {
  try {
    const url = new URL(remoteUri);
    const leaf =
      url.pathname.split("/").filter(Boolean).pop() || "video.mp4";
    const safeLeaf = leaf.replace(/[^a-zA-Z0-9._-]/g, "_");
    // Prefix with a short stable digest of the full URL to avoid collisions.
    let hash = 0;
    for (let i = 0; i < remoteUri.length; i += 1) {
      hash = (hash * 31 + remoteUri.charCodeAt(i)) >>> 0;
    }
    return `${hash.toString(16)}-${safeLeaf}`;
  } catch {
    return `video-${Date.now()}.mp4`;
  }
}

/**
 * Returns a URI that expo-video can play on this platform.
 * On iOS + http:, downloads into cache (reuses existing file).
 */
export async function resolvePlayableVideoUri(
  remoteUri: string,
): Promise<string> {
  if (!needsLocalVideoCache(remoteUri)) {
    return remoteUri;
  }

  const dir = new Directory(Paths.cache, CACHE_DIR_NAME);
  if (!dir.exists) {
    dir.create({ idempotent: true });
  }

  const file = new File(dir, cacheFileName(remoteUri));
  if (file.exists) {
    return file.uri;
  }

  const downloaded = await File.downloadFileAsync(remoteUri, file, {
    idempotent: true,
  });
  return downloaded.uri;
}
