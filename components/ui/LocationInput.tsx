import { useRef, useState, useEffect } from "react";
import { Keyboard, Pressable, Text, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { PageLoader } from "@/components/ui/PageLoader";
import { MapPin, Navigation, Search, X } from "lucide-react-native";
import * as Location from "expo-location";
import { mapboxToken } from "@/http/environment.config";
import type { Location as GeoLocation } from "@/http/list-api/types";
import { TextInput } from "@/components/ui/TextInput";
import { Target } from "lucide-react-native/icons";

interface LocationInputProps {
  onLocationSelected: (location: GeoLocation) => void;
  onQueryChange?: (query: string) => void;
  placeholder?: string;
  defaultValue?: string;
  containerClassName?: string;
  /** Use gesture-handler touchables — required for reliable taps inside RN Modal */
  inModal?: boolean;
}

function extractLocation(place: Record<string, unknown>): GeoLocation {
  const [longitude, latitude] = place.center as [number, number];
  const context = (place.context as Record<string, string>[] | undefined) ?? [];

  let city = place.text as string;
  let region = "";
  let country = "";

  context.forEach((item) => {
    if (item.id.startsWith("region")) region = item.text;
    if (item.id.startsWith("country")) country = item.text;
  });

  const placeType = place.place_type as string[];
  if (placeType.includes("region")) {
    region = place.text as string;
    city = place.text as string;
  } else if (placeType.includes("country")) {
    country = place.text as string;
    region = place.text as string;
    city = place.text as string;
  }

  return { city, region, country, latitude, longitude };
}

function formatLocationLabel(location: GeoLocation): string {
  return location.region
    ? `${location.city}, ${location.region}`
    : location.city;
}

export function LocationInput({
  onLocationSelected,
  onQueryChange,
  placeholder = "Search any city or place",
  defaultValue = "",
  containerClassName = "",
  inModal = false,
}: LocationInputProps) {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Record<string, unknown>[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const fetchGenerationRef = useRef(0);
  // When set, `query` was committed via selection/default — never geocode it until the user edits.
  const committedQueryRef = useRef<string | null>(
    defaultValue.length >= 2 ? defaultValue : null,
  );
  const isProgrammaticUpdateRef = useRef(false);

  const isCommittedQuery = (value: string) =>
    committedQueryRef.current !== null && value === committedQueryRef.current;

  const applyProgrammaticQuery = (text: string, commit: boolean) => {
    isProgrammaticUpdateRef.current = true;
    committedQueryRef.current = commit && text.length >= 2 ? text : null;
    setQuery(text);
    queueMicrotask(() => {
      isProgrammaticUpdateRef.current = false;
    });
  };

  useEffect(() => {
    applyProgrammaticQuery(defaultValue, defaultValue.length >= 2);
  }, [defaultValue]);

  useEffect(() => {
    if (isCommittedQuery(query)) {
      setIsLoading(false);
      return;
    }

    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      if (isCommittedQuery(query)) return;

      setIsLoading(true);
      const generation = ++fetchGenerationRef.current;

      void (async () => {
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&types=place,locality,region,country&limit=5`,
          );
          if (!response.ok) throw new Error("Geocoding request failed");
          const data = await response.json();
          if (generation !== fetchGenerationRef.current) return;
          setSuggestions(data.features ?? []);
        } catch {
          if (generation !== fetchGenerationRef.current) return;
          setSuggestions([]);
        } finally {
          if (generation !== fetchGenerationRef.current) return;
          setIsLoading(false);
          setShowSuggestions(query.length >= 2);
        }
      })();
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleUserQueryChange = (text: string) => {
    if (isProgrammaticUpdateRef.current) return;
    committedQueryRef.current = null;
    setQuery(text);
  };

  const handleSelect = (place: Record<string, unknown>) => {
    fetchGenerationRef.current += 1;
    const location = extractLocation(place);
    const label = formatLocationLabel(location);
    onLocationSelected(location);
    applyProgrammaticQuery(label, true);
    setShowSuggestions(false);
    setSuggestions([]);
    setIsLoading(false);
    if (!inModal) {
      setTimeout(() => Keyboard.dismiss(), 0);
    }
  };

  const handleUseCurrentLocation = async () => {
    setIsGeolocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.longitude},${coords.latitude}.json?access_token=${mapboxToken}&types=place,locality,region,country&limit=1`,
      );
      if (!response.ok) throw new Error("Reverse geocoding failed");
      const data = await response.json();
      if (data.features?.length > 0) {
        handleSelect(data.features[0]);
      }
    } catch {
      // silently fail — user can type manually
    } finally {
      setIsGeolocating(false);
    }
  };

  useEffect(() => {
    onQueryChange?.(query);
  }, [query, onQueryChange]);

  const clearInput = () => {
    fetchGenerationRef.current += 1;
    applyProgrammaticQuery("", false);
    setSuggestions([]);
    setShowSuggestions(false);
    setIsLoading(false);
  };

  return (
    <View className={containerClassName}>
      {/* Search input */}
      <View className="relative mb-2">
        <TextInput
          placeholder={placeholder}
          value={query}
          onChangeText={handleUserQueryChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          autoCorrect={false}
          autoCapitalize="none"
          containerClassName="mb-0"
          style={{ paddingLeft: 40 }}
        />
        <View className="pointer-events-none absolute left-4 top-0 bottom-0 justify-center">
          <Search size={18} color="#9CA3AF" />
        </View>
        <View className="absolute right-4 top-0 bottom-0 justify-center">
          {isLoading ? (
            <PageLoader fullPage={false} size="small" />
          ) : query.length > 0 ? (
            <Pressable onPress={clearInput} className="p-1 cursor-pointer">
              <X size={16} color="#9CA3AF" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden mb-4">
          {suggestions.map((place, index) => {
            const rowClassName = `flex-row items-start gap-3 px-4 py-3 ${
              index < suggestions.length - 1
                ? "border-b border-gray-100 dark:border-gray-800"
                : ""
            }`;

            const rowContent = (
              <View className={rowClassName}>
                <MapPin size={18} color="#FF6B1A" className="mt-0.5 shrink-0" />
                <View className="flex-1">
                  <Text className="font-geist-medium text-[15px] text-ink dark:text-gray-100">
                    {place.text as string}
                  </Text>
                  <Text
                    className="font-geist text-sm text-gray-500 dark:text-gray-400"
                    numberOfLines={1}
                  >
                    {place.place_name as string}
                  </Text>
                </View>
              </View>
            );

            if (inModal) {
              return (
                <TouchableOpacity
                  key={(place.id as string) ?? index}
                  activeOpacity={0.7}
                  onPress={() => handleSelect(place)}
                >
                  {rowContent}
                </TouchableOpacity>
              );
            }

            return (
              <Pressable
                key={(place.id as string) ?? index}
                onPress={() => handleSelect(place)}
                className="cursor-pointer active:opacity-70"
              >
                {rowContent}
              </Pressable>
            );
          })}
        </View>
      )}

      {/* No results */}
      {showSuggestions &&
        !isLoading &&
        suggestions.length === 0 &&
        query.length >= 2 && (
          <View className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 mb-4 items-center">
            <Text className="font-geist text-sm text-gray-500 dark:text-gray-400">
              No locations found for "{query}"
            </Text>
          </View>
        )}

      {/* Use current location */}
      <Pressable
        onPress={handleUseCurrentLocation}
        disabled={isGeolocating}
        className={`flex-row items-center gap-3 bg-orange-50 rounded-2xl border-2 px-4 py-3.5 mb-4 cursor-pointer ${
          isGeolocating
            ? "border-brand/30 bg-white dark:bg-gray-900 opacity-60"
            : "border-brand/30 bg-white dark:bg-gray-900"
        }`}
      >
        <View className="w-10 h-10 rounded-full bg-brand items-center justify-center">
          {isGeolocating ? (
            <PageLoader fullPage={false} size="small" />
          ) : (
            <Target size={18} color="white" />
          )}
        </View>
        <View className="flex-1">
          <Text className="font-geist-bold text-[15px] text-ink dark:text-gray-100">
            Use my current location
          </Text>
          <Text className="font-geist text-sm text-brand">
            {isGeolocating ? "Detecting..." : "GPS-detected"}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}
