import { View } from "react-native";
import { cn } from "@/utils/cn";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <View
      className={cn("rounded-md bg-gray-200 animate-pulse dark:bg-gray-800", className)}
    />
  );
}
