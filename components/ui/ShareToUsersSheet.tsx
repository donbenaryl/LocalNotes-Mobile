import { useCallback, useState } from 'react';
import { Pressable, Share, Text, View } from 'react-native';
import { ChevronRight, Share2 } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
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
import { getWebAppUrl } from '@/http/environment.config';
import listService from '@/http/list-api/list.service';
import notesService from '@/http/notes-api/notes.service';

const SHEET_MAX_HEIGHT_RATIO = 0.9;
const NATIVE_SHARE_ICON_SIZE = 22;
const NATIVE_SHARE_ICON_COLOR = '#FFFFFF';
const NATIVE_SHARE_ICON_BG = '#1A1A1A';

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

function buildNativeShareUrl(target: ShareToUsersTarget | null): string | null {
  if (!target) return null;
  const web = getWebAppUrl();
  if (!web) return null;

  switch (target.kind) {
    case 'list':
      return `${web}/list/${target.listId}?origin=share_link`;
    case 'profile':
      return `${web}/user/${target.userId}?origin=share_link`;
    case 'business':
      return `${web}/businesses/${target.businessId}?origin=share_link`;
    case 'offer':
      return `${web}/offers?id=${encodeURIComponent(target.noteId)}&origin=share_link`;
    case 'pick':
      return `${web}/explore?pick_id=${encodeURIComponent(target.itemId)}&origin=share_link`;
  }
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
  const { colorScheme } = useColorScheme();
  const chevronColor = colorScheme === 'dark' ? '#A79E92' : '#6C727F';
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

  const handleNativeShare = useCallback(async () => {
    if (isSharing) return;

    const url = buildNativeShareUrl(target);
    const shareTitle = shareInfo?.title?.trim() || '';
    const message = url
      ? shareTitle
        ? t('share.nativeMessage', { title: shareTitle, url })
        : t('share.nativeMessageUrlOnly', { url })
      : shareTitle
        ? t('share.nativeMessageTitleOnly', { title: shareTitle })
        : t('home.following.findFriends.inviteMessageNoUrl');

    try {
      const result = await Share.share({ message });
      if (result.action !== Share.sharedAction) return;

      if (target?.kind === 'list') {
        void listService
          .shareList(target.listId, { medium: 'link' })
          .catch(() => undefined);
      }

      setSelectedUsers([]);
      onShared?.();
      onClose();
    } catch {
      // User dismissed or share unavailable — match invite-friends quiet handling.
    }
  }, [isSharing, target, shareInfo?.title, t, onShared, onClose]);

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
        <Pressable
          onPress={() => void handleNativeShare()}
          disabled={isSharing}
          accessibilityRole="button"
          accessibilityLabel={t('share.native.title')}
          className="cursor-pointer flex-row items-center gap-4"
        >
          <View
            className="h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: NATIVE_SHARE_ICON_BG }}
          >
            <Share2
              size={NATIVE_SHARE_ICON_SIZE}
              color={NATIVE_SHARE_ICON_COLOR}
              fill={NATIVE_SHARE_ICON_COLOR}
            />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="font-geist-semibold text-base text-ink dark:text-dk-text">
              {t('share.native.title')}
            </Text>
            <Text className="font-geist text-sm text-gray-500 dark:text-dk-muted">
              {t('share.native.subtitle')}
            </Text>
          </View>
          <ChevronRight size={20} color={chevronColor} />
        </Pressable>

        <View className="flex-row items-center gap-3">
          <View className="h-px flex-1 bg-brand/15 dark:bg-dk-border" />
          <Text className="font-geist-medium text-xs uppercase tracking-wide text-gray-400 dark:text-dk-muted">
            {t('share.orWithPeople')}
          </Text>
          <View className="h-px flex-1 bg-brand/15 dark:bg-dk-border" />
        </View>

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
          disabled={selectedUsers.length === 0 || isSharing || !target}
        />
      </View>
    </Modal>
  );
}
