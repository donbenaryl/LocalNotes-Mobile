import type { profileItemDAO } from '../http/account-api/types';
import type { signInDAO } from '../http/auth-api/types';
import type { User } from '../types/auth';

export function mapProfileToUser(profile: profileItemDAO): User {
  return {
    id: profile.id ?? '',
    email: profile.email,
    fullName: profile.name,
    username: profile.username ?? null,
    firstName: profile.first_name ?? null,
    lastName: profile.last_name ?? null,
    accountType: profile.account_type as 'individual' | 'business',
    hasCompletedQuiz: Boolean(profile.personality_name),
    personalityName: profile.personality_name ?? null,
    personalityColor: profile.personality_color ?? null,
    personalitySource: profile.personality_source ?? null,
    profileImageUrl: profile.profile_image_url,
    createdAt: profile.created_at ?? '',
    dateOfBirth: profile.date_of_birth ?? null,
  };
}

export function mapSignInDaoToUser(dao: signInDAO): User {
  return {
    id: dao.id ?? '',
    email: dao.email,
    fullName: dao.name,
    username: dao.username ?? null,
    firstName: dao.first_name ?? null,
    lastName: dao.last_name ?? null,
    accountType: dao.account_type as 'individual' | 'business',
    hasCompletedQuiz: dao.has_completed_walkthrough,
    personalityName: dao.personality_name ?? null,
    personalityColor: dao.personality_color ?? null,
    personalitySource: dao.personality_source ?? null,
    profileImageUrl: dao.profile_image_url,
    createdAt: dao.created_at ?? '',
    dateOfBirth: dao.date_of_birth ?? null,
  };
}
