export interface PersonalityQuestion {
  id: number;
  question: string;
  leftLabel: string;
  rightLabel: string;
  leftColor: string;
  rightColor: string;
}

export interface QuestionGroup {
  sectionKey: string;
  range: string;
  items: PersonalityQuestion[];
}
