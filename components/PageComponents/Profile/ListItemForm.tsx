import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { CheckCircle } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { TextInput } from "@/components/ui/TextInput";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { Modal } from "@/components/ui/Modal";
import { LocationInput } from "@/components/ui/LocationInput";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { Tags } from "./Tags";
import {
  DEFAULT_MAX_IMAGE_FILES,
  ImageUploadField,
  type UploadedImageFile,
} from "@/components/ui/ImageUploadField";
import businessService from "@/http/business-api/business.service";
import listService from "@/http/list-api/list.service";
import { resolveImageUrl } from "@/utils/httpHelpers";
import { useToastStore } from "@/stores/useToastStore";
import { useCategories } from "@/hooks/useProfileList";
import { hasOthersCategory } from "@/utils/listCategories";
import type { BusinessItemDAO, BusinessLocation } from "@/http/business-api/types";
import type { Location } from "@/http/list-api/types";
import type { RNFile } from "@/http/types";
import type { ListFormCategory } from "@/types/listForm";

export interface FormSubmitData {
  businessId: string;
  unverifiedBusiness?: string;
  displayName?: string;
  tags: string[];
  /** Selected category ids — what the API expects. */
  categories: string[];
  /** Same selection as {id, name} pairs so callers can display labels without a catalog lookup. */
  categoryObjects: ListFormCategory[];
  othersName?: string;
  description: string;
  newFiles: RNFile[];
  location?: Location;
}

export interface ListItemFormInitialData {
  name?: string;
  description?: string;
  tags?: string[];
  /** Category names (not ids) — resolved against the catalog inside the form. */
  categories?: string[];
  othersName?: string;
  images?: { id: string; url: string }[];
  location?: Location | null;
}

interface ListItemFormProps {
  visible: boolean;
  title: string;
  onCancel: () => void;
  onSubmit: (data: FormSubmitData) => void;
  initialData?: ListItemFormInitialData;
  isEditing?: boolean;
  loading?: boolean;
}

function formatLocationText(location: BusinessLocation | Location): string {
  const street =
    "street_address" in location ? location.street_address?.trim() : undefined;
  if (street) {
    return [street, location.city].filter(Boolean).join(", ");
  }
  return [location.city, location.region, location.country].filter(Boolean).join(", ");
}

function toListLocation(location: BusinessLocation): Location {
  return {
    street_address: location.street_address || null,
    postal_code: location.postal_code || null,
    city: location.city,
    region: location.region,
    country: location.country,
    latitude: location.latitude,
    longitude: location.longitude,
  };
}

export function ListItemForm({
  visible,
  title,
  onCancel,
  onSubmit,
  initialData,
  isEditing = false,
  loading = false,
}: ListItemFormProps) {
  const { t } = useTranslation();
  const showToast = useToastStore((s) => s.show);
  const { categories: categoryCatalog } = useCategories();

  const [nameInput, setNameInput] = useState(initialData?.name ?? "");
  const [innerTagInput, setInnerTagInput] = useState("");
  const [innerTags, setInnerTags] = useState<string[]>(initialData?.tags ?? []);
  const [notesInput, setNotesInput] = useState(initialData?.description ?? "");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [othersName, setOthersName] = useState(initialData?.othersName ?? "");
  const categoriesInitialized = useRef(false);
  const [searchResults, setSearchResults] = useState<BusinessItemDAO[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessItemDAO | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [newItemPhotos, setNewItemPhotos] = useState<UploadedImageFile[]>([]);
  const [location, setLocation] = useState<Location | null>(initialData?.location ?? null);
  const [localExistingImages, setLocalExistingImages] = useState<{ id: string; url: string }[]>(
    () =>
      initialData?.images?.map((im) => ({
        id: im.id,
        url: resolveImageUrl(im.url) ?? im.url,
      })) ?? [],
  );
  const [showDeleteImageModal, setShowDeleteImageModal] = useState(false);
  const [pendingDeleteImageId, setPendingDeleteImageId] = useState<string | null>(null);
  const [isDeletingImage, setIsDeletingImage] = useState(false);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRequestIdRef = useRef(0);
  const nameInputRef = useRef(nameInput);
  nameInputRef.current = nameInput;
  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const { height: windowHeight } = useWindowDimensions();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const FORM_CHROME = 160;
  const scrollMaxHeight = Math.round(
    Math.min(
      windowHeight * 0.75 - 100,
      Math.max(windowHeight - keyboardHeight - FORM_CHROME, 200),
    ),
  );

  const clearBusinessSelection = useCallback(() => {
    setSelectedBusiness(null);
    setSelectedBranchId(null);
  }, []);

  // Re-hydrate from initialData whenever the modal opens so create mode is
  // empty (and edit/prefill mode is not stuck on a previous draft).
  useEffect(() => {
    if (!visible) return;

    setNameInput(initialData?.name ?? "");
    setInnerTagInput("");
    setInnerTags(initialData?.tags ?? []);
    setNotesInput(initialData?.description ?? "");
    setOthersName(initialData?.othersName ?? "");
    setSelectedCategoryIds([]);
    setSearchResults([]);
    setIsSearching(false);
    setShowSearchResults(false);
    setSelectedBusiness(null);
    setSelectedBranchId(null);
    setNewItemPhotos([]);
    setLocation(initialData?.location ?? null);
    setLocalExistingImages(
      initialData?.images?.map((im) => ({
        id: im.id,
        url: resolveImageUrl(im.url) ?? im.url,
      })) ?? [],
    );
    setShowDeleteImageModal(false);
    setPendingDeleteImageId(null);
    categoriesInitialized.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-hydrate on open
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      setKeyboardHeight(0);
      return;
    }

    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible]);

  const lockScrollPosition = useCallback(() => {
    const y = scrollYRef.current;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y, animated: false });
    });
  }, []);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollYRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  const searchBusiness = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setShowSearchResults(false);
        setIsSearching(false);
        clearBusinessSelection();
        return;
      }
      const requestId = ++searchRequestIdRef.current;
      setIsSearching(true);
      try {
        const response = await businessService.searchBusiness({ query, match: "name" });
        if (requestId !== searchRequestIdRef.current) return;
        if (query.trim() !== nameInputRef.current.trim()) return;
        const results = response.data?.data ?? [];
        setSearchResults(results);
        setShowSearchResults(results.length > 0);
      } catch {
        if (requestId !== searchRequestIdRef.current) return;
        setSearchResults([]);
        setShowSearchResults(false);
      } finally {
        if (requestId === searchRequestIdRef.current) {
          setIsSearching(false);
        }
      }
    },
    [clearBusinessSelection],
  );

  useEffect(() => {
    if (selectedBusiness && nameInput === selectedBusiness.name) {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      setShowSearchResults(false);
      setIsSearching(false);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      void searchBusiness(nameInput);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [nameInput, searchBusiness, selectedBusiness]);

  // The API/store only give us category names (not ids) — resolve them against the
  // category catalog once it loads so the right chips show as selected.
  // Re-runs when the modal opens (visible) after the hydrate effect clears
  // categoriesInitialized.
  useEffect(() => {
    if (!visible || categoriesInitialized.current || categoryCatalog.length === 0) return;
    const initialCategoryNames = initialData?.categories ?? [];
    const matchedIds = initialCategoryNames
      .map((name) => categoryCatalog.find((c) => c.name.toLowerCase() === name.toLowerCase())?.id)
      .filter((id): id is string => Boolean(id));
    setSelectedCategoryIds(matchedIds);
    categoriesInitialized.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialData read on open / catalog load only
  }, [categoryCatalog, visible]);

  const selectedCategories = categoryCatalog.filter((c) => selectedCategoryIds.includes(c.id));
  const isOthersSelected = hasOthersCategory(selectedCategories);

  const noteWordCount = notesInput.trim() ? notesInput.trim().split(/\s+/).length : 0;

  const branches = selectedBusiness?.branches ?? [];
  const requiresBranchSelection = branches.length > 1;
  const hasBusinessLocation =
    Boolean(selectedBusiness?.location) || branches.length > 0;

  const resolvedBusinessLocation = useMemo((): Location | null => {
    if (!selectedBusiness) return null;

    if (branches.length > 0) {
      const branch =
        branches.find((b) => b.id === selectedBranchId) ??
        (branches.length === 1 ? branches[0] : undefined);
      return branch ? toListLocation(branch.location) : null;
    }

    if (selectedBusiness.location) {
      return toListLocation(selectedBusiness.location);
    }

    return null;
  }, [selectedBusiness, selectedBranchId, branches]);

  const resolvedLocationDisplay = resolvedBusinessLocation
    ? formatLocationText(resolvedBusinessLocation)
    : "";

  const handleBusinessSelect = (business: BusinessItemDAO) => {
    setSelectedBusiness(business);
    setNameInput(business.name);
    setShowSearchResults(false);
    setSearchResults([]);

    const businessBranches = business.branches ?? [];
    if (businessBranches.length === 1) {
      setSelectedBranchId(businessBranches[0]!.id);
    } else {
      setSelectedBranchId(null);
    }
  };

  const handleAddInnerTag = () => {
    const trimmed = innerTagInput.trim();
    if (trimmed && !innerTags.includes(trimmed)) {
      setInnerTags([...innerTags, trimmed]);
      setInnerTagInput("");
    }
  };

  const appendNewPickFiles = (files: RNFile[]) => {
    if (!files.length) return;
    setNewItemPhotos((prev) => [...prev, ...files.map((file) => ({ uri: file.uri, file }))]);
  };

  const confirmDeleteExistingImage = async () => {
    if (!pendingDeleteImageId) return;
    const imageId = pendingDeleteImageId;
    setIsDeletingImage(true);
    try {
      const { error } = await listService.deleteListImage(imageId);
      if (error) {
        showToast({ type: "error", message: error.message ?? t("profile.picks.deletePhotoError") });
        return;
      }
      setLocalExistingImages((prev) => prev.filter((im) => im.id !== imageId));
      setShowDeleteImageModal(false);
      setPendingDeleteImageId(null);
    } finally {
      setIsDeletingImage(false);
    }
  };

  const locationDisplayValue = location
    ? location.street_address?.trim() ||
      [location.city, location.region, location.country].filter(Boolean).join(", ")
    : "";

  const branchSelectionMissing = requiresBranchSelection && !selectedBranchId;

  const handleSubmit = () => {
    if (!nameInput.trim()) {
      showToast({ type: "error", message: t("profile.picks.businessRequired") });
      return;
    }
    if (selectedCategoryIds.length === 0) {
      showToast({ type: "error", message: t("profile.picks.categoryRequired") });
      return;
    }
    if (isOthersSelected && !othersName.trim()) {
      showToast({ type: "error", message: t("profile.picks.othersNameRequired") });
      return;
    }
    if (branchSelectionMissing) {
      showToast({ type: "error", message: t("profile.picks.branchRequired") });
      return;
    }
    onSubmit({
      businessId: selectedBusiness ? selectedBusiness.id : "",
      unverifiedBusiness: selectedBusiness ? undefined : nameInput.trim(),
      displayName: nameInput.trim(),
      tags: innerTags,
      categories: selectedCategoryIds,
      categoryObjects: selectedCategories.map((c) => ({ id: c.id, name: c.name })),
      othersName: isOthersSelected ? othersName.trim() : undefined,
      description: notesInput.trim(),
      newFiles: newItemPhotos.map((p) => p.file),
      location: resolvedBusinessLocation ?? location ?? undefined,
    });
  };

  return (
    <Modal
      visible={visible}
      onClose={onCancel}
      title={title}
      position="bottom"
      avoidKeyboard={false}
      footer={
        <LocalNotesButton
          label={isEditing ? t("common.save") : t("profile.picks.savePick")}
          onPress={handleSubmit}
          variant="dark"
          disabled={
            !nameInput.trim() || selectedCategoryIds.length === 0 || branchSelectionMissing
          }
          loading={loading}
        />
      }
    >
      <View style={{ height: scrollMaxHeight }}>
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={false}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          contentContainerStyle={{ paddingBottom: 88 }}
        >
          <View className="gap-4 pb-6">
          <View className="relative">
            <TextInput
              label={t("profile.picks.nameLabel")}
              placeholder={t("profile.picks.namePlaceholder")}
              value={nameInput}
              maxLength={80}
              onChangeText={(value) => {
                setNameInput(value);
                if (selectedBusiness && value !== selectedBusiness.name) {
                  clearBusinessSelection();
                }
              }}
              onFocus={() => {
                if (
                  !selectedBusiness &&
                  nameInput.trim() &&
                  searchResults.length > 0
                ) {
                  setShowSearchResults(true);
                }
                lockScrollPosition();
              }}
            />
            {!selectedBusiness && showSearchResults && searchResults.length > 0 && (
              <View className="mt-1 max-h-48 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
                {isSearching ? (
                  <View className="px-4 py-3">
                    <ActivityIndicator size="small" color="#FF6B1A" />
                  </View>
                ) : (
                  searchResults.map((business) => (
                    <Pressable
                      key={business.id}
                      onPress={() => handleBusinessSelect(business)}
                      className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 cursor-pointer"
                    >
                      <Text className="font-geist-medium text-sm text-ink dark:text-gray-100">
                        {business.name}
                      </Text>
                      <Text className="text-xs text-gray-500 dark:text-gray-400">
                        {business.contact_email || t("profile.picks.noContactInfo")}
                      </Text>
                    </Pressable>
                  ))
                )}
              </View>
            )}
          </View>

          <View>
            <FieldLabel label={t("profile.picks.categoryLabel")} required />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {categoryCatalog.map((category) => (
                  <CategoryChip
                    key={category.id}
                    label={category.name}
                    isSelected={selectedCategoryIds.includes(category.id)}
                    onPress={() => {
                      const isSelected = selectedCategoryIds.includes(category.id);
                      const next = isSelected
                        ? selectedCategoryIds.filter((id) => id !== category.id)
                        : [...selectedCategoryIds, category.id];
                      setSelectedCategoryIds(next);
                      const stillHasOthers = hasOthersCategory(
                        categoryCatalog.filter((c) => next.includes(c.id)),
                      );
                      if (!stillHasOthers) setOthersName("");
                    }}
                  />
                ))}
              </View>
            </ScrollView>
          </View>

          {isOthersSelected ? (
            <TextInput
              label={t("profile.picks.othersCategoryLabel")}
              placeholder={t("profile.picks.othersCategoryPlaceholder")}
              value={othersName}
              onChangeText={setOthersName}
            />
          ) : null}

          <TextInput
            label={t("profile.picks.descriptionLabel")}
            placeholder={t("profile.picks.descriptionPlaceholder")}
            value={notesInput}
            maxLength={180}
            multiline
            onChangeText={setNotesInput}
            onFocus={lockScrollPosition}
          />
          <Text className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
            {noteWordCount} / 25 {t("profile.picks.words")}
          </Text>

          {requiresBranchSelection ? (
            <View>
              <FieldLabel label={t("profile.picks.selectBranch")} required />
              <View className="mt-1 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {branches.map((branch) => {
                  const isSelected = selectedBranchId === branch.id;
                  return (
                    <Pressable
                      key={branch.id}
                      onPress={() => setSelectedBranchId(branch.id)}
                      className={`px-4 py-2 border-b border-gray-100 dark:border-gray-700 cursor-pointer ${
                        isSelected ? "bg-soft dark:bg-gray-700" : "bg-white dark:bg-gray-800"
                      }`}
                    >
                      <Text className="font-geist-medium text-sm text-ink dark:text-gray-100">
                        {branch.name}
                      </Text>
                      <Text className="text-xs text-gray-500 dark:text-gray-400">
                        {formatLocationText(branch.location)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {resolvedLocationDisplay ? (
            <View>
              <FieldLabel label={t("profile.picks.businessLocationLabel")} />
              <Text className="mt-1 font-geist text-sm text-ink dark:text-gray-100">
                {resolvedLocationDisplay}
              </Text>
            </View>
          ) : !hasBusinessLocation ? (
            <LocationInput
              placeholder={t("profile.picks.locationOptional")}
              defaultValue={locationDisplayValue}
              onLocationSelected={setLocation}
            />
          ) : null}

          <Tags
            innerTags={innerTags}
            innerTagInput={innerTagInput}
            onInnerTagInputChange={setInnerTagInput}
            onAddInnerTag={handleAddInnerTag}
            onRemoveInnerTag={(tag) => setInnerTags(innerTags.filter((t) => t !== tag))}
          />

          <ImageUploadField
            label={t("profile.picks.photos")}
            required={false}
            maxFiles={DEFAULT_MAX_IMAGE_FILES}
            existingImages={localExistingImages}
            onRemoveExisting={
              isEditing
                ? (id) => {
                    setPendingDeleteImageId(id);
                    setShowDeleteImageModal(true);
                  }
                : undefined
            }
            newFiles={newItemPhotos}
            onAppendNewFiles={appendNewPickFiles}
            onRemoveNewAt={(index) =>
              setNewItemPhotos((prev) => prev.filter((_, i) => i !== index))
            }
          />

          {selectedBusiness && (
            <View className="flex-row items-center gap-2 rounded-md bg-blue-50 dark:bg-blue-950/30 px-3 py-2">
              <CheckCircle size={16} color="#2563EB" />
              <Text className="text-sm text-blue-700 dark:text-blue-300">
                {t("profile.picks.verifiedBusiness", { name: selectedBusiness.name })}
              </Text>
            </View>
          )}
          </View>
        </ScrollView>
      </View>

      <ConfirmDeleteModal
        visible={showDeleteImageModal}
        onClose={() => {
          if (!isDeletingImage) {
            setShowDeleteImageModal(false);
            setPendingDeleteImageId(null);
          }
        }}
        onConfirm={() => void confirmDeleteExistingImage()}
        isLoading={isDeletingImage}
        title={t("profile.picks.deletePhotoTitle")}
        message={t("profile.picks.deletePhotoMessage")}
      />
    </Modal>
  );
}
