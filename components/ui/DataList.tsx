import type { ReactNode } from "react";
import { WhiteBox } from "@/components/ui/WhiteBox";
import { cn } from "@/utils/cn";

interface DataListProps {
  children: ReactNode;
  className?: string;
}

export function DataList({ children, className }: DataListProps) {
  return <WhiteBox className={cn("p-0", className)}>{children}</WhiteBox>;
}
