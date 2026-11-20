/** Parse `x.y.z` (or shorter) into numeric parts; non-numeric segments become 0. */
function parseParts(version: string): [number, number, number] {
  const cleaned = version.trim().split(/[^0-9.]/)[0] ?? '';
  const raw = cleaned.split('.');
  const major = Number.parseInt(raw[0] ?? '0', 10);
  const minor = Number.parseInt(raw[1] ?? '0', 10);
  const patch = Number.parseInt(raw[2] ?? '0', 10);
  return [
    Number.isFinite(major) ? major : 0,
    Number.isFinite(minor) ? minor : 0,
    Number.isFinite(patch) ? patch : 0,
  ];
}

/** Compare two semver-like strings. Returns -1 if a < b, 0 if equal, 1 if a > b. */
export function compareSemver(a: string, b: string): -1 | 0 | 1 {
  const left = parseParts(a);
  const right = parseParts(b);
  for (let i = 0; i < 3; i += 1) {
    if (left[i] < right[i]) return -1;
    if (left[i] > right[i]) return 1;
  }
  return 0;
}

/** True when `current` is strictly below `min` (e.g. 1.0.3 vs 1.0.4). */
export function isVersionBelow(current: string, min: string): boolean {
  return compareSemver(current, min) < 0;
}
