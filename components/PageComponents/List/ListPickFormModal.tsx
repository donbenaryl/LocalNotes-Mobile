import {
  ListItemForm,
  type FormSubmitData,
  type ListItemFormInitialData,
} from '@/components/PageComponents/Profile/ListItemForm';
import { useTranslation } from 'react-i18next';

interface ListPickFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: FormSubmitData) => void | Promise<void>;
  initialData?: ListItemFormInitialData;
  isEditing?: boolean;
  editTargetId?: string | number;
  loading?: boolean;
}

export function ListPickFormModal({
  visible,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
  editTargetId,
  loading = false,
}: ListPickFormModalProps) {
  const { t } = useTranslation();

  return (
    <ListItemForm
      visible={visible}
      title={isEditing ? t('profile.picks.editPick') : t('profile.picks.addPick')}
      onCancel={onClose}
      onSubmit={onSubmit}
      initialData={initialData}
      isEditing={isEditing}
      editTargetId={editTargetId}
      loading={loading}
    />
  );
}
