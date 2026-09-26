import { useCallback, useState } from 'react';

export type BusinessHomePageId =
  | 'profile'
  | 'overview'
  | 'findyou'
  | 'locations'
  | 'customers'
  | 'membership'
  | 'campaign'
  | 'spotlight';

export type BusinessHomeTopTabId =
  | 'insights'
  | 'campaigns'
  | 'alerts'
  | 'thankYou';

export type BusinessHomeOverviewTabId = 'overview' | 'promote' | 'analytics';

export type BusinessHomeCustomersTabId =
  | 'customers'
  | 'demand'
  | 'performance';

export function useBusinessHomeNav(initial: BusinessHomePageId = 'profile') {
  const [stack, setStack] = useState<BusinessHomePageId[]>([initial]);

  const page = stack[stack.length - 1] ?? initial;

  const push = useCallback((id: BusinessHomePageId) => {
    setStack((prev) => {
      if (prev[prev.length - 1] === id) return prev;
      return [...prev, id];
    });
  }, []);

  const pop = useCallback(() => {
    let didPop = false;
    setStack((prev) => {
      if (prev.length <= 1) return prev;
      didPop = true;
      return prev.slice(0, -1);
    });
    return didPop;
  }, []);

  const canPop = stack.length > 1;

  const resetTo = useCallback((id: BusinessHomePageId) => {
    setStack([id]);
  }, []);

  return { page, stack, push, pop, canPop, resetTo };
}
