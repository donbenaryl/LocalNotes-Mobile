import { useEffect, useState, type ReactNode } from 'react';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { FileText } from 'lucide-react-native';
import { Modal } from '@/components/ui/Modal';
import { ImageFullScreen } from '@/components/ui/ImageFullScreen';
import { ClaimStatusBadge } from '@/components/PageComponents/ClaimBusiness/ClaimStatusBadge';
import { resolveImageUrl } from '@/utils/httpHelpers';
import type {
  BusinessClaimDAO,
  BusinessLocation,
  ClaimSource,
  ClaimVerificationMethod,
} from '@/http/business-api/types';

interface ClaimDetailModalProps {
  visible: boolean;
  onClose: () => void;
  claim: BusinessClaimDAO | null;
}

const SOURCE_KEY: Record<ClaimSource, string> = {
  'Existing Business': 'claimBusiness.detail.sourceExisting',
  'List Item - Existing Business': 'claimBusiness.detail.sourcePickExisting',
  'List Item - Unverified': 'claimBusiness.detail.sourcePickUnverified',
};

const METHOD_KEY: Record<ClaimVerificationMethod, string> = {
  email: 'claimBusiness.detail.methodEmail',
  phone: 'claimBusiness.detail.methodPhone',
  document: 'claimBusiness.detail.methodDocument',
};

/** Backend only allows jpeg/png/pdf — treat non-PDF proofs as images. */
function isPdfProof(url: string | null) {
  if (!url) return false;
  const lower = url.toLowerCase().split('?')[0] ?? '';
  return lower.endsWith('.pdf');
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatLocation(loc: BusinessLocation | null | undefined) {
  if (!loc) return null;
  return [loc.street_address, loc.city, loc.region, loc.postal_code, loc.country]
    .filter(Boolean)
    .join(', ');
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between gap-3">
      <Text className="shrink-0 font-geist text-[12px] text-gray-500 dark:text-gray-400">
        {label}
      </Text>
      <Text className="min-w-0 flex-1 text-right font-geist-medium text-[13px] text-ink dark:text-gray-100">
        {value}
      </Text>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View className="gap-2">
      <Text className="font-geist-semibold text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500">
        {title}
      </Text>
      <View className="gap-2 rounded-xl border border-gray-100 bg-soft/60 p-3 dark:border-gray-800 dark:bg-gray-800/50">
        {children}
      </View>
    </View>
  );
}

export function ClaimDetailModal({
  visible,
  onClose,
  claim,
}: ClaimDetailModalProps) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const { height } = useWindowDimensions();
  const [proofFullscreen, setProofFullscreen] = useState(false);

  const proofUrl =
    resolveImageUrl(claim?.proof_of_ownership) ?? claim?.proof_of_ownership;
  const proofIsPdf = isPdfProof(proofUrl ?? null);
  const proofIsImage = Boolean(proofUrl) && !proofIsPdf;
  const method = claim?.verification_method ?? 'document';
  const methodLabel = t(METHOD_KEY[method]);
  const sourceLabel = claim
    ? t(SOURCE_KEY[claim.source] ?? 'claimBusiness.detail.sourceExisting')
    : '';
  const name =
    claim?.target_name ||
    claim?.proposed_name ||
    claim?.unverified_business?.name ||
    t('claimBusiness.start.title');
  const locationLabel = formatLocation(claim?.proposed_location);
  const empty = t('claimBusiness.detail.empty');
  const iconColor = colorScheme === 'dark' ? '#F3F4F6' : '#141413';

  useEffect(() => {
    if (!visible) {
      setProofFullscreen(false);
    }
  }, [visible]);

  const openProofFile = () => {
    if (!proofUrl) return;
    void Linking.openURL(proofUrl);
  };

  return (
    <>
      <Modal
        visible={visible && !proofFullscreen}
        onClose={onClose}
        position="bottom"
        title={t('claimBusiness.detail.title')}
      >
        {claim ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: height * 0.85 }}
            contentContainerClassName="gap-5 pb-6"
          >
            <View className="flex-row items-start justify-between gap-3">
              <View className="min-w-0 flex-1">
                <Text
                  className="font-geist-bold text-[17px] text-ink dark:text-gray-100"
                  numberOfLines={2}
                >
                  {name}
                </Text>
                <Text className="mt-1 font-geist text-[12px] text-gray-500 dark:text-gray-400">
                  {sourceLabel} · {methodLabel}
                </Text>
              </View>
              <ClaimStatusBadge status={claim.status} />
            </View>

            <Section title={t('claimBusiness.detail.contact')}>
              <DetailRow
                label={t('claimBusiness.detail.workEmail')}
                value={claim.work_email || empty}
              />
              <DetailRow
                label={t('claimBusiness.detail.phone')}
                value={claim.phone_number || empty}
              />
              {claim.otp_verified_at ? (
                <DetailRow
                  label={t('claimBusiness.detail.otpVerified')}
                  value={formatDateTime(claim.otp_verified_at)}
                />
              ) : null}
            </Section>

            <Section
              title={
                claim.business
                  ? t('claimBusiness.detail.existingBusiness')
                  : t('claimBusiness.detail.proposedBusiness')
              }
            >
              {claim.business ? (
                <>
                  <DetailRow
                    label={t('claimBusiness.detail.name')}
                    value={claim.business.name || empty}
                  />
                  <DetailRow
                    label={t('claimBusiness.detail.type')}
                    value={claim.business.business_type || empty}
                  />
                </>
              ) : (
                <>
                  <DetailRow
                    label={t('claimBusiness.detail.name')}
                    value={
                      claim.proposed_name ||
                      claim.unverified_business?.name ||
                      empty
                    }
                  />
                  <DetailRow
                    label={t('claimBusiness.detail.type')}
                    value={claim.proposed_business_type || empty}
                  />
                  <DetailRow
                    label={t('claimBusiness.detail.website')}
                    value={claim.proposed_website || empty}
                  />
                  <DetailRow
                    label={t('claimBusiness.detail.location')}
                    value={locationLabel || empty}
                  />
                </>
              )}
            </Section>

            <Section title={t('claimBusiness.detail.proof')}>
              {proofIsImage && proofUrl ? (
                <Pressable
                  onPress={() => setProofFullscreen(true)}
                  accessibilityRole="imagebutton"
                  accessibilityLabel={t('claimBusiness.detail.viewProof')}
                  className="cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                >
                  <Image
                    source={{ uri: proofUrl }}
                    className="h-48 w-full"
                    resizeMode="contain"
                  />
                </Pressable>
              ) : proofUrl ? (
                <Pressable
                  onPress={openProofFile}
                  accessibilityRole="button"
                  accessibilityLabel={t('claimBusiness.detail.openPdf')}
                  className="cursor-pointer flex-row items-center gap-2"
                >
                  <FileText size={18} color={iconColor} />
                  <Text className="font-geist-semibold text-[13px] text-brand">
                    {t('claimBusiness.detail.openPdf')}
                  </Text>
                </Pressable>
              ) : (
                <Text className="font-geist text-[13px] text-gray-500 dark:text-gray-400">
                  {t('claimBusiness.detail.noDocument', { method: methodLabel })}
                </Text>
              )}
            </Section>

            {claim.status === 'Rejected' && claim.rejection_note ? (
              <Section title={t('claimBusiness.detail.rejection')}>
                <Text className="font-geist text-[13px] text-rose-600 dark:text-rose-400">
                  {claim.rejection_note}
                </Text>
              </Section>
            ) : null}

            <Text className="font-geist text-[12px] text-gray-400 dark:text-gray-500">
              {t('claimBusiness.detail.submitted', {
                date: formatDateTime(claim.created_at),
              })}
            </Text>
          </ScrollView>
        ) : null}
      </Modal>

      <ImageFullScreen
        visible={proofFullscreen && Boolean(proofUrl) && proofIsImage}
        uri={proofUrl ?? undefined}
        onClose={() => setProofFullscreen(false)}
      />
    </>
  );
}
