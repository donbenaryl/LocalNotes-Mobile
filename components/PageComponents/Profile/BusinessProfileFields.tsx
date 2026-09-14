import { useState, type ReactNode } from "react";
import { Keyboard, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "nativewind";
import { ChevronDown, MapPin, Plus, X } from "lucide-react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { TextInput } from "@/components/ui/TextInput";
import { InputHint } from "@/components/ui/InputHint";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { Modal } from "@/components/ui/Modal";
import {
  ImageUploadField,
  type UploadedImageFile,
} from "@/components/ui/ImageUploadField";
import { cn } from "@/utils/cn";
import type { BusinessLocation } from "@/http/business-api/types";
import {
  WEEKDAY_KEYS,
  dateFromHhmm,
  formatTimeLabel,
  hhmmFromDate,
  type OpeningHours,
  type WeekdayKey,
} from "@/utils/openingHours";

export type BusinessBranchListItem = {
  id: string;
  name: string;
  location: BusinessLocation;
  openingHours: OpeningHours;
};

export type BusinessProfileFormValues = {
  businessName: string;
  businessType: string;
  businessBio: string;
  contactEmail: string;
  phoneNumber: string;
  businessWebsite: string;
  logoUrl: string | null;
  logoFiles: UploadedImageFile[];
  logoDeleted: boolean;
  branches: BusinessBranchListItem[];
};

interface BusinessProfileFieldsProps {
  values: BusinessProfileFormValues;
  onChange: (next: BusinessProfileFormValues) => void;
  editable?: boolean;
  showSectionLabel?: boolean;
  onPressBusinessType: () => void;
  onAddBranch: () => void;
  onRemoveBranch: (branchId: string) => void;
  onEditBranchHours: (branchId: string) => void;
  addBranchIconColor?: string;
  /** Optional content rendered above the business fields (e.g. contact name). */
  header?: ReactNode;
  contactEmailHint?: string;
}

function formatBranchAddress(location: BusinessLocation): string {
  return [
    location.street_address,
    location.postal_code,
    location.city,
    location.region,
    location.country,
  ]
    .filter(Boolean)
    .join(", ");
}

function TimeChip({
  label,
  value,
  placeholder,
  disabled,
  onPick,
}: {
  label: string;
  value: string | null;
  placeholder: string;
  disabled?: boolean;
  onPick: () => void;
}) {
  return (
    <Pressable
      onPress={onPick}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="min-w-[88px] flex-1 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
    >
      <Text className="font-geist text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">
        {label}
      </Text>
      <Text
        className={cn(
          "mt-0.5 font-geist text-sm",
          value ? "text-ink dark:text-gray-100" : "text-gray-400 dark:text-gray-500",
        )}
      >
        {value ? formatTimeLabel(value) : placeholder}
      </Text>
    </Pressable>
  );
}

export function OpeningHoursEditor({
  hours,
  editable,
  onChange,
}: {
  hours: OpeningHours;
  editable: boolean;
  onChange: (next: OpeningHours) => void;
}) {
  const { t } = useTranslation();
  const [picking, setPicking] = useState<{
    day: WeekdayKey;
    field: "open" | "close";
  } | null>(null);
  const [draftTime, setDraftTime] = useState(() => dateFromHhmm(null));

  function setDayField(day: WeekdayKey, field: "open" | "close", value: string | null) {
    const current = hours[day] ?? { open: null, close: null };
    onChange({
      ...hours,
      [day]: { ...current, [field]: value },
    });
  }

  function clearDay(day: WeekdayKey) {
    onChange({
      ...hours,
      [day]: { open: null, close: null },
    });
  }

  function openPicker(day: WeekdayKey, field: "open" | "close") {
    const current = hours[day]?.[field] ?? null;
    setDraftTime(dateFromHhmm(current));
    setPicking({ day, field });
  }

  function handlePickerChange(event: DateTimePickerEvent, date?: Date) {
    if (event.type === "dismissed" || !date) return;
    setDraftTime(date);
  }

  function commitDraft() {
    if (!picking) return;
    setDayField(picking.day, picking.field, hhmmFromDate(draftTime));
    setPicking(null);
  }

  const pickingTitle =
    picking != null
      ? `${t(`editProfile.business.weekdays.${picking.day}`)} · ${
          picking.field === "open"
            ? t("editProfile.business.hoursOpen")
            : t("editProfile.business.hoursClose")
        }`
      : undefined;

  return (
    <View className="gap-3 pb-4">
      {WEEKDAY_KEYS.map((day) => {
        const entry = hours[day] ?? { open: null, close: null };
        return (
          <View key={day} className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="font-geist-medium text-sm text-ink dark:text-gray-100">
                {t(`editProfile.business.weekdays.${day}`)}
              </Text>
              {entry.open || entry.close ? (
                <Pressable
                  onPress={() => clearDay(day)}
                  disabled={!editable}
                  accessibilityRole="button"
                  hitSlop={8}
                >
                  <Text className="font-geist text-xs text-brand">
                    {t("editProfile.business.hoursClear")}
                  </Text>
                </Pressable>
              ) : null}
            </View>
            <View className="flex-row gap-2">
              <TimeChip
                label={t("editProfile.business.hoursOpen")}
                value={entry.open}
                placeholder={t("editProfile.business.hoursUnset")}
                disabled={!editable}
                onPick={() => openPicker(day, "open")}
              />
              <TimeChip
                label={t("editProfile.business.hoursClose")}
                value={entry.close}
                placeholder={t("editProfile.business.hoursUnset")}
                disabled={!editable}
                onPick={() => openPicker(day, "close")}
              />
            </View>
          </View>
        );
      })}

      <Modal
        visible={picking != null}
        onClose={() => setPicking(null)}
        title={pickingTitle}
        position="bottom"
        footer={
          <LocalNotesButton
            label={t("common.done")}
            onPress={commitDraft}
            variant="dark"
          />
        }
      >
        <View className="items-center pb-4">
          <DateTimePicker
            value={draftTime}
            mode="time"
            display="spinner"
            onChange={handlePickerChange}
          />
        </View>
      </Modal>
    </View>
  );
}

export function BusinessProfileFields({
  values,
  onChange,
  editable = true,
  showSectionLabel = true,
  onPressBusinessType,
  onAddBranch,
  onRemoveBranch,
  onEditBranchHours,
  addBranchIconColor = "#6B7280",
  header,
  contactEmailHint,
}: BusinessProfileFieldsProps) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const placeholderColor = colorScheme === "dark" ? "#9CA3AF" : "#6B7280";

  function patch<K extends keyof BusinessProfileFormValues>(
    key: K,
    value: BusinessProfileFormValues[K],
  ) {
    onChange({ ...values, [key]: value });
  }

  const existingLogoImages =
    values.logoUrl && !values.logoDeleted
      ? [{ id: "logo", url: values.logoUrl }]
      : [];

  return (
    <>
      {showSectionLabel ? (
        <Text className="px-6 pt-6 pb-2 font-geist-medium text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          {t("editProfile.business.section")}
        </Text>
      ) : null}

      {header}

      <View className="px-6 gap-4 bg-white dark:bg-gray-900 py-4">
        <TextInput
          label={t("editProfile.business.name")}
          value={values.businessName}
          onChangeText={(value) => patch("businessName", value)}
          placeholder={t("editProfile.business.namePlaceholder")}
          placeholderTextColor={placeholderColor}
          editable={editable}
        />

        <View>
          <Text className="mb-1.5 font-geist-medium text-sm text-gray-700 dark:text-gray-300">
            {t("editProfile.business.type")}
          </Text>
          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              onPressBusinessType();
            }}
            disabled={!editable}
            accessibilityRole="button"
            className="h-14 flex-row items-center rounded-xl border border-gray-100 bg-gray-50 px-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <Text
              className={cn(
                "flex-1 font-geist text-base",
                values.businessType
                  ? "text-ink dark:text-gray-100"
                  : "text-gray-400 dark:text-gray-500",
              )}
            >
              {values.businessType || t("editProfile.business.typePlaceholder")}
            </Text>
            <ChevronDown size={18} color="#9CA3AF" />
          </Pressable>
        </View>

        <TextInput
          label={t("editProfile.business.bio")}
          value={values.businessBio}
          onChangeText={(value) => patch("businessBio", value)}
          placeholder={t("editProfile.business.bioPlaceholder")}
          placeholderTextColor={placeholderColor}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          editable={editable}
        />

        <TextInput
          label={t("editProfile.business.contactEmail")}
          value={values.contactEmail}
          onChangeText={(value) => patch("contactEmail", value)}
          placeholder={t("editProfile.business.contactEmailPlaceholder")}
          placeholderTextColor={placeholderColor}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={editable}
        />
        {contactEmailHint ? <InputHint hint={contactEmailHint} /> : null}

        <TextInput
          label={t("editProfile.business.phone")}
          value={values.phoneNumber}
          onChangeText={(value) => patch("phoneNumber", value)}
          placeholder={t("editProfile.business.phonePlaceholder")}
          placeholderTextColor={placeholderColor}
          keyboardType="phone-pad"
          editable={editable}
        />

        <TextInput
          label={t("editProfile.business.website")}
          value={values.businessWebsite}
          onChangeText={(value) => patch("businessWebsite", value)}
          placeholder={t("editProfile.business.websitePlaceholder")}
          placeholderTextColor={placeholderColor}
          keyboardType="url"
          autoCapitalize="none"
          editable={editable}
        />

        <ImageUploadField
          label={t("editProfile.business.logo")}
          helperText={t("editProfile.business.logoHelper")}
          maxFiles={1}
          existingImages={existingLogoImages}
          onRemoveExisting={() => {
            onChange({
              ...values,
              logoDeleted: true,
              logoUrl: null,
            });
          }}
          newFiles={values.logoFiles}
          onAppendNewFiles={(files) => {
            onChange({
              ...values,
              logoDeleted: false,
              logoFiles: files.map((file) => ({
                uri: file.uri,
                file,
              })),
            });
          }}
          onRemoveNewAt={() => patch("logoFiles", [])}
        />
      </View>

      <View className="px-6 pt-6 pb-2 flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="font-geist-medium text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {t("editProfile.business.branchesSection")}
          </Text>
          <Text className="mt-1 font-geist text-xs text-gray-400 dark:text-gray-500">
            {t("editProfile.business.branchesHelper")}
          </Text>
        </View>
        <LocalNotesButton
          label={t("editProfile.business.addBranch")}
          onPress={onAddBranch}
          variant="light"
          size="sm"
          isWidthFull={false}
          leftIcon={<Plus size={14} color={addBranchIconColor} />}
          disabled={!editable}
        />
      </View>
      <View className="px-6 pb-4 gap-3">
        {values.branches.length === 0 ? (
          <Text className="py-4 text-center font-geist text-sm text-gray-400 dark:text-gray-500">
            {t("editProfile.business.noBranches")}
          </Text>
        ) : (
          values.branches.map((branch) => (
            <View
              key={branch.id}
              className="rounded-xl border border-gray-100 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900"
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1 flex-row items-start gap-3 pr-3">
                  <MapPin size={18} color="#6B7280" />
                  <View className="flex-1">
                    <Text className="font-geist-medium text-sm text-ink dark:text-gray-100">
                      {branch.name}
                    </Text>
                    <Text className="mt-0.5 font-geist text-xs text-gray-500 dark:text-gray-400">
                      {formatBranchAddress(branch.location)}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => onRemoveBranch(branch.id)}
                  accessibilityRole="button"
                  accessibilityLabel={t("editProfile.business.removeBranch")}
                  hitSlop={8}
                  className="p-1"
                  disabled={!editable}
                >
                  <X size={16} color="#9CA3AF" />
                </Pressable>
              </View>
              <Pressable
                onPress={() => onEditBranchHours(branch.id)}
                disabled={!editable}
                accessibilityRole="button"
                className="mt-3 self-start"
              >
                <Text className="font-geist-semibold text-xs text-brand">
                  {t("editProfile.business.editBranchHours")}
                </Text>
              </Pressable>
            </View>
          ))
        )}
      </View>
    </>
  );
}
