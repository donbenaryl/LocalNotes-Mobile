import commonPasswords from '@/assets/common-passwords.json';

const COMMON_PASSWORDS = new Set(commonPasswords as string[]);

/** Mirrors Django's CommonPasswordValidator: lowercased + trimmed membership check. */
export function isCommonPassword(password: string): boolean {
  return COMMON_PASSWORDS.has(password.toLowerCase().trim());
}
