import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import {
  UserSearchInput,
  type ShareInfo,
} from '@/components/ui/UserSearchInput';
import accountService from '@/http/account-api/account.services';
import type { searchUserDAO } from '@/http/account-api/types';
import businessService from '@/http/business-api/business.service';
import listService from '@/http/list-api/list.service';
import notesService from '@/http/notes-api/notes.service';

const SHEET_MAX_HEIGHT_RATIO = 0.9;

export type ShareToUsersTarget =
  | { kind: 'list'; listId: string }
  | { kind: 'profile'; userId: string }
  | { kind: 'business'; businessId: string }
  | { kind: 'pick'; itemId: string }
  | { kind: 'offer'; noteId: string };

interface ShareToUsersSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  shareInfo?: ShareInfo | null;
  target: ShareToUsersTarget | null;
  onShared?: () => void;
}

export function ShareToUsersSheet({
  visible,
  onClose,
  title,
  shareInfo,
  target,
  onShared,
}: ShareToUsersSheetProps) {
  const { t } = useTranslation();
  const [selectedUsers, setSelectedUsers] = useState<searchUserDAO[]>([]);
  const [isSharing, setIsSharing] = useState(false);

  const handleClose = useCallback(() => {
    if (isSharing) return;
    setSelectedUsers([]);
    onClose();
  }, [isSharing, onClose]);

  const handleAddUser = useCallback((user: searchUserDAO) => {
    setSelectedUsers((prev) =>
      prev.some((u) => u.id === user.id) ? prev : [...prev, user],
    );
  }, []);

  const handleRemoveUser = useCallback((userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  }, []);

  const handleShare = useCallback(async () => {
    if (!target || selectedUsers.length === 0 || isSharing) return;
    setIsSharing(true);
    const userIds = selectedUsers.map((u) => u.id);
    try {
      let response;
      switch (target.kind) {
        case 'list':
          response = await listService.shareList(target.listId, {
            user_ids: userIds,
            medium: 'in_app',
          });
          break;
        case 'profile':
          response = await accountService.shareProfile(target.userId, userIds);
          break;
        case 'business':
          response = await businessService.shareBusiness(target.businessId, userIds);
          break;
        case 'pick':
          response = await listService.shareListItem(target.itemId, userIds);
          break;
        case 'offer':
          response = await notesService.shareNote(target.noteId, userIds);
          break;
      }

      if (response.error) {
        throw new Error(response.error.message ?? 'Share failed');
      }

      toast.success(t('share.success'));
      setSelectedUsers([]);
      onShared?.();
      onClose();
    } catch (error) {
      console.error('Failed to share with users:', error);
      toast.error(t('share.error'));
    } finally {
      setIsSharing(false);
    }
  }, [target, selectedUsers, isSharing, t, onShared, onClose]);

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      title={title ?? t('share.sheetTitle')}
      avoidKeyboard={false}
      sheetMaxHeightRatio={SHEET_MAX_HEIGHT_RATIO}
      sheetClassName="pb-6"
    >
      <View className="gap-4" style={{ flexShrink: 1, minHeight: 0 }}>
        <UserSearchInput
          selectedUsers={selectedUsers}
          onAddUser={handleAddUser}
          onRemoveUser={handleRemoveUser}
          shareInfo={shareInfo}
          className="gap-3"
          placeholderKey="share.searchPlaceholder"
          showSelectedLabel={false}
          resultsClassName="max-h-48"
          selectedClassName="max-h-28"
        />
        <LocalNotesButton
          label={isSharing ? t('common.pleaseWait') : t('share.submit')}
          onPress={() => void handleShare()}
          variant="brand"
          isRounded
          disabled={selectedUsers.length === 0 || isSharing || !target}
        />
      </View>
    </Modal>
  );
}
