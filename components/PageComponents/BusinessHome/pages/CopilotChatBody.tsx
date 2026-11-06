import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { History, SquarePen } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { toast } from '@/components/ui/Toast';
import { useAiCredits } from '@/hooks/useAiCredits';
import { useCopilotChat } from '@/hooks/useCopilotChat';
import { useCopilotThreads } from '@/hooks/useCopilotThreads';
import { useSelectedBranch } from '@/hooks/useSelectedBranch';
import type { CopilotMessageDAO } from '@/http/business-api/types';
import { canAskCopilot, getErrorStatusCode } from '@/utils/aiCredits';
import {
  canSendQuestion,
  copilotErrorState,
  copilotThreadsQueryKey,
  latestFollowUps,
  pendingMessage,
  questionBeforeMessage,
  questionCount,
  resolveOpenTarget,
  shouldShowLongConversationHint,
  type CopilotErrorState,
} from '@/utils/copilot';
import { AI_CREDITS_ROUTE } from '@/utils/copilotRoutes';
import { AiCreditsHowItWorksSheet } from '../ui/AiCreditsHowItWorksSheet';
import { AiCreditsMeter } from '../ui/AiCreditsMeter';
import { CopilotComposer } from '../ui/CopilotComposer';
import { CopilotConversationsSheet } from '../ui/CopilotConversationsSheet';
import { CopilotCostSheet } from '../ui/CopilotCostSheet';
import { CopilotMessageBubble } from '../ui/CopilotMessageBubble';
import { BusinessHomeDetailShell } from './BusinessHomeDetailShell';

interface CopilotChatBodyProps {
  initialThreadId?: string;
  initialQuestion?: string;
  onBack: () => void;
}

const SUGGESTIONS = ['s1', 's2', 's3', 's4', 's5'] as const;

/**
 * The chat for the selected (paid) branch. The page mounts it with `key={branchId}`, so
 * switching branch resets the conversation, the composer and every sheet.
 */
export function CopilotChatBody({ initialThreadId, initialQuestion, onBack }: CopilotChatBodyProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const { businessId, branchId, branchName } = useSelectedBranch();
  const listRef = useRef<FlatList<CopilotMessageDAO>>(null);

  const credits = useAiCredits().data;
  const threadsQuery = useCopilotThreads();

  // threadId: undefined = deciding, null = new chat, string = open conversation.
  const [threadId, setThreadId] = useState<string | null | undefined>(() => {
    const target = resolveOpenTarget({ threadIdParam: initialThreadId, q: initialQuestion, threads: [] });
    return target.threadId !== null || target.prefill ? target.threadId : undefined;
  });
  const [draft, setDraft] = useState(() =>
    resolveOpenTarget({ threadIdParam: initialThreadId, q: initialQuestion, threads: [] }).prefill,
  );
  const [conversationsOpen, setConversationsOpen] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const [costMessage, setCostMessage] = useState<CopilotMessageDAO | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  // Resume the most recent conversation once the list is known (or start a new chat).
  useEffect(() => {
    if (threadId !== undefined || threadsQuery.query.isPending) return;
    setThreadId(resolveOpenTarget({ threads: threadsQuery.threads }).threadId);
  }, [threadId, threadsQuery.query.isPending, threadsQuery.threads]);

  const chat = useCopilotChat(threadId ?? null, {
    onThreadCreated: (id) => setThreadId(id),
  });

  // A conversation deleted on another device answers 404: say so and start a new chat.
  const errorCode = getErrorStatusCode(chat.error);
  useEffect(() => {
    if (errorCode !== 404 || !threadId) return;
    toast.info(t('businessHome.copilot.threadDeleted'));
    setThreadId(null);
    void queryClient.invalidateQueries({ queryKey: copilotThreadsQueryKey(businessId, branchId ?? '') });
  }, [errorCode, threadId, queryClient, businessId, branchId, t]);

  const messages = chat.messages;
  const hasPending = chat.hasPending || pendingMessage(messages) !== undefined;
  const exhausted = !canAskCopilot(credits);
  const serviceDown = unavailable || credits?.enabled === false;
  const followUps = latestFollowUps(messages);
  const isEmptyChat = messages.length === 0;

  const messageCount = messages.length;
  const lastStatus = messages[messageCount - 1]?.status;
  useEffect(() => {
    if (messageCount > 0) listRef.current?.scrollToEnd({ animated: true });
  }, [messageCount, lastStatus]);

  const handleSendError = useCallback(
    (error: unknown) => {
      const state: CopilotErrorState = copilotErrorState(error);
      switch (state) {
        case 'invalid':
          toast.error(t('businessHome.copilot.invalidMessage', { max: 500 }));
          break;
        case 'not_entitled':
          toast.error(t('businessHome.copilot.notEntitled'));
          break;
        case 'not_found':
          toast.info(t('businessHome.copilot.threadDeleted'));
          setThreadId(null);
          break;
        case 'pending_exists':
          toast.info(t('businessHome.copilot.pendingExists'));
          void chat.refetch();
          break;
        case 'exhausted':
          // The banner appears once the credits query refreshes; the draft stays in the field.
          break;
        case 'unavailable':
          setUnavailable(true);
          break;
        default:
          toast.error(t('businessHome.copilot.sendFailed'));
      }
    },
    [chat, t],
  );

  const submit = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!canSendQuestion({ text: question, hasPending, credits })) return;
      try {
        await chat.send(question);
        setDraft('');
      } catch (error) {
        handleSendError(error);
      }
    },
    [chat, credits, hasPending, handleSendError],
  );

  const newChat = () => {
    setThreadId(null);
    setDraft('');
  };

  const openRoute = (route: string) => router.push(route as never);
  const iconColor = colorScheme === 'dark' ? '#F3F4F6' : '#141413';

  const header = (
    <View className="px-4 pb-2">
      <Text className="pb-2 font-geist-semibold text-xs text-gray-500 dark:text-gray-400">
        {t('businessHome.copilot.branchSubtitle', { branchName })}
      </Text>
      <AiCreditsMeter variant="full" />
    </View>
  );

  const rightChild = (
    <View className="flex-row items-center gap-1">
      <Pressable
        onPress={() => setConversationsOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t('businessHome.copilot.conversationsButton')}
        hitSlop={6}
        className="h-8 w-8 items-center justify-center rounded-full bg-gray-100 active:opacity-70 dark:bg-gray-800"
      >
        <History size={17} color={iconColor} />
      </Pressable>
      <Pressable
        onPress={newChat}
        accessibilityRole="button"
        accessibilityLabel={t('businessHome.copilot.newChat')}
        hitSlop={6}
        className="h-8 w-8 items-center justify-center rounded-full bg-gray-100 active:opacity-70 dark:bg-gray-800"
      >
        <SquarePen size={17} color={iconColor} />
      </Pressable>
    </View>
  );

  const loading = threadId === undefined || chat.isLoading;
  const retryDisabled = hasPending || exhausted || serviceDown;

  const listFooter = useMemo(
    () =>
      followUps.length > 0 && !hasPending ? (
        <View className="mt-3 flex-row flex-wrap gap-1.5">
          {followUps.map((text) => (
            <Pressable
              key={text}
              onPress={() => void submit(text)}
              disabled={exhausted || serviceDown}
              accessibilityRole="button"
              className="rounded-full border border-gray-200 bg-white px-3 py-2 active:opacity-70 dark:border-gray-600 dark:bg-gray-800"
            >
              <Text className="font-geist-bold text-xs text-ink dark:text-gray-100">{text}</Text>
            </Pressable>
          ))}
        </View>
      ) : null,
    [followUps, hasPending, exhausted, serviceDown, submit],
  );

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={Math.min(0, 12 - insets.bottom)}
      style={{ flex: 1 }}
    >
      <BusinessHomeDetailShell
        title={chat.title || t('businessHome.copilot.newChatTitle')}
        onBack={onBack}
        rightChild={rightChild}
        headerBelow={header}
        scroll={false}
      >
        <View className="flex-1">
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#FF6B1A" />
            </View>
          ) : chat.error && errorCode !== 404 ? (
            <View className="flex-1 items-center justify-center gap-3 px-6">
              <Text className="text-center font-geist text-sm text-gray-600 dark:text-gray-400">
                {t('businessHome.copilot.loadFailed')}
              </Text>
              <LocalNotesButton
                label={t('businessHome.copilot.retry')}
                onPress={() => void chat.refetch()}
                variant="light"
                size="xs"
                isWidthFull={false}
              />
            </View>
          ) : isEmptyChat ? (
            <View className="flex-1 justify-center px-4">
              <Text className="text-center font-geist-extrabold text-lg text-ink dark:text-gray-100">
                {t('businessHome.copilot.intro')}
              </Text>
              <View className="mt-4 flex-row flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((id) => {
                  const text = t(`businessHome.copilot.suggestions.${id}`);
                  return (
                    <Pressable
                      key={id}
                      onPress={() => void submit(text)}
                      disabled={exhausted || serviceDown}
                      accessibilityRole="button"
                      className="rounded-full border border-gray-200 bg-white px-3 py-2 active:opacity-70 dark:border-gray-600 dark:bg-gray-800"
                    >
                      <Text className="font-geist-bold text-xs text-ink dark:text-gray-100">
                        {text}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerClassName="gap-3 px-4 pb-4 pt-2"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
              onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
              ListHeaderComponent={
                chat.hasMore ? (
                  <Pressable
                    onPress={() => void chat.loadOlder()}
                    accessibilityRole="button"
                    className="items-center pb-2 active:opacity-70"
                  >
                    {chat.isFetchingOlder ? (
                      <ActivityIndicator size="small" color="#FF6B1A" />
                    ) : (
                      <Text className="font-geist-bold text-xs text-brand">
                        {t('businessHome.copilot.loadOlder')}
                      </Text>
                    )}
                  </Pressable>
                ) : null
              }
              ListFooterComponent={listFooter}
              renderItem={({ item }) => (
                <CopilotMessageBubble
                  message={item}
                  retryQuestion={
                    item.status === 'failed' ? questionBeforeMessage(messages, item.id) : undefined
                  }
                  retryDisabled={retryDisabled}
                  onOpenCostSheet={setCostMessage}
                  onOpenSource={openRoute}
                  onRetry={(question) => void submit(question)}
                />
              )}
            />
          )}

          <CopilotComposer
            value={draft}
            onChangeText={setDraft}
            onSend={() => void submit(draft)}
            canSend={canSendQuestion({ text: draft, hasPending, credits }) && !serviceDown}
            editable={!exhausted && !serviceDown}
            credits={credits}
            unavailable={serviceDown}
            showLongHint={shouldShowLongConversationHint(questionCount(messages))}
            onOpenHow={() => setHowOpen(true)}
            onOpenCredits={() => router.push(AI_CREDITS_ROUTE as never)}
            onNewChat={newChat}
          />
        </View>

        <CopilotConversationsSheet
          visible={conversationsOpen}
          onClose={() => setConversationsOpen(false)}
          activeThreadId={threadId ?? null}
          onOpenThread={(id) => {
            setThreadId(id);
            setDraft('');
          }}
          onNewChat={newChat}
        />
        <CopilotCostSheet
          visible={costMessage !== null}
          onClose={() => setCostMessage(null)}
          breakdown={costMessage?.cost_breakdown ?? null}
          pricing={credits?.pricing}
          onOpenHowCalculated={() => {
            setCostMessage(null);
            setHowOpen(true);
          }}
        />
        <AiCreditsHowItWorksSheet
          visible={howOpen}
          onClose={() => setHowOpen(false)}
          pricing={credits?.pricing}
        />
      </BusinessHomeDetailShell>
    </KeyboardAvoidingView>
  );
}
