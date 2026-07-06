import { useRef, useState, useEffect, useCallback } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal as RNModal,
  PanResponder,
  Platform,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MapPin, Bookmark, ChevronDown, Globe } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { LocationInput } from '@/components/ui/LocationInput';
import { KeyboardAwareScrollView } from '@/components/ui/KeyboardAwareScrollView';
import type { Location as GeoLocation } from '@/http/list-api/types';

function formatLocationLabel(location: GeoLocation): string {
  return location.region ? `${location.city}, ${location.region}` : location.city;
}

function getRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Searched today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 14) return `${diffDays} days ago`;
  const weeks = Math.floor(diffDays / 7);
  return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
}

const RECENT_SEARCHES_KEY = 'location_recent_searches';

type RecentSearchEntry = { location: GeoLocation; label: string; timestamp: number };

interface LocationInputModalProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelected: (location: GeoLocation) => void;
  onAllSelected?: () => void;
  isAllSelected?: boolean;
  defaultValue?: string;
}

interface LocationInputModalTriggerProps {
  cityLabel: string;
  isAllSelected?: boolean;
  onLocationSelected: (location: GeoLocation) => void;
  onAllSelected?: () => void;
}

export function LocationInputModalTrigger({
  cityLabel,
  isAllSelected = false,
  onLocationSelected,
  onAllSelected,
}: LocationInputModalTriggerProps) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        className="cursor-pointer flex-row items-center border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1.5"
      >
        <MapPin size={13} color="#6B7280" />
        <Text
          className="ml-1 font-geist-medium text-gray-800 dark:text-gray-400"
          numberOfLines={1}
        >
          {cityLabel}
        </Text>
        <View className="ml-0.5 opacity-55">
          <ChevronDown size={9} />
        </View>
      </Pressable>
      <LocationInputModal
        visible={visible}
        isAllSelected={isAllSelected}
        onClose={() => setVisible(false)}
        onLocationSelected={(loc) => {
          onLocationSelected(loc);
          setVisible(false);
        }}
        onAllSelected={() => {
          onAllSelected?.();
          setVisible(false);
        }}
      />
    </>
  );
}

export function LocationInputModal({
  visible,
  onClose,
  onLocationSelected,
  onAllSelected,
  isAllSelected = false,
}: LocationInputModalProps) {
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const translateY = useRef(new Animated.Value(height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const [isSearchMode, setIsSearchMode] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearchEntry[]>([]);

  const savedLocations: { location: GeoLocation; label: string; note?: string }[] = [];

  const slideDown = useCallback(
    (onDone?: () => void) => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: height,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start(() => onDone?.());
    },
    [translateY, backdropOpacity, height]
  );

  const handleClose = useCallback(() => slideDown(onClose), [slideDown, onClose]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 80 || gestureState.vy > 0.5) {
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: height,
              duration: 220,
              useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 0,
              duration: 220,
              useNativeDriver: true,
            }),
          ]).start(onClose);
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
            speed: 20,
          }).start();
        }
      },
    })
  ).current;

  const loadRecentSearches = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (raw) {
        setRecentSearches(JSON.parse(raw) as RecentSearchEntry[]);
      }
    } catch {
      // silently fail
    }
  }, []);

  const saveRecentSearch = useCallback((location: GeoLocation, label: string) => {
    const entry: RecentSearchEntry = { location, label, timestamp: Date.now() };
    setRecentSearches((prev) => {
      const filtered = prev.filter(
        (r) =>
          !(r.location.city === location.city && r.location.region === location.region)
      );
      const updated = [entry, ...filtered].slice(0, 3);
      AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const handleSelect = useCallback(
    (location: GeoLocation) => {
      const label = formatLocationLabel(location);
      saveRecentSearch(location, label);
      onLocationSelected(location);
      slideDown(onClose);
    },
    [saveRecentSearch, onLocationSelected, onClose, slideDown]
  );

  const handleAllSelect = useCallback(() => {
    onAllSelected?.();
    slideDown(onClose);
  }, [onAllSelected, onClose, slideDown]);

  useEffect(() => {
    if (visible) {
      setIsSearchMode(false);
      translateY.setValue(height);
      backdropOpacity.setValue(0);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
          speed: 20,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      loadRecentSearches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View
          style={[{ opacity: backdropOpacity }]}
          className="absolute inset-0"
          pointerEvents="none"
        >
          <View className="absolute inset-0 bg-ink/50" />
        </Animated.View>
        <Pressable
          className="absolute inset-0"
          onPress={handleClose}
          style={{ backgroundColor: 'transparent' }}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end"
          pointerEvents="box-none"
        >
          <Animated.View
            style={{ transform: [{ translateY }] }}
            className="bg-white dark:bg-gray-900 rounded-t-[35px] max-h-[85%]"
          >
            <View
              className="w-full items-center pt-3 pb-2"
              {...panResponder.panHandlers}
            >
              <View className="w-24 h-[5px] rounded-full bg-gray-300 dark:bg-gray-600" />
            </View>

            <View className="flex-row items-center justify-between px-6 pt-2 pb-4">
              <Text className="font-geist-bold text-xl text-ink dark:text-gray-100">
                Choose a location
              </Text>
              <Pressable onPress={handleClose} hitSlop={8} className="cursor-pointer">
                <Text className="font-geist-semibold text-base text-brand">Done</Text>
              </Pressable>
            </View>

            <KeyboardAwareScrollView
              scrollToFocusedInput
              keyboardShouldPersistTaps="always"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              <View className="px-0">
                <View className="px-6">
                    <LocationInput
                    inModal
                    onLocationSelected={handleSelect}
                    onQueryChange={(q) => setIsSearchMode(q.length >= 2)}
                    placeholder="Search any city..."
                    />
                </View>

                {!isSearchMode && (
                  <>
                    {onAllSelected && (
                      <Pressable
                        onPress={handleAllSelect}
                        className={`flex-row items-center gap-4 py-3.5 border-b border-gray-100 dark:border-gray-800 cursor-pointer px-6${isAllSelected ? " bg-brand/10" : ""}`}
                      >
                        <View className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center shrink-0">
                          <Globe size={18} color="#6B7280" />
                        </View>
                        <View className="flex-1">
                          <Text className="font-geist-medium text-[15px] text-ink dark:text-gray-100">
                            {t("home.location.all")}
                          </Text>
                          <Text className="font-geist text-sm text-gray-500 dark:text-gray-400">
                            {t("home.location.allDescription")}
                          </Text>
                        </View>
                        {isAllSelected && (
                          <View className="w-2.5 h-2.5 rounded-full bg-brand" />
                        )}
                      </Pressable>
                    )}

                    <View className="h-px bg-gray-100 dark:bg-gray-800 mb-5" />

                    {recentSearches.length > 0 && (
                      <View className="mb-5">
                        <Text className="font-geist-semibold text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 px-6">
                          Recent
                        </Text>
                        {recentSearches.map((entry, index) => (
                          <Pressable
                            key={`${entry.location.city}-${entry.location.region}`}
                            onPress={() => handleSelect(entry.location)}
                            className={`flex-row items-center gap-4 py-3.5 border-b border-gray-100 dark:border-gray-800 cursor-pointer px-6${index === 0 ? " bg-brand/10" : ""}`}
                          >
                            <View className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center shrink-0">
                              <MapPin size={18} color="#6B7280" />
                            </View>
                            <View className="flex-1">
                              <Text className="font-geist-medium text-[15px] text-ink dark:text-gray-100">
                                {entry.label}
                              </Text>
                              <Text className="font-geist text-sm text-gray-500 dark:text-gray-400">
                                {getRelativeTime(entry.timestamp)}
                              </Text>
                            </View>
                            {index === 0 && (
                              <View className="w-2.5 h-2.5 rounded-full bg-brand" />
                            )}
                          </Pressable>
                        ))}
                      </View>
                    )}

                    {savedLocations.length > 0 && (
                      <View>
                        <Text className="font-geist-semibold text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
                          Saved
                        </Text>
                        {savedLocations.map((entry) => (
                          <Pressable
                            key={`${entry.location.city}-${entry.location.region}`}
                            onPress={() => handleSelect(entry.location)}
                            className="flex-row items-center gap-4 py-3.5 border-b border-gray-100 dark:border-gray-800 cursor-pointer"
                          >
                            <View className="w-10 h-10 rounded-full bg-brand-tint dark:bg-brand/20 items-center justify-center shrink-0">
                              <Bookmark size={18} color="#FF6B1A" />
                            </View>
                            <View className="flex-1">
                              <Text className="font-geist-medium text-[15px] text-ink dark:text-gray-100">
                                {entry.label}
                              </Text>
                              {entry.note && (
                                <Text className="font-geist text-sm text-gray-500 dark:text-gray-400">
                                  {entry.note}
                                </Text>
                              )}
                            </View>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </>
                )}
              </View>
            </KeyboardAwareScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </RNModal>
  );
}
