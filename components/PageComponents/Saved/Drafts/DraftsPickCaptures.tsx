import { Image, Pressable, Text, View } from "react-native";
import { MapPin } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/ui/Toast";
import { WhiteBox } from "@/components/ui/WhiteBox";

interface StaticCapture {
  id: string;
  name: string;
  meta: string;
  quote: string;
  thumbnail?: string;
  isFuzzy?: boolean;
}

const CAPTURES: StaticCapture[] = [
  {
    id: "capture-1",
    name: "Café Morningside",
    meta: "Brooklyn, NY · 9:38 AM",
    quote: '"Soft lighting, the kind of place I\'d come back to..."',
    thumbnail: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=160&q=80",
  },
  {
    id: "capture-2",
    name: "a place near Bedford Ave",
    meta: "40.7° N · GPS pin · 8:12 AM",
    quote: "No name yet · tap to identify",
    isFuzzy: true,
  },
];

export function DraftsPickCaptures() {
  const { t } = useTranslation();

  const handlePress = () => {
    toast.info(t("alerts.comingSoonMessage"), { title: t("alerts.comingSoon") });
  };

  return (
    <View className="mb-4 gap-3">
      {CAPTURES.map((capture) => (
        <Pressable key={capture.id} onPress={handlePress} className="cursor-pointer">
          <WhiteBox className="flex-row items-start gap-3 p-3">
            {capture.thumbnail ? (
              <Image source={{ uri: capture.thumbnail }} className="h-14 w-14 rounded-xl" />
            ) : (
              <View className="h-14 w-14 items-center justify-center rounded-xl bg-soft dark:bg-gray-800">
                <MapPin size={20} color="#9CA3AF" />
              </View>
            )}

            <View className="min-w-0 flex-1">
              <Text
                className={`font-geist-semibold text-sm ${
                  capture.isFuzzy
                    ? "italic text-gray-400 dark:text-gray-500"
                    : "text-ink dark:text-gray-100"
                }`}
                numberOfLines={1}
              >
                {capture.name}
              </Text>
              <Text
                className="mt-0.5 text-xs text-gray-400 dark:text-gray-500"
                numberOfLines={1}
              >
                {capture.meta}
              </Text>
              <Text
                className={`mt-1 font-geist text-xs italic leading-4 ${
                  capture.isFuzzy
                    ? "text-gray-400 dark:text-gray-500"
                    : "text-gray-500 dark:text-gray-400"
                }`}
                numberOfLines={2}
              >
                {capture.quote}
              </Text>
            </View>
          </WhiteBox>
        </Pressable>
      ))}
    </View>
  );
}
