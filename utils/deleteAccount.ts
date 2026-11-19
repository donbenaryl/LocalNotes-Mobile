import type { DeleteAccountDTO } from '@/http/account-api/types';

export const DELETE_CONFIRM_WORD = 'DELETE';

/** Case-sensitive, matching the existing modal behaviour. */
export function isDeleteConfirmValid(text: string): boolean {
  return text === DELETE_CONFIRM_WORD;
}

/**
 * Builds the request body. `confirm` is trimmed and `password` is omitted when
 * blank (social sign-in users have no password). The password is never altered.
 */
export function buildDeleteAccountDTO({
  confirmText,
  password,
}: {
  confirmText: string;
  password?: string;
}): DeleteAccountDTO {
  const dto: DeleteAccountDTO = { confirm: confirmText.trim() };
  if (password && password.trim().length > 0) {
    dto.password = password;
  }
  return dto;
}

function firstString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value;
  if (Array.isArray(value)) {
    const found = value.find((v) => typeof v === 'string' && v.trim());
    return typeof found === 'string' ? found : null;
  }
  return null;
}

/**
 * Surfaces the backend field message (`password` / `confirm`, DRF returns
 * string[]) when present, else the fallback. Never returns generic transport
 * text such as "Request failed with status code 400".
 */
export function deleteAccountErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>;
    return firstString(e.password) ?? firstString(e.confirm) ?? fallback;
  }
  return fallback;
}
