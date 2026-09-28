import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, BackHandler, Pressable, Text, View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { PageHeader } from "@/components/ui/PageHeader";
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
import { EditProfileHub } from "@/components/PageComponents/Profile/EditProfileHub";
import {
  EditProfilePersonalFields,
  type EditProfilePersonalValues,
} from "@/components/PageComponents/Profile/EditProfilePersonalFields";
import {
  EditProfileSocialFields,
  type EditProfileSocialValues,
} from "@/components/PageComponents/Profile/EditProfileSocialFields";
import { useToastStore } from "@/stores/useToastStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useBusinessStore } from "@/stores/useBusinessStore";
import accountService from "@/http/account-api/account.services";
import businessService from "@/http/business-api/business.service";
import { getPersonalityGradientColors } from "@/utils/personalityRing";
import { isBusinessAccountType } from "@/utils/businessAccount";
import { normalizeOpeningHours } from "@/utils/openingHours";
import type {
  profileItemDAO,
  updateAccountDTO,
} from "@/http/account-api/types";
import type { Location as GeoLocation } from "@/http/list-api/types";
import type {
  BusinessItemDAO,
  BusinessLocation,
  OpeningHours,
  ProfileDetails,
} from "@/http/business-api/types";
import {
  isUsernameBlocking,
  type UsernameAvailabilityStatus,
} from "@/hooks/useUsernameAvailability";
import { useBusinessTypes } from "@/hooks/useBusinessTypes";
import { findBusinessType } from "@/utils/businessTypes";

const BIO_MAX_LENGTH = 160;
const EDIT_PROFILE_FOOTER_OFFSET = 120;

type EditorView = "hub" | "personal" | "social" | "business";
type EditorSection = Exclude<EditorView, "hub">;

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

const EMPTY_PERSONAL: EditProfilePersonalValues = {
  firstName: "",
  lastName: "",
  name: "",
  dateOfBirth: "",
  username: "",
  bio: "",
};

const EMPTY_SOCIAL: EditProfileSocialValues = {
  urlLinkedin: "",
  urlFacebook: "",
  urlInstagram: "",
};

function personalFromProfile(profile: profileItemDAO): EditProfilePersonalValues {
  return {
    firstName: profile.first_name ?? "",
    lastName: profile.last_name ?? "",
    name: profile.name ?? "",
    dateOfBirth: profile.date_of_birth ?? "",
    username: profile.username ?? "",
    bio: profile.bio ?? "",
  };
}

function socialFromProfile(profile: profileItemDAO): EditProfileSocialValues {
  return {
    urlLinkedin: profile.url_linkedin ?? "",
    urlFacebook: profile.url_facebook ?? "",
    urlInstagram: profile.url_instagram ?? "",
  };
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

  const { data: businessTypes = [] } = useBusinessTypes({ enabled: isBusiness });

  const businessTypeOptions = useMemo(
    () => businessTypes.map((item) => ({ value: item.name, label: item.name })),
    [businessTypes],
  );

  const [view, setView] = useState<EditorView>("hub");
  const [personal, setPersonal] =
    useState<EditProfilePersonalValues>(EMPTY_PERSONAL);
  const [social, setSocial] = useState<EditProfileSocialValues>(EMPTY_SOCIAL);
  const [usernameStatus, setUsernameStatus] =
    useState<UsernameAvailabilityStatus>("idle");
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);

  const [businessForm, setBusinessForm] =
    useState<BusinessProfileFormValues>(EMPTY_BUSINESS_FORM);
  const [profileDetails, setProfileDetails] = useState<ProfileDetails>({});
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

  const updatePersonal = useCallback(
    <K extends keyof EditProfilePersonalValues>(
      key: K,
      value: EditProfilePersonalValues[K],
    ) => {
      setPersonal((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const updateSocial = useCallback(
    (key: keyof EditProfileSocialValues, value: string) => {
      setSocial((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  useEffect(() => {
    if (!profile) return;
    setPersonal(personalFromProfile(profile));
    setSocial(socialFromProfile(profile));
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
    setProfileDetails({ ...(info.profile_details ?? {}) });
    setSeededBusinessId(info.id);
  }

  useEffect(() => {
    if (!businessInfo) return;
    if (seededBusinessId === businessInfo.id) return;
    seedBusinessForm(businessInfo);
  }, [businessInfo, seededBusinessId]);

  const isPersonalDirty =
    personal.firstName.trim() !== (profile?.first_name ?? "").trim() ||
    personal.lastName.trim() !== (profile?.last_name ?? "").trim() ||
    personal.name.trim() !== (profile?.name ?? "").trim() ||
    personal.dateOfBirth.trim() !== (profile?.date_of_birth ?? "").trim() ||
    personal.username.trim().toLowerCase() !==
      (profile?.username ?? "").trim().toLowerCase() ||
    personal.bio.trim() !== (profile?.bio ?? "").trim();

  const isSocialDirty =
    social.urlLinkedin.trim() !== (profile?.url_linkedin ?? "").trim() ||
    social.urlFacebook.trim() !== (profile?.url_facebook ?? "").trim() ||
    social.urlInstagram.trim() !== (profile?.url_instagram ?? "").trim();

  const typeRequirements = useMemo(
    () => findBusinessType(businessTypes, businessForm.businessType)?.requirements ?? [],
    [businessTypes, businessForm.businessType],
  );

  const isProfileDetailsDirty =
    !!businessInfo &&
    typeRequirements.some(
      ({ key }) =>
        (profileDetails[key] ?? "").trim() !==
        (businessInfo.profile_details?.[key] ?? "").trim(),
    );

  const isBusinessDirty =
    isBusiness &&
    !!businessInfo &&
    (isProfileDetailsDirty ||
      businessForm.businessName.trim() !== (businessInfo.name ?? "").trim() ||
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

  const isViewDirty =
    view === "personal"
      ? isPersonalDirty
      : view === "social"
        ? isSocialDirty
        : view === "business"
          ? isBusinessDirty
          : false;

  const bioOverLimit = personal.bio.length > BIO_MAX_LENGTH;
  const usernameBlocking = isUsernameBlocking(usernameStatus);
  const canSwitchBusiness = ownedBusinesses.length > 1;
  const activeBusinessId = businessInfo?.id ?? storeBusinessId;

  const discardViewChanges = useCallback(() => {
    if (view === "personal" && profile) {
      setPersonal(personalFromProfile(profile));
    } else if (view === "social" && profile) {
      setSocial(socialFromProfile(profile));
    } else if (view === "business" && businessInfo) {
      seedBusinessForm(businessInfo);
    }
    setView("hub");
  }, [view, profile, businessInfo]);

  const handleBack = useCallback(() => {
    if (view === "hub") {
      router.back();
      return;
    }
    if (!isViewDirty) {
      setView("hub");
      return;
    }
    Alert.alert(
      t("editProfile.discardTitle"),
      t("editProfile.discardMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("editProfile.discardConfirm"),
          style: "destructive",
          onPress: discardViewChanges,
        },
      ],
    );
  }, [view, isViewDirty, router, t, discardViewChanges]);

  useEffect(() => {
    if (view === "hub") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      handleBack();
      return true;
    });
    return () => sub.remove();
  }, [view, handleBack]);

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
      if (!isBusinessDirty) {
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
    [activeBusinessId, isBusinessDirty, switchToBusiness, t],
  );

  async function savePersonal() {
    const name = personal.name.trim();
    if (!name) throw new Error(t("editProfile.validation.displayNameRequired"));
    const username = personal.username.trim().toLowerCase();
    if (!username) throw new Error(t("editProfile.validation.usernameRequired"));
    if (usernameBlocking) {
      throw new Error(t("editProfile.validation.usernameUnavailable"));
    }
    if (bioOverLimit) {
      throw new Error(
        t("editProfile.validation.bioTooLong", { max: BIO_MAX_LENGTH }),
      );
    }

    const dobVal = personal.dateOfBirth.trim();
    if (dobVal) {
      const dobDate = new Date(dobVal);
      if (Number.isNaN(dobDate.getTime()) || dobDate >= new Date()) {
        throw new Error(t("validation.dateOfBirthPast"));
      }
    }

    const dto: updateAccountDTO = {
      first_name: personal.firstName.trim() || undefined,
      last_name: personal.lastName.trim() || undefined,
      name,
      username,
      date_of_birth: dobVal || null,
      bio: personal.bio.trim(),
    };
    const res = await accountService.updateAccount(dto);
    if (res.error) {
      throw new Error(res.error.message ?? t("editProfile.saveFailed"));
    }
  }

  async function saveSocial() {
    const linkedinVal = social.urlLinkedin.trim();
    if (
      linkedinVal &&
      !linkedinVal.match(/^https?:\/\/(www\.)?linkedin\.com\//)
    ) {
      throw new Error(t("editProfile.validation.linkedinInvalid"));
    }
    const facebookVal = social.urlFacebook.trim();
    if (
      facebookVal &&
      !facebookVal.match(/^https?:\/\/(www\.)?facebook\.com\//)
    ) {
      throw new Error(t("editProfile.validation.facebookInvalid"));
    }
    const instagramVal = social.urlInstagram.trim();
    if (
      instagramVal &&
      !instagramVal.match(/^https?:\/\/(www\.)?instagram\.com\//)
    ) {
      throw new Error(t("editProfile.validation.instagramInvalid"));
    }

    const res = await accountService.updateAccount({
      url_linkedin: linkedinVal || null,
      url_facebook: facebookVal || null,
      url_instagram: instagramVal || null,
    });
    if (res.error) {
      throw new Error(res.error.message ?? t("editProfile.saveFailed"));
    }
  }

  async function saveBusiness() {
    if (!businessForm.businessName.trim()) {
      throw new Error(t("editProfile.business.nameRequired"));
    }
    if (!businessForm.contactEmail.trim()) {
      throw new Error(t("editProfile.business.emailRequired"));
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessForm.contactEmail.trim())) {
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
      ...(typeRequirements.length > 0 && {
        profile_details: Object.fromEntries(
          typeRequirements.map(({ key }) => [key, (profileDetails[key] ?? "").trim()]),
        ),
      }),
    });
    if (updateRes.error) {
      throw new Error(
        updateRes.error.message ?? t("editProfile.business.saveFailed"),
      );
    }
  }

  const { mutate: saveSection, isPending: isSaving } = useMutation({
    mutationFn: async (section: EditorSection) => {
      if (section === "personal") return savePersonal();
      if (section === "social") return saveSocial();
      return saveBusiness();
    },
    onSuccess: async (_data, section) => {
      if (section === "business") {
        await queryClient.invalidateQueries({ queryKey: ["business-info"] });
        await refreshBusinessInfo();
        setSeededBusinessId(null);
      } else {
        await queryClient.invalidateQueries({ queryKey: ["profile"] });
      }
      showToast({ type: "success", message: t("editProfile.saved") });
      setView("hub");
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
          (err instanceof Error ? err.message : t("editProfile.saveFailed")),
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
          {t("editProfile.loadFailed")}
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

  const homeLocation: GeoLocation | null = profile.location
    ? {
        city: profile.location.city,
        region: profile.location.region ?? "",
        country: profile.location.country,
        latitude: profile.location.latitude ?? 0,
        longitude: profile.location.longitude ?? 0,
        street_address: profile.location.street_address ?? null,
        postal_code: profile.location.postal_code ?? null,
      }
    : null;
  const homeCityValue = homeLocation
    ? [homeLocation.city, homeLocation.region].filter(Boolean).join(", ")
    : undefined;

  const socialSummary = [
    social.urlLinkedin.trim() ? t("editProfile.social.linkedin") : null,
    social.urlFacebook.trim() ? t("editProfile.social.facebook") : null,
    social.urlInstagram.trim() ? t("editProfile.social.instagram") : null,
  ]
    .filter(Boolean)
    .join(", ");

  const isSaveDisabled =
    !isViewDirty ||
    isSaving ||
    (view === "personal" && (bioOverLimit || usernameBlocking));

  const headerTitle =
    view === "personal"
      ? t("editProfile.personal.title")
      : view === "social"
        ? t("editProfile.social.title")
        : view === "business"
          ? t("editProfile.businessEditor.title")
          : t("editProfile.title");

  const isEditor = view !== "hub";

  return (
    <SafeAreaView
      edges={["bottom"]}
      className="flex-1 bg-page dark:bg-gray-900"
    >
      <Stack.Screen options={{ gestureEnabled: !isEditor }} />
      <PageHeader title={headerTitle} onBack={handleBack} />

      <KeyboardAwareScrollView
        key={view}
        className="flex-1"
        bottomOffset={isEditor ? EDIT_PROFILE_FOOTER_OFFSET : 0}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: isEditor ? 120 : 40 }}
      >
        {view === "hub" ? (
          <EditProfileHub
            avatarName={profile.name}
            avatarSrc={profile.profile_image_url ?? undefined}
            gradientColors={gradientColors}
            displayName={personal.name}
            username={personal.username}
            socialSummary={socialSummary}
            homeCity={homeCityValue}
            personalityName={profile.personality_name ?? undefined}
            email={profile.email}
            business={
              isBusiness
                ? {
                    name: businessForm.businessName,
                    type: businessForm.businessType,
                    branchCount: businessForm.branches.length,
                  }
                : undefined
            }
            onOpenBusiness={() => setView("business")}
            onOpenPersonal={() => setView("personal")}
            onOpenSocial={() => setView("social")}
            onOpenHomeCity={() => setIsLocationModalVisible(true)}
            onOpenPersonality={() =>
              router.push({
                pathname: "/personality",
                params: { isRetake: "true" },
              })
            }
            onPressPhone={() =>
              showToast({
                type: "info",
                message: t("editProfile.hub.phoneComingSoon"),
                title: t("editProfile.hub.phoneComingSoonTitle"),
              })
            }
          />
        ) : null}

        {view === "personal" ? (
          <EditProfilePersonalFields
            values={personal}
            onChange={updatePersonal}
            currentUsername={profile.username}
            onUsernameStatusChange={handleUsernameStatusChange}
            bioMaxLength={BIO_MAX_LENGTH}
            editable={!isSaving}
          />
        ) : null}

        {view === "social" ? (
          <EditProfileSocialFields
            values={social}
            onChange={updateSocial}
            editable={!isSaving}
          />
        ) : null}

        {view === "business" ? (
          <BusinessProfileFields
            values={businessForm}
            onChange={setBusinessForm}
            editable={!isSaving}
            showSectionLabel={false}
            onPressBusinessType={() => setTypePickerOpen(true)}
            onAddBranch={() => setAddBranchVisible(true)}
            onRemoveBranch={(branchId) => setPendingDeleteBranchId(branchId)}
            onEditBranchHours={(branchId) => setEditingHoursBranchId(branchId)}
            addBranchIconColor={addBranchIconColor}
            requirements={typeRequirements}
            profileDetails={profileDetails}
            onChangeProfileDetails={setProfileDetails}
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
      </KeyboardAwareScrollView>

      {isEditor ? (
        <KeyboardStickyView
          style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
        >
          <BottomWrapper style={{ position: "relative" }}>
            <LocalNotesButton
              label={isSaving ? t("editProfile.saving") : t("editProfile.save")}
              onPress={() => saveSection(view)}
              variant="dark"
              disabled={isSaveDisabled}
            />
          </BottomWrapper>
        </KeyboardStickyView>
      ) : null}

      <HomeLocationFormModal
        visible={isLocationModalVisible}
        onClose={() => setIsLocationModalVisible(false)}
        initialLocation={homeLocation}
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
