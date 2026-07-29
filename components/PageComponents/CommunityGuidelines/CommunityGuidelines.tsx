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

type SectionBlock = TextBlock | BulletListBlock;

interface SectionData {
  title: string;
  blocks: SectionBlock[];
}

const TOC_ITEMS = [
  '1. The Rule That Defines LocalNotes',
  '2. Content That Is Never Allowed',
  '3. Be a Real Person or an Authorized Business',
  '4. Rules for Businesses',
  '5. Reporting, Blocking, and Safety',
  '6. How We Enforce These Guidelines',
  '7. Appeals',
  '8. Honest Negative Opinions',
  '9. Changes',
];

const GUIDELINES_SECTIONS: SectionData[] = [
  {
    title: '1. The Rule That Defines LocalNotes',
    blocks: [
      {
        type: 'paragraph',
        text: "Every pick must reflect a real experience and the curator's genuine opinion.",
      },
      { type: 'subheading', text: 'No pay-for-placement' },
      {
        type: 'paragraph',
        text: 'You may not offer, request, accept, or provide money, free or discounted goods or services, gifts, favors, contest entries, employment benefits, reciprocal promotion, or anything else of value in exchange for, conditioned on, or connected to:',
      },
      {
        type: 'bullets',
        items: [
          'adding, featuring, ranking, retaining, changing, or removing a pick or list entry;',
          'expressing a particular positive or negative opinion;',
          'removing or suppressing a competitor; or',
          'creating engagement, saves, follows, or other platform activity.',
        ],
      },
      {
        type: 'paragraph',
        text: 'A disclosure does not cure pay-for-placement. Paid or conditioned personal recommendations are prohibited even when the opinion is honest.',
      },
      { type: 'subheading', text: 'Disclose genuine connections' },
      {
        type: 'paragraph',
        text: 'You may post about a business you own, work for, advise, are related to, or have a financial interest in only when that relationship is clearly and conspicuously disclosed in the content itself. You must also disclose complimentary goods or services that were received independently of any request, agreement, expectation, or condition that you post on LocalNotes.',
      },
      {
        type: 'paragraph',
        text: 'A material connection may be disclosed, but it may never be used to disguise compensation for placement.',
      },
      { type: 'subheading', text: 'No fake influence' },
      {
        type: 'paragraph',
        text: 'Do not create or purchase fake accounts, followers, saves, comments, impressions, or engagement. Do not use bots, review swaps, coordinated groups, account farms, or deceptive tactics to inflate or suppress any curator, business, pick, or list.',
      },
      {
        type: 'paragraph',
        text: 'Serious or repeated violations of this section may result in immediate and permanent account termination, removal of associated business accounts, preservation of relevant evidence, and referral to regulators or law enforcement where appropriate.',
      },
    ],
  },
  {
    title: '2. Content That Is Never Allowed',
    blocks: [
      {
        type: 'paragraph',
        text: 'Child exploitation or endangerment. Any content that sexualizes, exploits, grooms, traffics, or endangers a minor is prohibited. We remove it, terminate involved accounts, preserve evidence, report apparent child sexual exploitation material as required by law, and cooperate with lawful investigations.',
      },
      {
        type: 'paragraph',
        text: 'Illegal transactions. Do not use LocalNotes to buy, sell, advertise, facilitate, or arrange illegal drugs, controlled substances, weapons, stolen goods, counterfeit goods, human trafficking, sexual services, or other unlawful activity. Coded language intended to evade enforcement is also prohibited.',
      },
      {
        type: 'paragraph',
        text: 'Violence and credible threats. Do not threaten, incite, praise, organize, or provide operational assistance for violence. Terrorist and violent-extremist organizations and content are prohibited.',
      },
      {
        type: 'paragraph',
        text: 'Hate and unlawful discrimination. Do not attack, degrade, exclude, or encourage harm against people based on race, color, ethnicity, national origin, religion, caste, sex, pregnancy, gender, gender identity, sexual orientation, disability, serious medical condition, age, veteran status, immigration status, or another legally protected characteristic.',
      },
      {
        type: 'paragraph',
        text: 'Harassment and bullying. Do not target a person with intimidation, stalking, repeated unwanted contact, sexual harassment, degrading insults, or coordinated abuse. Criticism of a business or public-facing service is allowed; campaigns directed at individual people are not.',
      },
      {
        type: 'paragraph',
        text: "Privacy violations and doxxing. Do not post a person's nonpublic home address, phone number, private communications, financial information, government identifiers, intimate material, precise live location, private photos, or other sensitive information without permission. A business's publicly listed address is generally not private information, but a private residence should be treated carefully.",
      },
      {
        type: 'paragraph',
        text: 'Nonconsensual or explicit sexual content. Pornography, sexually explicit material, sexual exploitation, and intimate content shared without consent are prohibited.',
      },
      {
        type: 'paragraph',
        text: 'Self-harm promotion. Do not encourage, instruct, glorify, or facilitate suicide, self-injury, or eating disorders.',
      },
      {
        type: 'paragraph',
        text: 'Dangerous deception. Do not impersonate official sources or knowingly spread false safety, health, emergency, or criminal allegations likely to cause real-world harm.',
      },
      {
        type: 'paragraph',
        text: 'Defamation and fabricated allegations. Honest opinions and truthful descriptions of actual experiences are permitted. Knowingly false statements of fact, fabricated incidents, and unsupported accusations of crimes or serious misconduct are prohibited.',
      },
      {
        type: 'paragraph',
        text: 'Spam and manipulation. Do not mass-post repetitive, irrelevant, deceptive, or unsolicited promotional content; operate link schemes; manipulate search or discovery; or use LocalNotes primarily to redirect users elsewhere.',
      },
      {
        type: 'paragraph',
        text: 'Intellectual-property infringement. Post only content you created or are authorized to use. Do not remove ownership information or knowingly upload infringing content. Copyright notices are handled under Section 18 of the Terms of Service.',
      },
    ],
  },
  {
    title: '3. Be a Real Person or an Authorized Business',
    blocks: [
      {
        type: 'bullets',
        items: [
          'Do not impersonate another person, business, curator, or LocalNotes representative.',
          'Do not falsely claim credentials, affiliation, ownership, employment, or authorization.',
          'One person may not maintain multiple accounts to evade enforcement or manipulate platform activity.',
          'Usernames that infringe rights, impersonate others, contain prohibited slurs, or misleadingly suggest official status may be changed, reclaimed, or removed.',
          'A business profile may be claimed or managed only by someone authorized to represent that business.',
        ],
      },
    ],
  },
  {
    title: '4. Rules for Businesses',
    blocks: [
      {
        type: 'paragraph',
        text: 'Businesses, owners, employees, agencies, and representatives may not:',
      },
      {
        type: 'bullets',
        items: [
          'compensate or incentivize users for placement, sentiment, modification, or removal of personal content;',
          'request or require only positive picks;',
          'retaliate against critics or threaten baseless legal action;',
          'pressure users to remove honest opinions outside the reporting and legal processes;',
          'disguise advertising as curator content;',
          'create fake consumer accounts or coordinate deceptive engagement;',
          'attempt to identify individuals from aggregated Business Insights; or',
          'claim or manage a business without authorization.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Businesses may respond professionally, correct verifiable factual errors, use the reporting process, and purchase clearly labeled advertising that remains separate from personal curator picks and lists.',
      },
    ],
  },
  {
    title: '5. Reporting, Blocking, and Safety',
    blocks: [
      {
        type: 'paragraph',
        text: 'Reporting. Users may report content, accounts, and businesses through the in-app Report function or by emailing localnotesapp@gmail.com. Reports should identify the content and explain the concern. Reports are handled confidentially to the extent reasonably possible, but we may disclose information when required by law or necessary to investigate a serious safety issue.',
      },
      {
        type: 'paragraph',
        text: 'Blocking. Users may block another user to stop direct interaction and reduce visibility between the accounts. Blocking does not necessarily remove public content or prevent LocalNotes from preserving information for safety, enforcement, or legal purposes.',
      },
      {
        type: 'paragraph',
        text: 'Emergencies. LocalNotes is not an emergency service. For an immediate threat, contact local emergency services first, then report the content to us.',
      },
      {
        type: 'paragraph',
        text: 'Do not abuse reporting. Knowingly false, retaliatory, automated, or coordinated reporting may itself result in enforcement.',
      },
    ],
  },
  {
    title: '6. How We Enforce These Guidelines',
    blocks: [
      {
        type: 'paragraph',
        text: 'We may use automated systems and human review to detect and evaluate potential violations. Depending on severity, context, history, intent, and applicable law, we may:',
      },
      {
        type: 'bullets',
        items: [
          'remove or restrict content;',
          'add warnings, labels, age gates, or reduced distribution;',
          'limit features or business tools;',
          'issue a warning;',
          'temporarily suspend an account;',
          'permanently terminate an account or related accounts;',
          'preserve relevant records; or',
          'report conduct to platforms, regulators, law enforcement, or safety organizations where appropriate or required.',
        ],
      },
      {
        type: 'paragraph',
        text: 'We may act immediately without warning for serious safety threats, child exploitation, human trafficking, credible violence, coordinated fraud, or pay-for-placement schemes.',
      },
    ],
  },
  {
    title: '7. Appeals',
    blocks: [
      {
        type: 'paragraph',
        text: 'When we take a significant enforcement action, we will generally provide a reason unless doing so would compromise safety, an investigation, another person\'s privacy, or legal obligations. You may appeal within six months by replying to the enforcement notice or emailing localnotesapp@gmail.com with the subject Appeal. Include your account email, the affected content or account, and why you believe the decision should be changed.',
      },
      {
        type: 'paragraph',
        text: 'Appeals of significant actions are reviewed by a person who was not solely dependent on the original automated decision. Filing an appeal does not guarantee restoration.',
      },
    ],
  },
  {
    title: '8. Honest Negative Opinions',
    blocks: [
      {
        type: 'paragraph',
        text: 'LocalNotes protects genuine opinions, including negative ones. We do not remove content merely because a business dislikes it, disputes it, or says it is harmful to its reputation. We act when content violates these Guidelines, the Terms, or applicable law.',
      },
      {
        type: 'paragraph',
        text: 'Users should distinguish opinion from fact, describe their own experience, avoid exaggerating beyond what they can support, and update content when they learn that a factual statement was materially incorrect.',
      },
    ],
  },
  {
    title: '9. Changes',
    blocks: [
      {
        type: 'paragraph',
        text: 'We may update these Guidelines as the Service, community, and law evolve. We will provide reasonable notice of material changes through the Service or by email. The version posted through the Service is the current version.',
      },
      {
        type: 'paragraph',
        text: 'Questions or reports: localnotesapp@gmail.com',
      },
      {
        type: 'paragraph',
        text: 'LocalNotes Corp · 9001 Antora Summit St, Las Vegas, NV 89166, USA',
      },
    ],
  },
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

function renderBlock(block: SectionBlock, index: number) {
  if (block.type === 'subheading') {
    return <SubsectionHeading key={index}>{block.text}</SubsectionHeading>;
  }

  if (block.type === 'bullets') {
    return <BulletList key={index} items={block.items} />;
  }

  return <Paragraph key={index}>{block.text}</Paragraph>;
}

export function CommunityGuidelines() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
      <PageHeader title="Community guidelines" />

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
          LocalNotes Community Guidelines
        </Text>

        <View className="bg-error/10 border border-error/30 rounded-xl px-4 py-3.5 mb-5">
          <Paragraph>
            LocalNotes exists so people can discover places through genuine recommendations from people whose taste they trust. These Community Guidelines explain what is allowed, what is prohibited, and how we enforce our rules. They apply to all content and activity on LocalNotes, including picks, lists, descriptions, photos, vibe tags, comments, profiles, usernames, saves, follows, reports, and business accounts.
          </Paragraph>
          <Paragraph>
            These Guidelines are incorporated into and form part of our Terms of Service. If these Guidelines conflict with the Terms, the Terms control.
          </Paragraph>
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

        {GUIDELINES_SECTIONS.map((section) => (
          <View key={section.title} className="mb-5">
            <SectionHeading>{section.title}</SectionHeading>
            {section.blocks.map((block, index) => renderBlock(block, index))}
          </View>
        ))}

        <View className="flex-row items-center flex-wrap gap-3.5 pt-4 mt-3.5 border-t border-soft dark:border-gray-700">
          <Text
            className="text-xs font-geist-semibold text-gray-600 dark:text-gray-300 underline cursor-pointer"
            onPress={() => router.push('/privacy-policy' as Href)}
          >
            Privacy Policy
          </Text>
          <Text
            className="text-xs font-geist-semibold text-gray-600 dark:text-gray-300 underline cursor-pointer"
            onPress={() => router.push('/terms' as Href)}
          >
            Terms of Service
          </Text>
        </View>
      </AppScrollView>
    </View>
  );
}
