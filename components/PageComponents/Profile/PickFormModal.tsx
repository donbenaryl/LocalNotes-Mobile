import { useState } from "react";
import { ListItemForm, type FormSubmitData, type ListItemFormInitialData } from "./ListItemForm";
import listService from "@/http/list-api/list.service";
import type { ListItemPublic } from "@/http/list-api/types";
import { useToastStore } from "@/stores/useToastStore";
import { useTranslation } from "react-i18next";

interface PickFormModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
  editingItem?: ListItemPublic;
  onUpdated?: () => void;
  createInitialData?: ListItemFormInitialData;
}

export function PickFormModal({
  visible,
  onClose,
  onCreated,
  editingItem,
  onUpdated,
  createInitialData,
}: PickFormModalProps) {
  const { t } = useTranslation();
  const showToast = useToastStore((s) => s.show);
  const isEditing = editingItem !== undefined;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: FormSubmitData) => {
    setIsSubmitting(true);
    try {
      if (isEditing) {
        const preserveVerifiedLink =
          editingItem.is_verified &&
          !data.businessId &&
          data.unverifiedBusiness === editingItem.business_name;

        const { error } = await listService.updateListItem(editingItem.id, {
          description: data.description,
          ...(data.businessId ? { business: data.businessId } : {}),
          ...(data.tags.length ? { new_tags: data.tags } : {}),
          categories: data.categories,
          ...(data.othersName ? { others_name: data.othersName } : {}),
          ...(!preserveVerifiedLink && data.unverifiedBusiness
            ? { unverified_business: data.unverifiedBusiness }
            : {}),
          ...(data.location !== undefined ? { location: data.location } : {}),
          ...(data.branchId
            ? { branch: data.branchId }
            : !data.businessId
              ? { branch: null }
              : {}),
        });

        if (error) {
          showToast({ type: "error", message: error.message ?? t("profile.picks.updateError") });
          throw new Error(error.message ?? t("profile.picks.updateError"));
        }

        if (data.newFiles.length) {
          await Promise.all(
            data.newFiles.map((file) => listService.uploadListItemImage(file, editingItem.id)),
          );
        }

        onUpdated?.();
        onClose();
        return;
      }

      const { data: response, error } = await listService.createListItem({
        description: data.description,
        ...(data.businessId ? { business: data.businessId } : {}),
        ...(data.tags.length ? { new_tags: data.tags } : {}),
        categories: data.categories,
        ...(data.othersName ? { others_name: data.othersName } : {}),
        ...(data.unverifiedBusiness ? { unverified_business: data.unverifiedBusiness } : {}),
        ...(data.location ? { location: data.location } : {}),
        ...(data.branchId ? { branch: data.branchId } : {}),
      });

      if (error) {
        showToast({ type: "error", message: error.message ?? t("profile.picks.createError") });
        throw new Error(error.message ?? t("profile.picks.createError"));
      }

      const itemId = response?.data?.id;
      if (itemId && data.newFiles.length) {
        await Promise.all(
          data.newFiles.map((file) => listService.uploadListItemImage(file, itemId)),
        );
      }

      onCreated();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ListItemForm
      visible={visible}
      title={isEditing ? t("profile.picks.editPick") : t("profile.picks.addPick")}
      onCancel={onClose}
      onSubmit={handleSubmit}
      initialData={
        isEditing
          ? {
              name: editingItem.business_name ?? undefined,
              description: editingItem.description,
              tags: editingItem.tags.map((tag) => tag.name),
              categories: editingItem.categories,
              othersName: editingItem.others_name ?? undefined,
              images: editingItem.images,
              location: editingItem.location,
              businessId: editingItem.business_id,
              branchId: editingItem.branch?.id ?? null,
            }
          : createInitialData
      }
      isEditing={isEditing}
      editTargetId={editingItem?.id}
      loading={isSubmitting}
    />
  );
}
