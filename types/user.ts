export type AccountType = 'individual' | 'business';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  accountType: AccountType;
  avatarUrl?: string;
  businessName?: string;
  businessWebsite?: string;
  personalityArchetype?: string;
  hasCompletedQuiz: boolean;
  createdAt: string;
  updatedAt: string;
}
