import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Plus, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { TextInput } from '@/components/ui/TextInput';
import accountService from '@/http/account-api/account.services';
import type { searchUserDAO } from '@/http/account-api/types';
import { resolveImageUrl } from '@/utils/httpHelpers';
import { resolveUserLabels } from '@/utils/userDisplayName';

export interface ShareInfo {
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
}

interface UserSearchInputProps {
  selectedUsers: searchUserDAO[];
  onAddUser: (user: searchUserDAO) => void;
  onRemoveUser: (userId: string) => void;
  className?: string;
  placeholderKey?: string;
  showSelectedLabel?: boolean;
  /** Caps the height of the results list so it scrolls instead of growing its container. */
  resultsClassName?: string;
  /** Caps the height of the selected-users area so it scrolls instead of growing its container. */
  selectedClassName?: string;
  /** Optional preview of the content being shared. */
  shareInfo?: ShareInfo | null;
}

export function UserSearchInput({
  selectedUsers,
  onAddUser,
  onRemoveUser,
  className = 'mt-3 gap-3 border-t border-brand/20 pt-3',
  placeholderKey = 'listForm.placeholders.searchUsers',
  showSelectedLabel = true,
  resultsClassName = 'max-h-40',
  selectedClassName,
  shareInfo,
}: UserSearchInputProps) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#FFFFFF' : '#1A1714';
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<searchUserDAO[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchUsers = useCallback(async (value: string) => {
    if (!value.trim()) {
      setResults([]);
      setShowResults(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await accountService.searchUser({ q: value });
      const data = response.data?.data ?? [];
      setResults(data);
      setShowResults(data.length > 0);
    } catch {
      setResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void searchUsers(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchUsers]);

  const availableResults = useMemo(
    () => results.filter((user) => !selectedUsers.some((s) => s.id === user.id)),
    [results, selectedUsers],
  );

  const handleSelect = (user: searchUserDAO) => {
    onAddUser(user);
    setQuery('');
    setShowResults(false);
  };

  const resolvedShareImage = resolveImageUrl(shareInfo?.imageUrl ?? undefined);

  return (
    <View className={className} style={{ flexShrink: 1, minHeight: 0 }}>
      {shareInfo ? (
        <View className="flex-row items-center gap-3 rounded-xl border border-gray-200 bg-soft/60 px-3 py-2.5 dark:border-dk-border dark:bg-dk-page">
          {resolvedShareImage ? (
            <Image
              source={{ uri: resolvedShareImage }}
              className="h-12 w-12 rounded-lg bg-gray-200 dark:bg-dk-elevated"
              resizeMode="cover"
            />
          ) : (
            <View className="h-12 w-12 items-center justify-center rounded-lg bg-brand/10">
              <Text className="font-geist-bold text-sm text-brand dark:text-dk-text">
                {shareInfo.title.slice(0, 1).toUpperCase()}
              </Text>
            </View>
          )}
          <View className="min-w-0 flex-1">
            <Text className="font-geist text-[11px] uppercase tracking-wide text-gray-400 dark:text-dk-faint">
              {t('share.sharingLabel')}
            </Text>
            <Text
              className="font-geist-semibold text-sm text-ink dark:text-dk-text"
              numberOfLines={1}
            >
              {shareInfo.title}
            </Text>
            {shareInfo.subtitle ? (
              <Text
                className="font-geist text-xs text-gray-500 dark:text-dk-muted"
                numberOfLines={2}
              >
                {shareInfo.subtitle}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}

      <View className="flex-row items-end gap-2">
        <View className="flex-1">
          <TextInput
            placeholder={t(placeholderKey)}
            value={query}
            onChangeText={setQuery}
            onFocus={() => {
              if (availableResults.length > 0) setShowResults(true);
            }}
          />
        </View>
      </View>

      {isSearching ? (
        <ActivityIndicator size="small" color="#1A1714" />
      ) : null}

      {showResults && availableResults.length > 0 ? (
        <ScrollView
          className={resultsClassName}
          style={{ flexShrink: 1 }}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-1">
            {availableResults.map((user) => (
              <Pressable
                key={user.id}
                onPress={() => handleSelect(user)}
                className="flex-row items-center justify-between rounded-lg px-3 py-2 dark:bg-dk-card cursor-pointer"
              >
                <View className="flex-1 flex-row items-center gap-2">
                  <Avatar
                    name={resolveUserLabels(user).primary}
                    src={user.profile_image_url ?? undefined}
                    size="sm"
                  />
                  <Text className="font-geist-medium text-sm text-ink dark:text-dk-text">
                    {resolveUserLabels(user).primary}
                  </Text>
                </View>
                <Plus size={18} color={iconColor} />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : null}

      {selectedUsers.length > 0 ? (
        <View className="gap-2" style={{ flexShrink: 1, minHeight: 0 }}>
          {showSelectedLabel ? (
            <Text className="font-geist-medium text-sm text-ink dark:text-dk-text">
              {t('listForm.fields.selectedUsers')}
            </Text>
          ) : null}
          <ScrollView
            className={selectedClassName}
            style={{ flexShrink: 1 }}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-row flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <Badge
                  key={user.id}
                  label={resolveUserLabels(user).primary}
                  variant="primary"
                  leftIcon={
                    <Avatar
                      name={resolveUserLabels(user).primary}
                      src={user.profile_image_url ?? undefined}
                      size="sm"
                    />
                  }
                  rightIcon={
                    <Pressable
                      onPress={() => onRemoveUser(user.id)}
                      hitSlop={8}
                      className="cursor-pointer"
                    >
                      <X size={14} color="#1A1714" />
                    </Pressable>
                  }
                />
              ))}
            </View>
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
