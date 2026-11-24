export interface User {
  id: string;
  email: string;
  /** Legacy API `name` field — do not show as the primary label. */
  fullName: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  accountType: 'individual' | 'business';
  hasCompletedQuiz: boolean;
  personalityName?: string | null;
  personalityColor?: Record<string, number> | null;
  /** `inferred` = auto-filled from activity; absent on older APIs. */
  personalitySource?: 'quiz' | 'inferred' | null;
  profileImageUrl?: string | null;
  createdAt: string;
  dateOfBirth?: string | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  accountType: 'individual' | 'business' | null;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}
