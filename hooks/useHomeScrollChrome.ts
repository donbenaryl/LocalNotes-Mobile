import { useHomeChromeStore } from '@/stores/useHomeChromeStore';
import { useScrollChromeHandler } from '@/hooks/useScrollChromeHandler';

export function useHomeScrollChrome() {
  const setHidden = useHomeChromeStore((s) => s.setHidden);
  const setScrolled = useHomeChromeStore((s) => s.setScrolled);
  return useScrollChromeHandler(setHidden, setScrolled);
}
