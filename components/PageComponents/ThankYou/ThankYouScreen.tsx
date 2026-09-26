import { PageHeader } from '@/components/ui/PageHeader';
import { ThankYouContent } from './ThankYouContent';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

export default function ThankYouScreen() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
      <PageHeader title={t('thankYou.title')} />
      <ThankYouContent />
    </View>
  );
}
