import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { Modal } from '@/components/ui/Modal';
import { TextInput } from '@/components/ui/TextInput';

const CONFIRM_WORD = 'DELETE';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteAccountModal({
  visible,
  onClose,
  onConfirm,
  isLoading = false,
}: DeleteAccountModalProps) {
  const { t } = useTranslation();
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (!visible) {
      setConfirmText('');
    }
  }, [visible]);

  const canConfirm = confirmText === CONFIRM_WORD;

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={t('accountSettings.menu.deleteAccountTitle')}
      position="bottom"
    >
      <Text className="mb-4 font-geist text-sm text-gray-600 dark:text-gray-400">
        {t('accountSettings.menu.deleteAccountMessage')}
      </Text>
      <TextInput
        label={t('accountSettings.menu.deleteAccountTypeLabel')}
        value={confirmText}
        onChangeText={setConfirmText}
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!isLoading}
        containerClassName="mb-6"
        labelClassName="normal-case"
   
      />
      <View className="flex-row gap-3">
        <LocalNotesButton
          label={t('accountSettings.menu.deleteAccountCancel')}
          onPress={onClose}
          variant="light"
          size="sm"
          disabled={isLoading}
          className="flex-1"
        />
        <LocalNotesButton
          label={t('accountSettings.menu.deleteAccountConfirm')}
          onPress={onConfirm}
          variant="danger"
          size="sm"
          disabled={!canConfirm || isLoading}
          loading={isLoading}
          className="flex-1"
        />
      </View>
    </Modal>
  );
}
