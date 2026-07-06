import { Text, View } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { resolveImageUrl } from '@/utils/httpHelpers';

interface ListPickCreatorRowProps {
  owner: {
    id: string;
    name: string;
    profile_image: string | null;
  };
}

export function ListPickCreatorRow({ owner }: ListPickCreatorRowProps) {
  return (
    <View className="mt-1 flex-row items-center gap-1.5">
      <Avatar
        name={owner.name}
        src={resolveImageUrl(owner.profile_image) ?? undefined}
        size="xs"
        userId={owner.id}
      />
      <Text
        className="font-geist-medium text-xs text-gray-400 dark:text-gray-500"
        numberOfLines={1}
      >
        {owner.name}
      </Text>
    </View>
  );
}
