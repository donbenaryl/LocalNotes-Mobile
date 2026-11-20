import { compareSemver, isVersionBelow } from './semver';

describe('compareSemver', () => {
  it('orders equal versions as 0', () => {
    expect(compareSemver('1.0.4', '1.0.4')).toBe(0);
    expect(compareSemver('1.0', '1.0.0')).toBe(0);
  });

  it('orders lower patch/minor/major as -1', () => {
    expect(compareSemver('1.0.3', '1.0.4')).toBe(-1);
    expect(compareSemver('1.1.0', '1.2.0')).toBe(-1);
    expect(compareSemver('1.9.9', '2.0.0')).toBe(-1);
  });

  it('orders higher versions as 1', () => {
    expect(compareSemver('1.0.5', '1.0.4')).toBe(1);
    expect(compareSemver('2.0.0', '1.9.9')).toBe(1);
  });

  it('pads missing parts', () => {
    expect(compareSemver('1', '1.0.0')).toBe(0);
    expect(compareSemver('1.2', '1.2.1')).toBe(-1);
  });
});

describe('isVersionBelow', () => {
  it('is true only when current is strictly below min', () => {
    expect(isVersionBelow('1.0.3', '1.0.4')).toBe(true);
    expect(isVersionBelow('1.0.4', '1.0.4')).toBe(false);
    expect(isVersionBelow('1.0.5', '1.0.4')).toBe(false);
  });
});
