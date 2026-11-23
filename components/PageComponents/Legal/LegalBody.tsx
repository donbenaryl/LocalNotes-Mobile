import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

interface LegalParagraphProps {
  children: ReactNode;
}

export function LegalParagraph({ children }: LegalParagraphProps) {
  return (
    <Text className="text-[13.5px] leading-6 text-gray-600 dark:text-dk-muted mb-2">
      {children}
    </Text>
  );
}

interface LegalBulletListProps {
  items: string[];
}

export function LegalBulletList({ items }: LegalBulletListProps) {
  return (
    <View className="my-2 gap-1.5">
      {items.map((item) => (
        <View key={item} className="flex-row pr-1">
          <Text className="text-[13px] leading-6 text-ink dark:text-dk-body mr-1.5">
            •
          </Text>
          <Text className="flex-1 text-[13px] leading-6 text-gray-600 dark:text-dk-muted">
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}
