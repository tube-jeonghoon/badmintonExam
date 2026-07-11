export type TagId = 'rules' | 'refereeing' | 'faults' | 'equipment' | 'tournament';

export type ChoiceIndex = 0 | 1 | 2 | 3;

export type Difficulty = 'basic' | 'hard';

interface BaseQuestion {
  id: string;
  tag: TagId;
  prompt: string;
  explanation: string;
  difficulty?: Difficulty; // 없으면 basic
}

export interface ChoiceQuestion extends BaseQuestion {
  type: 'choice';
  choices: [string, string, string, string];
  answerIndex: ChoiceIndex;
}

export interface OXQuestion extends BaseQuestion {
  type: 'ox';
  answer: boolean;
}

export interface FillBlankQuestion extends BaseQuestion {
  type: 'fill';
  answer: string;
  unit?: string;
}

export type Question = ChoiceQuestion | OXQuestion | FillBlankQuestion;

export type UserAnswer =
  | { type: 'choice'; index: ChoiceIndex }
  | { type: 'ox'; value: boolean }
  | { type: 'fill'; text: string };
