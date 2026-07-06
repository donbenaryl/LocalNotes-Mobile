import { useState } from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useQueryClient } from "@tanstack/react-query";
import { Camera } from "lucide-react-native";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { useToastStore } from "@/stores/useToastStore";
import accountService from "@/http/account-api/account.services";

interface UploadAvatarProps {
  name: string;
  src?: string;
  gradientColors?: string[];
}

export function UploadAvatar({ name, src, gradientColors }: UploadAvatarProps) {
  const [uploading, setUploading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.show);

  const pickAndUpload = async (mode: "library" | "camera") => {
    setShowPicker(false);

    if (mode === "library") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showToast({ type: "error", message: "Photo library access is required." });
        return;
      }
    } else {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        showToast({ type: "error", message: "Camera access is required." });
        return;
      }
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    };

    const result =
      mode === "library"
        ? await ImagePicker.launchImageLibraryAsync(options)
        : await ImagePicker.launchCameraAsync(options);

    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset) return;

    const formData = new FormData();
    formData.append("profile_image", {
      uri: asset.uri,
      type: asset.mimeType ?? "image/jpeg",
      name: "profile.jpg",
    } as unknown as Blob);

    setUploading(true);
    try {
      await accountService.updateAccountImage(formData);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      showToast({ type: "success", message: "Photo updated successfully." });
    } catch {
      showToast({
        type: "error",
        message: "Failed to update photo. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        disabled={uploading}
        className="cursor-pointer"
        accessibilityLabel="Change profile photo"
      >
        <View>
          <Avatar name={name} src={src} size="xl" gradientColors={gradientColors} />
          <View className="absolute inset-0 rounded-full bg-black/50 items-center justify-center">
            {uploading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Camera size={24} color="#ffffff" />
            )}
          </View>
        </View>
      </TouchableOpacity>

      <Modal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        title="Change photo"
      >
        <View className="gap-3 pb-2">
          <LocalNotesButton
            label="Choose from Library"
            onPress={() => pickAndUpload("library")}
            variant="light"
          />
          <LocalNotesButton
            label="Take a Photo"
            onPress={() => pickAndUpload("camera")}
            variant="dark"
          />
        </View>
      </Modal>
    </>
  );
}
