import { performSessionCleanup } from './sessionCleanup';

function makeDeps(overrides: Partial<Parameters<typeof performSessionCleanup>[0]> = {}) {
  const calls: string[] = [];
  return {
    calls,
    deps: {
      removeProfileQuery: jest.fn(() => void calls.push('profile')),
      clearAuth: jest.fn(async () => void calls.push('auth')),
      setBiometricEnabled: jest.fn(async () => void calls.push('biometric')),
      ...overrides,
    },
  };
}

describe('performSessionCleanup', () => {
  it('runs profile, auth, biometric in order when resetBiometric is set', async () => {
    const { deps, calls } = makeDeps();
    await performSessionCleanup(deps, { resetBiometric: true });
    expect(calls).toEqual(['profile', 'auth', 'biometric']);
    expect(deps.setBiometricEnabled).toHaveBeenCalledWith(false);
  });

  it('leaves biometric untouched by default (sign-out behaviour)', async () => {
    const { deps, calls } = makeDeps();
    await performSessionCleanup(deps);
    expect(calls).toEqual(['profile', 'auth']);
    expect(deps.setBiometricEnabled).not.toHaveBeenCalled();
  });

  it('still disables biometric when clearAuth rejects, then rethrows', async () => {
    const err = new Error('secure store');
    const { deps } = makeDeps({ clearAuth: jest.fn().mockRejectedValue(err) });
    await expect(performSessionCleanup(deps, { resetBiometric: true })).rejects.toBe(err);
    expect(deps.setBiometricEnabled).toHaveBeenCalledWith(false);
  });

  it('still clears auth when removing the profile query throws', async () => {
    const { deps } = makeDeps({
      removeProfileQuery: jest.fn(() => {
        throw new Error('cache');
      }),
    });
    await expect(performSessionCleanup(deps, { resetBiometric: true })).rejects.toThrow('cache');
    expect(deps.clearAuth).toHaveBeenCalled();
    expect(deps.setBiometricEnabled).toHaveBeenCalled();
  });
});
