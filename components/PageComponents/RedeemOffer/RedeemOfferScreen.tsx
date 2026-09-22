import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal as RNModal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { CameraView, scanFromURLAsync, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageHeader } from '@/components/ui/PageHeader';
import { TextInput } from '@/components/ui/TextInput';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { WhiteBox } from '@/components/ui/WhiteBox';
import { toast } from '@/components/ui/Toast';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { isBusinessAccountType } from '@/utils/businessAccount';
import notesService from '@/http/notes-api/notes.service';
import businessService from '@/http/business-api/business.service';
import type { RedeemCodeLookupDAO } from '@/http/notes-api/types';
import type { ThankYouRedeemLookupDAO } from '@/http/business-api/types';
import { formatRelativeTime } from '@/utils/time';

const REDEEMED_CODES_QUERY_KEY = 'redeemed-codes';
const THANK_YOU_REDEEMED_QUERY_KEY = 'thank-you-redeemed-codes';

type UnifiedRedeemLookup = {
  id: string;
  code: string;
  used_at: string | null;
  title: string;
  kind: 'offer' | 'thank_you';
  customer: {
    id: string;
    username: string;
    first_name: string;
  };
};

function fromOfferLookup(data: RedeemCodeLookupDAO): UnifiedRedeemLookup {
  return {
    id: data.id,
    code: data.code,
    used_at: data.used_at,
    title: data.note_title,
    kind: 'offer',
    customer: data.customer,
  };
}

function fromThankYouLookup(data: ThankYouRedeemLookupDAO): UnifiedRedeemLookup {
  return {
    id: data.id,
    code: data.code,
    used_at: data.used_at,
    title: data.reward_title,
    kind: 'thank_you',
    customer: data.customer,
  };
}

export default function RedeemOfferScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const accountType = useAuthStore((s) => s.accountType ?? s.user?.accountType);
  const businessId = useBusinessStore((s) => s.businessId);

  const [code, setCode] = useState('');
  const [result, setResult] = useState<UnifiedRedeemLookup | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isUploadingQr, setIsUploadingQr] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const scanLockRef = useRef(false);

  useEffect(() => {
    if (!isBusinessAccountType(accountType ?? undefined)) {
      router.replace('/profile' as never);
    }
  }, [accountType, router]);

  const isBusiness = isBusinessAccountType(accountType ?? undefined);

  const redeemedQuery = useInfiniteQuery({
    queryKey: [REDEEMED_CODES_QUERY_KEY, businessId],
    enabled: isBusiness && Boolean(businessId),
    queryFn: async ({ pageParam }) => {
      const response = await notesService.fetchRedeemedCodes({
        page: pageParam,
        business_id: businessId || undefined,
      });
      if (response.error) {
        throw new Error(response.error.message || t('redeemOffer.historyError'));
      }
      return {
        items: (response.data?.data ?? []).map(fromOfferLookup),
        next: response.data?.pagination?.next ?? null,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (last) => last.next ?? undefined,
  });

  const thankYouRedeemedQuery = useQuery({
    queryKey: [THANK_YOU_REDEEMED_QUERY_KEY, businessId],
    enabled: isBusiness && Boolean(businessId),
    queryFn: async () => {
      const response = await businessService.fetchThankYouRedeemedCodes({
        business_id: businessId || undefined,
      });
      if (response.error) {
        throw new Error(response.error.message || t('redeemOffer.historyError'));
      }
      return (response.data?.data ?? []).map(fromThankYouLookup);
    },
  });

  const redeemedItems = useMemo(() => {
    const offers = redeemedQuery.data?.pages.flatMap((page) => page.items) ?? [];
    const thankYous = thankYouRedeemedQuery.data ?? [];
    return [...offers, ...thankYous].sort((a, b) => {
      const aTime = a.used_at ? Date.parse(a.used_at) : 0;
      const bTime = b.used_at ? Date.parse(b.used_at) : 0;
      return bTime - aTime;
    });
  }, [redeemedQuery.data?.pages, thankYouRedeemedQuery.data]);

  const validateMutation = useMutation({
    mutationFn: async (raw: string) => {
      const offerResponse = await notesService.validateRedeemCode(raw);
      if (!offerResponse.error && offerResponse.data?.data) {
        return fromOfferLookup(offerResponse.data.data);
      }
      const thankYouResponse = await businessService.validateThankYouRedeemCode(raw);
      if (thankYouResponse.error || !thankYouResponse.data?.data) {
        throw new Error(
          thankYouResponse.error?.message ||
            offerResponse.error?.message ||
            t('redeemOffer.validateFailed'),
        );
      }
      return fromThankYouLookup(thankYouResponse.data.data);
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (error: Error) => {
      setResult(null);
      toast.error(error.message || t('redeemOffer.validateFailed'));
    },
  });

  const useMutationMark = useMutation({
    mutationFn: async (payload: { code: string; kind: 'offer' | 'thank_you' }) => {
      if (payload.kind === 'thank_you') {
        const response = await businessService.useThankYouRedeemCode(payload.code);
        if (response.error || !response.data?.data) {
          throw new Error(response.error?.message || t('redeemOffer.useFailed'));
        }
        return fromThankYouLookup(response.data.data);
      }
      const response = await notesService.useRedeemCode(payload.code);
      if (response.error || !response.data?.data) {
        throw new Error(response.error?.message || t('redeemOffer.useFailed'));
      }
      return fromOfferLookup(response.data.data);
    },
    onSuccess: (data) => {
      if (data) setResult(data);
      toast.success(t('redeemOffer.useSuccess'));
      void queryClient.invalidateQueries({
        queryKey: [REDEEMED_CODES_QUERY_KEY, businessId],
      });
      void queryClient.invalidateQueries({
        queryKey: [THANK_YOU_REDEEMED_QUERY_KEY, businessId],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || t('redeemOffer.useFailed'));
    },
  });

  const applyScannedCode = useCallback(
    (raw: string) => {
      const normalized = raw.trim().toUpperCase();
      if (!normalized) return;
      setCode(normalized);
      setScannerOpen(false);
      validateMutation.mutate(normalized);
    },
    [validateMutation.mutate],
  );

  const handleOpenScanner = useCallback(async () => {
    scanLockRef.current = false;
    if (!permission?.granted) {
      const next = await requestPermission();
      if (!next.granted) {
        toast.error(t('redeemOffer.scanPermissionDenied'));
        return;
      }
    }
    setScannerOpen(true);
  }, [permission?.granted, requestPermission, t]);

  const handleBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (scanLockRef.current) return;
      scanLockRef.current = true;
      applyScannedCode(data);
    },
    [applyScannedCode],
  );

  const handleUploadQr = useCallback(async () => {
    if (isUploadingQr) return;
    setIsUploadingQr(true);
    try {
      const mediaPermission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (mediaPermission.status !== 'granted') {
        toast.error(t('redeemOffer.uploadPermissionDenied'));
        return;
      }

      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
        allowsEditing: false,
      });
      if (picked.canceled || !picked.assets[0]?.uri) return;

      const barcodes = await scanFromURLAsync(picked.assets[0].uri, ['qr']);
      const payload = barcodes[0]?.data?.trim();
      if (!payload) {
        toast.error(t('redeemOffer.uploadNoQrFound'));
        return;
      }

      applyScannedCode(payload);
    } catch (error) {
      console.error('Failed to upload redeem QR:', error);
      toast.error(t('redeemOffer.uploadFailed'));
    } finally {
      setIsUploadingQr(false);
    }
  }, [applyScannedCode, isUploadingQr, t]);

  if (!isBusinessAccountType(accountType ?? undefined)) {
    return null;
  }

  const trimmed = code.trim().toUpperCase();
  const isUsed = Boolean(result?.used_at);
  const customerLabel =
    result?.customer?.first_name?.trim() ||
    result?.customer?.username ||
    t('redeemOffer.unknownCustomer');

  const handleValidate = () => {
    if (!trimmed) {
      toast.error(t('redeemOffer.codeRequired'));
      return;
    }
    validateMutation.mutate(trimmed);
  };

  const handleMarkUsed = () => {
    if (!result || isUsed) return;
    useMutationMark.mutate({ code: result.code, kind: result.kind });
  };

  const uploadQrLabel = isUploadingQr
    ? t('redeemOffer.uploadingQr')
    : t('redeemOffer.uploadQr');

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
      <PageHeader title={t('redeemOffer.title')} />
      <AppScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-4 pb-8 pt-2"
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          label={t('redeemOffer.codeLabel')}
          required
          value={code}
          onChangeText={(next) => {
            setCode(next.toUpperCase());
            setResult(null);
          }}
          placeholder={t('redeemOffer.codePlaceholder')}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleValidate}
        />

        <View className="flex-row flex-wrap gap-2">
          <LocalNotesButton
            label={
              validateMutation.isPending
                ? t('redeemOffer.validating')
                : t('redeemOffer.validate')
            }
            onPress={handleValidate}
            variant="brand"
            size="sm"
            loading={validateMutation.isPending}
            disabled={!trimmed}
            isWidthFull={false}
          />
          <LocalNotesButton
            label={t('redeemOffer.scanQr')}
            onPress={() => void handleOpenScanner()}
            variant="light"
            size="sm"
            isWidthFull={false}
          />
          <LocalNotesButton
            label={uploadQrLabel}
            onPress={() => void handleUploadQr()}
            variant="light"
            size="sm"
            loading={isUploadingQr}
            isWidthFull={false}
          />
        </View>

        {result ? (
          <WhiteBox className="gap-3 p-4">
            <View>
              <Text className="font-geist text-xs text-gray-500 dark:text-gray-400">
                {t('redeemOffer.offerLabel')}
              </Text>
              <Text className="font-geist-semibold text-base text-ink dark:text-gray-100">
                {result.title}
              </Text>
            </View>

            <View>
              <Text className="font-geist text-xs text-gray-500 dark:text-gray-400">
                {t('redeemOffer.customerLabel')}
              </Text>
              <Text className="font-geist-semibold text-base text-ink dark:text-gray-100">
                {customerLabel}
              </Text>
              {result.customer?.username ? (
                <Text className="font-geist text-sm text-gray-500 dark:text-gray-400">
                  @{result.customer.username}
                </Text>
              ) : null}
            </View>

            <View>
              <Text className="mb-1 font-geist-extrabold text-xl tracking-widest text-ink dark:text-gray-100">
                {result.code}
              </Text>
              {isUsed ? (
                <>
                  <Text className="font-geist-semibold text-sm text-brand">
                    {t('redeemOffer.statusUsed')}
                  </Text>
                  <Text className="mt-0.5 font-geist text-xs text-gray-500 dark:text-gray-400">
                    {t('redeemOffer.usedAt', {
                      time: formatRelativeTime(result.used_at as string),
                    })}
                  </Text>
                </>
              ) : (
                <Text className="font-geist-semibold text-sm text-green-700 dark:text-green-400">
                  {t('redeemOffer.statusUnused')}
                </Text>
              )}
            </View>

            <LocalNotesButton
              label={
                useMutationMark.isPending
                  ? t('redeemOffer.markingUsed')
                  : t('redeemOffer.markUsed')
              }
              onPress={handleMarkUsed}
              variant="dark"
              size="sm"
              loading={useMutationMark.isPending}
              disabled={isUsed}
            />
          </WhiteBox>
        ) : null}

        <View className="mt-2 gap-3">
          <Text className="font-geist-semibold text-base text-ink dark:text-gray-100">
            {t('redeemOffer.historyTitle')}
          </Text>

          {redeemedQuery.isPending && redeemedItems.length === 0 ? (
            <View className="items-center py-6">
              <ActivityIndicator color="#FF6B1A" />
              <Text className="mt-2 font-geist text-sm text-gray-500 dark:text-gray-400">
                {t('redeemOffer.historyLoading')}
              </Text>
            </View>
          ) : redeemedQuery.isError && redeemedItems.length === 0 ? (
            <WhiteBox className="items-center gap-3 p-4">
              <Text className="text-center font-geist text-sm text-gray-500 dark:text-gray-400">
                {t('redeemOffer.historyError')}
              </Text>
              <LocalNotesButton
                label={t('redeemOffer.historyRetry')}
                onPress={() => void redeemedQuery.refetch()}
                variant="light"
                size="xs"
                isWidthFull={false}
              />
            </WhiteBox>
          ) : redeemedItems.length === 0 ? (
            <WhiteBox className="p-4">
              <Text className="font-geist text-sm text-gray-500 dark:text-gray-400">
                {t('redeemOffer.historyEmpty')}
              </Text>
            </WhiteBox>
          ) : (
            <View className="gap-2">
              {redeemedItems.map((item) => {
                const name =
                  item.customer?.first_name?.trim() ||
                  item.customer?.username ||
                  t('redeemOffer.unknownCustomer');
                return (
                  <WhiteBox key={item.id} className="gap-1.5 p-4">
                    <Text className="font-geist-semibold text-base text-ink dark:text-gray-100">
                      {item.title}
                    </Text>
                    <Text className="font-geist-extrabold text-sm tracking-widest text-ink dark:text-gray-100">
                      {item.code}
                    </Text>
                    <Text className="font-geist text-sm text-gray-600 dark:text-gray-300">
                      {name}
                      {item.customer?.username ? ` (@${item.customer.username})` : ''}
                    </Text>
                    {item.used_at ? (
                      <Text className="font-geist text-xs text-gray-500 dark:text-gray-400">
                        {t('redeemOffer.usedAt', {
                          time: formatRelativeTime(item.used_at),
                        })}
                      </Text>
                    ) : null}
                  </WhiteBox>
                );
              })}

              {redeemedQuery.hasNextPage ? (
                <LocalNotesButton
                  label={
                    redeemedQuery.isFetchingNextPage
                      ? t('redeemOffer.historyLoading')
                      : t('redeemOffer.historyLoadMore')
                  }
                  onPress={() => void redeemedQuery.fetchNextPage()}
                  variant="light"
                  size="sm"
                  loading={redeemedQuery.isFetchingNextPage}
                />
              ) : null}
            </View>
          )}
        </View>
      </AppScrollView>

      <RNModal
        visible={scannerOpen}
        animationType="slide"
        onRequestClose={() => setScannerOpen(false)}
      >
        <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
          <View className="flex-row items-center justify-between px-4 py-3">
            <Text className="font-geist-semibold text-base text-white">
              {t('redeemOffer.scanTitle')}
            </Text>
            <Pressable
              onPress={() => setScannerOpen(false)}
              accessibilityRole="button"
              accessibilityLabel={t('redeemOffer.scanClose')}
              className="h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/15"
              hitSlop={4}
            >
              <X size={18} color="#FFFFFF" strokeWidth={2.4} />
            </Pressable>
          </View>

          {permission?.granted ? (
            <View className="flex-1">
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={
                  isUploadingQr ? undefined : handleBarcodeScanned
                }
              />
              <View
                className="absolute bottom-0 left-0 right-0 items-center gap-3 px-6"
                style={{ paddingBottom: Math.max(insets.bottom, 24) + 16 }}
              >
                <Text className="rounded-full bg-black/60 px-4 py-2 text-center font-geist text-sm text-white">
                  {t('redeemOffer.scanHint')}
                </Text>
                <LocalNotesButton
                  label={uploadQrLabel}
                  onPress={() => void handleUploadQr()}
                  variant="light"
                  size="sm"
                  loading={isUploadingQr}
                  isWidthFull={false}
                />
              </View>
            </View>
          ) : (
            <View className="flex-1 items-center justify-center gap-3 px-8">
              <Text className="mb-1 text-center font-geist text-base text-white">
                {t('redeemOffer.scanPermissionNeeded')}
              </Text>
              <LocalNotesButton
                label={t('redeemOffer.scanQr')}
                onPress={() => void handleOpenScanner()}
                variant="brand"
                size="sm"
                isWidthFull={false}
              />
              <LocalNotesButton
                label={uploadQrLabel}
                onPress={() => void handleUploadQr()}
                variant="light"
                size="sm"
                loading={isUploadingQr}
                isWidthFull={false}
              />
            </View>
          )}
        </View>
      </RNModal>
    </View>
  );
}
