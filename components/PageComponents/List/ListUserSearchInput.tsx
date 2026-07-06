import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Plus, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import { TextInput } from '@/components/ui/TextInput';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import accountService from '@/http/account-api/account.services';
import type { searchUserDAO } from '@/http/account-api/types';

interface ListUserSearchInputProps {
  selectedUsers: searchUserDAO[];
  onAddUser: (user: searchUserDAO) => void;
  onRemoveUser: (userId: string) => void;
}

export function ListUserSearchInput({
  selectedUsers,
  onAddUser,
  onRemoveUser,
}: ListUserSearchInputProps) {
  const { t } = useTranslation();
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

  return (
    <View className="mt-3 gap-3 border-t border-brand/20 pt-3">
      <View className="flex-row items-end gap-2">
        <View className="flex-1">
          <TextInput
            placeholder={t('listForm.placeholders.searchUsers')}
            value={query}
            onChangeText={setQuery}
            onFocus={() => {
              if (availableResults.length > 0) setShowResults(true);
            }}
          />
        </View>
      </View>

      {isSearching ? (
        <ActivityIndicator size="small" color="#FF6B1A" />
      ) : null}

      {showResults && availableResults.length > 0 ? (
        <ScrollView className="max-h-40" nestedScrollEnabled>
          <View className="gap-1">
            {availableResults.map((user) => (
              <Pressable
                key={user.id}
                onPress={() => handleSelect(user)}
                className="flex-row items-center justify-between rounded-lg px-3 py-2 dark:bg-gray-800 cursor-pointer"
              >
                <Text className="font-geist-medium text-sm text-ink dark:text-gray-100">
                  {user.name}
                </Text>
                <Plus size={18} color="#FF6B1A" />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : null}

      {selectedUsers.length > 0 ? (
        <View className="gap-2">
          <Text className="font-geist-medium text-sm text-ink dark:text-gray-100">
            {t('listForm.fields.selectedUsers')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {selectedUsers.map((user) => (
              <Badge
                key={user.id}
                label={user.name}
                variant="primary"
                rightIcon={
                  <Pressable
                    onPress={() => onRemoveUser(user.id)}
                    hitSlop={8}
                    className="cursor-pointer"
                  >
                    <X size={14} color="#FF6B1A" />
                  </Pressable>
                }
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}
