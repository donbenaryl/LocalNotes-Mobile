import { useEffect, useRef, useState } from "react";
import { Keyboard, Pressable, Text, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { PageLoader } from "@/components/ui/PageLoader";
import { MapPin, Search, X } from "lucide-react-native";
import * as Location from "expo-location";
import { mapboxToken } from "@/http/environment.config";
import type { Location as GeoLocation } from "@/http/list-api/types";
import placesService from "@/http/places-api/places.service";
import type {
  PlaceAutocompleteSuggestionDAO,
  PlaceDetailsDAO,
} from "@/http/places-api/types";
import { TextInput } from "@/components/ui/TextInput";
import { Target } from "lucide-react-native/icons";
import { useAccountSettingsStore } from "@/stores/useAccountSettingsStore";

interface LocationInputProps {
  onLocationSelected: (location: GeoLocation) => void;
  onQueryChange?: (query: string) => void;
  placeholder?: string;
  defaultValue?: string;
  containerClassName?: string;
  /** Use gesture-handler touchables — required for reliable taps inside RN Modal */
  inModal?: boolean;
  /** Reveal street address + postal code fields — only for editing a saved home address */
  showAddressFields?: boolean;
  /** Prefills the search text and, when showAddressFields is true, the address detail fields */
  initialLocation?: GeoLocation | null;
  /**
   * When true (default), autocomplete sends device lat/lng as Google locationBias.
   * Set false for city/filter pickers so far-away places are not deprioritized.
   */
  biasToUserLocation?: boolean;
}

function extractMapboxLocation(place: Record<string, unknown>): GeoLocation {
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

/** DB `street_address` is CharField(max_length=255). */
const STREET_ADDRESS_MAX_LENGTH = 255;

function truncateStreetAddress(value: string): string {
  return value.length > STREET_ADDRESS_MAX_LENGTH
    ? value.slice(0, STREET_ADDRESS_MAX_LENGTH)
    : value;
}

function formatLocationLabel(location: GeoLocation): string {
  // street_address holds the complete address when set from Google Places.
  if (location.street_address?.trim()) {
    return location.street_address.trim();
  }

  return location.region
    ? `${location.city}, ${location.region}`
    : location.city;
}

function formatGooglePlaceLabel(place: PlaceDetailsDAO): string {
  if (place.formatted_address?.trim()) return place.formatted_address.trim();
  if (place.name?.trim() && place.city.trim()) {
    return `${place.name.trim()}, ${place.city.trim()}`;
  }
  return formatLocationLabel(place);
}

function buildSessionToken(): string {
  // Places API requires a URL/filename-safe token of at most 36 ASCII chars (UUID recommended).
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function LocationInput({
  onLocationSelected,
  onQueryChange,
  placeholder = "Search a place or address",
  defaultValue = "",
  containerClassName = "",
  inModal = false,
  showAddressFields = false,
  initialLocation = null,
  biasToUserLocation = true,
}: LocationInputProps) {
  const initialQuery = initialLocation
    ? formatLocationLabel(initialLocation)
    : defaultValue;
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<PlaceAutocompleteSuggestionDAO[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [coreLocation, setCoreLocation] = useState<GeoLocation | null>(initialLocation);
  const [streetAddress, setStreetAddress] = useState(initialLocation?.street_address ?? "");
  const [postalCode, setPostalCode] = useState(initialLocation?.postal_code ?? "");
  const fetchGenerationRef = useRef(0);
  const sessionTokenRef = useRef<string | null>(null);
  const locationBiasRef = useRef<{ latitude: number; longitude: number } | null>(null);
  // When set, `query` was committed via selection/default — never geocode it until the user edits.
  const committedQueryRef = useRef<string | null>(
    initialQuery.length >= 2 ? initialQuery : null,
  );
  const isProgrammaticUpdateRef = useRef(false);
  const usePreciseLocation = useAccountSettingsStore((s) => s.privacy.usePreciseLocation);

  const isCommittedQuery = (value: string) =>
    committedQueryRef.current !== null && value === committedQueryRef.current;

  const resetSessionToken = () => {
    sessionTokenRef.current = null;
  };

  const ensureSessionToken = () => {
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = buildSessionToken();
    }
    return sessionTokenRef.current;
  };

  const applyProgrammaticQuery = (text: string, commit: boolean) => {
    isProgrammaticUpdateRef.current = true;
    committedQueryRef.current = commit && text.length >= 2 ? text : null;
    setQuery(text);
    queueMicrotask(() => {
      isProgrammaticUpdateRef.current = false;
    });
  };

  useEffect(() => {
    if (initialLocation) return;
    applyProgrammaticQuery(defaultValue, defaultValue.length >= 2);
  }, [defaultValue, initialLocation]);

  useEffect(() => {
    if (!initialLocation) return;
    setCoreLocation(initialLocation);
    setStreetAddress(initialLocation.street_address ?? "");
    setPostalCode(initialLocation.postal_code ?? "");
    applyProgrammaticQuery(formatLocationLabel(initialLocation), true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLocation]);

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
          let latitude: number | undefined;
          let longitude: number | undefined;

          if (biasToUserLocation) {
            const permissions = await Location.getForegroundPermissionsAsync();

            if (permissions.status === "granted") {
              const lastKnown = await Location.getLastKnownPositionAsync();
              if (lastKnown?.coords) {
                latitude = lastKnown.coords.latitude;
                longitude = lastKnown.coords.longitude;
              } else if (locationBiasRef.current) {
                latitude = locationBiasRef.current.latitude;
                longitude = locationBiasRef.current.longitude;
              }

              if (latitude === undefined || longitude === undefined) {
                const current = await Location.getCurrentPositionAsync({
                  accuracy: usePreciseLocation
                    ? Location.Accuracy.Balanced
                    : Location.Accuracy.Low,
                });
                latitude = current.coords.latitude;
                longitude = current.coords.longitude;
              }

              if (latitude !== undefined && longitude !== undefined) {
                locationBiasRef.current = { latitude, longitude };
              }
            }
          }

          const response = await placesService.autocomplete({
            input: query,
            latitude,
            longitude,
            session_token: ensureSessionToken(),
          });
          if (generation !== fetchGenerationRef.current) return;
          setSuggestions(response.data?.data ?? []);
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
  }, [query, usePreciseLocation, biasToUserLocation]);

  const handleUserQueryChange = (text: string) => {
    if (isProgrammaticUpdateRef.current) return;
    committedQueryRef.current = null;
    if (text.trim().length >= 2) {
      ensureSessionToken();
    } else {
      resetSessionToken();
    }
    setQuery(text);
  };

  const commitLocationSelection = (
    location: GeoLocation,
    label: string,
    nextStreetAddress?: string | null,
    nextPostalCode?: string | null,
  ) => {
    fetchGenerationRef.current += 1;
    const normalizedStreetAddress = nextStreetAddress?.trim() ?? location.street_address ?? null;
    const normalizedPostalCode = nextPostalCode?.trim() ?? location.postal_code ?? null;
    const nextLocation: GeoLocation = {
      ...location,
      street_address: normalizedStreetAddress || null,
      postal_code: normalizedPostalCode || null,
    };

    if (showAddressFields) {
      setStreetAddress(normalizedStreetAddress ?? "");
      setPostalCode(normalizedPostalCode ?? "");
    }

    resetSessionToken();
    setSuggestions([]);
    setShowSuggestions(false);
    setIsLoading(false);
    setCoreLocation(nextLocation);
    onLocationSelected(nextLocation);
    applyProgrammaticQuery(label, true);
    if (!inModal) {
      setTimeout(() => Keyboard.dismiss(), 0);
    }
  };

  const handleGooglePlaceSelect = async (place: PlaceAutocompleteSuggestionDAO) => {
    const generation = ++fetchGenerationRef.current;
    setIsLoading(true);

    try {
      const response = await placesService.getDetails({
        place_id: place.place_id,
        session_token: sessionTokenRef.current ?? undefined,
      });
      if (generation !== fetchGenerationRef.current) return;

      const details = response.data?.data;
      if (!details) throw new Error("Place details missing");

      const completeAddressRaw =
        details.formatted_address?.trim() ||
        details.street_address?.trim() ||
        "";
      const completeAddress = completeAddressRaw
        ? truncateStreetAddress(completeAddressRaw)
        : null;

      const location: GeoLocation = {
        street_address: completeAddress,
        postal_code: details.postal_code ?? null,
        city: details.city,
        region: details.region,
        country: details.country,
        latitude: details.latitude,
        longitude: details.longitude,
      };
      commitLocationSelection(
        location,
        formatGooglePlaceLabel(details),
        completeAddress,
        details.postal_code,
      );
    } catch {
      if (generation !== fetchGenerationRef.current) return;
      setIsLoading(false);
    }
  };

  const handleMapboxLocationSelect = (place: Record<string, unknown>) => {
    const location = extractMapboxLocation(place);
    setCoreLocation(location);
    commitLocationSelection(location, formatLocationLabel(location));
  };

  const handleStreetAddressChange = (text: string) => {
    setStreetAddress(text);
    if (!coreLocation) return;
    onLocationSelected({
      ...coreLocation,
      street_address: text.trim() || null,
      postal_code: postalCode.trim() || null,
    });
  };

  const handlePostalCodeChange = (text: string) => {
    setPostalCode(text);
    if (!coreLocation) return;
    onLocationSelected({
      ...coreLocation,
      street_address: streetAddress.trim() || null,
      postal_code: text.trim() || null,
    });
  };

  const handleUseCurrentLocation = async () => {
    setIsGeolocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: usePreciseLocation ? Location.Accuracy.Balanced : Location.Accuracy.Low,
      });
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.longitude},${coords.latitude}.json?access_token=${mapboxToken}&types=place,locality,region,country&limit=1`,
      );
      if (!response.ok) throw new Error("Reverse geocoding failed");
      const data = await response.json();
      if (data.features?.length > 0) {
        handleMapboxLocationSelect(data.features[0]);
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
    resetSessionToken();
    setCoreLocation(null);
    if (showAddressFields) {
      setStreetAddress("");
      setPostalCode("");
    }
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
                    {place.primary_text}
                  </Text>
                  <Text
                    className="font-geist text-sm text-gray-500 dark:text-gray-400"
                    numberOfLines={1}
                  >
                    {place.secondary_text}
                  </Text>
                </View>
              </View>
            );

            if (inModal) {
              return (
                <TouchableOpacity
                  key={place.place_id ?? index}
                  activeOpacity={0.7}
                  onPress={() => void handleGooglePlaceSelect(place)}
                >
                  {rowContent}
                </TouchableOpacity>
              );
            }

            return (
              <Pressable
                key={place.place_id ?? index}
                onPress={() => void handleGooglePlaceSelect(place)}
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

      {/* Address details — only shown when editing a home address */}
      {showAddressFields && (
        <View className="gap-4 mb-4">
          <TextInput
            label="STREET ADDRESS"
            value={streetAddress}
            onChangeText={handleStreetAddressChange}
            placeholder="Street, house/apartment number"
            autoCorrect={false}
            containerClassName="mb-0"
          />
          <TextInput
            label="POSTAL CODE"
            value={postalCode}
            onChangeText={handlePostalCodeChange}
            placeholder="Postal / ZIP code"
            autoCorrect={false}
            autoCapitalize="characters"
            containerClassName="mb-0"
          />
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
