import { useState } from 'react';
import { ScrollView } from 'react-native';
import { KeyboardAwareScrollView } from '@/components/ui/KeyboardAwareScrollView';
import { useUserCoordinates } from '@/hooks/useUserCoordinates';
import { useCreateSmartPick } from '@/hooks/useCreateSmartPick';
import type { ConversationRequest } from '@/http/smart-pick-api/types';
import { SmartPickForm } from './Form/SmartPickForm';
import { SmartPickResults } from './Result/SmartPickResults';
import type { searchUserDAO } from '@/http/account-api/types';
import { EMPTY_SMART_PICK_FORM, type SmartPickFormState } from './types';

export function SmartPickTab() {
  const [step, setStep] = useState<'form' | 'result'>('form');
  const [formState, setFormState] = useState<SmartPickFormState>(EMPTY_SMART_PICK_FORM);
  const { coordinates } = useUserCoordinates();
  const { createSmartPick, conversation, isCreating, error, reset } = useCreateSmartPick();

  const handleChange = (patch: Partial<SmartPickFormState>) => {
    setFormState((current) => ({ ...current, ...patch }));
  };

  const handleAddLinkedUser = (user: searchUserDAO) => {
    setFormState((current) => ({ ...current, linkedUsers: [...current.linkedUsers, user] }));
  };

  const handleRemoveLinkedUser = (userId: string) => {
    setFormState((current) => ({
      ...current,
      linkedUsers: current.linkedUsers.filter((user) => user.id !== userId),
    }));
  };

  const submit = async (linkedUserIds: string[]) => {
    const hasSelection =
      formState.mode === 'Personality' ? formState.engine : formState.vibe;
    if (!formState.occasion || !formState.timeOfDay || !hasSelection) return;

    const dto: ConversationRequest = {
      occassion: formState.occasion,
      time_of_day: formState.timeOfDay,
      orientation: formState.mode.toUpperCase() as ConversationRequest['orientation'],
      personality: formState.mode === 'Personality' ? formState.engine : null,
      vibe: formState.mode === 'Vibe' ? formState.vibe : null,
      linked_users: linkedUserIds,
      is_free_text: false,
      ...(coordinates ? { lat: coordinates.latitude, lng: coordinates.longitude } : {}),
    };

    try {
      await createSmartPick(dto);
      setStep('result');
    } catch {
      // Error is already surfaced via the `error` state below.
    }
  };

  const handleSubmit = () => {
    void submit(formState.linkedUsers.map((user) => user.id));
  };

  const handleSkip = () => {
    void submit([]);
  };

  const handleBackToForm = () => {
    reset();
    setStep('form');
  };

  if (step === 'result' && conversation) {
    return (
      <ScrollView contentContainerClassName="pb-28" showsVerticalScrollIndicator={false}>
        <SmartPickResults conversation={conversation} onBack={handleBackToForm} />
      </ScrollView>
    );
  }

  return (
    <KeyboardAwareScrollView
      className="flex-1"
      contentContainerClassName="pb-28"
      scrollToFocusedInput
      showsVerticalScrollIndicator={false}
    >
      <SmartPickForm
        formState={formState}
        onChange={handleChange}
        onAddLinkedUser={handleAddLinkedUser}
        onRemoveLinkedUser={handleRemoveLinkedUser}
        onSubmit={handleSubmit}
        onSkip={handleSkip}
        isSubmitting={isCreating}
        errorMessage={error}
      />
    </KeyboardAwareScrollView>
  );
}

