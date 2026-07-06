import { Pressable } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useColorScheme } from 'nativewind';
import { useThemeStore } from '../../stores/useThemeStore';

function SunIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={5} stroke="#F59E0B" strokeWidth={2} />
      <Path
        d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke="#F59E0B"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function MoonIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
        stroke="#818CF8"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ThemeToggle() {
  const { colorScheme: activeScheme } = useColorScheme();
  const setTheme = useThemeStore((s) => s.setTheme);
  const isDark = activeScheme === 'dark';

  const handleToggle = () => {
    void setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <Pressable
      onPress={handleToggle}
      className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 cursor-pointer"
      hitSlop={8}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </Pressable>
  );
}
