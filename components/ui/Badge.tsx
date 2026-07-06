import { ReactNode } from 'react';
import { Text, View } from 'react-native';

type BadgeVariant = 'success' | 'primary' | 'secondary';
type BadgeSize = 'md' | 'lg';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { container: string; text: string }> = {
  success: {
    container: 'bg-success-tint dark:bg-success/20',
    text: 'text-success',
  },
  primary: {
    container: 'bg-brand-tint dark:bg-brand/20',
    text: 'text-brand',
  },
  secondary: {
    container: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-500 dark:text-gray-400',
  },
};

const sizeStyles: Record<BadgeSize, { container: string; text: string }> = {
  md: {
    container: 'gap-1 rounded-lg px-2.5 py-1.5',
    text: 'text-xs font-geist-medium',
  },
  lg: {
    container: 'gap-1.5 rounded-xl px-3.5 py-2',
    text: 'text-sm font-geist-semibold',
  },
};

export function Badge({
  label,
  variant = 'secondary',
  size = 'md',
  leftIcon,
  rightIcon,
  className,
}: BadgeProps) {
  const styles = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <View
      className={`flex-row items-center self-start ${sizeStyle.container} ${styles.container} ${className ?? ''}`}
    >
      {leftIcon}
      <Text className={`${sizeStyle.text} ${styles.text}`}>{label}</Text>
      {rightIcon}
    </View>
  );
}
