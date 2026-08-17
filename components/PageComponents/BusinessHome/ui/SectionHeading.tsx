import { PageSectionTitle } from "@/components/ui/PageSectionTitle";
import { View } from "react-native";

interface SectionHeadingProps {
  title: string;
}

export function SectionHeading({ title }: SectionHeadingProps) {
  return (
    <View className="px-5 pt-4 pb-3">
      <PageSectionTitle>{title}</PageSectionTitle>
    </View>
  );
}
