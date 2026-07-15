import { useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { PageLoader } from '@/components/ui/PageLoader';
import { useTranslation } from 'react-i18next';
import { Mail } from 'lucide-react-native';
import { OtpInput } from '../../../ui/OtpInput';
import authService from '../../../../http/auth-api/auth.service';
import type { signInDAO } from '../../../../http/auth-api/types';
import { toast } from '../../../ui/Toast';
import { useAuthStore } from '../../../../stores/useAuthStore';
import { mapSignInDaoToUser } from '../../../../utils/mapProfileToUser';

interface EnterOTPProps {
  email: string;
  onVerified: () => void | Promise<void>;
  onChangeEmail: () => void;
}

function mapDaoToUser(dao: signInDAO) {
  return mapSignInDaoToUser(dao);
}

export function EnterOTP({ email, onVerified, onChangeEmail }: EnterOTPProps) {
  const { t } = useTranslation();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [code, setCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const lastSubmittedCode = useRef('');

  async function handleVerification(otpCode: string) {
    if (otpCode.length < 6 || isVerifying) return;

    setIsVerifying(true);
    setVerificationError('');

    const response = await authService.VerifyRegistrationEmail({
      email,
      otp_code: otpCode,
    });

    if (response.error || !response.data?.data) {
      const message =
        response.error?.message ?? t('auth.signUp.invalidOtp');
      setVerificationError(message);
      toast.error(message, { title: t('alerts.verificationFailed') });
      setIsVerifying(false);
      lastSubmittedCode.current = '';
      return;
    }

    const dao = response.data.data;
    await setAuth(mapDaoToUser(dao), dao.token, dao.refresh_token);
    toast.success(t('auth.signUp.emailVerified'));
    await onVerified();
    setIsVerifying(false);
  }

  function handleCodeChange(nextCode: string) {
    setCode(nextCode);
    if (nextCode.length === 6 && nextCode !== lastSubmittedCode.current) {
      lastSubmittedCode.current = nextCode;
      void handleVerification(nextCode);
    }
  }

  async function handleResend() {
    setResendLoading(true);
    try {
      const result = await authService.resentOtp({ email });
      if (result.error) {
        toast.error(result.error.message, { title: t('alerts.resendFailed') });
        return;
      }
      toast.success(
        result.data?.message ?? t('auth.signUp.resendSuccess'),
        { title: t('alerts.codeSent') },
      );
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <View>
      <View className="w-12 h-12 rounded-full bg-brand-tint items-center justify-center mb-6">
        <Mail size={22} color="#E76E04" strokeWidth={2} />
      </View>

      <Text className="font-geist-semibold text-[28px] text-ink dark:text-gray-100 mb-2 leading-tight">
        {t('auth.signUp.checkInboxTitle')}
      </Text>

      <Text className="font-geist text-[14.5px] text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
        {t('auth.signUp.checkInboxDescription')}{' '}
        <Text className="font-geist-semibold text-ink dark:text-gray-100">
          {email}
        </Text>
        . {t('auth.signUp.checkInboxSuffix')}
      </Text>

      <OtpInput value={code} onChange={handleCodeChange} />

      {verificationError ? (
        <Text className="text-error text-sm text-center mt-3 font-geist">
          {verificationError}
        </Text>
      ) : null}

      {isVerifying ? (
        <View className="items-center mt-4">
          <PageLoader fullPage={false} size="small" />
        </View>
      ) : null}

      <Text className="font-geist text-[13px] text-gray-500 dark:text-gray-400 mt-6">
        {t('auth.verifyOtp.noCode')}
        <TouchableOpacity
          onPress={() => void handleResend()}
          disabled={resendLoading}
          activeOpacity={0.7}
          className="cursor-pointer"
        >
          <Text className="text-brand font-geist-medium underline">
            {resendLoading ? t('auth.signUp.resending') : t('auth.signUp.resendCode')}
          </Text>
        </TouchableOpacity>
      </Text>

      <TouchableOpacity
        onPress={onChangeEmail}
        activeOpacity={0.7}
        className="flex-row items-center gap-1.5 mt-3 cursor-pointer"
      >
        <Text className="font-geist text-[13px] text-gray-400 dark:text-gray-500">
          ← {t('auth.signUp.changeEmail')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
