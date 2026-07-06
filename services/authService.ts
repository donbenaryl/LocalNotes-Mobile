import type { SignInPayload, SignUpPayload, User } from '../types/auth';

interface AuthResponse {
  user: User;
  token: string;
}

interface OtpResponse {
  message: string;
}

interface SignUpBusinessPayload {
  businessName: string;
  businessWebsite: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.localnotes.app';

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error((data as { message?: string }).message ?? 'Request failed');
  }

  return data as T;
}

export async function signIn(payload: SignInPayload): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/sign-in', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function signUp(payload: SignUpPayload): Promise<OtpResponse> {
  return request<OtpResponse>('/auth/sign-up', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function signUpBusiness(
  payload: SignUpBusinessPayload,
): Promise<OtpResponse> {
  return request<OtpResponse>('/auth/sign-up/business', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function sendOtp(email: string): Promise<OtpResponse> {
  return request<OtpResponse>('/auth/otp/send', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function verifyOtp(
  email: string,
  code: string,
): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export async function forgotPassword(email: string): Promise<OtpResponse> {
  return request<OtpResponse>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<OtpResponse> {
  return request<OtpResponse>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, code, newPassword }),
  });
}
