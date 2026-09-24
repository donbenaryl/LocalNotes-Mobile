import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import { cn } from '@/utils/cn';

export interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  textClassName?: string;
  /** When set, active chrome follows this UI-thread index instead of `activeTab`. */
  highlightIndex?: SharedValue<number>;
  /**
   * Share the row evenly: each tab is flex-1, label centered,
   * and the active underline spans the full tab width.
   */
  equalWidth?: boolean;
}

const BRAND = '#FF6B1A';
const MUTED_ICON = '#6B7280';

function tabItemClassName(equalWidth: boolean, isActive?: boolean) {
  return cn(
    'flex-row items-center gap-2 border-b-2 pb-3',
    equalWidth
      ? 'flex-1 justify-center px-2'
      : 'relative mr-4 cursor-pointer px-2 pr-4',
    // Animated path sets border color via style; static path uses isActive.
    isActive === true && 'border-brand',
    isActive === false && 'border-transparent',
  );
}

function AnimatedTabButton({
  tab,
  index,
  highlightIndex,
  onTabChange,
  textClassName,
  activeTextColor,
  inactiveTextColor,
  equalWidth,
}: {
  tab: TabItem;
  index: number;
  highlightIndex: SharedValue<number>;
  onTabChange: (tabId: string) => void;
  textClassName?: string;
  activeTextColor: string;
  inactiveTextColor: string;
  equalWidth: boolean;
}) {
  const Icon = tab.icon;

  const tap = Gesture.Tap()
    .onBegin(() => {
      'worklet';
      highlightIndex.value = index;
    })
    .onEnd((_event, success) => {
      'worklet';
      if (success) {
        runOnJS(onTabChange)(tab.id);
      }
    });

  const borderStyle = useAnimatedStyle(() => ({
    borderBottomColor:
      highlightIndex.value === index ? BRAND : 'transparent',
  }));

  const activeIconStyle = useAnimatedStyle(() => ({
    opacity: highlightIndex.value === index ? 1 : 0,
  }));

  const inactiveIconStyle = useAnimatedStyle(() => ({
    opacity: highlightIndex.value === index ? 0 : 1,
  }));

  const activeTextStyle = useAnimatedStyle(() => ({
    opacity: highlightIndex.value === index ? 1 : 0,
  }));

  const inactiveTextStyle = useAnimatedStyle(() => ({
    opacity: highlightIndex.value === index ? 0 : 1,
  }));

  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        style={borderStyle}
        className={tabItemClassName(equalWidth)}
      >
        {Icon ? (
          <View className="h-3 w-3">
            <Animated.View
              style={activeIconStyle}
              className="absolute inset-0 items-center justify-center"
            >
              <Icon size={12} color={BRAND} />
            </Animated.View>
            <Animated.View
              style={inactiveIconStyle}
              className="absolute inset-0 items-center justify-center"
            >
              <Icon size={12} color={MUTED_ICON} />
            </Animated.View>
          </View>
        ) : null}
        <View>
          <Animated.Text
            style={[{ color: activeTextColor }, activeTextStyle]}
            className={`${textClassName ?? ''} font-geist-bold`}
          >
            {tab.label}
          </Animated.Text>
          <Animated.Text
            style={[
              { color: inactiveTextColor },
              inactiveTextStyle,
              { position: 'absolute', left: 0, top: 0 },
            ]}
            className={`${textClassName ?? ''} font-geist-semibold`}
          >
            {tab.label}
          </Animated.Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

export function Tabs({
  tabs,
  activeTab,
  onTabChange,
  className,
  textClassName,
  highlightIndex,
  equalWidth = false,
}: TabsProps) {
  const { colorScheme } = useColorScheme();
  // Equal-width mode matches segmented controls: brand for active label.
  const activeTextColor = equalWidth
    ? BRAND
    : colorScheme === 'dark'
      ? '#F3F4F6'
      : '#141413';
  const inactiveTextColor = colorScheme === 'dark' ? '#9CA3AF' : '#6B7280';

  const items = highlightIndex
    ? tabs.map((tab, index) => (
        <AnimatedTabButton
          key={tab.id}
          tab={tab}
          index={index}
          highlightIndex={highlightIndex}
          onTabChange={onTabChange}
          textClassName={textClassName}
          activeTextColor={activeTextColor}
          inactiveTextColor={inactiveTextColor}
          equalWidth={equalWidth}
        />
      ))
    : tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const Icon = tab.icon;
        return (
          <TouchableOpacity
            activeOpacity={0.6}
            key={tab.id}
            onPress={() => onTabChange(tab.id)}
            className={tabItemClassName(equalWidth, isActive)}
          >
            {Icon ? (
              <Icon size={12} color={isActive ? BRAND : MUTED_ICON} />
            ) : null}
            <Text
              className={cn(
                textClassName,
                isActive
                  ? equalWidth
                    ? 'font-geist-bold text-brand'
                    : 'font-geist-bold text-ink dark:text-gray-100'
                  : 'font-geist-semibold text-gray-500 dark:text-gray-400',
              )}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      });

  return (
    <View
      className={cn(
        'border-b border-gray-200 dark:border-gray-700',
        className,
      )}
    >
      {equalWidth ? (
        <View className="flex-row">{items}</View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {items}
        </ScrollView>
      )}
    </View>
  );
}
