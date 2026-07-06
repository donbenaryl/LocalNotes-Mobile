export interface QuizQuestion {
  id: string;
  leftLabel: string;
  rightLabel: string;
  page: number;
}

export interface QuizAnswer {
  questionId: string;
  value: number; // 0–100 slider position
}

export interface PersonalityResult {
  archetype: string;
  title: string;
  description: string;
  traits: string[];
  score: Record<string, number>;
}
