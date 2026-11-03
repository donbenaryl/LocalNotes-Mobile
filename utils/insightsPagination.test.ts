import { mergePages, nextKeywordPage } from './insightsPagination';

const key = (c: { label: string }) => c.label;

describe('mergePages', () => {
  it('appends pages in order', () => {
    const out = mergePages([[{ label: 'a' }], [{ label: 'b' }, { label: 'c' }]], key);
    expect(out.map(key)).toEqual(['a', 'b', 'c']);
  });

  it('skips empty pages and drops duplicate keys', () => {
    const out = mergePages([[{ label: 'a' }], [], [{ label: 'a' }, { label: 'b' }]], key);
    expect(out.map(key)).toEqual(['a', 'b']);
  });

  it('tolerates undefined and null pages', () => {
    expect(mergePages([undefined, null, [{ label: 'x' }]], key)).toEqual([{ label: 'x' }]);
    expect(mergePages([], key)).toEqual([]);
  });
});

describe('nextKeywordPage', () => {
  const page = (n: number, count: number, total: number) => ({
    chips: Array.from({ length: count }, (_, i) => i),
    page: n,
    page_size: 50,
    total,
  });

  it('returns the following page while items remain', () => {
    expect(nextKeywordPage(page(1, 50, 120), 50)).toBe(2);
    expect(nextKeywordPage(page(2, 50, 120), 100)).toBe(3);
  });

  it('stops when everything is loaded', () => {
    expect(nextKeywordPage(page(3, 20, 120), 120)).toBeUndefined();
  });

  it('stops on an empty page or undefined', () => {
    expect(nextKeywordPage(page(4, 0, 120), 100)).toBeUndefined();
    expect(nextKeywordPage(undefined, 0)).toBeUndefined();
  });
});
