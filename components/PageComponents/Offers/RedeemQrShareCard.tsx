import { forwardRef } from "react";
import { Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

export interface RedeemQrShareCardProps {
  code: string;
  offerTitle: string;
  businessName: string;
  expiresLabel?: string | null;
  showAtCounterLabel: string;
  redeemCodeLabel: string;
}

/**
 * Light-mode branded card captured via view-shot for download/share.
 * Keep styling light-only so the saved PNG is readable everywhere.
 */
export const RedeemQrShareCard = forwardRef<View, RedeemQrShareCardProps>(
  function RedeemQrShareCard(
    {
      code,
      offerTitle,
      businessName,
      expiresLabel,
      showAtCounterLabel,
      redeemCodeLabel,
    },
    ref,
  ) {
    return (
      <View
        ref={ref}
        collapsable={false}
        style={{
          width: 360,
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            backgroundColor: "#FFF7ED",
            paddingHorizontal: 24,
            paddingVertical: 16,
          }}
        >
          <Text
            style={{
              color: "#FF6B1A",
              fontSize: 20,
              fontWeight: "800",
            }}
          >
            LocalNotes
          </Text>
        </View>

        <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28 }}>
          <Text
            style={{
              color: "#1C1917",
              fontSize: 22,
              fontWeight: "700",
              marginBottom: 6,
            }}
            numberOfLines={3}
          >
            {offerTitle}
          </Text>
          <Text
            style={{
              color: "#78716C",
              fontSize: 15,
              fontWeight: "500",
              marginBottom: expiresLabel ? 4 : 16,
            }}
            numberOfLines={2}
          >
            {businessName}
          </Text>
          {expiresLabel ? (
            <Text
              style={{
                color: "#FF6B1A",
                fontSize: 13,
                fontWeight: "600",
                marginBottom: 16,
              }}
            >
              {expiresLabel}
            </Text>
          ) : null}

          <View style={{ alignItems: "center", marginBottom: 16 }}>
            <View
              style={{
                backgroundColor: "#FFFFFF",
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#FED7AA",
              }}
            >
              <QRCode value={code} size={200} backgroundColor="#FFFFFF" color="#1C1917" />
            </View>
          </View>

          <Text
            style={{
              color: "#78716C",
              fontSize: 12,
              fontWeight: "500",
              textAlign: "center",
              marginBottom: 4,
            }}
          >
            {redeemCodeLabel}
          </Text>
          <Text
            style={{
              color: "#1C1917",
              fontSize: 28,
              fontWeight: "800",
              letterSpacing: 4,
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            {code}
          </Text>
          <Text
            style={{
              color: "#78716C",
              fontSize: 13,
              fontWeight: "500",
              textAlign: "center",
            }}
          >
            {showAtCounterLabel}
          </Text>
        </View>
      </View>
    );
  },
);
