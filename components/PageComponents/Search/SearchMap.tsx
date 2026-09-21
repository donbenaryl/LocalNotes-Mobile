import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeSyntheticEvent,
} from "react-native";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  type Region,
} from "react-native-maps";
import { useTranslation } from "react-i18next";
import { MapPinMarker } from "@/components/ui/MapPinMarker";
import { ListDetailModal } from "@/components/ui/ListDetailModal";
import { SearchMapPinSheet } from "@/components/PageComponents/Search/SearchMapPinSheet";
import { PickDetailModal } from "@/components/PageComponents/Profile/PickDetailModal";
import type { BusinessItemDAO } from "@/http/business-api/types";
import type { ListItemDAO, ListItemPublic } from "@/http/list-api/types";
import type { UnifiedSearchPersonDAO } from "@/http/search-api/type";
import { useEffectiveSearchLocation } from "@/hooks/useEffectiveSearchLocation";
import {
  buildBusinessMapMarkers,
  buildListMapMarkers,
  buildPeopleMapMarkers,
  buildPickMapMarkers,
  getSearchMapRegion,
  type SearchMapMarker,
} from "@/utils/searchMapMarkers";

export type SearchMapMode = "lists" | "places" | "people";

/** Extra map height clipped by host overflow to cover Apple Maps  Maps label. */
const LEGAL_LABEL_CLIP = 28;

interface SearchMapProps {
  mode: SearchMapMode;
  lists?: ListItemDAO[];
  businesses?: BusinessItemDAO[];
  picks?: ListItemPublic[];
  people?: UnifiedSearchPersonDAO[];
  /** Fraction of screen height for the embedded map (handoff ~30%). Use 1 to fill parent. */
  heightRatio?: number;
  /** Host width when filling the Search results band (Android needs explicit pixels). */
  mapWidth?: number;
  /** Settled visible height for camera fitting when filling the parent. */
  mapHeight?: number;
  areaLabel?: string;
  bottomOverlayHeight?: number;
  /** Fired when the user pans/pinches/rotates the map (not programmatic camera moves). */
  onUserInteraction?: () => void;
}

const MAP_EDGE_PADDING = 24;
const SINGLE_MARKER_LATITUDE_DELTA = 0.04;
const SINGLE_MARKER_LONGITUDE_DELTA = 0.04;

interface SearchMapPinProps {
  marker: SearchMapMarker;
  isActive: boolean;
  onPress: (marker: SearchMapMarker) => void;
}

/**
 * Memoized pin so only the old/new active markers re-render on selection.
 * Pulses `tracksViewChanges` for one frame when this pin's active state or
 * count changes — avoids the custom-marker bitmap swap that makes numbers
 * appear to change when every pin re-snapshots at once.
 */
const SearchMapPin = memo(function SearchMapPin({
  marker,
  isActive,
  onPress,
}: SearchMapPinProps) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const prevActiveRef = useRef(isActive);
  const prevCountRef = useRef(marker.items.length);
  const isFirstPaintRef = useRef(true);

  useEffect(() => {
    if (isFirstPaintRef.current) {
      isFirstPaintRef.current = false;
      const frame = requestAnimationFrame(() => setTracksViewChanges(false));
      return () => cancelAnimationFrame(frame);
    }

    const countChanged = prevCountRef.current !== marker.items.length;
    const activeChanged = prevActiveRef.current !== isActive;
    prevCountRef.current = marker.items.length;
    prevActiveRef.current = isActive;

    if (!countChanged && !activeChanged) return;

    setTracksViewChanges(true);
    const frame = requestAnimationFrame(() => setTracksViewChanges(false));
    return () => cancelAnimationFrame(frame);
  }, [isActive, marker.items.length]);

  return (
    <Marker
      coordinate={{
        latitude: marker.latitude,
        longitude: marker.longitude,
      }}
      tracksViewChanges={tracksViewChanges}
      onPress={() => onPress(marker)}
    >
      <MapPinMarker
        number={marker.items.length}
        isActive={isActive}
        variant={marker.kind === "business" ? "place" : "default"}
      />
    </Marker>
  );
});

export function SearchMap({
  mode,
  lists = [],
  businesses = [],
  picks,
  people,
  heightRatio = 0.3,
  mapWidth,
  mapHeight: measuredMapHeight,
  areaLabel,
  bottomOverlayHeight = 0,
  onUserInteraction,
}: SearchMapProps) {
  const { t } = useTranslation();
  const { height: windowHeight } = useWindowDimensions();
  const mapRef = useRef<MapView>(null);
  /** Skip `onRegionChangeStart` fired by our own animate/fit calls. */
  const skipRegionStartRef = useRef(0);
  /** After a user pan/pinch, ignore mapHeight-only re-fits that would steal the camera. */
  const suppressFitAfterGestureRef = useRef(false);
  const lastFitContentKeyRef = useRef<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<SearchMapMarker | null>(
    null,
  );

  const fallbackCenter = useEffectiveSearchLocation();
  const fillParent = heightRatio >= 1;
  const hasHostWidth = mapWidth != null && mapWidth > 0;

  // Camera math uses settled visible height when filling; otherwise ratio-based height.
  const mapHeight =
    fillParent && measuredMapHeight != null && measuredMapHeight > 0
      ? measuredMapHeight
      : Math.max(windowHeight * (fillParent ? 0.5 : heightRatio), 160);

  const markers = useMemo((): SearchMapMarker[] => {
    if (mode === "places") {
      return buildBusinessMapMarkers(businesses);
    }
    if (mode === "people") {
      return buildPeopleMapMarkers(people ?? []);
    }
    if (picks !== undefined) {
      return buildPickMapMarkers(picks);
    }
    if (people !== undefined) {
      return buildPeopleMapMarkers(people);
    }
    return buildListMapMarkers(lists);
  }, [mode, lists, businesses, picks, people]);

  const region = useMemo(
    () => getSearchMapRegion(markers, fallbackCenter),
    [markers, fallbackCenter],
  );
  const markerCoordinates = useMemo(
    () =>
      markers.map((marker) => ({
        latitude: marker.latitude,
        longitude: marker.longitude,
      })),
    [markers],
  );
  const bottomPadding = useMemo(
    () =>
      Math.min(
        Math.max(bottomOverlayHeight + MAP_EDGE_PADDING, MAP_EDGE_PADDING),
        Math.max(mapHeight - MAP_EDGE_PADDING, MAP_EDGE_PADDING),
      ),
    [bottomOverlayHeight, mapHeight],
  );
  const fitContentKey = useMemo(
    () =>
      JSON.stringify({
        areaLabel: areaLabel ?? null,
        fallbackCenter,
        markerCoordinates,
        region,
      }),
    [areaLabel, fallbackCenter, markerCoordinates, region],
  );

  const notifyUserInteraction = useCallback(() => {
    suppressFitAfterGestureRef.current = true;
    onUserInteraction?.();
  }, [onUserInteraction]);

  const handleRegionChangeStart = useCallback(
    (event: NativeSyntheticEvent<{ isGesture?: boolean }>) => {
      if (skipRegionStartRef.current > 0) {
        skipRegionStartRef.current -= 1;
        return;
      }
      // Only Google Maps reports isGesture. Apple Maps omits it on layout
      // resize (sheet drag) — do not treat that as a user pan.
      if (event.nativeEvent.isGesture !== true) return;
      notifyUserInteraction();
    },
    [notifyUserInteraction],
  );

  const handlePanDrag = useCallback(() => {
    notifyUserInteraction();
  }, [notifyUserInteraction]);

  // Settled collapse/expand changes mapHeight and can emit region-start noise.
  useEffect(() => {
    skipRegionStartRef.current += 1;
  }, [mapHeight]);

  const handlePinPress = useCallback((marker: SearchMapMarker) => {
    setActiveId(marker.id);
    setSelectedMarker(marker);
  }, []);

  const handleSheetClose = useCallback(() => {
    setSelectedMarker(null);
    setActiveId(null);
  }, []);

  useEffect(() => {
    const contentChanged = lastFitContentKeyRef.current !== fitContentKey;
    if (!contentChanged && suppressFitAfterGestureRef.current) {
      return;
    }
    if (contentChanged) {
      suppressFitAfterGestureRef.current = false;
      lastFitContentKeyRef.current = fitContentKey;
    }

    const beginProgrammaticCamera = () => {
      skipRegionStartRef.current += 1;
    };

    if (markers.length === 0) {
      if (!fallbackCenter) return;
      beginProgrammaticCamera();
      mapRef.current?.animateToRegion(region as Region, 350);
      return;
    }

    if (markers.length === 1) {
      const marker = markers[0];
      const visibleCenterYOffset = Math.max(
        (bottomPadding - MAP_EDGE_PADDING) / 2,
        0,
      );
      const latitudeOffsetRatio = visibleCenterYOffset / mapHeight;
      const latitudeOffset = SINGLE_MARKER_LATITUDE_DELTA * latitudeOffsetRatio;

      beginProgrammaticCamera();
      mapRef.current?.animateToRegion(
        {
          latitude: marker.latitude - latitudeOffset,
          longitude: marker.longitude,
          latitudeDelta: SINGLE_MARKER_LATITUDE_DELTA,
          longitudeDelta: SINGLE_MARKER_LONGITUDE_DELTA,
        },
        350,
      );
      return;
    }

    if (areaLabel && fallbackCenter) {
      beginProgrammaticCamera();
      mapRef.current?.animateToRegion(region as Region, 350);
      return;
    }

    beginProgrammaticCamera();
    mapRef.current?.fitToCoordinates(markerCoordinates, {
      animated: true,
      edgePadding: {
        top: MAP_EDGE_PADDING,
        right: MAP_EDGE_PADDING,
        bottom: bottomPadding,
        left: MAP_EDGE_PADDING,
      },
    });
  }, [
    areaLabel,
    bottomPadding,
    fallbackCenter,
    fitContentKey,
    mapHeight,
    markerCoordinates,
    markers,
    region,
  ]);

  // Keep the sheet in sync if search results refresh while open.
  useEffect(() => {
    if (!activeId) return;
    const next = markers.find((marker) => marker.id === activeId);
    if (!next) {
      setSelectedMarker(null);
      setActiveId(null);
      return;
    }
    setSelectedMarker(next);
  }, [markers, activeId]);

  // Legal-label clip is Apple Maps only. Extra MapView height + overflow:hidden
  // blanks Google Maps TextureView on Android even when the host has pixels.
  const clipLegalLabel = Platform.OS === "ios";

  const singleList =
    selectedMarker?.kind === "list" && selectedMarker.items.length === 1
      ? selectedMarker.items[0]
      : null;
  const singlePick =
    selectedMarker?.kind === "pick" && selectedMarker.items.length === 1
      ? selectedMarker.items[0]
      : null;
  const showPinSheet =
    selectedMarker != null && singleList == null && singlePick == null;

  const pinOverlays = (
    <>
      <SearchMapPinSheet
        visible={showPinSheet}
        onClose={handleSheetClose}
        marker={selectedMarker}
      />
      <ListDetailModal
        visible={singleList != null}
        onClose={handleSheetClose}
        listId={singleList?.id ?? null}
        initialList={singleList}
        viewOrigin="search"
      />
      {singlePick ? (
        <PickDetailModal
          visible
          onClose={handleSheetClose}
          data={singlePick}
          viewOrigin="search"
        />
      ) : null}
    </>
  );

  const markerNodes = markers.map((marker) => (
    <SearchMapPin
      key={marker.id}
      marker={marker}
      isActive={marker.id === activeId}
      onPress={handlePinPress}
    />
  ));

  const emptyOverlay =
    markers.length === 0 ? (
      <View className="absolute bottom-3 left-3 right-3 rounded-xl bg-white/90 px-3 py-2 dark:bg-gray-900/90">
        <Text className="text-center font-geist text-[11px] text-gray-500 dark:text-gray-400">
          {t("search.map.noPins")}
        </Text>
      </View>
    ) : null;

  if (fillParent && !hasHostWidth) {
    return null;
  }

  if (fillParent) {
    const hostStyle = [
      styles.hostFillParent,
      clipLegalLabel ? styles.hostClip : styles.hostFill,
      { width: mapWidth },
    ];
    const mapViewStyle = clipLegalLabel
      ? [styles.mapFillParent, { width: mapWidth, marginBottom: -LEGAL_LABEL_CLIP }]
      : [styles.mapFillParent, { width: mapWidth }];

    return (
      <>
        <View collapsable={false} style={hostStyle}>
          <MapView
            key="search-map-fill"
            ref={mapRef}
            provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
            googleRenderer={Platform.OS === "android" ? "LEGACY" : undefined}
            style={mapViewStyle}
            initialRegion={region as Region}
            showsUserLocation={false}
            showsMyLocationButton={false}
            onRegionChangeStart={handleRegionChangeStart}
            onPanDrag={handlePanDrag}
          >
            {markerNodes}
          </MapView>
          {emptyOverlay}
        </View>
        {pinOverlays}
      </>
    );
  }

  const mapViewHeight = mapHeight + (clipLegalLabel ? LEGAL_LABEL_CLIP : 0);
  const hostStyle = [
    clipLegalLabel ? styles.hostClip : styles.hostFill,
    { height: mapHeight },
  ];
  const mapViewStyle = { width: "100%" as const, height: mapViewHeight };

  return (
    <>
      <View collapsable={false} style={hostStyle}>
        <MapView
          key="search-map"
          ref={mapRef}
          provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
          googleRenderer={Platform.OS === "android" ? "LEGACY" : undefined}
          style={mapViewStyle}
          initialRegion={region as Region}
          showsUserLocation={false}
          showsMyLocationButton={false}
          onRegionChangeStart={handleRegionChangeStart}
          onPanDrag={handlePanDrag}
        >
          {markerNodes}
        </MapView>
        {emptyOverlay}
      </View>
      {pinOverlays}
    </>
  );
}

const styles = StyleSheet.create({
  hostClip: { overflow: "hidden" },
  hostFill: { overflow: "visible" },
  hostFillParent: {
    flex: 1,
    minHeight: 0,
    alignSelf: "stretch",
  },
  mapFillParent: {
    flex: 1,
    minHeight: 0,
  },
});
