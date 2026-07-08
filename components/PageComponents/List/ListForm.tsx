import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react-native";
import { PageHeader } from "@/components/ui/PageHeader";
import { BottomWrapper } from "@/components/ui/BottomWrapper";
import { KeyboardAwareScrollView } from "@/components/ui/KeyboardAwareScrollView";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { TextInput } from "@/components/ui/TextInput";
import { LocationInput } from "@/components/ui/LocationInput";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { Checkbox } from "@/components/ui/Checkbox";
import { RadioButton } from "@/components/ui/RadioButton";
import { useCategories } from "@/hooks/useProfileList";
import { useListCreate } from "@/hooks/useListCreate";
import { useListEditHydration } from "@/hooks/useListEditHydration";
import { useListFormStore } from "@/stores/useListFormStore";
import { useToastStore } from "@/stores/useToastStore";
import { VISIBILITY_OPTIONS } from "@/constants/visibility";
import { formSubmitToPickDraft } from "@/utils/listPickMappers";
import type { ListPickDraft } from "@/types/listForm";
import type { ListFormCategory } from "@/types/listForm";
import type { searchUserDAO } from "@/http/account-api/types";
import type { FormSubmitData } from "@/components/PageComponents/Profile/ListItemForm";
import type { ListItemFormInitialData } from "@/components/PageComponents/Profile/ListItemForm";
import { ListFormPickRow } from "./ListFormPickRow";
import { ListPickFormModal } from "./ListPickFormModal";
import { LinkExistingPicksSection } from "./LinkExistingPicksSection";
import { ListUserSearchInput } from "./ListUserSearchInput";

const OTHERS_CATEGORY_NAME = "Others";
const INTRO_MAX_LENGTH = 280;

interface ListFormProps {
  step: 1 | 2;
  listId?: string;
}

function hasOthersCategory(categories: ListFormCategory[]): boolean {
  return categories.some(
    (c) => c.name.trim().toLowerCase() === OTHERS_CATEGORY_NAME.toLowerCase(),
  );
}

function CategoryChip({
  label,
  isSelected,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full px-4 py-2 cursor-pointer ${
        isSelected ? "bg-brand" : "bg-gray-100 dark:bg-gray-800"
      }`}
    >
      <Text
        className={`font-geist-medium text-sm ${
          isSelected ? "text-white" : "text-ink dark:text-gray-200"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function ListForm({ step, listId }: ListFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const showToast = useToastStore((s) => s.show);
  const isEditing = Boolean(listId);
  const { categories, isPending: categoriesLoading } = useCategories();
  const { saveList, isSaving } = useListCreate(listId);
  const {
    isLoading: isHydrating,
    isError: hydrationError,
    selectedUserDetails,
    setSelectedUserDetails,
  } = useListEditHydration(listId);

  const name = useListFormStore((s) => s.name);
  const location = useListFormStore((s) => s.location);
  const selectedCategories = useListFormStore((s) => s.categories);
  const notes = useListFormStore((s) => s.notes);
  const others_name = useListFormStore((s) => s.others_name);
  const items = useListFormStore((s) => s.items);
  const shareOption = useListFormStore((s) => s.shareOption);
  const allowComments = useListFormStore((s) => s.allowComments);
  const allowShare = useListFormStore((s) => s.allowShare);
  const specificUsers = useListFormStore((s) => s.specificUsers);

  const setName = useListFormStore((s) => s.setName);
  const setLocation = useListFormStore((s) => s.setLocation);
  const setCategories = useListFormStore((s) => s.setCategories);
  const setNotes = useListFormStore((s) => s.setNotes);
  const setOthersName = useListFormStore((s) => s.setOthersName);
  const setShareOption = useListFormStore((s) => s.setShareOption);
  const setAllowComments = useListFormStore((s) => s.setAllowComments);
  const setAllowShare = useListFormStore((s) => s.setAllowShare);
  const setSpecificUsers = useListFormStore((s) => s.setSpecificUsers);
  const addItem = useListFormStore((s) => s.addItem);
  const updateItem = useListFormStore((s) => s.updateItem);
  const removeItem = useListFormStore((s) => s.removeItem);
  const isDirty = useListFormStore((s) => s.isDirty);

  const [pickModalVisible, setPickModalVisible] = useState(false);
  const [editingPick, setEditingPick] = useState<ListPickDraft | null>(null);
  const [createSelectedUserDetails, setCreateSelectedUserDetails] = useState<
    searchUserDAO[]
  >([]);

  const resolvedSelectedUserDetails = isEditing
    ? selectedUserDetails
    : createSelectedUserDetails;
  const setResolvedSelectedUserDetails = isEditing
    ? setSelectedUserDetails
    : setCreateSelectedUserDetails;

  const isOthersSelected = hasOthersCategory(selectedCategories);

  const locationDefaultValue = location
    ? [location.city, location.region, location.country]
        .filter(Boolean)
        .join(", ")
    : "";

  const selectedServerIds = useMemo(
    () =>
      items
        .map((item) => item.serverItemId)
        .filter((id): id is string => Boolean(id)),
    [items],
  );

  const handleCancel = useCallback(() => {
    if (isDirty()) {
      Alert.alert(t("listForm.discardTitle"), t("listForm.discardMessage"), [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("listForm.discardConfirm"),
          style: "destructive",
          onPress: () => router.back(),
        },
      ]);
      return;
    }
    router.back();
  }, [isDirty, router, t]);

  const isStep1Valid = useMemo(
    () =>
      Boolean(name.trim()) &&
      selectedCategories.length > 0 &&
      (!isOthersSelected || Boolean(others_name.trim())) &&
      Boolean(notes.trim()) &&
      items.length > 0,
    [
      name,
      selectedCategories.length,
      isOthersSelected,
      others_name,
      notes,
      items.length,
    ],
  );

  const isDraftValid = useMemo(() => Boolean(name.trim()), [name]);

  const isStep2Valid = useMemo(
    () =>
      isStep1Valid &&
      (shareOption !== "Specific People" || specificUsers.length > 0),
    [isStep1Valid, shareOption, specificUsers.length],
  );

  const validateStep1 = useCallback((): boolean => {
    if (!name.trim()) {
      showToast({
        type: "error",
        message: t("listForm.validation.nameRequired"),
      });
      return false;
    }
    if (!selectedCategories.length) {
      showToast({
        type: "error",
        message: t("listForm.validation.categoryRequired"),
      });
      return false;
    }
    if (isOthersSelected && !others_name.trim()) {
      showToast({
        type: "error",
        message: t("listForm.validation.othersNameRequired"),
      });
      return false;
    }
    if (!notes.trim()) {
      showToast({
        type: "error",
        message: t("listForm.validation.notesRequired"),
      });
      return false;
    }
    if (!items.length) {
      showToast({
        type: "error",
        message: t("listForm.validation.picksRequired"),
      });
      return false;
    }
    return true;
  }, [
    name,
    selectedCategories.length,
    isOthersSelected,
    others_name,
    notes,
    items.length,
    showToast,
    t,
  ]);

  const handleDraftSave = useCallback(() => {
    const snapshot = items.map((item) => ({ ...item }));
    saveList({ status: "Draft", itemsSnapshot: snapshot });
  }, [items, saveList]);

  const handleContinueToShare = useCallback(() => {
    if (!validateStep1()) return;
    if (isEditing && listId) {
      router.push(`/(app)/(stack)/lists/${listId}/edit/share` as never);
      return;
    }
    router.push("/(app)/(stack)/lists/new/share");
  }, [isEditing, listId, router, validateStep1]);

  const handlePublish = useCallback(() => {
    const snapshot = items.map((item) => ({ ...item }));
    saveList({ status: "Published", itemsSnapshot: snapshot });
  }, [items, saveList]);

  const toggleCategory = (category: ListFormCategory) => {
    const isSelected = selectedCategories.some((c) => c.id === category.id);
    const next = isSelected
      ? selectedCategories.filter((c) => c.id !== category.id)
      : [...selectedCategories, category];
    const stillHasOthers = hasOthersCategory(next);
    setCategories(next);
    if (!stillHasOthers) setOthersName("");
  };

  const openCreatePick = () => {
    setEditingPick(null);
    setPickModalVisible(true);
  };

  const openEditPick = (pick: ListPickDraft) => {
    setEditingPick(pick);
    setPickModalVisible(true);
  };

  const handlePickSubmit = (data: FormSubmitData) => {
    const draft = formSubmitToPickDraft(data, editingPick ?? undefined);
    if (editingPick) {
      updateItem(editingPick.id, draft);
    } else {
      addItem(draft);
    }
    setPickModalVisible(false);
    setEditingPick(null);
  };

  const pickInitialData: ListItemFormInitialData | undefined = editingPick
    ? {
        name:
          editingPick.businessDisplayName ?? editingPick.unverified_business,
        description: editingPick.description,
        tags: editingPick.new_tags,
        images: editingPick.existingImages,
        location: editingPick.location ?? null,
      }
    : undefined;

  const handleAddUser = (user: searchUserDAO) => {
    if (resolvedSelectedUserDetails.some((u) => u.id === user.id)) return;
    const next = [...resolvedSelectedUserDetails, user];
    setResolvedSelectedUserDetails(next);
    setSpecificUsers(next.map((u) => u.id));
  };

  const handleRemoveUser = (userId: string) => {
    const next = resolvedSelectedUserDetails.filter((u) => u.id !== userId);
    setResolvedSelectedUserDetails(next);
    setSpecificUsers(next.map((u) => u.id));
  };

  if (isEditing && isHydrating) {
    return (
      <SafeAreaView
        edges={["bottom"]}
        className="flex-1 items-center justify-center bg-page dark:bg-gray-900"
      >
        <ActivityIndicator size="large" color="#FF6B1A" />
        <Text className="mt-3 font-geist text-sm text-gray-500 dark:text-gray-400">
          {t("common.pleaseWait")}
        </Text>
      </SafeAreaView>
    );
  }

  if (isEditing && hydrationError) {
    return (
      <SafeAreaView
        edges={["bottom"]}
        className="flex-1 items-center justify-center bg-page px-6 dark:bg-gray-900"
      >
        <Text className="text-center font-geist text-sm text-gray-500 dark:text-gray-400">
          {t("listForm.loadError")}
        </Text>
        <View className="mt-4 w-full max-w-xs">
          <LocalNotesButton
            label={t("listForm.back")}
            onPress={() => router.back()}
            variant="light"
          />
        </View>
      </SafeAreaView>
    );
  }

  if (step === 2) {
    return (
      <SafeAreaView
        edges={["bottom"]}
        className="flex-1 bg-page dark:bg-gray-900"
      >
        <PageHeader
          title={t("listForm.shareSettingsTitle")}
          leftChild={
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={8}
              className="h-8 w-8 items-center justify-center cursor-pointer"
            >
              <ChevronLeft size={19} color="#141413" />
            </TouchableOpacity>
          }
        />

        <KeyboardAwareScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24 }}
        >
          <View className="mb-6">
            <Text className="font-geist-bold text-xl text-ink dark:text-gray-100 mt-2">
              {t("listForm.shareHeroTitle")}
            </Text>
            <Text className="mt-1 font-geist text-sm text-gray-500 dark:text-gray-400">
              {t("listForm.shareHeroSubtitle")}
            </Text>
          </View>

          <View className="gap-2">
            {VISIBILITY_OPTIONS.map((option) => {
              const isActive = shareOption === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setShareOption(option.value);
                    if (option.value !== "Specific People") {
                      setSpecificUsers([]);
                      setResolvedSelectedUserDetails([]);
                    }
                  }}
                  className={`flex-row items-center gap-3 rounded-2xl border p-3 cursor-pointer ${
                    isActive
                      ? "border-brand bg-brand-tint/40"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-gray-800">
                    <Text className="text-base">{option.emoji}</Text>
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className="font-geist-medium text-sm text-ink dark:text-gray-100">
                      {t(option.labelKey)}
                    </Text>
                    <Text className="mt-0.5 font-geist text-xs text-gray-500 dark:text-gray-400">
                      {t(option.descriptionKey)}
                    </Text>
                    {option.value === "Specific People" && isActive ? (
                      <ListUserSearchInput
                        selectedUsers={resolvedSelectedUserDetails}
                        onAddUser={handleAddUser}
                        onRemoveUser={handleRemoveUser}
                      />
                    ) : null}
                  </View>
                  <RadioButton selected={isActive} />
                </Pressable>
              );
            })}
          </View>

          <Text className="mb-2 mt-6 font-geist-medium text-sm text-ink dark:text-gray-100">
            {t("listForm.fields.permissions")}
          </Text>
          <View className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
            <View className="flex-row items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <View className="flex-1">
                <Text className="font-geist text-sm text-ink dark:text-gray-100">
                  {t("listForm.fields.allowComments")}
                </Text>
                <Text className="mt-0.5 font-geist text-xs text-gray-500 dark:text-gray-400">
                  {t("listForm.fields.allowCommentsHint")}
                </Text>
              </View>
              <Checkbox checked={allowComments} onChange={setAllowComments} />
            </View>
            <View className="flex-row items-center gap-3 px-4 py-3">
              <View className="flex-1">
                <Text className="font-geist text-sm text-ink dark:text-gray-100">
                  {t("listForm.fields.allowShare")}
                </Text>
                <Text className="mt-0.5 font-geist text-xs text-gray-500 dark:text-gray-400">
                  {t("listForm.fields.allowShareHint")}
                </Text>
              </View>
              <Checkbox checked={allowShare} onChange={setAllowShare} />
            </View>
          </View>
        </KeyboardAwareScrollView>

        <BottomWrapper>
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <LocalNotesButton
                label={t("listForm.back")}
                onPress={() => router.back()}
                variant="light"
              />
            </View>
            <View className="flex-1">
              <LocalNotesButton
                label={
                  isEditing ? t("listForm.updateList") : t("listForm.publishList")
                }
                onPress={handlePublish}
                variant="dark"
                loading={isSaving}
                disabled={!isStep2Valid}
                rightIcon={<ChevronRight size={18} color="#FFFFFF" />}
                className="!bg-brand !border-brand"
              />
            </View>
          </View>
        </BottomWrapper>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["bottom"]}
      className="flex-1 bg-page dark:bg-gray-900"
    >
      <PageHeader
        title={
          isEditing ? t("listForm.editListTitle") : t("listForm.newListTitle")
        }
        leftChild={
          <TouchableOpacity
            onPress={handleCancel}
            hitSlop={8}
            className="cursor-pointer"
          >
            <Text className="font-geist-medium text-sm text-gray-500 dark:text-gray-400">
              {t("listForm.cancel")}
            </Text>
          </TouchableOpacity>
        }
        rightChild={
          <TouchableOpacity
            onPress={handleDraftSave}
            disabled={!isDraftValid || isSaving}
            hitSlop={8}
            className="cursor-pointer"
          >
            <Text
              className={`font-geist-medium text-sm ${
                isDraftValid && !isSaving ? "text-brand" : "text-gray-300 dark:text-gray-600"
              }`}
            >
              {t("listForm.saveDraft")}
            </Text>
          </TouchableOpacity>
        }
      />

      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
      >
        <View className="mb-6 mt-2">
          <Text className="font-geist-bold text-xl text-ink dark:text-gray-100">
            {isEditing ? t("listForm.editHeroTitle") : t("listForm.heroTitle")}{" "}
            {!isEditing ? (
              <Text className="font-fraunces text-xl text-brand">
                {t("listForm.heroTitleItalic")}
              </Text>
            ) : null}
          </Text>
          <Text className="mt-1 font-geist text-sm text-gray-500 dark:text-gray-400">
            {isEditing
              ? t("listForm.editHeroSubtitle")
              : t("listForm.heroSubtitle")}
          </Text>
        </View>

        <View className="gap-5">
          <View>
            <FieldLabel label={t("listForm.fields.listName")} required />
            <TextInput
              placeholder={t("listForm.placeholders.listName")}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Categories */}
          <View>
            <FieldLabel label={t("listForm.fields.category")} required />
            {categoriesLoading ? (
              <Text className="font-geist text-sm text-gray-400">
                {t("common.pleaseWait")}
              </Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {categories.map((category) => (
                    <CategoryChip
                      key={category.id}
                      label={category.name}
                      isSelected={selectedCategories.some(
                        (c) => c.id === category.id,
                      )}
                      onPress={() => toggleCategory(category)}
                    />
                  ))}
                </View>
              </ScrollView>
            )}
          </View>

          {isOthersSelected ? (
            <View>
              <FieldLabel
                label={t("listForm.fields.othersCategory")}
                required
              />
              <TextInput
                placeholder={t("listForm.placeholders.othersCategory")}
                value={others_name}
                onChangeText={setOthersName}
              />
            </View>
          ) : null}

          <View>
            <FieldLabel label={t("listForm.fields.location")} required />
            <LocationInput
              placeholder={t("listForm.placeholders.location")}
              defaultValue={locationDefaultValue}
              onLocationSelected={setLocation}
            />
          </View>

          <View>
            <FieldLabel
              label={t("listForm.fields.introNote")}
              required
              hint={t("listForm.fields.introNoteHint")}
            />
            <TextInput
              placeholder={t("listForm.placeholders.introNote")}
              value={notes}
              onChangeText={setNotes}
              multiline
              maxLength={INTRO_MAX_LENGTH}
            />
          </View>

          <View>
            <FieldLabel
              label={t("listForm.fields.yourPicks")}
              required
              hint={t("listForm.picksStatus", { count: items.length })}
            />
            <View className="gap-2">
              {items.map((pick) => (
                <ListFormPickRow
                  key={pick.id}
                  pick={pick}
                  onEdit={() => openEditPick(pick)}
                  onDelete={() => removeItem(pick.id)}
                />
              ))}
            </View>

            <Pressable
              onPress={openCreatePick}
              className="mt-3 flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 py-3 dark:border-gray-600 cursor-pointer"
            >
              <Plus size={18} color="#FF6B1A" />
              <Text className="font-geist-medium text-sm text-brand">
                {t("profile.picks.addPick")}
              </Text>
            </Pressable>
          </View>

          <View>
            <FieldLabel
              label={t("listForm.fields.addFromPicks")}
              hint={t("listForm.fields.addFromPicksHint")}
            />
            <LinkExistingPicksSection selectedServerIds={selectedServerIds} />
          </View>
        </View>
      </KeyboardAwareScrollView>

      <BottomWrapper>
        <View className="flex-row items-center gap-3">
          <View className="flex-1" />
          <View className="flex-1">
            <LocalNotesButton
              label={t("listForm.next")}
              onPress={handleContinueToShare}
              variant="brand"
              disabled={!isStep1Valid}
              rightIcon={<ChevronRight size={18} color="#FFFFFF" />}
            />
          </View>
        </View>
      </BottomWrapper>

      <ListPickFormModal
        visible={pickModalVisible}
        onClose={() => {
          setPickModalVisible(false);
          setEditingPick(null);
        }}
        onSubmit={handlePickSubmit}
        initialData={pickInitialData}
        isEditing={editingPick !== null}
      />
    </SafeAreaView>
  );
}
