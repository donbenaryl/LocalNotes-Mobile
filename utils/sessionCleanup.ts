export type SessionCleanupDeps = {
  removeProfileQuery: () => void;
  clearAuth: () => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
};

/**
 * Shared teardown for sign-out and account deletion.
 * Order: profile cache, auth (tokens + business store), then biometric opt-in.
 * Every step is attempted even if an earlier one fails (so a failed token wipe
 * can't leave stale biometric state), and the first error is rethrown at the end.
 * `resetBiometric` defaults to false so plain sign-out keeps its existing behaviour;
 * account deletion passes true because the opted-in account no longer exists.
 */
export async function performSessionCleanup(
  deps: SessionCleanupDeps,
  options: { resetBiometric?: boolean } = {},
): Promise<void> {
  const errors: unknown[] = [];
  const run = async (step: () => void | Promise<void>) => {
    try {
      await step();
    } catch (e) {
      errors.push(e);
    }
  };

  await run(deps.removeProfileQuery);
  await run(deps.clearAuth);
  if (options.resetBiometric) {
    await run(() => deps.setBiometricEnabled(false));
  }
  if (errors.length > 0) throw errors[0];
}
