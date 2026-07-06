export interface User {
  id: string;
  email: string;
  fullName: string;
  accountType: 'individual' | 'business';
  hasCompletedQuiz: boolean;
  personalityName?: string | null;
  personalityColor?: Record<string, number> | null;
  profileImageUrl?: string | null;
  createdAt: string;
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
