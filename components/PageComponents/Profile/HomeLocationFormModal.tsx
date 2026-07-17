import { useEffect, useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { LocationInput } from "@/components/ui/LocationInput";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { useToastStore } from "@/stores/useToastStore";
import accountService from "@/http/account-api/account.services";
import type { Location as GeoLocation } from "@/http/list-api/types";

interface HomeLocationFormModalProps {
  visible: boolean;
  onClose: () => void;
  initialLocation: GeoLocation | null;
  /** Called with the saved location on success, so the caller can sync its own state without waiting for a refetch. */
  onSaved?: (location: GeoLocation) => void;
}

export function HomeLocationFormModal({
  visible,
  onClose,
  initialLocation,
  onSaved,
}: HomeLocationFormModalProps) {
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.show);

  // Local draft, discarded on Cancel — LocationInput reports every change live,
  // so this is what makes Cancel actually revert an in-progress edit.
  const [pendingLocation, setPendingLocation] = useState<GeoLocation | null>(
    initialLocation,
  );

  useEffect(() => {
    if (visible) setPendingLocation(initialLocation);
  }, [visible, initialLocation]);

  const { mutate: saveLocation, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      if (!pendingLocation) throw new Error("Please select a location.");
      const res = await accountService.updateAccount({
        location: pendingLocation,
      });
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      // showToast({ type: "success", message: "Home address updated." });
      if (pendingLocation) onSaved?.(pendingLocation);
      onClose();
    },
    onError: (err: unknown) => {
      const apiErr = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      showToast({
        type: "error",
        message:
          apiErr.response?.data?.message ??
          (err instanceof Error
            ? err.message
            : "Failed to update home address. Please try again."),
      });
    },
  });

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Set your home address"
      footer={
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <LocalNotesButton
              label="Cancel"
              onPress={onClose}
              variant="light"
              disabled={isSaving}
            />
          </View>
          <View className="flex-1">
            <LocalNotesButton
              label={isSaving ? "Saving…" : "Save"}
              onPress={() => saveLocation()}
              variant="dark"
              disabled={!pendingLocation || isSaving}
              loading={isSaving}
            />
          </View>
        </View>
      }
    >
      {/* Explicit style overrides GestureHandlerRootView's internal flex:1 default, which
          collapses content when nested inside Modal's auto-height bottom sheet. */}
      <GestureHandlerRootView style={{ width: "100%" }}>
        <LocationInput
          inModal
          showAddressFields
          initialLocation={pendingLocation}
          placeholder="Search your home city"
          onLocationSelected={setPendingLocation}
          containerClassName="pb-24"
        />
      </GestureHandlerRootView>
    </Modal>
  );
}
