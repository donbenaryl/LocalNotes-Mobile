import type { ReactNode } from 'react';
import { WhiteBox } from '@/components/ui/WhiteBox';
import { cn } from '@/utils/cn';

interface BusinessHomeCardProps {
  children: ReactNode;
  variant?: 'default' | 'dark' | 'brief' | 'upsell';
  className?: string;
}

const VARIANT_CLASS: Record<NonNullable<BusinessHomeCardProps['variant']>, string> = {
  default: 'mx-4',
  dark: 'mx-4 border-ink bg-ink dark:border-ink dark:bg-ink',
  brief: 'mx-4 border-2 border-brand-tint dark:border-brand/30',
  upsell: 'mx-4 border-2 border-brand',
};

export function BusinessHomeCard({
  children,
  variant = 'default',
  className,
}: BusinessHomeCardProps) {
  return (
    <WhiteBox className={cn(VARIANT_CLASS[variant], className)}>
      {children}
    </WhiteBox>
  );
}
