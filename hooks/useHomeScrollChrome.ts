import { useHomeChromeStore } from '@/stores/useHomeChromeStore';
import { useScrollChromeHandler } from '@/hooks/useScrollChromeHandler';

export function useHomeScrollChrome() {
  const setHidden = useHomeChromeStore((s) => s.setHidden);
  return useScrollChromeHandler(setHidden);
}
