import { peakHoursReasonKey } from '@/utils/insightsReasons';

describe('peakHoursReasonKey', () => {
  it('maps known reasons', () => {
    expect(peakHoursReasonKey('no_timezone')).toBe('businessHome.explore.peakHoursNoTimezone');
    expect(peakHoursReasonKey('small_cohort')).toBe('businessHome.explore.peakHoursSmallCohort');
  });

  it('falls back for undefined and null', () => {
    expect(peakHoursReasonKey(undefined)).toBe('businessHome.explore.insufficientData');
    expect(peakHoursReasonKey(null)).toBe('businessHome.explore.insufficientData');
  });

  it('falls back for unknown strings without throwing', () => {
    expect(peakHoursReasonKey('future_reason')).toBe('businessHome.explore.insufficientData');
    expect(peakHoursReasonKey('toString')).toBe('businessHome.explore.insufficientData');
    expect(peakHoursReasonKey('')).toBe('businessHome.explore.insufficientData');
  });
});
