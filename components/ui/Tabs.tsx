import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';

export interface TabItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  textClassName?: string;
  /** When set, active chrome follows this UI-thread index instead of `activeTab`. */
  highlightIndex?: SharedValue<number>;
}

const BRAND = '#FF6B1A';
const MUTED_ICON = '#6B7280';

function AnimatedTabButton({
  tab,
  index,
  highlightIndex,
  onTabChange,
  textClassName,
  activeTextColor,
  inactiveTextColor,
}: {
  tab: TabItem;
  index: number;
  highlightIndex: SharedValue<number>;
  onTabChange: (tabId: string) => void;
  textClassName?: string;
  activeTextColor: string;
  inactiveTextColor: string;
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
        className="relative mr-6 cursor-pointer flex-row items-center gap-2 border-b-2 px-2 pb-3 pr-4"
      >
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
}: TabsProps) {
  const { colorScheme } = useColorScheme();
  const activeTextColor = colorScheme === 'dark' ? '#F3F4F6' : '#141413';
  const inactiveTextColor = colorScheme === 'dark' ? '#9CA3AF' : '#6B7280';

  return (
    <View
      className={`border-b border-gray-200 dark:border-gray-700 ${className ?? ''}`}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {highlightIndex
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
                  className={`relative mr-6 cursor-pointer flex-row items-center gap-2 border-b-2 px-2 pb-3 pr-4 ${
                    isActive ? 'border-brand' : 'border-transparent'
                  }`}
                >
                  <Icon
                    size={12}
                    color={isActive ? BRAND : MUTED_ICON}
                  />
                  <Text
                    className={`${textClassName ?? ''} ${
                      isActive
                        ? 'font-geist-bold text-ink dark:text-gray-100'
                        : 'font-geist-semibold text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
      </ScrollView>
    </View>
  );
}
