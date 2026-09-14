import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { TextInput } from "@/components/ui/TextInput";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { LocationInput } from "@/components/ui/LocationInput";
import { formatLocationLabel } from "@/components/ui/LocationInputModal";
import { KeyboardAwareScrollView } from "@/components/ui/KeyboardAwareScrollView";
import { OpeningHoursEditor } from "@/components/PageComponents/Profile/BusinessProfileFields";
import type { Location as GeoLocation } from "@/http/list-api/types";
import type { BusinessLocation } from "@/http/business-api/types";
import {
  emptyOpeningHours,
  openingHoursForApi,
  validateOpeningHours,
  type OpeningHours,
} from "@/utils/openingHours";
import { toast } from "@/components/ui/Toast";

/** Clears absolute footer (Cancel / Add branch) when scrolling to the last hours row. */
const FOOTER_CONTENT_PAD = 88;
const SHEET_HEIGHT_RATIO = 0.92;

interface AddBranchModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (
    name: string,
    location: BusinessLocation,
    openingHours: OpeningHours,
  ) => Promise<void>;
  loading?: boolean;
}

function toBusinessLocation(location: GeoLocation): BusinessLocation {
  return {
    street_address:
      location.street_address?.trim() || formatLocationLabel(location),
    postal_code: location.postal_code?.trim() || "",
    city: location.city,
    region: location.region ?? "",
    country: location.country,
    latitude: location.latitude,
    longitude: location.longitude,
  };
}

export function AddBranchModal({
  visible,
  onClose,
  onSave,
  loading = false,
}: AddBranchModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [openingHours, setOpeningHours] = useState<OpeningHours>(emptyOpeningHours());
  const [nameError, setNameError] = useState<string | undefined>();
  const [locationError, setLocationError] = useState<string | undefined>();

  useEffect(() => {
    if (!visible) {
      setName("");
      setLocation(null);
      setOpeningHours(emptyOpeningHours());
      setNameError(undefined);
      setLocationError(undefined);
    }
  }, [visible]);

  const handleSave = async () => {
    let valid = true;
    if (!name.trim()) {
      setNameError(t("editProfile.business.branchNameRequired"));
      valid = false;
    } else {
      setNameError(undefined);
    }
    if (!location) {
      setLocationError(t("editProfile.business.branchLocationRequired"));
      valid = false;
    } else {
      setLocationError(undefined);
    }
    const hoursErrorKey = validateOpeningHours(openingHours);
    if (hoursErrorKey) {
      toast.error(t(`editProfile.business.${hoursErrorKey}`));
      valid = false;
    }
    if (!valid || !location) return;
    await onSave(
      name.trim(),
      toBusinessLocation(location),
      openingHoursForApi(openingHours),
    );
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={t("editProfile.business.addBranch")}
      sheetHeightRatio={SHEET_HEIGHT_RATIO}
      footer={
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <LocalNotesButton
              label={t("common.cancel")}
              onPress={onClose}
              variant="light"
              disabled={loading}
            />
          </View>
          <View className="flex-1">
            <LocalNotesButton
              label={
                loading
                  ? t("editProfile.business.addingBranch")
                  : t("editProfile.business.addBranch")
              }
              onPress={() => void handleSave()}
              variant="dark"
              disabled={loading}
              loading={loading}
            />
          </View>
        </View>
      }
    >
      {/* flex:1 is safe once Modal caps height via sheetHeightRatio; needed so
          LocationInput RNGH taps work and the scroll body fills the sheet. */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardAwareScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: FOOTER_CONTENT_PAD }}
        >
          <View className="gap-4">
            <TextInput
              label={t("editProfile.business.branchName")}
              placeholder={t("editProfile.business.branchNamePlaceholder")}
              value={name}
              onChangeText={(value) => {
                setName(value);
                setNameError(undefined);
              }}
              error={nameError}
              editable={!loading}
            />
            <View>
              <Text className="mb-1.5 font-geist-medium text-sm text-gray-700 dark:text-gray-300">
                {t("editProfile.business.branchAddress")}
              </Text>
              <LocationInput
                inModal
                showAddressFields
                initialLocation={location}
                placeholder={t("editProfile.business.branchAddressPlaceholder")}
                onLocationSelected={(loc) => {
                  setLocation(loc);
                  setLocationError(undefined);
                  if (!name.trim()) {
                    setName(loc.city?.trim() || formatLocationLabel(loc));
                  }
                }}
                containerClassName="pb-0"
              />
              {locationError ? (
                <Text className="mt-1 font-geist text-xs text-error">
                  {locationError}
                </Text>
              ) : null}
            </View>
            <View className="gap-2">
              <Text className="font-geist-medium text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {t("editProfile.business.hoursSection")}
              </Text>
              <Text className="font-geist text-xs text-gray-400 dark:text-gray-500">
                {t("editProfile.business.hoursHelper")}
              </Text>
              <OpeningHoursEditor
                hours={openingHours}
                editable={!loading}
                onChange={setOpeningHours}
              />
            </View>
          </View>
        </KeyboardAwareScrollView>
      </GestureHandlerRootView>
    </Modal>
  );
}
