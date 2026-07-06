import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, useWindowDimensions, View } from "react-native";
import { KeyboardAwareScrollView } from "@/components/ui/KeyboardAwareScrollView";
import { CheckCircle } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { TextInput } from "@/components/ui/TextInput";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { Modal } from "@/components/ui/Modal";
import { LocationInput } from "@/components/ui/LocationInput";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
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
import type { BusinessItemDAO } from "@/http/business-api/types";
import type { Location } from "@/http/list-api/types";
import type { RNFile } from "@/http/types";

export interface FormSubmitData {
  businessId: string;
  unverifiedBusiness?: string;
  displayName?: string;
  tags: string[];
  description: string;
  newFiles: RNFile[];
  location?: Location;
}

export interface ListItemFormInitialData {
  name?: string;
  description?: string;
  tags?: string[];
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

  const [nameInput, setNameInput] = useState(initialData?.name ?? "");
  const [innerTagInput, setInnerTagInput] = useState("");
  const [innerTags, setInnerTags] = useState<string[]>(initialData?.tags ?? []);
  const [notesInput, setNotesInput] = useState(initialData?.description ?? "");
  const [searchResults, setSearchResults] = useState<BusinessItemDAO[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessItemDAO | null>(null);
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
  const { height: windowHeight } = useWindowDimensions();
  const scrollMaxHeight = Math.round(windowHeight * 0.75 - 100);

  const searchBusiness = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearching(false);
      setSelectedBusiness(null);
      return;
    }
    setIsSearching(true);
    try {
      const response = await businessService.searchBusiness({ query });
      const results = response.data?.data ?? [];
      setSearchResults(results);
      setShowSearchResults(results.length > 0);
    } catch {
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      void searchBusiness(nameInput);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [nameInput, searchBusiness]);

  const noteWordCount = notesInput.trim() ? notesInput.trim().split(/\s+/).length : 0;

  const handleBusinessSelect = (business: BusinessItemDAO) => {
    setSelectedBusiness(business);
    setNameInput(business.name);
    setShowSearchResults(false);
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
    ? [location.city, location.region, location.country].filter(Boolean).join(", ")
    : "";

  const handleSubmit = () => {
    if (!nameInput.trim()) {
      showToast({ type: "error", message: t("profile.picks.businessRequired") });
      return;
    }
    onSubmit({
      businessId: selectedBusiness ? selectedBusiness.id : "",
      unverifiedBusiness: selectedBusiness ? undefined : nameInput.trim(),
      displayName: nameInput.trim(),
      tags: innerTags,
      description: notesInput.trim(),
      newFiles: newItemPhotos.map((p) => p.file),
      location: location ?? undefined,
    });
  };

  return (
    <Modal
      visible={visible}
      onClose={onCancel}
      title={title}
      position="bottom"
      footer={
        <LocalNotesButton
          label={isEditing ? t("common.save") : t("profile.picks.savePick")}
          onPress={handleSubmit}
          variant="dark"
          disabled={!nameInput.trim()}
          loading={loading}
        />
      }
    >
      <KeyboardAwareScrollView
        scrollToFocusedInput
        style={{ maxHeight: scrollMaxHeight }}
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
                setSelectedBusiness(null);
              }
            }}
            onFocus={() => {
              if (nameInput.trim() && searchResults.length > 0) setShowSearchResults(true);
            }}
          />
          {showSearchResults && searchResults.length > 0 && (
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

        <TextInput
          label={t("profile.picks.descriptionLabel")}
          placeholder={t("profile.picks.descriptionPlaceholder")}
          value={notesInput}
          maxLength={180}
          multiline
          onChangeText={setNotesInput}
        />
        <Text className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
          {noteWordCount} / 25 {t("profile.picks.words")}
        </Text>

        <LocationInput
          placeholder={t("profile.picks.locationOptional")}
          defaultValue={locationDisplayValue}
          onLocationSelected={setLocation}
        />

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
      </KeyboardAwareScrollView>

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
