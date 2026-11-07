import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageCircle } from 'lucide-react-native';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { copilotHref } from '@/utils/copilotRoutes';

/** Floating bottom-right "Ask Copilot" pill; the parent decides when it is visible (paid branch only). */
export function AskCopilotFab() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#141413' : '#FFFFFF';

  return (
    <View className="absolute right-4 z-20" style={{ bottom: insets.bottom + 16 }}>
      <LocalNotesButton
        label={t('businessHome.copilot.entry.title')}
        onPress={() => router.push(copilotHref())}
        variant="dark"
        size="sm"
        isWidthFull={false}
        leftIcon={<MessageCircle size={18} color={iconColor} />}
        className="shadow-lg"
      />
    </View>
  );
}
