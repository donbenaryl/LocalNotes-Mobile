import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { ChevronDown, Video, X } from 'lucide-react-native';
import { PageHeader } from '@/components/ui/PageHeader';
import { BottomWrapper } from '@/components/ui/BottomWrapper';
import { KeyboardAwareScrollView } from '@/components/ui/KeyboardAwareScrollView';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { TextInput } from '@/components/ui/TextInput';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { DropDown } from '@/components/ui/DropDown';
import {
  ImageUploadField,
  type UploadedImageFile,
} from '@/components/ui/ImageUploadField';
import { useToastStore } from '@/stores/useToastStore';
import { useBusinessStore } from '@/stores/useBusinessStore';
import notesService from '@/http/notes-api/notes.service';
import type { Visibility } from '@/http/notes-api/types';
import type { RNFile } from '@/http/types';
import { EXPIRE_OPTIONS, type ExpireAfter } from '@/constants/expire';
import { VISIBILITY_OPTIONS } from '@/constants/visibility';
import { getExpiresAt } from '@/utils/expire';
import { isOthersCategoryName } from '@/utils/listCategories';
import { cn } from '@/utils/cn';

const CONTENT_MAX = 280;
const FORM_FOOTER_OFFSET = 120;

type ActivePicker = 'expire' | 'visibility' | null;

interface FormErrors {
  title?: string;
  content?: string;
  expireAfter?: string;
  visibility?: string;
  othersName?: string;
}

export function OfferForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.show);
  const businessId = useBusinessStore((s) => s.businessId);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [othersName, setOthersName] = useState('');
  const [expireAfter, setExpireAfter] = useState<ExpireAfter | ''>('');
  const [visibility, setVisibility] = useState<Visibility | ''>('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<UploadedImageFile[]>([]);
  const [videoFile, setVideoFile] = useState<RNFile | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);

  const categoriesQuery = useQuery({
    queryKey: ['note-categories'],
    queryFn: async () => {
      const response = await notesService.fetchNoteCategories();
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data?.data ?? [];
    },
  });

  const categories = categoriesQuery.data ?? [];

  const isOthersSelected = useMemo(
    () =>
      selectedCategoryIds.some((id) => {
        const cat = categories.find((c) => c.id === id);
        return isOthersCategoryName(cat?.name ?? '');
      }),
    [categories, selectedCategoryIds],
  );

  useEffect(() => {
    if (!isOthersSelected) {
      setOthersName('');
      setErrors((prev) => {
        if (!prev.othersName) return prev;
        const next = { ...prev };
        delete next.othersName;
        return next;
      });
    }
  }, [isOthersSelected]);

  const expireOptions = useMemo(
    () =>
      EXPIRE_OPTIONS.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      })),
    [t],
  );

  const visibilityOptions = useMemo(
    () =>
      VISIBILITY_OPTIONS.filter((option) => option.value !== 'Specific People').map(
        (option) => ({
          value: option.value,
          label: t(option.labelKey),
        }),
      ),
    [t],
  );

  const expireLabel =
    expireOptions.find((option) => option.value === expireAfter)?.label ?? '';
  const visibilityLabel =
    visibilityOptions.find((option) => option.value === visibility)?.label ?? '';

  const toggleCategory = useCallback((categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  }, []);

  const pickVideo = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      quality: 1,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const ext = asset.uri.split('.').pop() ?? 'mp4';
    setVideoFile({
      uri: asset.uri,
      name: `video.${ext}`,
      type: asset.mimeType ?? `video/${ext}`,
    });
    setErrors((prev) => {
      if (!prev.content) return prev;
      const next = { ...prev };
      delete next.content;
      return next;
    });
  }, []);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!businessId) {
        throw new Error(t('offerForm.validation.businessRequired'));
      }
      if (!expireAfter || !visibility) {
        throw new Error(t('offerForm.error'));
      }

      const trimmedOthers = othersName.trim();
      const response = await notesService.createNote({
        title: title.trim(),
        description: content.trim(),
        expires_at: getExpiresAt(expireAfter),
        visibility,
        business_id: businessId,
        category_ids: selectedCategoryIds,
        ...(isOthersSelected && trimmedOthers
          ? { others_name: trimmedOthers }
          : {}),
      });

      if (response.error) {
        throw new Error(response.error.message || t('offerForm.error'));
      }

      const created = response.data?.data;
      if (!created?.id) {
        throw new Error(t('offerForm.error'));
      }

      let mediaFailed = false;
      if (imageFiles[0]?.file) {
        const imageRes = await notesService.uploadNoteImage(
          created.id,
          imageFiles[0].file,
        );
        if (imageRes.error) mediaFailed = true;
      }
      if (videoFile) {
        const videoRes = await notesService.uploadNoteVideo(created.id, videoFile);
        if (videoRes.error) mediaFailed = true;
      }

      return { mediaFailed };
    },
    onSuccess: async ({ mediaFailed }) => {
      await queryClient.invalidateQueries({ queryKey: ['offers-feed'] });
      showToast({
        type: mediaFailed ? 'error' : 'success',
        message: mediaFailed ? t('offerForm.mediaError') : t('offerForm.success'),
      });
      router.back();
    },
    onError: (error: Error) => {
      showToast({
        type: 'error',
        message: error.message || t('offerForm.error'),
      });
    },
  });

  const validate = (): boolean => {
    const next: FormErrors = {};
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    const hasMediaOrContent =
      imageFiles.length > 0 || videoFile != null || trimmedContent.length > 0;

    if (!trimmedTitle) {
      next.title = t('offerForm.validation.titleRequired');
    }
    if (!hasMediaOrContent) {
      next.content = t('offerForm.validation.contentOrMediaRequired');
    } else if (trimmedContent.length > CONTENT_MAX) {
      next.content = t('offerForm.validation.contentMaxLength', {
        max: CONTENT_MAX,
      });
    }
    if (!expireAfter) {
      next.expireAfter = t('offerForm.validation.expireRequired');
    }
    if (!visibility) {
      next.visibility = t('offerForm.validation.visibilityRequired');
    }
    if (isOthersSelected && !othersName.trim()) {
      next.othersName = t('offerForm.validation.othersNameRequired');
    }
    if (!businessId) {
      showToast({
        type: 'error',
        message: t('offerForm.validation.businessRequired'),
      });
      setErrors(next);
      return false;
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePublish = () => {
    if (!validate()) return;
    createMutation.mutate();
  };

  return (
    <SafeAreaView
      edges={['bottom']}
      className="flex-1 bg-page dark:bg-gray-900"
    >
      <PageHeader title={t('offerForm.title')} />

      <KeyboardAwareScrollView
        className="flex-1"
        bottomOffset={FORM_FOOTER_OFFSET}
        contentContainerClassName="px-4 pb-32 pt-4"
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-5">
          <TextInput
            label={t('offerForm.fields.title')}
            required
            placeholder={t('offerForm.placeholders.title')}
            value={title}
            onChangeText={(value) => {
              setTitle(value);
              if (errors.title) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.title;
                  return next;
                });
              }
            }}
            error={errors.title}
          />

          {categoriesQuery.isPending ? (
            <View className="gap-2">
              <FieldLabel
                label={t('offerForm.fields.categories')}
                hint={t('offerForm.fields.categoriesHint')}
              />
              <ActivityIndicator color="#FF6B1A" />
            </View>
          ) : categories.length > 0 ? (
            <View>
              <FieldLabel
                label={t('offerForm.fields.categories')}
                hint={t('offerForm.fields.categoriesHint')}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {categories.map((category) => (
                    <CategoryChip
                      key={category.id}
                      label={category.name}
                      isSelected={selectedCategoryIds.includes(category.id)}
                      onPress={() => toggleCategory(category.id)}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>
          ) : null}

          {isOthersSelected ? (
            <TextInput
              label={t('offerForm.fields.othersCategory')}
              required
              placeholder={t('offerForm.placeholders.othersCategory')}
              value={othersName}
              onChangeText={(value) => {
                setOthersName(value);
                if (errors.othersName) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.othersName;
                    return next;
                  });
                }
              }}
              error={errors.othersName}
            />
          ) : null}

          <View>
            <FieldLabel label={t('offerForm.fields.expireAfter')} required />
            <Pressable
              onPress={() => setActivePicker('expire')}
              accessibilityRole="button"
              className={cn(
                'h-14 flex-row items-center rounded-xl border bg-gray-50 px-4 dark:bg-gray-800 cursor-pointer',
                errors.expireAfter
                  ? 'border-error'
                  : 'border-gray-100 dark:border-gray-700',
              )}
            >
              <Text
                className={cn(
                  'flex-1 font-geist text-base',
                  expireAfter
                    ? 'text-ink dark:text-gray-100'
                    : 'text-gray-400 dark:text-gray-500',
                )}
              >
                {expireLabel || t('offerForm.placeholders.expireAfter')}
              </Text>
              <ChevronDown size={18} color="#9CA3AF" />
            </Pressable>
            {errors.expireAfter ? (
              <Text className="mt-1 font-geist text-xs text-error">
                {errors.expireAfter}
              </Text>
            ) : null}
          </View>

          <View>
            <FieldLabel label={t('offerForm.fields.visibility')} required />
            <Pressable
              onPress={() => setActivePicker('visibility')}
              accessibilityRole="button"
              className={cn(
                'h-14 flex-row items-center rounded-xl border bg-gray-50 px-4 dark:bg-gray-800 cursor-pointer',
                errors.visibility
                  ? 'border-error'
                  : 'border-gray-100 dark:border-gray-700',
              )}
            >
              <Text
                className={cn(
                  'flex-1 font-geist text-base',
                  visibility
                    ? 'text-ink dark:text-gray-100'
                    : 'text-gray-400 dark:text-gray-500',
                )}
              >
                {visibilityLabel || t('offerForm.placeholders.visibility')}
              </Text>
              <ChevronDown size={18} color="#9CA3AF" />
            </Pressable>
            {errors.visibility ? (
              <Text className="mt-1 font-geist text-xs text-error">
                {errors.visibility}
              </Text>
            ) : null}
          </View>

          <TextInput
            label={t('offerForm.fields.content')}
            placeholder={t('offerForm.placeholders.content')}
            value={content}
            onChangeText={(value) => {
              setContent(value);
              if (errors.content) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.content;
                  return next;
                });
              }
            }}
            multiline
            maxLength={CONTENT_MAX}
            error={errors.content}
          />

          <ImageUploadField
            label={t('offerForm.fields.image')}
            helperText={t('offerForm.helpers.mediaRequired')}
            maxFiles={1}
            newFiles={imageFiles}
            onAppendNewFiles={(files) => {
              setImageFiles(
                files.map((file) => ({
                  uri: file.uri,
                  file,
                })),
              );
              setErrors((prev) => {
                if (!prev.content) return prev;
                const next = { ...prev };
                delete next.content;
                return next;
              });
            }}
            onRemoveNewAt={() => setImageFiles([])}
          />

          <View className="gap-2">
            <Text className="font-geist-medium text-sm text-gray-700 dark:text-gray-300">
              {t('offerForm.fields.video')}
            </Text>
            {videoFile ? (
              <View className="relative h-20 w-full flex-row items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 dark:border-gray-700 dark:bg-gray-800">
                <Video size={22} color="#FF6B1A" />
                <Text
                  className="flex-1 font-geist text-sm text-ink dark:text-gray-100"
                  numberOfLines={1}
                >
                  {videoFile.name}
                </Text>
                <Pressable
                  onPress={() => setVideoFile(null)}
                  accessibilityRole="button"
                  accessibilityLabel={t('offerForm.helpers.removeVideo')}
                  className="h-8 w-8 items-center justify-center rounded-full bg-ink cursor-pointer"
                >
                  <X size={14} color="#FFF" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => void pickVideo()}
                accessibilityRole="button"
                className="h-20 items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-gray-600 cursor-pointer"
              >
                <Video size={24} color="#9CA3AF" />
                <Text className="mt-1 font-geist text-xs text-gray-500 dark:text-gray-400">
                  {t('offerForm.helpers.chooseVideo')}
                </Text>
              </Pressable>
            )}
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {t('offerForm.helpers.videoFormats')}
            </Text>
          </View>
        </View>
      </KeyboardAwareScrollView>

      <KeyboardStickyView
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}
      >
        <BottomWrapper style={{ position: 'relative' }}>
          <LocalNotesButton
            label={
              createMutation.isPending
                ? t('offerForm.publishing')
                : t('offerForm.publish')
            }
            variant="brand"
            loading={createMutation.isPending}
            disabled={createMutation.isPending}
            onPress={handlePublish}
            isWidthFull
          />
        </BottomWrapper>
      </KeyboardStickyView>

      <DropDown
        visible={activePicker === 'expire'}
        selected={expireAfter}
        options={expireOptions}
        onApply={(value) => {
          setExpireAfter(value as ExpireAfter);
          setErrors((prev) => {
            if (!prev.expireAfter) return prev;
            const next = { ...prev };
            delete next.expireAfter;
            return next;
          });
        }}
        onClose={() => setActivePicker(null)}
      />

      <DropDown
        visible={activePicker === 'visibility'}
        selected={visibility}
        options={visibilityOptions}
        onApply={(value) => {
          setVisibility(value as Visibility);
          setErrors((prev) => {
            if (!prev.visibility) return prev;
            const next = { ...prev };
            delete next.visibility;
            return next;
          });
        }}
        onClose={() => setActivePicker(null)}
      />
    </SafeAreaView>
  );
}
