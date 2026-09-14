import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Text, TouchableOpacity, View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronRight } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { PageHeader } from "@/components/ui/PageHeader";
import { UploadAvatar } from "@/components/ui/UploadAvatar";
import { DateField } from "@/components/ui/DateField";
import { TextInput } from "@/components/ui/TextInput";
import { UsernameField } from "@/components/ui/UsernameField";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { BottomWrapper } from "@/components/ui/BottomWrapper";
import { KeyboardAwareScrollView } from "@/components/ui/KeyboardAwareScrollView";
import { PageLoader } from "@/components/ui/PageLoader";
import { DropDown } from "@/components/ui/DropDown";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { HomeLocationFormModal } from "@/components/PageComponents/Profile/HomeLocationFormModal";
import { AddBranchModal } from "@/components/PageComponents/Profile/AddBranchModal";
import { OwnedBusinessPickerModal } from "@/components/PageComponents/Profile/OwnedBusinessPickerModal";
import {
  BusinessProfileFields,
  type BusinessProfileFormValues,
} from "@/components/PageComponents/Profile/BusinessProfileFields";
import { EditBranchHoursModal } from "@/components/PageComponents/Profile/EditBranchHoursModal";
import { useToastStore } from "@/stores/useToastStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useBusinessStore } from "@/stores/useBusinessStore";
import accountService from "@/http/account-api/account.services";
import businessService from "@/http/business-api/business.service";
import { getPersonalityGradientColors } from "@/utils/personalityRing";
import { isBusinessAccountType } from "@/utils/businessAccount";
import { normalizeOpeningHours } from "@/utils/openingHours";
import type { updateAccountDTO } from "@/http/account-api/types";
import type { Location as GeoLocation } from "@/http/list-api/types";
import type {
  BusinessItemDAO,
  BusinessLocation,
  OpeningHours,
} from "@/http/business-api/types";
import {
  isUsernameBlocking,
  type UsernameAvailabilityStatus,
} from "@/hooks/useUsernameAvailability";

const BIO_MAX_LENGTH = 160;
const EDIT_PROFILE_FOOTER_OFFSET = 120;

const EMPTY_BUSINESS_FORM: BusinessProfileFormValues = {
  businessName: "",
  businessType: "",
  businessBio: "",
  contactEmail: "",
  phoneNumber: "",
  businessWebsite: "",
  logoUrl: null,
  logoFiles: [],
  logoDeleted: false,
  branches: [],
};

function SectionLabel({ label }: { label: string }) {
  return (
    <Text className="px-6 pt-6 pb-2 font-geist-medium text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">
      {label}
    </Text>
  );
}

interface ProfileRowProps {
  title: string;
  subtitle?: string;
  value?: string;
  showAddPlaceholder?: boolean;
  onPress?: () => void;
  isReadOnly?: boolean;
}

function ProfileRow({
  title,
  subtitle,
  value,
  showAddPlaceholder = false,
  onPress,
  isReadOnly = false,
}: ProfileRowProps) {
  const inner = (
    <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
      <View className="flex-1 gap-0.5 pr-3">
        <Text className="font-geist-medium text-sm text-ink dark:text-gray-100">
          {title}
        </Text>
        {subtitle ? (
          <Text className="font-geist text-xs text-gray-400 dark:text-gray-500">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View className="flex-row items-center gap-2">
        {value ? (
          <Text className="font-geist-medium text-xs text-gray-500 dark:text-gray-400">
            {value}
          </Text>
        ) : showAddPlaceholder ? (
          <Text className="font-geist text-xs text-gray-400 dark:text-gray-500">
            Add
          </Text>
        ) : null}
        {!isReadOnly ? <ChevronRight size={16} color="#9CA3AF" /> : null}
      </View>
    </View>
  );

  if (isReadOnly) return inner;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="cursor-pointer"
    >
      {inner}
    </TouchableOpacity>
  );
}

export default function EditProfile() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.show);
  const refreshBusinessInfo = useBusinessStore((s) => s.refreshBusinessInfo);
  const storeBusinessId = useBusinessStore((s) => s.businessId);
  const ownedBusinesses = useBusinessStore((s) => s.ownedBusinesses);
  const loadOwnedBusinesses = useBusinessStore((s) => s.loadOwnedBusinesses);
  const selectBusiness = useBusinessStore((s) => s.selectBusiness);
  const isFetchingOwned = useBusinessStore((s) => s.isFetchingOwned);
  const ownedError = useBusinessStore((s) => s.ownedError);
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const addBranchIconColor = colorScheme === "dark" ? "#F3F4F6" : "#191B1C";
  const authAccountType = useAuthStore((s) => s.accountType);

  const {
    data: profile,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await accountService.fetchUser();
      return res.data?.data ?? null;
    },
  });

  const accountType = profile?.account_type ?? authAccountType ?? undefined;
  const isBusiness = isBusinessAccountType(accountType);

  useEffect(() => {
    if (!isBusiness) return;
    void loadOwnedBusinesses();
  }, [isBusiness, loadOwnedBusinesses]);

  const {
    data: businessInfo,
    isPending: isBusinessPending,
    isError: isBusinessError,
  } = useQuery({
    queryKey: ["business-info", storeBusinessId || "primary"],
    queryFn: async () => {
      const res = await businessService.getBusinessInfo();
      if (res.error || !res.data?.data) {
        throw new Error(res.error?.message ?? t("editProfile.business.loadFailed"));
      }
      return res.data.data;
    },
    enabled: isBusiness,
  });

  const { data: businessTypes = [] } = useQuery({
    queryKey: ["business-types"],
    queryFn: async () => {
      const res = await businessService.fetchBusinessTypes();
      return res.data?.data ?? [];
    },
    enabled: isBusiness,
  });

  const businessTypeOptions = useMemo(
    () => businessTypes.map((item) => ({ value: item.name, label: item.name })),
    [businessTypes],
  );

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] =
    useState<UsernameAvailabilityStatus>("idle");
  const [bio, setBio] = useState("");
  const [urlLinkedin, setUrlLinkedin] = useState("");
  const [urlFacebook, setUrlFacebook] = useState("");
  const [urlInstagram, setUrlInstagram] = useState("");
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);

  const [businessForm, setBusinessForm] =
    useState<BusinessProfileFormValues>(EMPTY_BUSINESS_FORM);
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [addBranchVisible, setAddBranchVisible] = useState(false);
  const [editingHoursBranchId, setEditingHoursBranchId] = useState<
    string | null
  >(null);
  const [pendingDeleteBranchId, setPendingDeleteBranchId] = useState<
    string | null
  >(null);
  const [seededBusinessId, setSeededBusinessId] = useState<string | null>(null);
  const [businessPickerVisible, setBusinessPickerVisible] = useState(false);
  const [isSwitchingBusiness, setIsSwitchingBusiness] = useState(false);

  const handleUsernameStatusChange = useCallback(
    (status: UsernameAvailabilityStatus) => {
      setUsernameStatus(status);
    },
    [],
  );

  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.first_name ?? "");
    setLastName(profile.last_name ?? "");
    setName(profile.name ?? "");
    setDateOfBirth(profile.date_of_birth ?? "");
    setUsername(profile.username ?? "");
    setBio(profile.bio ?? "");
    setUrlLinkedin(profile.url_linkedin ?? "");
    setUrlFacebook(profile.url_facebook ?? "");
    setUrlInstagram(profile.url_instagram ?? "");
    setLocation(
      profile.location
        ? {
            city: profile.location.city,
            region: profile.location.region ?? "",
            country: profile.location.country,
            latitude: profile.location.latitude ?? 0,
            longitude: profile.location.longitude ?? 0,
            street_address: profile.location.street_address ?? null,
            postal_code: profile.location.postal_code ?? null,
          }
        : null,
    );
  }, [profile]);

  function mapBranchesFromApi(info: BusinessItemDAO) {
    return (info.branches ?? []).map((branch) => ({
      id: branch.id,
      name: branch.name,
      location: branch.location,
      openingHours: normalizeOpeningHours(branch.opening_hours),
    }));
  }

  function seedBusinessForm(info: BusinessItemDAO) {
    setBusinessForm({
      businessName: info.name ?? "",
      businessType: info.business_type ?? "",
      businessBio: info.bio ?? "",
      contactEmail: info.contact_email ?? "",
      phoneNumber: info.phone_number ?? "",
      businessWebsite: info.website ?? "",
      logoUrl: info.logo || null,
      logoFiles: [],
      logoDeleted: false,
      branches: mapBranchesFromApi(info),
    });
    setSeededBusinessId(info.id);
  }

  useEffect(() => {
    if (!businessInfo) return;
    if (seededBusinessId === businessInfo.id) return;
    seedBusinessForm(businessInfo);
  }, [businessInfo, seededBusinessId]);

  const isLocationDirty =
    (location?.city ?? "") !== (profile?.location?.city ?? "") ||
    (location?.region ?? "") !== (profile?.location?.region ?? "") ||
    (location?.country ?? "") !== (profile?.location?.country ?? "") ||
    (location?.street_address ?? "") !==
      (profile?.location?.street_address ?? "") ||
    (location?.postal_code ?? "") !== (profile?.location?.postal_code ?? "");

  const isProfileDirty =
    firstName.trim() !== (profile?.first_name ?? "").trim() ||
    lastName.trim() !== (profile?.last_name ?? "").trim() ||
    name.trim() !== (profile?.name ?? "").trim() ||
    dateOfBirth.trim() !== (profile?.date_of_birth ?? "").trim() ||
    username.trim().toLowerCase() !==
      (profile?.username ?? "").trim().toLowerCase() ||
    bio.trim() !== (profile?.bio ?? "").trim() ||
    urlLinkedin.trim() !== (profile?.url_linkedin ?? "").trim() ||
    urlFacebook.trim() !== (profile?.url_facebook ?? "").trim() ||
    urlInstagram.trim() !== (profile?.url_instagram ?? "").trim() ||
    isLocationDirty;

  const isBusinessDirty =
    isBusiness &&
    !!businessInfo &&
    (businessForm.businessName.trim() !== (businessInfo.name ?? "").trim() ||
      businessForm.businessType.trim() !==
        (businessInfo.business_type ?? "").trim() ||
      businessForm.businessBio.trim() !== (businessInfo.bio ?? "").trim() ||
      businessForm.contactEmail.trim() !==
        (businessInfo.contact_email ?? "").trim() ||
      businessForm.phoneNumber.trim() !==
        (businessInfo.phone_number ?? "").trim() ||
      businessForm.businessWebsite.trim() !==
        (businessInfo.website ?? "").trim() ||
      businessForm.logoFiles.length > 0 ||
      businessForm.logoDeleted);

  const isDirty = isProfileDirty || isBusinessDirty;
  const bioOverLimit = bio.length > BIO_MAX_LENGTH;
  const usernameBlocking = isUsernameBlocking(usernameStatus);
  const canSwitchBusiness = ownedBusinesses.length > 1;
  const activeBusinessId = businessInfo?.id ?? storeBusinessId;

  const switchToBusiness = useCallback(
    async (businessId: string) => {
      if (!businessId || businessId === activeBusinessId) {
        setBusinessPickerVisible(false);
        return;
      }
      setIsSwitchingBusiness(true);
      try {
        const result = await selectBusiness(businessId);
        if (!result.ok) {
          showToast({
            type: "error",
            message: result.message ?? t("editProfile.business.switchFailed"),
          });
          return;
        }
        const info = useBusinessStore.getState().businessInfo;
        if (info) {
          queryClient.setQueryData(["business-info", info.id], info);
          seedBusinessForm(info);
        } else {
          setSeededBusinessId(null);
          await queryClient.invalidateQueries({ queryKey: ["business-info"] });
        }
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        setBusinessPickerVisible(false);
      } finally {
        setIsSwitchingBusiness(false);
      }
    },
    [activeBusinessId, queryClient, selectBusiness, showToast, t],
  );

  const requestSwitchBusiness = useCallback(
    (businessId: string) => {
      if (businessId === activeBusinessId) {
        setBusinessPickerVisible(false);
        return;
      }
      if (!isDirty) {
        void switchToBusiness(businessId);
        return;
      }
      Alert.alert(
        t("editProfile.business.discardSwitchTitle"),
        t("editProfile.business.discardSwitchMessage"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("editProfile.business.discardSwitchConfirm"),
            style: "destructive",
            onPress: () => void switchToBusiness(businessId),
          },
        ],
      );
    },
    [activeBusinessId, isDirty, switchToBusiness, t],
  );

  const { mutate: saveProfile, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Display name is required.");
      const usernameTrimmed = username.trim().toLowerCase();
      if (!usernameTrimmed) throw new Error("Username is required.");
      if (usernameBlocking) {
        throw new Error("Please choose a valid, available username.");
      }
      if (bioOverLimit)
        throw new Error(`Bio must be ${BIO_MAX_LENGTH} characters or fewer.`);

      const dobVal = dateOfBirth.trim();
      if (dobVal) {
        const dobDate = new Date(dobVal);
        if (Number.isNaN(dobDate.getTime()) || dobDate >= new Date()) {
          throw new Error(t("validation.dateOfBirthPast"));
        }
      }

      const linkedinVal = urlLinkedin.trim();
      if (
        linkedinVal &&
        !linkedinVal.match(/^https?:\/\/(www\.)?linkedin\.com\//)
      ) {
        throw new Error(
          "LinkedIn URL must start with https://linkedin.com/in/username.",
        );
      }
      const facebookVal = urlFacebook.trim();
      if (
        facebookVal &&
        !facebookVal.match(/^https?:\/\/(www\.)?facebook\.com\//)
      ) {
        throw new Error(
          "Facebook URL must start with https://facebook.com/username.",
        );
      }
      const instagramVal = urlInstagram.trim();
      if (
        instagramVal &&
        !instagramVal.match(/^https?:\/\/(www\.)?instagram\.com\//)
      ) {
        throw new Error(
          "Instagram URL must start with https://instagram.com/username.",
        );
      }

      if (isBusinessDirty) {
        if (!businessForm.businessName.trim()) {
          throw new Error(t("editProfile.business.nameRequired"));
        }
        if (!businessForm.contactEmail.trim()) {
          throw new Error(t("editProfile.business.emailRequired"));
        }
        if (
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessForm.contactEmail.trim())
        ) {
          throw new Error(t("editProfile.business.emailInvalid"));
        }
        if (!businessForm.phoneNumber.trim()) {
          throw new Error(t("editProfile.business.phoneRequired"));
        }
        const websiteVal = businessForm.businessWebsite.trim();
        if (websiteVal && !/^https?:\/\/.+/i.test(websiteVal)) {
          throw new Error(t("editProfile.business.websiteInvalid"));
        }

        if (businessForm.logoDeleted && !businessForm.logoFiles[0]) {
          const deleteRes = await businessService.deleteLogo();
          if (deleteRes.error) {
            throw new Error(
              deleteRes.error.message ?? t("editProfile.business.saveFailed"),
            );
          }
        } else if (businessForm.logoFiles[0]) {
          const uploadRes = await businessService.uploadLogo(
            businessForm.logoFiles[0].file,
          );
          if (uploadRes.error) {
            throw new Error(
              uploadRes.error.message ?? t("editProfile.business.saveFailed"),
            );
          }
        }

        const updateRes = await businessService.updateBusiness({
          name: businessForm.businessName.trim(),
          business_type: businessForm.businessType.trim(),
          bio: businessForm.businessBio.trim(),
          contact_email: businessForm.contactEmail.trim(),
          phone_number: businessForm.phoneNumber.trim(),
          website: websiteVal,
        });
        if (updateRes.error) {
          throw new Error(
            updateRes.error.message ?? t("editProfile.business.saveFailed"),
          );
        }
      }

      if (isProfileDirty) {
        const dto: updateAccountDTO = {
          first_name: firstName.trim() || undefined,
          last_name: lastName.trim() || undefined,
          name: name.trim(),
          username: usernameTrimmed,
          date_of_birth: dobVal || null,
          bio: bio.trim(),
          url_linkedin: linkedinVal || null,
          url_facebook: facebookVal || null,
          url_instagram: instagramVal || null,
          ...(isLocationDirty && {
            location: location
              ? {
                  city: location.city,
                  region: location.region,
                  country: location.country,
                  latitude: location.latitude,
                  longitude: location.longitude,
                  street_address: location.street_address ?? null,
                  postal_code: location.postal_code ?? null,
                }
              : null,
          }),
        };

        const res = await accountService.updateAccount(dto);
        if (res.error) {
          throw new Error(
            res.error.message ?? "Failed to update profile. Please try again.",
          );
        }
        return res.data?.data;
      }

      return null;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      if (isBusiness) {
        queryClient.invalidateQueries({ queryKey: ["business-info"] });
        await refreshBusinessInfo();
        setSeededBusinessId(null);
      }
      showToast({ type: "success", message: "Profile updated successfully." });
      router.back();
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
            : "Failed to update profile. Please try again."),
      });
    },
  });

  const { mutateAsync: addBranchAsync, isPending: isAddingBranch } = useMutation({
    mutationFn: async ({
      name: branchName,
      location: branchLocation,
      openingHours,
    }: {
      name: string;
      location: BusinessLocation;
      openingHours: OpeningHours;
    }) => {
      const res = await businessService.addBranch({
        name: branchName,
        location: branchLocation,
        opening_hours: openingHours,
      });
      if (res.error || !res.data?.data) {
        throw new Error(
          res.error?.message ?? t("editProfile.business.saveFailed"),
        );
      }
      return res.data.data;
    },
    onSuccess: async (data) => {
      setBusinessForm((prev) => ({
        ...prev,
        branches: mapBranchesFromApi(data),
      }));
      queryClient.setQueryData(["business-info", data.id], data);
      await refreshBusinessInfo();
      setAddBranchVisible(false);
      showToast({ type: "success", message: "Branch added." });
    },
    onError: (err: unknown) => {
      showToast({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : t("editProfile.business.saveFailed"),
      });
    },
  });

  const { mutateAsync: updateBranchHoursAsync, isPending: isUpdatingHours } =
    useMutation({
      mutationFn: async ({
        branchId,
        openingHours,
      }: {
        branchId: string;
        openingHours: OpeningHours;
      }) => {
        const res = await businessService.updateBranch({
          id: branchId,
          opening_hours: openingHours,
        });
        if (res.error || !res.data?.data) {
          throw new Error(
            res.error?.message ?? t("editProfile.business.saveFailed"),
          );
        }
        return res.data.data;
      },
      onSuccess: async (data) => {
        setBusinessForm((prev) => ({
          ...prev,
          branches: mapBranchesFromApi(data),
        }));
        queryClient.setQueryData(["business-info", data.id], data);
        await refreshBusinessInfo();
        setEditingHoursBranchId(null);
        showToast({ type: "success", message: "Branch hours updated." });
      },
      onError: (err: unknown) => {
        showToast({
          type: "error",
          message:
            err instanceof Error
              ? err.message
              : t("editProfile.business.saveFailed"),
        });
      },
    });

  const { mutate: deleteBranch, isPending: isDeletingBranch } = useMutation({
    mutationFn: async (branchId: string) => {
      const res = await businessService.deleteBranch(branchId);
      if (res.error || !res.data?.data) {
        throw new Error(
          res.error?.message ?? t("editProfile.business.saveFailed"),
        );
      }
      return res.data.data;
    },
    onSuccess: async (data) => {
      setBusinessForm((prev) => ({
        ...prev,
        branches: mapBranchesFromApi(data),
      }));
      queryClient.setQueryData(["business-info", data.id], data);
      await refreshBusinessInfo();
      setPendingDeleteBranchId(null);
      showToast({ type: "success", message: "Branch removed." });
    },
    onError: (err: unknown) => {
      setPendingDeleteBranchId(null);
      showToast({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : t("editProfile.business.saveFailed"),
      });
    },
  });

  if (isPending || (isBusiness && isBusinessPending && !businessInfo)) {
    return <PageLoader />;
  }

  if (isError || !profile) {
    return (
      <View className="flex-1 bg-page dark:bg-gray-900 items-center justify-center">
        <Text className="font-geist text-base text-gray-500 dark:text-gray-400">
          Failed to load profile.
        </Text>
      </View>
    );
  }

  if (isBusiness && isBusinessError && !businessInfo) {
    return (
      <View className="flex-1 bg-page dark:bg-gray-900 items-center justify-center px-6">
        <Text className="font-geist text-base text-gray-500 dark:text-gray-400 text-center">
          {t("editProfile.business.loadFailed")}
        </Text>
      </View>
    );
  }

  const gradientColors = getPersonalityGradientColors(
    profile.personality_color,
  );
  const isSaveDisabled =
    !isDirty || bioOverLimit || isSaving || usernameBlocking;

  const placeholderColor = "#6B7280";

  const locationValue = location
    ? [location.city, location.region].filter(Boolean).join(", ")
    : undefined;

  return (
    <SafeAreaView
      edges={["bottom"]}
      className="flex-1 bg-page dark:bg-gray-900"
    >
      <PageHeader title="Edit profile" />

      <KeyboardAwareScrollView
        className="flex-1"
        bottomOffset={EDIT_PROFILE_FOOTER_OFFSET}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="items-center pt-4 pb-6 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <UploadAvatar
            name={profile.name}
            src={profile.profile_image_url}
            gradientColors={gradientColors}
          />
        </View>

        <SectionLabel label="Identity" />
        <View className="px-6 gap-4 bg-white dark:bg-gray-900 py-4">
          <View className="flex-row gap-3">
            <View className="flex-1">
              <TextInput
                label="FIRST NAME"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First"
                placeholderTextColor={placeholderColor}
                autoCapitalize="words"
                maxLength={250}
                returnKeyType="next"
                editable={!isSaving}
              />
            </View>
            <View className="flex-1">
              <TextInput
                label="LAST NAME"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last"
                placeholderTextColor={placeholderColor}
                autoCapitalize="words"
                maxLength={250}
                returnKeyType="next"
                editable={!isSaving}
              />
            </View>
          </View>

          <TextInput
            label="DISPLAY NAME"
            value={name}
            onChangeText={setName}
            placeholder="Your display name"
            placeholderTextColor={placeholderColor}
            autoCapitalize="words"
            returnKeyType="next"
            editable={!isSaving}
          />

          <DateField
            label={t("auth.onboarding.dateOfBirthLabel")}
            placeholder={t("auth.onboarding.dateOfBirthPlaceholder")}
            value={dateOfBirth}
            onChange={setDateOfBirth}
          />

          <UsernameField
            value={username}
            onChangeText={setUsername}
            currentUsername={profile.username}
            onStatusChange={handleUsernameStatusChange}
          />

          <View>
            <TextInput
              label="BIO"
              value={bio}
              onChangeText={setBio}
              placeholder="Tell others about yourself..."
              placeholderTextColor={placeholderColor}
              multiline
              maxLength={BIO_MAX_LENGTH}
              numberOfLines={4}
              textAlignVertical="top"
              editable={!isSaving}
              error={
                bioOverLimit
                  ? `Bio must be ${BIO_MAX_LENGTH} characters or fewer.`
                  : undefined
              }
            />
          </View>
        </View>

        {isBusiness ? (
          <BusinessProfileFields
            values={businessForm}
            onChange={setBusinessForm}
            editable={!isSaving}
            onPressBusinessType={() => setTypePickerOpen(true)}
            onAddBranch={() => setAddBranchVisible(true)}
            onRemoveBranch={(branchId) => setPendingDeleteBranchId(branchId)}
            onEditBranchHours={(branchId) => setEditingHoursBranchId(branchId)}
            addBranchIconColor={addBranchIconColor}
            header={
              canSwitchBusiness ? (
                <Pressable
                  onPress={() => setBusinessPickerVisible(true)}
                  accessibilityRole="button"
                  className="mx-6 mb-2 flex-row items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900"
                >
                  <View className="min-w-0 flex-1 pr-3">
                    <Text className="font-geist text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      {t("editProfile.business.editingBusiness")}
                    </Text>
                    <Text
                      className="mt-0.5 font-geist-semibold text-sm text-ink dark:text-gray-100"
                      numberOfLines={1}
                    >
                      {businessInfo?.name ?? businessForm.businessName}
                    </Text>
                  </View>
                  <ChevronDown size={18} color="#9CA3AF" />
                </Pressable>
              ) : null
            }
          />
        ) : null}

        <SectionLabel label="Social Links" />
        <View className="px-6 gap-4">
          <TextInput
            label="LINKEDIN"
            value={urlLinkedin}
            onChangeText={setUrlLinkedin}
            placeholder="https://linkedin.com/in/username"
            placeholderTextColor={placeholderColor}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            editable={!isSaving}
          />
          <TextInput
            label="FACEBOOK"
            value={urlFacebook}
            onChangeText={setUrlFacebook}
            placeholder="https://facebook.com/username"
            placeholderTextColor={placeholderColor}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            editable={!isSaving}
          />
          <TextInput
            label="INSTAGRAM"
            value={urlInstagram}
            onChangeText={setUrlInstagram}
            placeholder="https://instagram.com/username"
            placeholderTextColor={placeholderColor}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            editable={!isSaving}
          />
        </View>

        <SectionLabel label="Location & Taste" />
        <View className="border-t border-gray-100 dark:border-gray-800">
          <ProfileRow
            title="Home City"
            subtitle="Default location for Search, Home, and Offers"
            value={locationValue}
            onPress={() => setIsLocationModalVisible(true)}
          />
          <ProfileRow
            title="Personality"
            subtitle="Retake the quiz to refresh your blend"
            value={profile.personality_name ?? undefined}
            onPress={() => router.push("/personality")}
          />
        </View>

        <SectionLabel label="Account" />
        <View className="border-t border-gray-100 dark:border-gray-800">
          <ProfileRow title="Email" value={profile.email} isReadOnly />
          <ProfileRow
            title="Phone"
            subtitle="Optional · for account recovery"
            showAddPlaceholder
            onPress={() =>
              showToast({
                type: "info",
                message: "Phone setup coming soon.",
                title: "Feature Coming Soon",
              })
            }
          />
        </View>
      </KeyboardAwareScrollView>

      <KeyboardStickyView
        style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
      >
        <BottomWrapper style={{ position: "relative" }}>
          <LocalNotesButton
            label={isSaving ? "Saving…" : "Save changes"}
            onPress={() => saveProfile()}
            variant="dark"
            disabled={isSaveDisabled}
          />
        </BottomWrapper>
      </KeyboardStickyView>

      <HomeLocationFormModal
        visible={isLocationModalVisible}
        onClose={() => setIsLocationModalVisible(false)}
        initialLocation={location}
        onSaved={setLocation}
      />

      {isBusiness ? (
        <>
          <DropDown
            visible={typePickerOpen}
            options={businessTypeOptions}
            selected={businessForm.businessType}
            onApply={(value) =>
              setBusinessForm((prev) => ({ ...prev, businessType: value }))
            }
            onClose={() => setTypePickerOpen(false)}
            isSearchable
            searchPlaceholder={t("common.search")}
          />
          <OwnedBusinessPickerModal
            visible={businessPickerVisible}
            onClose={() => setBusinessPickerVisible(false)}
            businesses={ownedBusinesses}
            selectedId={activeBusinessId}
            isLoading={isFetchingOwned}
            error={ownedError}
            onRetry={() => void loadOwnedBusinesses()}
            onSelect={requestSwitchBusiness}
            isSaving={isSwitchingBusiness}
          />
          <AddBranchModal
            visible={addBranchVisible}
            onClose={() => setAddBranchVisible(false)}
            loading={isAddingBranch}
            onSave={async (branchName, branchLocation, openingHours) => {
              await addBranchAsync({
                name: branchName,
                location: branchLocation,
                openingHours,
              });
            }}
          />
          <EditBranchHoursModal
            visible={editingHoursBranchId !== null}
            branchName={
              businessForm.branches.find((b) => b.id === editingHoursBranchId)
                ?.name
            }
            initialHours={
              businessForm.branches.find((b) => b.id === editingHoursBranchId)
                ?.openingHours
            }
            loading={isUpdatingHours}
            onClose={() => setEditingHoursBranchId(null)}
            onSave={async (hours) => {
              if (!editingHoursBranchId) return;
              await updateBranchHoursAsync({
                branchId: editingHoursBranchId,
                openingHours: hours,
              });
            }}
          />
          <ConfirmDeleteModal
            visible={pendingDeleteBranchId !== null}
            onClose={() => setPendingDeleteBranchId(null)}
            onConfirm={() => {
              if (pendingDeleteBranchId) {
                deleteBranch(pendingDeleteBranchId);
              }
            }}
            isLoading={isDeletingBranch}
            title={t("editProfile.business.removeBranch")}
            message={t("editProfile.business.removeBranchMessage")}
          />
        </>
      ) : null}
    </SafeAreaView>
  );
}
