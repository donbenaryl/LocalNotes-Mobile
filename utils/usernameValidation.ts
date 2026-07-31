const USERNAME_HANDLE_PATTERN = /^[A-Za-z0-9_.]+$/;
const USERNAME_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_HANDLE_MAX_LENGTH = 30;
const USERNAME_EMAIL_MAX_LENGTH = 150;

export type UsernameFormatError =
  | 'tooShort'
  | 'handleTooLong'
  | 'emailTooLong'
  | 'invalidFormat';

/**
 * Validate username format: traditional handle (3–30) or email (3–150).
 * Returns null when valid. Does not check emptiness or availability.
 */
export function getUsernameFormatError(
  trimmedLowercase: string,
): UsernameFormatError | null {
  if (trimmedLowercase.length < 3) return 'tooShort';

  if (USERNAME_HANDLE_PATTERN.test(trimmedLowercase)) {
    if (trimmedLowercase.length > USERNAME_HANDLE_MAX_LENGTH) {
      return 'handleTooLong';
    }
    return null;
  }

  if (trimmedLowercase.includes('@')) {
    if (trimmedLowercase.length > USERNAME_EMAIL_MAX_LENGTH) {
      return 'emailTooLong';
    }
    if (!USERNAME_EMAIL_PATTERN.test(trimmedLowercase)) {
      return 'invalidFormat';
    }
    return null;
  }

  return 'invalidFormat';
}
