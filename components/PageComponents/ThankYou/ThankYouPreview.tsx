import { useState } from 'react';
import { Text, View, type LayoutChangeEvent } from 'react-native';
import { useTranslation } from 'react-i18next';
import { WhiteBox } from '@/components/ui/WhiteBox';
import { RedeemQrShareCard } from '@/components/PageComponents/Offers/RedeemQrShareCard';

const CARD_WIDTH = 360;

interface ThankYouPreviewProps {
  percent: number;
  validityDays: number;
  businessName: string;
}

export function ThankYouPreview({
  percent,
  validityDays,
  businessName,
}: ThankYouPreviewProps) {
  const { t } = useTranslation();
  const [containerWidth, setContainerWidth] = useState(0);
  const [cardHeight, setCardHeight] = useState(0);

  const offerTitle = t('thankYou.preview.rewardTitle', { percent });
  const expiresLabel = t('thankYou.preview.expiresLabel', {
    days: validityDays,
  });
  const displayName =
    businessName.trim() || t('thankYou.preview.fallbackBusinessName');

  const scale =
    containerWidth > 0 ? Math.min(1, containerWidth / CARD_WIDTH) : 1;

  const onContainerLayout = (event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    if (next > 0 && next !== containerWidth) {
      setContainerWidth(next);
    }
  };

  const onCardLayout = (event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.height);
    if (next > 0 && next !== cardHeight) {
      setCardHeight(next);
    }
  };

  return (
    <WhiteBox className="gap-3 p-4">
      <Text className="font-geist-extrabold text-base text-ink dark:text-gray-100">
        {t('thankYou.preview.title')}
      </Text>

      <Text className="font-geist text-sm leading-5 text-gray-600 dark:text-gray-300">
        {t('thankYou.preview.body')}
      </Text>

      <View
        className="w-full items-center overflow-hidden"
        onLayout={onContainerLayout}
        style={
          cardHeight > 0 && scale < 1
            ? { height: cardHeight * scale }
            : undefined
        }
      >
        <View
          onLayout={onCardLayout}
          style={{
            width: CARD_WIDTH,
            transform:
              scale < 1 && cardHeight > 0
                ? [
                    { translateY: -(cardHeight * (1 - scale)) / 2 },
                    { scale },
                  ]
                : [{ scale }],
          }}
        >
          <RedeemQrShareCard
            code={t('thankYou.preview.previewCode')}
            offerTitle={offerTitle}
            businessName={displayName}
            expiresLabel={expiresLabel}
            redeemCodeLabel={t('offers.detail.yourCode')}
            showAtCounterLabel={t('offers.detail.showAtCounter')}
          />
        </View>
      </View>
    </WhiteBox>
  );
}
