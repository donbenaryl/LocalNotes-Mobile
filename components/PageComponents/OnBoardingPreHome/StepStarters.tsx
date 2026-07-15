import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { LocalNotesButton } from "../../ui/LocalNotesButton";
import { PageFooterWrapper } from "../../ui/PageFooterWrapper";
import { PageTitleHeading } from "@/components/ui/PageTitleHeading";
import accountServices from "@/http/account-api/account.services";
import searchService from "@/http/search-api/search.service";
import type { UnifiedSearchPersonDAO } from "@/http/search-api/type";
import { UserCard } from "@/components/ui/UserCard";

const STARTER_QUERY = {
  scope: "people" as const,
  limit: 6,
  sort_by: "match" as const,
  sort_order: "desc" as const,
};

const PLACEHOLDER_COVERS = [
  "https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1514361892635-eae31ec08d63?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1200&q=80",
];

const MIN_SELECTION = 3;

export function StepStarters() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const peopleQuery = useQuery({
    queryKey: ["onboarding-starters-people"],
    queryFn: async () => {
      const response = await searchService.fetchStarterPeople(STARTER_QUERY);
      return response.data?.data?.people ?? [];
    },
  });

  const people = peopleQuery.data ?? [];
  const pairs: UnifiedSearchPersonDAO[][] = people.reduce<
    UnifiedSearchPersonDAO[][]
  >((acc, _, index) => {
    if (index % 2 === 0) acc.push(people.slice(index, index + 2));
    return acc;
  }, []);

  const toggleTemplate = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isReady = selected.size >= MIN_SELECTION;

  const followMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      await Promise.all(userIds.map((id) => accountServices.followUser(id)));
    },
    onSuccess: () => {
      router.replace("/(app)/(tabs)/home");
    },
    onError: (error) => {
      console.error("Failed to follow selected users:", error);
    },
  });

  const handleComplete = () => {
    if (!isReady || followMutation.isPending) return;
    followMutation.mutate(Array.from(selected));
  };

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        <PageTitleHeading
          stepTitle={t("preHomeOnboarding.step2.kicker")}
          containerClassName="mb-4"
          alignLeft
          hideLogo
          title={t("preHomeOnboarding.step2.titleRegular")}
          subtitle={t("preHomeOnboarding.step2.titleItalic")}
          description={t("preHomeOnboarding.step2.description")}
        />

        <Text className="font-geist-semibold text-sm mb-5">
          <Text className="text-ink dark:text-gray-100">
            {selected.size} selected
          </Text>
          <Text
            className={
              isReady
                ? "text-brand"
                : "text-gray-400 dark:text-gray-500"
            }
          >
            {" "}
            · {MIN_SELECTION} minimum
          </Text>
        </Text>

        {peopleQuery.isLoading ? (
          <View className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <Text className="text-center font-geist-medium text-gray-500 dark:text-gray-400">
              {t("preHomeOnboarding.step2.loading")}
            </Text>
          </View>
        ) : null}

        {peopleQuery.isError ? (
          <View className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/30">
            <Text className="text-center font-geist-medium text-red-600 dark:text-red-300">
              {t("preHomeOnboarding.step2.loadError")}
            </Text>
          </View>
        ) : null}

        {!peopleQuery.isLoading && !peopleQuery.isError && pairs.length === 0 ? (
          <View className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <Text className="text-center font-geist-medium text-gray-500 dark:text-gray-400">
              {t("preHomeOnboarding.step2.empty")}
            </Text>
          </View>
        ) : null}

        {!peopleQuery.isLoading && !peopleQuery.isError && pairs.length > 0 ? (
          <View className="gap-3">
            {pairs.map((pair, rowIndex) => (
              <View key={rowIndex} className="flex-row gap-3">
                {pair.map((person, personIndex) => {
                  const isSelected = selected.has(person.id);
                  return (
                    <View key={person.id} className="flex-1">
                      <UserCard
                        name={person.name}
                        role={person.personality_name ?? t("preHomeOnboarding.step2.roleFallback")}
                        match={person.match ?? 0}
                        personalityDescription={
                          person.personality_description?.trim() ||
                          person.bio?.trim() ||
                          t("preHomeOnboarding.step2.bioFallback")
                        }
                        avatarUrl={person.profile_image_url}
                        personalityColor={person.personality_color}
                        coverImageUrl={
                          PLACEHOLDER_COVERS[
                            (rowIndex * 2 + personIndex) % PLACEHOLDER_COVERS.length
                          ]
                        }
                        isSelected={isSelected}
                        onPress={() => toggleTemplate(person.id)}
                      />
                    </View>
                  );
                })}
                {pair.length === 1 ? <View className="flex-1" /> : null}
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <PageFooterWrapper>
        <Text className="font-geist-medium text-sm text-center text-gray-500 dark:text-gray-400 mb-2">
          {selected.size} of {people.length} selected
          {isReady && <Text className="text-brand"> · ready to go</Text>}
        </Text>
        <LocalNotesButton
          label={t("preHomeOnboarding.step2.cta")}
          onPress={handleComplete}
          variant="dark"
          isRounded
          disabled={!isReady || followMutation.isPending}
          rightIcon={
            <ChevronRight
              size={18}
              color={isReady && !followMutation.isPending ? "white" : "#9CA3AF"}
            />
          }
        />
      </PageFooterWrapper>
    </View>
  );
}
