import type { ReactNode } from 'react';

interface MembershipGateProps {
  isPaidMember: boolean;
  tier: 'paid' | 'free';
  children: ReactNode;
}

/** Shows children when membership tier matches (mirrors mock data-states). */
export function MembershipGate({
  isPaidMember,
  tier,
  children,
}: MembershipGateProps) {
  const visible = tier === 'paid' ? isPaidMember : !isPaidMember;
  if (!visible) return null;
  return children;
}
