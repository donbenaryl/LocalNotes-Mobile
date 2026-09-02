import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { PageHeader } from '@/components/ui/PageHeader';

interface TextBlock {
  type: 'paragraph' | 'notice' | 'subheading';
  text: string;
}

interface BulletListBlock {
  type: 'bullets' | 'numbered';
  items: string[];
}

type SectionBlock = TextBlock | BulletListBlock;

interface SectionData {
  title: string;
  blocks: SectionBlock[];
}

const TOC_ITEMS = [
  '1. About LocalNotes',
  '2. Eligibility and Geographic Availability',
  '3. Changes to These Terms',
  '4. Accounts and Electronic Acceptance',
  '5. License to Use the Service',
  '6. User Content',
  '7. Authenticity, Endorsements, and Platform Integrity',
  '8. Acceptable Use',
  '9. Reports, Moderation Notices, and Appeals',
  '10. Business Accounts and Products',
  '11. Recommendations, Real-World Activity, and No Emergency Use',
  '12. Location and Maps',
  '13. Beta, Preview, and Experimental Features',
  '14. Promotions and Referrals',
  '15. Communications',
  '16. LocalNotes Intellectual Property',
  '17. Trademark and Other Rights Complaints',
  '18. Copyright Policy and DMCA',
  '19. Third-Party Services',
  '20. Termination',
  '21. Indemnification',
  '22. Disclaimers and Limitation of Liability',
  '23. Binding Arbitration and Class-Action Waiver',
  '24. Governing Law and Venue',
  '25. App Store Terms',
  '26. Export Controls and Sanctions',
  '27. General Provisions',
  '28. Contact',
];

const TERMS_SECTIONS: SectionData[] = [
  {
    title: '1. About LocalNotes',
    blocks: [
      {
        type: 'paragraph',
        text: `LocalNotes is a taste-based local discovery platform. Users ("Curators") share personal picks, lists, descriptions, photos, and opinions about places and experiences, and other users discover content from people whose tastes may match their own.`,
      },
      {
        type: 'paragraph',
        text: 'The Service is built on two binding principles:',
      },
      {
        type: 'numbered',
        items: [
          'Attributed opinions, not anonymous star ratings. Personal recommendations are connected to the curator who made them.',
          "No paid placement in personal content. No business may purchase, compensate, condition, or incentivize placement, sentiment, ranking, retention, modification, or removal in any curator's personal picks or lists. Clearly labeled advertising, where available, is separate from personal curator content.",
        ],
      },
    ],
  },
  {
    title: '2. Eligibility and Geographic Availability',
    blocks: [
      {
        type: 'paragraph',
        text: 'You must be at least 13 years old to use the Service. The Service is not directed to children under 13, and a person under 13 may not create or use an account.',
      },
      {
        type: 'paragraph',
        text: 'If you are between 13 and the age of legal majority where you live, you may use the Service only if your use is permitted by applicable law. LocalNotes does not currently operate a general parent- or guardian-consent verification or supervision program for users age 13 or older. If applicable law requires age assurance, parental consent, or another authorization for a particular user, jurisdiction, or feature, we may request the required information, restrict the relevant account or feature, or decline to provide the Service until the legal requirements are satisfied.',
      },
      {
        type: 'paragraph',
        text: 'The Service is initially offered only to persons located in the United States and its territories. We may make the Service available in additional jurisdictions and may apply supplemental terms when we do.',
      },
      {
        type: 'paragraph',
        text: 'By using the Service, you represent and warrant that:',
      },
      {
        type: 'bullets',
        items: [
          'you are at least 13 years old;',
          'if you are under the age of legal majority where you live, your use of the Service is permitted by applicable law;',
          'the information you provide is accurate and current;',
          'you have not been permanently removed from the Service unless we expressly approved your return;',
          'you are not prohibited from using the Service under applicable sanctions, export-control, or other laws; and',
          'your use complies with applicable law.',
        ],
      },
      {
        type: 'paragraph',
        text: 'We may refuse registration or suspend, restrict, or terminate an account that does not meet these requirements.',
      },
    ],
  },
  {
    title: '3. Changes to These Terms',
    blocks: [
      {
        type: 'paragraph',
        text: 'We may revise these Terms. We will provide reasonable advance notice of material changes through the Service or by email, ordinarily at least 14 days before they take effect, unless a change addresses a new feature, legal requirement, safety issue, abuse, or urgent operational need. Changes apply prospectively unless law permits otherwise.',
      },
      {
        type: 'paragraph',
        text: 'If you do not agree to revised Terms, you must stop using the Service and may delete your account. Material changes to the arbitration provision are governed by Section 23.7.',
      },
    ],
  },
  {
    title: '4. Accounts and Electronic Acceptance',
    blocks: [
      { type: 'subheading', text: '4.1 Registration' },
      {
        type: 'paragraph',
        text: 'You agree to provide accurate, current, and complete registration information and keep it updated. If you sign in through Apple, Google, or another provider, you authorize us to receive and use information that provider shares according to our Privacy Policy.',
      },
      { type: 'subheading', text: '4.2 Account security' },
      {
        type: 'paragraph',
        text: "You are responsible for safeguarding your credentials and for activity you knowingly authorize. Notify localnotesapp@gmail.com promptly if you suspect unauthorized access. You may be responsible for losses caused by your failure to use reasonable care, but not to the extent caused by LocalNotes' failure to use legally required security.",
      },
      { type: 'subheading', text: '4.3 One person, one account' },
      {
        type: 'paragraph',
        text: 'You may not sell, rent, license, transfer, share, or create an account by automated means. You may not maintain multiple accounts to evade enforcement, manipulate activity, misrepresent popularity, or impersonate another person or business.',
      },
      { type: 'subheading', text: '4.4 Usernames and account identifiers' },
      {
        type: 'paragraph',
        text: 'We may reclaim, change, or remove usernames or identifiers that violate these Terms, infringe rights, impersonate another party, falsely suggest official status, or create a security or confusion risk.',
      },
      { type: 'subheading', text: '4.5 Records of acceptance' },
      {
        type: 'paragraph',
        text: 'You consent to electronic contracting and communications. Our electronic records of your acceptance, including account, device, date, time, and Terms version, may be used to establish agreement to these Terms.',
      },
    ],
  },
  {
    title: '5. License to Use the Service',
    blocks: [
      {
        type: 'paragraph',
        text: 'Subject to these Terms, LocalNotes grants you a limited, personal, revocable, non-exclusive, non-transferable, and non-sublicensable license to access and use the Service on devices you own or control for personal, noncommercial use. A business account may use expressly authorized business features for its internal business purposes. All rights not expressly granted are reserved.',
      },
    ],
  },
  {
    title: '6. User Content',
    blocks: [
      { type: 'subheading', text: '6.1 Ownership' },
      {
        type: 'paragraph',
        text: 'You retain ownership rights you hold in content you submit, including picks, lists, descriptions, photos, comments, tags, profile information, and other materials ("User Content").',
      },
      { type: 'subheading', text: '6.2 License to LocalNotes' },
      {
        type: 'paragraph',
        text: 'You grant LocalNotes a worldwide, non-exclusive, royalty-free, fully paid, transferable, and sublicensable license to host, store, cache, reproduce, format, adapt, translate, create technical or accessibility derivatives of, publish, display, perform, distribute, and otherwise use User Content as reasonably necessary to operate, secure, provide, improve, and promote the Service.',
      },
      {
        type: 'paragraph',
        text: 'This license allows us, for example, to display content in feeds and maps, resize photos, generate previews, make backups, distribute content through service providers, and feature public content in marketing for LocalNotes. It does not transfer ownership to us and does not authorize us to sell your User Content to a third party as standalone content or as a standalone artificial-intelligence training dataset.',
      },
      {
        type: 'paragraph',
        text: 'The license continues after deletion only to the extent reasonably necessary because content was shared with or saved by others, remains in backups for a limited period, is needed for enforcement or legal compliance, or has been incorporated into aggregated or de-identified information.',
      },
      {
        type: 'paragraph',
        text: 'To the extent permitted by law, you waive or agree not to assert moral rights solely as necessary for the licensed uses described above.',
      },
      { type: 'subheading', text: '6.3 Promotional use' },
      {
        type: 'paragraph',
        text: 'We may feature public User Content, with attribution to your username where practical, in the Service, on LocalNotes websites, and in LocalNotes marketing. You may ask us to stop future promotional use of specific content by emailing localnotesapp@gmail.com. We are not required to recall materials already distributed or printed.',
      },
      { type: 'subheading', text: '6.4 Your warranties' },
      {
        type: 'paragraph',
        text: 'You represent and warrant that:',
      },
      {
        type: 'bullets',
        items: [
          'you own or have all rights, permissions, releases, and consents necessary for your User Content and the license above;',
          'your User Content does not infringe intellectual-property, privacy, publicity, confidentiality, contract, or other rights;',
          'any opinion reflects your genuine opinion and any claimed experience actually occurred;',
          'factual statements are not knowingly false or materially misleading;',
          'identifiable people shown in non-incidental circumstances have provided any permission legally required;',
          'your User Content complies with these Terms, the Community Guidelines, and applicable law; and',
          'your User Content does not contain malware or harmful code.',
        ],
      },
      { type: 'subheading', text: '6.5 Moderation and no obligation to host' },
      {
        type: 'paragraph',
        text: 'We are not required to pre-screen, host, display, preserve, or distribute User Content. We may use automated tools and human review to remove, restrict, label, demote, preserve, or refuse content, and to suspend or terminate accounts, when we believe action is appropriate for safety, integrity, legal compliance, product quality, enforcement, or risk management.',
      },
      {
        type: 'paragraph',
        text: 'Our decision not to remove content does not endorse it or establish that it is accurate or lawful.',
      },
      { type: 'subheading', text: '6.6 Backups' },
      {
        type: 'paragraph',
        text: 'The Service is not a backup service. Keep independent copies of content you wish to preserve. To the maximum extent permitted by law, LocalNotes is not liable for deletion, corruption, modification, or loss of User Content.',
      },
      { type: 'subheading', text: '6.7 Feedback' },
      {
        type: 'paragraph',
        text: 'If you provide ideas, suggestions, proposals, or feedback, you grant LocalNotes a perpetual, irrevocable, worldwide, royalty-free, transferable, and sublicensable right to use and exploit that feedback for any lawful purpose without compensation, attribution, confidentiality, or other obligation.',
      },
    ],
  },
  {
    title: '7. Authenticity, Endorsements, and Platform Integrity',
    blocks: [
      {
        type: 'paragraph',
        text: 'Authenticity is a material condition of using LocalNotes.',
      },
      { type: 'subheading', text: '7.1 Prohibited compensation and conditioning' },
      {
        type: 'paragraph',
        text: 'No user, business, employee, agency, or other person may offer, request, provide, or accept money, free or discounted products or services, gifts, favors, reciprocal promotion, contest entries, employment benefits, or any other thing of value in exchange for, conditioned on, or connected to:',
      },
      {
        type: 'bullets',
        items: [
          'creating, adding, featuring, ranking, retaining, changing, or removing a pick, list entry, comment, or recommendation;',
          'expressing a required positive or negative sentiment;',
          'suppressing a competitor; or',
          'manufacturing or manipulating engagement.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Disclosure does not make prohibited pay-for-placement permissible.',
      },
      { type: 'subheading', text: '7.2 Material connections that must be disclosed' },
      {
        type: 'paragraph',
        text: 'A user may post about a business the user owns, works for, advises, is related to, or holds a financial interest in only if the connection is clearly and conspicuously disclosed in the content itself. A user must also disclose complimentary goods or services received independently of any agreement, request, expectation, or condition that the user post on LocalNotes.',
      },
      {
        type: 'paragraph',
        text: 'A disclosure may address a genuine conflict of interest; it cannot cure compensation that violated Section 7.1.',
      },
      { type: 'subheading', text: '7.3 Fake or manipulated activity' },
      {
        type: 'paragraph',
        text: 'You may not create, purchase, sell, broker, or use fake accounts, bots, account farms, review swaps, coordinated groups, or other deceptive methods to inflate or suppress views, saves, follows, comments, visibility, or reputation.',
      },
      { type: 'subheading', text: '7.4 Review and endorsement laws' },
      {
        type: 'paragraph',
        text: "You are responsible for compliance with applicable endorsement, testimonial, advertising, unfair-competition, and consumer-review laws, including disclosure obligations. Businesses may not condition an incentive on a particular sentiment, falsely represent reviews as independent, suppress reviews through intimidation, or purchase fake indicators of influence.",
      },
      { type: 'subheading', text: '7.5 Enforcement' },
      {
        type: 'paragraph',
        text: 'We may remove content, terminate user or business accounts, reverse benefits, preserve evidence, disclose legally required information, and report apparent violations to regulators or law enforcement. Serious violations may result in immediate termination.',
      },
    ],
  },
  {
    title: '8. Acceptable Use',
    blocks: [
      {
        type: 'paragraph',
        text: 'You may not attempt, encourage, or assist another person to:',
      },
      { type: 'subheading', text: 'Content and conduct violations' },
      {
        type: 'bullets',
        items: [
          'post unlawful, fraudulent, deceptive, defamatory, obscene, exploitative, or infringing content;',
          'harass, stalk, threaten, intimidate, sexually harass, or coordinate abuse against another person;',
          'promote violence, terrorism, human trafficking, self-harm, or illegal transactions;',
          'sexualize, exploit, groom, or endanger a minor;',
          'attack people based on legally protected characteristics;',
          "post another person's nonpublic personal information, intimate material, private communications, or precise live location without lawful authority;",
          'impersonate another person or falsely claim affiliation, authorization, credentials, or ownership;',
          'fabricate an experience or knowingly make false factual allegations;',
          'use LocalNotes to advertise or facilitate illegal goods or services;',
          'send spam, chain messages, deceptive promotions, or unsolicited commercial communications; or',
          'misuse reports, appeals, blocking, or safety systems.',
        ],
      },
      { type: 'subheading', text: 'Technical violations' },
      {
        type: 'bullets',
        items: [
          'scrape, crawl, harvest, index, download, or access the Service or its data by automated means without written permission;',
          'use Service data or User Content to train, fine-tune, evaluate, or supply a machine-learning or artificial-intelligence model without written permission from LocalNotes and any required rights holders;',
          'reverse engineer, decompile, disassemble, or attempt to derive source code except where law prohibits this restriction;',
          'evade or interfere with authentication, security controls, rate limits, access restrictions, moderation, or content protections;',
          'probe or test vulnerabilities without authorization;',
          'transmit malware or impose an unreasonable load on the Service;',
          'frame, mirror, or commercially deep-link the Service without permission; or',
          'develop or operate an unauthorized application, integration, or service that interacts with LocalNotes.',
        ],
      },
      { type: 'subheading', text: 'Commercial and platform violations' },
      {
        type: 'bullets',
        items: [
          'sell or transfer accounts, usernames, followers, saves, or platform metrics;',
          'use consumer features for unauthorized commercial solicitation;',
          'misrepresent an advertisement as organic content;',
          'attempt to re-identify a person from aggregated or de-identified information; or',
          'use the Service in violation of law, these Terms, or the Community Guidelines.',
        ],
      },
    ],
  },
  {
    title: '9. Reports, Moderation Notices, and Appeals',
    blocks: [
      {
        type: 'paragraph',
        text: 'Users may report content or accounts through in-app tools or localnotesapp@gmail.com. Reports should identify the content, explain the concern, and provide supporting information where available.',
      },
      {
        type: 'paragraph',
        text: "We may remove content, restrict distribution, issue warnings, limit features, suspend accounts, or terminate accounts. For significant actions, we will generally provide a reason unless notice would compromise safety, another person's privacy, a legal obligation, or an investigation.",
      },
      {
        type: 'paragraph',
        text: 'You may appeal a significant moderation action within six months by replying to the notice or emailing localnotesapp@gmail.com with the subject Appeal. Appeals do not stay enforcement unless we decide otherwise. Repeatedly filing knowingly false or abusive reports or appeals is prohibited.',
      },
      {
        type: 'paragraph',
        text: 'We may preserve and disclose information in response to valid legal process or as described in the Privacy Policy.',
      },
    ],
  },
  {
    title: '10. Business Accounts and Products',
    blocks: [
      { type: 'subheading', text: '10.1 Authority' },
      {
        type: 'paragraph',
        text: 'If you create, claim, verify, or manage a business profile, you represent and warrant that you are authorized to act for and bind that business. In relation to business features, "you" includes that business and the person operating the account.',
      },
      { type: 'subheading', text: '10.2 Business Insights' },
      {
        type: 'paragraph',
        text: 'Business accounts may receive aggregated or de-identified analytics, such as mention counts, category trends, and benchmarks. Insights are subject to thresholds and safeguards but may contain errors, delays, sampling, and estimates. They are provided "as is" for general informational purposes and are not financial, legal, marketing, or professional advice.',
      },
      {
        type: 'paragraph',
        text: 'You may not attempt to identify a person, reverse anonymization, combine insights with other data for re-identification, or use insights unlawfully.',
      },
      { type: 'subheading', text: '10.3 Advertising' },
      {
        type: 'paragraph',
        text: "Paid advertisements are separate from and labeled distinctly from personal curator content. No payment grants placement in, editorial control over, or protection from a curator's personal pick, list, or opinion. We may reject, suspend, or remove advertising that is misleading, unlawful, unsafe, infringing, low quality, or inconsistent with Service policies.",
      },
      { type: 'subheading', text: '10.4 Fees and payment' },
      {
        type: 'paragraph',
        text: 'Prices and material purchase terms are presented at checkout. You authorize LocalNotes and its payment providers to charge the selected payment method. Taxes are your responsibility unless collected by us. Except where required by law or stated at purchase, fees are nonrefundable.',
      },
      {
        type: 'paragraph',
        text: "App-store purchases are also subject to the applicable store's payment and refund rules. If we offer automatically renewing subscriptions, the price, billing period, renewal terms, and cancellation method will be disclosed before purchase.",
      },
      { type: 'subheading', text: '10.5 Business conduct' },
      {
        type: 'paragraph',
        text: 'Businesses must engage professionally and may not harass users, condition benefits on sentiment, demand removal outside appropriate processes, retaliate against critics, or threaten baseless legal claims.',
      },
    ],
  },
  {
    title: '11. Recommendations, Real-World Activity, and No Emergency Use',
    blocks: [
      {
        type: 'paragraph',
        text: 'User Content and third-party place information are opinions and information supplied by users or third parties. LocalNotes does not verify or guarantee the accuracy, completeness, safety, quality, legality, availability, accessibility, hours, address, price, menu, dietary information, allergen information, or current condition of any place, product, service, or activity.',
      },
      {
        type: 'paragraph',
        text: 'Curator content is not medical, dietary, legal, safety, financial, or other professional advice. Verify important information directly with the relevant business or qualified professional.',
      },
      {
        type: 'paragraph',
        text: 'You voluntarily assume the ordinary risks of visiting a place, purchasing a product or service, consuming food or drink, traveling, or participating in an activity discovered through the Service. LocalNotes is not a party to transactions or interactions between users and businesses.',
      },
      {
        type: 'paragraph',
        text: 'To the fullest extent permitted by law, you release the LocalNotes Parties from claims arising from disputes or interactions with another user, business, or third party. California residents waive California Civil Code Section 1542 to the extent a waiver is legally effective.',
      },
      {
        type: 'paragraph',
        text: 'The Service is not an emergency, navigation-safety, or time-critical service. Contact emergency services when needed.',
      },
    ],
  },
  {
    title: '12. Location and Maps',
    blocks: [
      {
        type: 'paragraph',
        text: 'Location features require device permission. You control location access through device settings. Map, route, coordinate, distance, place, and location information may be inaccurate or outdated. Do not rely on the Service where an error could cause injury, death, property damage, trespass, or unlawful conduct.',
      },
      {
        type: 'paragraph',
        text: 'Third-party map and place information may be subject to separate provider terms.',
      },
    ],
  },
  {
    title: '13. Beta, Preview, and Experimental Features',
    blocks: [
      {
        type: 'paragraph',
        text: 'Features identified as beta, preview, early access, experimental, or progressively revealed may be incomplete, inaccurate, unavailable, or changed or discontinued without notice. They are provided "as is" and may be subject to additional terms.',
      },
    ],
  },
  {
    title: '14. Promotions and Referrals',
    blocks: [
      {
        type: 'paragraph',
        text: 'Contests, sweepstakes, promotions, and referral programs may have separate official rules. Those rules control the specific promotion if they conflict with these Terms. Promotions are void where prohibited.',
      },
    ],
  },
  {
    title: '15. Communications',
    blocks: [
      {
        type: 'paragraph',
        text: 'You consent to receive account, service, transaction, policy, legal, and security communications electronically. Marketing communications are optional and may be stopped through available settings or unsubscribe mechanisms, but you cannot opt out of nonmarketing communications required to operate or secure an active account.',
      },
      {
        type: 'paragraph',
        text: 'Standard carrier charges may apply.',
      },
    ],
  },
  {
    title: '16. LocalNotes Intellectual Property',
    blocks: [
      {
        type: 'paragraph',
        text: 'The Service, including software, interfaces, design, graphics, text, logos, databases, compilations, and the selection and arrangement of content—excluding User Content—is owned by LocalNotes or its licensors and protected by intellectual-property and other laws.',
      },
      {
        type: 'paragraph',
        text: 'LocalNotes names, logos, and related marks may not be used without written permission. No rights are granted by implication, estoppel, or otherwise.',
      },
    ],
  },
  {
    title: '17. Trademark and Other Rights Complaints',
    blocks: [
      {
        type: 'paragraph',
        text: "A rights holder may report alleged trademark, publicity, privacy, or other infringement to localnotesapp@gmail.com. A notice should identify the protected right, the material, its location, the basis of the claim, and the reporter's contact information and authority. We may request verification or additional information and may forward the notice to the affected user.",
      },
    ],
  },
  {
    title: '18. Copyright Policy and DMCA',
    blocks: [
      {
        type: 'paragraph',
        text: 'LocalNotes responds to qualifying copyright notices under the Digital Millennium Copyright Act ("DMCA").',
      },
      { type: 'subheading', text: '18.1 Copyright agent' },
      {
        type: 'paragraph',
        text: 'Designated Copyright Agent: Copyright Agent, LocalNotes Corp',
      },
      {
        type: 'paragraph',
        text: 'Address: 9001 Antora Summit St, Las Vegas, NV 89166, USA',
      },
      {
        type: 'paragraph',
        text: 'Email: localnotesapp@gmail.com',
      },
      {
        type: 'paragraph',
        text: 'Subject line: DMCA Notice',
      },
      {
        type: 'paragraph',
        text: "The current agent information should also be maintained in the U.S. Copyright Office's public designated-agent directory.",
      },
      { type: 'subheading', text: '18.2 Infringement notices' },
      {
        type: 'paragraph',
        text: 'A notice should include:',
      },
      {
        type: 'numbered',
        items: [
          "the copyright owner's or authorized agent's physical or electronic signature;",
          'identification of the copyrighted work, or a representative list for multiple works;',
          'identification and location of the allegedly infringing material sufficient for us to find it;',
          "the reporting party's name, mailing address, telephone number, and email address;",
          'a statement of good-faith belief that the disputed use is not authorized by the owner, agent, or law; and',
          'a statement, under penalty of perjury, that the notice is accurate and the reporting party is authorized to act.',
        ],
      },
      {
        type: 'paragraph',
        text: 'We may send the notice to the user who posted the material.',
      },
      { type: 'subheading', text: '18.3 Counter-notices' },
      {
        type: 'paragraph',
        text: 'A user who believes material was removed because of mistake or misidentification may submit a counter-notice containing:',
      },
      {
        type: 'numbered',
        items: [
          "the user's physical or electronic signature;",
          'identification of the removed material and its former location;',
          'a statement under penalty of perjury of good-faith belief that removal resulted from mistake or misidentification;',
          "the user's name, address, telephone number, and email; and",
          'consent to jurisdiction and service of process as required by 17 U.S.C. Section 512(g).',
        ],
      },
      {
        type: 'paragraph',
        text: 'We may restore content as permitted by law after forwarding a compliant counter-notice unless the original claimant timely notifies us of a qualifying court action.',
      },
      { type: 'subheading', text: '18.4 Repeat infringers and misrepresentations' },
      {
        type: 'paragraph',
        text: 'We may terminate repeat infringers in appropriate circumstances and consider relevant notices, counter-notices, account history, and context. A person who knowingly materially misrepresents infringement or removal may face liability under 17 U.S.C. Section 512(f).',
      },
    ],
  },
  {
    title: '19. Third-Party Services',
    blocks: [
      {
        type: 'paragraph',
        text: 'The Service may contain links to or integrations with app stores, maps, reservation systems, payment services, websites, businesses, and other third parties. LocalNotes does not control or endorse them and is not responsible for their availability, content, products, practices, security, or terms. Your dealings with them are between you and the third party.',
      },
    ],
  },
  {
    title: '20. Termination',
    blocks: [
      { type: 'subheading', text: '20.1 By you' },
      {
        type: 'paragraph',
        text: 'You may stop using the Service or request account deletion at any time. Deletion is handled according to the Privacy Policy.',
      },
      { type: 'subheading', text: '20.2 By LocalNotes' },
      {
        type: 'paragraph',
        text: 'We may suspend, restrict, or terminate access when we reasonably believe you violated these Terms, created legal or safety risk, engaged in fraud or abuse, failed to pay an amount due, or when we discontinue the Service. We may act without prior notice where immediate action is appropriate, subject to applicable law.',
      },
      { type: 'subheading', text: '20.3 Effect' },
      {
        type: 'paragraph',
        text: 'Upon termination, your license to use the Service ends. We may delete or retain information as described in the Privacy Policy and Section 6.2. Accrued payment obligations remain due. Provisions that by their nature should survive—including Sections 6.2, 6.7, 7, 8, 10.2, 11, 16 through 18, 20.3, and 21 through 28—survive termination.',
      },
    ],
  },
  {
    title: '21. Indemnification',
    blocks: [
      { type: 'subheading', text: '21.1 Consumer users' },
      {
        type: 'paragraph',
        text: 'To the maximum extent permitted by law, you agree to defend, indemnify, and hold harmless LocalNotes and its officers, directors, employees, contractors, agents, licensors, and service providers (the "LocalNotes Parties") from third-party claims, damages, judgments, losses, liabilities, penalties, costs, and reasonable legal fees arising from or relating to:',
      },
      {
        type: 'bullets',
        items: [
          'your User Content;',
          "your violation of another person's intellectual-property, privacy, publicity, or other rights;",
          'your unlawful, fraudulent, or willful conduct through the Service;',
          'your material breach of these Terms or the Community Guidelines; or',
          'a transaction or business activity you initiate or conduct through the Service.',
        ],
      },
      {
        type: 'paragraph',
        text: "This obligation does not apply to the extent a claim was caused by a LocalNotes Party's gross negligence, willful misconduct, or violation of law.",
      },
      { type: 'subheading', text: '21.2 Business accounts' },
      {
        type: 'paragraph',
        text: 'A business account and the person accepting these Terms for it jointly and severally agree to defend, indemnify, and hold harmless the LocalNotes Parties from third-party claims arising from the business, its products or services, advertising, account activity, lack of authorization, infringement, regulatory violations, undisclosed endorsements, pay-for-placement activity, or breach of these Terms.',
      },
      { type: 'subheading', text: '21.3 Procedure' },
      {
        type: 'paragraph',
        text: 'We may control the defense and settlement of an indemnified claim with counsel of our choice. You will reasonably cooperate. We will not settle a claim in a manner that admits your personal wrongdoing or imposes a nonmonetary obligation on you without your consent, not to be unreasonably withheld.',
      },
    ],
  },
  {
    title: '22. Disclaimers and Limitation of Liability',
    blocks: [
      { type: 'subheading', text: '22.1 Disclaimer of warranties' },
      {
        type: 'notice',
        text: 'TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SERVICE AND ALL CONTENT, RECOMMENDATIONS, INSIGHTS, MAPS, AND MATERIALS ARE PROVIDED "AS IS," "AS AVAILABLE," AND "WITH ALL FAULTS" WITHOUT EXPRESS, IMPLIED, OR STATUTORY WARRANTIES, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, QUIET ENJOYMENT, NON-INFRINGEMENT, ACCURACY, SECURITY, AVAILABILITY, OR RESULTS.',
      },
      {
        type: 'notice',
        text: 'LOCALNOTES DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, CURRENT, OR FREE OF HARMFUL COMPONENTS; THAT DEFECTS WILL BE CORRECTED; OR THAT ANY USER, BUSINESS, PLACE, RECOMMENDATION, OR INSIGHT IS ACCURATE, SAFE, LAWFUL, OR RELIABLE.',
      },
      {
        type: 'paragraph',
        text: 'Some jurisdictions do not allow certain disclaimers. Nonwaivable rights remain unaffected.',
      },
      { type: 'subheading', text: '22.2 Exclusion of damages' },
      {
        type: 'notice',
        text: "TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE LOCALNOTES PARTIES WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR LOSS OF PROFITS, REVENUE, BUSINESS, GOODWILL, DATA, OR OTHER INTANGIBLE LOSS, ARISING FROM OR RELATING TO THE SERVICE, USER CONTENT, BUSINESS INSIGHTS, THIRD-PARTY SERVICES, OR ANOTHER PERSON'S CONDUCT, REGARDLESS OF LEGAL THEORY AND EVEN IF ADVISED OF THE POSSIBILITY.",
      },
      { type: 'subheading', text: '22.3 Liability cap' },
      {
        type: 'notice',
        text: 'TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE TOTAL AGGREGATE LIABILITY OF THE LOCALNOTES PARTIES FOR ALL CLAIMS ARISING FROM OR RELATING TO THE SERVICE OR THESE TERMS WILL NOT EXCEED THE GREATER OF:',
      },
      {
        type: 'numbered',
        items: [
          'THE AMOUNT YOU PAID DIRECTLY TO LOCALNOTES DURING THE 12 MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM; OR',
          'US $100.',
        ],
      },
      { type: 'subheading', text: '22.4 Exceptions' },
      {
        type: 'paragraph',
        text: 'Nothing excludes liability that cannot legally be excluded, including liability for fraud, fraudulent misrepresentation, or death or personal injury caused by negligence where applicable law prohibits exclusion.',
      },
      { type: 'subheading', text: '22.5 Time limit to bring claims' },
      {
        type: 'paragraph',
        text: 'To the maximum extent permitted by law, any claim arising out of or relating to the Service or these Terms must be filed within one year after the claim arose, or it is permanently barred. This does not shorten a limitations period where applicable law prohibits doing so.',
      },
    ],
  },
  {
    title: '23. Binding Arbitration and Class-Action Waiver',
    blocks: [
      {
        type: 'paragraph',
        text: 'This Section applies to users in the United States.',
      },
      { type: 'subheading', text: '23.1 Informal resolution first' },
      {
        type: 'paragraph',
        text: 'Before filing arbitration or a court claim, the claimant must send a written Notice of Dispute describing the claimant, relevant account email, facts, legal basis, requested relief, and a good-faith calculation of any monetary demand. Notices to LocalNotes must be emailed to localnotesapp@gmail.com with the subject Notice of Dispute and mailed to the address in Section 28. Notices to you may be sent to your account email.',
      },
      {
        type: 'paragraph',
        text: 'The parties will attempt in good faith to resolve the dispute individually for 60 days after receipt. This process is a condition precedent to filing, and applicable limitations periods are tolled during it.',
      },
      { type: 'subheading', text: '23.2 Agreement to arbitrate' },
      {
        type: 'paragraph',
        text: "Except for the exclusions below, any dispute, claim, or controversy arising from or relating to the Service, these Terms, the Privacy Policy, the Community Guidelines, or the parties' relationship—including formation, scope, interpretation, enforceability, breach, or termination—will be resolved by final and binding individual arbitration rather than in court.",
      },
      {
        type: 'paragraph',
        text: 'Either party may bring an individual qualifying claim in small-claims court. Either party may seek temporary or injunctive relief in court to protect intellectual-property rights, prevent unauthorized access, or preserve the status quo pending arbitration. Claims for public injunctive relief that cannot legally be arbitrated will be severed and stayed while arbitrable claims proceed.',
      },
      { type: 'subheading', text: '23.3 Rules, administrator, and location' },
      {
        type: 'paragraph',
        text: 'Arbitration will be administered by the American Arbitration Association ("AAA") under its Consumer Arbitration Rules then in effect and, when applicable, its Mass Arbitration Supplementary Rules. The Federal Arbitration Act governs this Section.',
      },
      {
        type: 'paragraph',
        text: 'The arbitration may occur by video, telephone, documents, in the county where you reside, or at another mutually agreed location. The arbitrator may award the same individual remedies available in court and must issue a reasoned written decision when required by the applicable rules.',
      },
      {
        type: 'paragraph',
        text: 'The arbitrator decides issues of scope, applicability, and enforceability of this arbitration agreement, except a court decides the enforceability of the class-action waiver and any issue that applicable law requires a court to decide.',
      },
      { type: 'subheading', text: '23.4 Fees' },
      {
        type: 'paragraph',
        text: 'Fees are allocated under the applicable AAA rules and fee schedules. LocalNotes will pay fees it is required to pay for the arbitration agreement to be enforceable and will not seek reimbursement of its arbitration fees from a consumer unless the arbitrator finds the claim was frivolous or brought for an improper purpose under applicable standards.',
      },
      {
        type: 'paragraph',
        text: 'If AAA declines or is unable to administer a dispute despite the parties\' compliance, the parties will attempt to select a comparable administrator. If they cannot agree, a court of competent jurisdiction may appoint one under the Federal Arbitration Act.',
      },
      { type: 'subheading', text: '23.5 Jury-trial and class-action waiver' },
      {
        type: 'notice',
        text: 'YOU AND LOCALNOTES WAIVE THE RIGHT TO A JURY TRIAL. EACH PARTY MAY BRING CLAIMS ONLY IN AN INDIVIDUAL CAPACITY, NOT AS A PLAINTIFF OR CLASS MEMBER IN A CLASS, COLLECTIVE, CONSOLIDATED, REPRESENTATIVE, OR PRIVATE-ATTORNEY-GENERAL ACTION.',
      },
      {
        type: 'paragraph',
        text: 'Except under applicable AAA mass-arbitration procedures or with all parties\' written agreement, an arbitrator may not combine the claims of different individuals into a single merits determination.',
      },
      {
        type: 'paragraph',
        text: 'If part of this waiver is finally held unenforceable for a particular claim or remedy, that portion will be severed and heard in court after the arbitrable portions are completed, unless law requires otherwise.',
      },
      { type: 'subheading', text: '23.6 Right to opt out' },
      {
        type: 'paragraph',
        text: 'You may opt out of Sections 23.2 through 23.5 by emailing localnotesapp@gmail.com with the subject Arbitration Opt-Out within 30 days after first accepting these Terms. Include your full name, account email, and a clear statement that you opt out of arbitration. Each user must opt out individually. Opting out does not affect the remaining Terms or any prior arbitration agreement.',
      },
      { type: 'subheading', text: '23.7 Changes to arbitration' },
      {
        type: 'paragraph',
        text: 'If we materially change this Section after your initial acceptance, you may reject the change by sending written notice within 30 days after the change takes effect. The prior version will then govern any dispute between you and LocalNotes, unless law requires otherwise.',
      },
      { type: 'subheading', text: '23.8 Severability' },
      {
        type: 'paragraph',
        text: 'If any part of this Section other than the class-action waiver is unenforceable, it will be severed and the remainder enforced to the fullest extent permitted. If the class-action waiver is unenforceable in a manner that permits a class or representative arbitration, this entire Section 23—except the jury waiver to the extent enforceable—is void for that proceeding.',
      },
    ],
  },
  {
    title: '24. Governing Law and Venue',
    blocks: [
      {
        type: 'paragraph',
        text: 'Nevada law governs these Terms and disputes arising from the Service, without regard to conflict-of-law rules, except that the Federal Arbitration Act governs Section 23.',
      },
      {
        type: 'paragraph',
        text: 'A claim not subject to arbitration must be filed exclusively in the state or federal courts located in Clark County, Nevada, and the parties consent to personal jurisdiction and venue there, except where applicable consumer law requires another forum.',
      },
    ],
  },
  {
    title: '25. App Store Terms',
    blocks: [
      { type: 'subheading', text: '25.1 Apple App Store' },
      {
        type: 'paragraph',
        text: "If you obtain the app through Apple's App Store, these Terms are between you and LocalNotes, not Apple. LocalNotes, not Apple, is responsible for the app and its content, maintenance, support, and claims, subject to these Terms. Apple has no warranty obligation beyond refunding any purchase price as required by its rules. Apple and its subsidiaries are third-party beneficiaries of these Terms and may enforce the applicable provisions. You must comply with Apple Media Services Terms and other applicable Apple rules.",
      },
      { type: 'subheading', text: '25.2 Google Play' },
      {
        type: 'paragraph',
        text: "If you obtain the app through Google Play, these Terms are between you and LocalNotes. Google's terms and policies also apply to distribution and purchases through Google Play. Google is not responsible for the Service or these Terms.",
      },
    ],
  },
  {
    title: '26. Export Controls and Sanctions',
    blocks: [
      {
        type: 'paragraph',
        text: 'You must comply with applicable export-control and sanctions laws. You may not use, export, or re-export the Service in violation of U.S. law or applicable law where the Service is obtained.',
      },
    ],
  },
  {
    title: '27. General Provisions',
    blocks: [
      {
        type: 'paragraph',
        text: 'Entire agreement. These Terms, the Privacy Policy, the Community Guidelines, and any feature- or purchase-specific terms presented to you are the entire agreement concerning the Service and supersede prior understandings on that subject.',
      },
      {
        type: 'paragraph',
        text: 'Order of precedence. Feature- or purchase-specific terms control only for that feature or purchase. These Terms control over the Community Guidelines. The Privacy Policy governs our processing of personal information.',
      },
      {
        type: 'paragraph',
        text: 'Severability. Except as specifically stated in Section 23, an invalid provision will be enforced to the maximum lawful extent and the remainder continues in effect.',
      },
      {
        type: 'paragraph',
        text: 'No waiver. Failure to enforce a provision is not a waiver. A waiver must be in writing by an authorized LocalNotes representative.',
      },
      {
        type: 'paragraph',
        text: 'Assignment. You may not assign these Terms or your account without written consent. LocalNotes may assign these Terms in connection with an affiliate, financing, merger, acquisition, reorganization, or sale of assets.',
      },
      {
        type: 'paragraph',
        text: 'No agency. These Terms do not create an agency, employment, franchise, partnership, fiduciary, or joint-venture relationship.',
      },
      {
        type: 'paragraph',
        text: 'Force majeure. LocalNotes is not liable for delay or failure caused by events beyond reasonable control, including natural disasters, war, terrorism, labor disputes, epidemics, government action, utility failures, internet failures, cyberattacks, or third-party service failures.',
      },
      {
        type: 'paragraph',
        text: 'Interpretation. Headings are for convenience. "Including" means "including without limitation." The singular includes the plural where appropriate.',
      },
      {
        type: 'paragraph',
        text: 'Notices. We may send notices in-app or to your account email. You are responsible for maintaining a current email address.',
      },
      {
        type: 'paragraph',
        text: 'Language. The English version controls to the extent permitted by law.',
      },
    ],
  },
  {
    title: '28. Contact',
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
        text: 'Phone: +1-602-652-4777',
      },
      {
        type: 'paragraph',
        text: 'Email: localnotesapp@gmail.com',
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

function Paragraph({
  children,
  emphasized = false,
}: {
  children: string;
  emphasized?: boolean;
}) {
  return (
    <Text
      className={`mb-2 ${emphasized ? 'font-geist-bold text-[13px] leading-6 text-ink dark:text-gray-100' : 'text-[13.5px] leading-6 text-gray-600 dark:text-gray-400'}`}
    >
      {children}
    </Text>
  );
}

function ListBlock({
  items,
  ordered = false,
}: {
  items: string[];
  ordered?: boolean;
}) {
  return (
    <View className="my-2 gap-1.5">
      {items.map((item, index) => (
        <View key={`${index}-${item}`} className="flex-row pr-1">
          <Text className="text-[13px] leading-6 text-ink dark:text-gray-200 mr-1.5">
            {ordered ? `${index + 1}.` : '•'}
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
    return <ListBlock key={index} items={block.items} />;
  }

  if (block.type === 'numbered') {
    return <ListBlock key={index} items={block.items} ordered />;
  }

  if (block.type === 'notice' || block.type === 'paragraph') {
    return (
      <Paragraph key={index} emphasized={block.type === 'notice'}>
        {block.text}
      </Paragraph>
    );
  }

  return null;
}

export function Terms() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
      <PageHeader title="Terms" />

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
          LocalNotes Terms of Service
        </Text>

        <View className="bg-brand-tint dark:bg-brand-tint/10 border border-brand/30 rounded-xl px-4 py-3.5 mb-5">
          <Paragraph emphasized>
            BY SELECTING A BUTTON OR CHECKBOX INDICATING ACCEPTANCE, CREATING AN ACCOUNT, DOWNLOADING THE APP, OR USING THE SERVICE, YOU AGREE TO THESE TERMS, THE PRIVACY POLICY, AND THE COMMUNITY GUIDELINES. IF YOU DO NOT AGREE, DO NOT USE THE SERVICE.
          </Paragraph>
          <Paragraph emphasized>
            IMPORTANT ARBITRATION NOTICE: SECTION 23 REQUIRES MOST U.S. DISPUTES TO BE RESOLVED THROUGH BINDING INDIVIDUAL ARBITRATION, NOT IN COURT, AND INCLUDES A CLASS-ACTION AND JURY-TRIAL WAIVER. YOU MAY OPT OUT WITHIN 30 DAYS AS DESCRIBED IN SECTION 23.6.
          </Paragraph>
        </View>

        <Paragraph>
          These Terms of Service ("Terms") are a legally binding agreement between you and LocalNotes Corp ("LocalNotes," "we," "us," or "our") governing your access to and use of the LocalNotes mobile application, websites, and related services, features, products, and content (collectively, the "Service").
        </Paragraph>

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

        {TERMS_SECTIONS.map((section) => (
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
            onPress={() => router.push('/community-guidelines' as Href)}
          >
            Community Guidelines
          </Text>
        </View>
      </AppScrollView>
    </View>
  );
}
