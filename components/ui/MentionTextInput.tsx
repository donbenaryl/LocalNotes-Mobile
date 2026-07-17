import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput as RNTextInput,
  View,
} from "react-native";
import type {
  NativeSyntheticEvent,
  TextInputSelectionChangeEventData,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Avatar } from "@/components/ui/Avatar";
import { PageLoader } from "@/components/ui/PageLoader";
import accountService from "@/http/account-api/account.services";
import type { MentionSearchResultItem } from "@/http/account-api/types";

interface MentionTextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onMentionSelect?: (user: MentionSearchResultItem) => void;
  placeholder?: string;
  placeholderTextColor?: string;
  multiline?: boolean;
  className?: string;
}

const MENTION_TRIGGER = /(?:^|\s)@(\w*)$/;

export function MentionTextInput({
  value,
  onChangeText,
  onMentionSelect,
  className,
  ...inputProps
}: MentionTextInputProps) {
  const { t } = useTranslation();
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [forcedSelection, setForcedSelection] = useState<
    { start: number; end: number } | undefined
  >(undefined);
  const [mentionStart, setMentionStart] = useState(0);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [results, setResults] = useState<MentionSearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const beforeCursor = value.slice(0, selection.start);
    const match = beforeCursor.match(MENTION_TRIGGER);
    if (!match) {
      setMentionQuery(null);
      return;
    }
    setMentionStart(selection.start - match[1].length - 1);
    setMentionQuery(match[1]);
  }, [value, selection.start]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!mentionQuery) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(() => {
      void accountService
        .searchMentions({ q: mentionQuery })
        .then((response) => {
          setResults(response.data?.data?.results ?? []);
        })
        .catch(() => setResults([]))
        .finally(() => setIsSearching(false));
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [mentionQuery]);

  const handleSelectionChange = (
    event: NativeSyntheticEvent<TextInputSelectionChangeEventData>,
  ) => {
    setSelection(event.nativeEvent.selection);
    // Once the native input reports the cursor we just forced, stop
    // controlling it so normal typing isn't fought on every keystroke.
    if (forcedSelection) setForcedSelection(undefined);
  };

  const handleSelectMention = (user: MentionSearchResultItem) => {
    const mentionText = `@${user.name} `;
    const newText =
      value.slice(0, mentionStart) + mentionText + value.slice(selection.start);
    const newCursor = mentionStart + mentionText.length;

    onChangeText(newText);
    setSelection({ start: newCursor, end: newCursor });
    setForcedSelection({ start: newCursor, end: newCursor });
    onMentionSelect?.(user);
  };

  const showDropdown =
    mentionQuery !== null && (isSearching || results.length > 0);

  return (
    <View>
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        onSelectionChange={handleSelectionChange}
        selection={forcedSelection}
        className={className}
        {...inputProps}
      />

      {showDropdown ? (
        <View className="mt-1.5 rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          {isSearching ? (
            <View className="flex-row items-center gap-2 px-3 py-2.5">
              <PageLoader fullPage={false} size="small" />
              <Text className="font-geist text-xs text-gray-500 dark:text-gray-400">
                {t("listDetail.searchingMentions")}
              </Text>
            </View>
          ) : (
            <ScrollView className="max-h-40" nestedScrollEnabled>
              {results.map((user) => (
                <Pressable
                  key={user.id}
                  onPress={() => handleSelectMention(user)}
                  className="cursor-pointer flex-row items-center gap-2.5 px-3 py-2"
                >
                  <Avatar
                    name={user.name}
                    src={user.profile_image_url ?? undefined}
                    size="xs"
                  />
                  <View className="min-w-0 flex-1">
                    <Text
                      numberOfLines={1}
                      className="font-geist-medium text-xs text-ink dark:text-gray-100"
                    >
                      {user.name}
                    </Text>
                    <Text
                      numberOfLines={1}
                      className="font-geist text-[11px] text-gray-400"
                    >
                      @{user.username}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      ) : null}
    </View>
  );
}
