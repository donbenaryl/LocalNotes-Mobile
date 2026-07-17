import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react-native";
import { PageHeader } from "@/components/ui/PageHeader";
import { UploadAvatar } from "@/components/ui/UploadAvatar";
import { TextInput } from "@/components/ui/TextInput";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { KeyboardAwareScrollView } from "@/components/ui/KeyboardAwareScrollView";
import { PageLoader } from "@/components/ui/PageLoader";
import { HomeLocationFormModal } from "@/components/PageComponents/Profile/HomeLocationFormModal";
import { useToastStore } from "@/stores/useToastStore";
import accountService from "@/http/account-api/account.services";
import { getPersonalityGradientColors } from "@/utils/personalityRing";
import type { updateAccountDTO } from "@/http/account-api/types";
import type { Location as GeoLocation } from "@/http/list-api/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const BIO_MAX_LENGTH = 160;

// ─── Small inline components ──────────────────────────────────────────────────

/** Uppercase section label that separates form groups (e.g. "IDENTITY"). */
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
  /** Renders a muted "Add" placeholder when true and no value is provided. */
  showAddPlaceholder?: boolean;
  onPress?: () => void;
  isReadOnly?: boolean;
}

/**
 * A single tappable (or static) row used in the LOCATION & TASTE and ACCOUNT
 * sections. Mirrors the list-row pattern from the handoff design.
 */
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function EditProfile() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.show);

  // ── Profile data ─────────────────────────────────────────────────────────────
  // Reuses the cached result from the profile screen — no extra network request.
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

  // ── Editable form state ───────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [urlLinkedin, setUrlLinkedin] = useState("");
  const [urlFacebook, setUrlFacebook] = useState("");
  const [urlInstagram, setUrlInstagram] = useState("");
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);

  // Seed fields once the profile loads (no-op on subsequent renders).
  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.first_name ?? "");
    setLastName(profile.last_name ?? "");
    setName(profile.name ?? "");
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

  // ── Derived flags ─────────────────────────────────────────────────────────────

  const isLocationDirty =
    (location?.city ?? "") !== (profile?.location?.city ?? "") ||
    (location?.region ?? "") !== (profile?.location?.region ?? "") ||
    (location?.country ?? "") !== (profile?.location?.country ?? "") ||
    (location?.street_address ?? "") !== (profile?.location?.street_address ?? "") ||
    (location?.postal_code ?? "") !== (profile?.location?.postal_code ?? "");

  const isDirty =
    firstName.trim() !== (profile?.first_name ?? "").trim() ||
    lastName.trim() !== (profile?.last_name ?? "").trim() ||
    name.trim() !== (profile?.name ?? "").trim() ||
    bio.trim() !== (profile?.bio ?? "").trim() ||
    urlLinkedin.trim() !== (profile?.url_linkedin ?? "").trim() ||
    urlFacebook.trim() !== (profile?.url_facebook ?? "").trim() ||
    urlInstagram.trim() !== (profile?.url_instagram ?? "").trim() ||
    isLocationDirty;

  const bioOverLimit = bio.length > BIO_MAX_LENGTH;

  // ── Save mutation ─────────────────────────────────────────────────────────────

  const { mutate: saveProfile, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Display name is required.");
      if (bioOverLimit)
        throw new Error(`Bio must be ${BIO_MAX_LENGTH} characters or fewer.`);

      // Client-side URL validation mirrors the frontend ProfileModal checks.
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

      const dto: updateAccountDTO = {
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
        name: name.trim(),
        bio: bio.trim(),
        // Empty string → null to signal "remove this link" to the API.
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
      return res.data?.data;
    },
    onSuccess: () => {
      // Refresh the profile screen so it reflects the new values.
      queryClient.invalidateQueries({ queryKey: ["profile"] });
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

  // ── Loading / error guards ────────────────────────────────────────────────────

  if (isPending) return <PageLoader />;

  if (isError || !profile) {
    return (
      <View className="flex-1 bg-page dark:bg-gray-900 items-center justify-center">
        <Text className="font-geist text-base text-gray-500 dark:text-gray-400">
          Failed to load profile.
        </Text>
      </View>
    );
  }

  // ── Derived style values ──────────────────────────────────────────────────────

  const gradientColors = getPersonalityGradientColors(
    profile.personality_color,
  );
  const isSaveDisabled = !isDirty || bioOverLimit || isSaving;

  const placeholderColor = "#6B7280";

  const locationValue = location
    ? [location.city, location.region].filter(Boolean).join(", ")
    : undefined;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    // edges={['bottom']} keeps the save bar above the home-indicator notch without
    // double-padding the top (PageHeader already handles its own top inset).
    <SafeAreaView
      edges={["bottom"]}
      className="flex-1 bg-page dark:bg-gray-900"
    >
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <PageHeader title="Edit profile" />

      {/* ── Scrollable form body ──────────────────────────────────────────────── */}
      <KeyboardAwareScrollView className="flex-1">
        {/* Profile photo ──────────────────────────────────────────────────────── */}
        <View className="items-center pt-4 pb-6 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <UploadAvatar
            name={profile.name}
            src={profile.profile_image_url}
            gradientColors={gradientColors}
          />
        </View>

        {/* ── IDENTITY ─────────────────────────────────────────────────────────── */}
        <SectionLabel label="Identity" />
        <View className="px-6 gap-4 bg-white dark:bg-gray-900 py-4">
          {/* First / Last name sit above display name — they form the legal name pair. */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <TextInput
                label="FIRST NAME"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First"
                placeholderTextColor={placeholderColor}
                autoCapitalize="words"
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
                returnKeyType="next"
                editable={!isSaving}
              />
            </View>
          </View>

          {/* Display name — required, the name shown across the app. */}
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

          {/* Bio — multiline textarea with a live character counter. */}
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

        {/* ── SOCIAL LINKS ─────────────────────────────────────────────────────── */}
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

        {/* ── LOCATION & TASTE ─────────────────────────────────────────────────── */}
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

        {/* ── ACCOUNT ──────────────────────────────────────────────────────────── */}
        <SectionLabel label="Account" />
        <View className="border-t border-gray-100 dark:border-gray-800">
          {/* Email cannot be changed from this screen — display only. */}
          <ProfileRow title="Email" value={profile.email} isReadOnly />
          {/* Phone is not yet in the API; placeholder row for a future feature. */}
          <ProfileRow
            title="Phone"
            subtitle="Optional · for account recovery"
            showAddPlaceholder
            onPress={() =>
              showToast({ type: "info", message: "Phone setup coming soon.", title: "Feature Coming Soon" })
            }
          />
        </View>

        {/* Bottom breathing room so content sits above the sticky save bar. */}
        <View style={{ height: 32 }} />
      </KeyboardAwareScrollView>

      {/* ── Sticky save bar ───────────────────────────────────────────────────── */}
      {/* Lives outside the scroll view so it stays pinned to the bottom. */}
      <View className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-page dark:bg-gray-900">
        <LocalNotesButton
          label={isSaving ? "Saving…" : "Save changes"}
          onPress={() => saveProfile()}
          variant="dark"
          disabled={isSaveDisabled}
        />
      </View>

      {/* ── Home city / address picker ────────────────────────────────────────── */}
      <HomeLocationFormModal
        visible={isLocationModalVisible}
        onClose={() => setIsLocationModalVisible(false)}
        initialLocation={location}
        onSaved={setLocation}
      />
    </SafeAreaView>
  );
}
