import { useCallback, useEffect, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { Modal } from '@/components/ui/Modal';
import { TextInput } from '@/components/ui/TextInput';
import { cn } from '@/utils/cn';
import {
  useStartProfileLink,
  useVerifyProfileLink,
} from '@/hooks/useProfileReviews';
import type {
  ProfileLinkProviderId,
  ReviewConnectionDAO,
} from '@/http/reviews-api/types';
import { useToastStore } from '@/stores/useToastStore';

const PROVIDER_HOME: Record<ProfileLinkProviderId, string> = {
  yelp: 'https://www.yelp.com/user_details',
  tripadvisor: 'https://www.tripadvisor.com/Profile',
  amazon: 'https://www.amazon.com/gp/profile',
};

const STEP_KEYS = ['step1', 'step2', 'step3', 'step4'] as const;

interface LinkProfileSheetProps {
  visible: boolean;
  provider: ProfileLinkProviderId;
  /** Latest connection row; `pending_verification` moves the sheet to the verify step. */
  connection?: ReviewConnectionDAO;
  onClose: () => void;
}

export function LinkProfileSheet({
  visible,
  provider,
  connection,
  onClose,
}: LinkProfileSheetProps) {
  const { t } = useTranslation();
  const showToast = useToastStore((s) => s.show);
  const startMutation = useStartProfileLink();
  const verifyMutation = useVerifyProfileLink();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) {
      setUrl('');
      setError('');
    }
  }, [visible]);

  const code = connection?.pending_verification
    ? connection.verification_code
    : null;
  const providerName = t(`accountSettings.connectedAccounts.providers.${provider}`);

  const handleCopy = useCallback(async () => {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    showToast({
      type: 'success',
      message: t('accountSettings.connectedAccounts.link.copied'),
    });
  }, [code, showToast, t]);

  const handleStart = useCallback(async () => {
    setError('');
    try {
      await startMutation.mutateAsync({ provider, profileUrl: url.trim() });
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : t('accountSettings.connectedAccounts.link.invalidUrl'),
      );
    }
  }, [provider, startMutation, t, url]);

  const handleVerify = useCallback(async () => {
    setError('');
    try {
      await verifyMutation.mutateAsync(provider);
      showToast({
        type: 'success',
        message: t('accountSettings.connectedAccounts.link.linked', {
          provider: providerName,
        }),
      });
      onClose();
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : t('accountSettings.connectedAccounts.link.verifyFailed'),
      );
    }
  }, [onClose, provider, providerName, showToast, t, verifyMutation]);

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={t('accountSettings.connectedAccounts.link.title', {
        provider: providerName,
      })}
    >
      <View className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-dk-line dark:bg-dk-card/50">
        <Text className="mb-2 font-geist-bold text-[13px] text-ink dark:text-dk-text">
          {t('accountSettings.connectedAccounts.link.howToTitle')}
        </Text>
        {STEP_KEYS.map((key, index) => {
          const active = code ? index > 0 : index === 0;
          return (
            <View key={key} className="mb-1.5 flex-row items-start">
              <View
                className={cn(
                  'mr-2 mt-px h-[18px] w-[18px] items-center justify-center rounded-full',
                  active ? 'bg-brand' : 'bg-gray-300 dark:bg-dk-line',
                )}
              >
                <Text className="font-geist-bold text-[11px] text-white">
                  {index + 1}
                </Text>
              </View>
              <Text
                className={cn(
                  'flex-1 font-geist text-[12px] leading-[1.5]',
                  active
                    ? 'text-ink dark:text-dk-text'
                    : 'text-gray-500 dark:text-dk-muted',
                )}
              >
                {t(`accountSettings.connectedAccounts.link.${key}`, {
                  provider: providerName,
                })}
              </Text>
            </View>
          );
        })}
        <Text className="mt-1 font-geist text-[11px] leading-[1.5] text-gray-500 dark:text-dk-muted">
          {t('accountSettings.connectedAccounts.link.publicNote')}
        </Text>
      </View>
      {code ? (
        <View>
          <Text className="mb-3 font-geist text-[13px] leading-[1.5] text-gray-600 dark:text-dk-muted">
            {t('accountSettings.connectedAccounts.link.codeInstructions', {
              provider: providerName,
            })}
          </Text>
          <View className="mb-3 items-center rounded-xl border border-gray-200 bg-gray-50 py-4 dark:border-dk-line dark:bg-dk-card/50">
            <Text
              selectable
              className="font-geist-bold text-[22px] tracking-widest text-ink dark:text-dk-text"
            >
              {code}
            </Text>
          </View>
          <LocalNotesButton
            label={t('accountSettings.connectedAccounts.link.copyCode')}
            variant="light"
            size="sm"
            className="mb-2"
            onPress={() => void handleCopy()}
          />
          <LocalNotesButton
            label={t('accountSettings.connectedAccounts.link.openProfile', {
              provider: providerName,
            })}
            variant="light"
            size="sm"
            className="mb-2"
            onPress={() =>
              void Linking.openURL(
                connection?.profile_url || PROVIDER_HOME[provider],
              )
            }
          />
          {error ? (
            <Text className="mb-2 font-geist text-[12px] text-error">
              {error}
            </Text>
          ) : null}
          <LocalNotesButton
            label={t('accountSettings.connectedAccounts.link.verify')}
            size="sm"
            loading={verifyMutation.isPending}
            onPress={() => void handleVerify()}
          />
        </View>
      ) : (
        <View>
          <Text className="mb-3 font-geist text-[13px] leading-[1.5] text-gray-600 dark:text-dk-muted">
            {t('accountSettings.connectedAccounts.link.urlInstructions', {
              provider: providerName,
            })}
          </Text>
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder={t(
              'accountSettings.connectedAccounts.link.urlPlaceholder',
            )}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            error={error || undefined}
            containerClassName="mb-3"
          />
          <LocalNotesButton
            label={t('common.continue')}
            size="sm"
            disabled={url.trim().length === 0}
            loading={startMutation.isPending}
            onPress={() => void handleStart()}
          />
        </View>
      )}
    </Modal>
  );
}
