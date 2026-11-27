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
  compact?: boolean;
};

export function WelcomeFixedChrome({
  activeIndex,
  slideCount,
  onSelectIndex,
  compact = false,
}: WelcomeFixedChromeProps) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View className="px-5" pointerEvents="box-none">
      <View accessibilityLabel={t('auth.welcome.headlineA11y')} className="-mb-2">
        <PageTitleHeading
          hideLogo
          alignLeft
          stackTitle
          tone="cream"
          title={t('auth.welcome.headlineLine1')}
          subtitle={t('auth.welcome.headlineLine2')}
          description={t('auth.welcome.subtitle')}
          containerClassName="mb-0"
          titleClassName={
            compact ? '!text-[32px] !leading-[34px]' : undefined
          }
          subtitleClassName={
            compact ? '!text-[32px] !leading-[34px]' : undefined
          }
          descriptionClassName={
            compact
              ? '!px-0 max-w-[342px] !mt-1.5 !text-[14px] !leading-5'
              : '!px-0 max-w-[342px]'
          }
        />
      </View>

      <View className={compact ? 'mt-3.5 gap-2' : 'mt-[22px] gap-2.5'}>
        <LocalNotesButton
          label={t('auth.welcome.createAccount')}
          onPress={() => router.push('/sign-up' as Href)}
          variant="light"
          size="md"
          className={
            compact
              ? '!border-[#F3EBDD] !bg-[#F3EBDD] dark:!border-[#F3EBDD] dark:!bg-[#F3EBDD] !py-2.5'
              : '!border-[#F3EBDD] !bg-[#F3EBDD] dark:!border-[#F3EBDD] dark:!bg-[#F3EBDD] !py-[13px]'
          }
          textClassName="!text-[#1A1714] dark:!text-[#1A1714] font-geist-semibold !text-[15px]"
        />
        <LocalNotesButton
          label={t('auth.welcome.signIn')}
          onPress={() => router.push('/sign-in' as Href)}
          variant="outline"
          size="md"
          className={
            compact
              ? 'border border-[rgba(243,235,221,0.5)] !bg-transparent !py-2.5'
              : 'border border-[rgba(243,235,221,0.5)] !bg-transparent !py-[13px]'
          }
          textClassName="!text-[#F3EBDD] font-geist-semibold !text-[15px]"
        />
      </View>

      <WelcomeSlideDots
        count={slideCount}
        activeIndex={activeIndex}
        onSelectIndex={onSelectIndex}
        compact={compact}
      />
    </View>
  );
}
