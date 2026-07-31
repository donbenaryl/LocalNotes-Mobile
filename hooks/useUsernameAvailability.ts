import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import accountService from '@/http/account-api/account.services';
import { getUsernameFormatError } from '@/utils/usernameValidation';

export type UsernameAvailabilityStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'taken'
  | 'invalid';

const USERNAME_DEBOUNCE_MS = 400;

export function isUsernameBlocking(status: UsernameAvailabilityStatus): boolean {
  return (
    status === 'checking' || status === 'taken' || status === 'invalid'
  );
}

function formatErrorMessage(
  error: NonNullable<ReturnType<typeof getUsernameFormatError>>,
  t: (key: string) => string,
): string {
  if (error === 'tooShort') return t('validation.usernameTooShort');
  if (error === 'handleTooLong') return t('validation.usernameTooLong');
  if (error === 'emailTooLong') return t('validation.usernameEmailTooLong');
  return t('validation.usernameInvalidFormat');
}

interface UseUsernameAvailabilityOptions {
  username: string;
  currentUsername?: string;
  enabled?: boolean;
}

export function useUsernameAvailability({
  username,
  currentUsername,
  enabled = true,
}: UseUsernameAvailabilityOptions) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<UsernameAvailabilityStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const check = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim().toLowerCase();
      if (!trimmed) {
        setStatus('idle');
        setMessage(null);
        return;
      }
      const formatError = getUsernameFormatError(trimmed);
      if (formatError) {
        setStatus('invalid');
        setMessage(formatErrorMessage(formatError, t));
        return;
      }
      if (
        currentUsername &&
        trimmed === currentUsername.trim().toLowerCase()
      ) {
        setStatus('available');
        setMessage(t('validation.usernameCurrent'));
        return;
      }

      const requestId = ++requestIdRef.current;
      setStatus('checking');
      setMessage(t('validation.usernameChecking'));

      try {
        const response = await accountService.checkUsernameAvailable({
          username: trimmed,
        });
        if (requestId !== requestIdRef.current) return;

        if (response.error) {
          setStatus('invalid');
          setMessage(
            response.error.message || t('validation.usernameVerifyFailed'),
          );
          return;
        }

        const available = response.data?.data?.available ?? false;
        if (available) {
          setStatus('available');
          setMessage(t('validation.usernameAvailable'));
        } else {
          setStatus('taken');
          setMessage(t('validation.usernameTaken'));
        }
      } catch {
        if (requestId !== requestIdRef.current) return;
        setStatus('invalid');
        setMessage(t('validation.usernameVerifyFailed'));
      }
    },
    [currentUsername, t],
  );

  useEffect(() => {
    if (!enabled) return;

    const timer = setTimeout(() => {
      void check(username);
    }, USERNAME_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [username, enabled, check]);

  return {
    status,
    message,
    isBlocking: isUsernameBlocking(status),
  };
}
