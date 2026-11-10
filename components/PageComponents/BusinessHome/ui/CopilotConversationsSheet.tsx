import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import type { TextInput as RNTextInput } from 'react-native';
import { Pencil, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { CardOptionsMenu } from '@/components/ui/CardOptionsMenu';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { Modal } from '@/components/ui/Modal';
import { TextInput } from '@/components/ui/TextInput';
import { toast } from '@/components/ui/Toast';
import { useCopilotThreads } from '@/hooks/useCopilotThreads';
import { useSelectedBranch } from '@/hooks/useSelectedBranch';
import type { CopilotThreadSummaryDAO } from '@/http/business-api/types';
import { COPILOT_THREAD_TITLE_MAX, validateThreadTitle } from '@/utils/copilot';
import { formatRelativeTime } from '@/utils/time';
import { cn } from '@/utils/cn';

/** iOS can't present a second RN Modal until the first has finished dismissing. */
const MODAL_HANDOFF_DELAY_MS = 350;

interface CopilotConversationsSheetProps {
  visible: boolean;
  onClose: () => void;
  activeThreadId: string | null;
  onOpenThread: (threadId: string) => void;
  onNewChat: () => void;
  isPaid?: boolean;
}

/** The selected branch's conversations: open, start a new chat, rename, delete. */
export function CopilotConversationsSheet({
  visible,
  onClose,
  activeThreadId,
  onOpenThread,
  onNewChat,
  isPaid,
}: CopilotConversationsSheetProps) {
  const { t } = useTranslation();
  const { branchName } = useSelectedBranch();
  const { query, threads, rename, remove } = useCopilotThreads({ isPaid });

  const [renaming, setRenaming] = useState<CopilotThreadSummaryDAO | null>(null);
  const [title, setTitle] = useState('');
  const [deleting, setDeleting] = useState<CopilotThreadSummaryDAO | null>(null);
  const handoffTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const renameInputRef = useRef<RNTextInput>(null);

  useEffect(
    () => () => {
      if (handoffTimerRef.current) clearTimeout(handoffTimerRef.current);
    },
    [],
  );

  const titleError = validateThreadTitle(title);
  const showTitleError = title.length > 0 && titleError === 'too_long';

  const openRename = (thread: CopilotThreadSummaryDAO) => {
    setTitle(thread.title);
    if (handoffTimerRef.current) clearTimeout(handoffTimerRef.current);
    handoffTimerRef.current = setTimeout(() => setRenaming(thread), MODAL_HANDOFF_DELAY_MS);
  };

  const submitRename = () => {
    if (!renaming || validateThreadTitle(title) !== null) return;
    const target = renaming;
    setRenaming(null);
    rename.mutate(
      { threadId: target.id, title: title.trim() },
      { onError: () => toast.error(t('businessHome.copilot.conversations.renameFailed')) },
    );
  };

  const openDelete = (thread: CopilotThreadSummaryDAO) => {
    if (handoffTimerRef.current) clearTimeout(handoffTimerRef.current);
    handoffTimerRef.current = setTimeout(() => setDeleting(thread), MODAL_HANDOFF_DELAY_MS);
  };

  const confirmDelete = () => {
    if (!deleting) return;
    const target = deleting;
    setDeleting(null);
    remove.mutate(target.id, {
      onError: () => toast.error(t('businessHome.copilot.conversations.deleteFailed')),
    });
    // Deleting the open conversation drops the screen onto a new chat straight away.
    if (target.id === activeThreadId) onNewChat();
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={t('businessHome.copilot.conversations.title', { branchName })}
      sheetHeightRatio={0.85}
      keyboardAvoidanceEnabled={false}
    >
      <Text className="absolute -top-4 pb-2 font-geist text-[11px] text-gray-500 dark:text-gray-400">
        {t('businessHome.copilot.conversations.retentionNote')}
      </Text>
      {/* New Chat Button */}
      <View className="mb-2 flex-row justify-end">
        <LocalNotesButton
          label={t('businessHome.copilot.conversations.newChat')}
          onPress={() => {
            onNewChat();
            onClose();
          }}
          variant="brand"
          size="xs"
          isWidthFull={false}
        />
      </View>

      {query.isPending ? (
        <View className="items-center py-10">
          <ActivityIndicator color="#FF6B1A" />
        </View>
      ) : query.isError ? (
        <View className="items-center gap-3 py-8">
          <Text className="font-geist text-sm text-gray-600 dark:text-gray-400">
            {t('businessHome.copilot.conversations.error')}
          </Text>
          <LocalNotesButton
            label={t('businessHome.copilot.conversations.retry')}
            onPress={() => void query.refetch()}
            variant="light"
            size="xs"
            isWidthFull={false}
          />
        </View>
      ) : threads.length === 0 ? (
        <Text className="py-8 text-center font-geist text-sm text-gray-500 dark:text-gray-400">
          {t('businessHome.copilot.conversations.empty')}
        </Text>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.id}
          className="max-h-[58vh]"
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
          }}
          ListFooterComponent={
            query.isFetchingNextPage ? <ActivityIndicator className="py-3" color="#FF6B1A" /> : null
          }
          renderItem={({ item }) => {
            const active = item.id === activeThreadId;
            return (
              <View className="flex-row items-center border-b border-gray-100 py-1 dark:border-gray-800">
                <Pressable
                  onPress={() => {
                    onOpenThread(item.id);
                    onClose();
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  className="min-w-0 flex-1 flex-row items-center gap-2 py-2 active:opacity-70"
                >
                  <View
                    className={cn('h-2 w-2 rounded-full', active ? 'bg-brand' : 'bg-transparent')}
                  />
                  <View className="min-w-0 flex-1">
                    <View className="flex-row items-baseline justify-between gap-2">
                      <Text
                        numberOfLines={1}
                        className="flex-1 font-geist-bold text-sm text-ink dark:text-gray-100"
                      >
                        {item.title || t('businessHome.copilot.conversations.untitled')}
                      </Text>
                      <Text className="font-geist text-[11px] text-gray-500 dark:text-gray-400">
                        {formatRelativeTime(item.last_message_at)}
                      </Text>
                    </View>
                    {item.preview ? (
                      <Text
                        numberOfLines={1}
                        className="mt-0.5 font-geist text-xs text-gray-500 dark:text-gray-400"
                      >
                        {item.preview}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
                <CardOptionsMenu
                  accessibilityLabel={t('businessHome.copilot.conversations.options')}
                  items={[
                    {
                      kind: 'action',
                      key: 'rename',
                      label: t('businessHome.copilot.conversations.rename'),
                      icon: Pencil,
                      onPress: () => openRename(item),
                    },
                    {
                      kind: 'action',
                      key: 'delete',
                      label: t('businessHome.copilot.conversations.delete'),
                      icon: Trash2,
                      variant: 'destructive',
                      onPress: () => openDelete(item),
                    },
                  ]}
                />
              </View>
            );
          }}
        />
      )}

      <Modal
        visible={renaming !== null}
        onClose={() => setRenaming(null)}
        onShow={() => renameInputRef.current?.focus()}
        syncEnterWithKeyboard
        title={t('businessHome.copilot.conversations.renameTitle')}
      >
        <TextInput
          ref={renameInputRef}
          value={title}
          onChangeText={setTitle}
          placeholder={t('businessHome.copilot.conversations.renamePlaceholder')}
          returnKeyType="done"
          onSubmitEditing={submitRename}
          error={
            showTitleError
              ? t('businessHome.copilot.conversations.renameTooLong', {
                  max: COPILOT_THREAD_TITLE_MAX,
                })
              : undefined
          }
        />
        <View className="mt-4 pb-2">
          <LocalNotesButton
            label={t('businessHome.copilot.conversations.renameSave')}
            onPress={submitRename}
            variant="dark"
            size="sm"
            disabled={titleError !== null}
          />
        </View>
      </Modal>

      <ConfirmDeleteModal
        visible={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title={t('businessHome.copilot.conversations.deleteConfirmTitle')}
        message={t('businessHome.copilot.conversations.deleteConfirmBody')}
      />
    </Modal>
  );
}
