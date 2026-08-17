import { Alert, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';
import type { BusinessHomeSheetId } from './types';

interface BusinessHomeSheetsProps {
  activeSheet: BusinessHomeSheetId | null;
  onClose: () => void;
}

function SheetScroll({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerClassName="pb-8"
      className="max-h-[70vh]"
    >
      {children}
    </ScrollView>
  );
}

export function BusinessHomeSheets({ activeSheet, onClose }: BusinessHomeSheetsProps) {
  const { t } = useTranslation();

  const showComingSoon = () => {
    Alert.alert(
      t('businessHome.comingSoonTitle'),
      t('businessHome.comingSoonMessage'),
    );
  };

  return (
    <>
      <Modal
        visible={activeSheet === 'copilot'}
        onClose={onClose}
        title={t('businessHome.sheets.copilot.title')}
        sheetHeightRatio={0.85}
      >
        <SheetScroll>
          <BusinessHomeCard className="mx-0 mt-2">
            <Text className="self-end rounded-2xl bg-soft px-3 py-2 font-geist text-sm dark:bg-gray-800">
              {t('businessHome.sheets.copilot.sampleQuestion')}
            </Text>
          </BusinessHomeCard>
          <BusinessHomeCard className="mx-0 mt-2">
            <Text className="font-geist text-sm leading-[1.55] text-gray-600 dark:text-gray-400">
              {t('businessHome.sheets.copilot.sampleAnswer')}
            </Text>
            <View className="mt-2 flex-row flex-wrap gap-1">
              <Text className="rounded-full bg-soft px-2 py-1 text-[11px] dark:bg-gray-800">
                {t('businessHome.sheets.copilot.cite1')}
              </Text>
              <Text className="rounded-full bg-soft px-2 py-1 text-[11px] dark:bg-gray-800">
                {t('businessHome.sheets.copilot.cite2')}
              </Text>
            </View>
            <View className="mt-2 flex-row flex-wrap gap-1.5">
              <LocalNotesButton
                label={t('businessHome.sheets.copilot.turnIntoPlan')}
                onPress={showComingSoon}
                variant="dark"
                size="xs"
                isRounded
                isWidthFull={false}
              />
              <LocalNotesButton
                label={t('businessHome.sheets.copilot.draftNote')}
                onPress={showComingSoon}
                variant="light"
                size="xs"
                isRounded
                isWidthFull={false}
              />
            </View>
          </BusinessHomeCard>
          <View className="mt-2 flex-row flex-wrap gap-1.5">
            {[
              'businessHome.sheets.copilot.suggest1',
              'businessHome.sheets.copilot.suggest2',
              'businessHome.sheets.copilot.suggest3',
            ].map((key) => (
              <Text
                key={key}
                className="rounded-full border border-gray-200 px-3 py-2 font-geist-bold text-xs dark:border-gray-600"
              >
                {t(key)}
              </Text>
            ))}
          </View>
        </SheetScroll>
      </Modal>

      <Modal
        visible={activeSheet === 'profile'}
        onClose={onClose}
        title={t('businessHome.sheets.profile.title')}
        sheetHeightRatio={0.85}
      >
        <SheetScroll>
          <BusinessHomeCard className="mx-0 mt-2">
            <Text className="font-geist-extrabold text-sm">{t('businessHome.sheets.profile.healthTitle')}</Text>
            <Text className="mt-1 font-geist text-xs text-gray-600 dark:text-gray-400">
              {t('businessHome.sheets.profile.healthBody')}
            </Text>
          </BusinessHomeCard>
          <BusinessHomeCard className="mx-0 mt-2">
            <Text className="font-geist-extrabold text-sm">{t('businessHome.sheets.profile.hoursTitle')}</Text>
            <Text className="mt-1 font-geist text-xs text-gray-600 dark:text-gray-400">
              {t('businessHome.sheets.profile.hoursBody')}
            </Text>
            <LocalNotesButton
              label={t('businessHome.buttons.confirmHours')}
              onPress={showComingSoon}
              variant="dark"
              size="xs"
              isRounded
              isWidthFull={false}
              className="mt-2 self-start"
            />
          </BusinessHomeCard>
          <BusinessHomeCard className="mx-0 mt-2">
            <Text className="font-geist-extrabold text-sm">{t('businessHome.sheets.profile.descriptionTitle')}</Text>
            <Text className="mt-1 font-geist text-xs text-gray-600 dark:text-gray-400">
              {t('businessHome.sheets.profile.descriptionBody')}
            </Text>
            <View className="mt-2 rounded-xl bg-soft p-3 dark:bg-gray-900">
              <Text className="font-fraunces text-sm italic text-gray-700 dark:text-gray-300">
                {t('businessHome.sheets.profile.draft')}
              </Text>
            </View>
            <View className="mt-2 flex-row flex-wrap gap-1.5">
              <LocalNotesButton
                label={t('businessHome.sheets.profile.useDraft')}
                onPress={showComingSoon}
                variant="dark"
                size="xs"
                isRounded
                isWidthFull={false}
              />
              <LocalNotesButton
                label={t('businessHome.buttons.editRelaunch')}
                onPress={showComingSoon}
                variant="light"
                size="xs"
                isRounded
                isWidthFull={false}
              />
            </View>
          </BusinessHomeCard>
        </SheetScroll>
      </Modal>

      <Modal
        visible={activeSheet === 'plans'}
        onClose={onClose}
        title={t('businessHome.sheets.plans.title')}
        sheetHeightRatio={0.85}
      >
        <SheetScroll>
          <BusinessHomeCard className="mx-0 mt-2">
            <Text className="font-geist-extrabold text-sm">{t('businessHome.sheets.plans.activeTitle')}</Text>
            <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
              <View className="h-full w-[43%] rounded-full bg-brand" />
            </View>
            <Text className="mt-2 font-geist text-xs text-gray-600 dark:text-gray-400">
              {t('businessHome.sheets.plans.activeBody')}
            </Text>
            <LocalNotesButton
              label={t('businessHome.sheets.plans.logNumbers')}
              onPress={showComingSoon}
              variant="dark"
              size="xs"
              isRounded
              isWidthFull={false}
              className="mt-2 self-start"
            />
          </BusinessHomeCard>
          <BusinessHomeCard className="mx-0 mt-2">
            <Text className="font-geist-extrabold text-sm">{t('businessHome.sheets.plans.completedTitle')}</Text>
            <Text className="mt-1 font-geist text-xs text-gray-600 dark:text-gray-400">
              {t('businessHome.sheets.plans.completedBody')}
            </Text>
          </BusinessHomeCard>
        </SheetScroll>
      </Modal>

      <Modal
        visible={activeSheet === 'alerts'}
        onClose={onClose}
        title={t('businessHome.sheets.alerts.title')}
        sheetHeightRatio={0.85}
      >
        <SheetScroll>
          <BusinessHomeCard className="mx-0 mt-2">
            <Text className="font-geist-extrabold text-sm">{t('businessHome.sheets.alerts.attentionTitle')}</Text>
            <Text className="mt-1 font-geist text-xs leading-[1.55] text-gray-600 dark:text-gray-400">
              {t('businessHome.sheets.alerts.attentionBody')}
            </Text>
          </BusinessHomeCard>
          <BusinessHomeCard className="mx-0 mt-2">
            <Text className="font-geist-extrabold text-sm">{t('businessHome.sheets.alerts.opportunityTitle')}</Text>
            <Text className="mt-1 font-geist text-xs text-gray-600 dark:text-gray-400">
              {t('businessHome.sheets.alerts.opportunityBody')}
            </Text>
            <LocalNotesButton
              label={t('businessHome.buttons.createOffer')}
              onPress={showComingSoon}
              variant="dark"
              size="xs"
              isRounded
              isWidthFull={false}
              className="mt-2 self-start"
            />
          </BusinessHomeCard>
        </SheetScroll>
      </Modal>

      <Modal
        visible={activeSheet === 'report'}
        onClose={onClose}
        title={t('businessHome.sheets.report.title')}
        sheetHeightRatio={0.85}
      >
        <SheetScroll>
          <BusinessHomeCard className="mx-0 mt-2">
            <Text className="font-geist-extrabold text-sm">{t('businessHome.sheets.report.oneLineTitle')}</Text>
            <Text className="mt-1 font-geist text-xs text-gray-600 dark:text-gray-400">
              {t('businessHome.sheets.report.oneLineBody')}
            </Text>
          </BusinessHomeCard>
          <BusinessHomeCard className="mx-0 mt-2">
            <Text className="font-geist-extrabold text-sm">{t('businessHome.sheets.report.improvedTitle')}</Text>
            <Text className="mt-1 font-geist-bold text-xs text-success">{t('businessHome.sheets.report.saves')}</Text>
            <Text className="font-geist-bold text-xs text-success">{t('businessHome.sheets.report.redemptions')}</Text>
          </BusinessHomeCard>
        </SheetScroll>
      </Modal>

      <Modal
        visible={activeSheet === 'compare'}
        onClose={onClose}
        title={t('businessHome.sheets.compare.title')}
        sheetHeightRatio={0.85}
      >
        <SheetScroll>
          <BusinessHomeCard className="mx-0 mt-2">
            <Text className="font-geist-extrabold text-sm">{t('businessHome.sheets.compare.headline')}</Text>
            <View className="mt-3 flex-row gap-4">
              <View>
                <Text className="font-geist-extrabold text-2xl text-success">15.4×</Text>
                <Text className="text-[11px] text-gray-500">{t('businessHome.sheets.compare.campaignA')}</Text>
              </View>
              <View>
                <Text className="font-geist-extrabold text-2xl text-ink dark:text-gray-100">4.1×</Text>
                <Text className="text-[11px] text-gray-500">{t('businessHome.sheets.compare.campaignB')}</Text>
              </View>
            </View>
          </BusinessHomeCard>
          <BusinessHomeCard className="mx-0 mt-2">
            <Text className="font-geist-extrabold text-sm">{t('businessHome.sheets.compare.meaningTitle')}</Text>
            <Text className="mt-1 font-geist text-xs text-gray-600 dark:text-gray-400">
              {t('businessHome.sheets.compare.meaningBody')}
            </Text>
          </BusinessHomeCard>
        </SheetScroll>
      </Modal>
    </>
  );
}
