import accountService from '@/http/account-api/account.services';
import { getUsernameFormatError } from '@/utils/usernameValidation';

const HANDLE_PATTERN = /[^a-z0-9_.]/g;

/** Slug a display/full name into a username handle base. */
export function usernameBaseFromName(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return '';

  const withoutEmailDomain = trimmed.includes('@')
    ? trimmed.split('@')[0] ?? trimmed
    : trimmed;

  const collapsed = withoutEmailDomain
    .replace(/\s+/g, '_')
    .replace(HANDLE_PATTERN, '')
    .replace(/[_.]{2,}/g, '_')
    .replace(/^[_.]+|[_.]+$/g, '');

  if (collapsed.length >= 3) return collapsed.slice(0, 30);
  if (collapsed.length > 0) return `${collapsed}${collapsed}`.slice(0, 30);
  return 'user';
}

function candidateList(base: string): string[] {
  const safe = usernameBaseFromName(base) || 'user';
  const short = safe.slice(0, 20);
  const year = String(new Date().getFullYear()).slice(-2);
  const rand = () => String(Math.floor(10 + Math.random() * 90));

  return [
    `${short}${rand()}`,
    `${short}_${rand()}`,
    `${short}.picks`,
    `${short}${year}`,
    `${short}_${year}`,
    `${short}.notes`,
    `the_${short}`.slice(0, 30),
    `${short}hq`,
  ].filter((candidate, index, all) => {
    if (getUsernameFormatError(candidate) !== null) return false;
    return all.indexOf(candidate) === index;
  });
}

/** Check candidates until `count` available usernames are found. */
export async function suggestAvailableUsernames(
  base: string,
  count = 3,
): Promise<string[]> {
  const available: string[] = [];
  const tried = new Set<string>();

  for (const candidate of candidateList(base)) {
    if (available.length >= count) break;
    if (tried.has(candidate)) continue;
    tried.add(candidate);

    try {
      const response = await accountService.checkUsernameAvailable({
        username: candidate,
      });
      if (response.data?.data?.available) {
        available.push(candidate);
      }
    } catch {
      // Skip failed checks; try the next candidate.
    }
  }

  // Extra random suffixes if still short.
  let guard = 0;
  const safe = usernameBaseFromName(base) || 'user';
  while (available.length < count && guard < 12) {
    guard += 1;
    const candidate = `${safe.slice(0, 20)}${Math.floor(100 + Math.random() * 900)}`;
    if (tried.has(candidate) || getUsernameFormatError(candidate) !== null) {
      continue;
    }
    tried.add(candidate);
    try {
      const response = await accountService.checkUsernameAvailable({
        username: candidate,
      });
      if (response.data?.data?.available) {
        available.push(candidate);
      }
    } catch {
      // continue
    }
  }

  return available.slice(0, count);
}
