import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { BusinessHomeLocationRow } from "@/constants/businessHomeMock";
import businessService from "@/http/business-api/business.service";
import type { BusinessLocation } from "@/http/business-api/types";
import type { OpeningHours } from "@/utils/openingHours";
import { useBusinessStore } from "@/stores/useBusinessStore";
import { AddBranchModal } from "@/components/PageComponents/Profile/AddBranchModal";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { toast } from "@/components/ui/Toast";
import { BusinessHomeCard } from "../ui/BusinessHomeCard";
import { SectionHeading } from "../ui/SectionHeading";
import { MembershipGate } from "../ui/MembershipGate";
import { MapPin } from "lucide-react-native";

interface LocationsSectionProps {
  locationRows: BusinessHomeLocationRow[];
  isPaidMember: boolean;
}

type AddLocationInput = {
  name: string;
  location: BusinessLocation;
  openingHours: OpeningHours;
};

export function LocationsSection({
  locationRows,
  isPaidMember,
}: LocationsSectionProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const selectBranch = useBusinessStore((s) => s.selectBranch);
  const refreshBusinessInfo = useBusinessStore((s) => s.refreshBusinessInfo);
  const loadOwnedBusinesses = useBusinessStore((s) => s.loadOwnedBusinesses);
  const [addVisible, setAddVisible] = useState(false);

  const showComingSoon = () => {
    Alert.alert(
      t("businessHome.comingSoonTitle"),
      t("businessHome.comingSoonMessage"),
    );
  };

  const { mutateAsync: addLocation, isPending: isAdding } = useMutation({
    mutationFn: async ({ name, location, openingHours }: AddLocationInput) => {
      const res = await businessService.addBranch({
        name,
        location,
        opening_hours: openingHours,
      });
      if (res.error || !res.data?.data) {
        throw new Error(
          res.error?.message ?? t("editProfile.business.saveFailed"),
        );
      }
      return res.data.data;
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(["business-info", data.id], data);
      await Promise.all([refreshBusinessInfo(), loadOwnedBusinesses()]);
      setAddVisible(false);
      toast.success(t("businessHome.locations.added"));
    },
    onError: (err: unknown) => {
      toast.error(
        err instanceof Error
          ? err.message
          : t("editProfile.business.saveFailed"),
      );
    },
  });

  return (
    <>
      <SectionHeading title={t("businessHome.sections.locations")} />
      <BusinessHomeCard>
        {locationRows.length === 0 ? (
          <Text className="py-2 font-geist-semibold text-[13px] text-gray-500">
            {t("businessHome.switcher.noLocations")}
          </Text>
        ) : (
          locationRows.map((row, index) => (
            <Pressable
              key={row.id}
              onPress={() => selectBranch(row.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: row.isViewing }}
              className={`py-2 flex flex-row items-center gap-2  ${
                index > 0 ? "border-t border-gray-100 dark:border-gray-700" : ""
              }`}
            >
              <MapPin size={18} color="red" className="mr-1" />
              <View className={`flex flex-col items-start`}>
                <Text
                  className={`font-geist-semibold text-[13px] ${
                    row.isViewing
                      ? "text-ink dark:text-gray-100"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {row.name}
                  {row.isViewing
                    ? ` · ${t("businessHome.locations.viewing")}`
                    : ""}
                </Text>
                {row.address ? (
                  <Text
                    numberOfLines={1}
                    className="mt-0.5 font-geist text-[12px] text-gray-500"
                  >
                    {row.address}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ))
        )}
        <Text className="mt-1 font-geist-semibold text-[11px] leading-[1.5] text-gray-500">
          {t("businessHome.locations.note")}
        </Text>
        <MembershipGate isPaidMember={isPaidMember} tier="paid">
          <Text className="mt-1 font-geist-semibold text-[11px] leading-[1.5] text-gray-500">
            {t("businessHome.locations.paidNote")}
          </Text>
        </MembershipGate>
        <View className="mt-2.5 flex-row flex-wrap gap-1.5 self-end">
          <LocalNotesButton
            label={t("businessHome.buttons.compareLocations")}
            onPress={showComingSoon}
            variant="light"
            size="sm"
            isWidthFull={false}
          />
          <LocalNotesButton
            label={t("businessHome.buttons.addLocation")}
            onPress={() => setAddVisible(true)}
            variant="ghost"
            size="sm"
            isWidthFull={false}
          />
        </View>
      </BusinessHomeCard>
      <AddBranchModal
        visible={addVisible}
        onClose={() => setAddVisible(false)}
        loading={isAdding}
        onSave={async (name, location, openingHours) => {
          try {
            await addLocation({ name, location, openingHours });
          } catch {
            // Surfaced via onError toast; keep the sheet open for retry.
          }
        }}
      />
    </>
  );
}
