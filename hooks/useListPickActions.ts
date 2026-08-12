import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { FormSubmitData } from '@/components/PageComponents/Profile/ListItemForm';
import listService from '@/http/list-api/list.service';
import type { Item, ListItemPublic } from '@/http/list-api/types';
import { useCategories } from '@/hooks/useProfileList';
import { useListFormStore, type ListFormMode } from '@/stores/useListFormStore';
import { useToastStore } from '@/stores/useToastStore';
import {
  formSubmitToPickDraft,
  mapApiItemToPickDraft,
} from '@/utils/listPickMappers';
import type { ListPickDraft } from '@/types/listForm';

function mapPublicToItemShape(pick: ListItemPublic): Item {
  return {
    id: pick.id,
    business: pick.business_id
      ? {
          id: pick.business_id,
          name: pick.business_name ?? '',
          status: '',
          business_type: '',
          contact_email: '',
        }
      : null,
    unverified_business:
      !pick.is_verified && pick.business_name
        ? { id: pick.id, name: pick.business_name }
        : null,
    tags: pick.tags,
    categories: pick.categories,
    others_name: pick.others_name,
    description: pick.description,
    account: pick.owner.id,
    owner: pick.owner,
    images: pick.images,
    location: pick.location ?? undefined,
    is_favorite: pick.is_favorite,
  };
}

export function useListPickActions(mode: ListFormMode) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.show);
  const { categories: categoryCatalog } = useCategories();
  const [isSubmittingPick, setIsSubmittingPick] = useState(false);

  const invalidatePickQueries = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['profile-picks'] });
  }, [queryClient]);

  const submitPick = useCallback(
    async (data: FormSubmitData, editingPick?: ListPickDraft | null) => {
      setIsSubmittingPick(true);
      try {
        if (editingPick?.serverItemId) {
          const preserveVerifiedLink =
            Boolean(editingPick.business) &&
            !data.businessId &&
            data.unverifiedBusiness === editingPick.businessDisplayName;

          const { data: response, error } = await listService.updateListItem(
            editingPick.serverItemId,
            {
              description: data.description,
              ...(data.businessId ? { business: data.businessId } : {}),
              ...(data.tags.length ? { new_tags: data.tags } : {}),
              categories: data.categories,
              ...(data.othersName ? { others_name: data.othersName } : {}),
              ...(!preserveVerifiedLink && data.unverifiedBusiness
                ? { unverified_business: data.unverifiedBusiness }
                : {}),
              ...(data.location !== undefined ? { location: data.location } : {}),
            },
          );

          if (error) {
            showToast({
              type: 'error',
              message: error.message ?? t('profile.picks.updateError'),
            });
            throw new Error(error.message ?? t('profile.picks.updateError'));
          }

          if (data.newFiles.length) {
            await Promise.all(
              data.newFiles.map((file) =>
                listService.uploadListItemImage(file, editingPick.serverItemId!),
              ),
            );
          }

          const updated = response?.data;
          const draft = updated
            ? {
                ...mapApiItemToPickDraft(
                  mapPublicToItemShape(updated),
                  categoryCatalog,
                ),
                id: editingPick.id,
                linkedFromLibrary: editingPick.linkedFromLibrary,
                owner: editingPick.owner,
                ownerPersonalityColor: editingPick.ownerPersonalityColor,
              }
            : {
                ...formSubmitToPickDraft(data, editingPick),
                newFiles: undefined,
              };

          useListFormStore.getState().updateItem(mode, editingPick.id, draft);
          invalidatePickQueries();
          return;
        }

        const { data: response, error } = await listService.createListItem({
          description: data.description,
          ...(data.businessId ? { business: data.businessId } : {}),
          ...(data.tags.length ? { new_tags: data.tags } : {}),
          categories: data.categories,
          ...(data.othersName ? { others_name: data.othersName } : {}),
          ...(data.unverifiedBusiness
            ? { unverified_business: data.unverifiedBusiness }
            : {}),
          ...(data.location ? { location: data.location } : {}),
        });

        if (error) {
          showToast({
            type: 'error',
            message: error.message ?? t('profile.picks.createError'),
          });
          throw new Error(error.message ?? t('profile.picks.createError'));
        }

        const created = response?.data;
        if (!created?.id) {
          showToast({
            type: 'error',
            message: t('profile.picks.createError'),
          });
          throw new Error(t('profile.picks.createError'));
        }

        if (data.newFiles.length) {
          await Promise.all(
            data.newFiles.map((file) =>
              listService.uploadListItemImage(file, created.id),
            ),
          );
        }

        let itemForDraft = created;
        if (data.newFiles.length) {
          const refreshed = await listService.fetchListItem(created.id);
          if (refreshed.data?.data) {
            itemForDraft = mapPublicToItemShape(refreshed.data.data);
          }
        }

        const draft: ListPickDraft = {
          ...mapApiItemToPickDraft(itemForDraft, categoryCatalog),
          ...(editingPick ? { id: editingPick.id } : {}),
          linkedFromLibrary: false,
          // Prefer form category objects when API names didn't resolve against catalog.
          categories:
            data.categoryObjects.length > 0
              ? data.categoryObjects
              : mapApiItemToPickDraft(itemForDraft, categoryCatalog).categories,
        };

        if (editingPick) {
          useListFormStore.getState().updateItem(mode, editingPick.id, draft);
        } else {
          useListFormStore.getState().addItem(mode, draft);
        }
        invalidatePickQueries();
      } finally {
        setIsSubmittingPick(false);
      }
    },
    [categoryCatalog, invalidatePickQueries, mode, showToast, t],
  );

  return {
    submitPick,
    isSubmittingPick,
  };
}
