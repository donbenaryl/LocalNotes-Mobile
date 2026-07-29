import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { PageHeader } from '@/components/ui/PageHeader';

interface TextBlock {
  type: 'paragraph' | 'subheading';
  text: string;
}

interface BulletListBlock {
  type: 'bullets';
  items: string[];
}

interface TableBlock {
  type: 'table';
  headers: [string, string];
  rows: Array<[string, string]>;
}

type SectionBlock = TextBlock | BulletListBlock | TableBlock;

interface SectionData {
  title: string;
  blocks: SectionBlock[];
}

const TOC_ITEMS = [
  '1. Scope',
  '2. Personal Information We Collect',
  '3. How We Use Personal Information',
  '4. How We Disclose Personal Information',
  '5. De-Identified and Aggregated Information',
  '6. Data Retention',
  '7. Your Choices and Controls',
  '8. U.S. Privacy Rights',
  '9. Security',
  "10. Children's and Teen Privacy",
  '11. International Processing',
  '12. Third-Party Services and Businesses',
  '13. Changes to This Policy',
  '14. Contact Us',
];

const PRIVACY_SECTIONS: SectionData[] = [
  {
    title: '1. Scope',
    blocks: [
      {
        type: 'paragraph',
        text: 'This Policy applies when you create or use an account, use the Service, visit our websites, communicate with us, submit reports or appeals, purchase a business product, or otherwise interact with LocalNotes. It does not govern third-party businesses, websites, reservation services, map providers, payment processors, or other services that we do not control.',
      },
    ],
  },
  {
    title: '2. Personal Information We Collect',
    blocks: [
      { type: 'subheading', text: '2.1 Information You Provide' },
      {
        type: 'paragraph',
        text: 'Account and profile information. Name, username, email address, password or authentication credential, profile photo, bio, account preferences, and other profile details you choose to provide. Passwords are intended to be stored in hashed form rather than readable form.',
      },
      {
        type: 'paragraph',
        text: 'Age and eligibility information. If we present an age screen or otherwise need to determine eligibility, we may collect a date of birth, birth year, age, age range, or a record of the resulting eligibility determination. We do not currently operate a general parent- or guardian-consent verification program for users age 13 or older.',
      },
      {
        type: 'paragraph',
        text: 'Taste and preference information. Answers to onboarding prompts, category preferences, vibe selections, taste or personality type, and other preference signals you provide.',
      },
      {
        type: 'paragraph',
        text: 'User Content. Picks, lists, descriptions, photos, comments, tags, drafts, saves, follows, reports, appeals, and related metadata, including creation time and the place associated with content. Uploaded photos may contain embedded metadata. We may process and, where technically feasible, strip unnecessary embedded location metadata before public display.',
      },
      {
        type: 'paragraph',
        text: 'Business-account information. Business name, public address, category, contact information, role, authorization, verification materials, advertising selections, and account-management information.',
      },
      {
        type: 'paragraph',
        text: 'Transaction information. Purchase amount, date, product, subscription or transaction status, billing country, card brand, and last four digits where supplied by the payment processor. LocalNotes does not intend to receive or store full payment-card numbers.',
      },
      {
        type: 'paragraph',
        text: 'Communications. Support messages, feedback, reports, appeals, survey responses, legal notices, and other communications, including contact information and attachments you submit.',
      },
      { type: 'subheading', text: '2.2 Information Collected Automatically' },
      {
        type: 'paragraph',
        text: 'Precise and approximate location. With device permission, we may process precise location to show nearby places, power maps, attach a selected place to content, prevent fraud, and provide other location features you request. We do not intend to collect precise location continuously when the Service is not in use unless a future feature clearly explains that collection and obtains any required permission. We may derive an approximate city or region from an IP address for localization, security, analytics, and legal compliance.',
      },
      {
        type: 'paragraph',
        text: 'Activity and usage information. Picks, lists, profiles, categories, ads, and places you view or interact with; searches; saves; follows; feature use; referral source; session information; timestamps; and engagement with recommendations.',
      },
      {
        type: 'paragraph',
        text: "Device and technical information. IP address, device type, operating system, app and browser version, language, time zone, mobile network, device or application identifiers, crash reports, diagnostics, and security logs. We do not use information for cross-app tracking on Apple devices without any permission required by Apple's App Tracking Transparency framework.",
      },
      {
        type: 'paragraph',
        text: 'Cookies and similar technologies. Our websites and mobile applications may use cookies, local storage, software development kits, pixels, and similar technologies for authentication, preferences, fraud prevention, analytics, performance, and—if introduced—advertising. Available website controls will be presented where required by law.',
      },
      { type: 'subheading', text: '2.3 Information from Other Sources' },
      {
        type: 'paragraph',
        text: 'Authentication providers. If you use Apple, Google, or another provider to sign in, we receive the information you authorize that provider to share, such as name, email address, or a private-relay address.',
      },
      {
        type: 'paragraph',
        text: 'Place and mapping providers. Business names, categories, addresses, coordinates, hours, photos, and other place information used for search and maps.',
      },
      {
        type: 'paragraph',
        text: 'Payment and commerce providers. Transaction status, fraud signals, refunds, chargebacks, and limited billing information.',
      },
      {
        type: 'paragraph',
        text: 'Other users and public sources. Other users may include you in content or reports. We may also receive publicly available business information and information needed to investigate fraud, safety, ownership, or authorization.',
      },
      { type: 'subheading', text: '2.4 Sensitive Information and Information We Ask You Not to Provide' },
      {
        type: 'paragraph',
        text: 'Precise location may be considered sensitive personal information under some laws. We collect it only with device permission and use it for the purposes described in this Policy.',
      },
      {
        type: 'paragraph',
        text: 'We do not request government identification numbers, biometric templates, health records, full financial-account credentials, or highly sensitive personal information from ordinary consumer users. Do not include sensitive information in public content, profile fields, reports, or support messages unless necessary.',
      },
    ],
  },
  {
    title: '3. How We Use Personal Information',
    blocks: [
      {
        type: 'paragraph',
        text: 'We use personal information to:',
      },
      {
        type: 'bullets',
        items: [
          'create, authenticate, maintain, secure, and support accounts;',
          'host, display, organize, and distribute User Content according to user choices;',
          'provide search, maps, location, saves, follows, lists, drafts, reports, blocking, and business features;',
          'personalize recommendations, ranking, curator matching, and feature discovery;',
          'process purchases, subscriptions, refunds, and related accounting;',
          'provide customer support and communicate about service, security, policy, and account matters;',
          'send optional marketing or activity notifications subject to available settings and consent requirements;',
          'generate aggregated or de-identified Business Insights;',
          'display clearly labeled contextual advertising, such as ads based on a requested category or general location;',
          'detect, prevent, investigate, and enforce against fraud, fake recommendations, pay-for-placement, spam, abuse, security incidents, and legal violations;',
          'debug, analyze performance, conduct research, test features, and improve the Service;',
          'comply with law, legal process, and enforceable government requests; and',
          'establish, exercise, or defend legal claims and protect users, LocalNotes, businesses, and the public.',
        ],
      },
      { type: 'subheading', text: 'Automated personalization' },
      {
        type: 'paragraph',
        text: 'LocalNotes analyzes taste answers, saves, follows, views, searches, activity, and optional location to decide which curators, picks, lists, places, ads, or features to display and in what order. This personalization affects content discovery; it is not used to make decisions about employment, credit, housing, insurance, education, or access to essential services.',
      },
      { type: 'subheading', text: 'Artificial intelligence and automated systems' },
      {
        type: 'paragraph',
        text: 'We may use automated systems to personalize content, detect abuse, classify content, assist moderation, or improve the Service. We do not provide private account information or precise location to third parties to train their general-purpose artificial-intelligence models. We do not sell User Content as a standalone training dataset.',
      },
    ],
  },
  {
    title: '4. How We Disclose Personal Information',
    blocks: [
      { type: 'subheading', text: 'Public information' },
      {
        type: 'paragraph',
        text: 'Your username, profile photo, bio, taste type, follower relationships, and published picks, lists, comments, and photos may be visible to users or the public, depending on the feature and your settings. Public information can be copied, saved, screenshotted, indexed, or reshared by others. Drafts are private to your account unless you publish or share them.',
      },
      { type: 'subheading', text: 'Service providers' },
      {
        type: 'paragraph',
        text: 'We disclose information to vendors that perform services on our behalf, such as cloud hosting, storage, content delivery, authentication, analytics, crash monitoring, communications, customer support, payment processing, mapping, moderation, fraud prevention, and security. They may process information only for contracted purposes and subject to applicable confidentiality and security obligations.',
      },
      { type: 'subheading', text: 'Businesses' },
      {
        type: 'paragraph',
        text: "Business accounts receive aggregated or de-identified insights subject to minimum-activity thresholds and other safeguards intended to reduce re-identification risk. We do not provide businesses with a user's email address, precise device location, private drafts, or individual-level browsing, saving, or following activity merely because the user interacted with that business.",
      },
      {
        type: 'paragraph',
        text: 'A business may, of course, see public content that names or depicts it and public engagement that the Service visibly displays.',
      },
      { type: 'subheading', text: 'Advertising' },
      {
        type: 'paragraph',
        text: 'At launch, LocalNotes intends to use contextual advertising rather than cross-context behavioral advertising. Ads may be selected based on the place, category, general area, search, or content currently being viewed. Ads are labeled and do not alter personal curator picks or lists.',
      },
      {
        type: 'paragraph',
        text: 'We do not sell personal information for money. We do not currently sell or share personal information for cross-context behavioral advertising as those terms are defined by applicable U.S. state privacy laws. Before materially changing that practice, we will update this Policy and provide any legally required notice, consent, or opt-out mechanism.',
      },
      { type: 'subheading', text: 'Legal, safety, and rights protection' },
      {
        type: 'paragraph',
        text: 'We may preserve and disclose information when we reasonably believe it is necessary to comply with law or valid legal process; respond to an emergency; investigate fraud, security, abuse, or Terms violations; protect rights, property, or safety; enforce agreements; or establish, exercise, or defend legal claims. We report apparent child sexual exploitation material as required by law.',
      },
      { type: 'subheading', text: 'Corporate transactions' },
      {
        type: 'paragraph',
        text: 'Information may be disclosed to potential or actual investors, lenders, acquirers, successors, or professional advisors in connection with financing, due diligence, merger, acquisition, restructuring, bankruptcy, or sale of assets, subject to appropriate confidentiality restrictions and applicable law.',
      },
      { type: 'subheading', text: 'At your direction' },
      {
        type: 'paragraph',
        text: 'We may disclose information when you direct us to do so or provide consent.',
      },
    ],
  },
  {
    title: '5. De-Identified and Aggregated Information',
    blocks: [
      {
        type: 'paragraph',
        text: 'We may create aggregated, de-identified, or pseudonymized information from personal information. We use such information for analytics, research, security, product development, and Business Insights. Where required by law, we maintain de-identified information in de-identified form, take reasonable measures to prevent re-identification, and do not attempt to re-identify it except to test the effectiveness of de-identification or as otherwise permitted by law.',
      },
    ],
  },
  {
    title: '6. Data Retention',
    blocks: [
      {
        type: 'paragraph',
        text: 'We retain personal information only for as long as reasonably necessary for the purposes described in this Policy, including providing the Service, maintaining security and integrity, complying with law, resolving disputes, and enforcing agreements. Typical retention practices are:',
      },
      {
        type: 'table',
        headers: ['Data category', 'Typical retention approach'],
        rows: [
          [
            'Account and profile data',
            'While the account is active; after a verified deletion request, removed or de-identified from active systems within 90 days unless an exception applies',
          ],
          [
            'Age and eligibility information',
            'While the account is active and generally removed or de-identified within 90 days after account deletion; limited records may be retained longer when reasonably necessary for legal compliance, safety, fraud prevention, or enforcement',
          ],
          [
            'Published picks, lists, comments, and photos',
            'Until deleted by the user, removed by LocalNotes, or the account is deleted; removed from public display promptly and generally purged from active systems within 90 days',
          ],
          [
            'Drafts',
            'Until published, deleted, or the account is deleted; generally purged from active systems within 90 days after deletion',
          ],
          [
            'Taste profile and personalization data',
            'While the account is active; generally deleted or de-identified within 90 days after account deletion',
          ],
          [
            'Raw precise device location',
            'Retained only as reasonably necessary for a requested feature, security, or legal purpose; when stored separately from User Content, generally deleted or de-identified within 30 days',
          ],
          [
            'Place attached to published content',
            'Retained with that content until the content is deleted, because the place is part of the published pick or list',
          ],
          [
            'Usage and analytics data',
            'Generally up to 24 months in identifiable or pseudonymous form, then deleted or aggregated, unless needed for security or legal reasons',
          ],
          [
            'Device, log, and security information',
            'Generally up to 24 months; longer when reasonably necessary to investigate an incident, prevent repeat abuse, or comply with law',
          ],
          [
            'Support, reports, and appeals',
            'Generally up to 3 years after closure; longer for significant safety, fraud, or legal matters',
          ],
          [
            'Payment, tax, and accounting records',
            'As required for tax, accounting, chargeback, and financial compliance, commonly 7 years',
          ],
          [
            'Enforcement records',
            'As reasonably necessary to prevent repeat violations, protect safety, resolve disputes, and enforce the Terms',
          ],
        ],
      },
      {
        type: 'paragraph',
        text: 'Deletion from active systems does not always mean immediate deletion from encrypted backups. Backup copies are isolated from ordinary use and generally overwritten on a rolling basis within 180 days, unless preservation is required by law or for a specific security or legal matter. Public content saved or reshared by other users may persist in their accounts or outside LocalNotes.',
      },
    ],
  },
  {
    title: '7. Your Choices and Controls',
    blocks: [
      {
        type: 'paragraph',
        text: 'Profile and content. You may edit or delete eligible profile information, picks, lists, comments, and drafts through available Service controls.',
      },
      {
        type: 'paragraph',
        text: 'Account deletion. You may use any available in-app deletion control or email localnotesapp@gmail.com with the subject Account Deletion. We may verify the request. Account deletion does not require deletion of information we must retain for security, fraud prevention, legal compliance, disputes, or enforcement.',
      },
      {
        type: 'paragraph',
        text: 'Location. You may grant, limit, or revoke precise location through device settings. Revoking permission prevents future precise-location collection but does not automatically delete previously published place information.',
      },
      {
        type: 'paragraph',
        text: 'Notifications and marketing. You may change available app or device notification settings and use unsubscribe links in marketing emails. We may still send nonmarketing service, transaction, legal, or security messages while your account remains active.',
      },
      {
        type: 'paragraph',
        text: 'Cookies and device identifiers. You may use browser, cookie-banner, mobile operating-system, Apple App Tracking Transparency, and Android advertising controls where available.',
      },
      {
        type: 'paragraph',
        text: 'Personalization. You may request information about or object to certain personalization by emailing localnotesapp@gmail.com. Some personalization is integral to the taste-matching Service; limiting it may reduce functionality.',
      },
    ],
  },
  {
    title: '8. U.S. Privacy Rights',
    blocks: [
      {
        type: 'paragraph',
        text: 'Depending on your state of residence and whether the applicable law covers LocalNotes, you may have rights to:',
      },
      {
        type: 'bullets',
        items: [
          'confirm whether we process personal information and access it;',
          'correct inaccurate personal information;',
          'delete personal information, subject to exceptions;',
          'obtain a portable copy of certain information;',
          'opt out of sale, sharing for cross-context behavioral advertising, targeted advertising, or certain legally significant profiling;',
          'limit certain uses of sensitive personal information where applicable;',
          'receive equal service and not be unlawfully discriminated against for exercising privacy rights; and',
          'appeal our denial of a request in states that provide an appeal right.',
        ],
      },
      { type: 'subheading', text: 'Exercising a request' },
      {
        type: 'paragraph',
        text: 'Email localnotesapp@gmail.com with the subject Privacy Request and describe the right you wish to exercise. Where available, you may also use in-app privacy controls. We will verify requests using information associated with your account and may request additional information reasonably necessary to prevent fraud. Authorized agents may submit requests where permitted by law, subject to verification of authority and identity.',
      },
      {
        type: 'paragraph',
        text: 'We respond within the period required by applicable law. If we deny a request, we will explain the basis when required. To appeal, reply to our decision with the subject Privacy Appeal.',
      },
      { type: 'subheading', text: 'California disclosures' },
      {
        type: 'paragraph',
        text: 'During the preceding 12 months, LocalNotes may have collected the following categories defined by California law: identifiers; customer-record information; age or eligibility information if collected; commercial information; internet or electronic-network activity; precise and approximate geolocation; visual information; professional or employment-related information for business representatives; and inferences such as taste type and category preferences.',
      },
      {
        type: 'paragraph',
        text: 'The sources, business purposes, and recipients of these categories are described in Sections 2 through 4. We may disclose these categories to service providers or contractors for business purposes. We do not sell personal information for money and do not currently share it for cross-context behavioral advertising.',
      },
      {
        type: 'paragraph',
        text: 'We do not use or disclose sensitive personal information for purposes that require a California "Limit the Use of My Sensitive Personal Information" link unless and until our practices change.',
      },
      { type: 'subheading', text: 'Nevada' },
      {
        type: 'paragraph',
        text: 'We do not sell covered information as "sale" is defined by Nevada law. Nevada residents may submit a verified request concerning future sales by emailing localnotesapp@gmail.com with the subject Nevada Opt-Out.',
      },
      { type: 'subheading', text: 'Global Privacy Control and Do Not Track' },
      {
        type: 'paragraph',
        text: 'Where legally required and applicable to our practices, our websites will treat a recognized Global Privacy Control signal as an opt-out request. Because no uniform industry standard exists for browser "Do Not Track," the Service does not otherwise respond to Do Not Track signals.',
      },
    ],
  },
  {
    title: '9. Security',
    blocks: [
      {
        type: 'paragraph',
        text: 'We use administrative, technical, and physical safeguards designed to protect personal information, including access controls, least-privilege practices, encryption in transit, password hashing, logging, monitoring, backup controls, and vendor review where appropriate. No system is completely secure, and we cannot guarantee absolute security.',
      },
      {
        type: 'paragraph',
        text: 'You are responsible for protecting your credentials and promptly notifying localnotesapp@gmail.com of suspected unauthorized access. We will provide legally required notices if we determine that a security incident triggers a notification obligation.',
      },
      {
        type: 'paragraph',
        text: 'Security researchers may report suspected vulnerabilities responsibly to localnotesapp@gmail.com. Do not exploit a vulnerability, access data that is not yours, disrupt the Service, or publicly disclose a vulnerability before we have had a reasonable opportunity to address it.',
      },
    ],
  },
  {
    title: "10. Children's and Teen Privacy",
    blocks: [
      {
        type: 'paragraph',
        text: 'The Service is not directed to children under 13, and a person under 13 may not create or use an account. We do not knowingly collect personal information from a child under 13.',
      },
      {
        type: 'paragraph',
        text: 'We may use a neutral age screen or other reasonable age-screening measures. We do not currently operate a general parent- or guardian-consent verification or supervision program for users ages 13 through 17. If applicable law requires age assurance, verified parental consent, or another authorization for a particular user, jurisdiction, or feature, we may request the required information, restrict or disable the relevant account or feature, or decline to provide the Service until the legal requirements are satisfied.',
      },
      {
        type: 'paragraph',
        text: 'We ask users not to provide a false age. If we learn that we collected personal information from a child under 13, we will take reasonable steps to suspend or close the account and delete the information, subject to safety, fraud-prevention, legal, and record-preservation requirements.',
      },
      {
        type: 'paragraph',
        text: "A parent or legal guardian may contact localnotesapp@gmail.com to report an account believed to belong to a child under 13 or to submit a privacy request concerning a minor where applicable law permits. We may take reasonable steps to verify the requester's identity and authority before acting. We do not knowingly sell or share the personal information of users under 16 for cross-context behavioral advertising.",
      },
    ],
  },
  {
    title: '11. International Processing',
    blocks: [
      {
        type: 'paragraph',
        text: 'LocalNotes is based in the United States. Our providers may process information in the United States and other countries whose privacy laws may differ from those where you live. The Service is initially offered in the United States and is not intentionally directed to residents of jurisdictions where LocalNotes has not made the Service available.',
      },
      {
        type: 'paragraph',
        text: 'If we later intentionally offer the Service in another jurisdiction, we may provide supplemental notices and implement transfer safeguards, representatives, consent mechanisms, or other measures required by applicable law before or as part of that expansion.',
      },
    ],
  },
  {
    title: '12. Third-Party Services and Businesses',
    blocks: [
      {
        type: 'paragraph',
        text: 'The Service may link to or integrate with third-party maps, websites, reservation systems, app stores, payment processors, businesses, and other services. Their privacy practices govern information they collect directly from you. LocalNotes is not responsible for third-party privacy or security practices.',
      },
    ],
  },
  {
    title: '13. Changes to This Policy',
    blocks: [
      {
        type: 'paragraph',
        text: 'We may update this Policy to reflect changes in the Service, technology, law, or business practices. We will provide reasonable notice of material changes through the Service or by email. Where required, we will obtain consent before applying a materially different use to previously collected information.',
      },
    ],
  },
  {
    title: '14. Contact Us',
    blocks: [
      {
        type: 'paragraph',
        text: 'LocalNotes Corp',
      },
      {
        type: 'paragraph',
        text: '9001 Antora Summit St',
      },
      {
        type: 'paragraph',
        text: 'Las Vegas, NV 89166, USA',
      },
      {
        type: 'paragraph',
        text: 'Email: localnotesapp@gmail.com',
      },
    ],
  },
];

const KEY_POINTS = [
  'Public picks, lists, profile information, and taste type are public by design; drafts are private until published.',
  'We use taste preferences, activity, and optional location to personalize discovery.',
  'Service providers may process data for us under contractual restrictions.',
  'Businesses receive aggregated or de-identified insights, not individual user identities or individual-level activity.',
  'We do not sell personal information for money or allow businesses to purchase placement in personal picks or lists.',
  'At launch, we do not use personal information for cross-context behavioral advertising.',
  'You may request access, correction, deletion, or a portable copy by emailing localnotesapp@gmail.com. Where available, you may also use in-app account controls.',
  'The Service is not directed to children under 13. We may use a neutral age screen, but we do not currently operate a general parent- or guardian-consent verification program for users age 13 or older.',
];

function SectionHeading({ children }: { children: string }) {
  return (
    <Text className="font-geist-bold text-base text-ink dark:text-gray-100 mb-2">
      {children}
    </Text>
  );
}

function SubsectionHeading({ children }: { children: string }) {
  return (
    <Text className="font-geist-semibold text-[13px] text-ink dark:text-gray-100 mt-1 mb-2">
      {children}
    </Text>
  );
}

function Paragraph({ children }: { children: string }) {
  return (
    <Text className="text-[13.5px] leading-6 text-gray-600 dark:text-gray-400 mb-2">
      {children}
    </Text>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <View className="my-2 gap-1.5">
      {items.map((item, index) => (
        <View key={`${index}-${item}`} className="flex-row pr-1">
          <Text className="text-[13px] leading-6 text-ink dark:text-gray-200 mr-1.5">
            •
          </Text>
          <Text className="flex-1 text-[13px] leading-6 text-gray-600 dark:text-gray-400">
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

function RetentionTable({
  headers,
  rows,
}: {
  headers: [string, string];
  rows: Array<[string, string]>;
}) {
  return (
    <View className="mt-2 mb-3 border border-soft dark:border-gray-700 rounded-xl overflow-hidden">
      <View className="flex-row bg-paper dark:bg-gray-800 border-b border-soft dark:border-gray-700">
        <Text className="flex-1 px-3 py-3 text-[12px] font-geist-bold text-ink dark:text-gray-100">
          {headers[0]}
        </Text>
        <Text className="flex-[1.45] px-3 py-3 text-[12px] font-geist-bold text-ink dark:text-gray-100 border-l border-soft dark:border-gray-700">
          {headers[1]}
        </Text>
      </View>
      {rows.map((row, index) => (
        <View
          key={`${row[0]}-${index}`}
          className={
            index === rows.length - 1
              ? 'flex-row bg-page dark:bg-gray-900'
              : 'flex-row bg-page dark:bg-gray-900 border-b border-soft dark:border-gray-700'
          }
        >
          <Text className="flex-1 px-3 py-3 text-[12px] leading-5 text-ink dark:text-gray-100">
            {row[0]}
          </Text>
          <Text className="flex-[1.45] px-3 py-3 text-[12px] leading-5 text-gray-600 dark:text-gray-400 border-l border-soft dark:border-gray-700">
            {row[1]}
          </Text>
        </View>
      ))}
    </View>
  );
}

function renderBlock(block: SectionBlock, index: number) {
  if (block.type === 'subheading') {
    return <SubsectionHeading key={index}>{block.text}</SubsectionHeading>;
  }

  if (block.type === 'bullets') {
    return <BulletList key={index} items={block.items} />;
  }

  if (block.type === 'table') {
    return (
      <RetentionTable key={index} headers={block.headers} rows={block.rows} />
    );
  }

  return <Paragraph key={index}>{block.text}</Paragraph>;
}

export function PrivacyPolicy() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
      <PageHeader title="Privacy Policy" />

      <AppScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-[11px] tracking-wide text-gray-500 dark:text-gray-400 mb-1">
          Effective Date: July 5, 2026
        </Text>
        <Text className="text-[11px] tracking-wide text-gray-500 dark:text-gray-400 mb-4">
          Last Updated: July 5, 2026
        </Text>

        <Text className="font-geist-bold text-2xl text-ink dark:text-gray-100 leading-tight mb-4">
          LocalNotes Privacy Policy
        </Text>

        <View className="bg-brand-tint dark:bg-brand-tint/10 border border-brand/30 rounded-xl px-4 py-3.5 mb-5">
          <Paragraph>
            This Privacy Policy explains how LocalNotes Corp ("LocalNotes," "we," "us," or "our") collects, uses, discloses, retains, and protects personal information when you use the LocalNotes mobile application, websites, and related services (collectively, the "Service").
          </Paragraph>
          <Paragraph>
            LocalNotes Corp is responsible for the personal information described in this Policy. The Service is available to people age 13 or older and is initially offered in the United States.
          </Paragraph>
          <Paragraph>Contact: localnotesapp@gmail.com</Paragraph>
          <Paragraph>
            Mail: LocalNotes Corp, 9001 Antora Summit St, Las Vegas, NV 89166, USA
          </Paragraph>
        </View>

        <View className="bg-paper dark:bg-gray-800 border border-soft dark:border-gray-700 rounded-xl px-4 py-3.5 mb-5">
          <SectionHeading>Key Points</SectionHeading>
          <BulletList items={KEY_POINTS} />
        </View>

        <View className="bg-paper dark:bg-gray-800 border border-soft dark:border-gray-700 rounded-xl px-4 py-3.5 mb-5">
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

        {PRIVACY_SECTIONS.map((section) => (
          <View key={section.title} className="mb-5">
            <SectionHeading>{section.title}</SectionHeading>
            {section.blocks.map((block, index) => renderBlock(block, index))}
          </View>
        ))}

        <View className="flex-row items-center flex-wrap gap-3.5 pt-4 mt-3.5 border-t border-soft dark:border-gray-700">
          <Text
            className="text-xs font-geist-semibold text-gray-600 dark:text-gray-300 underline cursor-pointer"
            onPress={() => router.push('/terms' as Href)}
          >
            Terms of Service
          </Text>
          <Text
            className="text-xs font-geist-semibold text-gray-600 dark:text-gray-300 underline cursor-pointer"
            onPress={() => router.push('/community-guidelines' as Href)}
          >
            Community Guidelines
          </Text>
        </View>
      </AppScrollView>
    </View>
  );
}
