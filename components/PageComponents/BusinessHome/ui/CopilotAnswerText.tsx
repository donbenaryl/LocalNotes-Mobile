import { Text, View } from 'react-native';
import { parseAnswerBlocks } from '@/utils/copilot';

interface CopilotAnswerTextProps {
  content: string;
}

/** Plain-text renderer: paragraphs and "- " bullets only (no markdown library). */
export function CopilotAnswerText({ content }: CopilotAnswerTextProps) {
  const blocks = parseAnswerBlocks(content);
  return (
    <View className="gap-2">
      {blocks.map((block, index) =>
        block.type === 'bullet' ? (
          <View key={index} className="flex-row gap-2">
            <Text className="shrink-0 font-geist text-sm leading-[22px] text-gray-500">•</Text>
            <Text
              selectable
              className="shrink font-geist text-sm leading-[22px] text-ink dark:text-gray-100"
            >
              {block.text}
            </Text>
          </View>
        ) : (
          <Text
            key={index}
            selectable
            className="font-geist text-sm leading-[22px] text-ink dark:text-gray-100"
          >
            {block.text}
          </Text>
        ),
      )}
    </View>
  );
}
