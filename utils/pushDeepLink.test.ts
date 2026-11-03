import {
  parseBusinessHomePage,
  parseBusinessHomeTab,
  resolveDeepLinkPath,
} from '@/utils/pushDeepLink';

describe('resolveDeepLinkPath', () => {
  it('carries a valid business-home tab and drops an unknown one', () => {
    expect(resolveDeepLinkPath('/business-home?page=profile&tab=alerts')).toBe(
      '/(app)/(stack)/business-home?page=profile&tab=alerts',
    );
    expect(resolveDeepLinkPath('/business-home?page=profile&tab=bogus')).toBe(
      '/(app)/(stack)/business-home?page=profile',
    );
  });
  it('carries the business-home page', () => {
    expect(resolveDeepLinkPath('/business-home?page=profile')).toBe(
      '/(app)/(stack)/business-home?page=profile',
    );
  });
  it('still resolves plain /business-home', () => {
    expect(resolveDeepLinkPath('/business-home')).toBe('/(app)/(stack)/business-home');
  });
  it('falls back to profile for an unknown page', () => {
    expect(resolveDeepLinkPath('/business-home?page=bogus')).toBe(
      '/(app)/(stack)/business-home?page=profile',
    );
  });
  it('keeps the other deep links working', () => {
    expect(resolveDeepLinkPath('/home/offers')).toBe('/(app)/(tabs)/home/offers');
    expect(resolveDeepLinkPath('/home/spotlight')).toBe('/(app)/(tabs)/home/spotlight');
    expect(resolveDeepLinkPath('/notifications')).toBe('/(app)/(stack)/notifications');
    expect(resolveDeepLinkPath('/claim-business')).toBe('/(app)/(stack)/claim-business');
    expect(resolveDeepLinkPath('/profile/u1')).toBe('/profile/u1?origin=notification');
    expect(resolveDeepLinkPath('/lists/abc')).toBeNull();
    expect(resolveDeepLinkPath('')).toBeNull();
    expect(resolveDeepLinkPath(undefined)).toBeNull();
  });
});

describe('parseBusinessHomeTab', () => {
  it('validates the param', () => {
    expect(parseBusinessHomeTab('alerts')).toBe('alerts');
    expect(parseBusinessHomeTab(['thankYou'])).toBe('thankYou');
    expect(parseBusinessHomeTab('x')).toBeUndefined();
    expect(parseBusinessHomeTab(undefined)).toBeUndefined();
  });
});

describe('parseBusinessHomePage', () => {
  it('validates the param', () => {
    expect(parseBusinessHomePage('overview')).toBe('overview');
    expect(parseBusinessHomePage(['campaign'])).toBe('campaign');
    expect(parseBusinessHomePage('x')).toBe('profile');
    expect(parseBusinessHomePage(undefined)).toBe('profile');
  });
});
