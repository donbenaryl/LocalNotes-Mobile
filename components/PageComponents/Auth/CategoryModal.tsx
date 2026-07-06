import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../ui/Modal';
import type { AccountType } from '../../../types/user';
import { UserIcon } from '../../ui/icons/UserIcon';
import { BuildingIcon } from '../../ui/icons/BuildingIcon';

interface CategoryModalProps {
  visible: boolean;
  onClose: () => void;
}

interface CategoryOptionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
  className?: string;
}

function CategoryOption({ icon, title, description, onPress, className }: CategoryOptionProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-start gap-2 py-4 rounded-2xl cursor-pointer ${className}`}
    >
      <View className="w-12 h-12 items-center">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="font-geist-bold text-lg text-gray-900 dark:text-gray-100">{title}</Text>
        <Text className="font-geist text-base text-gray-500 dark:text-gray-400 mt-0.5">{description}</Text>
      </View>
    </Pressable>
  );
}

export function CategoryModal({ visible, onClose }: CategoryModalProps) {
  const { t } = useTranslation();
  const router = useRouter();

  function handleSelect(accountType: AccountType) {
    onClose();
    if (accountType === 'individual') {
      router.push({ pathname: '/(auth)/sign-up', params: { accountType } });
    } else {
      router.push({ pathname: '/(auth)/sign-up-business', params: { accountType } });
    }
  }

  return (
    <Modal visible={visible} onClose={onClose} position="bottom" title={t('categoryModal.title')}>
      <View className="gap-3">
        <CategoryOption
          icon={<UserIcon />}
          title={t('categoryModal.individualTitle')}
          description={t('categoryModal.individualDesc')}
          onPress={() => handleSelect('individual')}
          className="border-b border-gray-200 dark:border-gray-700 pb-6"
        />
        <CategoryOption
          icon={<BuildingIcon />}
          title={t('categoryModal.businessTitle')}
          description={t('categoryModal.businessDesc')}
          onPress={() => handleSelect('business')}
        />
      </View>
    </Modal>
  );
}
