import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { NoImage } from '@/components/ui/NoImage';
import { TextInput } from '@/components/ui/TextInput';
import listService from '@/http/list-api/list.service';
import type { ListItemPublic } from '@/http/list-api/types';
import { resolveImageUrl } from '@/utils/httpHelpers';
import { mapListItemPublicToPickTag } from '@/utils/listPickMappers';
import { useListFormStore } from '@/stores/useListFormStore';
import { ListPickCreatorRow } from '@/components/PageComponents/List/ListPickCreatorRow';

interface LinkExistingPicksSectionProps {
  selectedServerIds: string[];
}

export function LinkExistingPicksSection({
  selectedServerIds,
}: LinkExistingPicksSectionProps) {
  const { t } = useTranslation();
  const { height: windowHeight } = useWindowDimensions();
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [libraryPicks, setLibraryPicks] = useState<ListItemPublic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const items = useListFormStore((s) => s.items);
  const addItem = useListFormStore((s) => s.addItem);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [keyword]);

  useEffect(() => {
    let cancelled = false;

    async function loadPicks() {
      setIsLoading(true);
      try {
        const response = await listService.fetchListItems(
          debouncedKeyword ? { keyword: debouncedKeyword } : undefined,
        );
        if (!cancelled) {
          setLibraryPicks(response.data?.data ?? []);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadPicks();
    return () => {
      cancelled = true;
    };
  }, [debouncedKeyword]);

  const availablePicks = useMemo(
    () =>
      libraryPicks
        .filter((pick) => !selectedServerIds.includes(pick.id))
        .sort((a, b) => {
          const aHasImage = (a.images?.length ?? 0) > 0;
          const bHasImage = (b.images?.length ?? 0) > 0;
          if (aHasImage === bHasImage) return 0;
          return aHasImage ? -1 : 1;
        }),
    [libraryPicks, selectedServerIds],
  );

  const handleLink = useCallback(
    (pick: ListItemPublic) => {
      if (items.some((item) => item.serverItemId === pick.id)) return;
      addItem(mapListItemPublicToPickTag(pick));
    },
    [addItem, items],
  );

  return (
    <View className="gap-3 rounded-2xl border border-gray-200 bg-soft/60 p-4 dark:border-gray-700 dark:bg-gray-800/60">
      <TextInput
        placeholder={t('listForm.placeholders.searchPicks')}
        value={keyword}
        onChangeText={setKeyword}
      />

      {isLoading ? (
        <View className="flex-row items-center gap-2 py-2">
          <ActivityIndicator size="small" color="#FF6B1A" />
          <Text className="font-geist text-sm text-gray-400">
            {t('listForm.linkPicks.loading')}
          </Text>
        </View>
      ) : availablePicks.length === 0 ? (
        <Text className="py-2 font-geist text-sm text-gray-400">
          {libraryPicks.length === 0
            ? t('listForm.linkPicks.empty')
            : t('listForm.linkPicks.allLinked')}
        </Text>
      ) : (
        <ScrollView
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: windowHeight * 0.42 }}
        >
          <View className="gap-2">
            {availablePicks.map((pick) => {
              const thumbnail = pick.images?.[0];
              return (
                <Pressable
                  key={pick.id}
                  onPress={() => handleLink(pick)}
                  className="flex-row items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 dark:border-gray-700 dark:bg-gray-900 cursor-pointer"
                >
                  {thumbnail ? (
                    <Image
                      source={{
                        uri: resolveImageUrl(thumbnail.url) ?? thumbnail.url,
                      }}
                      className="h-12 w-12 shrink-0 rounded-lg"
                    />
                  ) : (
                    <NoImage
                      personalityColor={pick.owner.personality_color}
                      size="sm"
                    />
                  )}
                  <View className="min-w-0 flex-1">
                    <Text
                      className="font-geist-medium text-sm text-ink dark:text-gray-100"
                      numberOfLines={1}
                    >
                      {pick.business_name ?? 'Unnamed place'}
                    </Text>
                    {pick.description ? (
                      <Text
                        className="font-geist text-xs text-gray-500 dark:text-gray-400"
                        numberOfLines={1}
                      >
                        {pick.description}
                      </Text>
                    ) : null}
                    {pick.owner ? <ListPickCreatorRow owner={pick.owner} /> : null}
                  </View>
                  <Plus size={20} color="#FF6B1A" />
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
