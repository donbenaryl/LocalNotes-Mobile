import { Image, Pressable, Text, View } from 'react-native';
import { Pencil, Trash2 } from 'lucide-react-native';
import { NoImage } from '@/components/ui/NoImage';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/useAuthStore';
import { resolveImageUrl } from '@/utils/httpHelpers';
import { getPickDisplayName, getPickSubtitle } from '@/utils/listPickMappers';
import { isOthersCategoryName } from '@/utils/listCategories';
import { ListPickCreatorRow } from '@/components/PageComponents/List/ListPickCreatorRow';
import type { ListPickDraft } from '@/types/listForm';

interface ListFormPickRowProps {
  pick: ListPickDraft;
  onEdit: () => void;
  onDelete: () => void;
}

export function ListFormPickRow({ pick, onEdit, onDelete }: ListFormPickRowProps) {
  const user = useAuthStore((s) => s.user);
  const userPersonalityColor = user?.personalityColor;
  const thumbnailUri =
    pick.existingImages?.[0]?.url
      ? resolveImageUrl(pick.existingImages[0].url) ?? pick.existingImages[0].url
      : pick.newFiles?.[0]?.uri;

  const canEdit = !pick.linkedFromLibrary;
  const creator =
    pick.owner ??
    (user
      ? {
          id: user.id,
          name: user.fullName,
          profile_image: user.profileImageUrl ?? null,
        }
      : null);

  return (
    <View className="flex-row items-start gap-3 rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
      {thumbnailUri ? (
        <Image
          source={{ uri: thumbnailUri }}
          className="h-12 w-12 shrink-0 rounded-lg"
        />
      ) : (
        <NoImage
          personalityColor={pick.ownerPersonalityColor ?? userPersonalityColor}
          size="sm"
        />
      )}

      <View className="min-w-0 flex-1">
        <Text
          className="font-geist-semibold text-sm text-ink dark:text-gray-100"
          numberOfLines={1}
        >
          {getPickDisplayName(pick)}
        </Text>
        {getPickSubtitle(pick) ? (
          <Text
            className="mt-0.5 font-geist text-xs text-gray-500 dark:text-gray-400"
            numberOfLines={2}
          >
            {getPickSubtitle(pick)}
          </Text>
        ) : null}
        {pick.categories && pick.categories.length > 0 ? (
          <View className="mt-1 flex-row flex-wrap items-center gap-1">
            {pick.categories.map((category) => (
              <Badge
                key={category.id || category.name}
                label={isOthersCategoryName(category.name) ? (pick.others_name ?? category.name) : category.name}
                variant="secondary"
              />
            ))}
          </View>
        ) : null}
        {creator ? <ListPickCreatorRow owner={creator} /> : null}
      </View>

      <View className="flex-row items-center gap-2">
        {canEdit ? (
          <Pressable
            onPress={onEdit}
            className="h-9 w-9 items-center justify-center rounded-full border border-gray-200 dark:border-gray-600 cursor-pointer"
          >
            <Pencil size={16} color="#9CA3AF" />
          </Pressable>
        ) : null}
        <Pressable
          onPress={onDelete}
          className="h-9 w-9 items-center justify-center rounded-full border border-gray-200 dark:border-gray-600 cursor-pointer"
        >
          <Trash2 size={16} color="#9CA3AF" />
        </Pressable>
      </View>
    </View>
  );
}
