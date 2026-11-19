import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { Modal } from '@/components/ui/Modal';
import { TextInput } from '@/components/ui/TextInput';
import { isDeleteConfirmValid } from '@/utils/deleteAccount';


interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (password?: string) => void;
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
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!visible) {
      setConfirmText('');
      setPassword('');
    }
  }, [visible]);

  const canConfirm = isDeleteConfirmValid(confirmText);

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
        containerClassName="mb-4"
        labelClassName="normal-case"
      />
      <TextInput
        label={t('accountSettings.menu.deleteAccountPasswordLabel')}
        placeholder={t('accountSettings.menu.deleteAccountPasswordPlaceholder')}
        value={password}
        onChangeText={setPassword}
        isPassword
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isLoading}
        containerClassName="mb-2"
        labelClassName="normal-case"
      />
      <Text className="mb-6 font-geist text-xs text-gray-500 dark:text-gray-400">
        {t('accountSettings.menu.deleteAccountPasswordHint')}
      </Text>
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
          onPress={() => onConfirm(password)}
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
