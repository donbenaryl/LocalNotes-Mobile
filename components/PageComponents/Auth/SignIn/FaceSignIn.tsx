import { TouchableOpacity, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FaceIcon } from '@/components/ui/icons/FaceIcon';

export function FaceSignIn() {
  const { t } = useTranslation();

  return (
    <TouchableOpacity className="items-center gap-4 cursor-pointer">
      <FaceIcon width={50} height={50} />
      <Text className="text-gray-500 dark:text-gray-400 font-geist text-lg">
        {t('faceSignIn.label')}
      </Text>
    </TouchableOpacity>
  );
}
