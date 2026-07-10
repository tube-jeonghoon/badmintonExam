export type TagId = 'rules' | 'refereeing' | 'faults' | 'equipment' | 'tournament';

export type ChoiceIndex = 0 | 1 | 2 | 3;

interface BaseQuestion {
  id: string;
  tag: TagId;
  prompt: string;
  explanation: string;
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
