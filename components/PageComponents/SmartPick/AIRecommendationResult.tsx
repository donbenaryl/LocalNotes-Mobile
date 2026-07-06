import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import type {
  ConversationMessage,
  ConversationResult,
  DetailedConversation,
  ScoreBreakdown,
} from '../../../types/smartPick';

interface Props {
  conversation: DetailedConversation;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getBusinessName = (r: ConversationResult) =>
  r.business?.name ?? r.unverified_business?.name ?? 'Unknown';

const getBusinessType = (r: ConversationResult) =>
  r.business?.business_type ?? 'Place';

const getPhone = (r: ConversationResult) => r.business?.phone_number ?? null;

const isVerified = (r: ConversationResult) => r.business?.status === 'Verified';

const getInitials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

// ---------------------------------------------------------------------------
// BusinessLogo
// ---------------------------------------------------------------------------

interface BusinessLogoProps {
  logo: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

function BusinessLogo({ logo, name, size = 'md' }: BusinessLogoProps) {
  const containerSize = { sm: 'w-9 h-9', md: 'w-12 h-12', lg: 'w-14 h-14' }[size];
  const textSize = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }[size];

  if (logo) {
    return (
      <Image
        source={{ uri: logo }}
        className={`${containerSize} rounded-xl`}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      className={`${containerSize} rounded-xl bg-brand-tint items-center justify-center flex-shrink-0`}
    >
      <Text className={`${textSize} font-geist-bold text-brand`}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// ScoreBreakdownPanel — only rendered when __DEV__ is true
// ---------------------------------------------------------------------------

interface ScoreBreakdownPanelProps {
  breakdown: ScoreBreakdown;
  score: number;
}

function ScoreBreakdownPanel({ breakdown, score }: ScoreBreakdownPanelProps) {
  const rows: [string, number][] = [
    ['Personality', breakdown.personality],
    ['Behavior', breakdown.behavior],
    ['Context', breakdown.context],
    ['List Signal', breakdown.list_signal],
    ['Quality', breakdown.quality],
    ['AI Signal', breakdown.ai_signal],
  ];

  return (
    <View className="mt-3 p-3 bg-gray-900 rounded-xl">
      <Text className="text-xs font-geist-bold text-gray-400 mb-2 uppercase tracking-widest">
        Dev · Smart Score: {score.toFixed(3)}
      </Text>
      {rows.map(([label, val]) => (
        <View key={label} className="flex-row justify-between mb-1">
          <Text className="text-xs font-geist text-gray-400">{label}</Text>
          <Text className="text-xs font-geist-medium text-brand">
            {val.toFixed(3)}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// PrimaryCard
// ---------------------------------------------------------------------------

function PrimaryCard({ result }: { result: ConversationResult }) {
  const name = getBusinessName(result);
  const type = getBusinessType(result);
  const phone = getPhone(result);
  const verified = isVerified(result);
  const [devExpanded, setDevExpanded] = useState(false);

  return (
    <View className="bg-[#faf5ee] rounded-2xl p-5">
      <Text className="text-gray-700 text-sm font-geist leading-relaxed mb-4">
        {result.description}
      </Text>

      <View className="bg-white rounded-xl p-4 border border-gray-100">
        <View className="flex-row items-center gap-3 mb-3">
          <BusinessLogo logo={result.business?.logo ?? null} name={name} size="lg" />
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5 flex-wrap">
              <Text
                className="font-geist-bold text-gray-900 text-base"
                numberOfLines={1}
              >
                {name}
              </Text>
              {verified && (
                <Text className="text-green-500 text-sm">✓</Text>
              )}
            </View>
            <Text className="text-sm font-geist text-gray-500">{type}</Text>
          </View>
        </View>

        <View className="gap-1">
          {result.business?.location && (
            <Text className="text-sm font-geist text-gray-500">
              📍 {result.business.location.city}, {result.business.location.region}
            </Text>
          )}
          {phone && (
            <Text className="text-sm font-geist text-gray-500">📞 {phone}</Text>
          )}
        </View>

        {/* Dev-mode score toggle — compiled out in production */}
        {__DEV__ && result.smart_score != null && (
          <TouchableOpacity
            className="mt-3"
            onPress={() => setDevExpanded((v) => !v)}
            hitSlop={8}
          >
            <Text className="text-xs font-geist-medium text-gray-400">
              {devExpanded ? '▲' : '▼'} Score debug
            </Text>
          </TouchableOpacity>
        )}
        {__DEV__ && devExpanded && result.score_breakdown && result.smart_score != null && (
          <ScoreBreakdownPanel
            breakdown={result.score_breakdown}
            score={result.smart_score}
          />
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// MiniCard
// ---------------------------------------------------------------------------

interface MiniCardProps {
  result: ConversationResult;
  isActive: boolean;
  onPress: () => void;
}

function MiniCard({ result, isActive, onPress }: MiniCardProps) {
  const name = getBusinessName(result);
  const type = getBusinessType(result);

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center gap-2 px-3 py-2.5 rounded-xl border w-32 flex-shrink-0 ${
        isActive ? 'border-brand bg-brand-tint' : 'border-gray-200 bg-white'
      }`}
    >
      <BusinessLogo logo={result.business?.logo ?? null} name={name} size="sm" />
      <View className="flex-1">
        <Text className="text-xs font-geist-medium text-gray-900" numberOfLines={1}>
          {name}
        </Text>
        <Text className="text-xs font-geist text-gray-400" numberOfLines={1}>
          {type}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function MiniCardV2({ result, isActive, onPress }: MiniCardProps) {
  const name = getBusinessName(result);
  const type = getBusinessType(result);

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center gap-2 px-3 py-2.5 rounded-xl border w-32 flex-shrink-0 ${
        isActive ? 'border-brand bg-brand-tint' : 'border-gray-200 bg-white'
      }`}
    >
      <BusinessLogo logo={result.business?.logo ?? null} name={name} size="sm" />
      <View className="flex-1">
        <Text className="text-xs font-geist-medium text-gray-900" numberOfLines={1}>
          {name}
        </Text>
        <Text className="text-xs font-geist text-gray-400" numberOfLines={1}>
          {type}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// MessageTags
// ---------------------------------------------------------------------------

function MessageTags({ messages }: { messages: ConversationMessage[] }) {
  const tags = messages.map((m) => m.message).filter(Boolean);

  return (
    <View className="flex-row flex-wrap gap-2 bg-gray-100 p-2 rounded-lg flex-1">
      {tags.map((tag, i) => (
        <View key={i} className="px-3 py-1 bg-white rounded-md">
          <Text className="text-sm font-geist-medium text-gray-700">{tag}</Text>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// AIRecommendationResult
// ---------------------------------------------------------------------------

export default function AIRecommendationResult({ conversation }: Props) {
  const sorted = useMemo(
    () => [...conversation.results].sort((a, b) => a.ranking - b.ranking),
    [conversation.results],
  );

  const [primaryId] = useState(sorted[0]?.id ?? '');
  const [expandedIds, setExpandedIds] = useState(new Set<string>());

  const primaryResult = sorted.find((r) => r.id === primaryId) ?? sorted[0];
  const otherResults = sorted.filter((r) => r.id !== primaryId);

  const handleMiniPress = (result: ConversationResult) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(result.id)) {
        next.delete(result.id);
      } else {
        next.add(result.id);
      }
      return next;
    });
  };

  if (!sorted.length) {
    return (
      <View className="flex-1 px-4">
        <View className="flex-row items-start gap-3 mb-4">
          <View className="w-9 h-9 rounded-full bg-brand items-center justify-center flex-shrink-0 mt-0.5">
            <Text className="text-white text-sm">👤</Text>
          </View>
          <MessageTags messages={conversation.messages} />
        </View>

        <View className="p-8 bg-[#faf5ee] rounded-2xl items-center">
          <Text className="text-5xl mb-3">😔</Text>
          <Text className="font-geist-bold text-gray-800 text-lg mb-2 text-center">
            No recommendations found
          </Text>
          <Text className="text-sm font-geist text-gray-500 text-center">
            We couldn't find businesses matching your preferences. Try adjusting
            your vibe, location, or occasion.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
      {/* User tags row */}
      <View className="flex-row items-start gap-3 mb-4">
        <View className="w-9 h-9 rounded-full bg-brand items-center justify-center flex-shrink-0 mt-0.5">
          <Text className="text-white text-sm">👤</Text>
        </View>
        <MessageTags messages={conversation.messages} />
      </View>

      {/* AI label */}
      <View className="flex-row items-start gap-3 mb-4">
        <View className="w-9 h-9 items-center justify-center flex-shrink-0">
          <Text className="text-2xl">✨</Text>
        </View>
        <Text className="font-geist text-gray-800 text-base flex-1 pt-1">
          {conversation.result_label}
        </Text>
      </View>

      {/* Primary card */}
      {primaryResult && (
        <View className="ml-12 mb-4">
          <PrimaryCard result={primaryResult} />
        </View>
      )}

      {/* Expanded secondary cards */}
      {otherResults
        .filter((r) => expandedIds.has(r.id))
        .map((r) => (
          <View key={r.id} className="ml-12 mb-4">
            <PrimaryCard result={r} />
          </View>
        ))}

      {/* Mini card strip */}
      {otherResults.length > 0 && (
        <View className="ml-12 mb-6">
          <Text className="text-sm font-geist text-gray-500 mb-3">
            Other excellent options:
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {otherResults.map((r) => (
              <MiniCard
                key={r.id}
                result={r}
                isActive={expandedIds.has(r.id)}
                onPress={() => handleMiniPress(r)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      <View className="h-10" />
    </ScrollView>
  );
}
