import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import listService from '@/http/list-api/list.service';
import type { CreateListDTO } from '@/http/list-api/types';
import { useListFormStore } from '@/stores/useListFormStore';
import { useToastStore } from '@/stores/useToastStore';
import { itemsPayloadForApi } from '@/utils/listPickMappers';
import { flushListPickImages } from '@/utils/flushListPickImages';
import type { ListPickDraft } from '@/types/listForm';

const OTHERS_CATEGORY_NAME = 'Others';

function hasOthersCategory(
  categories: { name?: string }[] | undefined,
): boolean {
  return Boolean(
    categories?.some(
      (c) => c.name?.trim().toLowerCase() === OTHERS_CATEGORY_NAME.toLowerCase(),
    ),
  );
}

function buildPayload(status: 'Draft' | 'Published'): CreateListDTO {
  const state = useListFormStore.getState();
  const loc = state.location;
  const hasMeaningfulLocation = Boolean(
    loc && (loc.city?.trim() || loc.country?.trim()),
  );
  const isOthersSelected = hasOthersCategory(state.categories);
  const othersNameValue = state.others_name.trim();

  return {
    items: itemsPayloadForApi(state.items),
    name: state.name,
    categories: state.categories.map((c) => c.id).filter(Boolean),
    ...(hasMeaningfulLocation && loc ? { location: loc } : {}),
    notes: state.notes,
    privacy: state.shareOption,
    others_can_share: state.allowShare,
    others_can_comment: state.allowComments,
    shared_with: state.specificUsers,
    ...(isOthersSelected && othersNameValue ? { others_name: othersNameValue } : {}),
    status,
  };
}

interface SaveListOptions {
  status: 'Draft' | 'Published';
  itemsSnapshot: ListPickDraft[];
}

export function useListCreate(listId?: string) {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.show);
  const reset = useListFormStore((s) => s.reset);
  const isEditing = Boolean(listId);

  const mutation = useMutation({
    mutationFn: async ({ status, itemsSnapshot }: SaveListOptions) => {
      const payload = buildPayload(status);
      const response = isEditing
        ? await listService.updateList(listId!, payload)
        : await listService.createList(payload);

      if (response.error) {
        throw new Error(response.error.message ?? 'Failed to save list');
      }

      const list = response.data?.data;
      if (list?.items?.length) {
        await flushListPickImages(list.items, itemsSnapshot);
      }
      return list;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['profile-lists'] });
      if (listId) {
        void queryClient.invalidateQueries({ queryKey: ['list-detail', listId] });
        queryClient.removeQueries({ queryKey: ['list-edit', listId] });
      }
      reset();
      showToast({
        type: 'success',
        message:
          variables.status === 'Draft'
            ? t('listForm.draftSaved')
            : isEditing
              ? t('listForm.updateSuccess')
              : t('listForm.publishSuccess'),
      });
      if (isEditing) {
        router.replace(`/(app)/(stack)/lists/${listId}` as never);
      } else {
        router.replace('/(app)/(stack)/profile');
      }
    },
    onError: (error, variables) => {
      showToast({
        type: 'error',
        message:
          variables.status === 'Draft'
            ? t('listForm.draftError')
            : error instanceof Error
              ? error.message
              : isEditing
                ? t('listForm.updateError')
                : t('listForm.publishError'),
      });
    },
  });

  return {
    saveList: mutation.mutate,
    saveListAsync: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}
