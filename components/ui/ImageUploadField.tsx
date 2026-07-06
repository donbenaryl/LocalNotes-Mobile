import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera, ImageIcon, X } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { resolveImageUrl } from "@/utils/httpHelpers";
import type { RNFile } from "@/http/types";

export const DEFAULT_MAX_IMAGE_FILES = 4;

export interface UploadedImageFile {
  uri: string;
  file: RNFile;
}

export interface ExistingImage {
  id: string;
  url: string;
}

interface ImageUploadFieldProps {
  label?: string;
  required?: boolean;
  maxFiles?: number;
  existingImages?: ExistingImage[];
  onRemoveExisting?: (id: string) => void;
  newFiles: UploadedImageFile[];
  onAppendNewFiles: (files: RNFile[]) => void;
  onRemoveNewAt: (index: number) => void;
  modalTitle?: string;
  helperText?: string;
  error?: string;
}

function buildLabel(label: string, required: boolean, optionalSuffix: string): string {
  if (required) return label;
  return `${label} ${optionalSuffix}`;
}

export function ImageUploadField({
  label,
  required = false,
  maxFiles,
  existingImages = [],
  onRemoveExisting,
  newFiles,
  onAppendNewFiles,
  onRemoveNewAt,
  modalTitle,
  helperText,
  error,
}: ImageUploadFieldProps) {
  const { t } = useTranslation();
  const [showPicker, setShowPicker] = useState(false);

  const totalCount = existingImages.length + newFiles.length;
  const canAddMore = maxFiles === undefined || totalCount < maxFiles;

  const displayLabel = useMemo(() => {
    if (!label) return undefined;
    return buildLabel(label, required, t("common.optional"));
  }, [label, required, t]);

  async function pickImage(source: "library" | "camera") {
    setShowPicker(false);
    if (!canAddMore) return;

    // iOS: wait for the modal to fully dismiss before presenting the native picker,
    // otherwise UIKit throws "presentation already in progress" and the picker silently aborts.
    await new Promise<void>((resolve) => setTimeout(resolve, 100));

    const permission =
      source === "library"
        ? await ImagePicker.requestMediaLibraryPermissionsAsync()
        : await ImagePicker.requestCameraPermissionsAsync();

    if (permission.status !== "granted") return;

    const result =
      source === "library"
        ? await ImagePicker.launchImageLibraryAsync({
            mediaTypes: "images",
            quality: 0.8,
          })
        : await ImagePicker.launchCameraAsync({ quality: 0.8 });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const ext = asset.uri.split(".").pop() ?? "jpg";
    onAppendNewFiles([
      {
        uri: asset.uri,
        name: `image.${ext}`,
        type: asset.mimeType ?? `image/${ext}`,
      },
    ]);
  }

  const countHint =
    maxFiles !== undefined
      ? t("imageUpload.count", { current: totalCount, max: maxFiles })
      : undefined;

  return (
    <View className="gap-2">
      {displayLabel ? (
        <Text className="font-geist-medium text-sm text-gray-700 dark:text-gray-300">
          {displayLabel}
        </Text>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="flex-row gap-2 mt-2">
        {existingImages.map((img) => (
          <View key={img.id} className="relative">
            <Image
              source={{ uri: resolveImageUrl(img.url) ?? img.url }}
              className="w-20 h-20 rounded-xl"
            />
            {onRemoveExisting ? (
              <Pressable
                onPress={() => onRemoveExisting(img.id)}
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-ink items-center justify-center cursor-pointer"
              >
                <X size={12} color="#FFF" />
              </Pressable>
            ) : null}
          </View>
        ))}
        {newFiles.map((item, index) => (
          <View key={item.uri} className="relative">
            <Image source={{ uri: item.uri }} className="w-20 h-20 rounded-xl" />
            <Pressable
              onPress={() => onRemoveNewAt(index)}
              className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-ink items-center justify-center cursor-pointer"
            >
              <X size={12} color="#FFF" />
            </Pressable>
          </View>
        ))}
        {canAddMore ? (
          <Pressable
            onPress={() => setShowPicker(true)}
            className="w-20 h-20 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 items-center justify-center cursor-pointer"
          >
            <ImageIcon size={24} color="#9CA3AF" />
          </Pressable>
        ) : null}
      </ScrollView>

      {helperText || countHint ? (
        <Text className="text-xs text-gray-500 dark:text-gray-400">
          {[helperText, countHint].filter(Boolean).join(" · ")}
        </Text>
      ) : null}

      {error ? <Text className="text-error text-xs font-geist">{error}</Text> : null}

      <Modal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        title={modalTitle ?? t("imageUpload.addPhoto")}
      >
        <View className="gap-3 pb-4">
          <Pressable
            onPress={() => void pickImage("library")}
            className="flex-row items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-800 px-4 py-3 cursor-pointer"
          >
            <ImageIcon size={20} color="#FF6B1A" />
            <Text className="font-geist text-sm text-ink dark:text-gray-100">
              {t("imageUpload.chooseFromLibrary")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => void pickImage("camera")}
            className="flex-row items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-800 px-4 py-3 cursor-pointer"
          >
            <Camera size={20} color="#FF6B1A" />
            <Text className="font-geist text-sm text-ink dark:text-gray-100">
              {t("imageUpload.takePhoto")}
            </Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}
