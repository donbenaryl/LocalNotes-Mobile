import { useEffect, useMemo, useRef, useState } from "react";
import { Text, useWindowDimensions, View } from "react-native";
import MapView, { Marker, type Region } from "react-native-maps";
import { useTranslation } from "react-i18next";
import { MapPinMarker } from "@/components/ui/MapPinMarker";
import type { BusinessItemDAO } from "@/http/business-api/types";
import type { ListItemDAO } from "@/http/list-api/types";
import {
  buildBusinessMapMarkers,
  buildListMapMarkers,
  getSearchMapRegion,
  type SearchMapMarker,
} from "@/utils/searchMapMarkers";

export type SearchMapMode = "lists" | "places";

/** Extra map height clipped by overflow-hidden to cover Apple Maps  Maps label. */
const LEGAL_LABEL_CLIP = 28;

interface SearchMapProps {
  mode: SearchMapMode;
  lists?: ListItemDAO[];
  businesses?: BusinessItemDAO[];
  /** Fraction of screen height for the embedded map (handoff ~30%). */
  heightRatio?: number;
  areaLabel?: string;
  bottomOverlayHeight?: number;
}

const MAP_EDGE_PADDING = 24;
const SINGLE_MARKER_LATITUDE_DELTA = 0.04;
const SINGLE_MARKER_LONGITUDE_DELTA = 0.04;

export function SearchMap({
  mode,
  lists = [],
  businesses = [],
  heightRatio = 0.3,
  areaLabel,
  bottomOverlayHeight = 0,
}: SearchMapProps) {
  const { t } = useTranslation();
  const { height: windowHeight } = useWindowDimensions();
  const mapRef = useRef<MapView>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const markers = useMemo((): SearchMapMarker[] => {
    if (mode === "places") {
      return buildBusinessMapMarkers(businesses);
    }
    return buildListMapMarkers(lists);
  }, [mode, lists, businesses]);

  const region = useMemo(() => getSearchMapRegion(markers), [markers]);
  const mapHeight = Math.max(windowHeight * heightRatio, 160);
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

  useEffect(() => {
    if (markers.length === 0) return;

    if (markers.length === 1) {
      const marker = markers[0];
      const visibleCenterYOffset = Math.max(
        (bottomPadding - MAP_EDGE_PADDING) / 2,
        0,
      );
      const latitudeOffsetRatio = visibleCenterYOffset / mapHeight;
      const latitudeOffset = SINGLE_MARKER_LATITUDE_DELTA * latitudeOffsetRatio;

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

    mapRef.current?.fitToCoordinates(markerCoordinates, {
      animated: true,
      edgePadding: {
        top: MAP_EDGE_PADDING,
        right: MAP_EDGE_PADDING,
        bottom: bottomPadding,
        left: MAP_EDGE_PADDING,
      },
    });
  }, [bottomPadding, markerCoordinates, markers.length]);

  return (
    <View
      className="overflow-hidden border-b border-gray-200 dark:border-gray-700"
      style={{ height: mapHeight }}
    >
      <MapView
        ref={mapRef}
        style={{ flex: 1, marginBottom: -LEGAL_LABEL_CLIP }}
        initialRegion={region as Region}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {markers.map((marker, index) => (
          <Marker
            key={marker.id}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            onPress={() => setActiveId(marker.id)}
          >
            <MapPinMarker
              number={index + 1}
              isActive={marker.id === activeId}
              variant={marker.kind === "business" ? "place" : "default"}
            />
          </Marker>
        ))}
      </MapView>

      {markers.length === 0 ? (
        <View className="absolute bottom-3 left-3 right-3 rounded-xl bg-white/90 px-3 py-2 dark:bg-gray-900/90">
          <Text className="text-center font-geist text-[11px] text-gray-500 dark:text-gray-400">
            {t("search.map.noPins")}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
