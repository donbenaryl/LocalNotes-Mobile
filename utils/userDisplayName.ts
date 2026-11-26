/**
 * Username-first display labels.
 *
 * Primary: username (never the legacy API `name` / display name).
 * Secondary: first + last when the user added them in Edit Profile.
 * Render `secondary` only in ProfileInfo — everywhere else use `primary`.
 */

export type UserNameFields = {
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  /** Legacy API display name — used only as a last-resort fallback. */
  name?: string | null;
};

export type UserDisplayLabels = {
  primary: string;
  secondary: string | null;
};

function capitalizeName(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function firstNameOf(user: UserNameFields): string {
  return capitalizeName(user.first_name ?? user.firstName ?? '');
}

function lastNameOf(user: UserNameFields): string {
  return capitalizeName(user.last_name ?? user.lastName ?? '');
}

export function formatRealName(user: UserNameFields): string | null {
  const parts = [firstNameOf(user), lastNameOf(user)].filter(Boolean);
  if (parts.length === 0) return null;
  return parts.join(' ');
}

export function resolveUserLabels(
  user: UserNameFields | null | undefined,
  fallback = 'User',
): UserDisplayLabels {
  const username = user?.username?.trim() || '';
  const legacyName = user?.name?.trim() || '';
  const primary = username || legacyName || fallback;
  return {
    primary,
    secondary: formatRealName(user ?? {}),
  };
}

export function hasRealName(user: UserNameFields | null | undefined): boolean {
  return Boolean(formatRealName(user ?? {}));
}
