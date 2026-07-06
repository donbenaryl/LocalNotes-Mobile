import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  LegalBulletList,
  LegalParagraph,
} from '@/components/PageComponents/Legal/LegalBody';
import {
  LEGAL_LAST_UPDATED,
  LEGAL_OPERATOR,
  LEGAL_PRIVACY_EMAIL,
  LEGAL_SUPPORT_EMAIL,
} from '@/constants/legal';

const TOC_ITEMS = [
  '1. Information we collect',
  '2. How we use your information',
  '3. How we share information',
  '4. Data retention',
  '5. Your rights and choices',
  '6. Security',
  "7. Children's privacy",
  '8. Changes to this policy',
  '9. Contact us',
];

function SectionHeading({ children }: { children: string }) {
  return (
    <Text className="font-geist-bold text-base text-ink dark:text-gray-100 mb-2">
      {children}
    </Text>
  );
}

export function PrivacyPolicy() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
      <PageHeader title="Privacy Policy" />

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-[11px] tracking-wide text-gray-500 dark:text-gray-400 mb-4">
          Last updated · {LEGAL_LAST_UPDATED}
        </Text>

        <Text className="font-geist-bold text-2xl text-ink dark:text-gray-100 leading-tight mb-4">
          Your data,{' '}
          <Text className="italic text-ink dark:text-gray-100">your control.</Text>
        </Text>

        <View className="bg-brand-tint dark:bg-brand-tint/10 border border-brand/30 rounded-xl px-4 py-3.5 mb-5">
          <Text className="text-[11px] tracking-wider uppercase font-geist-bold text-brand-dark dark:text-brand mb-1.5">
            Our commitment
          </Text>
          <Text className="text-[13px] leading-5 text-ink dark:text-gray-100">
            <Text className="font-geist-bold">
              We collect only what we need to run LocalNotes and improve your
              experience.
            </Text>{' '}
            We do not sell your personal information to third parties.
          </Text>
        </View>

        <View className="bg-paper dark:bg-gray-800 border border-soft dark:border-gray-700 rounded-xl px-4 py-3.5 mb-5">
          <Text className="text-[10.5px] tracking-widest uppercase font-geist-bold text-gray-500 dark:text-gray-400 mb-2">
            In this document
          </Text>
          {TOC_ITEMS.map((item, index) => (
            <View
              key={item}
              className={
                index === TOC_ITEMS.length - 1
                  ? 'py-1.5'
                  : 'py-1.5 border-b border-soft dark:border-gray-700'
              }
            >
              <Text className="text-[13px] font-geist-medium text-ink dark:text-gray-200">
                {item}
              </Text>
            </View>
          ))}
        </View>

        <View className="mb-5">
          <SectionHeading>1. Information we collect</SectionHeading>
          <LegalParagraph>
            This Privacy Policy describes how {LEGAL_OPERATOR} ("LocalNotes,"
            "we," "us," or "our") collects, uses, and shares information when
            you use our mobile application, website, and related services.
          </LegalParagraph>
          <LegalParagraph>
            We collect information in the following categories:
          </LegalParagraph>
          <LegalBulletList
            items={[
              'Account information: email address, name, password (stored securely as a hash), date of birth, and account type (individual or business)',
              'Profile information: bio, profile photo, city, region, country, social media links, and personality quiz results',
              'Content you create: lists, picks, descriptions, tags, photos, comments, privacy settings, and sharing preferences',
              'Location information: GPS coordinates when you use Smart Pick (with your permission), and location details you manually add to lists, picks, or your profile',
              'Device and usage information: app version, device type, operating system, IP address, push notification token, and server logs generated when you use the Service',
              'Business account information: business name, website, contact email, and phone number (for business accounts only)',
              'Local device preferences: theme, language, and recent location searches stored on your device using local storage',
            ]}
          />
          <LegalParagraph>
            If you sign in with Google or Apple when those options are available,
            we receive basic profile information from those providers as permitted
            by your account settings and their policies.
          </LegalParagraph>
          <LegalParagraph>
            We do not use third-party advertising or analytics SDKs in the mobile
            app. Our servers may use error monitoring tools that collect limited
            diagnostic data to help us identify and fix technical issues.
          </LegalParagraph>
        </View>

        <View className="mb-5">
          <SectionHeading>2. How we use your information</SectionHeading>
          <LegalParagraph>
            We use the information we collect to:
          </LegalParagraph>
          <LegalBulletList
            items={[
              'Provide, maintain, and improve the Service — including lists, picks, Smart Pick recommendations, social features, and business tools',
              'Create and manage your account, authenticate you, and process your requests',
              'Personalize your experience based on your personality profile, location, and activity',
              'Send push notifications and service-related communications you have opted into',
              'Enforce our Terms of Service and Community Guidelines, and protect the safety of our community',
              'Detect, investigate, and prevent fraud, abuse, and security incidents',
              'Comply with legal obligations and respond to lawful requests',
              'Analyze aggregated, de-identified usage patterns to improve the product',
            ]}
          />
          <LegalParagraph>
            We do not use your personal information for third-party advertising.
            We do not sell your personal information.
          </LegalParagraph>
        </View>

        <View className="mb-5">
          <SectionHeading>3. How we share information</SectionHeading>
          <LegalParagraph>
            We share information only in the following circumstances:
          </LegalParagraph>
          <LegalBulletList
            items={[
              'With other users, according to your privacy settings — for example, public lists and profile information you choose to make visible',
              'With service providers who help us operate the Service (such as hosting, email delivery, and push notification infrastructure), under contracts that require them to protect your data',
              'When required by law, regulation, legal process, or governmental request',
              'To protect the rights, safety, and security of LocalNotes, our users, or the public',
              'In connection with a merger, acquisition, or sale of assets, with notice to you where required by law',
            ]}
          />
          <LegalParagraph>
            We do not sell, rent, or trade your personal information to third
            parties for their marketing purposes.
          </LegalParagraph>
        </View>

        <View className="mb-5">
          <SectionHeading>4. Data retention</SectionHeading>
          <LegalParagraph>
            We retain your information for as long as your account is active or
            as needed to provide the Service. When you delete your account, we
            will delete or anonymize your personal information within a reasonable
            period, typically within 30 days, except where we are required to
            retain it by law or where backup copies may persist for a limited
            time before being overwritten.
          </LegalParagraph>
          <LegalParagraph>
            Content you shared publicly may remain visible if it was copied,
            shared, or cached by other users or systems before deletion. We make
            reasonable efforts to remove your profile and associated content upon
            account deletion.
          </LegalParagraph>
          <LegalParagraph>
            We may retain aggregated or de-identified data that cannot reasonably
            be used to identify you for analytics and product improvement.
          </LegalParagraph>
        </View>

        <View className="mb-5">
          <SectionHeading>5. Your rights and choices</SectionHeading>
          <LegalParagraph>
            Depending on where you live, you may have the following rights
            regarding your personal information:
          </LegalParagraph>
          <LegalBulletList
            items={[
              'Access: request a copy of the personal information we hold about you',
              'Correction: update inaccurate or incomplete information through your profile settings or by contacting us',
              'Deletion: request deletion of your account and associated personal information',
              'Portability: request a copy of your data in a commonly used format, where technically feasible',
              'Opt out: unsubscribe from marketing emails and disable push notifications in your device or app settings',
              'Restriction or objection: object to certain processing of your data, where applicable under local law',
            ]}
          />
          <LegalParagraph>
            Residents of the European Economic Area, United Kingdom, and
            California may have additional rights under GDPR, UK GDPR, and CCPA/CPRA.
            To exercise any of these rights, contact us at {LEGAL_PRIVACY_EMAIL}.
            We will respond within the timeframe required by applicable law.
          </LegalParagraph>
          <LegalParagraph>
            You can control location access through your device settings. Denying
            location permission limits Smart Pick features but does not prevent
            you from using other parts of the Service.
          </LegalParagraph>
        </View>

        <View className="mb-5">
          <SectionHeading>6. Security</SectionHeading>
          <LegalParagraph>
            We implement reasonable technical and organizational measures to
            protect your information, including encryption in transit (HTTPS),
            secure storage of authentication tokens on your device, and access
            controls on our servers.
          </LegalParagraph>
          <LegalParagraph>
            No method of transmission or storage is completely secure. While we
            work to protect your data, we cannot guarantee absolute security. If
            you believe your account has been compromised, contact us immediately
            at {LEGAL_SUPPORT_EMAIL}.
          </LegalParagraph>
          <LegalParagraph>
            In the event of a data breach that affects your personal information,
            we will notify you and relevant authorities as required by applicable
            law.
          </LegalParagraph>
        </View>

        <View className="mb-5">
          <SectionHeading>7. Children's privacy</SectionHeading>
          <LegalParagraph>
            LocalNotes is not directed to children under 13 years of age, and we
            do not knowingly collect personal information from children under 13.
            If you are a parent or guardian and believe your child under 13 has
            created an account, contact us at {LEGAL_PRIVACY_EMAIL} and we will
            promptly delete the account and associated information.
          </LegalParagraph>
          <LegalParagraph>
            Users between 13 and the age of majority should use LocalNotes only
            with the consent of a parent or legal guardian, as described in our
            Terms of Service.
          </LegalParagraph>
        </View>

        <View className="mb-5">
          <SectionHeading>8. Changes to this policy</SectionHeading>
          <LegalParagraph>
            We may update this Privacy Policy from time to time. When we make
            material changes, we will notify you through the app, by email, or
            by other reasonable means before the changes take effect.
          </LegalParagraph>
          <LegalParagraph>
            The "Last updated" date at the top of this page indicates when this
            policy was most recently revised. Your continued use of LocalNotes
            after the effective date of an updated policy constitutes your
            acceptance of the changes.
          </LegalParagraph>
        </View>

        <View className="mb-5">
          <SectionHeading>9. Contact us</SectionHeading>
          <LegalParagraph>
            If you have questions about this Privacy Policy or how we handle your
            data, contact us at:
          </LegalParagraph>
          <LegalBulletList
            items={[
              `Privacy inquiries: ${LEGAL_PRIVACY_EMAIL}`,
              `General support: ${LEGAL_SUPPORT_EMAIL}`,
              `Operator: ${LEGAL_OPERATOR}`,
            ]}
          />
          <LegalParagraph>
            We aim to respond to privacy requests within 30 days, or sooner where
            required by applicable law.
          </LegalParagraph>
        </View>

        <View className="flex-row items-center flex-wrap gap-3.5 pt-4 mt-3.5 border-t border-soft dark:border-gray-700">
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            See also:
          </Text>
          <Text
            className="text-xs font-geist-semibold text-gray-600 dark:text-gray-300 underline cursor-pointer"
            onPress={() => router.push('/terms' as Href)}
          >
            Terms
          </Text>
          <Text
            className="text-xs font-geist-semibold text-gray-600 dark:text-gray-300 underline cursor-pointer"
            onPress={() => router.push('/community-guidelines' as Href)}
          >
            Community Guidelines
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
