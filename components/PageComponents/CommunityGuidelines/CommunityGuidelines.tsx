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
  LEGAL_SUPPORT_EMAIL,
} from '@/constants/legal';

const TOC_ITEMS = [
  '1. What LocalNotes is for',
  "2. What's not allowed",
  '3. Reviews and reviews-for-pay',
  '4. Businesses on LocalNotes',
  '5. What we do when these are broken',
  '6. How to report something',
];

const NOT_ALLOWED = [
  {
    bold: 'Pornographic or sexually explicit content',
    rest: ' of any kind, in photos, lists, or text. No exceptions for "art" or "humor."',
  },
  {
    bold: 'Hate speech, racism, and discrimination',
    rest: ' targeting people based on race, ethnicity, religion, national origin, sex, gender identity, sexual orientation, disability, or age.',
  },
  {
    bold: 'Harassment, threats, doxxing',
    rest: ' — sharing private information about anyone without their explicit consent.',
  },
  {
    bold: 'Dangerous content',
    rest: ' — content that promotes violence, illegal activity, self-harm, or harm to others.',
  },
  {
    bold: 'Sexual content involving minors',
    rest: ' — reported immediately to authorities, account banned permanently.',
  },
  {
    bold: 'Spam, scams, fraud',
    rest: ' — fake accounts, vote manipulation, pay-for-positive-review schemes.',
  },
  {
    bold: 'Coordinated inauthentic behavior',
    rest: ' — running multiple accounts to manipulate visibility or game the trust system.',
  },
];

function SectionHeading({ children }: { children: string }) {
  return (
    <Text className="font-geist-bold text-base text-ink dark:text-gray-100 mb-2">
      {children}
    </Text>
  );
}

export function CommunityGuidelines() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
      <PageHeader title="Community guidelines" />

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-[11px] tracking-wide text-gray-500 dark:text-gray-400 mb-4">
          Last updated · {LEGAL_LAST_UPDATED}
        </Text>

        <Text className="font-geist-bold text-2xl text-ink dark:text-gray-100 leading-tight mb-4">
          A community of{' '}
          <Text className="italic text-ink dark:text-gray-100">honest taste.</Text>
        </Text>

        <View className="bg-error/10 border border-error/30 rounded-xl px-4 py-3.5 mb-5">
          <Text className="text-[11px] tracking-wider uppercase font-geist-bold text-brand-dark dark:text-error mb-1.5">
            Zero tolerance
          </Text>
          <Text className="text-[13px] leading-5 text-ink dark:text-gray-100">
            <Text className="font-geist-bold">
              By using LocalNotes, you agree not to post pornographic, dangerous,
              hateful, racist, or harassing content.
            </Text>{' '}
            We act on violations within 24 hours. Repeat violations result in
            permanent account removal.
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
          <SectionHeading>1. What LocalNotes is for</SectionHeading>
          <Text className="text-[13.5px] leading-6 text-gray-600 dark:text-gray-400 mb-2">
            LocalNotes is a place to share what you actually think about places.
            The cafés you'd go back to. The bookshops you got lost in. The bars
            where the room makes the night. We're not a review aggregator and
            we're not a directory — we're a community of people whose taste you
            can recognize and trust.
          </Text>
          <LegalParagraph>
            We believe recommendations should be personal, not performative.
            Star ratings flatten experience into a number; we care about the
            story behind why a place matters to you. Write in your own voice.
            Share places you have actually visited. Be specific about what you
            loved — or didn't.
          </LegalParagraph>
          <LegalParagraph>
            Respect the people who work at and run the places you write about.
            Criticism is welcome when it is honest and fair; personal attacks on
            staff, owners, or other users are not. Do not organize brigading or
            coordinated campaigns to target a business or individual.
          </LegalParagraph>
          <LegalParagraph>
            LocalNotes works because people trust each other. Every list, pick,
            and comment you post contributes to that trust — or erodes it. Treat
            the community the way you'd want to be treated.
          </LegalParagraph>
        </View>

        <View className="mb-5">
          <SectionHeading>2. What's not allowed</SectionHeading>
          <Text className="text-[13.5px] leading-6 text-gray-600 dark:text-gray-400 mb-2">
            The following are{' '}
            <Text className="italic text-ink dark:text-gray-100">never</Text>{' '}
            permitted on LocalNotes, on any surface, regardless of context or
            framing:
          </Text>
          <View className="my-2 gap-1.5">
            {NOT_ALLOWED.map((item) => (
              <View key={item.bold} className="flex-row pr-1">
                <Text className="text-[13px] leading-6 text-ink dark:text-gray-200 mr-1.5">
                  •
                </Text>
                <Text className="flex-1 text-[13px] leading-6 text-ink dark:text-gray-200">
                  <Text className="font-geist-bold">{item.bold}</Text>
                  {item.rest}
                </Text>
              </View>
            ))}
          </View>
          <LegalParagraph>
            In addition to the categories above, the following are also
            prohibited:
          </LegalParagraph>
          <LegalBulletList
            items={[
              'Impersonating another person, business, or organization',
              'Posting misleading information about a place — including fake locations, fabricated visits, or claims you cannot substantiate',
              'Undisclosed commercial relationships: if you have a financial or material connection to a place you recommend, you must say so',
              "Content that infringes someone else's copyright, trademark, or other intellectual property rights",
              'Off-topic content unrelated to places, experiences, or the LocalNotes community',
              'Attempting to circumvent moderation, bans, or platform limits',
            ]}
          />
        </View>

        <View className="mb-5">
          <SectionHeading>3. Reviews and reviews-for-pay</SectionHeading>
          <LegalParagraph>
            Honest recommendations are the foundation of LocalNotes. That means
            being transparent about your relationship to the places you write
            about.
          </LegalParagraph>
          <LegalParagraph>
            If you received free products, meals, services, discounts, or any
            other compensation in exchange for posting about a place, you must
            clearly disclose that relationship in your list or pick. A simple
            statement such as "I received a complimentary meal" or "This
            business offered me a discount" is sufficient.
          </LegalParagraph>
          <LegalParagraph>
            Pay-for-positive-review schemes are strictly prohibited. You may
            not accept payment, gifts, or incentives conditioned on writing a
            positive review or removing a negative one. Businesses may not offer
            compensation in exchange for favorable coverage on LocalNotes.
          </LegalParagraph>
          <LegalParagraph>
            Businesses cannot pressure, threaten, or retaliate against users for
            honest reviews — positive or negative. If a business contacts you
            demanding you change or remove a review, report it to us at{' '}
            {LEGAL_SUPPORT_EMAIL}.
          </LegalParagraph>
          <LegalParagraph>
            We may remove content or suspend accounts that violate these
            disclosure rules, regardless of whether the underlying recommendation
            is positive or negative.
          </LegalParagraph>
        </View>

        <View className="mb-5">
          <SectionHeading>4. Businesses on LocalNotes</SectionHeading>
          <LegalParagraph>
            Business accounts exist to help owners and operators connect with
            people who share their taste. With that comes additional
            responsibility.
          </LegalParagraph>
          <LegalParagraph>
            Business accounts must represent a real, operating business. You may
            not create fake business profiles, inflate engagement, or use bots or
            multiple accounts to manipulate visibility.
          </LegalParagraph>
          <LegalParagraph>
            Offers and promotions posted on LocalNotes must be genuine and
            honored as described. Misleading offers, bait-and-switch tactics, and
            expired promotions presented as current are not allowed.
          </LegalParagraph>
          <LegalParagraph>
            Businesses may not solicit fake reviews, offer incentives conditioned
            on positive coverage, or retaliate against users who post honest
            criticism. Responding professionally to feedback is welcome;
            harassment is not.
          </LegalParagraph>
          <LegalParagraph>
            Business profile information — including name, location, website,
            and contact details — must be accurate and kept up to date.
          </LegalParagraph>
        </View>

        <View className="mb-5">
          <SectionHeading>5. What we do when these are broken</SectionHeading>
          <LegalParagraph>
            We take enforcement seriously. When we receive a report or detect a
            violation, we review it and typically respond within 24 hours.
          </LegalParagraph>
          <LegalParagraph>
            Enforcement actions depend on the severity and history of the
            violation:
          </LegalParagraph>
          <LegalBulletList
            items={[
              'First-time minor violations: content removal and a warning',
              'Repeated or moderate violations: temporary account suspension',
              'Serious violations (hate speech, harassment, fraud, CSAM): immediate permanent ban',
              'Coordinated abuse or repeat offenders: permanent ban and potential referral to law enforcement',
            ]}
          />
          <LegalParagraph>
            Content involving sexual exploitation of minors is reported to the
            National Center for Missing & Exploited Children (NCMEC) and
            relevant law enforcement authorities, and the account is permanently
            banned immediately.
          </LegalParagraph>
          <LegalParagraph>
            We reserve the right to remove content or suspend accounts at our
            discretion to protect the community, even if a specific violation is
            not listed above.
          </LegalParagraph>
        </View>

        <View className="mb-5">
          <SectionHeading>6. How to report something</SectionHeading>
          <LegalParagraph>
            If you see content or behavior that violates these guidelines, please
            report it. You can use the in-app report feature on any list, pick,
            comment, or profile, or email us at {LEGAL_SUPPORT_EMAIL}.
          </LegalParagraph>
          <LegalParagraph>
            When reporting, include as much detail as possible: a link to the
            content, screenshots if available, and a brief description of why you
            believe it violates our guidelines. This helps us review reports
            faster.
          </LegalParagraph>
          <LegalParagraph>
            We review every report. For privacy and safety reasons, we generally
            do not share the outcome of a specific report with the reporter, but
            we act on valid reports within 24 hours.
          </LegalParagraph>
          <LegalParagraph>
            If you are in immediate danger, contact local emergency services
            first. LocalNotes is not an emergency response service.
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
            onPress={() => router.push('/terms' as Href)}
          >
            Terms
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
