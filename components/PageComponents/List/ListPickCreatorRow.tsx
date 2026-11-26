import { Text, View } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { resolveImageUrl } from '@/utils/httpHelpers';
import {
  resolveUserLabels,
  type UserNameFields,
} from '@/utils/userDisplayName';

interface ListPickCreatorRowProps {
  owner: UserNameFields & {
    id: string;
    profile_image: string | null;
  };
}

export function ListPickCreatorRow({ owner }: ListPickCreatorRowProps) {
  const displayName = resolveUserLabels(owner).primary;

  return (
    <View className="mt-1 flex-row items-center gap-1.5">
      <Avatar
        name={displayName}
        src={resolveImageUrl(owner.profile_image) ?? undefined}
        size="xs"
        userId={owner.id}
      />
      <Text
        className="font-geist-medium text-xs text-gray-400 dark:text-dk-faint"
        numberOfLines={1}
      >
        {displayName}
      </Text>
    </View>
  );
}
