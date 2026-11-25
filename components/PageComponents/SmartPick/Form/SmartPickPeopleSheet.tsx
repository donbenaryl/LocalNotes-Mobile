import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { Modal } from '@/components/ui/Modal';
import { UserSearchInput } from '@/components/ui/UserSearchInput';
import type { searchUserDAO } from '@/http/account-api/types';

/** Sheet grows with its content up to this fraction of the window. */
const SHEET_MAX_HEIGHT_RATIO = 0.9;

interface SmartPickPeopleSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedUsers: searchUserDAO[];
  onAddUser: (user: searchUserDAO) => void;
  onRemoveUser: (userId: string) => void;
}

export function SmartPickPeopleSheet({
  visible,
  onClose,
  selectedUsers,
  onAddUser,
  onRemoveUser,
}: SmartPickPeopleSheetProps) {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={t('smartPick.linkProfileLabel')}
      avoidKeyboard={false}
      sheetMaxHeightRatio={SHEET_MAX_HEIGHT_RATIO}
      sheetClassName="pb-6"
    >
      <View className="gap-4" style={{ flexShrink: 1, minHeight: 0 }}>
        <UserSearchInput
          selectedUsers={selectedUsers}
          onAddUser={onAddUser}
          onRemoveUser={onRemoveUser}
          className="gap-3"
          placeholderKey="smartPick.linkProfileSearchPlaceholder"
          showSelectedLabel={false}
          resultsClassName="max-h-48"
          selectedClassName="max-h-28"
        />
        <LocalNotesButton
          label={t('common.done')}
          onPress={onClose}
          variant="brand"
        />
      </View>
    </Modal>
  );
}
