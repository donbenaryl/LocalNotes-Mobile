import { useEffect, useMemo, useRef, useState } from "react";
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import MapView, { Marker, type Region } from "react-native-maps";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  CardOptionsMenu,
  type CardOptionsMenuItem,
} from "@/components/ui/CardOptionsMenu";
import { AppleLogoIcon } from "@/components/ui/icons/AppleLogoIcon";
import { GoogleLogoIcon } from "@/components/ui/icons/GoogleLogoIcon";
import { WazeLogoIcon } from "@/components/ui/icons/WazeLogoIcon";
import { toast } from "@/components/ui/Toast";
import { MapPinMarker } from "@/components/ui/MapPinMarker";
import { buildMapPicks, getMapRegion } from "@/utils/listPickLocation";
import type { ListItemDAO } from "@/http/list-api/types";

interface ListDetailsMapProps {
  visible: boolean;
  list: ListItemDAO;
  initialIndex: number;
  onClose: () => void;
}

export function ListDetailsMap({
  visible,
  list,
  initialIndex,
  onClose,
}: ListDetailsMapProps) {
  const { t } = useTranslation();
  const { height: windowHeight } = useWindowDimensions();
  const mapRef = useRef<MapView>(null);
  const mapPicks = useMemo(() => buildMapPicks(list), [list]);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const initialRegion = useMemo(() => getMapRegion(mapPicks), [mapPicks]);
  const sheetMaxHeight = windowHeight * 0.42;
  const activePick = mapPicks[activeIndex];

  useEffect(() => {
    if (!visible) return;
    const safeIndex = Math.min(
      Math.max(initialIndex, 0),
      Math.max(mapPicks.length - 1, 0),
    );
    setActiveIndex(safeIndex);
  }, [visible, initialIndex, mapPicks.length]);

  useEffect(() => {
    if (!visible || mapPicks.length === 0) return;
    const pick = mapPicks[activeIndex];
    if (!pick) return;

    mapRef.current?.animateToRegion(
      {
        latitude: pick.latitude,
        longitude: pick.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      300,
    );
  }, [activeIndex, mapPicks, visible]);

  const handleSelectPick = (index: number) => {
    setActiveIndex(index);
  };

  const handleOpenMapProvider = async (
    providerName: string,
    appUrl: string,
    fallbackUrl?: string,
  ) => {
    try {
      const supportedUrl = (await Linking.canOpenURL(appUrl))
        ? appUrl
        : fallbackUrl;

      if (!supportedUrl) {
        toast.error(t("listDetail.mapAppUnavailable", { appName: providerName }), {
          title: t("alerts.error"),
        });
        return;
      }

      await Linking.openURL(supportedUrl);
    } catch (error) {
      console.error(`Failed to open ${providerName}:`, error);
      toast.error(t("listDetail.mapOpenFailed", { appName: providerName }), {
        title: t("alerts.error"),
      });
    }
  };

  const mapMenuItems = useMemo<CardOptionsMenuItem[]>(() => {
    if (!activePick) return [];

    const { latitude, longitude, name } = activePick;
    const encodedName = encodeURIComponent(name);
    const googleMapsUrl = `comgooglemaps://?q=${encodedName}&center=${latitude},${longitude}&zoom=14`;
    const googleMapsFallbackUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    const appleMapsUrl = `http://maps.apple.com/?ll=${latitude},${longitude}&q=${encodedName}`;
    const wazeUrl = `waze://?ll=${latitude},${longitude}&navigate=yes`;
    const wazeFallbackUrl = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;

    const items: CardOptionsMenuItem[] = [
      {
        kind: "action",
        key: "google-maps",
        label: t("listDetail.navigateWithGoogleMaps"),
        renderIcon: () => <GoogleLogoIcon />,
        onPress: () =>
          handleOpenMapProvider(
            "Google Maps",
            googleMapsUrl,
            googleMapsFallbackUrl,
          ),
      },
      {
        kind: "action",
        key: "waze",
        label: t("listDetail.navigateWithWaze"),
        renderIcon: () => <WazeLogoIcon />,
        onPress: () =>
          handleOpenMapProvider("Waze", wazeUrl, wazeFallbackUrl),
      },
    ];

    if (Platform.OS === "ios") {
      items.splice(1, 0, {
        kind: "action",
        key: "apple-maps",
        label: t("listDetail.navigateWithAppleMaps"),
        renderIcon: () => <AppleLogoIcon />,
        onPress: () => handleOpenMapProvider("Apple Maps", appleMapsUrl),
      });
    }

    return items;
  }, [activePick, t]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-page dark:bg-gray-900">
        <View className="absolute left-0 right-0 top-0 z-10">
          <PageHeader
            borderless
            onBack={onClose}
            rightChild={<CardOptionsMenu items={mapMenuItems} />}
          />
        </View>

        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={initialRegion as Region}
          showsUserLocation={false}
          showsMyLocationButton={false}
        >
          {mapPicks.map((pick, index) => (
            <Marker
              key={pick.item.id}
              coordinate={{
                latitude: pick.latitude,
                longitude: pick.longitude,
              }}
              onPress={() => handleSelectPick(index)}
            >
              <MapPinMarker number={index + 1} isActive={index === activeIndex} />
            </Marker>
          ))}
        </MapView>

        <View
          className="absolute bottom-0 left-0 right-0 rounded-t-[18px] bg-page shadow-lg dark:bg-gray-900"
          style={{ maxHeight: sheetMaxHeight }}
        >
          <View className="my-2 h-1 w-9 self-center rounded-full bg-gray-300 dark:bg-gray-600" />
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {mapPicks.length === 0 ? (
              <View className="px-4 py-6">
                <Text className="text-center font-geist text-sm text-gray-500 dark:text-gray-400">
                  {t("home.unknownLocation")}
                </Text>
              </View>
            ) : (
              mapPicks.map((pick, index) => {
                const isActive = index === activeIndex;
                return (
                  <Pressable
                    key={pick.item.id}
                    onPress={() => handleSelectPick(index)}
                    className={`flex-row items-start gap-3 border-b border-soft px-4 py-3 dark:border-gray-800 ${
                      isActive ? "bg-brand-tint/50" : ""
                    }`}
                  >
                    <View
                      className={`mt-0.5 h-6 w-6 items-center justify-center rounded-full ${
                        isActive ? "bg-brand" : "bg-ink"
                      }`}
                    >
                      <Text className="font-geist-bold text-[11px] text-white">
                        {index + 1}
                      </Text>
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text
                        className="font-geist-bold text-[13.5px] text-ink dark:text-gray-100"
                        numberOfLines={1}
                      >
                        {pick.name}
                      </Text>
                      <Text
                        className="mt-0.5 font-geist text-[11.5px] text-gray-500 dark:text-gray-400"
                        numberOfLines={1}
                      >
                        {[pick.address, pick.categoryLabel]
                          .filter(Boolean)
                          .join(" · ")}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
