import type { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { PageHeader } from '@/components/ui/PageHeader';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { AppRefreshControl } from '@/components/ui/AppRefreshControl';

interface BusinessHomeDetailShellProps {
  title: string;
  onBack: () => void;
  rightChild?: ReactNode;
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** When false, children fill below the header without a scroll view. */
  scroll?: boolean;
  headerBelow?: ReactNode;
}

export function BusinessHomeDetailShell({
  title,
  onBack,
  rightChild,
  children,
  refreshing = false,
  onRefresh,
  scroll = true,
  headerBelow,
}: BusinessHomeDetailShellProps) {
  return (
    <View style={styles.fill} className="bg-page dark:bg-gray-900">
      <PageHeader title={title} onBack={onBack} rightChild={rightChild} borderless />
      {headerBelow}
      {scroll ? (
        <AppScrollView
          style={styles.fill}
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-8"
          refreshControl={
            Platform.OS === 'android' || !onRefresh ? undefined : (
              <AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            )
          }
        >
          {children}
        </AppScrollView>
      ) : (
        <View style={styles.fill}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
