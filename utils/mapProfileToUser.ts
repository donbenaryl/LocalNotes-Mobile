import type { profileItemDAO } from '../http/account-api/types';
import type { signInDAO } from '../http/auth-api/types';
import type { User } from '../types/auth';

export function mapProfileToUser(profile: profileItemDAO): User {
  return {
    id: profile.id ?? '',
    email: profile.email,
    fullName: profile.name,
    accountType: profile.account_type as 'individual' | 'business',
    hasCompletedQuiz: Boolean(profile.personality_name),
    personalityName: profile.personality_name ?? null,
    personalityColor: profile.personality_color ?? null,
    profileImageUrl: profile.profile_image_url,
    createdAt: profile.created_at ?? '',
  };
}

export function mapSignInDaoToUser(dao: signInDAO): User {
  return {
    id: dao.id ?? '',
    email: dao.email,
    fullName: dao.name,
    accountType: dao.account_type as 'individual' | 'business',
    hasCompletedQuiz: dao.has_completed_walkthrough,
    personalityName: dao.personality_name ?? null,
    personalityColor: dao.personality_color ?? null,
    profileImageUrl: dao.profile_image_url,
    createdAt: dao.created_at ?? '',
  };
}
