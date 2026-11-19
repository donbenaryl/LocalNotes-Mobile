import en from '@/locales/en';
import {
  DELETE_CONFIRM_WORD,
  buildDeleteAccountDTO,
  deleteAccountErrorMessage,
  isDeleteConfirmValid,
} from './deleteAccount';

describe('isDeleteConfirmValid', () => {
  it('accepts DELETE', () => {
    expect(isDeleteConfirmValid(DELETE_CONFIRM_WORD)).toBe(true);
  });
  it('is case-sensitive and rejects other text', () => {
    expect(isDeleteConfirmValid('delete')).toBe(false);
    expect(isDeleteConfirmValid('')).toBe(false);
    expect(isDeleteConfirmValid('DELETE ')).toBe(false);
  });
});

describe('buildDeleteAccountDTO', () => {
  it('builds confirm only', () => {
    expect(buildDeleteAccountDTO({ confirmText: 'DELETE' })).toEqual({ confirm: 'DELETE' });
  });
  it('includes password when given', () => {
    expect(buildDeleteAccountDTO({ confirmText: 'DELETE', password: 'x' })).toEqual({
      confirm: 'DELETE',
      password: 'x',
    });
  });
  it('trims confirm', () => {
    expect(buildDeleteAccountDTO({ confirmText: '  DELETE ' }).confirm).toBe('DELETE');
  });
  it('omits empty or whitespace-only password', () => {
    expect(buildDeleteAccountDTO({ confirmText: 'DELETE', password: '' })).not.toHaveProperty('password');
    expect(buildDeleteAccountDTO({ confirmText: 'DELETE', password: '   ' })).not.toHaveProperty('password');
  });
  it('passes the password through unmodified', () => {
    expect(buildDeleteAccountDTO({ confirmText: 'DELETE', password: ' p w ' }).password).toBe(' p w ');
  });
});

describe('deleteAccountErrorMessage', () => {
  it('returns the password field message (array)', () => {
    expect(deleteAccountErrorMessage({ message: 'Request failed', password: ['Password is incorrect.'] }, 'fb')).toBe(
      'Password is incorrect.',
    );
  });
  it('returns a string password message', () => {
    expect(deleteAccountErrorMessage({ password: 'Nope' }, 'fb')).toBe('Nope');
  });
  it('falls back to the confirm message', () => {
    expect(deleteAccountErrorMessage({ confirm: ['Type "DELETE" to confirm.'] }, 'fb')).toBe(
      'Type "DELETE" to confirm.',
    );
  });
  it('returns the fallback for unrecognised shapes', () => {
    expect(deleteAccountErrorMessage(undefined, 'fb')).toBe('fb');
    expect(deleteAccountErrorMessage('boom', 'fb')).toBe('fb');
    expect(deleteAccountErrorMessage({ message: 'Request failed with status code 400' }, 'fb')).toBe('fb');
    expect(deleteAccountErrorMessage({ password: [] }, 'fb')).toBe('fb');
  });
});

describe('delete account i18n keys', () => {
  const menu = en.accountSettings.menu as Record<string, string>;
  it.each([
    'deleteAccountPasswordLabel',
    'deleteAccountPasswordPlaceholder',
    'deleteAccountPasswordHint',
    'deleteAccountSuccess',
    'deleteAccountFailed',
  ])('has %s', (key) => {
    expect(typeof menu[key]).toBe('string');
    expect(menu[key].length).toBeGreaterThan(0);
  });
});
