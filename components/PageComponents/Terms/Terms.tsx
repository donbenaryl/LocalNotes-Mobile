import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  LegalBulletList,
  LegalParagraph,
} from '@/components/PageComponents/Legal/LegalBody';
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_LAST_UPDATED,
  LEGAL_OPERATOR,
  LEGAL_SUPPORT_EMAIL,
} from '@/constants/legal';

const TOC_ITEMS = [
  '1. Acceptance of terms',
  '2. Your account',
  '3. User content and conduct',
  '4. Intellectual property',
  '5. Termination and suspension',
  '6. Disclaimers and limitation of liability',
  '7. Changes to these terms',
  '8. Contact us',
];

function SectionHeading({ children }: { children: string }) {
  return (
    <Text className="font-geist-bold text-base text-ink dark:text-gray-100 mb-2">
      {children}
    </Text>
  );
}

export function Terms() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
      <PageHeader title="Terms" />

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-[11px] tracking-wide text-gray-500 dark:text-gray-400 mb-4">
          Last updated · {LEGAL_LAST_UPDATED}
        </Text>

        <Text className="font-geist-bold text-2xl text-ink dark:text-gray-100 leading-tight mb-4">
          The rules of{' '}
          <Text className="italic text-ink dark:text-gray-100">the road.</Text>
        </Text>

        <View className="bg-brand-tint dark:bg-brand-tint/10 border border-brand/30 rounded-xl px-4 py-3.5 mb-5">
          <Text className="text-[11px] tracking-wider uppercase font-geist-bold text-brand-dark dark:text-brand mb-1.5">
            Agreement
          </Text>
          <Text className="text-[13px] leading-5 text-ink dark:text-gray-100">
            <Text className="font-geist-bold">
              By creating an account or using LocalNotes, you agree to these
              Terms of Service.
            </Text>{' '}
            If you do not agree, please do not use the service.
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
          <SectionHeading>1. Acceptance of terms</SectionHeading>
          <LegalParagraph>
            These Terms of Service ("Terms") are a binding agreement between you
            and {LEGAL_OPERATOR} ("LocalNotes," "we," "us," or "our") governing
            your use of the LocalNotes mobile application, website, and related
            services (collectively, the "Service").
          </LegalParagraph>
          <LegalParagraph>
            By creating an account, accessing, or using the Service, you confirm
            that you have read, understood, and agree to these Terms, our Privacy
            Policy, and our Community Guidelines. If you do not agree, you may
            not use the Service.
          </LegalParagraph>
          <LegalParagraph>
            You must be at least 13 years old to use LocalNotes. If you are
            between 13 and the age of majority in your jurisdiction, you may use
            the Service only with the consent of a parent or legal guardian who
            agrees to these Terms on your behalf.
          </LegalParagraph>
          <LegalParagraph>
            LocalNotes is a community for sharing honest recommendations about
            places — through lists, picks, Smart Pick suggestions, social
            following, and business features. These Terms apply to all of those
            features.
          </LegalParagraph>
        </View>

        <View className="mb-5">
          <SectionHeading>2. Your account</SectionHeading>
          <LegalParagraph>
            To use most features of LocalNotes, you must create an account
            using a valid email address and password. You may also sign in with
            third-party providers such as Google or Apple when those options are
            available in your region.
          </LegalParagraph>
          <LegalParagraph>
            You agree to provide accurate, current information during
            registration and to keep your account details up to date. You are
            responsible for maintaining the confidentiality of your login
            credentials and for all activity that occurs under your account.
          </LegalParagraph>
          <LegalParagraph>
            Each account is for one person or one business entity. You may not
            share your account, create multiple accounts to manipulate the
            platform, or impersonate another person or organization. LocalNotes
            supports individual and business account types; you must select the
            type that accurately reflects how you use the Service.
          </LegalParagraph>
          <LegalParagraph>
            Notify us immediately at {LEGAL_SUPPORT_EMAIL} if you suspect
            unauthorized access to your account. We are not liable for losses
            caused by unauthorized use of your credentials where you have failed
            to keep them secure.
          </LegalParagraph>
        </View>

        <View className="mb-5">
          <SectionHeading>3. User content and conduct</SectionHeading>
          <Text className="text-[13.5px] leading-6 text-gray-600 dark:text-gray-400 mb-2">
            You are responsible for the content you post on LocalNotes. All
            users must comply with our Community Guidelines.
          </Text>
          <LegalParagraph>
            You retain ownership of the content you create — including lists,
            picks, photos, descriptions, comments, and profile information. By
            posting content on LocalNotes, you grant us a non-exclusive,
            worldwide, royalty-free license to host, store, reproduce, display,
            distribute, and otherwise use your content solely to operate,
            promote, and improve the Service. This license ends when your
            content is deleted from our systems, except where retention is
            required by law or legitimate business needs such as backup copies.
          </LegalParagraph>
          <LegalParagraph>
            You may not use the Service to post content or engage in conduct
            that violates our Community Guidelines, applicable law, or the rights
            of others. Prohibited uses include harassment, hate speech,
            fraudulent reviews, spam, malware distribution, and any attempt to
            scrape, reverse-engineer, or disrupt the Service.
          </LegalParagraph>
          <LegalParagraph>
            We reserve the right — but are not obligated — to review, remove, or
            restrict access to any content, and to suspend or terminate accounts,
            at our sole discretion, including for violations of these Terms or our
            Community Guidelines. We may act on reports within 24 hours for
            serious violations.
          </LegalParagraph>
        </View>

        <View className="mb-5">
          <SectionHeading>4. Intellectual property</SectionHeading>
          <LegalParagraph>
            LocalNotes and its logos, design, software, and other materials are
            owned by {LEGAL_OPERATOR} or its licensors and are protected by
            intellectual property laws. Except for the limited license to use
            the Service as described in these Terms, no rights are granted to
            you in our brand or technology.
          </LegalParagraph>
          <LegalParagraph>
            You may not copy, modify, distribute, sell, or lease any part of the
            Service without our prior written consent. You may not remove or
            alter any copyright, trademark, or other proprietary notices.
          </LegalParagraph>
          <LegalParagraph>
            If you believe content on LocalNotes infringes your copyright, send
            a notice to {LEGAL_CONTACT_EMAIL} that includes:
          </LegalParagraph>
          <LegalBulletList
            items={[
              'Your contact information and a statement that you are authorized to act on behalf of the rights holder',
              'Identification of the copyrighted work and the infringing material, with enough detail for us to locate it',
              'A statement, under penalty of perjury, that you have a good-faith belief the use is not authorized',
              'A statement that the information in your notice is accurate',
            ]}
          />
          <LegalParagraph>
            We may remove reported content and terminate repeat infringers in
            appropriate circumstances.
          </LegalParagraph>
        </View>

        <View className="mb-5">
          <SectionHeading>5. Termination and suspension</SectionHeading>
          <LegalParagraph>
            You may stop using LocalNotes at any time and may request account
            deletion through the app or by contacting {LEGAL_SUPPORT_EMAIL}.
            Upon deletion, we will remove or anonymize your personal information
            in accordance with our Privacy Policy, subject to reasonable backup
            retention periods.
          </LegalParagraph>
          <LegalParagraph>
            We may suspend or terminate your account immediately, with or without
            notice, if you violate these Terms, our Community Guidelines,
            applicable law, or if we reasonably believe your conduct creates risk
            or harm to LocalNotes, other users, or third parties. Grounds
            include fraud, abuse, security threats, and repeated policy
            violations.
          </LegalParagraph>
          <LegalParagraph>
            If your account is terminated, your right to use the Service ends
            immediately. Content you previously made public may remain visible
            where it has been shared by others or where removal is not
            technically feasible, but we will make reasonable efforts to remove
            or deactivate your profile and associated content.
          </LegalParagraph>
          <LegalParagraph>
            If you believe your account was suspended or terminated in error,
            contact {LEGAL_SUPPORT_EMAIL} with your account details and a
            description of the issue. We will review appeals in good faith but
            are not obligated to reinstate every account.
          </LegalParagraph>
        </View>

        <View className="mb-5">
          <SectionHeading>6. Disclaimers and limitation of liability</SectionHeading>
          <LegalParagraph>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES
            OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES
            OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
            NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE
            UNINTERRUPTED, ERROR-FREE, OR SECURE.
          </LegalParagraph>
          <LegalParagraph>
            Recommendations, lists, picks, and Smart Pick suggestions on
            LocalNotes reflect the opinions and experiences of users and our
            systems. They are not professional advice, endorsements, or
            guarantees about any business, product, or experience. You use the
            Service and visit places at your own risk.
          </LegalParagraph>
          <LegalParagraph>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, {LEGAL_OPERATOR}
            AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS WILL NOT BE
            LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
            PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL, ARISING
            FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY FOR ANY CLAIM
            ARISING OUT OF THESE TERMS OR THE SERVICE WILL NOT EXCEED THE GREATER
            OF ONE HUNDRED U.S. DOLLARS (USD $100) OR THE AMOUNT YOU PAID US IN
            THE TWELVE MONTHS BEFORE THE CLAIM.
          </LegalParagraph>
          <LegalParagraph>
            You agree to indemnify and hold harmless {LEGAL_OPERATOR} from any
            claims, damages, losses, and expenses (including reasonable legal
            fees) arising from your content, your use of the Service, or your
            violation of these Terms or the rights of others.
          </LegalParagraph>
        </View>

        <View className="mb-5">
          <SectionHeading>7. Changes to these terms</SectionHeading>
          <LegalParagraph>
            We may update these Terms from time to time to reflect changes in
            the Service, our practices, or legal requirements. When we make
            material changes, we will provide notice through the app, by email,
            or by other reasonable means before the changes take effect.
          </LegalParagraph>
          <LegalParagraph>
            The "Last updated" date at the top of this page indicates when these
            Terms were most recently revised. Your continued use of LocalNotes
            after the effective date of updated Terms constitutes your acceptance
            of the changes. If you do not agree to the updated Terms, you must
            stop using the Service and may delete your account.
          </LegalParagraph>
          <LegalParagraph>
            These Terms are governed by the laws of the United States, without
            regard to conflict-of-law principles. Any disputes arising from
            these Terms or the Service will be resolved in the courts of the
            United States, unless applicable law requires otherwise.
          </LegalParagraph>
        </View>

        <View className="mb-5">
          <SectionHeading>8. Contact us</SectionHeading>
          <LegalParagraph>
            If you have questions about these Terms, contact us at:
          </LegalParagraph>
          <LegalBulletList
            items={[
              `Legal inquiries: ${LEGAL_CONTACT_EMAIL}`,
              `General support: ${LEGAL_SUPPORT_EMAIL}`,
              `Operator: ${LEGAL_OPERATOR}`,
            ]}
          />
          <LegalParagraph>
            We aim to respond to legal and support inquiries within a reasonable
            timeframe, typically within five business days.
          </LegalParagraph>
        </View>

        <View className="flex-row items-center flex-wrap gap-3.5 pt-4 mt-3.5 border-t border-soft dark:border-gray-700">
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            See also:
          </Text>
          <Text
            className="text-xs font-geist-semibold text-gray-600 dark:text-gray-300 underline cursor-pointer"
            onPress={() => router.push('/privacy-policy' as Href)}
          >
            Privacy
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
