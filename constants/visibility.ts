import type { ShareOption } from '@/types/listForm';

export const VISIBILITY_OPTIONS: {
  value: ShareOption;
  labelKey: string;
  descriptionKey: string;
  emoji: string;
}[] = [
  {
    value: 'Public',
    labelKey: 'listForm.visibility.public.label',
    descriptionKey: 'listForm.visibility.public.description',
    emoji: '🌐',
  },
  {
    value: 'Friends',
    labelKey: 'listForm.visibility.friends.label',
    descriptionKey: 'listForm.visibility.friends.description',
    emoji: '👥',
  },
  {
    value: 'Private',
    labelKey: 'listForm.visibility.private.label',
    descriptionKey: 'listForm.visibility.private.description',
    emoji: '🔒',
  },
  {
    value: 'Specific People',
    labelKey: 'listForm.visibility.specific.label',
    descriptionKey: 'listForm.visibility.specific.description',
    emoji: '✉️',
  },
];
