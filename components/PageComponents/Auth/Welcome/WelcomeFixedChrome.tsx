import { View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { PageTitleHeading } from '@/components/ui/PageTitleHeading';
import { WelcomeSlideDots } from './WelcomeSlideDots';

type WelcomeFixedChromeProps = {
  activeIndex: number;
  slideCount: number;
  onSelectIndex?: (index: number) => void;
};

export function WelcomeFixedChrome({
  activeIndex,
  slideCount,
  onSelectIndex,
}: WelcomeFixedChromeProps) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View className="px-5" pointerEvents="box-none">
      <View accessibilityLabel={t('auth.welcome.headlineA11y')}>
        <PageTitleHeading
          hideLogo
          alignLeft
          stackTitle
          tone="cream"
          title={t('auth.welcome.headlineLine1')}
          subtitle={t('auth.welcome.headlineLine2')}
          description={t('auth.welcome.subtitle')}
          containerClassName="mb-0"
          descriptionClassName="!px-0 max-w-[342px]"
        />
      </View>

      <View className="mt-[22px] gap-2.5">
        <LocalNotesButton
          label={t('auth.welcome.createAccount')}
          onPress={() => router.push('/sign-up' as Href)}
          variant="light"
          size="md"
          className="!border-[#F3EBDD] !bg-[#F3EBDD] dark:!border-[#F3EBDD] dark:!bg-[#F3EBDD] !py-[13px]"
          textClassName="!text-[#1A1714] dark:!text-[#1A1714] font-geist-semibold !text-[15px]"
        />
        <LocalNotesButton
          label={t('auth.welcome.signIn')}
          onPress={() => router.push('/sign-in' as Href)}
          variant="outline"
          size="md"
          className="border border-[rgba(243,235,221,0.5)] !bg-transparent !py-[13px]"
          textClassName="!text-[#F3EBDD] font-geist-semibold !text-[15px]"
        />
      </View>

      <WelcomeSlideDots
        count={slideCount}
        activeIndex={activeIndex}
        onSelectIndex={onSelectIndex}
      />
    </View>
  );
}
